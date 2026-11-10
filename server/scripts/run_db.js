const { MongoMemoryReplSet } = require('mongodb-memory-server');
const path = require('path');
const fs = require('fs');

async function startDb() {
  const dbPath = path.join(__dirname, '../.mongodb_data');
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
  }

  // Preserve existing lock files; do not unlink mongod.lock or WiredTiger.lock

  console.log('Starting local persistent MongoDB replica set on port 27017...');
  try {
    const replSet = await MongoMemoryReplSet.create({
      replSet: {
        name: 'rs0',
        count: 1,
        storageEngine: 'wiredTiger',
        spawn: { timeout: 60000 }
      },
      instanceOpts: [
        {
          port: 27017,
          ip: '127.0.0.1',
          dbPath: dbPath,
          spawn: { timeout: 60000 }
        }
      ]
    });

    const uri = replSet.getUri('survey-ai');
    console.log('MONGODB_READY');
    console.log(`Connection URI: ${uri}`);
    console.log(`Data directory: ${dbPath}`);

    replSet.servers.forEach((s, idx) => {
      const child = s.instanceInfo?.instance?.mongodProcess || s._instanceInfo?.childProcess || s.instance?.childProcess;
      child?.stdout?.on('data', d => console.log(`[mongod-${idx}]`, d.toString().trim()));
      child?.stderr?.on('data', d => console.error(`[mongod-${idx}-ERR]`, d.toString().trim()));
      child?.on('exit', (code, sig) => console.error(`[mongod-${idx}-EXIT] code=${code} sig=${sig}`));
    });

    // Keep process alive indefinitely
    if (process.stdin && process.stdin.resume) {
      try { process.stdin.resume(); } catch (e) {}
    }
    setInterval(() => {
      // Keep event loop active
    }, 10000);

    process.on('SIGINT', async () => {
      console.log('Stopping MongoDB...');
      await replSet.stop({ doCleanup: false });
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('Stopping MongoDB...');
      await replSet.stop({ doCleanup: false });
      process.exit(0);
    });
  } catch (err) {
    console.error('Failed to start MongoDB replica set:', err);
    process.exit(1);
  }
}

startDb();
