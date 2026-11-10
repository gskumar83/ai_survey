import prisma from '../prisma';

const MIN_ANONYMITY_GROUP_SIZE = Number(process.env.MIN_ANONYMITY_GROUP_SIZE) || 5;

export function parseRatingValue(val: string | null | undefined): number | null {
  if (!val) return null;
  const n = Number(val);
  if (!Number.isNaN(n) && n >= 1 && n <= 5) return n;
  const lower = String(val).toLowerCase().trim();

  // 1: Strongly Disagree / Lowest rating - Checked BEFORE disagree and agree
  if (
    lower.includes('strongly disagree') ||
    lower.includes('very dissatisfied') ||
    lower.includes('very ineffective') ||
    lower.includes('very difficult') ||
    lower.includes('very poorly') ||
    lower.includes('أعارض بشدة') ||
    lower.includes('முற்றிலும் உடன்படவில்லை') ||
    lower.includes('दृढ़ता से असहमत') ||
    lower.includes('totalmente en desacuerdo') ||
    lower.includes('tout à fait en désaccord') ||
    lower.includes('stimme überhaupt nicht zu') ||
    lower.includes('非常不同意') ||
    lower.includes('強く反対')
  ) return 1;

  // 2: Disagree / Low rating - Checked BEFORE agree
  if (
    lower.includes('disagree') ||
    lower.includes('dissatisfied') ||
    lower.includes('ineffective') ||
    lower.includes('difficult') ||
    lower.includes('poorly') ||
    lower.includes('أعارض') ||
    lower.includes('உடன்படவில்லை') ||
    lower.includes('असहमत') ||
    lower.includes('en desacuerdo') ||
    lower.includes('en désaccord') ||
    lower.includes('stimme nicht zu') ||
    lower.includes('不同意') ||
    lower.includes('反対')
  ) return 2;

  // 5: Strongly Agree / Highest rating
  if (
    lower.includes('strongly agree') ||
    lower.includes('very satisfied') ||
    lower.includes('very effective') ||
    lower.includes('very easy') ||
    lower.includes('very well') ||
    lower.includes('أوافق بشدة') ||
    lower.includes('முற்றிலும் உடன்படுகிறேன்') ||
    lower.includes('दृढ़ता से सहमत') ||
    lower.includes('totalmente de acuerdo') ||
    lower.includes('tout à fait d\'accord') ||
    lower.includes('stimme voll und ganz zu') ||
    lower.includes('非常同意') ||
    lower.includes('強く賛成')
  ) return 5;

  // 4: Agree / High rating
  if (
    lower.includes('agree') ||
    lower.includes('satisfied') ||
    lower.includes('effective') ||
    lower.includes('easy') ||
    lower.includes('well') ||
    lower.includes('أوافق') ||
    lower.includes('உடன்படுகிறேன்') ||
    lower.includes('सहमत') ||
    lower.includes('de acuerdo') ||
    lower.includes('d\'accord') ||
    lower.includes('stimme zu') ||
    lower.includes('同意') ||
    lower.includes('賛成')
  ) return 4;

  // 3: Neutral
  if (
    lower.includes('neutral') ||
    lower.includes('average') ||
    lower.includes('محايد') ||
    lower.includes('நடுநிலை') ||
    lower.includes('तटस्थ') ||
    lower.includes('neutre') ||
    lower.includes('中立') ||
    lower.includes('どちらでもない')
  ) return 3;

  return null;
}

export const scoringService = {
  MIN_ANONYMITY_GROUP_SIZE,

  /** Normalizes an average of 1-5 ratings to a 0-100 "percent of max" score. */
  computeScore(ratingValues: number[]): number {
    if (ratingValues.length === 0) return 0;
    const avg = ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length;
    return Math.round((avg / 5) * 1000) / 10;
  },

  /** Buckets 1-5 ratings into positive/neutral/negative percentages. 4-5 = positive, 3 = neutral, 1-2 = negative. */
  computeSentimentBreakdown(ratingValues: number[]): { positive: number; neutral: number; negative: number } {
    if (ratingValues.length === 0) return { positive: 0, neutral: 0, negative: 0 };
    const total = ratingValues.length;
    const positive = ratingValues.filter((v) => v >= 4).length;
    const negative = ratingValues.filter((v) => v <= 2).length;
    const neutral = total - positive - negative;
    return {
      positive: Math.round((positive / total) * 100),
      neutral: Math.round((neutral / total) * 100),
      negative: Math.round((negative / total) * 100),
    };
  },

  /** How many employees were assigned this cycle vs. where they are in the funnel. */
  async getParticipation(cycleId: string) {
    const assignments = await prisma.survey_assignments.findMany({
      where: { survey_cycle_id: cycleId },
      select: { status: true },
    });
    const total_assigned = assignments.length;
    const completed = assignments.filter((a) => a.status === 'completed').length;
    const in_progress = assignments.filter((a) => a.status === 'in_progress').length;
    const not_started = assignments.filter((a) => a.status === 'assigned').length;
    return {
      total_assigned,
      completed,
      in_progress,
      not_started,
      completion_rate: total_assigned > 0 ? Math.round((completed / total_assigned) * 100) : 0,
    };
  },

  /** Per-question aggregate stats (averages/distributions) — never exposes raw text answers. */
  async getQuestionBreakdown(cycleId: string) {
    const cycle = await prisma.survey_cycles.findUnique({
      where: { id: cycleId },
      include: {
        survey: {
          include: {
            survey_questions: {
              orderBy: { display_order: 'asc' },
              include: { question: true },
            },
          },
        },
      },
    });
    if (!cycle) return [];

    const responses = await prisma.responses.findMany({
      where: { survey_assignment: { survey_cycle_id: cycleId, status: 'completed' } },
      include: { response_answers: true },
    });

    const answersByQuestion: Record<string, string[]> = {};
    for (const r of responses) {
      for (const a of r.response_answers) {
        if (!a.answer_value) continue;
        (answersByQuestion[a.question_id] ??= []).push(a.answer_value);
      }
    }

    return cycle.survey.survey_questions.map((sq) => {
      const q = sq.question;
      const values = answersByQuestion[q.id] || [];
      const base = {
        question_id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        response_count: values.length,
      };

      if (q.question_type === 'rating') {
        const nums = values.map(parseRatingValue).filter((n): n is number => n !== null);
        const distribution: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
        nums.forEach((n) => {
          const key = String(Math.round(n));
          if (distribution[key] !== undefined) distribution[key]++;
        });
        const average = nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100 : 0;
        return { ...base, average, distribution }; // average on the original 1-5 scale
      }

      if (q.question_type === 'single_choice') {
        const distribution: Record<string, number> = {};
        values.forEach((v) => {
          distribution[v] = (distribution[v] || 0) + 1;
        });
        return { ...base, distribution };
      }

      return base; // text — aggregate count only, raw text never leaves the identified admin response table
    });
  },

  /**
   * Average score per department. Any department with fewer than
   * MIN_ANONYMITY_GROUP_SIZE distinct respondents is pooled into a single
   * "Other" bucket instead of being shown on its own; if even the pooled
   * bucket doesn't clear the floor, it's dropped entirely rather than shown.
   */
  async getDepartmentBreakdown(cycleId: string) {
    const responses = await prisma.responses.findMany({
      where: { survey_assignment: { survey_cycle_id: cycleId, status: 'completed' } },
      include: {
        employee: { select: { department: true } },
        response_answers: { include: { question: true } },
      },
    });

    const perDept: Record<string, number[]> = {};
    for (const r of responses) {
      const ratingValues = r.response_answers
        .filter((a) => a.question.question_type === 'rating' && a.answer_value)
        .map((a) => parseRatingValue(a.answer_value))
        .filter((n): n is number => n !== null);
      if (ratingValues.length === 0) continue;
      const personScore = this.computeScore(ratingValues);
      const dept = r.employee.department?.trim() || 'Unspecified';
      (perDept[dept] ??= []).push(personScore);
    }

    const rows = Object.entries(perDept).map(([department, scores]) => ({
      department,
      respondent_count: scores.length,
      average_score: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
    }));

    const visible = rows.filter((r) => r.respondent_count >= MIN_ANONYMITY_GROUP_SIZE);
    const hidden = rows.filter((r) => r.respondent_count < MIN_ANONYMITY_GROUP_SIZE);

    if (hidden.length > 0) {
      const totalHiddenRespondents = hidden.reduce((sum, r) => sum + r.respondent_count, 0);
      if (totalHiddenRespondents >= MIN_ANONYMITY_GROUP_SIZE) {
        const weightedAvg =
          hidden.reduce((sum, r) => sum + r.average_score * r.respondent_count, 0) / totalHiddenRespondents;
        visible.push({
          department: 'Other (small groups)',
          respondent_count: totalHiddenRespondents,
          average_score: Math.round(weightedAvg * 10) / 10,
        });
      }
      // else: even pooled, too few respondents to report safely — dropped.
    }

    return visible.sort((a, b) => b.average_score - a.average_score);
  },
};
