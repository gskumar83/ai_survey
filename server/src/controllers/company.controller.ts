import { Request, Response } from 'express';
import { companyService } from '../services/company.service';
import { storageService } from '../services/storage.service';
import * as authService from '../services/auth.service';
import prisma from '../prisma';
import { createCompanySchema, updateCompanySchema } from '../utils/validations';
import '../middleware/auth.middleware'; // ensures Express.Request augmentation is loaded

function getUploadedFile(req: Request): Express.Multer.File | undefined {
  if (req.file) return req.file;
  if (req.files) {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files['logoFile'] && files['logoFile'][0]) return files['logoFile'][0];
    if (files['logo'] && files['logo'][0]) return files['logo'][0];
  }
  return undefined;
}

export const companyController = {
  async createCompany(req: Request, res: Response) {
    const scope = req.adminScope!;
    if (!scope.isSuperAdmin) {
      return res.status(403).json({ error: 'Forbidden: Only Super Admin can register new organizations' });
    }

    const uploadedFile = getUploadedFile(req);
    let logoUrl: string | undefined = undefined;
    try {
      const validatedData = createCompanySchema.parse(req.body);
      const adminId = scope.adminId;

      if (uploadedFile) {
        logoUrl = await storageService.uploadLogo(uploadedFile);
      }

      const company = await companyService.createCompany(
        adminId,
        validatedData,
        logoUrl
      );

      res.status(201).json({ message: 'Company created successfully', data: company });
    } catch (error: any) {
      if (logoUrl) {
        await storageService.deleteLogo(logoUrl);
      } else if (uploadedFile && uploadedFile.filename) {
        await storageService.deleteLogo(`/uploads/${uploadedFile.filename}`);
      }
      res.status(400).json({ error: error.message || 'Failed to create company' });
    }
  },

  async getCompanies(req: Request, res: Response) {
    try {
      const scope = req.adminScope!;
      if (scope.isSuperAdmin) {
        const companies = await companyService.getAllCompaniesWithAdmins();
        return res.json({ data: companies });
      }

      // Organization Admin: Return only their assigned company
      if (!scope.assignedCompanyId) {
        return res.json({ data: [] });
      }

      const company = await companyService.getCompanyById(scope.assignedCompanyId);
      res.json({ data: company ? [company] : [] });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch companies' });
    }
  },

  async getCompanyById(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const scope = req.adminScope!;

      if (!scope.isSuperAdmin && scope.assignedCompanyId !== id) {
        return res.status(403).json({ error: 'Forbidden: Access to this organization is denied' });
      }

      const company = await companyService.getCompanyById(id);
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      res.json({ data: company });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch company' });
    }
  },

  async updateCompany(req: Request, res: Response) {
    const scope = req.adminScope!;
    const { id } = req.params as { id: string };

    if (!scope.isSuperAdmin) {
      return res.status(403).json({ error: 'Forbidden: Super Admin privileges required to edit organization configuration.' });
    }

    const uploadedFile = getUploadedFile(req);
    let newLogoUrl: string | undefined = undefined;
    try {
      const existing = await companyService.getCompanyById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Company not found' });
      }

      const validatedData = updateCompanySchema.parse(req.body);

      if (uploadedFile) {
        newLogoUrl = await storageService.uploadLogo(uploadedFile);
      }

      const { removeLogo, ...companyDetails } = validatedData;

      const company = await companyService.updateCompany(
        id,
        companyDetails,
        newLogoUrl,
        removeLogo
      );

      res.json({ message: 'Company updated successfully', data: company });
    } catch (error: any) {
      if (newLogoUrl) {
        await storageService.deleteLogo(newLogoUrl);
      } else if (uploadedFile && uploadedFile.filename) {
        await storageService.deleteLogo(`/uploads/${uploadedFile.filename}`);
      }
      res.status(400).json({ error: error.message || 'Failed to update company' });
    }
  },

  async deleteCompany(req: Request, res: Response) {
    const scope = req.adminScope!;
    if (!scope.isSuperAdmin) {
      return res.status(403).json({ error: 'Forbidden: Only Super Admin can delete organizations' });
    }

    try {
      const { id } = req.params as { id: string };
      const force = req.query.force === 'true' || req.body?.force === true;

      const company = await companyService.getCompanyById(id);
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      await companyService.deleteCompany(id, { force });
      res.json({
        message: force
          ? 'Company and all linked records deleted permanently'
          : 'Company deleted successfully',
        id
      });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({
        error: error.message || 'Failed to delete company',
        code: error.code || undefined,
        dependencies: error.dependencies || undefined
      });
    }
  },

  async assignAdmin(req: Request, res: Response) {
    try {
      const scope = req.adminScope!;
      if (!scope.isSuperAdmin) {
        return res.status(403).json({ error: 'Forbidden: Only Super Admin can assign organization administrators' });
      }

      const { id } = req.params as { id: string };
      const { email, name } = req.body || {};
      const baseUrl = (req.get('origin') || process.env.APP_URL || process.env.CLIENT_URL || '').trim();

      const result = await authService.generateAdminInvitation(id, email, name, baseUrl);
      res.status(201).json({
        message: `Invitation generated for ${result.admin.email}`,
        data: result
      });
    } catch (error: any) {
      const status = error.statusCode || 400;
      res.status(status).json({ error: error.message || 'Failed to assign administrator' });
    }
  },

  async revokeAdmin(req: Request, res: Response) {
    try {
      const scope = req.adminScope!;
      if (!scope.isSuperAdmin) {
        return res.status(403).json({ error: 'Forbidden: Only Super Admin can revoke organization administrators' });
      }

      const { id, adminId } = req.params as { id: string; adminId: string };
      const targetAdmin = await prisma.admins.findUnique({ where: { id: adminId } });
      if (!targetAdmin || targetAdmin.company_id !== id) {
        return res.status(404).json({ error: 'Administrator not found in this organization' });
      }

      const envEmail = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
      if (targetAdmin.role === 'super_admin' || (envEmail && targetAdmin.email.toLowerCase() === envEmail)) {
        return res.status(403).json({ error: 'Cannot revoke Super Admin access' });
      }

      await prisma.admins.update({
        where: { id: adminId },
        data: { company_id: null, is_activated: false, role: 'org_admin' }
      });

      res.json({ message: 'Administrator access revoked successfully from organization' });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to revoke administrator' });
    }
  },

  async getCompanyAdmins(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const scope = req.adminScope!;

      if (!scope.isSuperAdmin && scope.assignedCompanyId !== id) {
        return res.status(403).json({ error: 'Forbidden: Access to this organization is denied' });
      }

      const admins = await prisma.admins.findMany({
        where: { company_id: id },
        select: {
          id: true,
          admin_code: true,
          name: true,
          email: true,
          role: true,
          is_activated: true,
          created_at: true
        }
      });

      res.json({ data: admins });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch company administrators' });
    }
  }
};
