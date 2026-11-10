import prisma from "../prisma";
import { AdminScope } from "../middleware/auth.middleware";

export const assignmentService = {
  /**
   * Automatically assign a survey cycle to all employees in the given company.
   */
  async assignCycleToAllEmployees(adminScope: AdminScope, companyId: string, cycleId: string) {
    if (!adminScope.isSuperAdmin && adminScope.assignedCompanyId !== companyId) {
      const forbiddenErr: any = new Error('Forbidden: Access to this organization is denied');
      forbiddenErr.statusCode = 403;
      throw forbiddenErr;
    }

    // 1. Verify the cycle belongs to the company
    const cycle = await prisma.survey_cycles.findUnique({
      where: { id: cycleId },
      include: {
        company: { select: { id: true } }
      }
    });

    if (!cycle || cycle.company_id !== companyId) {
      const notFoundErr: any = new Error("Survey cycle not found or does not belong to this organization");
      notFoundErr.statusCode = 404;
      throw notFoundErr;
    }

    // 2. Fetch all employees for the company
    const employees = await prisma.employees.findMany({
      where: { company_id: companyId },
      select: { id: true }
    });

    if (employees.length === 0) {
      return { count: 0, message: "No employees found in this company to assign." };
    }

    // 3. Prepare bulk insert data, avoiding duplicates
    const existingAssignments = await prisma.survey_assignments.findMany({
      where: { survey_cycle_id: cycleId },
      select: { employee_id: true }
    });
    const existingIds = new Set(existingAssignments.map(a => a.employee_id));

    const newAssignments = employees
      .filter(emp => !existingIds.has(emp.id))
      .map(emp => ({
        survey_cycle_id: cycleId,
        employee_id: emp.id,
        status: "assigned" as const
      }));

    if (newAssignments.length === 0) {
      return { count: 0, message: "All employees are already assigned to this cycle." };
    }

    // 4. Bulk insert
    const result = await prisma.survey_assignments.createMany({
      data: newAssignments
    });

    return {
      count: result.count,
      message: `Successfully assigned to ${result.count} employees.`
    };
  },

  /**
   * Get all assignments for an employee to display in their portal.
   * Auto-assigns any open survey cycles for this employee's company that haven't been assigned yet,
   * ensuring all employees see all uploaded survey categories regardless of their department.
   * Returns data shaped to match the frontend expectations.
   */
  async getEmployeeAssignments(employeeId: string) {
    // 1. Auto-assign any open survey cycles for the employee's company
    const employee = await prisma.employees.findUnique({
      where: { id: employeeId },
      select: { id: true, company_id: true, company: { select: { status: true } } }
    });

    if (employee?.company?.status === 'Inactive') {
      return [];
    }

    const now = new Date();
    if (employee && employee.company_id) {
      const openCycles = await prisma.survey_cycles.findMany({
        where: {
          company_id: employee.company_id,
          status: "open",
          period_start: { lte: now },
          period_end: { gte: now },
          survey: {
            is_enabled: true
          }
        },
        select: { id: true }
      });

      if (openCycles.length > 0) {
        const existingAssignments = await prisma.survey_assignments.findMany({
          where: { employee_id: employeeId },
          select: { survey_cycle_id: true }
        });
        const assignedCycleIds = new Set(existingAssignments.map(a => a.survey_cycle_id));
        const missingCycles = openCycles.filter(oc => !assignedCycleIds.has(oc.id));

        if (missingCycles.length > 0) {
          await prisma.survey_assignments.createMany({
            data: missingCycles.map(mc => ({
              survey_cycle_id: mc.id,
              employee_id: employeeId,
              status: "assigned" as const
            }))
          });
        }
      }
    }

    if (!employee || !employee.company_id) {
      return [];
    }

    const assignments = await prisma.survey_assignments.findMany({
      where: {
        employee_id: employeeId,
        survey_cycle: {
          company_id: employee.company_id,
          status: "open",
          period_start: { lte: now },
          period_end: { gte: now },
          survey: {
            is_enabled: true
          }
        }
      },
      orderBy: { assigned_at: "asc" },
      include: {
        responses: {
          include: { response_answers: true },
        },
        survey_cycle: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                logo_url: true,
                default_language: true,
                supported_languages: true
              }
            },
            survey: {
              include: {
                survey_questions: {
                  orderBy: { display_order: "asc" },
                  include: {
                    question: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Strictly filter only assignments where survey_cycle and its survey exist and are enabled
    const validAssignments = assignments.filter(a => 
      a.survey_cycle && 
      a.survey_cycle.survey && 
      a.survey_cycle.survey.is_enabled !== false &&
      a.survey_cycle.status === 'open' &&
      a.survey_cycle.company_id === employee.company_id
    );

    // Transform data to a clean, flat shape the frontend can consume
    return validAssignments.map(a => {
      const totalQuestions = a.survey_cycle.survey.survey_questions.length;
      const savedAnswers = a.responses?.response_answers.map(ra => ({
        question_id: ra.question_id,
        answer_value: ra.answer_value,
      })) || [];
      const answeredCount = a.status === 'completed'
        ? totalQuestions
        : savedAnswers.filter(sa => sa.answer_value && sa.answer_value.trim() !== '').length;

      return {
        id: a.id,
        category: a.survey_cycle.survey.title,
        status: a.status,
        assigned_at: a.assigned_at,
        completed_at: a.completed_at,
        questions_count: totalQuestions,
        answered_count: answeredCount,
        saved_answers: savedAnswers,
        last_saved_at: a.responses?.submitted_at || null,
        company: a.survey_cycle.company ? {
          id: a.survey_cycle.company.id,
          name: a.survey_cycle.company.name,
          logo_url: a.survey_cycle.company.logo_url,
          default_language: a.survey_cycle.company.default_language || 'en',
          supported_languages: (a.survey_cycle.company.supported_languages && a.survey_cycle.company.supported_languages.length > 0)
            ? a.survey_cycle.company.supported_languages
            : ['en']
        } : null,
        survey_cycle: {
          id: a.survey_cycle.id,
          period_start: a.survey_cycle.period_start,
          period_end: a.survey_cycle.period_end,
          status: a.survey_cycle.status,
          survey: {
            id: a.survey_cycle.survey.id,
            title: a.survey_cycle.survey.title,
            // Flatten questions into a clean array
            questions: a.survey_cycle.survey.survey_questions.map(sq => ({
              id: sq.question.id,
              question_text: sq.question.question_text,
              question_type: sq.question.question_type,
              options_json: sq.question.options_json,
              translations_json: sq.question.translations_json || {},
              display_order: sq.display_order
            }))
          }
        }
      };
    });
  },

  /**
   * Transition an assignment from 'assigned' to 'in_progress' when the employee begins the survey.
   * Enforces that the assignment belongs strictly to the authenticated employee.
   */
  async startAssignment(employeeId: string, assignmentId: string) {
    const assignment = await prisma.survey_assignments.findUnique({
      where: { id: assignmentId },
      include: {
        survey_cycle: {
          include: {
            survey: true,
            company: { select: { id: true, name: true, logo_url: true } },
          },
        },
      },
    });

    if (!assignment) {
      const error: any = new Error('Assignment not found');
      error.statusCode = 404;
      throw error;
    }

    if (assignment.employee_id !== employeeId) {
      const error: any = new Error('Unauthorized access to survey assignment');
      error.statusCode = 403;
      throw error;
    }

    const employee = await prisma.employees.findUnique({
      where: { id: employeeId },
      select: { company_id: true, company: { select: { status: true } } }
    });

    if (employee?.company?.status === 'Inactive') {
      const error: any = new Error('Your organization account is currently inactive');
      error.statusCode = 403;
      throw error;
    }

    if (!employee || assignment.survey_cycle.company_id !== employee.company_id) {
      const error: any = new Error('Unauthorized: survey belongs to another organization');
      error.statusCode = 403;
      throw error;
    }

    if (assignment.status === 'completed') {
      const error: any = new Error('This survey has already been completed');
      error.statusCode = 400;
      throw error;
    }

    if (assignment.survey_cycle.status !== 'open') {
      const error: any = new Error('This survey cycle is no longer open');
      error.statusCode = 400;
      throw error;
    }

    const now = new Date();
    if (assignment.survey_cycle.period_start > now || assignment.survey_cycle.period_end < now) {
      const error: any = new Error('This survey is outside its active access period');
      error.statusCode = 400;
      throw error;
    }

    let updated = assignment;
    if (assignment.status === 'assigned') {
      updated = await prisma.survey_assignments.update({
        where: { id: assignmentId },
        data: { status: 'in_progress' },
        include: {
          survey_cycle: {
            include: {
              survey: true,
              company: { select: { id: true, name: true } },
            },
          },
        },
      });
    }

    return {
      assignment_id: updated.id,
      status: updated.status,
      survey_id: updated.survey_cycle.survey.id,
      survey_title: updated.survey_cycle.survey.title,
      company_name: updated.survey_cycle.company.name,
      session_started_at: new Date().toISOString(),
    };
  }
};
