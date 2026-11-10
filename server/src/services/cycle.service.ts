import prisma from '../prisma';
import { cycle_status } from '@prisma/client';
import { AdminScope } from '../middleware/auth.middleware';

export const cycleService = {
  async createCycle(companyId: string, surveyId: string, periodStart: Date, periodEnd: Date, status: cycle_status = 'open') {
    return prisma.survey_cycles.create({
      data: {
        company_id: companyId,
        survey_id: surveyId,
        period_start: periodStart,
        period_end: periodEnd,
        status: status
      }
    });
  },

  async getCyclesByAdmin(adminScope: AdminScope, companyId?: string) {
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

    return prisma.survey_cycles.findMany({
      where: whereClause,
      orderBy: { period_start: 'desc' },
      include: {
        company: {
          select: { name: true }
        },
        survey: {
          select: { title: true }
        },
        _count: {
          select: { survey_assignments: true }
        }
      }
    });
  },

  async getCycleById(id: string, adminScope?: AdminScope) {
    const cycle = await prisma.survey_cycles.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, created_by_admin_id: true, name: true }
        },
        survey: {
          select: { title: true }
        }
      }
    });

    if (!cycle) {
      return null;
    }

    if (adminScope && !adminScope.isSuperAdmin && cycle.company_id !== adminScope.assignedCompanyId) {
      return null;
    }

    return cycle;
  },

  async updateCycle(id: string, adminScope: AdminScope, updates: { period_start?: Date, period_end?: Date, status?: cycle_status }) {
    const cycle = await this.getCycleById(id, adminScope);
    if (!cycle) {
      const forbiddenErr: any = new Error('Survey cycle not found or unauthorized');
      forbiddenErr.statusCode = 403;
      throw forbiddenErr;
    }

    const updateData: any = {};
    if (updates.period_start) updateData.period_start = updates.period_start;
    if (updates.period_end) updateData.period_end = updates.period_end;
    if (updates.status) updateData.status = updates.status;

    return prisma.survey_cycles.update({
      where: { id },
      data: updateData
    });
  },

  async deleteCycle(id: string, adminScope: AdminScope) {
    const cycle = await this.getCycleById(id, adminScope);
    if (!cycle) {
      const forbiddenErr: any = new Error('Survey cycle not found or unauthorized');
      forbiddenErr.statusCode = 403;
      throw forbiddenErr;
    }

    return prisma.$transaction(async (tx) => {
      const assignments = await tx.survey_assignments.findMany({
        where: { survey_cycle_id: id },
        select: { id: true }
      });
      const assignmentIds = assignments.map((a) => a.id);

      if (assignmentIds.length > 0) {
        const responses = await tx.responses.findMany({
          where: { survey_assignment_id: { in: assignmentIds } },
          select: { id: true }
        });
        const responseIds = responses.map((r) => r.id);
        if (responseIds.length > 0) {
          await tx.response_answers.deleteMany({ where: { response_id: { in: responseIds } } });
          await tx.responses.deleteMany({ where: { id: { in: responseIds } } });
        }
        await tx.survey_assignments.deleteMany({ where: { survey_cycle_id: id } });
      }

      const analysisRows = await tx.analysis_results.findMany({
        where: { survey_cycle_id: id },
        select: { id: true }
      });
      const analysisIds = analysisRows.map((a) => a.id);
      if (analysisIds.length > 0) {
        await tx.suggestions.deleteMany({ where: { analysis_result_id: { in: analysisIds } } });
      }

      await tx.analysis_results.deleteMany({ where: { survey_cycle_id: id } });
      await tx.reports.deleteMany({ where: { survey_cycle_id: id } });

      return tx.survey_cycles.delete({
        where: { id }
      });
    });
  }
};
