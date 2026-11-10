import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRole } from '../middleware/role.middleware';
import prisma from '../prisma';

const router = Router();

import { translationService } from '../services/translation.service';

// Public: list available supported languages in the system
router.get('/languages', (_req, res) => {
  res.json({ data: translationService.getSupportedLanguages() });
});

// Public: list companies for employee registration dropdown
router.get('/companies', async (_req, res) => {
  try {
    const companies = await prisma.companies.findMany({
      select: {
        id: true,
        name: true,
        default_language: true,
        supported_languages: true,
      },
      orderBy: { name: 'asc' },
    });
    res.json(companies);
  } catch (err: any) {
    console.error('GET /companies error:', err);
    res.status(500).json({ error: 'Could not fetch companies', details: err?.message });
  }
});

// Public: list departments for employee registration dropdown
router.get('/departments', async (_req, res) => {
  try {
    const rawResult: any = await prisma.$runCommandRaw({
      find: 'departments',
      filter: {},
      sort: { name: 1 },
    });
    const depts = (rawResult?.cursor?.firstBatch || []).map((d: any) => ({
      id: d._id?.$oid || String(d._id),
      name: d.name,
    }));
    res.json(depts);
  } catch {
    res.status(500).json({ error: 'Could not fetch departments' });
  }
});

// Admin Auth
router.get('/admin/status', authController.getAdminStatus);
router.post('/admin/register', authController.adminRegister);
router.post('/admin/login', authController.adminLogin);
router.post('/admin/reset-password', authController.adminResetPassword);
router.get('/admin/verify-invitation', authController.verifyAdminInvitation);
router.post('/admin/verify-invitation', authController.verifyAdminInvitation);
router.post('/admin/activate-account', authController.activateAdminAccount);

// Employee Auth
router.post('/employee/register', authController.employeeRegister);
router.post('/employee/login', authController.employeeLogin);
router.post('/employee/forgot-password', authController.employeeForgotPassword);
router.post('/employee/reset-password-with-token', authController.employeeResetPasswordWithToken);

// Protected Employee Routes
router.post(
  '/employee/reset-password',
  authenticate,
  authorizeRole(['employee']),
  authController.employeeResetPassword
);

// Session refresh / logout — split per portal so each has its own cookie
// and can never be silently overwritten by the other (see auth.controller.ts).
router.post('/admin/refresh', authController.refreshAdmin);
router.post('/employee/refresh', authController.refreshEmployee);
router.post('/admin/logout', authController.logoutAdmin);
router.post('/employee/logout', authController.logoutEmployee);

export default router;
