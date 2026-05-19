# StartupVerse — Full manual QA checklist

**Purpose:** Human verification that the **entire product** works on **staging** (then a short subset on **production** after deploy). Use this with automated gates — scripts prove APIs and builds; this proves UI, email, cookies, sockets, and real user flows.

**Companion docs:** [`docs/LAUNCH_REMAINING_WORK.md`](docs/LAUNCH_REMAINING_WORK.md) (launch order + env), [`docs/PRODUCTION_READINESS.md`](docs/PRODUCTION_READINESS.md) (env templates), [`docs/ui-contract-matrix.md`](docs/ui-contract-matrix.md) (screen ↔ API map).

---

## How to use this document

1. Deploy **client + API** to staging with production-like env (Mongo, Mailtrap **sending**, Cloudinary, correct `PUBLIC_APP_URL` / `CORS_ORIGIN` / `VITE_API_URL`).
2. Run **automated prerequisites** (§0) from `server/`.
3. Walk each section below; check `- [ ]` when verified.
4. Record **waivers** inline (e.g. “Google off — N/A”) if a feature is out of scope for your launch.
5. **Pass criteria:** All sections checked or explicitly waived; no P0/P1 bugs open.

**Roles to test:** Use separate test accounts — `organization-admin`, `founder`, `team-member`, `talent`, mentor (magic link), platform `admin` (staging only).

**Tips:** Keep browser DevTools **Console** and **Network** open; use two browsers or incognito for realtime / permission tests.

---

## 0. Prerequisites — automated gates (run before manual QA)

From `server/` with valid `server/.env.local` (staging Mongo + secrets):

### 0.1 Always (no external services beyond Mongo for some)

- [ ] `npm run verify:release` — alignment gate + **client production build**
- [ ] `npm run test:step-3-6-permissions-audit`
- [ ] `npm run test:step-3-7-deprecated-helpers`

### 0.2 Staging Mongo batch (recommended full batch)

Set env vars then run (PowerShell example for one flag: `$env:RUN_INVITATION_HTTP="1"`). Full list: [`docs/LAUNCH_REMAINING_WORK.md`](docs/LAUNCH_REMAINING_WORK.md) §3.2.

- [ ] `VERIFY_HTTP_FLOWS=1 npm run verify:release`
- [ ] `RUN_ORG_PERMISSION_HTTP_FLOWS=1 npm run test:step-3-6-permissions`
- [ ] `RUN_INVITATION_HTTP=1 npm run test:step-2-13-invitations`
- [ ] `RUN_MENTOR_HTTP_FLOWS=1 npm run test:step-2-10-mentor`
- [ ] `RUN_EMAIL_HTTP_FLOWS=1 npm run test:step-2-11-email`
- [ ] `RUN_EVENT_NOTIFY_HTTP=1` → `node scripts/step_2_12_event_notify_smoke.mjs`
- [ ] `RUN_FOUNDER_TO_ORG_HTTP=1` → `node scripts/step_2_14_founder_to_org_smoke.mjs`
- [ ] `RUN_SNAPSHOT_HTTP_FLOWS=1` → `node scripts/step_2_9_snapshot_smoke.mjs`
- [ ] `RUN_PORTFOLIO_HEALTH_HTTP_FLOWS=1` → `node scripts/step_3_3_portfolio_health_smoke.mjs`
- [ ] `RUN_COHORT_ANALYTICS_HTTP_FLOWS=1` → `node scripts/step_3_4_cohort_analytics_smoke.mjs`
- [ ] `RUN_LIST_QUERY_HTTP_FLOWS=1` → `node scripts/step_3_1_list_query_smoke.mjs`
- [ ] `npm run test:step-3-5-badge-counts`
- [ ] `npm run test:step-4-1-cohort-export`
- [ ] `npm run test:step-6-1-rate-limit` (optional on staging if rate limits enabled)
- [ ] `npm run test:step-6-2-helmet`
- [ ] `npm run test:step-7-2-sentry` (when `SENTRY_DSN` set)

### 0.3 Live external services (staging credentials)

- [ ] `RUN_EMAIL_LIVE=1 npm run test:step-2-11-email` — real inbox receives message (`MAILTRAP_API_TOKEN`, `EMAIL_FROM`, `MAILTRAP_TEST_TO`)
- [ ] `RUN_UPLOAD_LIVE=1 npm run test:step-2-1-upload` — Cloudinary upload succeeds

### 0.4 Environment & connectivity (human spot-check)

- [ ] `GET https://<api-host>/health` returns 200
- [ ] Client loads from staging URL; no CORS errors on sign-in
- [ ] `VITE_API_URL` points at staging API (rebuilt client if changed)
- [ ] Invitation / mentor emails use correct host in links (`PUBLIC_APP_URL`)
- [ ] HTTPS on client + API in staging/prod; cookies work after login (no auth loop)
- [ ] Socket.IO connects (Network tab: websocket to API origin, no perpetual errors)

---

## 1. Auth and session (all roles)

- [ ] **Sign up** — new user; lands in expected onboarding / dashboard for role
- [ ] **Sign in** — existing user; session persists on refresh
- [ ] **Sign out** — protected pages redirect or 401; cannot call API without auth
- [ ] **Wrong password** — clear error; no stack trace in UI
- [ ] **Expired / cleared token** — protected API returns 401; app prompts re-login
- [ ] **Org admin gate** — user without `OrganizationAdmin` record cannot access org-only UI/routes
- [ ] **Cross-role** — dev role switcher only in development (not exposed in production build)

---

## 2. Organization admin (`organization-admin`)

### 2.1 Organization & cohort setup

- [ ] Create organization; appears in org picker / dashboard
- [ ] Update org settings (name, description, etc.)
- [ ] Create cohort; open cohort workspace (sidebar navigation)
- [ ] List cohorts for org; switch between cohorts without stale data
- [ ] Delete cohort (if product allows) — confirm UI warns and data removed as expected

### 2.2 Members, invitations, and email

- [ ] Invite founder to cohort — **email received** with link
- [ ] Invitation link opens app at correct URL (`PUBLIC_APP_URL`)
- [ ] **Cancel** pending invitation — status updates in UI
- [ ] **Resend** invitation — email received; rapid resend shows cooldown message if applicable
- [ ] Cohort **members list** shows founder + startup + progress (no blank `undefined` / `N/A` for mapped fields)
- [ ] Add org admin by email — success path
- [ ] Add org admin — 404 / 409 error messages sensible for unknown or duplicate admin

### 2.3 Deliverables

- [ ] Create / edit cohort deliverable (org admin)
- [ ] Founder in cohort can **list** deliverables
- [ ] Founder **submits** deliverable; org admin sees submission
- [ ] Team member with linked founder can submit (keyed to founder)
- [ ] Org admin **approves** submission — founder sees updated status
- [ ] Org admin **rejects** submission — feedback visible to founder
- [ ] Mentor (org-linked) can review where product allows
- [ ] User **not in cohort** cannot list or submit (403 or hidden UI)

### 2.4 Communication Center

- [ ] Open Communication Center for organization
- [ ] **Bulk message** to cohort founders — messages created; only valid recipients
- [ ] **Individual message** to one founder in cohort
- [ ] Founder sees org message; can reply if product allows
- [ ] Mark-as-read / unread state updates after refresh
- [ ] Unrelated user cannot read org message stream (403)

### 2.5 Events, announcements, resources, milestones

- [ ] Create **event** — appears on cohort calendar / founder views as designed
- [ ] Create **announcement** — visible to cohort participants
- [ ] Add **resource** (with file upload if used) — URL from Cloudinary loads
- [ ] Create **program milestone** — visible in cohort workspace
- [ ] Edit and delete (where supported) without console errors

### 2.6 Mentors

- [ ] Invite mentor to organization
- [ ] Mentor receives **magic link email**
- [ ] Assign founder to mentor (with `cohortId`) — assignment visible in UI
- [ ] Unassign founder from mentor
- [ ] Non–org-admin cannot assign mentors

### 2.7 Analytics, portfolio, export

- [ ] **Portfolio overview** loads with real cohort data (not empty error state for populated cohort)
- [ ] **Cohort analytics** dashboard loads (trends / velocity widgets)
- [ ] **Export cohort CSV** — download works; file opens with expected columns (`downloadCohortExport` / Export button)

### 2.8 Org UI polish & realtime

- [ ] **Badge counts** on sidebar update after invite / message / deliverable action (or within ~60s refresh)
- [ ] **Org realtime** — second browser as org admin: deliverable submit or message in another session updates lists without full page reload (or acceptable refresh)
- [ ] No `alert()` popups in org components (errors use toast / inline UI)
- [ ] **List views** — search / pagination on major org lists (invitations, members, messages) behave with `?q`, `?limit`, `?skip`

### 2.9 Uploads & logo

- [ ] Upload org logo via UI — `POST /uploads` → **HTTPS Cloudinary URL** saved on org
- [ ] Logo displays on settings after refresh
- [ ] Upload over size limit — clear error (≤ 10MB server limit)

### 2.10 Permissions (API spot-check, optional)

- [ ] **Cohort reads** (events, announcements, resources, milestones, members, analytics, portfolio): founder in cohort, team member with `startupId`, org admin, org-linked mentor can read; unrelated user **403**
- [ ] **Cohort writes** (events, announcements, resources, milestones, deliverable create): only org admin (or platform admin), not random founder

---

## 3. Founder (`founder`)

### 3.1 Onboarding & dashboard

- [ ] Sign up / complete founder profile
- [ ] **Founder dashboard** loads — weekly loop, milestones, tasks, execution score without server errors
- [ ] Create or update **weekly goal / outcome**
- [ ] Create **milestone**; mark complete / delete where supported
- [ ] Create **task**; assign; update status **pending → in-progress → completed**
- [ ] Set task **blocked** — requires reason + note in UI; persists after refresh
- [ ] Invalid status transition rejected with visible error (e.g. completed → pending)
- [ ] **Execution score** / streak displays; updates after relevant actions

### 3.2 Cohort & deliverables

- [ ] **Accept cohort invitation** from email or in-app
- [ ] View cohort context (deliverables, events) as participant
- [ ] **Submit deliverable** — org admin sees it (cross-check §2.3)
- [ ] **Message organization** (founder → org) — appears in Communication Center

### 3.3 Talent & team matching (if in scope)

- [ ] **Browse talent** / team matching — list loads
- [ ] Create or view **startup post** (if used)
- [ ] **Send invitation** to talent; talent receives in inbox / email path
- [ ] **Founder chat** / team chat pages load for startup with `startupId`

### 3.4 Founder journey & documents (spot-check)

- [ ] Open **Founder journey** and at least one stage page (ideation, team-building, etc.) — no crash
- [ ] **Documents** page loads
- [ ] **Pitch deck** page loads (if used in your pilot)

### 3.5 Analytics

- [ ] **Analytics dashboard** loads (`/analytics` or nav)
- [ ] Charts / summary match founder data; refresh does not 500

---

## 4. Team member (`team-member`)

- [ ] Accept **team invitation** (email or in-app)
- [ ] **Team dashboard** — assigned tasks visible (“My Work Today”)
- [ ] Update task status; blocked flow matches founder rules
- [ ] **My Performance** page loads metrics and task history
- [ ] Linked to founder **startup** — Virtual Office / presence usable when invited to startup
- [ ] **Calendar** shows cohort events / deliverables when startup in cohort (not founder-only empty state)
- [ ] Check-in from office appears in activity feed (see §9)

---

## 5. Talent (`talent`)

- [ ] Sign up; **profile completion** prompt / modal works
- [ ] **Talent dashboard** — recommended posts, saved items, application states load
- [ ] **Browse startups** — filters / list; open startup detail
- [ ] **Save** / **unsave** startup or post
- [ ] **Express interest** — founder sees interest in inbox
- [ ] **Receive invitation** from founder — accept / decline
- [ ] **Inbox** sent vs received tabs; thread messages send
- [ ] **Talent chat** page loads for active conversations

---

## 6. Mentor (magic link)

- [ ] Org admin invites mentor (§2.6)
- [ ] Open **magic link** from email — lands on mentor login / portal (no broken redirect)
- [ ] Session persists for mentor session duration
- [ ] **Assigned founders** visible with cohort context
- [ ] Can view / review deliverables or snapshots per product rules
- [ ] **Instant Google Meet** (only if Google enabled — §12) — optional

---

## 7. Platform admin (`admin` / `isAdmin`)

**Use staging-only admin accounts; restrict in production.**

- [ ] **Admin dashboard** loads (`AdminDashboard` / real-time variant)
- [ ] Sensitive actions gated (no accidental access from normal users)
- [ ] Database / user tools (if exposed) behave as expected — **no destructive action on prod** without backup

---

## 8. Inbox and notifications (founder, talent, team-member)

### 8.1 Inbox

- [ ] **Inbox** opens — received and sent views
- [ ] **Invitations** — pending count matches sidebar badge
- [ ] **Interests** — founder received / talent sent lists correct
- [ ] Respond to invitation (accept / decline) — status updates both sides
- [ ] Respond to interest — status + optional onboard flow
- [ ] **Thread messages** on invitation / interest — send and receive
- [ ] Role-appropriate actions only (founder vs talent controls)

### 8.2 Notification center

- [ ] Bell icon shows unread count
- [ ] Open notification list — mark one read; mark all read
- [ ] **Deep link** from notification opens correct page (office tab, inbox, deliverable, etc.)
- [ ] Delete notification (if supported) — list updates
- [ ] Second session or refresh shows new notification after server event (deliverable, invite, etc.)

---

## 9. Virtual Office (`startup-office`) — founder & team-member

Requires founder with **`startupId`** (and team member on same startup).

### 9.1 Core load & navigation

- [ ] Open **Virtual Startup Office** — presence, activity feed, task panel, agenda load without console errors
- [ ] Navigate away and back — **startup context** retained (`startupId`, room join)
- [ ] Notification with `actionUrl` opens expected office tab or route

### 9.2 Presence & activity

- [ ] **Presence list** shows team members; updates when another user joins (realtime or refresh)
- [ ] **Activity feed** shows recent startup activities
- [ ] **Check-in** — submit daily check-in; appears as `check-in` in feed
- [ ] Second browser / team member sees check-in (realtime or after refresh)
- [ ] Failed check-in (network off) — UI error; no false success

### 9.3 Calendar & agenda

- [ ] **Founder** — agenda / calendar items load; filters (upcoming / today / week / overdue) work
- [ ] **Team member** in cohort — calendar includes cohort events / deliverables / milestones
- [ ] Optional: narrow date range query returns only in-range items

### 9.4 Task panel

- [ ] Create / update tasks from office panel
- [ ] Lifecycle guardrails — invalid transitions rejected with visible validation
- [ ] Block task requires reason + note
- [ ] Panel stays fresh on **socket disconnect** (polling fallback), stops duplicate polling after reconnect

### 9.5 Team Hub & messaging

- [ ] **Send / receive** DM between two users; unread / read correct after refresh
- [ ] **Announcement** create — visible to both users; realtime or refresh
- [ ] Deep link into Team Hub opens correct thread or announcement

### 9.6 Wall of Wins

- [ ] Create win (`category: wall-of-wins`) — persists for all startup members after refresh
- [ ] With socket disconnected — wins list updates via polling; realtime resumes on reconnect
- [ ] Win notification deep link (`/wins/:winId`) opens office with Team Hub context

### 9.7 Virtual Office tour

- [ ] First visit — Joyride runs; **Skip Tour** hidden until replay path
- [ ] Finishing tour sets `virtualOfficeTourCompleted` — no auto-restart on reload
- [ ] **Replay tour** — runs again; Skip available

---

## 10. Settings and profile (all core roles)

- [ ] Open **Settings** — profile, preferences, notification prefs load
- [ ] Update **profile** (name, avatar upload if used) — saves; visible after refresh
- [ ] Update **notification preferences** — persist
- [ ] **Theme toggle** (light / dark) — readable contrast on main pages
- [ ] **Delete account** (if exposed) — only on test account; confirm flow and logout
- [ ] **Google account connect** (Settings → Virtual Office tab) — only if §12 enabled

---

## 11. Realtime, security, and cross-cutting

### 11.1 Realtime

- [ ] Socket connects with **authenticated** session
- [ ] **Founder inbox** updates when event triggered in another tab
- [ ] **Org dashboard** updates on primary actions (two-browser test)
- [ ] **No cross-org leakage** — two orgs, two browsers; events/messages/notifications stay scoped

### 11.2 Security (staging / prod)

- [ ] **HTTPS** everywhere (client + API)
- [ ] **CORS** — production client origin only; no `*` with credentials
- [ ] **Rate limit** — rapid sign-in attempts eventually throttled (if limits enabled on staging)
- [ ] **Upload** — reject oversize file with clear message
- [ ] **401 / 403 / 404** — friendly UI on common forbidden routes (no raw stack in toast)
- [ ] `npm audit` — no unmitigated **critical** issues on `client/` and `server/` (record exceptions)

### 11.3 Observability (if configured)

- [ ] **Sentry** — trigger test error on staging; event appears in Sentry project
- [ ] Uptime monitor hits `GET /health`
- [ ] API logs readable for errors during this QA session

---

## 12. Optional features (waive if not in v1 scope)

### 12.1 Google Calendar / Meet (`GOOGLE_INTEGRATION_ENABLED=true`)

See [`docs/GOOGLE_OAUTH_SETUP.md`](docs/GOOGLE_OAUTH_SETUP.md).

- [ ] Settings → connect Google — OAuth completes; `?google=connected` or status shows connected
- [ ] **Instant meeting** creates Meet link
- [ ] **Disconnect** clears connection
- [ ] Mentor portal instant Meet (if used)

**If Google off:** waive entire subsection.

### 12.2 Compensation demo (`VITE_INCLUDE_COMPENSATION_DEMO=true`)

- [ ] Compensation demo route loads only when flag enabled
- [ ] Hidden in production build when flag false

### 12.3 UI redesign flags (`VITE_UI_REDESIGN_*`)

- [ ] All flags **false** in production — app matches current legacy UI (no partial redesign)

---

## 13. Production smoke (after cutover)

Run a **minimal** subset on **production** with test accounts / test cohort:

- [ ] `GET /health` on production API
- [ ] Sign in on production client
- [ ] One **founder invite** email — link works on prod `PUBLIC_APP_URL`
- [ ] One **file upload** (logo or resource)
- [ ] Socket connects on production
- [ ] Monitor errors **24–48h** (Sentry / logs)

---

## 14. Sign-off

| Field | Value |
|-------|--------|
| Environment tested | Staging ☐ Production smoke ☐ |
| Date | |
| Tester | |
| Build / commit | |
| Waived sections (reason) | |
| P0/P1 bugs filed | |
| **Manual QA gate** | ☐ **PASS** ☐ **FAIL** |

---

## Appendix A — Regression scripts (reference)

**One-shot:** `cd server && npm run verify:release`

**Alignment gate only:** `npm run test:alignment-gate`

**Inventories (after API edits):** `npm run export:client-api-inventory`, `npm run export:client-api-call-catalog`, `npm run export:server-route-manifest`

**Phase 1 HTTP flows:** `RUN_CONTRACT_HTTP_FLOWS=1 npm run test:phase1-http-flows`

Individual phase scripts are listed in [`docs/LAUNCH_REMAINING_WORK.md`](docs/LAUNCH_REMAINING_WORK.md) §11.

---

## Appendix B — Screen ↔ API map

For “which page hits which endpoint,” see [`docs/ui-contract-matrix.md`](docs/ui-contract-matrix.md).

When **all** applicable sections above are checked (or waived), treat the **manual QA gate** as passed for production confidence alongside `npm run verify:release` and CI `alignment-gate`.
