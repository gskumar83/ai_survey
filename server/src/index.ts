import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import net from 'net';
import fs from 'fs';
// Server port configuration
// TCP port check utility

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (same-origin, curl, mobile apps, file://)
      if (!origin || origin === 'null') return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get(['/health', '/api/health'], (req, res) => {
  res.json({ status: 'ok' });
});
app.get('/favicon.ico', (_req, res) => res.status(204).end());

import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import employeeRoutes from './routes/employee.routes';

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employee', employeeRoutes);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const publicCandidates = [
  path.join(__dirname, '../../client/public'),
  path.join(__dirname, '../public'),
  path.join(__dirname, '../../public'),
  path.join(process.cwd(), 'client/public'),
  path.join(process.cwd(), 'public')
];
const clientPublicDir = publicCandidates.find((dir) => fs.existsSync(dir));
if (clientPublicDir) {
  app.use(express.static(clientPublicDir));
  app.get(['/', '/index.html'], (_req, res) => {
    res.sendFile(path.join(clientPublicDir, 'index.html'));
  });
  app.get(['/admin', '/admin/'], (_req, res) => {
    res.sendFile(path.join(clientPublicDir, 'admin/visteria-admin-panel.html'));
  });
  app.get(['/employee', '/employee/'], (_req, res) => {
    res.sendFile(path.join(clientPublicDir, 'employee/index.html'));
  });
  app.get(['/welcome.html', '/welcome', '/employee/welcome.html', '/employee/welcome'], (_req, res) => {
    res.sendFile(path.join(clientPublicDir, 'employee/welcome.html'));
  });
  app.get(['/survey.html', '/survey', '/employee/survey.html', '/employee/survey'], (_req, res) => {
    res.sendFile(path.join(clientPublicDir, 'employee/survey.html'));
  });
  app.get(['/confirmation.html', '/confirmation', '/employee/confirmation.html', '/employee/confirmation'], (_req, res) => {
    res.sendFile(path.join(clientPublicDir, 'employee/confirmation.html'));
  });
}

// Global JSON error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Malformed JSON payload' });
  }
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

// TCP port check utility
// Server port configuration

const PORT = process.env.PORT || 3000;

function isPortOpen(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(3000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function startServer() {
  if (process.env.VERCEL !== '1') {
    let dbActive = await isPortOpen(27017);
    if (!dbActive) {
      try {
        const binaryPath = process.env.MONGOD_PATH || '';
        const dbPath = path.join(__dirname, '../.mongodb_data');
        if (binaryPath && fs.existsSync(binaryPath)) {
          console.log('🍃 Starting local development MongoDB process...');
          if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });
          const { spawn } = require('child_process');
          const mongod = spawn(binaryPath, ['--dbpath', dbPath, '--port', '27017', '--replSet', 'rs0', '--bind_ip', '127.0.0.1'], { stdio: 'ignore', detached: true });
          mongod.unref();
          for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 500));
            if (await isPortOpen(27017)) {
              dbActive = true;
              console.log('✅ Local MongoDB process successfully spawned on port 27017');
              break;
            }
          }
        } else {
          console.log('ℹ️ External/Cloud MongoDB configured via DATABASE_URL environment variable');
        }
      } catch (dbErr) {
        console.warn('⚠️ Could not auto-start local MongoDB:', dbErr);
      }
    } else {
      console.log('🍃 Connected to active MongoDB service on port 27017');
    }

    try {
      const { ensureSuperAdmin } = await import('./services/auth.service');
      await ensureSuperAdmin();
    } catch (adminInitErr) {
      console.warn('Super admin initialization notice:', adminInitErr);
    }

    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 Visteria Server listening on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
