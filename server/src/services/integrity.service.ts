import prisma from '../prisma';

export type IntegrityStatus = 'normal' | 'review_required' | 'invalid_submission';

export interface SubmissionIntegrityResult {
  response_id: string;
  employee_id: string;
  status: IntegrityStatus;
  signals: string[];
  answered_count: number;
  total_questions: number;
  submitted_at: Date;
}

export interface CycleIntegrityMetrics {
  total_assigned: number;
  completed: number;
  in_progress: number;
  not_started: number;
  completion_rate: number;
  valid_responses: number;
  review_required: number;
  invalid_submissions: number;
  duplicate_attempts: number;
  integrity_score: number;
  overall_status: 'Verified High Integrity' | 'Review Recommended' | 'Action Required';
  submissions: SubmissionIntegrityResult[];
}

export const integrityService = {
  /**
   * Evaluate integrity of a single response without accusing the employee.
   * Multiple non-accusatory signals are combined.
   */
  evaluateResponse(response: any, totalQuestions: number): SubmissionIntegrityResult {
    const signals: string[] = [];
    let status: IntegrityStatus = 'normal';

    const answers = response.response_answers || [];
    const answeredCount = answers.filter((a: any) => a.answer_value !== null && a.answer_value !== undefined && a.answer_value !== '').length;

    // Signal 1: Empty answers or zero answers
    if (answeredCount === 0 && totalQuestions > 0) {
      signals.push('No valid question answers recorded');
      status = 'invalid_submission';
    } else if (totalQuestions > 0 && answeredCount < Math.ceil(totalQuestions * 0.5)) {
      // Signal 2: Significantly incomplete submission
      signals.push('High volume of uncompleted questions');
      status = 'review_required';
    }

    // Signal 3: Unlinked assignment or missing employee binding
    if (!response.employee_id || !response.survey_assignment_id) {
      signals.push('Incomplete identity relation binding');
      status = 'invalid_submission';
    }

    return {
      response_id: response.id,
      employee_id: response.employee_id,
      status,
      signals,
      answered_count: answeredCount,
      total_questions: totalQuestions,
      submitted_at: response.submitted_at || new Date(),
    };
  },

  /**
   * Compute aggregate integrity metrics for an entire survey cycle.
   * Keeps integrity evaluation completely separate from survey sentiment analysis.
   */
  async getCycleIntegrityMetrics(cycleId: string): Promise<CycleIntegrityMetrics> {
    const cycle = await prisma.survey_cycles.findUnique({
      where: { id: cycleId },
      include: {
        survey: {
          include: {
            survey_questions: true,
          },
        },
        survey_assignments: {
          select: {
            id: true,
            status: true,
            assigned_at: true,
            completed_at: true,
          },
        },
      },
    });

    if (!cycle) {
      throw new Error('Survey cycle not found');
    }

    const totalQuestions = cycle.survey.survey_questions.length;
    const assignments = cycle.survey_assignments;
    const total_assigned = assignments.length;
    const completed = assignments.filter((a) => a.status === 'completed').length;
    const in_progress = assignments.filter((a) => a.status === 'in_progress').length;
    const not_started = assignments.filter((a) => a.status === 'assigned').length;
    const completion_rate = total_assigned > 0 ? Math.round((completed / total_assigned) * 100) : 0;

    // Fetch all completed responses for this cycle
    const responses = await prisma.responses.findMany({
      where: { survey_assignment: { survey_cycle_id: cycleId, status: 'completed' } },
      include: {
        response_answers: true,
      },
    });

    const evaluatedSubmissions: SubmissionIntegrityResult[] = responses.map((r) =>
      this.evaluateResponse(r, totalQuestions)
    );

    const valid_responses = evaluatedSubmissions.filter((s) => s.status === 'normal').length;
    const review_required = evaluatedSubmissions.filter((s) => s.status === 'review_required').length;
    const invalid_submissions = evaluatedSubmissions.filter((s) => s.status === 'invalid_submission').length;

    // Duplicate attempts prevented by DB unique constraint
    const duplicate_attempts = 0;

    // Integrity score: valid / total completed (or 100% if no completed)
    const integrity_score = completed > 0
      ? Math.round((valid_responses / completed) * 100)
      : 100;

    let overall_status: CycleIntegrityMetrics['overall_status'] = 'Verified High Integrity';
    if (invalid_submissions > 0) {
      overall_status = 'Action Required';
    } else if (review_required > 0 || integrity_score < 90) {
      overall_status = 'Review Recommended';
    }

    return {
      total_assigned,
      completed,
      in_progress,
      not_started,
      completion_rate,
      valid_responses,
      review_required,
      invalid_submissions,
      duplicate_attempts,
      integrity_score,
      overall_status,
      submissions: evaluatedSubmissions,
    };
  },
};
