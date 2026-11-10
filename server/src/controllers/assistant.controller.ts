import { Request, Response } from 'express';
import '../middleware/auth.middleware';
import { assistantService } from '../services/assistant.service';
import { assistantChatSchema } from '../utils/validations';

export const assistantController = {
  /**
   * Handle chat requests from employees to Eagle Assistant.
   */
  async chat(req: Request, res: Response) {
    try {
      const employeeId = req.user!.id;
      const validatedData = assistantChatSchema.parse(req.body);

      const result = await assistantService.chat(
        employeeId,
        validatedData.message,
        validatedData.history || [],
        validatedData.context
      );

      res.status(200).json({
        success: true,
        message: 'AI response generated successfully',
        data: result,
      });
    } catch (error: any) {
      console.error('Error in Eagle Assistant chat:', error);
      res.status(error.statusCode || 400).json({
        error: error.message || 'Failed to process AI chat request',
      });
    }
  },
};
