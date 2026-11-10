# Visteria People & Process Excellence – Production Deployment Guide

**Product:** Visteria AI Survey (People & Process Excellence)  
**Organization:** Visteria Consulting Services Private Limited  
**Target Audience:** DevOps Engineers, Cloud Architects, and Deployment Teams  
**Package Version:** 1.0.0-PROD  
**Document Classification:** Production Confidential  

---

## 1. Architecture Overview

Visteria AI Survey is an enterprise-grade workplace assessment platform delivering anonymous employee surveys, real-time analytics, multilingual support, and AI-powered organizational feedback insights (Eagle AI Assistant).

### Technology Stack
- **Backend API:** Node.js (v18.x or v20.x LTS), Express 5.x, TypeScript 5.x
- **Database Engine:** MongoDB 6.x or 7.x configured as a **Replica Set** (`rs0`)
- **ORM & Data Layer:** Prisma ORM 5.x (MongoDB driver)
- **Frontend Portals:**
  - **Employee Portal:** High-performance responsive static web application (`public/employee/`) with custom interactive UI, canvas 3D globe animation, Eagle AI widget, and multi-viewport responsive design.
  - **Administrator Portal:** Executive management dashboard (`public/admin/`) with analytics, cycle controls, organization mapping, and AI sentiment reports.
  - **React Application:** Modern React 19 + TypeScript + Vite 8 application (`client/src/`) for interactive survey components and data visualization (Recharts, Lucide).
- **Authentication & Security:** Dual-portal JWT authentication (Access + Refresh tokens with httpOnly cookie storage), bcrypt password hashing (10 rounds), strictly anonymized response aggregation.
- **External Integrations:**
  - **Eagle AI:** Anthropic Claude API for natural language survey analytics and intelligent employee query assistance.
  - **Email Service:** SMTP (SendGrid, AWS SES, Gmail) for invitations, activation codes, and password recovery.
  - **Storage:** AWS S3 / S3-compatible storage for PDF reports and asset exports.

---

## 2. System Requirements & Prerequisites

### Server & Compute
- **Node.js:** v18.18.0 or v20.x LTS (Recommended: Node.js 20.x LTS)
- **Package Manager:** npm v9+ or pnpm v8+
- **RAM:** Minimum 2 GB (4 GB+ recommended for production workloads)
- **CPU:** Minimum 1 vCPU (2+ vCPUs recommended)
- **Disk:** Minimum 10 GB available SSD storage
- **Operating System:** Linux (Ubuntu 22.04 LTS / Debian 12 / RHEL 9), macOS, or Windows Server 2022

### Database
- **MongoDB:** Version 6.0+ or 7.0+
- **CRITICAL REQUIREMENT:** MongoDB **must** be deployed as a **Replica Set**. Prisma ORM requires replica sets for all MongoDB write transactions and data integrity guarantees.
  - Managed MongoDB (e.g., MongoDB Atlas) automatically runs as a replica set and is 100% production-ready.
  - Self-hosted MongoDB requires `--replSet rs0` with a one-time `rs.initiate()`.

---

## 3. Quick Start Guide (Local Production Test)

To test the production package locally on your machine before cloud deployment:

### 3.1 Install Dependencies
```bash
# Install root, server, and client dependencies
npm run install:all
# Or run individually:
npm install
npm --prefix server install
npm --prefix client install
```

### 3.2 Configure Environment
```bash
# Server configuration
cp server/.env.example server/.env

# Client configuration (if building React client)
cp client/.env.example client/.env
```
Edit `server/.env` to configure your `DATABASE_URL` (pointing to an active MongoDB replica set) and generate random JWT secrets.

### 3.3 Generate Prisma Client & Compile
```bash
# Generate Prisma Client
cd server && npx prisma generate && cd ..

# Build both components
npm --prefix server run build
npm --prefix client run build
```

### 3.4 Start the Unified Server
```bash
# Start server in production mode
npm --prefix server run start
```
The server will bind to `http://0.0.0.0:3000`. Navigate to:
- **Employee Portal:** `http://localhost:3000/employee`
- **Employee Welcome Page:** `http://localhost:3000/welcome.html`
- **Administrator Portal:** `http://localhost:3000/admin`
- **Health Check:** `http://localhost:3000/health`

---

## 4. Environment Variables Reference

All environment variables are declared in `server/.env.example` and `client/.env.example`.

### Server Environment Variables (`server/.env`)

| Variable Name | Required | Default Value | Description |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | **Yes** | `production` | Node runtime environment (`production` or `development`). |
| `PORT` | **Yes** | `3000` | Port for the Express server to listen on. |
| `CLIENT_URL` | **Yes** | `http://localhost:5173` | Comma-delimited list of allowed origins for CORS. In production, specify your public frontend domain(s), e.g. `https://survey.visteria.com,https://admin.visteria.com`. |
| `DATABASE_URL` | **Yes** | None | Full MongoDB replica set connection URI. Required by Prisma. |
| `JWT_SECRET` | **Yes** | None | Cryptographic secret for legacy session tokens (min 64 chars). |
| `JWT_ACCESS_SECRET` | **Yes** | None | Cryptographic secret for signing Bearer access tokens (min 64 chars). |
| `JWT_REFRESH_SECRET`| **Yes** | None | Cryptographic secret for signing httpOnly refresh tokens (min 64 chars). |
| `SUPER_ADMIN_NAME` | Optional | `System Administrator` | Full name of the primary bootstrap administrator. |
| `SUPER_ADMIN_EMAIL` | Optional | None | Initial super admin email. Auto-seeded on first launch if DB is empty. |
| `SUPER_ADMIN_PASSWORD` | Optional | None | Initial super admin password (min 8 chars). |
| `ALLOW_SEED_IN_PRODUCTION` | Optional | `false` | Safety flag to permit manual seed scripts in production. |
| `ANTHROPIC_API_KEY` | Optional | None | API Key from Anthropic for Eagle AI chat & executive survey summaries. |
| `SMTP_HOST` | Optional | `smtp.sendgrid.net` | Hostname of SMTP mail provider. |
| `SMTP_PORT` | Optional | `587` | SMTP port (`587` for TLS, `465` for SSL). |
| `SMTP_SECURE` | Optional | `false` | Set `true` if port 465 SSL is used. |
| `SMTP_USER` | Optional | None | SMTP username or API user. |
| `SMTP_PASS` | Optional | None | SMTP password or API token. |
| `SMTP_FROM` | Optional | `Visteria <noreply@...>` | Sender address displayed in outgoing emails. |
| `SENDGRID_API_KEY` | Optional | None | Direct SendGrid API key if SendGrid mailer is enabled. |
| `AWS_ACCESS_KEY_ID` | Optional | None | AWS access key for S3 export bucket storage. |
| `AWS_SECRET_ACCESS_KEY` | Optional | None | AWS secret access key for S3. |
| `AWS_REGION` | Optional | `us-east-1` | AWS S3 region. |
| `AWS_S3_BUCKET` | Optional | None | AWS S3 bucket name. |

### Client Environment Variables (`client/.env`)

| Variable Name | Required | Default Value | Description |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | Optional | `/api` | Base URL for API requests. Set to `/api` when hosted behind a reverse proxy, or full URL (`https://api.visteria.com/api`) for split hosting. |

---

## 5. Database Setup (MongoDB Replica Set)

### Option A: MongoDB Atlas (Recommended for Cloud Production)
1. Create a free or dedicated cluster on [MongoDB Atlas](https://www.mongodb.com/atlas). Atlas clusters are provisioned as replica sets by default.
2. In **Database Access**, create a database user with `readWriteAnyDatabase` privileges.
3. In **Network Access**, whitelist your production server's IP address (or `0.0.0.0/0` if protected by VPC/NAT).
4. Obtain the connection string:
   ```env
   DATABASE_URL="mongodb+srv://visteria_admin:<PASSWORD>@cluster0.abcde.mongodb.net/visteria_db?retryWrites=true&w=majority"
   ```
5. Apply database schema using Prisma:
   ```bash
   cd server
   npx prisma db push
   ```

### Option B: Self-Hosted MongoDB on Ubuntu Server
1. Install MongoDB 7.0 Community Edition:
   ```bash
   sudo apt-get install -y mongodb-org
   ```
2. Configure Replica Set in `/etc/mongod.conf`:
   ```yaml
   replication:
     replSetName: "rs0"
   net:
     port: 27017
     bindIp: 127.0.0.1
   ```
3. Restart MongoDB:
   ```bash
   sudo systemctl restart mongod
   ```
4. Initiate the replica set:
   ```bash
   mongosh --eval "rs.initiate()"
   ```
5. Set your connection string:
   ```env
   DATABASE_URL="mongodb://127.0.0.1:27017/visteria_db?replicaSet=rs0&directConnection=true"
   ```

---

## 6. Supported Deployment Architectures

### Architecture 1: Docker & Docker Compose (Containerized)
This package includes a production `Dockerfile` and `docker-compose.yml` pre-configured with a MongoDB replica set.

1. Ensure Docker and Docker Compose are installed on your target host.
2. Review and adjust environment variables in `docker-compose.yml`.
3. Start the application stack:
   ```bash
   docker compose up -d --build
   ```
4. Verify container status:
   ```bash
   docker compose ps
   docker compose logs -f app
   ```

---

### Architecture 2: VPS / Dedicated Server (Ubuntu + PM2 + Nginx)

#### Step 1: Install Node.js 20 LTS & PM2
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

#### Step 2: Deploy Code & Build
```bash
# Copy and extract the production package
mkdir -p /var/www/visteria
unzip Visteria_AI_Survey_Production_Deployment.zip -d /var/www/visteria
cd /var/www/visteria

# Install dependencies and build
npm --prefix server install --omit=dev
npm --prefix server install typescript prisma tsx --no-save
cd server && npx prisma generate && npm run build && cd ..

# Setup environment
cp server/.env.example server/.env
nano server/.env
```

#### Step 3: Run with PM2
```bash
pm2 start server/dist/index.js --name "visteria-survey-api" --time
pm2 save
pm2 startup
```

#### Step 4: Configure Nginx as Reverse Proxy
Create `/etc/nginx/sites-available/visteria`:
```nginx
server {
    listen 80;
    server_name survey.yourcompany.com;

    client_max_body_size 20M;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Enable the site and obtain SSL via Let's Encrypt:
```bash
sudo ln -s /etc/nginx/sites-available/visteria /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d survey.yourcompany.com
```

---

### Architecture 3: PaaS (Render / Railway / AWS App Runner)

- **Root Directory:** Repository root
- **Build Command:**
  ```bash
  npm --prefix server install && cd server && npx prisma generate && npm run build
  ```
- **Start Command:**
  ```bash
  node server/dist/index.js
  ```
- **Environment Variables:** Set all variables defined in `server/.env.example` in the platform dashboard. Ensure `DATABASE_URL` points to MongoDB Atlas.

---

### Architecture 4: Split Hosting (Static Frontend on Vercel/Netlify + Backend on Cloud API)

1. **Frontend (Vercel / Cloudflare Pages / Netlify / AWS S3+CloudFront):**
   - Root directory: `client/`
   - Build Command: `npm run build`
   - Output Directory: `dist/`
   - Environment Variable: `VITE_API_URL=https://api.yourcompany.com/api`
2. **Backend (VPS / Container / Cloud Run):**
   - Host `server/` with `CLIENT_URL=https://your-frontend-domain.com`.

---

## 7. Administrator Account Setup & CLI Utilities

The package provides automated and CLI tools in `server/scripts/` to manage administrator credentials securely without manual database tampering.

### Setting or Updating Admin Credentials
To create or update the authorized administrator password:
```bash
cd server
node scripts/set_admin_credentials.js <admin_email> <strong_password> "Admin Full Name"
```
*Example:*
```bash
node scripts/set_admin_credentials.js admin@visteria.com SuperSecretPass2026! "System Administrator"
```

### Listing Registered Administrators
```bash
node scripts/set_admin_credentials.js --list
```

### Cleaning Test / Demo Accounts
```bash
node scripts/set_admin_credentials.js --clean-demos
```

### Database Backup & Restore Utilities
- **Backup:** `node scripts/backup_database.js` (creates timestamped snapshot in `backups/`)
- **Restore:** `node scripts/restore_database.js <backup_directory_path>`
- **Audit Database:** `node scripts/audit_database.js` (inspects counts of companies, employees, surveys, and responses)

---

## 8. Key API Endpoints for Smoke Testing

| Method | Endpoint | Description | Expected Status |
| :--- | :--- | :--- | :---: |
| `GET` | `/health` | Server health check | `200 OK` (`{"status":"ok"}`) |
| `GET` | `/api/health` | Alternate API health check | `200 OK` |
| `POST` | `/api/auth/login` | Administrator login | `200 OK` or `401 Unauthorized` |
| `POST` | `/api/auth/employee/login` | Employee login | `200 OK` or `401 Unauthorized` |
| `GET` | `/employee/welcome.html` | Welcome portal entry | `200 OK` (HTML) |
| `GET` | `/admin/visteria-admin-panel.html` | Admin portal entry | `200 OK` (HTML) |
| `POST` | `/api/employee/assistant/chat` | Eagle AI Chat Assistant | `200 OK` |

---

## 9. Production Best Practices & Security Checklist

1. **Secret Rotation:** Generate unique 64-character secrets for `JWT_SECRET`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET`. Do not reuse secrets between environments.
2. **HTTPS Enforcement:** Always place the application behind an SSL-terminating reverse proxy (Nginx, Cloudflare, AWS ALB) with HSTS enabled.
3. **CORS Restrictions:** Restrict `CLIENT_URL` to exact production domain origins.
4. **Rate Limiting:** Protect `/api/auth/*` and `/api/employee/assistant/chat` using Nginx rate limiting (`limit_req_zone`) to prevent brute-force and token exhaustion attacks.
5. **Database Protection:** Never expose MongoDB port `27017` to the public internet. Use VPC peering, private subnets, or strict IP whitelisting.
6. **Continuous Monitoring:** Monitor Node.js event loop lag, memory RSS, and MongoDB replica set lag using PM2 or Prometheus/Datadog.

---
*Document prepared for external deployment team by Visteria Engineering.*
