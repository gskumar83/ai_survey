import { Request, Response } from 'express';
import '../middleware/auth.middleware'; // ensures Express.Request augmentation is loaded
import { questionService } from '../services/question.service';
import { createQuestionSchema, updateQuestionSchema } from '../utils/validations';
import { question_type } from '@prisma/client';

export const questionController = {
  async createQuestion(req: Request, res: Response) {
    try {
      const scope = req.adminScope!;
      const validatedData = createQuestionSchema.parse(req.body);

      // Verify organization authorization
      if (!scope.isSuperAdmin && scope.assignedCompanyId !== validatedData.company_id) {
        return res.status(403).json({ error: 'Forbidden: Access to this organization is denied' });
      }

      const question = await questionService.createQuestion(
        validatedData.company_id,
        validatedData.question_text,
        validatedData.question_type as question_type,
        validatedData.options_json
      );

      res.status(201).json({ message: 'Question created successfully', data: question });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to create question' });
    }
  },

  async getQuestions(req: Request, res: Response) {
    try {
      const scope = req.adminScope!;
      const { company_id } = req.query;
      
      const questions = await questionService.getQuestionsByAdmin(scope, company_id as string);
      res.json({ data: questions });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message || 'Failed to fetch questions' });
    }
  },

  async getQuestionById(req: Request, res: Response) {
    try {
      const scope = req.adminScope!;
      const { id } = req.params as { id: string };
      
      const question = await questionService.getQuestionById(id, scope);
      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }

      res.json({ data: question });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message || 'Failed to fetch question' });
    }
  },

  async updateQuestion(req: Request, res: Response) {
    try {
      const scope = req.adminScope!;
      const { id } = req.params as { id: string };
      const validatedData = updateQuestionSchema.parse(req.body);

      const question = await questionService.updateQuestion(id, scope, {
        ...validatedData,
        question_type: validatedData.question_type as question_type | undefined
      });

      res.json({ message: 'Question updated successfully', data: question });
    } catch (error: any) {
      const status = error.statusCode || 400;
      res.status(status).json({ error: error.message || 'Failed to update question' });
    }
  },

  async deleteQuestion(req: Request, res: Response) {
    try {
      const scope = req.adminScope!;
      const { id } = req.params as { id: string };
      
      await questionService.deleteQuestion(id, scope);
      res.status(204).send();
    } catch (error: any) {
      const status = error.statusCode || 400;
      res.status(status).json({ error: error.message || 'Failed to delete question' });
    }
  }
};

