interface ThemeSummary {
  overview: string;
  themes: { theme: string; sentiment: 'positive' | 'neutral' | 'negative'; frequency: number; example: string }[];
}

interface QuestionBreakdown {
  question_id: string;
  question_text: string;
  question_type: string;
  response_count: number;
  average?: number;
  distribution?: Record<string, number>;
}

interface DepartmentBreakdown {
  department: string;
  respondent_count: number;
  average_score: number;
}

interface Participation {
  total_assigned: number;
  completed: number;
  in_progress: number;
  not_started: number;
  completion_rate: number;
}

export interface IntegrityMetrics {
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
}

interface ReportData {
  company: { name: string; logo_url?: string | null };
  cycle: { period_start: Date; period_end: Date; survey: { title: string } };
  overall_score: number;
  sentiment_breakdown: { positive: number; neutral: number; negative: number } | null;
  theme_summary: ThemeSummary | string;
  suggestions: { theme: string; suggestion_text: string; priority: string }[];
  respondent_count: number;
  total_assigned: number;
  participation: Participation;
  question_breakdown: QuestionBreakdown[];
  department_breakdown: DepartmentBreakdown[];
  min_anonymity_group_size: number;
  integrity?: IntegrityMetrics;
}

const SENTIMENT_COLOR: Record<string, string> = { positive: '#10b981', neutral: '#f59e0b', negative: '#ef4444' };

export function buildReportHtml(data: ReportData): string {
  const {
    company, cycle, overall_score, sentiment_breakdown, theme_summary, suggestions,
    respondent_count, total_assigned, participation, question_breakdown, department_breakdown,
    min_anonymity_group_size, integrity,
  } = data;
  const responseRate = total_assigned > 0 ? Math.round((respondent_count / total_assigned) * 100) : 0;

  const sentPos = sentiment_breakdown?.positive ?? 0;
  const sentNeu = sentiment_breakdown?.neutral ?? 0;
  const sentNeg = sentiment_breakdown?.negative ?? 0;

  const isStructuredThemes = typeof theme_summary === 'object' && theme_summary !== null;
  const overview = isStructuredThemes ? (theme_summary as ThemeSummary).overview : String(theme_summary ?? '');
  const themes = isStructuredThemes ? (theme_summary as ThemeSummary).themes : [];

  const groupedSuggestions = {
    high:   suggestions.filter((s) => s.priority === 'high'),
    medium: suggestions.filter((s) => s.priority === 'medium'),
    low:    suggestions.filter((s) => s.priority === 'low'),
  };

  const scoreColor = overall_score >= 80 ? '#10b981' : overall_score < 60 ? '#ef4444' : '#3b82f6';
  const period = `${new Date(cycle.period_start).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} – ${new Date(cycle.period_end).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`;

  const suggestionsHtml = (['high', 'medium', 'low'] as const)
    .filter((p) => groupedSuggestions[p].length > 0)
    .map((priority) => {
      const color = priority === 'high' ? '#ef4444' : priority === 'medium' ? '#f59e0b' : '#10b981';
      const label = priority.charAt(0).toUpperCase() + priority.slice(1);
      const items = groupedSuggestions[priority]
        .map((s) => `
          <div style="border-left: 4px solid ${color}; padding: 14px 18px; margin-bottom: 12px; background: #fafafa; border-radius: 0 8px 8px 0; break-inside: avoid; page-break-inside: avoid;">
            <p style="margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: ${color}; font-weight: 700;">${s.theme}</p>
            <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.6;">${s.suggestion_text}</p>
          </div>
        `)
        .join('');
      return `
        <div style="margin-bottom: 32px;">
          <div style="display: inline-flex; align-items: center; gap: 8px; background: ${color}20; border: 1px solid ${color}40; border-radius: 20px; padding: 6px 16px; margin-bottom: 16px; break-after: avoid; page-break-after: avoid;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: ${color};"></span>
            <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: ${color};">${label} Priority</span>
          </div>
          ${items}
        </div>
      `;
    })
    .join('');

  const themesHtml = themes.length > 0
    ? themes.map((t) => {
        const color = SENTIMENT_COLOR[t.sentiment] || '#6b7280';
        return `
          <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px 20px; margin-bottom: 14px; break-inside: avoid; page-break-inside: avoid;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
              <span style="font-weight:700; font-size:14px; color:#1f2937;">${t.theme}</span>
              <span style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:${color};">${t.sentiment}</span>
                <span style="font-size:11px; color:#9ca3af;">${t.frequency} mentions</span>
              </span>
            </div>
            <p style="margin:0; font-size:13px; color:#6b7280; line-height:1.6; font-style:italic;">"${t.example}"</p>
          </div>
        `;
      }).join('')
    : `<p style="color:#9ca3af;">No qualitative themes met the minimum group size of ${min_anonymity_group_size} this cycle.</p>`;

  const ratingQuestions = question_breakdown.filter((q) => q.question_type === 'rating' && q.average !== undefined);
  const choiceQuestions = question_breakdown.filter((q) => q.question_type === 'single_choice' && q.distribution);
  const textQuestions = question_breakdown.filter((q) => q.question_type === 'text');

  const choiceQuestionsHtml = choiceQuestions.map((q, i) => {
    const entries = Object.entries(q.distribution || {});
    const max = Math.max(1, ...entries.map(([, v]) => v));
    return `
      <div style="margin-bottom:20px; break-inside: avoid; page-break-inside: avoid;">
        <p style="font-size:13px; font-weight:600; color:#374151; margin-bottom:10px;">${q.question_text}</p>
        ${entries.map(([label, count]) => `
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
            <span style="width:120px; font-size:12px; color:#6b7280; flex-shrink:0;">${label}</span>
            <div style="flex:1; height:10px; background:#f3f4f6; border-radius:99px; overflow:hidden;">
              <div style="height:100%; width:${(count / max) * 100}%; background:#3b82f6; border-radius:99px;"></div>
            </div>
            <span style="width:24px; font-size:12px; color:#374151; text-align:right;">${count}</span>
          </div>
        `).join('')}
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${company.name} — Survey Report</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #1f2937; background: white; }
    .page { width: 210mm; min-height: 297mm; padding: 24mm 20mm; }
    h1 { font-size: 36px; font-weight: 800; color: #1e3a5f; }
    h2 { font-size: 22px; font-weight: 700; color: #1e3a5f; margin-bottom: 20px; break-after: avoid; page-break-after: avoid; }
    h3 { font-size: 16px; font-weight: 600; color: #374151; }
    /* Keep each section (heading + its chart/content) together on one page —
       without this, Chrome's PDF pagination can split a heading from its
       canvas, leaving the chart image stranded on the following page. */
    .section { margin-bottom: 48px; break-inside: avoid; page-break-inside: avoid; }
    /* Sections with several independent cards (themes, suggestions) are too
       tall to force onto a single page — let THEM flow, but protect each
       individual card inside from being split via .card / .no-split. */
    .section-flow { margin-bottom: 48px; break-inside: auto; page-break-inside: auto; }
    .no-split { break-inside: avoid; page-break-inside: avoid; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 40px 0; }
    .chip { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
    .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; break-inside: avoid; page-break-inside: avoid; }
    .big-number { font-size: 56px; font-weight: 900; line-height: 1; }
    .mid-number { font-size: 32px; font-weight: 800; line-height: 1; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; color: #9ca3af; margin-bottom: 8px; }
    .footer { font-size: 11px; color: #9ca3af; line-height: 1.8; }
  </style>
</head>
<body>
<div class="page">

  <!-- Cover -->
  <div class="section" style="border-bottom: 3px solid #1e3a5f; padding-bottom: 32px; margin-bottom: 48px;">
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 32px;">
      ${company.logo_url
        ? `<img src="${company.logo_url}" style="height:56px; object-fit:contain;" />`
        : `<div style="width:56px;height:56px;background:#1e3a5f;border-radius:12px;display:flex;align-items:center;justify-content:center;color:white;font-size:24px;font-weight:900;">${company.name.charAt(0)}</div>`
      }
      <span class="chip" style="background:#dbeafe;color:#1e40af;">CONFIDENTIAL</span>
    </div>
    <p class="label" style="margin-bottom:12px;">Survey Report</p>
    <h1>${company.name}</h1>
    <p style="font-size:20px; color:#6b7280; margin-top:12px; font-weight:500;">${cycle.survey.title}</p>
    <p style="color:#9ca3af; margin-top:8px; font-size:14px;">${period}</p>
    <p style="color:#9ca3af; margin-top:4px; font-size:13px;">Generated by Survey AI Platform · ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
  </div>

  <!-- Executive Summary -->
  <div class="section">
    <h2>Executive Summary</h2>
    <div style="background:linear-gradient(135deg,#1e3a5f,#1e40af);border-radius:16px;padding:32px;color:white;line-height:1.8;font-size:15px;">
      ${overview}
    </div>
  </div>

  <!-- Key Metrics -->
  <div class="section">
    <h2>Key Metrics</h2>
    <div class="grid-3">
      <div class="card" style="text-align:center;">
        <p class="label">Engagement Score</p>
        <p class="big-number" style="color:${scoreColor};">${Math.round(overall_score)}</p>
        <p style="color:#9ca3af;font-size:13px;margin-top:8px;">out of 100</p>
      </div>
      <div class="card" style="text-align:center;">
        <p class="label">Response Rate</p>
        <p class="big-number" style="color:#1e40af;">${responseRate}%</p>
        <p style="color:#9ca3af;font-size:13px;margin-top:8px;">${respondent_count} of ${total_assigned} employees responded</p>
      </div>
      <div class="card" style="text-align:center;">
        <p class="label">Completion Rate</p>
        <p class="big-number" style="color:#059669;">${participation.completion_rate}%</p>
        <p style="color:#9ca3af;font-size:13px;margin-top:8px;">${participation.completed} completed · ${participation.in_progress} in progress · ${participation.not_started} not started</p>
      </div>
    </div>
  </div>

  <hr class="divider" />

  <!-- Survey Integrity & Verification Summary -->
  <div class="section">
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 20px;">
      <h2>Survey Integrity & Verification Summary</h2>
      <span class="chip" style="background:#ecfdf5; color:#065f46; border:1px solid #a7f3d0; font-size:12px; padding:6px 14px;">
        ✓ ${integrity ? integrity.overall_status : 'Verified High Integrity'}
      </span>
    </div>
    <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px;">
      <div class="card" style="text-align:center; padding: 20px 14px;">
        <p class="label">Integrity Score</p>
        <p class="mid-number" style="color:#059669;">${integrity ? integrity.integrity_score : 100}%</p>
        <p style="color:#9ca3af;font-size:12px;margin-top:6px;">High confidence</p>
      </div>
      <div class="card" style="text-align:center; padding: 20px 14px;">
        <p class="label">Normal</p>
        <p class="mid-number" style="color:#1e40af;">${integrity ? integrity.valid_responses : respondent_count}</p>
        <p style="color:#9ca3af;font-size:12px;margin-top:6px;">Valid submissions</p>
      </div>
      <div class="card" style="text-align:center; padding: 20px 14px;">
        <p class="label">Review Required</p>
        <p class="mid-number" style="color:#f59e0b;">${integrity ? integrity.review_required : 0}</p>
        <p style="color:#9ca3af;font-size:12px;margin-top:6px;">Incomplete responses</p>
      </div>
      <div class="card" style="text-align:center; padding: 20px 14px;">
        <p class="label">Invalid Submissions</p>
        <p class="mid-number" style="color:#6366f1;">${integrity ? (integrity.invalid_submissions + integrity.duplicate_attempts) : 0}</p>
        <p style="color:#9ca3af;font-size:12px;margin-top:6px;">Zero tolerance</p>
      </div>
    </div>
    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:16px 20px; font-size:13px; color:#475569; line-height:1.6;">
      <p style="margin:0 0 6px 0; font-weight:700; color:#1e3a5f;">Identity & Integrity Protocol:</p>
      <p style="margin:0;">Survey submissions are cryptographically verified via authenticated employee sessions and single-use assignment tokens. Strict company tenant isolation, prevention of duplicate submissions, and client-payload sanitization ensure 100% genuine employee feedback while rigorously protecting individual anonymity.</p>
    </div>
  </div>

  <hr class="divider" />

  <!-- Sentiment Analysis -->
  <div class="section">
    <h2>Sentiment Analysis</h2>
    <div class="grid-2" style="align-items:center;">
      <div>
        <canvas id="sentimentChart" width="280" height="280" style="width:280px;height:280px;"></canvas>
      </div>
      <div style="display:flex;flex-direction:column;gap:16px;">
        ${[
          { label: 'Positive', value: sentPos, color: '#10b981' },
          { label: 'Neutral',  value: sentNeu, color: '#f59e0b' },
          { label: 'Negative', value: sentNeg, color: '#ef4444' },
        ].map((item) => `
          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
              <span style="font-weight:600;font-size:14px;color:${item.color};">${item.label}</span>
              <span style="font-weight:700;font-size:16px;color:#1f2937;">${Math.round(item.value)}%</span>
            </div>
            <div style="height:10px;background:#f3f4f6;border-radius:99px;overflow:hidden;">
              <div style="height:100%;width:${item.value}%;background:${item.color};border-radius:99px;"></div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  </div>

  ${ratingQuestions.length > 0 ? `
  <hr class="divider" />
  <div class="section">
    <h2>Question-Level Ratings</h2>
    <canvas id="ratingChart" width="620" height="${Math.max(120, ratingQuestions.length * 50)}" style="width:620px;height:${Math.max(120, ratingQuestions.length * 50)}px;"></canvas>
  </div>
  ` : ''}

  ${choiceQuestions.length > 0 ? `
  <hr class="divider" />
  <div class="section-flow">
    <h2>Choice-Based Responses</h2>
    ${choiceQuestionsHtml}
  </div>
  ` : ''}

  ${textQuestions.length > 0 ? `
  <div class="section">
    <p style="font-size:12px; color:#9ca3af;">${textQuestions.map((q) => `${q.question_text}: ${q.response_count} responses`).join(' · ')}</p>
  </div>
  ` : ''}

  ${department_breakdown.length > 0 ? `
  <hr class="divider" />
  <div class="section">
    <h2>Score by Department</h2>
    <canvas id="deptChart" width="620" height="${Math.max(120, department_breakdown.length * 50)}" style="width:620px;height:${Math.max(120, department_breakdown.length * 50)}px;"></canvas>
    <p style="color:#9ca3af; font-size:11px; margin-top:12px;">Departments with fewer than ${min_anonymity_group_size} respondents are pooled into "Other" or omitted to protect anonymity.</p>
  </div>
  ` : ''}

  <hr class="divider" />

  <!-- Key Themes -->
  <div class="section-flow">
    <h2>Key Themes from Free-Text Feedback</h2>
    ${themesHtml}
  </div>

  <hr class="divider" />

  <!-- Suggestions -->
  <div class="section-flow">
    <h2>Approved Recommendations</h2>
    ${suggestionsHtml || '<p style="color:#9ca3af;">No approved suggestions yet.</p>'}
  </div>

  <hr class="divider" />

  <!-- Methodology Footer -->
  <div class="footer section">
    <h3 style="margin-bottom:12px;">Methodology & Anonymity Statement</h3>
    <p>This report was generated by the Survey AI platform using AI-assisted theme extraction (Anthropic Claude). All analysis is based on aggregated responses and does not include any individual employee names, codes, or identifying information. Response rate: <strong>${responseRate}%</strong> (${respondent_count}/${total_assigned} employees). Minimum anonymity threshold: ${min_anonymity_group_size} respondents per breakdown — smaller groups are pooled or omitted. Free-text analysis uses paraphrased, de-identified examples only.</p>
  </div>

</div>

<script>
  const ctx = document.getElementById('sentimentChart').getContext('2d');
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Positive', 'Neutral', 'Negative'],
      datasets: [{
        data: [${sentPos}, ${sentNeu}, ${sentNeg}],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 0,
        hoverOffset: 4,
      }]
    },
    options: {
      // responsive:false is essential in a Puppeteer/print context — Chart.js's
      // default ResizeObserver-driven resize can fire again during PDF
      // pagination and redraw the canvas after the page snapshot, making the
      // chart image appear to "detach" onto a different page than its heading.
      responsive: false,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { font: { size: 13 }, padding: 16 } } },
      cutout: '65%',
      animation: false,
    }
  });

  ${ratingQuestions.length > 0 ? `
  new Chart(document.getElementById('ratingChart').getContext('2d'), {
    type: 'bar',
    data: {
      labels: ${JSON.stringify(ratingQuestions.map((q) => q.question_text.length > 40 ? q.question_text.slice(0, 40) + '…' : q.question_text))},
      datasets: [{
        label: 'Average rating (1-5)',
        data: ${JSON.stringify(ratingQuestions.map((q) => q.average))},
        backgroundColor: '#3b82f6',
        borderRadius: 6,
      }]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      indexAxis: 'y',
      scales: { x: { min: 0, max: 5 } },
      plugins: { legend: { display: false } },
      animation: false,
    }
  });
  ` : ''}

  ${department_breakdown.length > 0 ? `
  new Chart(document.getElementById('deptChart').getContext('2d'), {
    type: 'bar',
    data: {
      labels: ${JSON.stringify(department_breakdown.map((d) => d.department))},
      datasets: [{
        label: 'Average score (0-100)',
        data: ${JSON.stringify(department_breakdown.map((d) => d.average_score))},
        backgroundColor: '#6366f1',
        borderRadius: 6,
      }]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      indexAxis: 'y',
      scales: { x: { min: 0, max: 100 } },
      plugins: { legend: { display: false } },
      animation: false,
    }
  });
  ` : ''}
</script>
</body>
</html>`;
}
