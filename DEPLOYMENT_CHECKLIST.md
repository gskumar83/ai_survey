# Visteria People & Process Excellence – Deployment Verification Checklist

This checklist must be reviewed and signed off by the DevOps engineer and system administrator prior to, during, and following production release.

---

## 1. Pre-Deployment Verification

- [ ] **Target Server Requirements:**
  - [ ] Node.js v18.18+ or v20+ LTS installed (`node -v`).
  - [ ] npm v9+ or pnpm v8+ installed (`npm -v`).
  - [ ] Minimum 2 GB RAM (4 GB+ recommended) available.
  - [ ] Minimum 10 GB SSD disk space available.
- [ ] **Database Readiness:**
  - [ ] MongoDB v6.0+ or v7.0+ provisioned.
  - [ ] **Replica set enabled and verified** (`rs.status().ok === 1`).
  - [ ] Database credentials and network firewall/whitelisting configured.
  - [ ] Network latency between application host and database $< 15\text{ms}$.
- [ ] **Package Integrity:**
  - [ ] Archive `Visteria_AI_Survey_Production_Deployment.zip` extracted cleanly without file corruption.
  - [ ] Verified absence of development artifacts (`node_modules`, `.mongodb_data`, `.env`, scratch scripts).

---

## 2. Security & Environment Configuration

- [ ] **Environment File Provisioning:**
  - [ ] Created `server/.env` from `server/.env.example`.
  - [ ] Set `NODE_ENV=production`.
  - [ ] Set `PORT=3000` (or target container port).
- [ ] **Secret Generation:**
  - [ ] Generated unique, cryptographically random `JWT_SECRET` ($\ge 64$ characters).
  - [ ] Generated unique `JWT_ACCESS_SECRET` ($\ge 64$ characters).
  - [ ] Generated unique `JWT_REFRESH_SECRET` ($\ge 64$ characters).
  - [ ] Zero placeholder values (`<...>`, `replace-with-...`) left in `.env`.
- [ ] **Network & Access Security:**
  - [ ] Configured `CLIENT_URL` with exact production domains (e.g., `https://survey.visteria.com`).
  - [ ] SSL/TLS certificate installed (Let's Encrypt / Cloudflare / ACM).
  - [ ] HTTP-to-HTTPS redirect enforced on reverse proxy.
  - [ ] HSTS (`Strict-Transport-Security`) header enabled.
  - [ ] Port `27017` (MongoDB) blocked from public internet access.
- [ ] **Optional Integrations:**
  - [ ] Anthropic Claude API Key configured (if Eagle AI is active).
  - [ ] SMTP credentials configured and tested for transactional emails.
  - [ ] AWS S3 credentials configured (if cloud report storage is enabled).

---

## 3. Build & Initialization Verification

- [ ] **Dependency Installation:**
  - [ ] `npm ci` completed cleanly with zero critical dependency vulnerabilities.
- [ ] **Database Schema Synchronization:**
  - [ ] Ran `npx prisma generate` in `server/`.
  - [ ] Ran `npx prisma db push` to synchronize MongoDB collections and indexes.
- [ ] **Compilation:**
  - [ ] Backend TypeScript build completed with zero errors (`npm --prefix server run build`).
  - [ ] Frontend Vite build completed with zero errors (`npm --prefix client run build`).
- [ ] **Administrator Bootstrap:**
  - [ ] Initial super administrator seeded via `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` or CLI utility:
    ```bash
    node server/scripts/set_admin_credentials.js admin@visteria.com <password> "Admin Name"
    ```
  - [ ] Verified administrator account status via:
    ```bash
    node server/scripts/set_admin_credentials.js --list
    ```

---

## 4. Post-Deployment Smoke Test Protocol

Perform the following smoke tests on the live production URL:

- [ ] **Endpoint Health:**
  - [ ] `GET /health` returns HTTP 200 `{"status":"ok"}`.
  - [ ] `GET /api/health` returns HTTP 200.
- [ ] **Employee Portal Entry:**
  - [ ] Navigate to `/employee` or `/welcome.html`.
  - [ ] Page loads completely with no 404 errors in browser console.
  - [ ] Dotted 3D world globe renders and rotates smoothly on the left side.
  - [ ] Organization card and Survey Categories card display correctly.
  - [ ] Floating Eagle AI Assistant widget is visible and responds to toggle/zoom.
  - [ ] Theme toggle (Light Mode / Dark Mode) toggles instantly with persistent state.
  - [ ] Sign Out button functions correctly and clears local tokens.
- [ ] **Administrator Portal Entry:**
  - [ ] Navigate to `/admin`.
  - [ ] Admin login interface renders properly.
  - [ ] Authentication with bootstrap admin credentials succeeds and redirects to dashboard.
  - [ ] Survey cycles, company settings, and analytics screens load data.
- [ ] **Authentication Flow:**
  - [ ] Invalid login attempt returns standard HTTP 401 error without exposing stack traces.
  - [ ] Valid login issues JWT access token and sets httpOnly refresh token cookie.
- [ ] **Eagle AI Assistant:**
  - [ ] Send test message in employee chat widget.
  - [ ] Valid response returned from `/api/employee/assistant/chat`.

---

## 5. Rollback Procedure

If a critical failure occurs during deployment:

1. **Service Stop:**
   ```bash
   pm2 stop visteria-survey-api
   # or for Docker:
   docker compose down
   ```
2. **Point DNS or Nginx upstream to previous stable release:**
   ```bash
   sudo ln -sfn /var/www/visteria_previous /var/www/visteria_current
   sudo nginx -t && sudo systemctl reload nginx
   ```
3. **Database Snapshot Restore (if migrations occurred):**
   ```bash
   node server/scripts/restore_database.js <pre_deployment_backup_directory>
   ```
4. **Restart previous application version:**
   ```bash
   pm2 restart visteria-survey-api
   ```
5. **Verify health check on rollback instance:**
   ```bash
   curl -I http://localhost:3000/health
   ```

---
*Sign-off:*  
*DevOps Lead: ____________________ Date: ______________*  
*Product Owner: __________________ Date: ______________*  
