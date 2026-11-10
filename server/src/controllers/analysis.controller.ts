import { Request, Response } from 'express';
import { aiService } from '../services/ai.service';
import { scoringService } from '../services/scoring.service';
import { integrityService } from '../services/integrity.service';
import prisma from '../prisma';
import '../middleware/auth.middleware'; // ensures Express.Request augmentation is loaded

export const analysisController = {
  async triggerAnalysis(req: Request, res: Response) {
    try {
      const scope = req.adminScope!;
      const cycleId = req.params.id as string;

      const result = await aiService.generateAnalysis(scope, cycleId);

      res.status(201).json({ message: 'Analysis generated successfully', data: result });
    } catch (error: any) {
      const status = error.statusCode || 400;
      res.status(status).json({ error: error.message || 'Failed to generate analysis' });
    }
  },

  async getAnalysis(req: Request, res: Response) {
    try {
      const scope = req.adminScope!;
      const cycleId = req.params.id as string;

      // Verify organization authorization
      const cycle = await prisma.survey_cycles.findUnique({
        where: { id: cycleId },
        include: { company: { select: { id: true, name: true } } }
      });

      if (!cycle) {
        return res.status(404).json({ error: 'Survey cycle not found' });
      }

      if (!scope.isSuperAdmin && cycle.company_id !== scope.assignedCompanyId) {
        return res.status(403).json({ error: 'Forbidden: Access to this organization is denied' });
      }

      const analysis = await prisma.analysis_results.findUnique({
        where: { survey_cycle_id: cycleId },
        include: {
          suggestions: true,
          survey_cycle: {
            include: {
              survey: { select: { title: true } }
            }
          }
        }
      });

      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found. Please trigger the analysis first.' });
      }

      const [participation, question_breakdown, department_breakdown, integrity] = await Promise.all([
        scoringService.getParticipation(cycleId),
        scoringService.getQuestionBreakdown(cycleId),
        scoringService.getDepartmentBreakdown(cycleId),
        integrityService.getCycleIntegrityMetrics(cycleId),
      ]);

      res.json({ data: { ...analysis, participation, question_breakdown, department_breakdown, integrity } });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message || 'Failed to fetch analysis' });
    }
  }
};

