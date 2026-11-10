import prisma from '../prisma';

export const responseService = {
  /**
   * Progressively save employee survey answers without marking the survey as completed.
   * Enables the employee to leave and resume later.
   */
  async saveProgress(
    employeeId: string,
    assignmentId: string,
    answers: { question_id: string; answer_value?: string }[]
  ) {
    // 1. Verify the assignment belongs to the authenticated employee
    const assignment = await prisma.survey_assignments.findUnique({
      where: { id: assignmentId },
      include: {
        survey_cycle: true,
      },
    });

    if (!assignment) {
      const error: any = new Error('Assignment not found');
      error.statusCode = 404;
      throw error;
    }

    if (assignment.employee_id !== employeeId) {
      const error: any = new Error('Unauthorized access to survey assignment');
      error.statusCode = 403;
      throw error;
    }

    if (assignment.status === 'completed') {
      const error: any = new Error('This survey has already been completed');
      error.statusCode = 400;
      throw error;
    }

    if (assignment.survey_cycle.status !== 'open') {
      const error: any = new Error('This survey cycle is no longer open');
      error.statusCode = 400;
      throw error;
    }

    const now = new Date();
    if (assignment.survey_cycle.period_start > now || assignment.survey_cycle.period_end < now) {
      const error: any = new Error('This survey is outside its active access period');
      error.statusCode = 400;
      throw error;
    }

    // 2. Perform progressive save in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Transition status to in_progress if still assigned
      if (assignment.status === 'assigned') {
        await tx.survey_assignments.update({
          where: { id: assignmentId },
          data: { status: 'in_progress' },
        });
      }

      // Upsert the response record
      let response = await tx.responses.findUnique({
        where: { survey_assignment_id: assignmentId },
      });

      if (!response) {
        response = await tx.responses.create({
          data: {
            survey_assignment_id: assignmentId,
            employee_id: employeeId,
            company_id: assignment.survey_cycle.company_id,
            submitted_at: new Date(),
          },
        });
      } else {
        await tx.responses.update({
          where: { id: response.id },
          data: { submitted_at: new Date() },
        });
      }

      // Upsert answers into response_answers
      for (const ans of answers) {
        if (!ans.question_id) continue;
        const existingAns = await tx.response_answers.findFirst({
          where: {
            response_id: response.id,
            question_id: ans.question_id,
          },
        });

        if (existingAns) {
          await tx.response_answers.update({
            where: { id: existingAns.id },
            data: { answer_value: ans.answer_value ?? '' },
          });
        } else {
          await tx.response_answers.create({
            data: {
              response_id: response.id,
              question_id: ans.question_id,
              answer_value: ans.answer_value ?? '',
            },
          });
        }
      }

      const allAnswers = await tx.response_answers.findMany({
        where: { response_id: response.id },
      });

      return {
        assignment_id: assignmentId,
        status: 'in_progress',
        saved_count: allAnswers.length,
        saved_answers: allAnswers.map((a) => ({
          question_id: a.question_id,
          answer_value: a.answer_value,
        })),
        last_saved_at: new Date(),
      };
    });

    return result;
  },

  /**
   * Retrieve saved progress / draft answers for an employee assignment.
   */
  async getProgress(employeeId: string, assignmentId: string) {
    const assignment = await prisma.survey_assignments.findUnique({
      where: { id: assignmentId },
      include: {
        responses: {
          include: { response_answers: true },
        },
      },
    });

    if (!assignment) {
      const error: any = new Error('Assignment not found');
      error.statusCode = 404;
      throw error;
    }

    if (assignment.employee_id !== employeeId) {
      const error: any = new Error('Unauthorized access to survey assignment');
      error.statusCode = 403;
      throw error;
    }

    return {
      assignment_id: assignment.id,
      status: assignment.status,
      saved_answers:
        assignment.responses?.response_answers.map((a) => ({
          question_id: a.question_id,
          answer_value: a.answer_value,
        })) || [],
      last_saved_at: assignment.responses?.submitted_at || null,
    };
  },

  /**
   * Final submission of survey questions and answers.
   * Marks assignment status as 'completed' and records completed_at.
   */
  async submitResponse(
    employeeId: string,
    assignmentId: string,
    answers: { question_id: string; answer_value?: string }[]
  ) {
    // 1. Verify the assignment belongs to the employee
    const assignment = await prisma.survey_assignments.findUnique({
      where: { id: assignmentId },
      include: {
        survey_cycle: true,
      },
    });

    if (!assignment) {
      const error: any = new Error('Assignment not found');
      error.statusCode = 404;
      throw error;
    }

    if (assignment.employee_id !== employeeId) {
      const error: any = new Error('Unauthorized access to survey assignment');
      error.statusCode = 403;
      throw error;
    }

    if (assignment.status === 'completed') {
      const error: any = new Error('This survey has already been completed');
      error.statusCode = 400;
      throw error;
    }

    if (assignment.survey_cycle.status !== 'open') {
      const error: any = new Error('This survey cycle is no longer open');
      error.statusCode = 400;
      throw error;
    }

    const now = new Date();
    if (assignment.survey_cycle.period_start > now || assignment.survey_cycle.period_end < now) {
      const error: any = new Error('This survey is outside its active access period');
      error.statusCode = 400;
      throw error;
    }

    // 2. Perform submission in a transaction to ensure integrity
    const nonEmptyAnswers = (answers || []).filter(a => a && a.question_id && String(a.answer_value ?? '').trim() !== '');
    if (nonEmptyAnswers.length === 0) {
      const error: any = new Error('Please answer at least one survey question before submitting');
      error.statusCode = 400;
      throw error;
    }

    const result = await prisma.$transaction(async (tx) => {
      // Mark assignment as completed
      await tx.survey_assignments.update({
        where: { id: assignmentId },
        data: {
          status: 'completed',
          completed_at: new Date(),
        },
      });

      // Check if response record already exists from progressive saving
      let response = await tx.responses.findUnique({
        where: { survey_assignment_id: assignmentId },
      });

      if (response) {
        await tx.responses.update({
          where: { id: response.id },
          data: { submitted_at: new Date() },
        });

        for (const a of answers) {
          if (!a.question_id) continue;
          const existingAns = await tx.response_answers.findFirst({
            where: {
              response_id: response.id,
              question_id: a.question_id,
            },
          });

          if (existingAns) {
            await tx.response_answers.update({
              where: { id: existingAns.id },
              data: { answer_value: a.answer_value ?? '' },
            });
          } else {
            await tx.response_answers.create({
              data: {
                response_id: response.id,
                question_id: a.question_id,
                answer_value: a.answer_value ?? '',
              },
            });
          }
        }

        const fullResponse = await tx.responses.findUnique({
          where: { id: response.id },
          include: { response_answers: true },
        });

        return fullResponse;
      } else {
        // Create the main response record from scratch
        const newResponse = await tx.responses.create({
          data: {
            survey_assignment_id: assignmentId,
            employee_id: employeeId,
            company_id: assignment.survey_cycle.company_id,
            submitted_at: new Date(),
            response_answers: {
              create: answers.map((a) => ({
                question_id: a.question_id,
                answer_value: a.answer_value ?? '',
              })),
            },
          },
          include: {
            response_answers: true,
          },
        });

        return newResponse;
      }
    });

    return result;
  },
};

