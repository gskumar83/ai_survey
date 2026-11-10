const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function resetDatabase() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL SAFETY STOP: resetDatabase is strictly prohibited in production environments.');
  }

  console.log('🔄 Starting development database reset...');

  // 1. Delete dependent child records first
  const deletedAnswers = await prisma.response_answers.deleteMany({});
  console.log(`- Cleared response_answers: ${deletedAnswers.count}`);

  const deletedResponses = await prisma.responses.deleteMany({});
  console.log(`- Cleared responses: ${deletedResponses.count}`);

  const deletedSuggestions = await prisma.suggestions.deleteMany({});
  console.log(`- Cleared suggestions: ${deletedSuggestions.count}`);

  const deletedAnalysis = await prisma.analysis_results.deleteMany({});
  console.log(`- Cleared analysis_results: ${deletedAnalysis.count}`);

  const deletedReports = await prisma.reports.deleteMany({});
  console.log(`- Cleared reports: ${deletedReports.count}`);

  const deletedAssignments = await prisma.survey_assignments.deleteMany({});
  console.log(`- Cleared survey_assignments: ${deletedAssignments.count}`);

  const deletedSurveyQuestions = await prisma.survey_questions.deleteMany({});
  console.log(`- Cleared survey_questions: ${deletedSurveyQuestions.count}`);

  const deletedCycles = await prisma.survey_cycles.deleteMany({});
  console.log(`- Cleared survey_cycles: ${deletedCycles.count}`);

  const deletedSurveys = await prisma.surveys.deleteMany({});
  console.log(`- Cleared surveys: ${deletedSurveys.count}`);

  const deletedQuestions = await prisma.questions.deleteMany({});
  console.log(`- Cleared questions: ${deletedQuestions.count}`);

  const deletedEmployees = await prisma.employees.deleteMany({});
  console.log(`- Cleared employees: ${deletedEmployees.count}`);

  const deletedBranches = await prisma.company_branches.deleteMany({});
  console.log(`- Cleared company_branches: ${deletedBranches.count}`);

  const deletedCompanies = await prisma.companies.deleteMany({});
  console.log(`- Cleared companies: ${deletedCompanies.count}`);

  try {
    await prisma.$runCommandRaw({
      delete: 'departments',
      deletes: [{ q: {}, limit: 0 }]
    });
    console.log('- Cleared departments collection');
  } catch (e) {
    console.warn('- Could not clear departments collection:', e.message);
  }

  // 2. Ensure official Super Admin account from environment exists and is preserved
  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || 'bharathi.s@visteriaconsulting.com').trim().toLowerCase();
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
  const superAdminName = process.env.SUPER_ADMIN_NAME || 'Bharathi S';

  let superAdmin = await prisma.admins.findFirst({
    where: { email: { equals: superAdminEmail, mode: 'insensitive' } }
  });

  if (superAdmin) {
    if (superAdminPassword) {
      const passwordHash = await bcrypt.hash(superAdminPassword, 10);
      await prisma.admins.update({
        where: { id: superAdmin.id },
        data: {
          name: superAdminName,
          password_hash: passwordHash,
          is_activated: true,
        },
      });
    }
    console.log(`✓ Preserved official Super Admin: ${superAdminEmail}`);
  } else if (superAdminPassword) {
    const passwordHash = await bcrypt.hash(superAdminPassword, 10);
    superAdmin = await prisma.admins.create({
      data: {
        admin_code: 'VCS_ADM_BHA_001',
        name: superAdminName,
        email: superAdminEmail,
        password_hash: passwordHash,
        is_activated: true,
        activated_at: new Date(),
      },
    });
    console.log(`✓ Official Super Admin initialized: ${superAdminEmail}`);
  }

  // Remove any obsolete test admin accounts
  if (superAdmin) {
    const extraAdmins = await prisma.admins.deleteMany({
      where: { id: { not: superAdmin.id } }
    });
    if (extraAdmins.count > 0) {
      console.log(`- Cleared extra admin test accounts: ${extraAdmins.count}`);
    }
  }

  // 3. Clean uploads directory (reports and logos), preserving folders
  const uploadsDir = path.join(__dirname, 'uploads');
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    for (const f of files) {
      const fullPath = path.join(uploadsDir, f);
      if (fs.statSync(fullPath).isDirectory()) {
        if (f === 'reports') {
          const reportFiles = fs.readdirSync(fullPath);
          for (const rf of reportFiles) {
            try { fs.unlinkSync(path.join(fullPath, rf)); } catch (e) {}
          }
        }
      } else {
        try { fs.unlinkSync(fullPath); } catch (e) {}
      }
    }
    console.log('✓ Cleaned uploaded files and PDF reports in uploads/');
  }

  // Final summary verification
  const [adminCount, compCount, empCount, survCount, cycCount, asgnCount, respCount] = await Promise.all([
    prisma.admins.count(),
    prisma.companies.count(),
    prisma.employees.count(),
    prisma.surveys.count(),
    prisma.survey_cycles.count(),
    prisma.survey_assignments.count(),
    prisma.responses.count(),
  ]);

  console.log('\n📊 Database Status After Reset:');
  console.log(`- Admins: ${adminCount} (admin@visteria.com)`);
  console.log(`- Companies: ${compCount}`);
  console.log(`- Employees: ${empCount}`);
  console.log(`- Surveys: ${survCount}`);
  console.log(`- Survey Cycles: ${cycCount}`);
  console.log(`- Assignments: ${asgnCount}`);
  console.log(`- Responses: ${respCount}`);
  console.log('✅ Clean Database State Ready for Testing!\n');
}

if (require.main === module) {
  resetDatabase()
    .catch((err) => {
      console.error('❌ Reset failed:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { resetDatabase };
