const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function runCleanup() {
  console.log('🚀 Starting Approved Demo & Sample Data Cleanup...');

  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || 'bharathi.s@visteriaconsulting.com').trim().toLowerCase();
  
  // Verify super admin exists before running
  const superAdmin = await prisma.admins.findFirst({
    where: { email: { equals: superAdminEmail, mode: 'insensitive' } },
  });

  if (!superAdmin) {
    throw new Error(`CRITICAL ABORT: Super Admin account (${superAdminEmail}) not found in database! Cleanup cannot proceed.`);
  }

  console.log(`🛡️ Verified Genuine Super Admin: ${superAdmin.email} (ID: ${superAdmin.id}, Code: ${superAdmin.admin_code}) - THIS ACCOUNT WILL BE PRESERVED.`);

  // 1. Delete response answers
  const delAnswers = await prisma.response_answers.deleteMany({});
  console.log(`✓ Deleted response_answers: ${delAnswers.count}`);

  // 2. Delete responses
  const delResponses = await prisma.responses.deleteMany({});
  console.log(`✓ Deleted responses: ${delResponses.count}`);

  // 3. Delete suggestions & analysis results
  const delSuggestions = await prisma.suggestions.deleteMany({});
  console.log(`✓ Deleted suggestions: ${delSuggestions.count}`);

  const delAnalysis = await prisma.analysis_results.deleteMany({});
  console.log(`✓ Deleted analysis_results: ${delAnalysis.count}`);

  // 4. Delete reports
  const delReports = await prisma.reports.deleteMany({});
  console.log(`✓ Deleted reports: ${delReports.count}`);

  // 5. Delete survey assignments
  const delAssignments = await prisma.survey_assignments.deleteMany({});
  console.log(`✓ Deleted survey_assignments: ${delAssignments.count}`);

  // 6. Delete survey questions
  const delSurveyQuestions = await prisma.survey_questions.deleteMany({});
  console.log(`✓ Deleted survey_questions: ${delSurveyQuestions.count}`);

  // 7. Delete survey cycles
  const delCycles = await prisma.survey_cycles.deleteMany({});
  console.log(`✓ Deleted survey_cycles: ${delCycles.count}`);

  // 8. Delete surveys
  const delSurveys = await prisma.surveys.deleteMany({});
  console.log(`✓ Deleted surveys: ${delSurveys.count}`);

  // 9. Delete questions
  const delQuestions = await prisma.questions.deleteMany({});
  console.log(`✓ Deleted questions: ${delQuestions.count}`);

  // 10. Delete employees
  const delEmployees = await prisma.employees.deleteMany({});
  console.log(`✓ Deleted employees: ${delEmployees.count}`);

  // 11. Delete branches
  const delBranches = await prisma.company_branches.deleteMany({});
  console.log(`✓ Deleted company_branches: ${delBranches.count}`);

  // 12. Delete companies
  const delCompanies = await prisma.companies.deleteMany({});
  console.log(`✓ Deleted companies: ${delCompanies.count}`);

  // 13. Delete raw departments collection if present
  try {
    await prisma.$runCommandRaw({
      delete: 'departments',
      deletes: [{ q: {}, limit: 0 }]
    });
    console.log(`✓ Cleared raw departments collection`);
  } catch (e) {
    // Ignore if collection does not exist
  }

  // 14. Delete demo/test admins except the verified genuine super admin
  const delAdmins = await prisma.admins.deleteMany({
    where: {
      id: { not: superAdmin.id },
    },
  });
  console.log(`✓ Deleted demo & test administrators: ${delAdmins.count}`);

  // 15. Clean old demo upload files (test PDF reports and test company logos)
  const uploadsDir = path.join(__dirname, '../uploads');
  let cleanedUploadCount = 0;
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    for (const f of files) {
      const fullPath = path.join(uploadsDir, f);
      if (fs.statSync(fullPath).isDirectory()) {
        if (f === 'reports') {
          const reportFiles = fs.readdirSync(fullPath);
          for (const rf of reportFiles) {
            try {
              fs.unlinkSync(path.join(fullPath, rf));
              cleanedUploadCount++;
            } catch (e) {}
          }
        }
      } else if (f.startsWith('logoFile-')) {
        try {
          fs.unlinkSync(fullPath);
          cleanedUploadCount++;
        } catch (e) {}
      }
    }
  }
  console.log(`✓ Cleaned demo files in server/uploads: ${cleanedUploadCount} files removed`);

  // 16. Verify current database state
  const [
    adminCount,
    compCount,
    empCount,
    qCount,
    survCount,
    cycCount,
    asgnCount,
    respCount
  ] = await Promise.all([
    prisma.admins.count(),
    prisma.companies.count(),
    prisma.employees.count(),
    prisma.questions.count(),
    prisma.surveys.count(),
    prisma.survey_cycles.count(),
    prisma.survey_assignments.count(),
    prisma.responses.count(),
  ]);

  const preservedAdmins = await prisma.admins.findMany({
    select: { id: true, admin_code: true, name: true, email: true, is_activated: true }
  });

  console.log('\n================ POST-CLEANUP VERIFICATION ================');
  console.log(`✅ Administrators Remaining: ${adminCount}`);
  preservedAdmins.forEach(a => {
    console.log(`   - [Genuine Admin] ${a.name} | ${a.email} | Code: ${a.admin_code} | Activated: ${a.is_activated}`);
  });
  console.log(`✅ Companies: ${compCount}`);
  console.log(`✅ Employees: ${empCount}`);
  console.log(`✅ Questions: ${qCount}`);
  console.log(`✅ Surveys: ${survCount}`);
  console.log(`✅ Survey Cycles: ${cycCount}`);
  console.log(`✅ Survey Assignments: ${asgnCount}`);
  console.log(`✅ Responses: ${respCount}`);
  console.log('===========================================================\n');
}

if (require.main === module) {
  runCleanup()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Cleanup failed:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { runCleanup };
