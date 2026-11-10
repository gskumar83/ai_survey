import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRole } from '../middleware/role.middleware';
import { assignmentController } from '../controllers/assignment.controller';
import { responseController } from '../controllers/response.controller';
import { assistantController } from '../controllers/assistant.controller';
import prisma from '../prisma';

const router = Router();

// All employee routes are protected by auth and role checking
router.use(authenticate);
router.use(authorizeRole(['employee']));

// ─── Own profile ─────────────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const employee = await prisma.employees.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        employee_code: true,
        name: true,
        email: true,
        phone: true,
        department: true,
        created_at: true,
        company: {
          select: {
            id: true,
            name: true,
            company_code: true,
            logo_url: true,
            official_email: true,
            contact_number: true,
            address: true,
            industry: true,
            website: true,
            default_language: true,
            supported_languages: true,
          },
        },
        survey_assignments: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const assignments = employee.survey_assignments || [];
    let survey_status = 'Not Started';
    if (assignments.length > 0) {
      const allCompleted = assignments.every(a => a.status === 'completed');
      const anyProgress = assignments.some(a => a.status === 'completed' || a.status === 'in_progress');
      if (allCompleted) {
        survey_status = 'Completed';
      } else if (anyProgress) {
        survey_status = 'In Progress';
      }
    }

    const { survey_assignments, ...rest } = employee;
    res.json({ data: { ...rest, survey_status } });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch profile' });
  }
});

// Assignments API
router.get('/assignments', assignmentController.getMyAssignments);
router.post('/assignments/:id/start', assignmentController.startAssignment);
router.post('/assignments/:id/progress', responseController.saveProgress);
router.get('/assignments/:id/progress', responseController.getProgress);
router.post('/assignments/:id/submit', responseController.submitResponse);

// Eagle AI Assistant API
router.post('/assistant/chat', assistantController.chat);

export default router;

