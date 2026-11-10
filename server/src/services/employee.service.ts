import prisma from '../prisma';
import { hashPassword } from '../utils/password';
import crypto from 'crypto';
import { AdminScope } from '../middleware/auth.middleware';

export const employeeService = {
  /**
   * Generates a random temporary password for a new employee.
   */
  generateTempPassword(): string {
    return crypto.randomBytes(6).toString('hex'); // 12 character hex string
  },

  async createEmployee(
    adminId: string,
    companyId: string,
    employeeCode: string | undefined,
    name: string,
    email: string,
    phone?: string,
    department?: string,
    password?: string
  ) {
    let resolvedCode = (employeeCode || '').trim().toUpperCase();
    if (!resolvedCode) {
      const company = await prisma.companies.findUnique({ where: { id: companyId } });
      const prefix = (company?.company_code || 'EMP').replace(/[^A-Z0-9]/gi, '').slice(0, 6).toUpperCase() || 'EMP';
      for (let attempt = 0; attempt < 15; attempt++) {
        const candidate = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
        const exists = await prisma.employees.findUnique({ where: { employee_code: candidate } });
        if (!exists) {
          resolvedCode = candidate;
          break;
        }
      }
      if (!resolvedCode) {
        resolvedCode = `EMP-${Date.now().toString().slice(-6)}`;
      }
    }

    // Check if the employee_code or email already exists
    const existingEmployee = await prisma.employees.findFirst({
      where: {
        OR: [
          { employee_code: resolvedCode },
          { email: email.trim().toLowerCase() }
        ]
      }
    });

    if (existingEmployee) {
      throw new Error('Employee with this code or email already exists');
    }

    const tempPassword = password && password.trim().length >= 6 ? password.trim() : this.generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    const employee = await prisma.employees.create({
      data: {
        company_id: companyId,
        employee_code: resolvedCode,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : undefined,
        department: department ? department.trim() : 'General',
        password_hash: passwordHash,
        is_first_login: !password
      }
    });

    // Automatically assign any active/open survey cycles for this company
    try {
      const openCycles = await prisma.survey_cycles.findMany({
        where: { company_id: companyId, status: 'open' },
        select: { id: true }
      });
      if (openCycles.length > 0) {
        await prisma.survey_assignments.createMany({
          data: openCycles.map((c) => ({
            survey_cycle_id: c.id,
            employee_id: employee.id,
            status: 'assigned'
          }))
        });
      }
    } catch {
      // Non-fatal if assignment fails
    }

    const { password_hash: _ph, ...safeEmployee } = employee;
    return {
      employee: safeEmployee,
      tempPassword
    };
  },

  async getEmployeesByAdmin(adminScope: AdminScope, companyId?: string) {
    let targetCompanyId: string | undefined = undefined;

    if (adminScope.isSuperAdmin) {
      if (companyId && /^[0-9a-fA-F]{24}$/.test(companyId)) {
        targetCompanyId = companyId;
      }
    } else {
      if (companyId && companyId !== adminScope.assignedCompanyId) {
        const err: any = new Error('Forbidden: Access to this organization is denied');
        err.statusCode = 403;
        throw err;
      }
      targetCompanyId = adminScope.assignedCompanyId || undefined;
    }

    const whereClause: any = {};
    if (targetCompanyId) {
      whereClause.company_id = targetCompanyId;
    }

    const employees = await prisma.employees.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        employee_code: true,
        name: true,
        email: true,
        phone: true,
        department: true,
        is_first_login: true,
        company_id: true,
        created_at: true,
        company: {
          select: { name: true }
        },
        survey_assignments: {
          orderBy: { assigned_at: 'asc' },
          include: {
            responses: {
              include: {
                response_answers: {
                  select: { id: true, question_id: true, answer_value: true }
                }
              }
            },
            survey_cycle: {
              include: {
                survey: {
                  include: {
                    survey_questions: {
                      select: { id: true, display_order: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    return employees.map((e: any) => {
      const assignments = e.survey_assignments || [];
      const total_surveys = assignments.length;
      let completed_surveys = 0;
      let in_progress_surveys = 0;
      let not_started_surveys = 0;

      const survey_breakdown = assignments.map((a: any) => {
        const totalQ = a.survey_cycle?.survey?.survey_questions?.length || 0;
        const answers = a.responses?.response_answers || [];
        const answeredCount = a.status === 'completed'
          ? totalQ
          : answers.filter((ans: any) => ans.answer_value && ans.answer_value.trim() !== '').length;

        if (a.status === 'completed') {
          completed_surveys++;
        } else if (a.status === 'in_progress' || answeredCount > 0) {
          in_progress_surveys++;
        } else {
          not_started_surveys++;
        }

        const statusLabel = a.status === 'completed'
          ? 'COMPLETED'
          : (a.status === 'in_progress' || answeredCount > 0)
            ? 'IN PROGRESS'
            : 'NOT STARTED';

        return {
          assignment_id: a.id,
          survey_id: a.survey_cycle?.survey?.id,
          title: a.survey_cycle?.survey?.title || 'Survey',
          category: a.survey_cycle?.survey?.title || 'Survey',
          status: statusLabel,
          raw_status: a.status,
          answered_count: answeredCount,
          total_questions: totalQ,
          questions_count: totalQ,
          completed_at: a.completed_at || null,
        };
      });

      // Requirement 13: Overall Status Logic
      let overall_status = 'NOT STARTED';
      if (total_surveys > 0 && completed_surveys === total_surveys) {
        overall_status = 'COMPLETED';
      } else if (completed_surveys > 0 || in_progress_surveys > 0) {
        overall_status = 'PENDING';
      } else {
        overall_status = 'NOT STARTED';
      }

      const isOrgAdmin = !adminScope.isSuperAdmin;
      const displayId = e.employee_code || e.id;

      return {
        id: e.id,
        employee_code: e.employee_code,
        name: isOrgAdmin ? displayId : e.name,
        email: isOrgAdmin ? '[Protected]' : e.email,
        phone: isOrgAdmin ? null : e.phone,
        department: e.department || 'General',
        designation: (e as any).designation || 'Staff',
        company_id: e.company_id,
        company_name: e.company?.name || 'Company',
        created_at: e.created_at,
        total_surveys,
        completed_surveys,
        in_progress_surveys,
        not_started_surveys,
        overall_status, // 'NOT STARTED' | 'PENDING' | 'COMPLETED'
        survey_breakdown, // array of per-survey category breakdown
      };
    });
  },

  async getEmployeeSurveyStatus(employeeId: string, adminScope: AdminScope) {
    const employee = await prisma.employees.findUnique({
      where: { id: employeeId },
      include: {
        company: { select: { name: true } },
        survey_assignments: {
          orderBy: { assigned_at: 'asc' },
          include: {
            responses: {
              include: {
                response_answers: {
                  select: { id: true, question_id: true, answer_value: true }
                }
              }
            },
            survey_cycle: {
              include: {
                survey: {
                  include: {
                    survey_questions: {
                      select: { id: true, display_order: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!employee) {
      return null;
    }

    if (!adminScope.isSuperAdmin && employee.company_id !== adminScope.assignedCompanyId) {
      return null;
    }

    const assignments = employee.survey_assignments || [];
    const total_surveys = assignments.length;
    let completed_surveys = 0;
    let in_progress_surveys = 0;
    let not_started_surveys = 0;

    const survey_breakdown = assignments.map((a: any) => {
      const totalQ = a.survey_cycle?.survey?.survey_questions?.length || 0;
      const answers = a.responses?.response_answers || [];
      const answeredCount = a.status === 'completed'
        ? totalQ
        : answers.filter((ans: any) => ans.answer_value && ans.answer_value.trim() !== '').length;

      if (a.status === 'completed') {
        completed_surveys++;
      } else if (a.status === 'in_progress' || answeredCount > 0) {
        in_progress_surveys++;
      } else {
        not_started_surveys++;
      }

      const statusLabel = a.status === 'completed'
        ? 'COMPLETED'
        : (a.status === 'in_progress' || answeredCount > 0)
          ? 'IN PROGRESS'
          : 'NOT STARTED';

      return {
        assignment_id: a.id,
        survey_id: a.survey_cycle?.survey?.id,
        title: a.survey_cycle?.survey?.title || 'Survey',
        category: a.survey_cycle?.survey?.title || 'Survey',
        status: statusLabel,
        raw_status: a.status,
        answered_count: answeredCount,
        total_questions: totalQ,
        questions_count: totalQ,
        completed_at: a.completed_at || null,
      };
    });

    let overall_status = 'NOT STARTED';
    if (total_surveys > 0 && completed_surveys === total_surveys) {
      overall_status = 'COMPLETED';
    } else if (completed_surveys > 0 || in_progress_surveys > 0) {
      overall_status = 'PENDING';
    } else {
      overall_status = 'NOT STARTED';
    }

    const isOrgAdmin = !adminScope.isSuperAdmin;
    const displayId = employee.employee_code || employee.id;

    return {
      id: employee.id,
      employee_code: employee.employee_code,
      name: isOrgAdmin ? displayId : employee.name,
      email: isOrgAdmin ? '[Protected]' : employee.email,
      department: employee.department || 'General',
      designation: (employee as any).designation || 'Staff',
      company_name: employee.company.name,
      total_surveys,
      completed_surveys,
      in_progress_surveys,
      not_started_surveys,
      overall_status,
      survey_breakdown,
    };
  },

  async getEmployeeById(id: string, adminScope?: AdminScope) {
    const cleanId = (id || '').trim();
    if (!cleanId) return null;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(cleanId);

    const employee = await prisma.employees.findFirst({
      where: isObjectId
        ? { OR: [{ id: cleanId }, { employee_code: cleanId }] }
        : { employee_code: cleanId },
      include: {
        company: {
          select: { name: true }
        }
      }
    });

    if (!employee) {
      return null;
    }

    if (adminScope && !adminScope.isSuperAdmin && employee.company_id !== adminScope.assignedCompanyId) {
      return null;
    }

    // Exclude password hash from response
    const { password_hash, ...safeEmployee } = employee;
    const isOrgAdmin = adminScope && !adminScope.isSuperAdmin;
    const displayId = employee.employee_code || employee.id;

    return {
      ...safeEmployee,
      name: isOrgAdmin ? displayId : employee.name,
      email: isOrgAdmin ? '[Protected]' : employee.email,
      phone: isOrgAdmin ? null : (employee as any).phone,
    };
  },

  async updateEmployee(
    id: string,
    adminScope: AdminScope,
    updates: {
      name?: string;
      email?: string;
      phone?: string;
      department?: string;
      company_id?: string;
      employee_code?: string;
    }
  ) {
    const employee = await this.getEmployeeById(id, adminScope);
    if (!employee) {
      const forbiddenErr: any = new Error('Employee not found or unauthorized');
      forbiddenErr.statusCode = 403;
      throw forbiddenErr;
    }

    const updateData: any = {};
    if (updates.name) updateData.name = updates.name.trim();
    if (updates.email) updateData.email = updates.email.trim().toLowerCase();
    if (updates.phone !== undefined) updateData.phone = updates.phone ? updates.phone.trim() : null;
    if (updates.department !== undefined) updateData.department = updates.department.trim() || 'General';
    if (updates.employee_code) updateData.employee_code = updates.employee_code.trim().toUpperCase();
    if (updates.company_id && /^[0-9a-fA-F]{24}$/.test(updates.company_id)) {
      if (!adminScope.isSuperAdmin && updates.company_id !== adminScope.assignedCompanyId) {
        const forbiddenErr: any = new Error('Forbidden: Cannot reassign employee to another organization');
        forbiddenErr.statusCode = 403;
        throw forbiddenErr;
      }
      updateData.company_id = updates.company_id;
    }

    const updated = await prisma.employees.update({
      where: { id: employee.id },
      data: updateData
    });

    const { password_hash, ...safeEmployee } = updated;
    return safeEmployee;
  },

  async deleteEmployee(id: string, adminScope?: AdminScope) {
    const cleanId = (id || '').trim();
    if (!cleanId) {
      const badReq: any = new Error('Employee ID is required');
      badReq.statusCode = 400;
      throw badReq;
    }
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(cleanId);

    const employee = await prisma.employees.findFirst({
      where: isObjectId
        ? { OR: [{ id: cleanId }, { employee_code: cleanId }] }
        : { employee_code: cleanId },
      include: {
        company: {
          select: { name: true }
        }
      }
    });

    if (!employee) {
      const notFoundErr: any = new Error('Employee not found');
      notFoundErr.statusCode = 404;
      throw notFoundErr;
    }

    if (adminScope && !adminScope.isSuperAdmin && employee.company_id !== adminScope.assignedCompanyId) {
      const forbiddenErr: any = new Error('Forbidden: Unauthorized to delete employee from another organization');
      forbiddenErr.statusCode = 403;
      throw forbiddenErr;
    }

    const targetEmployeeId = employee.id;

    return prisma.$transaction(async (tx) => {
      // 1. Find all responses for this employee
      const responses = await tx.responses.findMany({
        where: { employee_id: targetEmployeeId },
        select: { id: true }
      });
      const responseIds = responses.map((r) => r.id);

      // 2. Delete all response_answers for those responses
      if (responseIds.length > 0) {
        await tx.response_answers.deleteMany({
          where: { response_id: { in: responseIds } }
        });
      }

      // 3. Delete responses
      await tx.responses.deleteMany({ where: { employee_id: targetEmployeeId } });

      // 4. Delete survey_assignments
      await tx.survey_assignments.deleteMany({ where: { employee_id: targetEmployeeId } });

      // 5. Delete employee record
      return tx.employees.delete({
        where: { id: targetEmployeeId }
      });
    });
  },

  async bulkDeleteEmployees(ids: string[], adminScope?: AdminScope) {
    if (!Array.isArray(ids) || ids.length === 0) {
      return { count: 0 };
    }

    const cleanIds = ids.map((i) => String(i || '').trim()).filter(Boolean);
    const objectIds = cleanIds.filter((i) => /^[0-9a-fA-F]{24}$/.test(i));

    const matchOr: any[] = [{ employee_code: { in: cleanIds } }];
    if (objectIds.length > 0) {
      matchOr.push({ id: { in: objectIds } });
    }

    const whereClause: any = { OR: matchOr };
    if (adminScope && !adminScope.isSuperAdmin) {
      whereClause.company_id = adminScope.assignedCompanyId;
    }

    const allowedEmployees = await prisma.employees.findMany({
      where: whereClause,
      select: { id: true }
    });
    const validIds = allowedEmployees.map((e) => e.id);

    if (validIds.length === 0) {
      return { count: 0 };
    }

    return prisma.$transaction(async (tx) => {
      // 1. Find all responses for these employees
      const responses = await tx.responses.findMany({
        where: { employee_id: { in: validIds } },
        select: { id: true }
      });
      const responseIds = responses.map((r) => r.id);

      // 2. Delete all response_answers for those responses
      if (responseIds.length > 0) {
        await tx.response_answers.deleteMany({
          where: { response_id: { in: responseIds } }
        });
      }

      // 3. Delete responses
      await tx.responses.deleteMany({
        where: { employee_id: { in: validIds } }
      });

      // 4. Delete survey_assignments
      await tx.survey_assignments.deleteMany({
        where: { employee_id: { in: validIds } }
      });

      // 5. Delete employees in bulk
      const result = await tx.employees.deleteMany({
        where: { id: { in: validIds } }
      });

      return { count: result.count };
    });
  }

};
