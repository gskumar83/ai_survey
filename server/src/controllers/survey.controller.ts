import { Request, Response } from 'express';
import '../middleware/auth.middleware'; // ensures Express.Request augmentation is loaded
import { surveyService } from '../services/survey.service';
import { createSurveySchema, updateSurveySchema } from '../utils/validations';

export const surveyController = {
  async createSurvey(req: Request, res: Response) {
    try {
      const scope = req.adminScope!;
      const validatedData = createSurveySchema.parse(req.body);

      // Verify organization authorization
      if (!scope.isSuperAdmin && scope.assignedCompanyId !== validatedData.company_id) {
        return res.status(403).json({ error: 'Forbidden: Access to this organization is denied' });
      }

      const survey = await surveyService.createSurvey(
        scope.adminId,
        validatedData.company_id,
        validatedData.title,
        validatedData.is_enabled,
        validatedData.questions
      );

      res.status(201).json({ message: 'Survey created successfully', data: survey });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to create survey' });
    }
  },

  async getSurveys(req: Request, res: Response) {
    try {
      const scope = req.adminScope!;
      const { company_id } = req.query;
      
      const surveys = await surveyService.getSurveysByAdmin(scope, company_id as string);
      res.json({ data: surveys });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message || 'Failed to fetch surveys' });
    }
  },

  async getSurveyById(req: Request, res: Response) {
    try {
      const scope = req.adminScope!;
      const { id } = req.params as { id: string };
      
      const survey = await surveyService.getSurveyById(id, scope);
      if (!survey) {
        return res.status(404).json({ error: 'Survey not found' });
      }

      res.json({ data: survey });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message || 'Failed to fetch survey' });
    }
  },

  async updateSurvey(req: Request, res: Response) {
    try {
      const scope = req.adminScope!;
      const { id } = req.params as { id: string };
      const validatedData = updateSurveySchema.parse(req.body);

      const survey = await surveyService.updateSurvey(id, scope, validatedData);

      res.json({ message: 'Survey updated successfully', data: survey });
    } catch (error: any) {
      const status = error.statusCode || 400;
      res.status(status).json({ error: error.message || 'Failed to update survey' });
    }
  },

  async deleteSurvey(req: Request, res: Response) {
    try {
      const scope = req.adminScope!;
      const { id } = req.params as { id: string };
      
      await surveyService.deleteSurvey(id, scope);
      res.status(204).send();
    } catch (error: any) {
      const status = error.statusCode || 400;
      res.status(status).json({ error: error.message || 'Failed to delete survey' });
    }
  }
};

