require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_SEED_IN_PRODUCTION) {
    throw new Error('CRITICAL SAFETY STOP: Seeding scripts are disabled in production environments.');
  }

  // Support CLI args: node seed_default_admin.js <email> <password> [name] [--reset-activation]
  const args = process.argv.slice(2);
  const email = (args[0] || process.env.SUPER_ADMIN_EMAIL || process.env.AUTHORIZED_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const rawPassword = args[1] || process.env.SUPER_ADMIN_PASSWORD || process.env.AUTHORIZED_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
  const adminName = args[2] || process.env.SUPER_ADMIN_NAME || process.env.AUTHORIZED_ADMIN_NAME || process.env.ADMIN_NAME || 'Bharathi S';
  const resetActivation = process.argv.includes('--reset-activation');

  if (!email || !rawPassword) {
    throw new Error('Missing admin email or password. Please provide CLI arguments or configure SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD in .env');
  }

  const existing = await prisma.admins.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  });

  const hash = await bcrypt.hash(rawPassword, 10);
  const isActivated = !resetActivation;
  const activatedAt = isActivated ? new Date() : null;

  let admin = existing;
  if (existing) {
    admin = await prisma.admins.update({
      where: { id: existing.id },
      data: {
        email,
        password_hash: hash,
        name: adminName,
        is_activated: isActivated,
        activated_at: activatedAt,
      },
    });
    console.log(`✅ Updated authorized admin with Email: "${email}", Name: "${adminName}", Activated: ${isActivated}`);
  } else {
    admin = await prisma.admins.create({
      data: {
        name: adminName,
        email,
        password_hash: hash,
        is_activated: isActivated,
        activated_at: activatedAt,
      },
    });
    console.log(`✅ Created authorized admin with Email: "${email}", Name: "${adminName}", Activated: ${isActivated}, ID: ${admin.id}`);
  }

  // Link all companies and surveys to this admin
  const compUpdate = await prisma.companies.updateMany({
    data: { created_by_admin_id: admin.id }
  });
  console.log('Linked companies to default admin:', compUpdate.count);

  const survUpdate = await prisma.surveys.updateMany({
    data: { created_by_admin_id: admin.id }
  });
  console.log('Linked surveys to default admin:', survUpdate.count);

  // Also verify companies
  const companies = await prisma.companies.findMany();
  console.log('Total companies in DB:', companies.length);
  const surveys = await prisma.surveys.findMany();
  console.log('Total surveys in DB:', surveys.length);
  const cycles = await prisma.survey_cycles.findMany();
  console.log('Total survey cycles in DB:', cycles.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
