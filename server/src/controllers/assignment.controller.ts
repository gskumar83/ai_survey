import { Request, Response } from 'express';
import '../middleware/auth.middleware'; // ensures Express.Request augmentation is loaded
import { assignmentService } from '../services/assignment.service';

export const assignmentController = {
  /**
   * Admin endpoint to assign a cycle to all employees in the company
   */
  async assignCycle(req: Request, res: Response) {
    try {
      const scope = req.adminScope!;
      const cycleId = req.params.id as string;
      const { company_id } = req.body;

      if (!company_id) {
        return res.status(400).json({ error: 'company_id is required in the body' });
      }

      if (!scope.isSuperAdmin && scope.assignedCompanyId !== company_id) {
        return res.status(403).json({ error: 'Forbidden: Access to this organization is denied' });
      }

      const result = await assignmentService.assignCycleToAllEmployees(scope, company_id, cycleId);
      res.json({ data: result });
    } catch (error: any) {
      const status = error.statusCode || 400;
      res.status(status).json({ error: error.message || 'Failed to assign cycle' });
    }
  },

  /**
   * Employee endpoint to fetch their assignments
   */
  async getMyAssignments(req: Request, res: Response) {
    try {
      const employeeId = req.user!.id;
      
      const assignments = await assignmentService.getEmployeeAssignments(employeeId);
      res.json({ data: assignments });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch assignments' });
    }
  },

  /**
   * Employee endpoint to start a survey and mark assignment in_progress
   */
  async startAssignment(req: Request, res: Response) {
    try {
      const employeeId = req.user!.id;
      const assignmentId = req.params.id as string;
      const result = await assignmentService.startAssignment(employeeId, assignmentId);
      res.json({ message: 'Survey session started', data: result });
    } catch (error: any) {
      const status = error.statusCode || (error.message?.includes('Unauthorized') || error.message?.includes('unauthorized') ? 403 : 400);
      res.status(status).json({ error: error.message || 'Failed to start survey session' });
    }
  }
};
