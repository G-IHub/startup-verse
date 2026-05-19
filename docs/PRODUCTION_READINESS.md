# StartupVerse — Production readiness checklist

This document is the single place to see **what is left to do**, **how to configure each part of the repo**, and **what to verify per user role** before calling the product production-ready.

**Full manual test checklist:** [`MANUAL_QA_GATE_CHECKLIST.md`](../MANUAL_QA_GATE_CHECKLIST.md) (all roles, staging + prod smoke).

Last aligned with the codebase after **Organization API integration Phases 1–3.7** (permissions audit, deprecated helper removal). The integration plan’s formal Definition of Done checkboxes in `ORGANIZATION_API_INTEGRATION_PLAN.md` are still unchecked in that file; use **this** document as the live launch checklist.

---

## 1. Repo layout

| Directory | Purpose | Deploy? |
|-----------|---------|---------|
| [`client/`](../client/) | Vite + React SPA (all roles use one app) | Yes — static host (Vercel, Netlify, S3+CDN, etc.) |
| [`server/`](../server/) | Express API + Socket.IO + MongoDB | Yes — Node host (Railway, Render, VM, Docker) |
| [`docs/`](../docs/) | Plans and runbooks | No |
| Root [`package.json`](../package.json) | Thin wrapper (`cookie-parser` only) | No separate deploy |

There is **one** frontend build and **one** API. Roles (`founder`, `talent`, `team-member`, `organization-admin`, mentor magic-link, platform `admin`) are **account roles**, not separate env files per role.

---

## 2. Environment files (by directory)

### 2.1 Server — `server/.env.local` (local) / host secrets (production)

The server loads env in this order ([`server/src/config/env.js`](../server/src/config/env.js)):

1. `server/.env.local` (optional, local overrides)
2. `server/.env` (optional)

Copy from [`server/.env.example`](../server/.env.example) into `server/.env.local` for development and into your host’s secret manager for production.

#### Required (server will not start without these)

| Variable | Description | Example (local) | Example (production) |
|----------|-------------|-----------------|----------------------|
| `NODE_ENV` | Runtime mode | `development` | `production` |
| `PORT` | HTTP listen port | `5000` | `5000` |
| `CORS_ORIGIN` | Allowed browser origin(s), comma-separated | `http://localhost:5173` | `https://app.yourdomain.com` |
| `JWT_SECRET` | Signing secret for auth cookies/tokens | long random string (32+ chars) | strong secret from vault |
| `JWT_EXPIRES_IN` | JWT/cookie lifetime | `7d` | `7d` |
| `MONGODB_CONNECTION_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/startupverse` | Atlas URI with auth |
| `MONGODB_DB_NAME` | Optional DB name override | _(empty or `startupverse`)_ | `startupverse_prod` |

#### Strongly recommended for production

| Variable | Description | When needed |
|----------|-------------|-------------|
| `PUBLIC_APP_URL` | Canonical frontend URL (no trailing slash) for emails & links | **Required** if you send cohort invites or mentor magic links |
| `EMAIL_DRIVER` | `mailtrap` or `log` | Set `mailtrap` in production |
| `MAILTRAP_API_TOKEN` | Mailtrap API token | Production email delivery |
| `EMAIL_FROM` | Verified sender, e.g. `StartupVerse <noreply@yourdomain.com>` | Production email delivery |
| `MAILTRAP_USE_SANDBOX` | `true` / unset | `true` + `MAILTRAP_INBOX_ID` for dev sandbox (no real delivery) |
| `MAILTRAP_INBOX_ID` | Sandbox inbox numeric id | Required when sandbox mode is on |
| `CLOUDINARY_URL` _or_ `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET` | Cloudinary config | **Required** for file uploads (logos, resources, attachments) |

`PUBLIC_APP_URL` falls back to `CLIENT_URL` or `FRONTEND_URL` if unset ([`server/src/utils/publicAppUrl.js`](../server/src/utils/publicAppUrl.js)).

#### Optional / feature flags

| Variable | Default | Purpose |
|----------|---------|---------|
| `EMAIL_DRIVER` | auto (`mailtrap` if `MAILTRAP_API_TOKEN`, else `log`) | Dev without Mailtrap logs emails only |
| `GOOGLE_INTEGRATION_ENABLED` | off (`false`) | Google Calendar/Meet OAuth — see [`GOOGLE_OAUTH_SETUP.md`](GOOGLE_OAUTH_SETUP.md) |
| `GOOGLE_CLIENT_ID` | unset | Required when integration enabled |
| `GOOGLE_CLIENT_SECRET` | unset | Required when integration enabled |
| `GOOGLE_REDIRECT_URI` | auto in dev | Must match Google Cloud Console (e.g. `http://localhost:5000/api/v1/google/oauth/callback`) |
| `GOOGLE_OAUTH_STATE_SECRET` | `JWT_SECRET` | HMAC signing for OAuth `state` parameter |
| `DISABLE_SERVER_CRON` | `false` | Set `true` to disable in-process cron |
| `SCHEDULER_TZ` | system | Timezone for scheduled jobs |
| `REMINDER_JOB_POLL_MS` | `10000` | Reminder worker poll interval |
| `RATE_LIMIT_DISABLED` | `false` | Set `true` to disable all HTTP rate limiters (dev/CI) |
| `TRUST_PROXY` | auto (`true` when `NODE_ENV=production`) | Use client IP behind nginx/Render (`trust proxy`) |
| `RATE_LIMIT_AUTH_MAX` / `RATE_LIMIT_AUTH_WINDOW_MS` | `10` / `900000` (15 min) | Per-IP cap on `POST /auth/signin` and `/auth/signup` |
| `RATE_LIMIT_UPLOAD_MAX` / `RATE_LIMIT_UPLOAD_WINDOW_MS` | `30` / `900000` | Per-IP cap on `POST /uploads` |
| `RATE_LIMIT_BULK_SEND_MAX` / `RATE_LIMIT_BULK_SEND_WINDOW_MS` | `20` / `900000` | Per-IP cap on `POST /messages/bulk-send` |
| `RATE_LIMIT_API_MAX` / `RATE_LIMIT_API_WINDOW_MS` | `500` / `900000` | Default per-IP cap on other `/api/v1` routes |
| `HELMET_DISABLED` | `false` | Set `true` to disable Helmet security headers (dev/CI) |
| `SENTRY_DSN` | unset | Optional — enables `@sentry/node` on API ([`sentry.js`](../server/src/config/sentry.js)) |
| `SENTRY_ENVIRONMENT` | `NODE_ENV` | Optional Sentry environment tag override |
| `VITE_SENTRY_DSN` | unset | Optional — client build only; enables `@sentry/react` |
| `VITE_SENTRY_ENVIRONMENT` | Vite `MODE` | Optional client Sentry environment override |

API responses include Helmet defaults (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, etc.) via [`securityHeaders.js`](../server/src/middleware/securityHeaders.js), with `Cross-Origin-Resource-Policy: cross-origin` so credentialed SPA `fetch` works. CSP is off on the JSON API; HSTS applies only when `NODE_ENV=production`. Static client host may still need platform CSP/HSTS separately.

#### Server `.env.local` template (development)

```env
# --- Required ---
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=change-me-use-openssl-rand-hex-32
JWT_EXPIRES_IN=7d
MONGODB_CONNECTION_URI=mongodb://127.0.0.1:27017/startupverse
MONGODB_DB_NAME=startupverse

# --- Frontend URL (emails, invitation links) ---
PUBLIC_APP_URL=http://localhost:5173

# --- Email (dev: log only) ---
EMAIL_DRIVER=log
# EMAIL_DRIVER=mailtrap
# MAILTRAP_API_TOKEN=your_mailtrap_api_token
# EMAIL_FROM=StartupVerse <noreply@yourdomain.com>
# MAILTRAP_USE_SANDBOX=true
# MAILTRAP_INBOX_ID=1234567

# --- Uploads (Cloudinary required) ---
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
# or CLOUDINARY_URL=cloudinary://key:secret@cloud

# --- Optional ---
# GOOGLE_INTEGRATION_ENABLED=false
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
# GOOGLE_REDIRECT_URI=http://localhost:5000/api/v1/google/oauth/callback
# DISABLE_SERVER_CRON=false
```

#### Server production template (minimal)

```env
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://app.yourdomain.com
JWT_SECRET=<from-secret-manager>
JWT_EXPIRES_IN=7d
MONGODB_CONNECTION_URI=<atlas-uri>
MONGODB_DB_NAME=startupverse_prod

PUBLIC_APP_URL=https://app.yourdomain.com

EMAIL_DRIVER=mailtrap
MAILTRAP_API_TOKEN=<mailtrap-token>
EMAIL_FROM=StartupVerse <noreply@yourdomain.com>

CLOUDINARY_URL=<cloudinary-url>
```

**Production notes**

- Serve API over **HTTPS** so auth cookies use `secure: true`.
- All uploads go to **Cloudinary** (`POST /uploads` returns `https://` URLs). Configure credentials in every environment that accepts file uploads.
- Socket.IO uses the **same origin** as derived from the client’s API URL (see client `VITE_API_URL`).

---

### 2.2 Client — `client/.env.local` (local) / host env (production)

Reference: [`client/.env.example`](../client/.env.example), [`client/src/config/apiBase.js`](../client/src/config/apiBase.js).

The client **throws at startup** if `VITE_API_URL` is missing.

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | **Yes** | Full API base including `/api/v1`, **no** trailing slash |
| `VITE_INCLUDE_COMPENSATION_DEMO` | No | `true` to show compensation demo routes |
| `VITE_VERBOSE_CONSOLE` | No | `true` for extra client logging |
| `VITE_UI_REDESIGN` | No | Master gate for UI redesign; when `false`, all area flags are off ([`UI_REDESIGN_ROLLOUT.md`](UI_REDESIGN_ROLLOUT.md)) |
| `VITE_UI_REDESIGN_SHELL` | No | Shared shell/token cleanup (future slice) |
| `VITE_UI_REDESIGN_FOUNDER_HOME` | No | Founder home redesign |
| `VITE_UI_REDESIGN_VIRTUAL_OFFICE` | No | Virtual Office zoned layout |
| `VITE_UI_REDESIGN_TEAM_MEMBER` | No | Team member “My Work Today” |
| `VITE_UI_REDESIGN_TALENT` | No | Talent home + browse |
| `VITE_UI_REDESIGN_INBOX` | No | Inbox + notification UX |
| `VITE_UI_REDESIGN_ANALYTICS_SETTINGS` | No | Analytics + Settings layout |
| `VITE_SENTRY_DSN` | No | Optional — enables `@sentry/react` ([`sentry.js`](../client/src/config/sentry.js)); rebuild client after setting |
| `VITE_SENTRY_ENVIRONMENT` | Vite `MODE` | Optional client Sentry environment override |

Socket.IO connects to `new URL(VITE_API_URL).origin` ([`client/src/utils/socketBaseUrl.js`](../client/src/utils/socketBaseUrl.js)) — no separate socket env var.

#### Client `.env.local` template (development)

```env
VITE_API_URL=http://localhost:5000/api/v1

VITE_INCLUDE_COMPENSATION_DEMO=false
VITE_VERBOSE_CONSOLE=false
VITE_UI_REDESIGN=false
VITE_UI_REDESIGN_SHELL=false
VITE_UI_REDESIGN_FOUNDER_HOME=false
VITE_UI_REDESIGN_VIRTUAL_OFFICE=false
VITE_UI_REDESIGN_TEAM_MEMBER=false
VITE_UI_REDESIGN_TALENT=false
VITE_UI_REDESIGN_INBOX=false
VITE_UI_REDESIGN_ANALYTICS_SETTINGS=false
```

#### Client production (hosting provider env)

```env
VITE_API_URL=https://api.yourdomain.com/api/v1
```

Rebuild/redeploy the client whenever `VITE_API_URL` changes (Vite bakes env at build time).

---

### 2.3 Root — no env

The repository root has no application runtime. Do not add a root `.env` unless you introduce a monorepo orchestration tool later.

---

## 3. Configuration by role (what must work)

All roles share **the same** `client` build and `server` API. Below: primary surfaces and production-critical flows.

### 3.1 Organization admin (`organization-admin`)

| Area | Main UI | Critical env / services |
|------|---------|-------------------------|
| Org & cohort CRUD | `OrganizationDashboard`, cohort sidebar | Mongo, JWT, CORS |
| Members & invites | `CohortDashboardWithSidebar`, `InviteStartupModal` | **Email** (`MAILTRAP_*`, `PUBLIC_APP_URL`) |
| Deliverables & review | `DeliverablesManager` | Mongo, auth middleware |
| Communication | `CommunicationCenter` | Mongo, optional sockets (see gaps) |
| Events, resources, milestones | `EventManager`, `ResourceLibrary`, `ProgramMilestones` | Uploads if attaching files |
| Mentors | `MentorManager`, `MentorAssignmentManager` | **Email** for magic links |
| Analytics & portfolio | `CohortAnalyticsDashboard`, `PortfolioOverview` | Mongo aggregates |
| Settings & logo | `OrganizationSettings` | **Uploads** + `PUT` logo URL (not base64) |
| Export | Cohort export button | Client-side CSV today (see gaps) |

**Manual QA script (org admin):** create org → cohort → invite founder (check email) → approve deliverable → bulk message → upload logo → open analytics/portfolio.

---

### 3.2 Founder (`founder`)

| Area | Main UI | Critical env / services |
|------|---------|-------------------------|
| Signup / login | Auth flows | JWT, Mongo |
| Virtual office / weekly loop | `FounderDashboard`, execution engine | Mongo, **sockets** (tasks, messages, activities) |
| Cohort membership | Invitations, `CohortInvitationCard` | Email for invite link |
| Founder → org message | Communication / inbox | Mongo |
| Deliverable submit | Founder deliverables views | Auth |
| Startup snapshot (when in cohort) | Org views founder data | Snapshot API |
| Talent matching / posts | Team matching, posts | Mongo |

**Manual QA script (founder):** signup → accept cohort invite → submit deliverable → message org → verify weekly loop saves.

---

### 3.3 Talent (`talent`)

| Area | Main UI | Critical env / services |
|------|---------|-------------------------|
| Signup / profile | Talent onboarding, profile | Mongo |
| Browse startups / interests | Browse flows, inbox | Mongo, sockets for interests/invitations |
| Chat | `TalentChatPage`, inbox | Mongo, sockets |

**Manual QA script (talent):** signup → complete profile → express interest → receive/respond to founder invitation.

---

### 3.4 Team member (`team-member`)

| Area | Main UI | Critical env / services |
|------|---------|-------------------------|
| Invite acceptance | Team member onboarding | Mongo |
| Performance / tasks | `TeamMemberDashboard`, `MyPerformancePage` | Mongo, founder linkage |
| Collaboration | Office / tasks (via founder startup) | Sockets on founder rooms |

**Manual QA script:** accept team invite → see assigned startup context → complete task if applicable.

---

### 3.5 Mentor (magic link, not full signup role)

| Area | Main UI | Critical env / services |
|------|---------|-------------------------|
| Magic link login | `/mentor/login`, `MentorPortal` | **Email**, `PUBLIC_APP_URL`, secure cookies in prod |
| Assigned founders | Mentor views | Mongo |

**Manual QA script:** org invites mentor → open email link → land on mentor portal → view assigned founder.

---

### 3.6 Platform admin (`isAdmin` / admin role)

| Area | Main UI | Critical env / services |
|------|---------|-------------------------|
| Admin dashboard | `AdminDashboard`, `AdminDashboardRealTime` | Mongo, elevated routes |
| User / data tools | Admin helpers | Mongo |

Restrict admin accounts in production; use separate staging admin for testing.

---

## 4. Remaining engineering work

### 4.1 Organization integration — optional follow-up

| ID | Item | Priority | Notes |
|----|------|----------|-------|
| O4-P2 | **Enumeration list pagination** | Low | Optional at scale: org/cohort/admin enumeration lists per [`PAGINATION_AUDIT.md`](PAGINATION_AUDIT.md) |

### 4.2 Cross-cutting product gaps

| ID | Item | Priority | Notes |
|----|------|----------|-------|
| X1 | **Rate limiting** | High | Step 6.1 done — `RATE_LIMIT_*` env; reverse proxy for volumetric DDoS |
| X2 | **Security headers (Helmet)** | High for public prod | Step 6.2 done on API; add CSP/HSTS on static client host at CDN if needed |
| X3 | **Monitoring (Sentry)** | High | Step 7.2 — opt-in via `SENTRY_DSN` / `VITE_SENTRY_DSN`; staging dashboard verify manual; add uptime on `/health` |
| X4 | **Logging & aggregation** | Medium | Structured logs exist; wire Datadog, CloudWatch, etc. |
| X5 | **CI pipeline** | Medium | Step 7.1 — alignment-gate + org HTTP smokes in GitHub Actions; run full §3.2 batch on staging |
| X6 | **Database backups & indexes** | High | Ops: Atlas backups; `npm run db:ensure-search-indexes` after deploy |
| X7 | **Google Calendar / Meet** | Low | Code done (Phase 9.1); enable with credentials per [`GOOGLE_OAUTH_SETUP.md`](GOOGLE_OAUTH_SETUP.md); manual OAuth QA on staging |
| X8 | **501 compat routes** | Low | Step 5.2 done — client gated; see [`501_ROUTE_AUDIT.md`](501_ROUTE_AUDIT.md) |

Pagination: primary org lists + invitations use `parseListQuery`; P2 enumeration lists optional ([`PAGINATION_AUDIT.md`](PAGINATION_AUDIT.md)).

### 4.3 Completed recently (no action unless regressing)

- **O1** Badge counts API + sidebar (`test:step-3-5-badge-counts`)
- **O2** Org realtime (`useOrgRealtime`, server emits)
- **O3** Cohort export API + client download (`test:step-4-1-cohort-export`)
- **O4** List pagination (core org lists + invitations)
- **O7** Integration plan DoD reconciled (Phase 8)
- Org member enrichment, cohort stats, portfolio health scoring, analytics trends (Steps 3.3–3.4)
- Upload service (`POST /uploads`), email via Mailtrap, invitation/mentor smokes (Steps 2.10–2.14)
- Permissions static audit + HTTP matrix (Step 3.6, in CI)
- Deprecated org helper removal + guardrail (Step 3.7)
- Snapshot route ordering (organizations router before founders router for `/startups/:id/snapshot`)
- Rate limit + Helmet (Steps 6.1–6.2); Sentry hooks (Step 7.2)

---

## 5. Pre-deploy verification (commands)

Run from **`server/`** unless noted.

### 5.1 Fast gate (no Mongo)

```bash
npm run verify:release
```

Runs alignment smokes + **client production build** ([`server/scripts/verify-release.mjs`](../server/scripts/verify-release.mjs)). Does not include Steps 3.3–3.7 unless you run them separately.

```bash
npm run test:step-3-7-deprecated-helpers
npm run test:step-3-6-permissions-audit
```

### 5.2 Staging gate (Mongo + `.env.local` on server)

```bash
# Contract HTTP flows
set VERIFY_HTTP_FLOWS=1
npm run verify:release

# Org / integration spot checks (examples)
set RUN_ORG_PERMISSION_HTTP_FLOWS=1
npm run test:step-3-6-permissions

set RUN_PORTFOLIO_HEALTH_HTTP_FLOWS=1
node scripts/step_3_3_portfolio_health_smoke.mjs

set RUN_COHORT_ANALYTICS_HTTP_FLOWS=1
node scripts/step_3_4_cohort_analytics_smoke.mjs

set RUN_INVITATION_HTTP=1
npm run test:step-2-13-invitations

set RUN_MENTOR_HTTP_FLOWS=1
npm run test:step-2-10-mentor

set RUN_EMAIL_HTTP_FLOWS=1
npm run test:step-2-11-email
```

On Unix/macOS, use `export VAR=1` instead of `set VAR=1`.

### 5.2.1 Org list search indexes (Step 1.5 — run once per environment)

After first deploy to Atlas (or whenever text-index definitions change in Mongoose schemas), sync indexes **once** — do not run on every app boot.

```bash
cd server
npm run test:step-1-5-search-indexes          # Part 1: manifest vs schema (no Mongo)
DRY_RUN=1 npm run db:ensure-search-indexes    # preview current indexes
npm run db:ensure-search-indexes              # apply syncIndexes (needs MONGODB_CONNECTION_URI)
```

Collections: `resources`, `deliverables`, `events`, `programmilestones`, `announcements`. Each should have one text index matching [`searchIndexManifest.js`](../server/src/db/searchIndexManifest.js).

**Atlas UI:** Cluster → Collections → Indexes — confirm text indexes exist on the collections above.

**Staging check:** Resource Library / Deliverables / Events / Milestones / Announcements with `?q=` on a cohort with many rows; target sub-second response.

### 5.3 Live email test (optional)

From `server/` with real Mailtrap:

```env
EMAIL_DRIVER=mailtrap
MAILTRAP_API_TOKEN=<token>
EMAIL_FROM=StartupVerse <verified@yourdomain.com>
MAILTRAP_TEST_TO=you@yourdomain.com
# Optional sandbox (no real inbox delivery):
# MAILTRAP_USE_SANDBOX=true
# MAILTRAP_INBOX_ID=<inbox-id>
```

```bash
set RUN_EMAIL_LIVE=1
npm run test:step-2-11-email
```

---

## 6. Production deployment checklist

### Infrastructure

- [ ] MongoDB Atlas (or managed Mongo) with auth, IP allowlist, backups
- [ ] API host with HTTPS termination
- [ ] Static client host with HTTPS
- [ ] `CORS_ORIGIN` matches exact client origin (scheme + host, no trailing slash)
- [ ] `VITE_API_URL` points to production API `/api/v1`
- [ ] `PUBLIC_APP_URL` points to production client origin
- [ ] Mailtrap sending domain verified; `EMAIL_FROM` uses that domain
- [ ] Cloudinary credentials configured for uploads
- [ ] Secrets in vault (not committed): `JWT_SECRET`, `MONGODB_CONNECTION_URI`, `MAILTRAP_API_TOKEN`, Cloudinary

### Application

- [ ] `NODE_ENV=production` on server
- [ ] Cookie auth works cross-origin only if client/API domains share parent domain or you use same-site setup correctly
- [ ] Socket.IO connects (check browser network tab on founder inbox / notifications)
- [ ] Cron/reminder worker acceptable for your hosting model (or `DISABLE_SERVER_CRON=true` + external scheduler if you split later)

### Role-based smoke (staging then prod)

- [ ] Organization admin: full cohort workflow (§3.1)
- [ ] Founder: invite accept, deliverable, messaging (§3.2)
- [ ] Talent: profile + interest flow (§3.3)
- [ ] Team member: invite accept (§3.4)
- [ ] Mentor: magic link from email (§3.5)

### Known acceptable limitations for v1 launch

- Sidebar badge counts not live until Step 3.5 ships
- Org pages may require manual refresh without socket subscriptions
- CSV export assembled on client, not a dedicated export API
- Email in dev uses `EMAIL_DRIVER=log` (no delivery)

---

## 7. Suggested env file locations (summary)

| Directory | Local file | Production |
|-----------|------------|------------|
| `server/` | `server/.env.local` | Host environment / secret manager |
| `client/` | `client/.env.local` | Hosting provider build env (`VITE_*`) |
| Root | _(none)_ | _(none)_ |

---

## 8. Is the repo production-ready?

| Scope | Verdict |
|-------|---------|
| **Org accelerator module** | Ready for **controlled production / pilot** after env + §6 checklists |
| **Full StartupVerse platform** | **Not fully done** — founder/talent/admin paths need the same staging discipline; open items in §4 |
| **Env only** | **Insufficient** — you also need email, storage, Mongo, HTTPS, CORS alignment, and QA per §3 |

Treat production as: **configure §2 → run §5 on staging → complete §6 role smokes → accept §4 limitations or schedule follow-up work.**
