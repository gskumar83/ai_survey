import prisma from '../prisma';
import { AdminScope } from '../middleware/auth.middleware';

export const surveyService = {
  async createSurvey(adminId: string, companyId: string, title: string, isEnabled: boolean = false, questions: { question_id: string, display_order: number }[] = []) {
    return prisma.surveys.create({
      data: {
        company_id: companyId,
        title,
        is_enabled: isEnabled,
        created_by_admin_id: adminId,
        survey_questions: {
          create: questions.map(q => ({
            question_id: q.question_id,
            display_order: q.display_order
          }))
        }
      },
      include: {
        survey_questions: {
          include: {
            question: true
          }
        }
      }
    });
  },

  async getSurveysByAdmin(adminScope: AdminScope, companyId?: string) {
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

    return prisma.surveys.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      include: {
        company: {
          select: { name: true }
        },
        _count: {
          select: { survey_questions: true }
        }
      }
    });
  },

  async getSurveyById(id: string, adminScope?: AdminScope) {
    const survey = await prisma.surveys.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, name: true, created_by_admin_id: true }
        },
        survey_questions: {
          orderBy: { display_order: 'asc' },
          include: {
            question: true
          }
        }
      }
    });

    if (!survey) {
      return null;
    }

    if (adminScope && !adminScope.isSuperAdmin && survey.company_id !== adminScope.assignedCompanyId) {
      return null;
    }

    return survey;
  },

  async updateSurvey(id: string, adminScope: AdminScope, updates: { title?: string, is_enabled?: boolean, questions?: { question_id: string, display_order: number }[] }) {
    const survey = await this.getSurveyById(id, adminScope);
    if (!survey) {
      const forbiddenErr: any = new Error('Survey not found or unauthorized');
      forbiddenErr.statusCode = 403;
      throw forbiddenErr;
    }

    const updateData: any = {};
    if (updates.title) updateData.title = updates.title;
    if (updates.is_enabled !== undefined) updateData.is_enabled = updates.is_enabled;

    if (updates.questions !== undefined) {
      // For updates on questions, we delete the existing mapping and recreate it
      await prisma.survey_questions.deleteMany({ where: { survey_id: id } });
      
      updateData.survey_questions = {
        create: updates.questions.map(q => ({
          question_id: q.question_id,
          display_order: q.display_order
        }))
      };
    }

    return prisma.surveys.update({
      where: { id },
      data: updateData,
      include: {
        survey_questions: {
          orderBy: { display_order: 'asc' },
          include: {
            question: true
          }
        }
      }
    });
  },

  async deleteSurvey(id: string, adminScope: AdminScope) {
    const survey = await this.getSurveyById(id, adminScope);
    if (!survey) {
      const forbiddenErr: any = new Error('Survey not found or unauthorized');
      forbiddenErr.statusCode = 403;
      throw forbiddenErr;
    }

    return prisma.$transaction(async (tx) => {
      // 1. Delete dependent records in leaf-to-root order
      const cycles = await tx.survey_cycles.findMany({
        where: { survey_id: id },
        select: { id: true }
      });
      const cycleIds = cycles.map(c => c.id);

      if (cycleIds.length > 0) {
        const assignments = await tx.survey_assignments.findMany({
          where: { survey_cycle_id: { in: cycleIds } },
          select: { id: true }
        });
        const assignmentIds = assignments.map(a => a.id);

        if (assignmentIds.length > 0) {
          const responses = await tx.responses.findMany({
            where: { survey_assignment_id: { in: assignmentIds } },
            select: { id: true }
          });
          const responseIds = responses.map(r => r.id);

          if (responseIds.length > 0) {
            await tx.response_answers.deleteMany({ where: { response_id: { in: responseIds } } });
            await tx.responses.deleteMany({ where: { id: { in: responseIds } } });
          }

          await tx.survey_assignments.deleteMany({ where: { id: { in: assignmentIds } } });
        }

        const analysisRows = await tx.analysis_results.findMany({
          where: { survey_cycle_id: { in: cycleIds } },
          select: { id: true }
        });
        const analysisIds = analysisRows.map(a => a.id);
        if (analysisIds.length > 0) {
          await tx.suggestions.deleteMany({ where: { analysis_result_id: { in: analysisIds } } });
        }

        await tx.analysis_results.deleteMany({ where: { survey_cycle_id: { in: cycleIds } } });
        await tx.reports.deleteMany({ where: { survey_cycle_id: { in: cycleIds } } });
        await tx.survey_cycles.deleteMany({ where: { id: { in: cycleIds } } });
      }

      // 2. Fetch linked question IDs before removing join records
      const surveyQuestions = await tx.survey_questions.findMany({
        where: { survey_id: id },
        select: { question_id: true }
      });
      const questionIds = surveyQuestions.map(sq => sq.question_id);

      await tx.survey_questions.deleteMany({ where: { survey_id: id } });

      // 3. Clean up questions that are not used in any other surveys
      if (questionIds.length > 0) {
        const otherUsages = await tx.survey_questions.findMany({
          where: { question_id: { in: questionIds } },
          select: { question_id: true }
        });
        const stillUsedIds = new Set(otherUsages.map(u => u.question_id));
        const orphanQuestionIds = questionIds.filter(qid => !stillUsedIds.has(qid));
        if (orphanQuestionIds.length > 0) {
          await tx.response_answers.deleteMany({ where: { question_id: { in: orphanQuestionIds } } });
          await tx.questions.deleteMany({ where: { id: { in: orphanQuestionIds } } });
        }
      }

      return tx.surveys.delete({
        where: { id }
      });
    });
  },

  async deleteSurveyQuestion(surveyId: string, questionId: string, adminScope: AdminScope) {
    const survey = await this.getSurveyById(surveyId, adminScope);
    if (!survey) {
      const forbiddenErr: any = new Error('Survey not found or unauthorized');
      forbiddenErr.statusCode = 403;
      throw forbiddenErr;
    }

    await prisma.survey_questions.deleteMany({
      where: {
        survey_id: surveyId,
        question_id: questionId
      }
    });

    return { message: 'Question removed from survey successfully' };
  }
};
