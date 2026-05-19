# StartupVerse — Coding todo (step by step)

**Source:** [`LAUNCH_REMAINING_WORK.md`](LAUNCH_REMAINING_WORK.md) §5 (code only).  
**Out of scope here:** env setup, manual QA, deploy, legal pages, UI redesign (`ui-plan.md`).

Work phases **in order**. Do not skip verification steps at the end of each phase.

**Legend:** `[ ]` = not started · `[~]` = in progress · `[x]` = done

---

## Phase 0 — Tooling baseline (≈ half day)

Quick wins so every later phase can be tested the same way.

### Step 0.1 — Wire missing npm smoke scripts

**Files:** `server/package.json`, `server/scripts/org-integration-smoke.mjs`

- [x] Add scripts:
  - `test:step-2-9-snapshot` → `node scripts/step_2_9_snapshot_smoke.mjs`
  - `test:step-2-12-event-notify` → `node scripts/step_2_12_event_notify_smoke.mjs` (already present)
  - `test:step-2-14-founder-to-org` → `node scripts/step_2_14_founder_to_org_smoke.mjs` (already present)
  - `test:step-3-1-list-query` → `node scripts/step_3_1_list_query_smoke.mjs`
  - `test:step-3-3-portfolio-health` → `node scripts/step_3_3_portfolio_health_smoke.mjs`
  - `test:step-3-4-cohort-analytics` → `node scripts/step_3_4_cohort_analytics_smoke.mjs`
- [x] `test:org-integration` → `node scripts/org-integration-smoke.mjs` (Part 1 default; `RUN_ORG_INTEGRATION_HTTP=1` for Mongo HTTP matrix).

**Verify**

- [x] `npm run test:step-3-3-portfolio-health` exits 0 (Part 1).
- [x] `npm run test:org-integration` exits 0 (Part 1, all 13 scripts).

---

### Step 0.2 — Audit list endpoints for pagination

**Goal:** Know exactly what Step 3.1 still needs before coding.

**Artifact:** [`PAGINATION_AUDIT.md`](PAGINATION_AUDIT.md) — backend/frontend matrices, P0 gap (invitations), Phase 1 file list.

- [x] Grep `server/src/controllers` for list handlers **without** `parseListQuery`.
- [x] Record gaps in [`PAGINATION_AUDIT.md`](PAGINATION_AUDIT.md) (P0: `listCohortInvitations`; P2: org/cohort/admin enumerations).
- [x] Grep client org list UIs for client-side-only filtering that should pass `?q`, `?limit`, `?skip` to API:
  - `ResourceLibrary.jsx` — **done** (`useOrgListQuery`)
  - `MentorManager.jsx` — **done** (`useOrgListQuery`)
  - `CohortDashboardWithSidebar.jsx` — members **done**; pending invites **gap** (unpaginated API)
  - `DeliverablesManager.jsx` — **partial** (default limit 25, no paging UI)
  - `CommunicationCenter.jsx` — **partial** (messages + announcements)
  - Also documented: `EventManager`, `ProgramMilestones`, `MentorAssignmentManager`, `OrganizationAgenda`

**Verify**

- [x] Written list of backend routes + frontend files to touch in Phase 1 (see audit doc § Phase 1 implementation order).

---

## Phase 1 — List pagination (Step 3.1 finish) (≈ 1–2 days)

**IDs:** O4, O5 (partial)

### Step 1.1 — Backend: paginate cohort invitations

**Files**

- `server/src/controllers/invitations.controller.js` — `listCohortInvitations`
- `server/src/routes/invitations.routes.js` (only if route params change)
- `client/src/utils/api/organizationApi.js` — `listCohortInvitations` if envelope shape changes

**Tasks**

- [x] Import `parseListQuery`, `paginatedSuccess` from `server/src/utils/listQuery.js`.
- [x] Replace `.find().sort()` with `listDocumentsWithSearch` or equivalent paginated query.
- [x] Support `?q`, `?limit`, `?skip`, `?sortBy`, `?sortOrder`, keep `?status=pending|all`.
- [x] Return `{ items, total, limit, skip }` via `paginatedSuccess`.
- [x] Update client caller in `CohortDashboardWithSidebar.jsx` — `PendingInvitationsPanel` + `getCohortInvitationsPage`.

**Verify**

- [x] `RUN_INVITATION_HTTP=1 npm run test:step-2-13-invitations` still passes.
- [ ] Manual: members tab invitations list loads with many rows.

---

### Step 1.2 — Backend: fix any other unpaginated org lists

**Tasks** (from Step 0.2 audit)

- [x] P2 enumeration lists deferred per [`PAGINATION_AUDIT.md`](PAGINATION_AUDIT.md) (`getCohortsByOrganization`, `getOrganizationsByUser`, `getOrganizationAdmins`) — no code change.
- [x] HTTP smoke: cohort invitations pagination + `?q` in [`step_3_1_list_query_smoke.mjs`](../server/scripts/step_3_1_list_query_smoke.mjs) Part 2.

**Verify**

- [x] `RUN_LIST_QUERY_HTTP_FLOWS=1 npm run test:step-3-1-list-query` passes.

---

### Step 1.3 — Frontend: server-backed search + pagination

**Files** (adjust per Step 0.2 audit)

- `client/src/hooks/useDebouncedValue.js` (reuse)
- `client/src/utils/api/organizationApi.js`
- Org list components listed in Step 0.2

**Tasks**

- [x] Wire `useOrgListQuery` + existing `*Page` helpers (no new API helpers needed).
- [x] Debounce search input (~300ms) via `useOrgListQuery`.
- [x] Pagination controls on DeliverablesManager, CommunicationCenter, EventManager, ProgramMilestones.
- [x] Deliverables: `includeArchived` passed to server; submissions list paginated per deliverable.

**Verify**

- [x] `npm run build` in `client/` succeeds.
- [ ] Manual: search/pagination on deliverables, communication, events, milestones tabs.

---

### Step 1.4 — MentorAssignmentManager (pagination audit)

**Files**

- `client/src/components/organizations/MentorAssignmentManager.jsx`

**Tasks**

- [x] Wire mentors list to `useOrgListQuery` + `getOrganizationMentorsPage` (search + pagination).
- [x] Wire founders list to `useOrgListQuery` + `getCohortMembersPage` when a mentor is selected (`autoFetch`).
- [x] Remove redundant client-side founder filter after server `?q`.
- [x] Load `assigned-founders` only when mentor list changes (not on member search/page).

**Verify**

- [x] `npm run build` in `client/` succeeds.
- [ ] Manual: org with &gt;25 mentors and cohort with &gt;25 founders; assign/unassign; invite mentor.

---

### Step 1.5 — Mongo indexes for `?q` search (optional but planned)

**Files**

- [`server/scripts/ensure-search-indexes.mjs`](../server/scripts/ensure-search-indexes.mjs)
- [`server/src/db/searchIndexManifest.js`](../server/src/db/searchIndexManifest.js)
- [`server/scripts/step_1_5_search_indexes_smoke.mjs`](../server/scripts/step_1_5_search_indexes_smoke.mjs)
- Models: Resource, Deliverable, Event, ProgramMilestone, Announcement

**Tasks**

- [x] Align text indexes in schemas (Deliverable + ProgramMilestone include `description`).
- [x] Idempotent `npm run db:ensure-search-indexes` (`syncIndexes` per manifest).
- [x] Document Atlas runbook in [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md).

**Verify**

- [x] `npm run test:step-1-5-search-indexes` (Part 1, no Mongo).
- [ ] `npm run db:ensure-search-indexes` on staging/Atlas after deploy.
- [ ] Manual: search on staging with realistic data returns in &lt; 1s for typical cohort size.

---

## Phase 2 — Sidebar badge counts (O1) (≈ 1 day)

### Step 2.1 — Backend: `GET /cohorts/:cohortId/badge-counts`

**Files**

- `server/src/controllers/cohortWorkspace.controller.js` (or `organizations.controller.js`)
- `server/src/routes/organizations.routes.js` or `cohortWorkspace` routes
- `server/scripts/lib/orgPermissionManifest.mjs` — add route + expected middleware

**Tasks**

- [x] Implement handler returning `{ unreadMessages, pendingSubmissions, newAnnouncements, upcomingEventsNext7d }`.
- [x] Counting rules in [`server/src/utils/cohortBadgeCounts.js`](../server/src/utils/cohortBadgeCounts.js) (messages `readAt`, submissions `submitted`, announcements `readBy`, events `startsAt` in 7d).
- [x] `requireAuth` + `requireOrgAdmin` on route.
- [x] Smoke: [`server/scripts/step_3_5_badge_counts_smoke.mjs`](../server/scripts/step_3_5_badge_counts_smoke.mjs).
- [x] `test:step-3-5-badge-counts` in `package.json`.

**Verify**

- [x] `npm run test:step-3-5-badge-counts` Part 1; `RUN_BADGE_COUNTS_HTTP=1` Part 2.
- [x] Wrong role gets 403 (HTTP smoke).

---

### Step 2.2 — Frontend: wire sidebar badges

**Files**

- `client/src/utils/api/organizationApi.js` — `getCohortBadgeCounts(cohortId)`
- `client/src/components/organizations/OrganizationSidebar.jsx`
- `client/src/components/organizations/CohortDashboardWithSidebar.jsx` (pass counts or fetch in shell)

**Tasks**

- [x] Fetch badge counts on cohort load.
- [x] Refresh every 60s (`setInterval`, cleanup on unmount).
- [x] Replace `stats?.totalStartups` badge on Members with appropriate counts (keep startup count if product wants both).
- [x] Show badges on relevant nav items (messages, deliverables, announcements, events).

**Verify**

- [ ] Manual: pending submission increments badge; mark reviewed → badge drops (after refresh or Phase 3 socket).

---

## Phase 3 — Org realtime (O2) (≈ 2 days)

### Step 3.1 — Backend: audit and complete socket emits

**Files**

- `server/src/services/realtime.service.js`
- Controllers: `cohortWorkspace.controller.js`, `deliverables.controller.js`, `organizationMessages.controller.js`, `invitations.controller.js`

**Tasks**

- [x] List CRUD actions that should notify org dashboards:
  - deliverable created / submission / review
  - message / bulk-send
  - announcement created
  - event created / updated / deleted
  - invitation accepted / pending count changed
- [x] For each missing emit, call `emitToOrganization` → `organization:<id>` (see `server/src/realtime/emitOrg.js`).
- [x] Standardize event names (document in `server/src/realtime/README.md`):
  - `deliverable:created`, `event:created`, `resource:created`, `cohort-invitation:changed`; submission/review via `deliverable:updated`.

**Verify**

- [ ] Spot-check with two browsers: action in one updates second after socket (before Phase 3.2 client hook, use socket debug or logging).

---

### Step 3.2 — Frontend: `useOrgRealtime` hook

**Files**

- New: `client/src/hooks/useOrgRealtime.js`
- Reuse: `client/src/utils/socketBaseUrl.js`, existing socket client setup from founder/inbox

**Tasks**

- [x] Accept `(organizationId, cohortId, { onDeliverable, onMessage, onAnnouncement, onEvent, onInvitation, onReconnect })`.
- [x] Join room: `organization:<id>` only (`client/src/utils/socketIoRealtime.js` + `client/src/realtime/orgEvents.js`).
- [x] Subscribe to events from Step 3.1; call callbacks; cleanup on unmount (`useOrgRealtime.js`).
- [x] Handle disconnect/reconnect (poll + `onReconnect`).

**Verify**

- [ ] No duplicate listeners when navigating between org tabs.

---

### Step 3.3 — Frontend: subscribe in org dashboards

**Files**

- `client/src/components/organizations/OrganizationDashboard.jsx`
- `client/src/components/organizations/CohortDashboardWithSidebar.jsx`
- `client/src/components/organizations/CommunicationCenter.jsx`
- `client/src/components/organizations/DeliverablesManager.jsx`

**Tasks**

- [x] On relevant event: refetch list slice or patch local state (prefer targeted refetch first).
- [x] On deliverable/message/announcement/event/invitation events: refetch badge counts (Phase 2).
- [x] Avoid full-page reload; use existing data loaders / `toast` on errors only.

**Verify**

- [ ] Manual: submit deliverable as founder → org deliverables tab updates without F5.
- [ ] Manual: send org message → Communication Center updates.

---

## Phase 4 — Cohort export API (O3) (≈ 1 day)

### Step 4.1 — Backend: `GET /cohorts/:cohortId/export`

**Files**

- `server/src/controllers/organizations.controller.js` or `cohortWorkspace.controller.js`
- `server/src/routes/organizations.routes.js`
- Reuse: `loadCohortMembersEnriched` (same data as export today)

**Tasks**

- [x] `requireAuth` + org admin for cohort.
- [x] Query param `?format=csv|json` (default `csv`).
- [x] Columns match current client export: startup name, founder, stage, team size, status, last activity, weekly streak.
- [x] Set `Content-Type` and `Content-Disposition: attachment; filename="cohort-export.csv"`.
- [x] Add smoke `step_4_1_cohort_export_smoke.mjs` + permissions manifest.

**Verify**

- [x] `curl` with auth returns valid CSV (HTTP smoke Part 2).
- [x] Non-admin → 403 (HTTP smoke Part 2).

---

### Step 4.2 — Frontend: call export API

**Files**

- `client/src/utils/api/organizationApi.js` — `downloadCohortExport(cohortId)`
- `client/src/components/organizations/CohortDashboardWithSidebar.jsx`
- Remove or thin `generateCohortExport` / `exportToCSV` in `organizationBackendHelpers.js`

**Tasks**

- [x] Export button triggers download via blob / `window.open` / fetch + save.
- [x] Loading state + error toast on failure.
- [x] Delete deprecated `generateCohortExport` client assembly (grep callers first).

**Verify**

- [ ] Manual: export downloads file with same columns as before.

---

## Phase 5 — Email routes & API cleanup (O6, X8) (≈ 1 day)

### Step 5.1 — Legacy `emails.routes.js`

**Files**

- `server/src/routes/emails.routes.js`
- `server/API_CLIENT_CALL_CATALOG.json` (regenerate if needed)
- Client callers of `/emails/send-invitation`, `/send-notification`, `/send-welcome`

**Tasks**

- [x] Grep client for `/emails/send-`.
- [x] **If unused:** remove placeholder routes; run `npm run export:client-api-call-catalog` + alignment gate.
- [x] **If used:** implement with `sendEmail` + appropriate templates; return real `{ sent, id }`. (N/A — unused; removed placeholders.)

**Verify**

- [x] `npm run test:alignment-gate` passes.
- [x] `/emails/test` still reports `sent` / `transport` correctly.

---

### Step 5.2 — 501 compat route audit

**Files**

- `server/src/utils/compat.js`
- `server/API_CLIENT_CALL_CATALOG.json`
- Any client file calling 501 endpoints

**Tasks**

- [x] List routes that return “not implemented yet”.
- [x] Per route: implement minimal handler **or** remove client call **or** hide UI affordance.
- [x] Re-run `npm run test:phase1-client-call-catalog`.

**Verify**

- [ ] No user-visible button hits 501 on happy path in manual smoke.

---

## Phase 6 — Production hardening (code) (≈ 1–2 days)

**IDs:** X1, X2

### Step 6.1 — Rate limiting

**Files**

- New: `server/src/middleware/rateLimit.js`
- `server/src/app.js` — apply before `/api/v1`
- `server/package.json` — add `express-rate-limit` if used

**Tasks**

- [x] Stricter limits on: `POST /auth/signin`, `POST /auth/signup`, `POST /uploads`, `POST /messages/bulk-send`.
- [x] Generous default for authenticated API.
- [x] Return 429 with stable JSON envelope (`apiError`).
- [x] Document limits in `PRODUCTION_READINESS.md` (one line).

**Verify**

- [x] Burst login attempts return 429 (`npm run test:step-6-1-rate-limit`).
- [ ] Normal org workflow unaffected.

---

### Step 6.2 — Security headers (Helmet)

**Files**

- `server/src/app.js`
- `server/src/middleware/securityHeaders.js`
- `server/package.json` — `helmet`

**Tasks**

- [x] Add `helmet()` with config compatible with CORS + cookies + Socket.IO (`crossOriginResourcePolicy: cross-origin`, CSP off on API, HSTS only in production).
- [x] Do not break local dev (CORS_ORIGIN localhost).

**Verify**

- [x] `GET /health` returns `X-Content-Type-Options`, `X-Frame-Options`, etc. (`npm run test:step-6-2-helmet`).
- [ ] Client app still loads and API calls succeed (manual).

---

## Phase 7 — CI & observability (code) (≈ 1 day)

**IDs:** X5, X3, X4 (code hooks only)

### Step 7.1 — Expand GitHub Actions

**Files**

- `.github/workflows/alignment-gate.yml`

**Tasks**

- [x] After alignment gate, run (with Mongo service already present):
  - `npm run test:step-3-6-permissions-audit`
  - `npm run test:step-3-7-deprecated-helpers`
  - With env: `RUN_ORG_PERMISSION_HTTP_FLOWS=1 npm run test:step-3-6-permissions`
  - `RUN_INVITATION_HTTP=1 npm run test:step-2-13-invitations`
  - `npm run test:step-7-2-sentry`
- [x] Do **not** add `RUN_EMAIL_LIVE` / `RUN_UPLOAD_LIVE` without GitHub secrets.
- [x] CI env: `EMAIL_DRIVER=log`, `RATE_LIMIT_DISABLED=true`, `PUBLIC_APP_URL` for invite links.

**Verify**

- [ ] PR/push workflow green on `main` (after push).

---

### Step 7.2 — Error monitoring (optional but recommended)

**Files**

- `server/src/config/sentry.js`, `server/src/index.js`, `server/src/app.js`, `server/src/middleware/errorHandler.js`
- `client/src/config/sentry.js`, `client/src/main.jsx`, `client/src/components/SentryErrorFallback.jsx`
- Env: `SENTRY_DSN` (server), `VITE_SENTRY_DSN` (client build) — documented in `PRODUCTION_READINESS.md`

**Tasks**

- [x] Install `@sentry/node` + `@sentry/react`.
- [x] Only initialize when DSN set (`SENTRY_DSN` / `VITE_SENTRY_DSN`).
- [x] Scrub cookies, Authorization, passwords in `beforeSend`.

**Verify**

- [x] `npm run test:step-7-2-sentry` (static + import without DSN).
- [ ] Throw test error in staging → appears in Sentry dashboard (manual).

---

## Phase 8 — Documentation sync (O7) (≈ 2 hours)

**Not feature code** — keeps the team aligned.

- [x] Walk [`ORGANIZATION_API_INTEGRATION_PLAN.md`](ORGANIZATION_API_INTEGRATION_PLAN.md) § Definition of Done; check off items completed in Phases 1–7.
- [x] Update [`LAUNCH_REMAINING_WORK.md`](LAUNCH_REMAINING_WORK.md) §0, §1, §5, §6, §8–10 — move finished IDs to completed.
- [x] Update [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md) §4 (O1–O4, cross-cutting IDs aligned with LAUNCH).

---

## Phase 9 — Optional / product decision

Only if explicitly in scope for v1:

### Step 9.1 — Google Calendar (X7)

- [x] OAuth routes: connect, callback, status, disconnect, instant-meeting, create-meeting ([`GOOGLE_OAUTH_SETUP.md`](GOOGLE_OAUTH_SETUP.md)).
- [x] Client: `GoogleAccountConnect`, `googleMeet.js`, Settings Virtual Office tab, Mentor portal.
- [x] `npm run test:step-9-1-google` + updated `test:step-5-2-501-compat`.
- [ ] Create Google Cloud OAuth app + set env on staging (you).
- [ ] Manual QA: connect, instant Meet, disconnect ([`MANUAL_QA_GATE_CHECKLIST.md`](../MANUAL_QA_GATE_CHECKLIST.md) calendar section).

### Step 9.2 — UI redesign (`ui-plan.md`)

Separate epic; not required for org pilot per launch doc. Rollout guide: [`UI_REDESIGN_ROLLOUT.md`](UI_REDESIGN_ROLLOUT.md).

#### Step 9.2a — Foundation (flags + shell primitives)

- [x] Master + per-area `VITE_UI_REDESIGN_*` flags in [`featureFlags.js`](../client/src/config/featureFlags.js) (all default off).
- [x] `AppLayoutHybrid` uses shared `PageHeader` (`appBar` variant); org-admin header unchanged.
- [x] Barrel exports: [`client/src/components/shell/index.js`](../client/src/components/shell/index.js), [`client/src/domains/index.js`](../client/src/domains/index.js).
- [x] [`client/.env.example`](../client/.env.example) documents UI flags.
- [x] Verify: `cd client && npm run build`

#### Step 9.2b — Founder home

- [ ] Weekly loop UI behind `VITE_UI_REDESIGN` + `VITE_UI_REDESIGN_FOUNDER_HOME`; legacy dashboard fallback.

#### Step 9.2c — Virtual Office

- [ ] Zoned layout behind `VITE_UI_REDESIGN_VIRTUAL_OFFICE`.

#### Step 9.2d — Team member

- [ ] My Work Today experience behind `VITE_UI_REDESIGN_TEAM_MEMBER`.

#### Step 9.2e — Talent

- [ ] Talent home + browse behind `VITE_UI_REDESIGN_TALENT`.

#### Step 9.2f — Inbox + notifications

- [ ] Unified inbox UX behind `VITE_UI_REDESIGN_INBOX`.

#### Step 9.2g — Analytics + Settings

- [ ] Layout refresh behind `VITE_UI_REDESIGN_ANALYTICS_SETTINGS`.

#### Step 9.2h — Parity + cleanup

- [ ] Manual acceptance per ui-plan §8.2; remove legacy paths only with explicit signoff (no deletions without approval).

---

## Master checklist (coding phases only)

| Phase | Focus | Done? |
|-------|--------|-------|
| 0 | npm scripts + pagination audit | [x] |
| 1 | List pagination backend + frontend + indexes | [x] |
| 2 | Badge counts API + sidebar | [x] |
| 3 | Org socket emits + `useOrgRealtime` + wire UI | [x] |
| 4 | Cohort export API + download | [x] |
| 5 | Email routes + 501 audit | [x] |
| 6 | Rate limit + Helmet | [x] |
| 7 | CI smokes + Sentry (optional) | [x] |
| 8 | Doc sync | [x] |
| 9 | Google / UI redesign (optional) | [~] |

---

## After all coding phases

Run from `server/` (staging Mongo + `.env.local`):

```bash
npm run verify:release
# Full org integration batch — see LAUNCH_REMAINING_WORK.md §3.2
```

Then complete **manual QA** in [`MANUAL_QA_GATE_CHECKLIST.md`](../MANUAL_QA_GATE_CHECKLIST.md) and **deploy** per [`LAUNCH_REMAINING_WORK.md`](LAUNCH_REMAINING_WORK.md) §4.

---

## Suggested branch strategy

| Branch | Phase |
|--------|-------|
| `feat/step-0-tooling` | Phase 0 |
| `feat/step-3-1-pagination` | Phase 1 |
| `feat/step-3-5-badge-counts` | Phase 2 |
| `feat/org-realtime` | Phase 3 |
| `feat/cohort-export-api` | Phase 4 |
| `chore/api-cleanup` | Phase 5 |
| `feat/security-hardening` | Phase 6 |
| `ci/org-smokes` | Phase 7 |
| `chore/doc-sync-phase-8` | Phase 8 |
| `feat/google-oauth-phase-9` | Phase 9.1 |

Merge to `main` after each phase’s **Verify** section passes.
