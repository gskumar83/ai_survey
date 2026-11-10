import { Request, Response } from 'express';
import '../middleware/auth.middleware'; // ensures Express.Request augmentation is loaded
import { employeeService } from '../services/employee.service';
import { createEmployeeSchema, updateEmployeeSchema } from '../utils/validations';

export const employeeController = {
  async createEmployee(req: Request, res: Response) {
    try {
      const scope = req.adminScope!;
      const validatedData = createEmployeeSchema.parse(req.body);

      // Only Super Admin can create employees
      if (!scope.isSuperAdmin) {
        return res.status(403).json({ error: 'Forbidden: Super Admin privileges required for employee creation' });
      }

      const result = await employeeService.createEmployee(
        scope.adminId,
        validatedData.company_id,
        validatedData.employee_code,
        validatedData.name,
        validatedData.email,
        validatedData.phone,
        validatedData.department,
        validatedData.password
      );

      res.status(201).json({ 
        message: 'Employee created successfully', 
        data: result.employee,
        tempPassword: result.tempPassword // Provide back the temporary password to the admin
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to create employee' });
    }
  },

  async getEmployees(req: Request, res: Response) {
    try {
      const scope = req.adminScope!;
      const { company_id } = req.query;
      
      const employees = await employeeService.getEmployeesByAdmin(scope, company_id as string);
      res.json({ data: employees });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message || 'Failed to fetch employees' });
    }
  },

  async getEmployeeById(req: Request, res: Response) {
    try {
      const scope = req.adminScope!;
      const { id } = req.params as { id: string };
      
      const employee = await employeeService.getEmployeeById(id, scope);
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      res.json({ data: employee });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message || 'Failed to fetch employee' });
    }
  },

  async getEmployeeSurveyStatus(req: Request, res: Response) {
    try {
      const scope = req.adminScope!;
      const { id } = req.params as { id: string };

      const status = await employeeService.getEmployeeSurveyStatus(id, scope);
      if (!status) {
        return res.status(404).json({ error: 'Employee not found or unauthorized' });
      }

      res.json({ data: status });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message || 'Failed to fetch employee survey status' });
    }
  },

  async updateEmployee(req: Request, res: Response) {
    try {
      const scope = req.adminScope!;
      if (!scope.isSuperAdmin) {
        return res.status(403).json({ error: 'Forbidden: Super Admin privileges required for employee modifications' });
      }
      const { id } = req.params as { id: string };
      const validatedData = updateEmployeeSchema.parse(req.body);

      const employee = await employeeService.updateEmployee(id, scope, validatedData);

      res.json({ message: 'Employee updated successfully', data: employee });
    } catch (error: any) {
      const status = error.statusCode || 400;
      res.status(status).json({ error: error.message || 'Failed to update employee' });
    }
  },

  async deleteEmployee(req: Request, res: Response) {
    try {
      const scope = req.adminScope!;
      if (!scope.isSuperAdmin) {
        return res.status(403).json({ error: 'Forbidden: Super Admin privileges required for employee deletion' });
      }
      const { id } = req.params as { id: string };
      
      const deleted = await employeeService.deleteEmployee(id, scope);
      res.status(200).json({ message: 'Employee deleted successfully', id: deleted.id });
    } catch (error: any) {
      const status = error.statusCode || 400;
      res.status(status).json({ error: error.message || 'Failed to delete employee' });
    }
  },

  async bulkDeleteEmployees(req: Request, res: Response) {
    try {
      const scope = req.adminScope!;
      if (!scope.isSuperAdmin) {
        return res.status(403).json({ error: 'Forbidden: Super Admin privileges required for employee deletion' });
      }
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Please provide an array of employee IDs to delete' });
      }

      const result = await employeeService.bulkDeleteEmployees(ids, scope);
      res.json({ message: `Successfully deleted ${result.count} employee(s)`, data: result });
    } catch (error: any) {
      const status = error.statusCode || 400;
      res.status(status).json({ error: error.message || 'Failed to bulk delete employees' });
    }
  }
};

