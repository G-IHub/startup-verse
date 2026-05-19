# StartupVerse — Everything left for production

**Purpose:** Single master punch list for finishing the repo and going live. Includes code, env, automated tests (all `RUN_*` flags), manual QA, infrastructure, security, and process debt.

**Companion docs:** [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md) (env templates + role QA), [`MANUAL_QA_GATE_CHECKLIST.md`](../MANUAL_QA_GATE_CHECKLIST.md) (founder/office depth), [`ORGANIZATION_API_INTEGRATION_PLAN.md`](ORGANIZATION_API_INTEGRATION_PLAN.md) (historical plan + Definition of Done).

**Last updated:** After Phases 4–7 (export, API cleanup, rate limit, Helmet, CI org smokes, Sentry hooks) and Phase 8 doc sync.

---

## 0. Executive summary

| Area | Status |
|------|--------|
| **Org accelerator API + UI** | Largely integrated; pilot-ready after staging QA |
| **Founder / talent / team / admin** | Functional paths exist; need same staging discipline as org |
| **Env (you)** | Most vars set locally — confirm **production** Mailtrap (not sandbox) + HTTPS URLs |
| **Blocking code gaps** | Org module O1–O4 **code complete**; remaining: staging QA, P2 list enums at scale (optional), founder/talent depth |
| **Blocking ops** | Deploy, secrets vault, backups, Sentry DSN + uptime on `/health`, log aggregation |
| **CI today** | `alignment-gate` + org permissions audit, deprecated helpers, permissions HTTP, invitations HTTP, Sentry smoke (see §3.4) |

**Definition of “done”:** All items in [§10](#10-definition-of-done-integration-plan) checked **or** explicitly waived for v1, plus [§6](#6-manual-qa-must-pass-on-staging) on staging, plus [§4](#4-production-environment-cutover) on production.

---

## 1. What you have already completed (do not redo unless regressing)

### Org integration (Phases 1–5 + realtime/export)

- Cohort member enrichment, cohort `stats`, portfolio health scoring (Step 3.3)
- Cohort analytics trends / velocity (Step 3.4)
- `POST /uploads` → Cloudinary only
- Mailtrap email (invitations, mentor magic links)
- Invitation cancel / resend lifecycle (Step 2.13)
- Founder → org messaging (Step 2.14)
- Event notifications (Step 2.12)
- Startup snapshot API + route ordering (Step 2.9)
- Permissions static audit + HTTP matrix (Step 3.6)
- Deprecated `organizationBackendHelpers` stubs removed (Step 3.7)
- **O4** List pagination: cohort invitations + `useOrgListQuery` on major org lists; P2 enums deferred ([`PAGINATION_AUDIT.md`](PAGINATION_AUDIT.md))
- **O1** Badge counts — `GET /cohorts/:cohortId/badge-counts`, sidebar + 60s refresh (`test:step-3-5-badge-counts`)
- **O2** Org realtime — `useOrgRealtime`, server emits, wired in org dashboards
- **O3** Cohort export — `downloadCohortExport` / `GET /cohorts/:cohortId/export` (`test:step-4-1-cohort-export`)
- **O5** Search indexes — `db:ensure-search-indexes`, `test:step-1-5-search-indexes`
- **O6** Legacy email routes trimmed (Step 5.1); **501** client gating (Step 5.2 / X8)
- **O7** Integration plan DoD reconciled (Phase 8)

### Production hardening (Phases 6–7)

- Rate limiting (Step 6.1 / X1), Helmet security headers (Step 6.2 / X2)
- CI: alignment-gate + org permissions HTTP + invitations HTTP + Sentry smoke (Step 7.1 / X5)
- Sentry hooks when `SENTRY_DSN` / `VITE_SENTRY_DSN` set (Step 7.2)

### Automated gates

- `npm run verify:release` — alignment gate + client production build
- `npm run test:step-3-6-permissions-audit` (+ HTTP matrix in CI)
- `npm run test:step-3-7-deprecated-helpers`
- Step smokes wired in `server/package.json` (X6): snapshot, event-notify, founder-to-org, list-query, portfolio-health, cohort-analytics, badge-counts, cohort-export, rate-limit, helmet, sentry, etc.

---

## 2. Environment — verify before production

Run from **`server/.env.local`** (dev/staging) and your host secret manager (production).

### 2.1 Server — required (app won’t start without these)

| Variable | You need to… |
|----------|----------------|
| `NODE_ENV` | `production` on prod host |
| `PORT` | Set (e.g. `5000`) |
| `CORS_ORIGIN` | **Exact** client origin(s), comma-separated, no trailing slash (match your real client URL — e.g. `http://localhost:3000` if Vite runs on 3000, not only `5173`) |
| `JWT_SECRET` | Strong secret in vault; never commit |
| `JWT_EXPIRES_IN` | e.g. `7d` |
| `MONGODB_CONNECTION_URI` | Atlas (or managed Mongo) with auth + IP allowlist |
| `MONGODB_DB_NAME` | Set for prod DB name |

### 2.2 Server — required for full product behavior

| Variable | You need to… |
|----------|----------------|
| `PUBLIC_APP_URL` | Production client URL, no trailing slash (invite + mentor links) |
| `EMAIL_DRIVER` | `mailtrap` in prod |
| `MAILTRAP_API_TOKEN` | **Sending** API token (Email Sending → API tokens) |
| `EMAIL_FROM` | Verified domain address, e.g. `StartupVerse <noreply@yourdomain.com>` |
| `MAILTRAP_USE_SANDBOX` | **`false` or unset in production** (sandbox = test inbox only) |
| `MAILTRAP_INBOX_ID` | Only when sandbox is on (dev); omit in prod |
| `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET` | Or single `CLOUDINARY_URL` |

### 2.3 Client — required

| Variable | You need to… |
|----------|----------------|
| `VITE_API_URL` | `https://<api-host>/api/v1` — **rebuild client** after changing |

### 2.4 Optional server flags

| Variable | When |
|----------|------|
| `GOOGLE_INTEGRATION_ENABLED=true` | Only if implementing Google Calendar OAuth |
| `DISABLE_SERVER_CRON=true` | If you move reminders to an external scheduler |
| `SCHEDULER_TZ` | Cron timezone |
| `REMINDER_JOB_POLL_MS` | Reminder poll interval (default `10000`) |

### 2.5 Env hygiene (non-code, critical)

- [ ] Rotate any secrets that were ever committed or shared in chat
- [ ] Ensure `server/.env.local` and `client/.env.local` stay **gitignored**
- [ ] Production secrets only in host vault / platform env UI
- [ ] Staging uses separate Mongo DB + Mailtrap sending domain (or sandbox) from production

---

## 3. Automated verification — every flag and command

All commands from **`server/`** unless noted. On Windows PowerShell use `$env:VAR="1"`; on bash use `export VAR=1`.

### 3.1 Always run (no Mongo / no external services)

| Command | What it proves |
|---------|----------------|
| `npm run verify:release` | Phase 1–9 alignment smokes + **client `npm run build`** |
| `npm run test:step-3-6-permissions-audit` | Org route middleware manifest |
| `npm run test:step-3-7-deprecated-helpers` | No banned deprecated helper exports |
| `npm run test:step-2-1-upload` | Upload scope normalization + config guards (Part 1) |
| `npm run test:step-2-11-email` | Mailtrap driver + templates (Part 1) |

### 3.2 Mongo required (`server/.env.local` with valid `MONGODB_*`)

| Flag | Command | What it proves |
|------|---------|----------------|
| `VERIFY_HTTP_FLOWS=1` | `VERIFY_HTTP_FLOWS=1 npm run verify:release` | Phase 1 HTTP contract flows (also in CI via alignment-gate) |
| `RUN_CONTRACT_HTTP_FLOWS=1` | `npm run test:phase1-http-flows` | Signup + protected route samples |
| `RUN_ORG_PERMISSION_HTTP_FLOWS=1` | `npm run test:step-3-6-permissions` | Org permission HTTP matrix |
| `RUN_INVITATION_HTTP=1` | `npm run test:step-2-13-invitations` | Invite cancel / resend / cooldown |
| `RUN_MENTOR_HTTP_FLOWS=1` | `npm run test:step-2-10-mentor` | Mentor invite + magic link |
| `RUN_EMAIL_HTTP_FLOWS=1` | `npm run test:step-2-11-email` | Invite + mentor link controllers (log driver) |
| `RUN_EVENT_NOTIFY_HTTP=1` | `node scripts/step_2_12_event_notify_smoke.mjs` | Event notification path |
| `RUN_FOUNDER_TO_ORG_HTTP=1` | `node scripts/step_2_14_founder_to_org_smoke.mjs` | Founder → org messaging |
| `RUN_SNAPSHOT_HTTP_FLOWS=1` | `node scripts/step_2_9_snapshot_smoke.mjs` | Startup snapshot access rules |
| `RUN_PORTFOLIO_HEALTH_HTTP_FLOWS=1` | `node scripts/step_3_3_portfolio_health_smoke.mjs` | Portfolio health scoring |
| `RUN_COHORT_ANALYTICS_HTTP_FLOWS=1` | `node scripts/step_3_4_cohort_analytics_smoke.mjs` | Analytics overview |
| `RUN_LIST_QUERY_HTTP_FLOWS=1` | `node scripts/step_3_1_list_query_smoke.mjs` | List query HTTP contract |

**Suggested staging one-liner (bash):**

```bash
export VERIFY_HTTP_FLOWS=1 RUN_ORG_PERMISSION_HTTP_FLOWS=1 RUN_INVITATION_HTTP=1 \
  RUN_MENTOR_HTTP_FLOWS=1 RUN_EMAIL_HTTP_FLOWS=1 RUN_EVENT_NOTIFY_HTTP=1 \
  RUN_FOUNDER_TO_ORG_HTTP=1 RUN_SNAPSHOT_HTTP_FLOWS=1 \
  RUN_PORTFOLIO_HEALTH_HTTP_FLOWS=1 RUN_COHORT_ANALYTICS_HTTP_FLOWS=1 \
  RUN_LIST_QUERY_HTTP_FLOWS=1
npm run verify:release
npm run test:step-3-6-permissions
npm run test:step-2-13-invitations
npm run test:step-2-10-mentor
npm run test:step-2-11-email
node scripts/step_2_12_event_notify_smoke.mjs
node scripts/step_2_14_founder_to_org_smoke.mjs
node scripts/step_2_9_snapshot_smoke.mjs
node scripts/step_3_3_portfolio_health_smoke.mjs
node scripts/step_3_4_cohort_analytics_smoke.mjs
node scripts/step_3_1_list_query_smoke.mjs
```

### 3.3 External services required (live sends / uploads)

| Flag | Extra env | Command |
|------|-----------|---------|
| `RUN_EMAIL_LIVE=1` | `MAILTRAP_API_TOKEN`, `EMAIL_FROM`, `MAILTRAP_TEST_TO` | `RUN_EMAIL_LIVE=1 npm run test:step-2-11-email` |
| `RUN_UPLOAD_LIVE=1` | Cloudinary credentials | `RUN_UPLOAD_LIVE=1 npm run test:step-2-1-upload` |

Use **sandbox** Mailtrap for dev live email test; use **sending domain** for pre-prod send test.

### 3.4 GitHub Actions (`alignment-gate` workflow)

[`.github/workflows/alignment-gate.yml`](../.github/workflows/alignment-gate.yml) runs on push to `main`/`master`:

1. `npm run test:alignment-gate` (Phase 1–9 static smokes + Phase 1 HTTP when `RUN_CONTRACT_HTTP_FLOWS=1`)
2. `npm run test:step-3-6-permissions-audit`
3. `npm run test:step-3-7-deprecated-helpers`
4. `RUN_ORG_PERMISSION_HTTP_FLOWS=1 npm run test:step-3-6-permissions`
5. `RUN_INVITATION_HTTP=1 npm run test:step-2-13-invitations`
6. `npm run test:step-7-2-sentry`
7. Client `npm run build`

CI env includes `EMAIL_DRIVER=log`, `RATE_LIMIT_DISABLED=true`, `PUBLIC_APP_URL` (no live Mailtrap/Cloudinary).

**Still not in CI (run on staging or add later):**

- Other §3.2 HTTP smokes (mentor, email HTTP, snapshot, portfolio health, analytics, list query, etc.)
- `RUN_EMAIL_LIVE` / `RUN_UPLOAD_LIVE` (need GitHub secrets)

---

## 4. Production environment cutover

### 4.1 Infrastructure checklist

- [ ] MongoDB Atlas: auth, IP allowlist, **automated backups**, monitoring alerts
- [ ] API host: HTTPS, health check on `GET /health`
- [ ] Client host: HTTPS static deploy (Vercel / Netlify / S3+CloudFront / etc.)
- [ ] DNS: API + app subdomains
- [ ] `CORS_ORIGIN` = production client origin only (tighten for prod)
- [ ] `VITE_API_URL` baked into client build for prod API
- [ ] `PUBLIC_APP_URL` = production client URL
- [ ] Mailtrap: **sending domain verified**; disable sandbox in prod
- [ ] Cloudinary: production cloud; upload presets/folders acceptable
- [ ] Secrets in vault: `JWT_SECRET`, `MONGODB_CONNECTION_URI`, `MAILTRAP_API_TOKEN`, Cloudinary

### 4.2 Application checklist

- [ ] `NODE_ENV=production`
- [ ] Cookie auth works with your client/API domain layout (SameSite / secure cookies over HTTPS)
- [ ] Socket.IO connects from browser (founder inbox / notifications / virtual office)
- [ ] Cron / reminder jobs acceptable on host (or `DISABLE_SERVER_CRON` + external job runner)

### 4.3 Deploy procedure (minimal)

1. Configure §2 on staging → run §3.2 + §3.3 on staging  
2. Complete §6 manual QA on staging  
3. Promote same env pattern to production (§4.1)  
4. Run smoke subset on production (read-only + one test invite in test cohort)  
5. Monitor logs / errors for 24–48h  

---

## 5. Remaining code work

### 5.1 Organization module — optional follow-ups

| ID | Item | Priority | Work |
|----|------|----------|------|
| **O4-P2** | Enumeration list pagination | Low | Optional: paginate `getCohortsByOrganization`, `getOrganizationsByUser`, `getOrganizationAdmins` if scale requires ([`PAGINATION_AUDIT.md`](PAGINATION_AUDIT.md)) |

Completed org items (see §1): O1–O7.

### 5.2 Cross-cutting — production hardening

| ID | Item | Priority | Work |
|----|------|----------|------|
| **X1** | Rate limiting | High | Step 6.1 done — Express limiters on signin/signup, uploads, bulk-send + default `/api/v1` (`RATE_LIMIT_*` env); use reverse proxy for volumetric DDoS |
| **X2** | Security headers | High | Step 6.2 done on API (`securityHeaders.js`, `test:step-6-2-helmet`); optional: CSP/HSTS on static client host at CDN/deploy |
| **X3** | Monitoring | High | Step 7.2 done — Sentry hooks when `SENTRY_DSN` / `VITE_SENTRY_DSN` set; configure projects + staging verify; add uptime on `/health` at host |
| **X4** | Logging | Medium | Structured logs → aggregation (Datadog, CloudWatch, etc.) |
| **X5** | CI expansion | Medium | Step 7.1 done — core org smokes in alignment-gate; optional: more §3.2 HTTP smokes as job time allows |
| **X6** | npm scripts | Low | **Done** — step smokes wired in [`server/package.json`](../server/package.json) |
| **X7** | Google Calendar / Meet | Low | Phase 9.1 code done — enable per [`GOOGLE_OAUTH_SETUP.md`](GOOGLE_OAUTH_SETUP.md); manual OAuth + Meet QA on staging |
| **X8** | 501 compat routes | Low | Step 5.2 done — client UI gated; no fetches to 501 paths; server 501 retained for admin nukes / future Google ([`docs/501_ROUTE_AUDIT.md`](501_ROUTE_AUDIT.md)) |

### 5.3 UI redesign track (separate from launch blocker)

[`docs/ui-plan.md`](ui-plan.md) — Phase 2+ redesign for founder, talent, team, inbox (org-admin explicitly out of scope). **Not required** for org pilot launch unless you product-scope it.

Unchecked ui-plan items include: design tokens, typography migration, shell refactor, per-role page migrations, accessibility pass.

### 5.4 Known acceptable v1 limitations (ship with eyes open)

- P2 enumeration lists (org/cohort/admin pickers) may return full arrays — acceptable until scale requires pagination
- Org realtime is wired; confirm with two-browser manual QA (deliverable submit, message send)
- Live Mailtrap delivery and Cloudinary uploads require staging/prod credentials (`RUN_EMAIL_LIVE`, `RUN_UPLOAD_LIVE`)
- Founder/talent virtual office has large surface area — covered by manual QA, not full automation
- Google Calendar / Meet remains off unless **X7** is product-scoped

---

## 6. Manual QA — must pass on staging

**Single source of truth:** [`MANUAL_QA_GATE_CHECKLIST.md`](../MANUAL_QA_GATE_CHECKLIST.md) — full project checklist (auth, all roles, org, office, inbox, security, optional Google, prod smoke). Work through that document on **staging** before prod.

Quick index (details in the manual gate doc):

### 6.1 Auth and session

- [ ] Sign up, sign in, sign out
- [ ] Invalid/expired token → 401 on protected routes
- [ ] Org admin routes require `OrganizationAdmin` membership

### 6.2 Organization admin

- [ ] Create org → cohort → invite founder (**email received**, link works with `PUBLIC_APP_URL`)
- [ ] Cancel / resend invitation (cooldown message on rapid resend)
- [ ] Approve / reject deliverable submission
- [ ] Bulk message + individual message from Communication Center
- [ ] Upload org logo via `POST /uploads` → Cloudinary URL on org settings
- [ ] Create event / announcement / resource / program milestone
- [ ] Invite mentor → magic link email → mentor portal
- [ ] Portfolio health + analytics dashboards load real data
- [ ] Export cohort CSV via server `GET /cohorts/:cohortId/export` (Export button / `downloadCohortExport`)

### 6.3 Founder

- [ ] Accept cohort invitation
- [ ] Submit deliverable
- [ ] Message organization
- [ ] Weekly loop / tasks / virtual office (no console errors)
- [ ] Talent browse / interest (if in scope)

### 6.4 Talent

- [ ] Profile completion
- [ ] Express interest → invitation flow

### 6.5 Team member

- [ ] Accept invite → see startup context → tasks if assigned

### 6.6 Mentor

- [ ] Magic link login → assigned founders visible

### 6.7 Platform admin

- [ ] Admin dashboard loads; restrict prod admin accounts

### 6.8 Realtime (spot-check)

- [ ] Socket connects with auth
- [ ] Message/notification in founder inbox updates (second session or refresh)
- [ ] No cross-org event leakage (two orgs, two browsers)

### 6.9 Virtual office depth (from manual gate)

- [ ] Calendar/agenda, check-ins, task panel, Team Hub, Wall of Wins — per [`MANUAL_QA_GATE_CHECKLIST.md`](../MANUAL_QA_GATE_CHECKLIST.md) § Virtual Office

---

## 7. Security and compliance

- [ ] HTTPS everywhere (client + API)
- [ ] JWT secret rotation policy
- [ ] Mongo credentials least-privilege DB user
- [ ] File upload: 10MB limit enforced ([`uploads.routes.js`](../server/src/routes/uploads.routes.js)); Cloudinary account limits reviewed
- [ ] Review CORS — no `*` with credentials in production
- [ ] Dependency audit: `npm audit` on `server/` and `client/` (fix critical)
- [ ] Privacy/terms pages if public signup (product/legal — not in repo)

---

## 8. Documentation and process

- [x] Update [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md) for O1–O4 and Phases 6–7 (Phase 8)
- [x] Mark integration plan Definition of Done items as done/waived (Phase 8 — see [`ORGANIZATION_API_INTEGRATION_PLAN.md`](ORGANIZATION_API_INTEGRATION_PLAN.md))
- [ ] Runbook: how to restart API, rotate secrets, restore Mongo backup
- [ ] On-call / error alert routing (who gets Sentry emails when `SENTRY_DSN` is set)

---

## 9. Suggested execution order

1. **Verify env:** §2 (especially `CORS_ORIGIN` vs actual client port, Mailtrap sandbox off for prod plan)  
2. **Automated staging:** §3.2 full batch on staging Mongo  
3. **Live tests:** §3.3 `RUN_EMAIL_LIVE`, `RUN_UPLOAD_LIVE`  
4. **Manual QA:** §6 on staging (org realtime spot-check, export, badges)  
5. **Observability:** set `SENTRY_DSN` / `VITE_SENTRY_DSN` on staging; verify dashboard; configure uptime on `/health`  
6. **Ops:** Mongo backups, log aggregation (X4), `db:ensure-search-indexes` on Atlas  
7. **Deploy:** §4 → prod smoke → monitor 24–48h  

---

## 10. Definition of Done (integration plan)

From [`ORGANIZATION_API_INTEGRATION_PLAN.md`](ORGANIZATION_API_INTEGRATION_PLAN.md) (reconciled Phase 8). Check when true on **staging**:

- [ ] Every list endpoint paginates with `?q`, `?limit`, `?skip`, `?sortBy`, `?sortOrder` server-side (**partial** — org lists + invitations; P2 enums deferred)
- [ ] No org UI field is `undefined`/`N/A` due to dropped schema fields (staging QA)
- [x] Every visible CRUD action hits a working endpoint with correct role gates
- [x] Add-admin-by-email: success, 404, 409 paths
- [x] Logo upload ≤ 5MB via Cloudinary URL
- [x] All file uploads use `POST /uploads` → URLs
- [x] Cohort members return founder + startup + progress; cohort includes `stats`
- [x] Founder invitation email delivered; resend works (verify live on staging/prod)
- [x] Mentor magic-link email delivered
- [x] Event / Resource / ProgramMilestone / Message schemas match UI payloads (spot-check on staging)
- [x] Communication Center: real subjects, senders, mark-as-read
- [x] Org dashboards refresh via sockets on primary actions (code done; manual two-browser QA)
- [x] Portfolio health + analytics use derived data (verify in QA)
- [x] Server notifications on event, deliverable submit/review, invitation response, mentor assign
- [x] No `alert()` in `client/src/components/organizations/**`
- [ ] Negative-path tests 401/403/404/400/409 on new endpoints (**partial** — Step 3.6 matrix covers org integration routes)

---

## 11. Quick reference — npm scripts (`server/`)

| Script | Mongo? |
|--------|--------|
| `npm run verify:release` | Optional `VERIFY_HTTP_FLOWS=1` |
| `npm run test:alignment-gate` | Optional `RUN_CONTRACT_HTTP_FLOWS=1` |
| `npm run test:step-2-1-upload` | Part 2: `RUN_UPLOAD_LIVE=1` + Cloudinary |
| `npm run test:step-2-10-mentor` | `RUN_MENTOR_HTTP_FLOWS=1` |
| `npm run test:step-2-11-email` | `RUN_EMAIL_HTTP_FLOWS=1` / `RUN_EMAIL_LIVE=1` |
| `npm run test:step-2-13-invitations` | `RUN_INVITATION_HTTP=1` |
| `npm run test:step-3-6-permissions-audit` | No |
| `npm run test:step-3-6-permissions` | `RUN_ORG_PERMISSION_HTTP_FLOWS=1` |
| `npm run test:step-3-7-deprecated-helpers` | No |

Also: `test:step-2-9-snapshot`, `test:step-2-12-event-notify`, `test:step-2-14-founder-to-org`, `test:step-3-1-list-query`, `test:step-3-3-portfolio-health`, `test:step-3-4-cohort-analytics`, `test:step-3-5-badge-counts`, `test:step-4-1-cohort-export`, `test:step-6-1-rate-limit`, `test:step-6-2-helmet`, `test:step-7-2-sentry` (see `server/package.json`).

---

## 12. File index (this effort)

| File | Role |
|------|------|
| `docs/LAUNCH_REMAINING_WORK.md` | **This file** — master remaining work |
| `docs/PRODUCTION_READINESS.md` | Env templates + role-based QA |
| `MANUAL_QA_GATE_CHECKLIST.md` | Deep manual gate (office, calendar, etc.) |
| `docs/ORGANIZATION_API_INTEGRATION_PLAN.md` | Original step plan + DoD |
| `server/.env.example` | Server env template |
| `client/.env.example` | Client env template |

When an item is finished, check it off here and in the relevant section of `PRODUCTION_READINESS.md`.
