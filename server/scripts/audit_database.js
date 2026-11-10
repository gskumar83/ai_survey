const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function audit() {
  console.log('================ DATABASE AUDIT ================');
  
  // 1. Admins
  const admins = await prisma.admins.findMany({
    select: { id: true, admin_code: true, name: true, email: true, is_activated: true, created_at: true }
  });
  console.log(`\n=== ALL ADMINS (${admins.length}) ===`);
  admins.forEach(a => {
    console.log(`[Admin] ID: ${a.id} | Code: ${a.admin_code} | Email: ${a.email} | Name: ${a.name} | Activated: ${a.is_activated}`);
  });

  // 2. Companies
  const companies = await prisma.companies.findMany({
    select: { id: true, name: true, company_code: true, official_email: true, status: true, created_at: true }
  });
  console.log(`\n=== ALL COMPANIES (${companies.length}) ===`);
  companies.forEach(c => {
    console.log(`[Company] ID: ${c.id} | Code: ${c.company_code} | Name: "${c.name}" | Email: ${c.official_email} | Status: ${c.status}`);
  });


  // 3. Branches
  const branches = await prisma.company_branches.findMany();
  console.log(`\n--- Company Branches (${branches.length}) ---`);
  branches.forEach(b => {
    console.log(`[Branch] ID: ${b.id} | CompanyID: ${b.company_id} | City: ${b.city} | Country: ${b.country}`);
  });

  // 4. Employees
  const employees = await prisma.employees.findMany({
    select: { id: true, employee_code: true, name: true, email: true, department: true, company_id: true }
  });
  console.log(`\n--- Employees (${employees.length}) ---`);
  employees.forEach(e => {
    console.log(`[Employee] ID: ${e.id} | Code: ${e.employee_code} | Name: ${e.name} | Email: ${e.email} | Dept: ${e.department} | CompanyID: ${e.company_id}`);
  });

  // 5. Surveys & Survey Cycles
  const surveys = await prisma.surveys.findMany({
    include: {
      _count: { select: { survey_questions: true, survey_cycles: true } }
    }
  });
  console.log(`\n--- Surveys (${surveys.length}) ---`);
  surveys.forEach(s => {
    console.log(`[Survey] ID: ${s.id} | Title: "${s.title}" | Enabled: ${s.is_enabled} | CompanyID: ${s.company_id} | Questions: ${s._count.survey_questions} | Cycles: ${s._count.survey_cycles}`);
  });

  const cycles = await prisma.survey_cycles.findMany();
  console.log(`\n--- Survey Cycles (${cycles.length}) ---`);
  cycles.forEach(cy => {
    console.log(`[Cycle] ID: ${cy.id} | SurveyID: ${cy.survey_id} | CompanyID: ${cy.company_id} | Status: ${cy.status} | Start: ${cy.period_start} | End: ${cy.period_end}`);
  });

  // 6. Survey Questions & Questions Bank
  const questions = await prisma.questions.findMany();
  console.log(`\n--- Questions Bank (${questions.length}) ---`);
  questions.slice(0, 5).forEach(q => {
    console.log(`[Question Sample] ID: ${q.id} | CompanyID: ${q.company_id} | Text: "${q.question_text.slice(0, 60)}..." | Type: ${q.question_type}`);
  });
  if (questions.length > 5) console.log(`... and ${questions.length - 5} more questions`);

  // 7. Survey Assignments & Responses
  const assignments = await prisma.survey_assignments.findMany();
  console.log(`\n--- Survey Assignments (${assignments.length}) ---`);

  const responses = await prisma.responses.findMany();
  console.log(`\n--- Responses (${responses.length}) ---`);

  const responseAnswers = await prisma.response_answers.findMany();
  console.log(`\n--- Response Answers (${responseAnswers.length}) ---`);

  const analysis = await prisma.analysis_results.findMany();
  console.log(`\n--- Analysis Results (${analysis.length}) ---`);

  const suggestions = await prisma.suggestions.findMany();
  console.log(`\n--- Suggestions (${suggestions.length}) ---`);

  const reports = await prisma.reports.findMany();
  console.log(`\n--- Reports (${reports.length}) ---`);

  // Check raw collections like departments
  try {
    const rawDepts = await prisma.$runCommandRaw({
      find: 'departments',
      filter: {}
    });
    console.log(`\n--- Raw Departments Collection ---`, rawDepts.cursor ? rawDepts.cursor.firstBatch.length : 0);
  } catch (e) {
    console.log('Raw departments collection error:', e.message);
  }

  console.log('\n================ END OF AUDIT ================');
}

audit()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
