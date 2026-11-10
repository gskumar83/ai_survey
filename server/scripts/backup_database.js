const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFilePath = path.join(backupDir, `backup_${timestamp}.json`);
  console.log(`📦 Creating complete database backup at: ${backupFilePath}`);

  const backupData = {
    metadata: {
      timestamp: new Date().toISOString(),
      database_url: process.env.DATABASE_URL ? 'mongodb://127.0.0.1:27017/survey-ai (configured)' : 'unknown',
      node_env: process.env.NODE_ENV || 'development',
    },
    collections: {}
  };

  // Fetch all collections in order
  const [
    admins,
    companies,
    company_branches,
    employees,
    questions,
    surveys,
    survey_questions,
    survey_cycles,
    survey_assignments,
    responses,
    response_answers,
    analysis_results,
    suggestions,
    reports
  ] = await Promise.all([
    prisma.admins.findMany(),
    prisma.companies.findMany(),
    prisma.company_branches.findMany(),
    prisma.employees.findMany(),
    prisma.questions.findMany(),
    prisma.surveys.findMany(),
    prisma.survey_questions.findMany(),
    prisma.survey_cycles.findMany(),
    prisma.survey_assignments.findMany(),
    prisma.responses.findMany(),
    prisma.response_answers.findMany(),
    prisma.analysis_results.findMany(),
    prisma.suggestions.findMany(),
    prisma.reports.findMany(),
  ]);

  backupData.collections.admins = admins;
  backupData.collections.companies = companies;
  backupData.collections.company_branches = company_branches;
  backupData.collections.employees = employees;
  backupData.collections.questions = questions;
  backupData.collections.surveys = surveys;
  backupData.collections.survey_questions = survey_questions;
  backupData.collections.survey_cycles = survey_cycles;
  backupData.collections.survey_assignments = survey_assignments;
  backupData.collections.responses = responses;
  backupData.collections.response_answers = response_answers;
  backupData.collections.analysis_results = analysis_results;
  backupData.collections.suggestions = suggestions;
  backupData.collections.reports = reports;

  // Try raw departments collection if present
  try {
    const rawDepts = await prisma.$runCommandRaw({
      find: 'departments',
      filter: {}
    });
    backupData.collections.departments = (rawDepts.cursor && rawDepts.cursor.firstBatch) || [];
  } catch (e) {
    backupData.collections.departments = [];
  }

  // Count summaries
  backupData.metadata.counts = {
    admins: admins.length,
    companies: companies.length,
    company_branches: company_branches.length,
    employees: employees.length,
    questions: questions.length,
    surveys: surveys.length,
    survey_questions: survey_questions.length,
    survey_cycles: survey_cycles.length,
    survey_assignments: survey_assignments.length,
    responses: responses.length,
    response_answers: response_answers.length,
    analysis_results: analysis_results.length,
    suggestions: suggestions.length,
    reports: reports.length,
    departments: backupData.collections.departments.length,
  };

  // Write file
  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf-8');

  // Verify file written and readable
  const stat = fs.statSync(backupFilePath);
  if (stat.size === 0) {
    throw new Error('Backup file was written but is 0 bytes!');
  }

  const readBack = JSON.parse(fs.readFileSync(backupFilePath, 'utf-8'));
  console.log(`✅ Backup successfully verified!`);
  console.log(`📁 File Size: ${(stat.size / 1024).toFixed(2)} KB`);
  console.log(`📊 Records backed up:`);
  Object.entries(readBack.metadata.counts).forEach(([coll, count]) => {
    console.log(`   - ${coll}: ${count}`);
  });

  return { backupFilePath, counts: readBack.metadata.counts };
}

if (require.main === module) {
  createBackup()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ Backup failed:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { createBackup };
