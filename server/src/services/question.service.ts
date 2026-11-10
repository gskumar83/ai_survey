import prisma from '../prisma';
import { question_type } from '@prisma/client';
import { AdminScope } from '../middleware/auth.middleware';

export const questionService = {
  async createQuestion(companyId: string, questionText: string, questionType: question_type, optionsJson?: any) {
    return prisma.questions.create({
      data: {
        company_id: companyId,
        question_text: questionText,
        question_type: questionType,
        options_json: optionsJson ? JSON.parse(JSON.stringify(optionsJson)) : null
      }
    });
  },

  async getQuestionsByAdmin(adminScope: AdminScope, companyId?: string) {
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

    return prisma.questions.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      include: {
        company: {
          select: { name: true }
        }
      }
    });
  },

  async getQuestionById(id: string, adminScope?: AdminScope) {
    const question = await prisma.questions.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, created_by_admin_id: true, name: true }
        }
      }
    });

    if (!question) {
      return null;
    }

    if (adminScope && !adminScope.isSuperAdmin && question.company_id !== adminScope.assignedCompanyId) {
      return null;
    }

    return question;
  },

  async updateQuestion(id: string, adminScope: AdminScope, updates: { question_text?: string, question_type?: question_type, options_json?: any }) {
    const question = await this.getQuestionById(id, adminScope);
    if (!question) {
      const forbiddenErr: any = new Error('Question not found or unauthorized');
      forbiddenErr.statusCode = 403;
      throw forbiddenErr;
    }

    const updateData: any = {};
    if (updates.question_text) updateData.question_text = updates.question_text;
    if (updates.question_type) updateData.question_type = updates.question_type;
    if (updates.options_json !== undefined) updateData.options_json = updates.options_json ? JSON.parse(JSON.stringify(updates.options_json)) : null;

    return prisma.questions.update({
      where: { id },
      data: updateData
    });
  },

  async deleteQuestion(id: string, adminScope: AdminScope) {
    const question = await this.getQuestionById(id, adminScope);
    if (!question) {
      const forbiddenErr: any = new Error('Question not found or unauthorized');
      forbiddenErr.statusCode = 403;
      throw forbiddenErr;
    }

    // Clean up relations first so MongoDB/Prisma doesn't throw constraint errors
    await prisma.survey_questions.deleteMany({ where: { question_id: id } });
    await prisma.response_answers.deleteMany({ where: { question_id: id } });

    return prisma.questions.delete({
      where: { id }
    });
  }
};

