import prisma from '../prisma';
import Anthropic from '@anthropic-ai/sdk';
import { scoringService, parseRatingValue } from './scoring.service';
import { AdminScope } from '../middleware/auth.middleware';

interface FreeTextEntry {
  questionText: string;
  answer: string;
}

interface ThemeSummary {
  overview: string;
  themes: { theme: string; sentiment: 'positive' | 'neutral' | 'negative'; frequency: number; example: string }[];
}

export const aiService = {
  async generateAnalysis(adminScope: AdminScope, cycleId: string) {
    // 1. Verify the cycle exists, is closed, and belongs to admin organization
    const cycle = await prisma.survey_cycles.findUnique({
      where: { id: cycleId },
      include: {
        company: { select: { id: true, name: true } },
      },
    });

    if (!cycle) {
      const err: any = new Error('Survey cycle not found');
      err.statusCode = 404;
      throw err;
    }

    if (!adminScope.isSuperAdmin && cycle.company_id !== adminScope.assignedCompanyId) {
      const forbiddenErr: any = new Error('Forbidden: Access to this organization is denied');
      forbiddenErr.statusCode = 403;
      throw forbiddenErr;
    }

    if (!['closed', 'analyzed', 'reported'].includes(cycle.status)) {
      throw new Error('Survey cycle must be closed before analysis can be generated');
    }

    // 2. Fetch all completed responses for the cycle, including the actual answers and the question text
    const responses = await prisma.responses.findMany({
      where: {
        survey_assignment: {
          survey_cycle_id: cycleId,
          status: 'completed',
        },
      },
      include: {
        response_answers: {
          include: {
            question: true,
          },
        },
      },
    });

    if (responses.length === 0) {
      throw new Error('No responses found for this survey cycle');
    }

    // 3. Split answers by type: ratings drive a deterministic score/sentiment,
    // free text (identifiers already stripped — only the answer text and its
    // question survive) is what gets batched to the AI for theme extraction.
    const ratingValues: number[] = [];
    const freeTextEntries: FreeTextEntry[] = [];

    for (const res of responses) {
      for (const ans of res.response_answers) {
        if (!ans.answer_value) continue;
        if (ans.question.question_type === 'rating') {
          const n = parseRatingValue(ans.answer_value);
          if (n !== null) ratingValues.push(n);
        } else if (ans.question.question_type === 'text') {
          freeTextEntries.push({ questionText: ans.question.question_text, answer: ans.answer_value });
        }
      }
    }

    // 4. Score + sentiment are computed deterministically from ratings — never guessed by the AI.
    const overallScore = scoringService.computeScore(ratingValues);
    const sentimentBreakdown = scoringService.computeSentimentBreakdown(ratingValues);

    // 5. Theme extraction + suggestions: AI (or mock) only, and only from anonymized free text.
    const apiKey = process.env.ANTHROPIC_API_KEY;
    let themeSummary: ThemeSummary;
    let suggestions: { theme: string; suggestionText: string; priority: 'high' | 'medium' | 'low' }[];

    const respondentCount = responses.length;
    const meetsAnonymityFloor = respondentCount >= scoringService.MIN_ANONYMITY_GROUP_SIZE;

    if (freeTextEntries.length === 0 || !meetsAnonymityFloor) {
      themeSummary = {
        overview: meetsAnonymityFloor
          ? 'No free-text responses were submitted for this cycle, so no qualitative themes could be extracted.'
          : `Fewer than ${scoringService.MIN_ANONYMITY_GROUP_SIZE} employees responded this cycle, so qualitative themes are withheld to protect anonymity.`,
        themes: [],
      };
      suggestions = this.generateFallbackSuggestions(overallScore, sentimentBreakdown);
    } else if (!apiKey || apiKey.trim() === '') {
      console.log('ℹ️ ANTHROPIC_API_KEY is not configured. Qualitative AI themes are withheld; generating score-driven recommendations.');
      themeSummary = {
        overview: 'Qualitative AI theme analysis is currently unavailable because the AI analysis service (ANTHROPIC_API_KEY) is not configured.',
        themes: [],
      };
      suggestions = this.generateFallbackSuggestions(overallScore, sentimentBreakdown);
    } else {
      console.log('🤖 Triggering Anthropic Claude API for theme/suggestion extraction...');
      const aiOutput = await this.callAnthropicAPI(apiKey, freeTextEntries, overallScore, sentimentBreakdown);
      themeSummary = aiOutput.themeSummary;
      suggestions = aiOutput.suggestions;
    }

    // 6. Save the analysis to the database
    const result = await prisma.$transaction(async (tx) => {
      const aiResult = await tx.analysis_results.upsert({
        where: { survey_cycle_id: cycleId },
        update: {
          overall_score: overallScore,
          sentiment_breakdown_json: sentimentBreakdown,
          theme_summary_json: themeSummary as any,
          generated_at: new Date(),
        },
        create: {
          survey_cycle_id: cycleId,
          overall_score: overallScore,
          sentiment_breakdown_json: sentimentBreakdown,
          theme_summary_json: themeSummary as any,
        },
      });

      // Clear old suggestions if re-running
      await tx.suggestions.deleteMany({ where: { analysis_result_id: aiResult.id } });

      if (suggestions && Array.isArray(suggestions) && suggestions.length > 0) {
        await tx.suggestions.createMany({
          data: suggestions.map((s) => ({
            analysis_result_id: aiResult.id,
            theme: s.theme,
            suggestion_text: s.suggestionText,
            priority: s.priority,
            is_admin_approved: false,
          })),
        });
      }

      // Mark cycle as analyzed
      await tx.survey_cycles.update({
        where: { id: cycleId },
        data: { status: 'analyzed' },
      });

      return aiResult;
    });

    return result;
  },

  async callAnthropicAPI(
    apiKey: string,
    freeTextEntries: FreeTextEntry[],
    overallScore: number,
    sentimentBreakdown: { positive: number; neutral: number; negative: number }
  ): Promise<{ themeSummary: ThemeSummary; suggestions: { theme: string; suggestionText: string; priority: 'high' | 'medium' | 'low' }[] }> {
    const anthropic = new Anthropic({ apiKey });
    const k = scoringService.MIN_ANONYMITY_GROUP_SIZE;

    const prompt = `
The rating-based engagement score for this survey cycle is ${overallScore}/100, with sentiment breakdown
${JSON.stringify(sentimentBreakdown)}. These were computed deterministically from rating answers — do not recompute them.

Below is a batch of anonymized free-text survey answers (no names, teams, or other identifiers are included —
they have already been stripped). Extract recurring themes and, from the themes plus the score above, propose
draft action suggestions.

Free-text answers:
${JSON.stringify(freeTextEntries, null, 2)}

Respond with strictly valid JSON in this exact shape:
{
  "themeSummary": {
    "overview": "a concise 2-3 sentence executive summary paragraph",
    "themes": [
      { "theme": "string", "sentiment": "positive" | "neutral" | "negative", "frequency": number, "example": "a short paraphrased, non-identifying representative example — never a verbatim quote and never containing a name, team, or other identifying detail" }
    ]
  },
  "suggestions": [
    { "theme": "string", "suggestionText": "string", "priority": "high" | "medium" | "low" }
  ]
}

Rules:
- Only include a theme if it is clearly supported by at least ${k} distinct free-text answers. If fewer than ${k} answers support a pattern, omit it rather than report it.
- "frequency" is the count of distinct answers touching that theme.
- Never include any name, team, department, or other detail that could identify a specific respondent.
`;

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1536,
      temperature: 0,
      system:
        'You are a JSON-only API for anonymized HR survey analysis. You must output valid JSON without markdown wrapping or conversational text, and you must strictly respect the minimum-group-size anonymity rule given in the prompt.',
      messages: [{ role: 'user', content: prompt }],
    });

    try {
      const rawContent = (response.content[0] as any).text;
      const cleanJson = rawContent.replace(/```json\n?/, '').replace(/```\n?$/, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error('Failed to parse Claude output', error);
      throw new Error('AI returned an invalid response format.');
    }
  },

  /** Deterministic, k-anonymity-respecting theme extraction for local dev / no API key. */
  generateMockThemesAndSuggestions(
    freeTextEntries: FreeTextEntry[],
    overallScore: number,
    sentimentBreakdown: { positive: number; neutral: number; negative: number }
  ) {
    const k = scoringService.MIN_ANONYMITY_GROUP_SIZE;

    if (freeTextEntries.length < k) {
      return {
        themeSummary: {
          overview: `Only ${freeTextEntries.length} free-text answers were submitted, below the minimum group size of ${k}. Themes are withheld this cycle to protect anonymity.`,
          themes: [],
        } as ThemeSummary,
        suggestions: this.generateFallbackSuggestions(overallScore, sentimentBreakdown),
      };
    }

    const themeSummary: ThemeSummary = {
      overview: `Based on ${freeTextEntries.length} anonymized free-text responses, employees are generally positive about their work environment but flag recurring friction around tooling and meeting load. The engagement score of ${overallScore}/100 tracks with a mostly ${sentimentBreakdown.positive >= sentimentBreakdown.negative ? 'positive' : 'mixed'} sentiment split.`,
      themes: [
        { theme: 'Tooling & Workflow', sentiment: 'negative' as const, frequency: Math.max(k, Math.round(freeTextEntries.length * 0.4)), example: 'Several respondents described current software tools as slowing down day-to-day work.' },
        { theme: 'Team Collaboration', sentiment: 'positive' as const, frequency: Math.max(k, Math.round(freeTextEntries.length * 0.35)), example: 'Multiple respondents highlighted strong support from teammates and managers.' },
        { theme: 'Meeting Load', sentiment: 'neutral' as const, frequency: Math.max(k, Math.round(freeTextEntries.length * 0.25)), example: 'A number of respondents mentioned meeting volume as an area with room to improve focus time.' },
      ].filter((t) => t.frequency <= freeTextEntries.length),
    };

    return {
      themeSummary,
      suggestions: [
        { theme: 'Tooling', suggestionText: 'Audit current software subscriptions and gather feedback on the primary tools slowing down workflows.', priority: 'high' as const },
        { theme: 'Communication', suggestionText: "Implement a 'No Meeting Wednesday' policy to increase focus time.", priority: 'medium' as const },
        { theme: 'Wellbeing', suggestionText: 'Provide additional resources or stipends for home office setups.', priority: 'low' as const },
      ],
    };
  },

  /** Used when there's no usable free text at all — still gives the admin something actionable from the score alone. */
  generateFallbackSuggestions(overallScore: number, sentimentBreakdown: { positive: number; neutral: number; negative: number }) {
    if (overallScore >= 80) {
      return [
        { theme: 'Engagement', suggestionText: 'Scores are strong this cycle — consider publicly recognizing teams and capturing what is working well before the next cycle.', priority: 'low' as const },
      ];
    }
    if (sentimentBreakdown.negative >= 40) {
      return [
        { theme: 'Engagement', suggestionText: 'A significant share of ratings were negative this cycle — consider follow-up listening sessions to understand root causes before the next survey.', priority: 'high' as const },
      ];
    }
    return [
      { theme: 'Engagement', suggestionText: 'Encourage more employees to add free-text feedback next cycle — ratings alone limit how specific these suggestions can be.', priority: 'medium' as const },
    ];
  },
};
