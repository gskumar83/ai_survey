import { Request, Response } from 'express';
import '../middleware/auth.middleware'; // ensures Express.Request augmentation is loaded
import { cycleService } from '../services/cycle.service';
import { scoringService } from '../services/scoring.service';
import { createSurveyCycleSchema, updateSurveyCycleSchema } from '../utils/validations';
import { cycle_status } from '@prisma/client';

export const cycleController = {
  async createCycle(req: Request, res: Response) {
    try {
      const scope = req.adminScope!;
      const validatedData = createSurveyCycleSchema.parse(req.body);

      // Verify organization authorization
      if (!scope.isSuperAdmin && scope.assignedCompanyId !== validatedData.company_id) {
        return res.status(403).json({ error: 'Forbidden: Access to this organization is denied' });
      }

      const cycle = await cycleService.createCycle(
        validatedData.company_id,
        validatedData.survey_id,
        validatedData.period_start,
        validatedData.period_end,
        validatedData.status as cycle_status | undefined
      );

      res.status(201).json({ message: 'Survey cycle created successfully', data: cycle });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to create survey cycle' });
    }
  },

  async getCycles(req: Request, res: Response) {
    try {
      const scope = req.adminScope!;
      const { company_id } = req.query;
      
      const cycles = await cycleService.getCyclesByAdmin(scope, company_id as string);
      res.json({ data: cycles });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message || 'Failed to fetch survey cycles' });
    }
  },

  async getCycleById(req: Request, res: Response) {
    try {
      const scope = req.adminScope!;
      const { id } = req.params as { id: string };
      
      const cycle = await cycleService.getCycleById(id, scope);
      if (!cycle) {
        return res.status(404).json({ error: 'Survey cycle not found' });
      }

      const participation = await scoringService.getParticipation(id);

      res.json({ data: { ...cycle, participation } });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message || 'Failed to fetch survey cycle' });
    }
  },

  async updateCycle(req: Request, res: Response) {
    try {
      const scope = req.adminScope!;
      const { id } = req.params as { id: string };
      const validatedData = updateSurveyCycleSchema.parse(req.body);

      const cycle = await cycleService.updateCycle(id, scope, {
        ...validatedData,
        status: validatedData.status as cycle_status | undefined
      });

      res.json({ message: 'Survey cycle updated successfully', data: cycle });
    } catch (error: any) {
      const status = error.statusCode || 400;
      res.status(status).json({ error: error.message || 'Failed to update survey cycle' });
    }
  },

  async deleteCycle(req: Request, res: Response) {
    try {
      const scope = req.adminScope!;
      const { id } = req.params as { id: string };
      
      await cycleService.deleteCycle(id, scope);
      res.status(204).send();
    } catch (error: any) {
      const status = error.statusCode || 400;
      res.status(status).json({ error: error.message || 'Failed to delete survey cycle' });
    }
  }
};

