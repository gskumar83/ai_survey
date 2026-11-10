import fs from 'fs';
import puppeteer from 'puppeteer';
import prisma from '../prisma';
import { storageService } from './storage.service';
import { scoringService } from './scoring.service';
import { buildReportHtml } from '../templates/report.html';
import { AdminScope } from '../middleware/auth.middleware';

function resolveChromePath(): string | undefined {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return undefined;
}

export const reportService = {
  async generateReport(cycleId: string, adminScope: AdminScope): Promise<{ pdf_url: string; reportId: string }> {
    // ── 1. Fetch all necessary data ──────────────────────────────────────────
    const cycle = await prisma.survey_cycles.findUnique({
      where: { id: cycleId },
      include: {
        company: true,
        survey: true,
        survey_assignments: {
          include: {
            responses: {
              include: {
                response_answers: { include: { question: true } },
              },
            },
          },
        },
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

    let analysis = await prisma.analysis_results.findUnique({
      where: { survey_cycle_id: cycleId },
      include: {
        suggestions: {
          where: { is_admin_approved: true },
        },
      },
    });

    if (!analysis) {
      const { aiService } = await import('./ai.service');
      await aiService.generateAnalysis(adminScope, cycleId);
      analysis = await prisma.analysis_results.findUnique({
        where: { survey_cycle_id: cycleId },
        include: {
          suggestions: {
            where: { is_admin_approved: true },
          },
        },
      });
    }

    if (!analysis) throw new Error('Analysis results not found. Run analysis first.');

    // ── 2. Compute response rate ─────────────────────────────────────────────
    const totalAssigned = cycle.survey_assignments.length;
    const respondentCount = cycle.survey_assignments.filter(
      (a) => a.status === 'completed',
    ).length;

    // ── 3. Parse sentiment breakdown ─────────────────────────────────────────
    let sentimentBreakdown: { positive: number; neutral: number; negative: number } | null = null;
    if (analysis.sentiment_breakdown_json) {
      try {
        sentimentBreakdown = analysis.sentiment_breakdown_json as any;
      } catch { /* ignore */ }
    }

    // ── 4. In-depth analytics (participation, per-question, per-department, integrity) ──
    const [participation, questionBreakdown, departmentBreakdown, integrity] = await Promise.all([
      scoringService.getParticipation(cycleId),
      scoringService.getQuestionBreakdown(cycleId),
      scoringService.getDepartmentBreakdown(cycleId),
      import('./integrity.service').then(m => m.integrityService.getCycleIntegrityMetrics(cycleId)),
    ]);

    // theme_summary_json may be the legacy plain-string format from older
    // analysis runs, or the newer structured { overview, themes[] } shape —
    // the template handles both.
    const themeSummary = analysis.theme_summary_json as any;

    // ── 5. Build HTML ────────────────────────────────────────────────────────
    const html = buildReportHtml({
      company: cycle.company,
      cycle: {
        period_start: cycle.period_start,
        period_end: cycle.period_end,
        survey: { title: cycle.survey.title },
      },
      overall_score: analysis.overall_score ?? 0,
      sentiment_breakdown: sentimentBreakdown,
      theme_summary: themeSummary,
      suggestions: analysis.suggestions.map((s) => ({
        theme: s.theme ?? '',
        suggestion_text: s.suggestion_text ?? '',
        priority: s.priority ?? 'low',
      })),
      respondent_count: respondentCount,
      total_assigned: totalAssigned,
      participation,
      question_breakdown: questionBreakdown,
      department_breakdown: departmentBreakdown,
      min_anonymity_group_size: scoringService.MIN_ANONYMITY_GROUP_SIZE,
      integrity,
    });

    // ── 5. Puppeteer → PDF ───────────────────────────────────────────────────
    const chromePath = resolveChromePath();
    const browser = await puppeteer.launch({
      headless: true,
      ...(chromePath ? { executablePath: chromePath } : {}),
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    let pdfBuffer: Buffer | undefined;
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });
      // Wait for Chart.js to render
      await new Promise((r) => setTimeout(r, 1500));
      pdfBuffer = Buffer.from(
        await page.pdf({ format: 'A4', printBackground: true, margin: { top: '0', bottom: '0', left: '0', right: '0' } })
      );
    } finally {
      await browser.close();
    }

    if (!pdfBuffer) {
      throw new Error('Failed to generate PDF buffer');
    }

    // ── 6. Save PDF (S3 or local) ────────────────────────────────────────────
    // storageService.uploadBuffer already branches on S3 vs. local internally
    // and returns an absolute URL either way — no need to duplicate that here.
    const filename = `report-${cycleId}-${Date.now()}.pdf`;
    const pdfUrl = await storageService.uploadBuffer(pdfBuffer, filename, 'application/pdf');

    // ── 7. Upsert report record ──────────────────────────────────────────────
    const existing = await prisma.reports.findUnique({ where: { survey_cycle_id: cycleId } });

    let report;
    if (existing) {
      report = await prisma.reports.update({
        where: { id: existing.id },
        data: {
          pdf_url: pdfUrl,
          status: 'reviewed',
          generated_at: new Date(),
          sent_by_admin_id: adminScope.adminId,
        },
      });
    } else {
      report = await prisma.reports.create({
        data: {
          survey_cycle_id: cycleId,
          company_id: cycle.company_id,
          pdf_url: pdfUrl,
          status: 'reviewed',
          generated_at: new Date(),
          sent_by_admin_id: adminScope.adminId,
        },
      });
    }

    return { pdf_url: pdfUrl, reportId: report.id };
  },
};
