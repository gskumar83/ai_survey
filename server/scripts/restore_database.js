const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function restoreBackup(backupFilePath) {
  if (!backupFilePath) {
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      throw new Error(`Backup directory not found at: ${backupDir}`);
    }
    const files = fs.readdirSync(backupDir).filter(f => f.startsWith('backup_') && f.endsWith('.json')).sort().reverse();
    if (files.length === 0) {
      throw new Error('No backup files found in server/backups/');
    }
    backupFilePath = path.join(backupDir, files[0]);
  }

  console.log(`🔄 Restoring database from backup: ${backupFilePath}`);
  const data = JSON.parse(fs.readFileSync(backupFilePath, 'utf-8'));
  const collections = data.collections;

  // Clear existing records in foreign-key safe order
  await prisma.response_answers.deleteMany({});
  await prisma.responses.deleteMany({});
  await prisma.suggestions.deleteMany({});
  await prisma.analysis_results.deleteMany({});
  await prisma.reports.deleteMany({});
  await prisma.survey_assignments.deleteMany({});
  await prisma.survey_questions.deleteMany({});
  await prisma.survey_cycles.deleteMany({});
  await prisma.surveys.deleteMany({});
  await prisma.questions.deleteMany({});
  await prisma.employees.deleteMany({});
  await prisma.company_branches.deleteMany({});
  await prisma.companies.deleteMany({});
  await prisma.admins.deleteMany({});

  // Restore admins
  for (const a of collections.admins || []) {
    await prisma.admins.create({
      data: {
        id: a.id,
        admin_code: a.admin_code,
        name: a.name,
        email: a.email,
        password_hash: a.password_hash,
        is_activated: a.is_activated,
        activated_at: a.activated_at ? new Date(a.activated_at) : null,
        created_at: a.created_at ? new Date(a.created_at) : new Date(),
      }
    });
  }

  // Restore companies
  for (const c of collections.companies || []) {
    await prisma.companies.create({
      data: {
        id: c.id,
        name: c.name,
        company_code: c.company_code,
        logo_url: c.logo_url,
        official_email: c.official_email,
        contact_number: c.contact_number,
        address: c.address,
        industry: c.industry,
        website: c.website,
        created_by_admin_id: c.created_by_admin_id,
        status: c.status || 'Active',
        default_language: c.default_language || 'en',
        supported_languages: c.supported_languages || [],
        created_at: c.created_at ? new Date(c.created_at) : new Date(),
      }
    });
  }

  // Restore branches
  for (const b of collections.company_branches || []) {
    await prisma.company_branches.create({
      data: {
        id: b.id,
        company_id: b.company_id,
        address_line: b.address_line,
        city: b.city,
        state: b.state,
        country: b.country,
        pincode: b.pincode,
      }
    });
  }

  // Restore employees
  for (const e of collections.employees || []) {
    await prisma.employees.create({
      data: {
        id: e.id,
        employee_code: e.employee_code,
        name: e.name,
        email: e.email,
        phone: e.phone,
        department: e.department,
        password_hash: e.password_hash,
        company_id: e.company_id,
        is_first_login: e.is_first_login || false,
        created_at: e.created_at ? new Date(e.created_at) : new Date(),
      }
    });
  }

  // Restore questions
  for (const q of collections.questions || []) {
    await prisma.questions.create({
      data: {
        id: q.id,
        company_id: q.company_id,
        question_text: q.question_text,
        question_type: q.question_type,
        options_json: q.options_json,
        translations_json: q.translations_json,
        created_at: q.created_at ? new Date(q.created_at) : new Date(),
      }
    });
  }

  // Restore surveys
  for (const s of collections.surveys || []) {
    await prisma.surveys.create({
      data: {
        id: s.id,
        company_id: s.company_id,
        title: s.title,
        is_enabled: s.is_enabled,
        created_by_admin_id: s.created_by_admin_id,
        translations_json: s.translations_json,
        created_at: s.created_at ? new Date(s.created_at) : new Date(),
      }
    });
  }

  // Restore survey_questions
  for (const sq of collections.survey_questions || []) {
    await prisma.survey_questions.create({
      data: {
        id: sq.id,
        survey_id: sq.survey_id,
        question_id: sq.question_id,
        display_order: sq.display_order,
      }
    });
  }

  // Restore survey_cycles
  for (const cy of collections.survey_cycles || []) {
    await prisma.survey_cycles.create({
      data: {
        id: cy.id,
        company_id: cy.company_id,
        survey_id: cy.survey_id,
        period_start: new Date(cy.period_start),
        period_end: new Date(cy.period_end),
        status: cy.status,
      }
    });
  }

  // Restore survey_assignments
  for (const sa of collections.survey_assignments || []) {
    await prisma.survey_assignments.create({
      data: {
        id: sa.id,
        survey_cycle_id: sa.survey_cycle_id,
        employee_id: sa.employee_id,
        status: sa.status,
        assigned_at: sa.assigned_at ? new Date(sa.assigned_at) : new Date(),
        completed_at: sa.completed_at ? new Date(sa.completed_at) : null,
      }
    });
  }

  // Restore responses
  for (const r of collections.responses || []) {
    await prisma.responses.create({
      data: {
        id: r.id,
        survey_assignment_id: r.survey_assignment_id,
        employee_id: r.employee_id,
        company_id: r.company_id,
        submitted_at: r.submitted_at ? new Date(r.submitted_at) : new Date(),
      }
    });
  }

  // Restore response_answers
  for (const ra of collections.response_answers || []) {
    await prisma.response_answers.create({
      data: {
        id: ra.id,
        response_id: ra.response_id,
        question_id: ra.question_id,
        answer_value: ra.answer_value,
      }
    });
  }

  console.log(`✅ Database restoration completed successfully from ${backupFilePath}`);
}

if (require.main === module) {
  const fileArg = process.argv[2];
  restoreBackup(fileArg)
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ Restore failed:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { restoreBackup };
