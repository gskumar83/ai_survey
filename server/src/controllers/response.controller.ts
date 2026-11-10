import { Request, Response } from 'express';
import '../middleware/auth.middleware'; // ensures Express.Request augmentation is loaded
import { responseService } from '../services/response.service';
import { submitResponseSchema } from '../utils/validations';

export const responseController = {
  async submitResponse(req: Request, res: Response) {
    try {
      const employeeId = req.user!.id;
      const assignmentId = req.params.id as string;
      
      const validatedData = submitResponseSchema.parse(req.body);

      const result = await responseService.submitResponse(
        employeeId,
        assignmentId,
        validatedData.answers
      );

      res.status(201).json({ message: 'Survey submitted successfully', data: result });
    } catch (error: any) {
      const status = error.statusCode || (error.message?.includes('Unauthorized') || error.message?.includes('unauthorized') ? 403 : 400);
      res.status(status).json({ error: error.message || 'Failed to submit response' });
    }
  },

  async saveProgress(req: Request, res: Response) {
    try {
      const employeeId = req.user!.id;
      const assignmentId = req.params.id as string;
      
      const validatedData = submitResponseSchema.parse(req.body);

      const result = await responseService.saveProgress(
        employeeId,
        assignmentId,
        validatedData.answers
      );

      res.status(200).json({ message: 'Survey progress saved successfully', data: result });
    } catch (error: any) {
      const status = error.statusCode || (error.message?.includes('Unauthorized') || error.message?.includes('unauthorized') ? 403 : 400);
      res.status(status).json({ error: error.message || 'Failed to save progress' });
    }
  },

  async getProgress(req: Request, res: Response) {
    try {
      const employeeId = req.user!.id;
      const assignmentId = req.params.id as string;

      const result = await responseService.getProgress(employeeId, assignmentId);

      res.status(200).json({ data: result });
    } catch (error: any) {
      const status = error.statusCode || (error.message?.includes('Unauthorized') || error.message?.includes('unauthorized') ? 403 : 400);
      res.status(status).json({ error: error.message || 'Failed to get progress' });
    }
  }
};
