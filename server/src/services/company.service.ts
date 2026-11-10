import prisma from '../prisma';
import { storageService } from './storage.service';

export interface CompanyDataInput {
  name: string;
  company_code?: string;
  official_email?: string;
  contact_number?: string;
  address?: string;
  industry?: string;
  website?: string;
  status?: string;
  branches?: any[];
}

export interface CompanyUpdateInput {
  name?: string;
  company_code?: string;
  official_email?: string;
  contact_number?: string;
  address?: string;
  industry?: string;
  website?: string;
  status?: string;
  branches?: any[];
}

export const companyService = {
  async createCompany(adminId: string, data: CompanyDataInput, logoUrl?: string) {
    let code = data.company_code ? data.company_code.trim().toUpperCase() : '';
    if (!code) {
      const cleanName = (data.name || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) || 'CMP';
      let seq = 1;
      code = `${cleanName}_${String(seq).padStart(3, '0')}`;
      while (await prisma.companies.findFirst({ where: { company_code: { equals: code, mode: 'insensitive' } } })) {
        seq++;
        code = `${cleanName}_${String(seq).padStart(3, '0')}`;
      }
    } else {
      // Enforce unique company code case-insensitively
      const existingCode = await prisma.companies.findFirst({
        where: { company_code: { equals: code, mode: 'insensitive' } }
      });
      if (existingCode) {
        throw new Error(`Company code "${code}" is already in use. Please specify a unique code.`);
      }
    }

    const branches = data.branches || [];

    return prisma.companies.create({
      data: {
        name: data.name.trim(),
        company_code: code,
        logo_url: logoUrl || null,
        official_email: data.official_email || null,
        contact_number: data.contact_number || null,
        address: data.address || null,
        industry: data.industry || null,
        website: data.website || null,
        status: data.status || 'Active',
        created_by_admin_id: adminId,
        branches: {
          create: branches.map(b => ({
            address_line: b.address_line,
            city: b.city,
            state: b.state,
            country: b.country,
            pincode: b.pincode
          }))
        }
      },
      include: {
        branches: true
      }
    });
  },

  async getAllCompaniesWithAdmins() {
    return prisma.companies.findMany({
      include: {
        branches: true,
        assigned_admins: {
          select: {
            id: true,
            admin_code: true,
            name: true,
            email: true,
            role: true,
            is_activated: true,
            created_at: true,
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  },

  async getCompaniesByAdmin(adminId: string) {
    return prisma.companies.findMany({
      include: { branches: true },
      orderBy: { created_at: 'desc' }
    });
  },

  async getCompanies() {
    return prisma.companies.findMany({
      include: { branches: true },
      orderBy: { created_at: 'desc' }
    });
  },

  async getCompanyById(id: string) {
    return prisma.companies.findUnique({
      where: { id },
      include: {
        branches: true,
        assigned_admins: {
          select: {
            id: true,
            admin_code: true,
            name: true,
            email: true,
            role: true,
            is_activated: true,
            created_at: true,
          }
        }
      }
    });
  },

  async updateCompany(
    id: string,
    data: CompanyUpdateInput,
    newLogoUrl?: string,
    removeLogo?: boolean
  ) {
    const existing = await prisma.companies.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Company not found');
    }

    // Check unique company_code if being updated
    if (data.company_code) {
      const code = data.company_code.trim().toUpperCase();
      const duplicate = await prisma.companies.findFirst({
        where: {
          id: { not: id },
          company_code: { equals: code, mode: 'insensitive' }
        }
      });
      if (duplicate) {
        throw new Error(`Company code "${code}" is already in use by another company.`);
      }
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.company_code !== undefined) updateData.company_code = data.company_code.trim().toUpperCase();
    if (data.official_email !== undefined) updateData.official_email = data.official_email;
    if (data.contact_number !== undefined) updateData.contact_number = data.contact_number;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.industry !== undefined) updateData.industry = data.industry;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.status !== undefined) updateData.status = data.status;

    // Handle logo replacement or removal
    if (newLogoUrl) {
      if (existing.logo_url) {
        await storageService.deleteLogo(existing.logo_url);
      }
      updateData.logo_url = newLogoUrl;
    } else if (removeLogo) {
      if (existing.logo_url) {
        await storageService.deleteLogo(existing.logo_url);
      }
      updateData.logo_url = null;
    }

    if (data.branches !== undefined) {
      await prisma.company_branches.deleteMany({ where: { company_id: id } });
      updateData.branches = {
        create: data.branches.map(b => ({
          address_line: b.address_line,
          city: b.city,
          state: b.state,
          country: b.country,
          pincode: b.pincode
        }))
      };
    }

    return prisma.companies.update({
      where: { id },
      data: updateData,
      include: {
        branches: true
      }
    });
  },

  async getCompanyDependencies(id: string) {
    const [
      employees,
      surveys,
      survey_cycles,
      questions,
      responses,
      reports
    ] = await Promise.all([
      prisma.employees.count({ where: { company_id: id } }),
      prisma.surveys.count({ where: { company_id: id } }),
      prisma.survey_cycles.count({ where: { company_id: id } }),
      prisma.questions.count({ where: { company_id: id } }),
      prisma.responses.count({ where: { company_id: id } }),
      prisma.reports.count({ where: { company_id: id } })
    ]);

    const total = employees + surveys + survey_cycles + questions + responses + reports;
    return {
      employees,
      surveys,
      survey_cycles,
      questions,
      responses,
      reports,
      total,
      hasDependencies: total > 0
    };
  },

  async deleteCompany(id: string, options?: { force?: boolean }) {
    const existing = await prisma.companies.findUnique({ where: { id } });
    if (!existing) {
      const notFoundErr: any = new Error('Company not found');
      notFoundErr.statusCode = 404;
      throw notFoundErr;
    }

    const dependencies = await this.getCompanyDependencies(id);

    // Safe default: block deletion with 409 Conflict if dependent records exist and force !== true
    if (dependencies.hasDependencies && !options?.force) {
      const summaryParts: string[] = [];
      if (dependencies.employees > 0) summaryParts.push(`${dependencies.employees} employee(s)`);
      if (dependencies.surveys > 0) summaryParts.push(`${dependencies.surveys} survey(s)`);
      if (dependencies.survey_cycles > 0) summaryParts.push(`${dependencies.survey_cycles} survey cycle(s)`);
      if (dependencies.questions > 0) summaryParts.push(`${dependencies.questions} question(s)`);
      if (dependencies.responses > 0) summaryParts.push(`${dependencies.responses} survey response(s)`);
      if (dependencies.reports > 0) summaryParts.push(`${dependencies.reports} report(s)`);

      const conflictErr: any = new Error(
        `Cannot delete company "${existing.name}" because it has linked records (${summaryParts.join(', ')}). Set status to Inactive to archive safely, or confirm permanent cascade deletion.`
      );
      conflictErr.statusCode = 409;
      conflictErr.code = 'COMPANY_HAS_DEPENDENCIES';
      conflictErr.dependencies = dependencies;
      throw conflictErr;
    }

    // Collect report PDF paths before transactional delete if force cascade is requested
    const reportsToDelete = options?.force
      ? await prisma.reports.findMany({ where: { company_id: id }, select: { pdf_url: true } })
      : [];

    // Execute all database deletions inside a single transaction before touching filesystem assets
    const deletedCompany = await prisma.$transaction(async (tx) => {
      if (options?.force && dependencies.hasDependencies) {
        const companyResponses = await tx.responses.findMany({
          where: { company_id: id },
          select: { id: true }
        });
        const responseIds = companyResponses.map((r) => r.id);

        const companyEmployees = await tx.employees.findMany({
          where: { company_id: id },
          select: { id: true }
        });
        const employeeIds = companyEmployees.map((e) => e.id);

        const companySurveys = await tx.surveys.findMany({
          where: { company_id: id },
          select: { id: true }
        });
        const surveyIds = companySurveys.map((s) => s.id);

        const companyCycles = await tx.survey_cycles.findMany({
          where: { company_id: id },
          select: { id: true }
        });
        const cycleIds = companyCycles.map((c) => c.id);

        const companyQuestions = await tx.questions.findMany({
          where: { company_id: id },
          select: { id: true }
        });
        const questionIds = companyQuestions.map((q) => q.id);

        // 1. Delete response_answers linked to company responses or questions
        if (responseIds.length > 0 || questionIds.length > 0) {
          const answerOr: any[] = [];
          if (responseIds.length > 0) answerOr.push({ response_id: { in: responseIds } });
          if (questionIds.length > 0) answerOr.push({ question_id: { in: questionIds } });
          await tx.response_answers.deleteMany({ where: { OR: answerOr } });
        }

        // 2. Delete responses
        await tx.responses.deleteMany({
          where: {
            OR: [
              { company_id: id },
              ...(employeeIds.length > 0 ? [{ employee_id: { in: employeeIds } }] : [])
            ]
          }
        });

        // 3. Delete survey_assignments
        if (employeeIds.length > 0 || cycleIds.length > 0) {
          const assignOr: any[] = [];
          if (employeeIds.length > 0) assignOr.push({ employee_id: { in: employeeIds } });
          if (cycleIds.length > 0) assignOr.push({ survey_cycle_id: { in: cycleIds } });
          await tx.survey_assignments.deleteMany({ where: { OR: assignOr } });
        }

        // 4. Delete survey_questions
        if (surveyIds.length > 0 || questionIds.length > 0) {
          const sqOr: any[] = [];
          if (surveyIds.length > 0) sqOr.push({ survey_id: { in: surveyIds } });
          if (questionIds.length > 0) sqOr.push({ question_id: { in: questionIds } });
          await tx.survey_questions.deleteMany({ where: { OR: sqOr } });
        }

        // 5. Delete suggestions, analysis_results, and reports
        if (cycleIds.length > 0) {
          const analysisRows = await tx.analysis_results.findMany({
            where: { survey_cycle_id: { in: cycleIds } },
            select: { id: true }
          });
          const analysisIds = analysisRows.map((a) => a.id);
          if (analysisIds.length > 0) {
            await tx.suggestions.deleteMany({
              where: { analysis_result_id: { in: analysisIds } }
            });
          }
          await tx.analysis_results.deleteMany({
            where: { survey_cycle_id: { in: cycleIds } }
          });
        }
        await tx.reports.deleteMany({
          where: {
            OR: [
              { company_id: id },
              ...(cycleIds.length > 0 ? [{ survey_cycle_id: { in: cycleIds } }] : [])
            ]
          }
        });

        // 6. Delete survey_cycles, surveys, questions, and employees
        await tx.survey_cycles.deleteMany({ where: { company_id: id } });
        await tx.surveys.deleteMany({ where: { company_id: id } });
        await tx.questions.deleteMany({ where: { company_id: id } });
        await tx.employees.deleteMany({ where: { company_id: id } });
      }

      // 7. Delete branches and company record
      await tx.company_branches.deleteMany({ where: { company_id: id } });
      return tx.companies.delete({ where: { id } });
    });

    // Only delete logo and report files after database transaction commits
    if (existing.logo_url) {
      await storageService.deleteLogo(existing.logo_url);
    }
    for (const r of reportsToDelete) {
      if (r.pdf_url) {
        await storageService.deleteLogo(r.pdf_url);
      }
    }

    return deletedCompany;
  }
};
