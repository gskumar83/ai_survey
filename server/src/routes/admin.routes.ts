import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { authenticate, authorizeRole, requireSuperAdmin } from '../middleware/auth.middleware';
import { companyController } from '../controllers/company.controller';
import { questionController } from '../controllers/question.controller';
import { surveyController } from '../controllers/survey.controller';
import { cycleController } from '../controllers/cycle.controller';
import { employeeController } from '../controllers/employee.controller';
import { assignmentController } from '../controllers/assignment.controller';
import { analysisController } from '../controllers/analysis.controller';
import { storageService } from '../services/storage.service';
import { reportService } from '../services/report.service';
import { integrityService } from '../services/integrity.service';
import { surveyService } from '../services/survey.service';
import { translationService } from '../services/translation.service';
import { parseRatingValue } from '../services/scoring.service';
import { emailService } from '../services/email.service';
import * as authService from '../services/auth.service';
import prisma from '../prisma';

const router = Router();

// ─── Multer upload middleware ────────────────────────────────────────────────
const multerStorage = storageService.isS3Enabled
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (_req, _file, cb) => {
        cb(null, path.join(__dirname, '../../uploads'));
      },
      filename: (_req, file, cb) => {
        const uniqueSuffix = crypto.randomBytes(8).toString('hex');
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${Date.now()}-${uniqueSuffix}${ext}`);
      },
    });

const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
});

// All admin routes are protected by auth and role checking
router.use(authenticate);
router.use(authorizeRole(['admin']));

// ─── Own profile ─────────────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const admin = await prisma.admins.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        admin_code: true,
        name: true,
        email: true,
        role: true,
        company_id: true,
        is_activated: true,
        created_at: true,
        company: {
          select: { id: true, name: true, logo_url: true }
        }
      },
    });
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    res.json({
      data: {
        ...admin,
        isSuperAdmin: req.adminScope?.isSuperAdmin || admin.role === 'super_admin'
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch profile' });
  }
});

// ─── Admin Users & Access Management API (Super Admin Only) ──────────────────
router.get('/users', requireSuperAdmin, async (_req, res) => {
  try {
    const admins = await authService.getAllAdmins();
    res.json({ data: admins });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch admin users' });
  }
});

router.post('/users', requireSuperAdmin, async (req, res) => {
  try {
    const newAdmin = await authService.createAdminByAdmin(req.body);
    res.status(201).json({ message: 'Admin user created successfully', data: newAdmin });
  } catch (error: any) {
    const status = error.statusCode || 400;
    res.status(status).json({ error: error.message || 'Failed to create admin user' });
  }
});

router.delete('/users/:id', requireSuperAdmin, async (req, res) => {
  try {
    const requestingAdminId = req.user!.id;
    const { id } = req.params as { id: string };
    const result = await authService.deleteAdminByAdmin(id, requestingAdminId);
    res.json(result);
  } catch (error: any) {
    const status = error.statusCode || 400;
    res.status(status).json({ error: error.message || 'Failed to delete admin user' });
  }
});

// ─── Companies API ───────────────────────────────────────────────────────────
router.get('/companies', companyController.getCompanies);
const companyLogoUpload = upload.fields([
  { name: 'logoFile', maxCount: 1 },
  { name: 'logo', maxCount: 1 },
]);

router.post('/companies', companyLogoUpload, companyController.createCompany);
router.get('/companies/:id', companyController.getCompanyById);
router.patch('/companies/:id', companyLogoUpload, companyController.updateCompany);
router.delete('/companies/:id', companyController.deleteCompany);

// ─── Organization Admin Assignment API ───────────────────────────────────────
router.post('/companies/:id/assign-admin', requireSuperAdmin, companyController.assignAdmin);
router.delete('/companies/:id/assign-admin/:adminId', requireSuperAdmin, companyController.revokeAdmin);
router.get('/companies/:id/admins', companyController.getCompanyAdmins);


// ─── Department Management API (Dynamic via MongoDB collection) ────────────────
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
      created_at: d.created_at,
    }));
    res.json({ data: depts });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch departments' });
  }
});

router.post('/departments', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) {
      return res.status(400).json({ error: 'Department name is required' });
    }

    // Case-insensitive duplicate check
    const existing: any = await prisma.$runCommandRaw({
      find: 'departments',
      filter: { name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } }
    });

    if (existing?.cursor?.firstBatch?.length > 0) {
      return res.status(400).json({ error: `Department "${name}" already exists` });
    }

    await prisma.$runCommandRaw({
      insert: 'departments',
      documents: [{ name, created_at: new Date() }]
    });

    res.status(201).json({ message: 'Department added successfully', data: { name } });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to add department' });
  }
});

router.delete('/departments/:idOrName', async (req, res) => {
  try {
    const target = req.params.idOrName;
    let deleteFilter: any = { name: target };
    if (/^[0-9a-fA-F]{24}$/.test(target)) {
      deleteFilter = { $or: [{ name: target }, { _id: { $oid: target } }] };
    }

    await prisma.$runCommandRaw({
      delete: 'departments',
      deletes: [{ q: deleteFilter, limit: 0 }]
    });

    res.json({ message: 'Department removed successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to delete department' });
  }
});

// ─── Questions API ───────────────────────────────────────────────────────────
router.get('/questions', questionController.getQuestions);
router.post('/questions', questionController.createQuestion);
router.get('/questions/:id', questionController.getQuestionById);
router.patch('/questions/:id', questionController.updateQuestion);
router.delete('/questions/:id', questionController.deleteQuestion);

// ─── Surveys API ─────────────────────────────────────────────────────────────
router.get('/surveys', surveyController.getSurveys);
router.post('/surveys', surveyController.createSurvey);
router.get('/surveys/:id', surveyController.getSurveyById);
router.patch('/surveys/:id', surveyController.updateSurvey);
router.delete('/surveys/:id', surveyController.deleteSurvey);
router.delete('/surveys/:surveyId/questions/:questionId', async (req, res) => {
  try {
    const scope = req.adminScope!;
    const { surveyId, questionId } = req.params;
    const result = await surveyService.deleteSurveyQuestion(surveyId, questionId, scope);
    res.json(result);
  } catch (error: any) {
    const status = error.statusCode || 400;
    res.status(status).json({ error: error.message || 'Failed to remove question from survey' });
  }
});

// ─── Survey Cycles API ───────────────────────────────────────────────────────
router.get('/survey-cycles', cycleController.getCycles);
router.post('/survey-cycles', cycleController.createCycle);
router.get('/survey-cycles/:id', cycleController.getCycleById);
router.patch('/survey-cycles/:id', cycleController.updateCycle);
router.delete('/survey-cycles/:id', cycleController.deleteCycle);
router.post('/survey-cycles/:id/assign', assignmentController.assignCycle);
router.post('/survey-cycles/:id/analyze', analysisController.triggerAnalysis);
router.get('/survey-cycles/:id/analysis', analysisController.getAnalysis);

// ─── PDF Report Generation ───────────────────────────────────────────────────
router.post('/survey-cycles/:id/report', async (req, res) => {
  try {
    const scope = req.adminScope!;
    const cycleId = req.params.id;
    const result = await reportService.generateReport(cycleId, scope);
    res.json({ message: 'Report generated successfully', data: result });
  } catch (error: any) {
    const status = error.statusCode || 500;
    res.status(status).json({ error: error.message || 'Failed to generate report' });
  }
});

// ─── Reports List & Download ─────────────────────────────────────────────────
router.get('/reports', async (req, res) => {
  try {
    const scope = req.adminScope!;
    const { company_id } = req.query as Record<string, string>;
    let targetCompanyId: string | undefined = undefined;

    if (scope.isSuperAdmin) {
      if (company_id && /^[0-9a-fA-F]{24}$/.test(company_id)) {
        targetCompanyId = company_id;
      }
    } else {
      if (company_id && company_id !== scope.assignedCompanyId) {
        return res.status(403).json({ error: 'Forbidden: Access to this organization is denied' });
      }
      targetCompanyId = scope.assignedCompanyId || undefined;
    }

    const whereClause: any = {};
    if (targetCompanyId) {
      whereClause.company_id = targetCompanyId;
    }

    const reports = await prisma.reports.findMany({
      where: whereClause,
      include: {
        company: { select: { name: true } },
        survey_cycle: { include: { survey: { select: { title: true } } } },
      },
      orderBy: { generated_at: 'desc' },
    });
    res.json({ data: reports });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch reports' });
  }
});

router.get('/reports/:id/download', async (req, res) => {
  try {
    const scope = req.adminScope!;
    const report = await prisma.reports.findUnique({
      where: { id: req.params.id },
      include: { company: { select: { id: true, name: true } } }
    });
    if (!report || !report.pdf_url) return res.status(404).json({ error: 'Report not found' });
    if (!scope.isSuperAdmin && report.company_id !== scope.assignedCompanyId) {
      return res.status(403).json({ error: 'Forbidden: Access to this organization is denied' });
    }

    // A successful download is "delivery" per the report lifecycle — mark it sent.
    if (report.status !== 'sent') {
      await prisma.reports.update({
        where: { id: report.id },
        data: { status: 'sent', sent_at: new Date(), sent_by_admin_id: req.user!.id },
      });
    }

    if (report.pdf_url.startsWith('http') && !report.pdf_url.includes('/uploads/')) {
      return res.redirect(report.pdf_url);
    }

    // Local file
    let relPath = report.pdf_url;
    if (relPath.includes('/uploads/')) {
      relPath = relPath.substring(relPath.indexOf('/uploads/'));
    }
    const cleanRelPath = relPath.replace(/^[\\/]+/, '');
    const filePath = path.join(__dirname, '../../', cleanRelPath);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'PDF file not found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report-${report.id}.pdf"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Download failed' });
  }
});

// ─── Suggestion Edit / Approve ───────────────────────────────────────────────
router.delete('/reports/:id', async (req, res) => {
  try {
    const scope = req.adminScope!;
    const report = await prisma.reports.findUnique({
      where: { id: req.params.id },
      include: { company: { select: { id: true } } }
    });
    if (!report) return res.status(404).json({ error: 'Report not found' });
    if (!scope.isSuperAdmin && report.company_id !== scope.assignedCompanyId) {
      return res.status(403).json({ error: 'Forbidden: Access to this organization is denied' });
    }
    await prisma.reports.delete({ where: { id: report.id } });
    res.json({ message: 'Report deleted successfully', id: report.id });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to delete report' });
  }
});

router.patch('/suggestions/:id', async (req, res) => {
  try {
    const scope = req.adminScope!;
    const { suggestion_text, is_admin_approved } = req.body;
    const existing = await prisma.suggestions.findUnique({
      where: { id: req.params.id },
      include: { analysis_result: { include: { survey_cycle: { select: { company_id: true } } } } },
    });
    if (!existing || !existing.analysis_result?.survey_cycle) {
      return res.status(404).json({ error: 'Suggestion not found or unauthorized' });
    }
    if (!scope.isSuperAdmin && existing.analysis_result.survey_cycle.company_id !== scope.assignedCompanyId) {
      return res.status(403).json({ error: 'Forbidden: Access to this organization is denied' });
    }
    const updated = await prisma.suggestions.update({
      where: { id: req.params.id },
      data: {
        ...(suggestion_text !== undefined && { suggestion_text }),
        ...(is_admin_approved !== undefined && { is_admin_approved }),
      },
    });
    res.json({ data: updated });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Update failed' });
  }
});

// ─── Cycle Integrity Metrics ────────────────────────────────────────────────
router.get('/cycles/:id/integrity', async (req, res) => {
  try {
    const scope = req.adminScope!;
    const cycleId = req.params.id;
    const cycle = await prisma.survey_cycles.findUnique({
      where: { id: cycleId },
      select: { company_id: true }
    });
    if (!cycle) {
      return res.status(404).json({ error: 'Cycle not found' });
    }
    if (!scope.isSuperAdmin && cycle.company_id !== scope.assignedCompanyId) {
      return res.status(403).json({ error: 'Forbidden: Access to this organization is denied' });
    }
    const metrics = await integrityService.getCycleIntegrityMetrics(cycleId);
    res.json({ data: metrics });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch cycle integrity' });
  }
});

// ─── Responses & Survey Progress ─────────────────────────────────────────────
router.get('/responses', async (req, res) => {
  try {
    const scope = req.adminScope!;
    const { company_id, cycle_id, survey_cycle_id } = req.query as Record<string, string>;
    const effectiveCycleId = cycle_id || survey_cycle_id;

    let targetCompanyId: string | undefined = undefined;
    if (scope.isSuperAdmin) {
      if (company_id && /^[0-9a-fA-F]{24}$/.test(company_id)) {
        targetCompanyId = company_id;
      }
    } else {
      if (company_id && company_id !== scope.assignedCompanyId) {
        return res.status(403).json({ error: 'Forbidden: Access to this organization is denied' });
      }
      targetCompanyId = scope.assignedCompanyId || undefined;
    }

    const whereClause: any = {
      survey_cycle: {
        ...(targetCompanyId && { company_id: targetCompanyId }),
        ...(effectiveCycleId && /^[0-9a-fA-F]{24}$/.test(effectiveCycleId) && { id: effectiveCycleId }),
      },
    };


    const assignments = await prisma.survey_assignments.findMany({
      where: whereClause,
      include: {
        employee: { select: { id: true, name: true, employee_code: true, email: true, department: true } },
        survey_cycle: {
          include: {
            company: { select: { id: true, name: true } },
            survey: {
              include: {
                survey_questions: { select: { id: true } },
              },
            },
          },
        },
        responses: {
          include: {
            response_answers: {
              include: {
                question: { select: { id: true, question_text: true, question_type: true } },
              },
            },
          },
        },
      },
      orderBy: { assigned_at: 'desc' },
    });

    const items = assignments.map((a) => {
      const totalQuestions = a.survey_cycle?.survey?.survey_questions?.length || 0;
      const validAnswers = (a.responses?.response_answers || []).filter(
        (ans) => ans.answer_value !== null && ans.answer_value !== undefined && ans.answer_value !== ''
      );
      const answeredCount = validAnswers.length;

      let statusLabel = 'NOT STARTED';
      let progressDisplay = `0 / ${totalQuestions}`;
      if (a.status === 'completed') {
        statusLabel = 'COMPLETED';
        progressDisplay = `${totalQuestions} / ${totalQuestions} answered`;
      } else if (a.status === 'in_progress') {
        statusLabel = 'IN PROGRESS';
        progressDisplay = `${answeredCount} / ${totalQuestions} answered`;
      }

      const isOrgAdmin = !scope.isSuperAdmin;
      const displayId = a.employee?.employee_code || a.employee?.id || 'ANONYMOUS';
      const safeEmployee = a.employee ? {
        id: a.employee.id,
        employee_code: a.employee.employee_code,
        name: isOrgAdmin ? displayId : a.employee.name,
        email: isOrgAdmin ? '[Protected]' : a.employee.email,
        department: a.employee.department,
      } : null;

      return {
        id: a.responses?.id || a.id,
        assignment_id: a.id,
        response_id: a.responses?.id || null,
        employee_id: a.employee_id,
        company_id: a.survey_cycle?.company?.id,
        company_name: a.survey_cycle?.company?.name || 'Company',
        survey_id: a.survey_cycle?.survey?.id || null,
        survey_cycle_id: a.survey_cycle_id,
        employee: safeEmployee,
        employee_name: isOrgAdmin ? displayId : a.employee?.name,
        survey: {
          id: a.survey_cycle?.survey?.id,
          title: a.survey_cycle?.survey?.title || 'Survey',
          total_questions: totalQuestions,
        },
        survey_assignment: {
          id: a.id,
          status: a.status,
        },
        status: a.status,
        status_label: statusLabel,
        answered_count: answeredCount,
        total_questions: totalQuestions,
        progress_display: progressDisplay,
        submitted_at: a.completed_at || a.responses?.submitted_at || null,
        created_at: a.responses?.submitted_at || a.assigned_at,
        assigned_at: a.assigned_at,
        response_answers: (a.responses?.response_answers || []).map((ans) => ({
          id: ans.id,
          question_id: ans.question_id,
          answer_value: ans.answer_value,
          rating_value: ans.question?.question_type === 'rating' ? parseRatingValue(ans.answer_value) : null,
          text_value: ans.question?.question_type === 'text' ? ans.answer_value : null,
          question: ans.question,
        })),
      };
    });

    const completed = items.filter((i) => i.status === 'completed');
    const in_progress = items.filter((i) => i.status === 'in_progress');
    const not_started = items.filter((i) => i.status === 'assigned');
    const progress = items.filter((i) => i.status !== 'completed');

    res.json({
      data: items,
      completed,
      in_progress,
      not_started,
      progress,
      counts: {
        total: items.length,
        completed: completed.length,
        in_progress: in_progress.length,
        not_started: not_started.length,
      },
      groups: {
        progress,
        completed,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch responses' });
  }
});

// ─── Employees API ───────────────────────────────────────────────────────────
router.get('/employees', employeeController.getEmployees);
router.post('/employees', employeeController.createEmployee);
router.patch('/employees/:id', employeeController.updateEmployee);
router.post('/employees/bulk-delete', employeeController.bulkDeleteEmployees);
router.get('/employees/:id/survey-status', employeeController.getEmployeeSurveyStatus);
router.get('/employees/:id', employeeController.getEmployeeById);
router.delete('/employees/:id', employeeController.deleteEmployee);

router.post('/notifications/remind', async (req, res) => {
  try {
    const { email, subject, message } = req.body || {};
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid recipient email is required' });
    }
    const cleanEmail = email.trim();
    const cleanSubject = (subject || 'Visteria Survey Reminder').trim();
    const cleanMessage = (message || 'You have pending survey assignments on the Visteria Employee Portal. Please sign in to complete your feedback.').trim();
    const sent = await emailService.sendNotificationEmail(cleanEmail, cleanSubject, cleanMessage);
    res.json({
      message: sent ? `Reminder email sent to ${cleanEmail}` : `Reminder logged for ${cleanEmail} (SMTP not configured; open mail client if needed)`,
      sent,
      email: cleanEmail,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to send reminder' });
  }
});

// ─── Languages & Localization API ──────────────────────────────────────────
router.get('/languages/registry', (req, res) => {
  try {
    const languages = translationService.getSupportedLanguages();
    res.json({ data: languages });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch supported languages' });
  }
});

router.get('/companies/:id/languages', async (req, res) => {
  try {
    const scope = req.adminScope!;
    const result = await translationService.getCompanyLanguageSettings(req.params.id, scope);
    res.json({ data: result });
  } catch (error: any) {
    const status = error.statusCode || 400;
    res.status(status).json({ error: error.message || 'Failed to fetch company language settings' });
  }
});

router.put('/companies/:id/languages', async (req, res) => {
  try {
    const scope = req.adminScope!;
    const result = await translationService.updateCompanyLanguageSettings(
      req.params.id,
      scope,
      req.body
    );
    res.json(result);
  } catch (error: any) {
    const status = error.statusCode || 400;
    res.status(status).json({ error: error.message || 'Failed to update company language settings' });
  }
});

router.get('/companies/:id/translations', async (req, res) => {
  try {
    const scope = req.adminScope!;
    const result = await translationService.getCompanyTranslationStatus(req.params.id, scope);
    res.json({ data: result });
  } catch (error: any) {
    const status = error.statusCode || 400;
    res.status(status).json({ error: error.message || 'Failed to fetch translation status' });
  }
});

router.put('/questions/:id/translations', async (req, res) => {
  try {
    const scope = req.adminScope!;
    const result = await translationService.saveQuestionTranslations(
      req.params.id,
      scope,
      req.body.translations || req.body
    );
    res.json(result);
  } catch (error: any) {
    const status = error.statusCode || 400;
    res.status(status).json({ error: error.message || 'Failed to save question translations' });
  }
});

router.post('/questions/:id/translate-auto', async (req, res) => {
  try {
    const scope = req.adminScope!;
    const targetLang = req.body.target_lang;
    if (!targetLang) {
      return res.status(400).json({ error: 'target_lang is required' });
    }
    const result = await translationService.autoTranslateQuestion(
      req.params.id,
      scope,
      targetLang
    );
    res.json({ data: result });
  } catch (error: any) {
    const status = error.statusCode || 400;
    res.status(status).json({ error: error.message || 'Failed to auto-translate question' });
  }
});

export default router;

