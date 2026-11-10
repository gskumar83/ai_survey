require('dotenv').config();
const path = require('path');
const fs = require('fs');
const net = require('net');
const bcrypt = require('bcrypt');

function isPortOpen(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function main() {
  const args = process.argv.slice(2);
  let replSet = null;

  // Ensure DB is running
  const isUp = await isPortOpen(27017);
  if (!isUp) {
    console.log('🍃 Starting local persistent MongoDB replica set...');
    const { MongoMemoryReplSet } = require('mongodb-memory-server');
    const dbPath = path.join(__dirname, '../.mongodb_data');
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true });
    }
    replSet = await MongoMemoryReplSet.create({
      replSet: {
        name: 'rs0',
        count: 1,
        storageEngine: 'wiredTiger',
        dbPath,
      },
      instanceOpts: [{ port: 27017, dbPath }],
    });
  }

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    if (args.includes('--list')) {
      const admins = await prisma.admins.findMany({
        select: {
          id: true,
          admin_code: true,
          name: true,
          email: true,
          is_activated: true,
          created_at: true,
        },
      });
      console.log('\n📋 CURRENT REGISTERED ADMINISTRATORS:');
      console.table(admins);
      return;
    }

    if (args.includes('--clean-demos')) {
      const del = await prisma.admins.deleteMany({
        where: {
          email: { in: ['admin@visteria.com', 'admin@example.com', 'testadmin@example.com'] },
        },
      });
      console.log(`🧹 Removed ${del.count} demo/test admin account(s).`);
      return;
    }

    const email = (args[0] || '').trim().toLowerCase();
    const rawPassword = args[1];
    const adminName = args[2] || 'Visteria Administrator';

    if (!email || !rawPassword) {
      console.log('\n❌ Usage:');
      console.log('  node set_admin_credentials.js <your_email> <your_password> [your_name]');
      console.log('  node set_admin_credentials.js --list');
      console.log('  node set_admin_credentials.js --clean-demos');
      console.log('\nExample:');
      console.log('  node set_admin_credentials.js kalaibharathi2730@gmail.com MyStrongPass123 "S. Bharathi"\n');
      return;
    }

    if (rawPassword.length < 8) {
      console.error('❌ Error: Password must be at least 8 characters long.');
      return;
    }

    // Hash password
    const hash = await bcrypt.hash(rawPassword, 10);

    // Check existing
    let admin = await prisma.admins.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    if (admin) {
      admin = await prisma.admins.update({
        where: { id: admin.id },
        data: {
          name: adminName || admin.name,
          password_hash: hash,
          is_activated: true,
          activated_at: new Date(),
        },
      });
      console.log(`\n✅ Administrator password updated successfully!`);
    } else {
      // Build admin code
      const cleanName = (adminName || '').replace(/[^a-zA-Z]/g, '').toUpperCase();
      const cleanEmail = email.split('@')[0].replace(/[^a-zA-Z]/g, '').toUpperCase();
      const prefix = `VCS_ADM_${(cleanName.slice(0, 3) || cleanEmail.slice(0, 3) || 'ADM').padEnd(3, 'X')}_`;
      const count = await prisma.admins.count({ where: { admin_code: { startsWith: prefix } } });
      const admin_code = `${prefix}${String(count + 1).padStart(3, '0')}`;

      admin = await prisma.admins.create({
        data: {
          admin_code,
          name: adminName,
          email,
          password_hash: hash,
          is_activated: true,
          activated_at: new Date(),
        },
      });
      console.log(`\n🎉 New Administrator account created successfully!`);
    }

    // Link companies & surveys to this admin
    await prisma.companies.updateMany({ data: { created_by_admin_id: admin.id } });
    await prisma.surveys.updateMany({ data: { created_by_admin_id: admin.id } });

    console.log('==================================================');
    console.log(`🛡️  Admin ID  : ${admin.admin_code || admin.id}`);
    console.log(`👤  Name      : ${admin.name}`);
    console.log(`📧  Email     : ${admin.email}`);
    console.log(`🔑  Password  : (Successfully set to your chosen password)`);
    console.log(`🌐  Portal    : http://localhost:5173/admin`);
    console.log('==================================================\n');
  } catch (err) {
    console.error('❌ Error configuring administrator:', err);
  } finally {
    await prisma.$disconnect();
    if (replSet) {
      await replSet.stop();
    }
  }
}

main().catch(console.error);
