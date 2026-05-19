# Organization API Integration Plan

> **Branch**: `feat/organisation-api-integration`
> **Scope**: Wire every screen under `client/src/components/organizations/**` (and `client/src/components/dashboards/OrganizationDashboard.jsx`) to real backend endpoints, fix broken contracts, and close field gaps between the new UI primitives and the Express/Mongoose layer.
> **Style**: Each step is a self-contained unit of work. Backend tickets and their paired frontend tickets are kept together so they can ship in one PR. File paths are repo-relative; line numbers are at the time of writing (may drift as you edit — re-grep if a snippet doesn't match).
> **API envelope contract (already in use)**:
> - Responses: `{ success: true, data: ... }` (see `server/src/utils/apiResponse.js`)
> - Client unwrap: `unwrapData()` from `client/src/utils/apiEnvelope.js` (also normalised inside `client/src/utils/api/organizationApi.js#unwrapData` + `mapEntity`).
> Keep this contract for every new endpoint.

---

## Table of Contents

- [0. Snapshot — What's Already Done (read first)](#0-snapshot--whats-already-done-read-first)
- [PHASE 1 — Trust & Truth (close the contract gap)](#phase-1--trust--truth-close-the-contract-gap)
  - [Step 1.1 — Enrich `GET /cohorts/:cohortId/members` (join founder + startup + progress)](#step-11--enrich-get-cohortscohortidmembers-join-founder--startup--progress)
  - [Step 1.2 — Add cohort-level stats to `GET /cohorts/:cohortId`](#step-12--add-cohort-level-stats-to-get-cohortscohortid)
  - [Step 1.3 — Fix `addOrganizationAdmin` (accept email; create OrganizationAdmin from User lookup)](#step-13--fix-addorganizationadmin-accept-email-create-organizationadmin-from-user-lookup)
  - [Step 1.4 — Enrich `getOrganizationAdmins` (return name, email, isCreator, addedAt)](#step-14--enrich-getorganizationadmins-return-name-email-iscreator-addedat)
  - [Step 1.5 — Extend `Event` schema + `createCohortEvent` (eventType, isVirtual, meetingUrl, capacity)](#step-15--extend-event-schema--createcohortevent-eventtype-isvirtual-meetingurl-capacity)
  - [Step 1.6 — Extend `Resource` schema + `createCohortResource` (category, type, tags)](#step-16--extend-resource-schema--createcohortresource-category-type-tags)
  - [Step 1.7 — Extend `ProgramMilestone` schema + `createProgramMilestone` (week, category, structuredMilestones, createdBy)](#step-17--extend-programmilestone-schema--createprogrammilestone-week-category-structuredmilestones-createdby)
  - [Step 1.8 — Extend `Message` schema + org-messaging controllers (subject, recipientId discrete fields)](#step-18--extend-message-schema--org-messaging-controllers-subject-recipientid-discrete-fields)
  - [Step 1.9 — Pipe `priority` / `category` / `createdByName` through `createCohortAnnouncement`](#step-19--pipe-priority--category--createdbyname-through-createcohortannouncement)
  - [Step 1.10 — Fix `createInvitation` field name + dedupe (`email` vs `founderEmail`)](#step-110--fix-createinvitation-field-name--dedupe-email-vs-founderemail)
  - [Step 1.11 — Enrich `listOrganizationMentors` (join User for name/email/avatar; expose status)](#step-111--enrich-listorganizationmentors-join-user-for-nameemailavatar-expose-status)
  - [Step 1.12 — Lift Organization `logo` 1000-char cap (or move to URL field)](#step-112--lift-organization-logo-1000-char-cap-or-move-to-url-field)
  - [Step 1.13 — Add a central client error helper and replace `alert()` calls](#step-113--add-a-central-client-error-helper-and-replace-alert-calls)
- [PHASE 2 — Real CRUD, Uploads & Email](#phase-2--real-crud-uploads--email)
  - [Step 2.1 — File upload service (`POST /uploads`)](#step-21--file-upload-service-post-uploads)
  - [Step 2.2 — Logo upload → URL, not base64](#step-22--logo-upload--url-not-base64)
  - [Step 2.3 — Update/Delete cohort (`PUT/DELETE /cohorts/:cohortId`)](#step-23--updatedelete-cohort-putdelete-cohortscohortid)
  - [Step 2.4 — Update/Delete event (`PUT/DELETE /cohorts/:cohortId/events/:eventId`)](#step-24--updatedelete-event-putdelete-cohortscohortideventseventid)
  - [Step 2.5 — Update/Delete resource (`PUT/DELETE /cohorts/:cohortId/resources/:resourceId`)](#step-25--updatedelete-resource-putdelete-cohortscohortidresourcesresourceid)
  - [Step 2.6 — Update/Delete program milestone (`PUT/DELETE /cohorts/:cohortId/program-milestones/:milestoneId`)](#step-26--updatedelete-program-milestone-putdelete-cohortscohortidprogram-milestonesmilestoneid)
  - [Step 2.7 — Update/Delete deliverable (`PUT/DELETE /cohorts/:cohortId/deliverables/:deliverableId`)](#step-27--updatedelete-deliverable-putdelete-cohortscohortiddeliverablesdeliverableid)
  - [Step 2.8 — Update/Delete announcement (`PUT/DELETE /cohorts/:cohortId/announcements/:announcementId`) + mark-as-read](#step-28--updatedelete-announcement-putdelete-cohortscohortidannouncementsannouncementid--mark-as-read)
  - [Step 2.9 — Per-startup snapshot endpoint (`GET /startups/:startupId/snapshot`)](#step-29--per-startup-snapshot-endpoint-get-startupsstartupidsnapshot)
  - [Step 2.10 — Mentor update + status; auto-send magic-link on invite](#step-210--mentor-update--status-auto-send-magic-link-on-invite)
  - [Step 2.11 — Email transport (founder + mentor invite emails)](#step-211--email-transport-founder--mentor-invite-emails)
  - [Step 2.12 — Server-side notifications on event create + RSVPs](#step-212--server-side-notifications-on-event-create--rsvps)
  - [Step 2.13 — Cancel / resend founder invitations](#step-213--cancel--resend-founder-invitations)
  - [Step 2.14 — Founder messages back to org (two-way Communication Center)](#step-214--founder-messages-back-to-org-two-way-communication-center)
- [PHASE 3 — Scale, Real-time & Polish](#phase-3--scale-real-time--polish)
  - [Step 3.1 — Server-side pagination, search, filter, sort for every list endpoint](#step-31--server-side-pagination-search-filter-sort-for-every-list-endpoint)
  - [Step 3.2 — Org-side real-time (sockets) on dashboards](#step-32--org-side-real-time-sockets-on-dashboards)
  - [Step 3.3 — Real portfolio-health scoring](#step-33--real-portfolio-health-scoring)
  - [Step 3.4 — Richer cohort analytics (trends, velocity, histograms)](#step-34--richer-cohort-analytics-trends-velocity-histograms)
  - [Step 3.5 — Sidebar badge counts (`GET /cohorts/:cohortId/badge-counts`)](#step-35--sidebar-badge-counts-get-cohortscohortidbadge-counts)
  - [Step 3.6 — Permissions audit + negative-path tests](#step-36--permissions-audit--negative-path-tests)
  - [Step 3.7 — Remove deprecated helper exports](#step-37--remove-deprecated-helper-exports)
- [Definition of Done](#definition-of-done)
- [Open Decisions Required Before Phase 1 Starts](#open-decisions-required-before-phase-1-starts)

---

## 0. Snapshot — What's Already Done (read first)

So you don't redo any of this. Confirmed against actual source files.

### 0.1 Frontend pieces already wired to real APIs

| Component | File | What's already real |
|---|---|---|
| Org list / create / select | `client/src/components/dashboards/OrganizationDashboard.jsx` (L64–138, 211–243) | `getUserOrganizations`, `isOrganizationAdmin`, `getOrganizationCohorts`, `deleteCohort` |
| Cohort dashboard shell | `client/src/components/organizations/CohortDashboardWithSidebar.jsx` (L60–139) | `getCohort`, `getCohortMembers`, `checkAdminStatus`, `downloadCohortExport` (server CSV) |
| Org create | `client/src/components/organizations/CreateOrganizationModal.jsx` | `createOrganization` |
| Cohort create | `client/src/components/organizations/CreateCohortModal.jsx` | `createCohort` |
| Invite founder | `client/src/components/organizations/InviteStartupModal.jsx` (L40–92) | `searchUserByEmail`, `createInvitation` |
| Org settings (profile + admins) | `client/src/components/organizations/OrganizationSettings.jsx` (L76–273) | `GET /organizations/:id`, `GET .../admins`, `PUT .../update`, `PUT .../logo`, `DELETE .../admins/:id/remove` |
| Announcements + Messages | `client/src/components/organizations/CommunicationCenter.jsx` (L89–206) | `GET/POST /cohorts/:id/announcements`, `GET /messages/organization/:orgId`, `POST /messages/bulk-send`, `POST /messages/send-individual` |
| Deliverables + Submissions | `client/src/components/organizations/DeliverablesManager.jsx` (L105–212) | `GET/POST /cohorts/:id/deliverables`, `GET /deliverables/:id/submissions`, `POST /deliverables/submissions/:id/review` |
| Events | `client/src/components/organizations/EventManager.jsx` (L130–217) | `GET/POST /cohorts/:id/events`, `getOrganizationCalendarEvents` |
| Mentors | `client/src/components/organizations/MentorManager.jsx` (L49–125) | `GET/POST /organizations/:id/mentors`, `DELETE /mentors/:id` |
| Mentor assignment | `client/src/components/organizations/MentorAssignmentManager.jsx` | `GET /organizations/:id/mentors`, `GET /cohorts/:id/members`, `GET/POST /mentors/:id/assigned-founders`, `DELETE /mentors/:id/unassign-founder/:founderId` |
| Resources | `client/src/components/organizations/ResourceLibrary.jsx` (L107–160) | `GET/POST /cohorts/:id/resources` |
| Program milestones | `client/src/components/organizations/ProgramMilestones.jsx` (L47–95) | `GET/POST /cohorts/:id/program-milestones` |
| Analytics | `client/src/components/organizations/CohortAnalyticsDashboard.jsx` | `GET /cohorts/:id/analytics/overview` |
| Portfolio health | `client/src/components/organizations/PortfolioOverview.jsx` | `GET /cohorts/:id/portfolio-health` |

### 0.2 Backend pieces already in place

- **Org CRUD-ish** (`server/src/controllers/organizations.controller.js`): create, get-by-id, get-by-user, is-admin, update profile, update logo, get/remove admin. `addOrganizationAdmin` exists but contract is broken (Step 1.3).
- **Cohort** (same file): create, get-by-id, list-by-org, delete, list-cohort-ids-by-founder, raw members list (no joins). No update.
- **Cohort workspace** (`server/src/controllers/cohortWorkspace.controller.js`): events list/create, announcements list/create (with notification fanout), resources list/create, analytics overview (real counts), portfolio health (hardcoded factors).
- **Mentors** (`server/src/controllers/mentors.controller.js`): list/invite/get/delete, assign/unassign founder, mentor magic-link request/verify, mentor session cookie.
- **Deliverables** (`server/src/controllers/deliverables.controller.js`): list-by-cohort, list-by-founder (enriched with cohortName + mySubmission), create (two routes), founder submit, list submissions, review (with notifications). No update/delete.
- **Invitations** (`server/src/controllers/invitations.controller.js`): create, list-by-founder, get-by-token, respond (with org-admin fanout + auto cohort membership), legacy founder-talent flow.
- **Org messages** (`server/src/controllers/organizationMessages.controller.js`): list, bulk-send, send-individual (with cohort membership + org scope checks + socket emits).
- **Middleware**: `requireAuth`, `requireOrgAdmin` (resolves org from many params), `requireCohortReadAccess`, `requireMentorProfileAccess`, `requireMentorProfileOrgAdmin`, `requireDeliverableReviewAccess`, `requireDeliverableSubmitAccess`, `requireOrganizationScope`, `requireSelfOrAdmin`.
- **Socket plumbing**: `server/src/socket/socketServer.js`, `realtime/events.js`, `realtime/rooms.js`, `services/realtime.service.js#emitRealtime`. Founder rooms and org rooms exist; deliverables/messages already emit; org dashboards just don't subscribe yet.
- **Notifications**: `server/src/services/notificationService.js` (`createNotification`, `broadcastNotification`). Used by announcements, deliverables, invitations, mentor invites.

### 0.3 Shared UI primitives (in place; do not rebuild)

`client/src/components/organizations/_primitives/index.js` re-exports:
- `BrandProgress`, `CollapsibleFormCard`, `EmptyStateBlock`, `GradientHero`, `ListRow`, `SectionCard`, `SectionHeader`, `StatTile`, `StatusBadge`.

### 0.4 Confirmed broken or missing (the work to do is below)

| # | Defect | Files |
|---|---|---|
| 1 | `GET /cohorts/:id/members` returns raw `CohortMembership` docs; UI assumes joined founder/startup/progress | `server/src/controllers/organizations.controller.js` L145–148 vs `client/src/components/organizations/CohortDashboardWithSidebar.jsx` L91–128 |
| 2 | `cohort.stats` (`totalStartups`, `active`, `slowing`, `stalled`) is fabricated client-side from missing fields | `client/src/components/organizations/CohortDashboardWithSidebar.jsx` L117–132; `client/src/components/dashboards/OrganizationDashboard.jsx` L361–369 |
| 3 | Add-admin POSTs `{ email, addedBy }`, server requires `adminUserId` → 400 always | `client/src/components/organizations/OrganizationSettings.jsx` L215–225 vs `server/src/controllers/organizations.controller.js` L90–103 |
| 4 | Admins list renders `admin.name`, `admin.email`, `admin.isCreator`, `admin.addedAt` but `OrganizationAdmin` model only has `organizationId, userId` | `server/src/models/OrganizationAdmin.js` vs `client/src/components/organizations/OrganizationSettings.jsx` L411–445 |
| 5 | `Event` model drops `eventType`, `isVirtual`, `meetingUrl`, `capacity` | `server/src/models/Event.js` vs UI `EventManager.jsx` L161–217 |
| 6 | `Resource` model has no `category`; controller drops `type`, `tags`, `category` on write | `server/src/models/Resource.js`; `server/src/controllers/cohortWorkspace.controller.js` L105–116; `client/src/components/organizations/ResourceLibrary.jsx` L128–160 |
| 7 | `ProgramMilestone` model lacks `week`, `category`, `structuredMilestones`, `createdBy`; controller drops them | `server/src/models/ProgramMilestone.js`; `server/src/controllers/organizations.controller.js` L201–210; `client/src/components/organizations/ProgramMilestones.jsx` L69–95 |
| 8 | `Message` has no `subject` / `recipientId`; subject and message are concatenated into `body` on send and never split on read → inbox renders `undefined` | `server/src/models/Message.js`; `server/src/controllers/organizationMessages.controller.js` L12–17; `client/src/components/organizations/CommunicationCenter.jsx` L629–704 |
| 9 | `createCohortAnnouncement` drops `priority`, `category`, `createdBy`, `createdByName`, `emoji` | `server/src/controllers/cohortWorkspace.controller.js` L60–93 |
| 10 | `createInvitation` reads `req.body.email`, frontend sends `founderEmail` → email field saved as `""` | `server/src/controllers/invitations.controller.js` L195–245 vs `client/src/components/organizations/InviteStartupModal.jsx` L63–78 (which forwards `founderEmail`) |
| 11 | `listOrganizationMentors` returns raw `MentorProfile` docs; UI renders `mentor.name`, `mentor.email`, `mentor.status`, `mentor.lastLoginAt`, `mentor.invitedAt`, `mentor.cohortIds` (none of which exist) | `server/src/controllers/mentors.controller.js` L143–151 vs `client/src/components/organizations/MentorManager.jsx` L281–333 |
| 12 | Organization `logo` field is `maxlength: 1000` but the UI uploads a base64 data URL (always overflows for real images) | `server/src/models/Organization.js` L17–21; `client/src/components/organizations/OrganizationSettings.jsx` L162–204 |
| 13 | `getStartupSnapshot` calls `/startups/:id/snapshot` which has **no route** | `client/src/utils/api/organizationApi.js` L220–223 |
| 14 | `/messages/upload-file` returns a fake URL (no actual file persisted) | `server/src/routes/messages.routes.js` L269–280 |
| 15 | No `PUT/DELETE` for cohort, event, resource, milestone, deliverable, announcement, mentor expertise | All controllers above |
| 16 | No email transport — mentor magic-link and founder invite are created but never sent | `server/src/controllers/mentors.controller.js` L102–141, `invitations.controller.js` L217–245 |
| 17 | No pagination, search, sort, filter on any list endpoint | All list controllers |
| 18 | Org dashboards never subscribe to sockets despite plumbing existing | `client/src/components/organizations/**` |
| 19 | `getCohortPortfolioHealth.defaultFactors()` returns hardcoded 15/12/15/10 | `server/src/controllers/cohortWorkspace.controller.js` L194–199 |
| 20 | `notifyEventCreated` is called client-side (it should be server-side on event create) | `client/src/components/organizations/EventManager.jsx` L190–198 |
| 21 | Sidebar badge counts hardcoded to 0 | `client/src/components/organizations/OrganizationSidebar.jsx` |

---

## PHASE 1 — Trust & Truth (close the contract gap)

> **Goal**: every value rendered in an organization screen comes from the server (or is correctly derived from server-returned data). No silent field loss. No always-400 actions. After Phase 1, the module is *honest* — you don't add a single new feature, but everything that already exists works end-to-end.

### Step 1.1 — Enrich `GET /cohorts/:cohortId/members` (join founder + startup + progress)

**Why** — fixes defects #1 and #2; unblocks `CohortDashboardWithSidebar`, `CohortHomePage`, `StartupSnapshotModal`, `PortfolioOverview`, `MentorAssignmentManager`, `OrganizationDashboard` cohort cards.

**Backend**

- File: `server/src/controllers/organizations.controller.js` → `getCohortMembers`.
- New response shape (one element per membership):

  ```json
  {
    "success": true,
    "data": [
      {
        "id": "<membershipId>",
        "cohortId": "...",
        "joinedAt": "...",
        "status": "active",
        "founderId": "...",
        "founderName": "...",
        "founderEmail": "...",
        "founder": { "id": "...", "name": "...", "email": "...", "avatarUrl": "...", "stage": "ideation|mvp|...", "role": "founder" },
        "startupId": "...",
        "startupName": "...",
        "startup": { "id": "...", "name": "...", "tagline": "...", "logoUrl": "..." },
        "progress": {
          "activityStatus": "active|slowing|stalled",
          "weeklyOutcomeStreak": 0,
          "completedMilestones": 0,
          "tasksCompletedThisWeek": 0,
          "lastActive": "2026-05-12T...",
          "currentMilestone": "<title or null>",
          "teamSize": 0
        }
      }
    ]
  }
  ```

- Aggregation:
  1. `CohortMembership.find({ cohortId })` (existing).
  2. Batch load `User` (name, email, avatarUrl, profile.stage if present) for all `founderId`.
  3. Batch load `Startup` (name, founderId, tagline?, logoUrl?) for all `startupId` (and fall back to `Startup.findOne({ founderId })` for memberships that have no `startupId`).
  4. For each founder, compute `progress`:
     - `weeklyOutcomeStreak` — query `WeeklyOutcome` for last 8 weeks, count consecutive weeks with ≥1 entry (see `server/src/models/WeeklyOutcome.js`).
     - `completedMilestones` — `Milestone.countDocuments({ founderId, status: "completed" })`.
     - `tasksCompletedThisWeek` — `Task.countDocuments({ founderId, status: "completed", updatedAt: { $gte: startOfWeek } })`.
     - `lastActive` — `Activity.findOne({ userId: founderId }).sort({ createdAt: -1 })`'s `createdAt`, fallback to `User.lastActiveAt` if present, fallback to `joinedAt`.
     - `activityStatus`:
       - `active` if `lastActive` within 7 days,
       - `slowing` if 8–21 days,
       - `stalled` otherwise.
       (Thresholds are the **Open Decision Q3** — confirm before merging.)
     - `currentMilestone` — `Milestone.findOne({ founderId, status: { $ne: "completed" } }).sort({ dueDate: 1 })`'s `title`.
     - `teamSize` — `TeamMemberProfile.countDocuments({ startupId })` + 1 (for the founder).
- Keep this fast: do batch queries, not per-founder loops. Aim for 3–5 DB round-trips total regardless of cohort size.

**Frontend**

- File: `client/src/components/organizations/CohortDashboardWithSidebar.jsx` L91–132 — delete the synthetic `snapshotData` construction; pass `members` directly into `startups` state (rename `startupId` → `founderId` consumer where needed, or normalise inside the component to one of them).
- File: `client/src/components/organizations/CohortHomePage.jsx` — read directly from `cohort.stats` and `members` shape.
- File: `client/src/components/organizations/StartupSnapshotModal.jsx` — accept the enriched `member` shape; remove placeholder fallbacks. (Note: this temporarily still works without Step 2.9; once that lands, switch to fetching by `startupId`.)
- File: `client/src/components/organizations/PortfolioOverview.jsx` — drop `defaultFactors` rendering, use real `progress` fields.
- File: `client/src/components/organizations/MentorAssignmentManager.jsx` — already calls `getCohortMembers`; will simply start receiving real data.
- File: `client/src/utils/organizationBackendHelpers.js` L446–495 — `generateCohortExport` now produces real columns; remove the `"N/A"` fallback for `stage`.

**Acceptance**
- Loading a cohort shows real names, real stages, real lastActive, real streaks — no `undefined`, no `N/A`.
- `getCohortMembers(cohortId)` for a 50-member cohort completes in < 500 ms locally.

---

### Step 1.2 — Add cohort-level stats to `GET /cohorts/:cohortId`

**Why** — fixes defect #2 for the cohort card on `OrganizationDashboard` and the sidebar in `CohortDashboardWithSidebar`.

**Backend**

- File: `server/src/controllers/organizations.controller.js` → `getCohortById`.
- After loading the cohort, also compute and attach `stats` derived from the same aggregation Step 1.1 builds for the members list. Suggested approach: extract a shared helper `computeCohortStats(cohortId)` in `server/src/utils/cohortStats.js` so the same logic is used here and inside `getCohortMembers` (return both `members` and `stats` from the helper).
- Response:

  ```json
  {
    "success": true,
    "data": {
      "_id": "...", "name": "...", "description": "...", "organizationId": "...",
      "startDate": "...", "endDate": "...", "status": "active",
      "stats": {
        "totalStartups": 0,
        "activeStartups": 0,
        "slowingStartups": 0,
        "stalledStartups": 0,
        "completedStartups": 0
      }
    }
  }
  ```

- Also update `getCohortsByOrganization` (`server/src/controllers/organizations.controller.js` L127–130) to attach the same `stats` per cohort (use a single `$facet`/aggregate query batch, not N+1 loops).

**Frontend**

- File: `client/src/components/dashboards/OrganizationDashboard.jsx` L361–369 — the `cohort.stats?.totalStartups` chip will start showing real numbers (no code change needed).
- File: `client/src/components/organizations/CohortDashboardWithSidebar.jsx` L117–132 — remove the client-side `const stats = { totalStartups: members.length, … }` block; trust `cohortData.stats`.

**Acceptance** — Cohort cards show real startup counts. Sidebar header shows real total. Listing 20 cohorts still completes in < 300 ms.

---

### Step 1.3 — Fix `addOrganizationAdmin` (accept email; create OrganizationAdmin from User lookup)

**Why** — fixes defect #3. Today the "Add admin" flow is broken every time.

**Backend**

- File: `server/src/controllers/organizations.controller.js` L90–103.
- New contract: accept `{ adminUserId }` OR `{ email }`. If `email`, `User.findOne({ email: email.toLowerCase().trim() })`.
- If neither resolves to a user: `apiError(res, "No registered user with that email.", 404)`.
- On success: return `{ ...admin, name, email }` so the UI list refresh reflects the new admin without another round-trip.
- Reject duplicates with `409` instead of upserting silently (still upsert in the DB to be idempotent, but return a 409 message when `wasInserted === false`).

**Frontend**

- File: `client/src/components/organizations/OrganizationSettings.jsx` L215–225 — request body stays `{ email }` (you may also drop `addedBy` since the server uses `req.user.id`).
- On 404 surface inline: "No StartupVerse account with that email — ask them to sign up first."
- On 409 surface inline: "That user is already an admin."

**Acceptance** — Adding an existing user by email works in one click. Adding a non-existent email surfaces a clear inline error.

---

### Step 1.4 — Enrich `getOrganizationAdmins` (return name, email, isCreator, addedAt)

**Why** — without this the admin list in `OrganizationSettings` shows `undefined` for everyone.

**Backend**

- File: `server/src/controllers/organizations.controller.js` L68–71.
- Join `OrganizationAdmin` with `User` (`name`, `email`, `avatarUrl`) and with `Organization.createdBy` to compute `isCreator` per row.
- Use `createdAt` from `OrganizationAdmin` as `addedAt`.
- Response:

  ```json
  {
    "success": true,
    "data": [
      { "id": "<adminRowId>", "userId": "...", "name": "...", "email": "...", "avatarUrl": "...", "isCreator": false, "addedAt": "..." }
    ]
  }
  ```

**Frontend**

- File: `client/src/components/organizations/OrganizationSettings.jsx` L411–445 — already reads exactly these fields, so the rendered list will just start working.

**Acceptance** — Admins list shows correct name + email + Creator badge + Added date.

---

### Step 1.5 — Extend `Event` schema + `createCohortEvent` (eventType, isVirtual, meetingUrl, capacity)

**Why** — fixes defect #5; brings `EventManager` UI into truthful state.

**Backend**

- File: `server/src/models/Event.js`. Add:

  ```js
  eventType: { type: String, enum: ["workshop", "demo-day", "office-hours", "networking", "standup", "other"], default: "other", index: true },
  isVirtual: { type: Boolean, default: false },
  meetingUrl: { type: String, default: "", maxlength: 2000 },
  capacity: { type: Number, default: null, min: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  ```

- File: `server/src/controllers/cohortWorkspace.controller.js` L32–48 — pass the new fields through to `Event.create({ ... })`.
- File: `server/src/controllers/cohortWorkspace.controller.js#mapEvent` (L17–25) — include the new fields in the DTO so they round-trip.

**Frontend**

- File: `client/src/components/organizations/EventManager.jsx` — already sends the fields. Once the schema accepts them, the "Virtual" badge, capacity warnings, and "Join meeting" button will render correctly.
- Optional polish: now that `meetingUrl` persists, drop the client-side auto-Jitsi-link generation on submit (let the server fill in the default) — see Step 2.4.

**Acceptance** — Create a virtual event → reload page → "Virtual" badge + meeting URL still present.

---

### Step 1.6 — Extend `Resource` schema + `createCohortResource` (category, type, tags)

**Why** — fixes defect #6; category filter currently never matches anything.

**Backend**

- File: `server/src/models/Resource.js`. Add:

  ```js
  category: { type: String, enum: ["general", "template", "guide", "video", "tool", "article"], default: "general", index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  ```

  Keep existing `type` (`video|article|tool|template|other`) and `tags`. Add `"link"` and `"document"` to the `type` enum so the frontend's options round-trip (current UI options are `link|document|video|template`).

- File: `server/src/controllers/cohortWorkspace.controller.js` L105–116 — accept `category`, `type`, `tags` (parse comma-separated string into array if needed) and `createdBy`.
- DTO already passes everything through via `r.toObject()` — fine.

**Frontend**

- File: `client/src/components/organizations/ResourceLibrary.jsx` L128–145 — send `category`, `type`, `tags` (split by comma into array client-side).
- Once persisted, the filter dropdowns (built at L175–176 via `Array.from(new Set(...))`) will populate from real data.

**Acceptance** — Create a "Template / Pitch Deck" resource → reload → still tagged "Template" with `pitch, deck` tag chips; filtering by category narrows the list.

---

### Step 1.7 — Extend `ProgramMilestone` schema + `createProgramMilestone` (week, category, structuredMilestones, createdBy)

**Why** — fixes defect #7; the structured milestone creator's output currently doesn't survive a round trip.

**Backend**

- File: `server/src/models/ProgramMilestone.js`. Add:

  ```js
  week: { type: Number, default: null, min: 0 },
  category: { type: String, default: "checkpoint", enum: ["deliverable", "checkpoint", "milestone", "review"], index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  structuredMilestones: {
    type: [{
      title: { type: String, required: true, maxlength: 200 },
      owner: { type: String, default: "" },
      dueDate: { type: Date, default: null },
      status: { type: String, enum: ["pending", "in-progress", "completed", "blocked"], default: "pending" },
      _id: false,
    }],
    default: [],
  },
  ```

- File: `server/src/controllers/organizations.controller.js` L201–210 (`createProgramMilestone`) — pipe `week`, `category`, `createdBy`, `structuredMilestones` through.
- File: same controller L189–199 (`getProgramMilestonesByCohort`) — the DTO mapper should now include `week`, `category`, `structuredMilestones` in the response.

**Frontend**

- File: `client/src/components/organizations/ProgramMilestones.jsx` L69–95 — payload already includes the fields. After the schema change, `milestone.week` (L229–233) and `milestone.category` (L237) and the structured list will render correctly.
- File: `client/src/components/organizations/StructuredMilestoneCreator.jsx` — verify the `data.milestones` shape matches the new subdocument schema.

**Acceptance** — Create a milestone with 3 structured sub-items → reload → all 3 are still there with their status pills.

---

### Step 1.8 — Extend `Message` schema + org-messaging controllers (subject, recipientId discrete fields)

**Why** — fixes defect #8. The Communication Center inbox renders `undefined` headers today.

**Backend**

- File: `server/src/models/Message.js`. Add:

  ```js
  subject: { type: String, default: "", maxlength: 250 },
  messageType: { type: String, enum: ["dm", "announcement", "bulk", "individual"], default: "dm", index: true },
  cohortId: { type: mongoose.Schema.Types.ObjectId, ref: "Cohort", index: true },
  ```

  (`recipientId` is already represented as `toUserId` — keep that, just make sure the DTO surface includes both names if the UI insists. Prefer to migrate the UI to `toUserId` rather than rename in the model.)

- File: `server/src/controllers/organizationMessages.controller.js`
  - Drop `buildMessageBody` (L12–17). Pass `subject` and `body` as discrete fields.
  - In `bulkSendOrgMessages` (L112–148): set `messageType: "bulk"`, `subject: body.subject`, `body: body.message`, `cohortId`.
  - In `sendIndividualOrgMessage` (L150–185): set `messageType: "individual"`, plus the same fields.
  - In `listOrganizationMessages` (L70–110): return a DTO that explicitly exposes `id, subject, body, fromUserId, toUserId, organizationId, cohortId, messageType, readAt, createdAt`, plus a denormalised `from: { id, name, email }` and `to: { id, name, email, startupName }` (look up users + startups in one batch).
- File: `server/src/routes/messages.routes.js#mapMessageDto` (L17–33) — extend with the new fields so socket emits also carry them.

**Frontend**

- File: `client/src/components/organizations/CommunicationCenter.jsx`
  - Sending: keep the current `{ subject, message }` payload (no change needed at L161–187).
  - Rendering (L629–704): replace `message.message` with `message.body`, replace `message.fromFounder` derived flag with `message.fromUserId === userId`, replace `message.startupName` / `message.founderName` with `message.from?.startupName` / `message.from?.name`, replace `message.recipientId` with `message.toUserId`, replace `message.sentAt` with `message.createdAt`. Keep `message.subject` as-is — it now exists.
  - Add a Mark-as-read on inbox open: `POST /messages/mark-read` with the IDs of received unread messages. (`POST /messages/mark-read` already exists at `server/src/routes/messages.routes.js` L223–247.)

**Acceptance** — Inbox shows real subjects, real sender names, and the "From: X" / "To: Y" header is correct.

---

### Step 1.9 — Pipe `priority` / `category` / `createdByName` through `createCohortAnnouncement`

**Why** — fixes defect #9. Announcements show priority badge derived from a field that was never saved.

**Backend**

- File: `server/src/controllers/cohortWorkspace.controller.js` L60–93.
- Accept and persist `priority`, `category`, `emoji`, `createdBy`, `createdByName`. The schema (`server/src/models/Announcement.js`) already supports all of these.
- Pull `createdByName` from `req.user.name` if the body doesn't provide it.

**Frontend**

- File: `client/src/components/organizations/CommunicationCenter.jsx` L121–146 — keep the existing payload. No frontend change. Priority badge (L398–406) will reflect reality after the schema change.

**Acceptance** — Posting an "Urgent" announcement → page refresh → still shows Urgent badge.

---

### Step 1.10 — Fix `createInvitation` field name + dedupe (`email` vs `founderEmail`)

**Why** — fixes defect #10.

**Backend**

- File: `server/src/controllers/invitations.controller.js` L195–245 (`createInvitation`).
- Accept either `email` or `founderEmail` — normalise to one variable, lowercase + trim, then persist as canonical `email`.
- Before creating, check duplicate: if a `CohortInvitation` with `(cohortId, email, status: "pending")` already exists, return 409 with a message.
- Also accept `founderName`, `startupName`, `metadata` for richer notification text (the model has `metadata`; use it for these denormalised fields so we don't need to extend the schema).

**Frontend**

- File: `client/src/components/organizations/InviteStartupModal.jsx` L63–78 — no code change needed (it already sends `founderEmail`). Optional: rename to `email` to match the canonical name. Surface 409 inline ("This founder already has a pending invitation").
- File: `client/src/utils/organizationBackendHelpers.js#createInvitation` (L205–238) — also can be updated to send `email` directly; harmless either way once the server accepts both.

**Acceptance** — Sending an invite to a registered founder records the `email` on the `CohortInvitation` row. Sending a duplicate while one is pending returns 409 with a clean message.

---

### Step 1.11 — Enrich `listOrganizationMentors` (join User for name/email/avatar; expose status)

**Why** — fixes defect #11; the mentor cards currently render `undefined`.

**Backend**

- File: `server/src/models/MentorProfile.js`. Add:

  ```js
  status: { type: String, enum: ["pending", "active", "revoked"], default: "active", index: true },
  invitedAt: { type: Date, default: () => new Date() },
  lastLoginAt: { type: Date, default: null },
  ```

  - On `inviteOrganizationMentor` (`server/src/controllers/mentors.controller.js` L153–188): set `status: "active"` if the email belongs to a registered user, otherwise (after Step 2.10) `status: "pending"` and `invitedAt: new Date()`.
  - On successful `createMentorSession` (L52–60): set `lastLoginAt = new Date()`.
- File: `server/src/controllers/mentors.controller.js#listOrganizationMentors` (L143–151) — join `User` for `name`, `email`, `avatarUrl`. Compute `cohortIds` from `MentorProfile.assignedFounders` → `CohortMembership` (which cohorts contain those founders). Response:

  ```json
  {
    "success": true,
    "data": {
      "mentors": [
        { "id": "...", "userId": "...", "name": "...", "email": "...", "avatarUrl": "...",
          "expertise": ["..."], "status": "active|pending|revoked",
          "assignedFounderIds": ["..."], "cohortIds": ["..."],
          "invitedAt": "...", "lastLoginAt": "...", "createdAt": "..." }
      ]
    }
  }
  ```

**Frontend**

- File: `client/src/components/organizations/MentorManager.jsx` L281–333 — already references all of these fields. Will start working as-is.
- The form field "Display name (optional)" (L168–175) — drop it or repurpose: the canonical name comes from the User. Either remove the field from the UI or persist it as a `displayName` on `MentorProfile` (cheaper to just remove).

**Acceptance** — Mentor cards show real name, email, status badge, last login date, and cohort count.

---

### Step 1.12 — Lift Organization `logo` 1000-char cap (or move to URL field)

**Why** — base64 images exceed 1000 chars almost immediately; logo upload fails Mongoose validation today.

**Two acceptable options — pick one.**

**Option A (preferred, ties to Step 2.1):** Make `logo` a URL field (still string), keep `maxlength: 2000`. Logo upload becomes "upload file → get URL → save URL." See Step 2.2 for the wiring once Step 2.1 lands.

**Option B (stopgap before file upload exists):** Allow large base64 strings by setting `maxlength: 5_000_000` (5 MB) **and** removing the validator constraint or moving the logo to a separate collection (`OrganizationAsset`). Not great for Mongo doc size and replication — only do this if you're not landing Step 2.1 in the same week.

**Backend**

- File: `server/src/models/Organization.js` L17–21 — apply chosen option.

**Frontend**

- File: `client/src/components/organizations/OrganizationSettings.jsx` L162–204. If Option A is in flight, leave this code in place and switch the body to `{ logo: <uploadedUrl> }` once Step 2.2 lands. If Option B, no frontend change.

**Acceptance** — Uploading a real ~500 KB PNG saves successfully and the logo persists across reloads.

---

### Step 1.13 — Add a central client error helper and replace `alert()` calls

**Why** — every component currently does its own `alert("Failed to …")`; users never see the underlying validation message; 400 vs 403 vs 404 vs 409 are indistinguishable.

**Frontend**

- New file: `client/src/utils/api/apiClient.js` — small wrapper:

  ```js
  export async function apiFetch(url, options = {}) {
    const res = await fetch(url, { credentials: "include", headers: { "Content-Type": "application/json", ...(options.headers || {}) }, ...options });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(json?.message || json?.error || res.statusText || "Request failed");
      err.status = res.status;
      err.code = json?.code || null;
      err.details = json?.details || null;
      throw err;
    }
    return json?.data ?? json;
  }
  ```

- New helper: `client/src/utils/toastError.js` — maps `err.status` → user-friendly toast:

  ```js
  import { toast } from "sonner";
  export function toastError(err, fallback = "Something went wrong") {
    if (err?.status === 400) return toast.error(err.message || "Invalid input.");
    if (err?.status === 401) return toast.error("Please sign in again.");
    if (err?.status === 403) return toast.error(err.message || "You don't have access to this.");
    if (err?.status === 404) return toast.error(err.message || "Not found.");
    if (err?.status === 409) return toast.warning(err.message || "Conflict — already exists or was just changed.");
    if (err?.status >= 500) return toast.error("Server error — please retry.");
    return toast.error(err?.message || fallback);
  }
  ```

- Replace `alert("Failed to …")` calls in: `EventManager.jsx`, `ResourceLibrary.jsx`, `ProgramMilestones.jsx`, `CommunicationCenter.jsx`, `DeliverablesManager.jsx`, `InviteStartupModal.jsx`. Use `toast` + `toastError`.

**Acceptance** — A 409 dedupe error in the invite flow shows "This founder already has a pending invitation" instead of "Failed to send invitation."

---

## PHASE 2 — Real CRUD, Uploads & Email

> **Goal**: every pencil/trash button in the UI hits a working endpoint; the snapshot modal pulls real per-startup data; mentors and founders actually receive an email; resources and deliverables can carry files. The module looks and feels production-grade.

### Step 2.1 — File upload service (`POST /uploads`)

**Why** — gates Steps 2.2, 2.5 (resource files), 2.7 (deliverable submissions), 2.8 (announcement attachments), and message attachments. The current `/messages/upload-file` returns a fake URL.

**Decision needed first** — Open Question Q1 (file storage choice). Recommendation: AWS S3 or Cloudflare R2 (S3-compatible) for production; fallback to local disk (`server/src/services/storage.js#saveBufferToDisk` already exists) for development if you set `STORAGE_DRIVER=disk`.

**Backend**

- `npm i multer @aws-sdk/client-s3` in `server/` (or your chosen SDK).
- New file: `server/src/services/uploadService.js` — exposes `uploadBuffer({ buffer, mimeType, originalName, scope }) → { url, key, mimeType, size }`. Driver-selectable via `STORAGE_DRIVER` env (`s3` | `r2` | `disk`).
- New route file: `server/src/routes/uploads.routes.js`:

  ```js
  router.post("/uploads", requireAuth, multer({ limits: { fileSize: 10 * 1024 * 1024 } }).single("file"), asyncHandler(async (req, res) => {
    if (!req.file) return apiError(res, "file is required.", 400);
    const result = await uploadService.uploadBuffer({ buffer: req.file.buffer, mimeType: req.file.mimetype, originalName: req.file.originalname, scope: req.body?.scope || "general" });
    return apiSuccess(res, result, 201);
  }));
  ```

- Register in `server/src/routes/index.js`.
- Retire the stub at `server/src/routes/messages.routes.js` L269–280 (or have it call the real upload service).

**Frontend**

- New file: `client/src/utils/api/uploadApi.js` — `uploadFile(file, scope) → { url, key, mimeType, size }` using `FormData` and the apiFetch wrapper.

**Acceptance** — Uploading a 1 MB PDF returns a URL that resolves publicly (or via a signed read URL); response shape matches the contract.

---

### Step 2.2 — Logo upload → URL, not base64

**Frontend**

- File: `client/src/components/organizations/OrganizationSettings.jsx` L162–204 — replace the `readAsDataURL` flow with `uploadFile(file, "org-logo")`, then `PUT /organizations/:id/logo` with `{ logo: <url> }`.

**Backend** — no change needed once Step 1.12 (Option A) is in.

**Acceptance** — A 2 MB logo uploads, persists, and renders on reload.

---

### Step 2.3 — Update/Delete cohort (`PUT/DELETE /cohorts/:cohortId`)

**Backend**

- File: `server/src/routes/organizations.routes.js` — add:

  ```js
  organizationsRouter.put("/cohorts/:cohortId", requireAuth, requireOrgAdmin, asyncHandler(organizationsController.updateCohort));
  ```

  (`DELETE` already exists at L120.)

- File: `server/src/controllers/organizations.controller.js` — new `updateCohort`:

  ```js
  export const updateCohort = async (req, res) => {
    const { name, description, startDate, endDate, status } = req.body || {};
    const cohort = await Cohort.findByIdAndUpdate(
      req.params.cohortId,
      { ...(name && { name }), ...(description != null && { description }), ...(startDate !== undefined && { startDate }), ...(endDate !== undefined && { endDate }), ...(status && { status }) },
      { new: true, runValidators: true },
    );
    if (!cohort) return apiError(res, "Cohort not found.", 404);
    return apiSuccess(res, cohort);
  };
  ```

- Decision: keep `deleteCohort` as hard-delete or switch to soft-delete (Open Question Q4). If soft-delete, add `deletedAt: Date` to `Cohort` schema and filter all reads by `{ deletedAt: null }`.

**Frontend**

- File: `client/src/components/organizations/CreateCohortModal.jsx` — accept an optional `cohort` prop for "edit mode"; call `PUT` instead of `POST` when provided.
- File: `client/src/components/dashboards/OrganizationDashboard.jsx` cohort dropdown (L378–406) — add an "Edit Cohort" item next to "Delete Cohort".

**Acceptance** — Renaming a cohort, changing dates, archiving it all work and persist.

---

### Step 2.4 — Update/Delete event (`PUT/DELETE /cohorts/:cohortId/events/:eventId`)

**Backend**

- File: `server/src/routes/organizations.routes.js` — add PUT + DELETE.
- File: `server/src/controllers/cohortWorkspace.controller.js` — new `updateCohortEvent`, `deleteCohortEvent`.
- Server-side meeting URL default: when `isVirtual` is true and `meetingUrl` is empty, generate `${PUBLIC_APP_URL}/join/Event-${shortId}` (drop the client-side generation in `EventManager.jsx` L164–168).
- Cancel notifications: when an event is deleted within 24h of `startsAt`, broadcast a `event-cancelled` notification to all cohort founders.

**Frontend**

- File: `client/src/components/organizations/EventManager.jsx` — add edit + delete actions to event cards. Add a confirm dialog before delete.

**Acceptance** — Editing an event title, deleting an event, both work end-to-end; founders get a cancellation notification if appropriate.

---

### Step 2.5 — Update/Delete resource (`PUT/DELETE /cohorts/:cohortId/resources/:resourceId`)

**Backend** — symmetric to Step 2.4. Allow attaching a file (use upload service) — set `resource.url` to the uploaded URL.

**Frontend**

- File: `client/src/components/organizations/ResourceLibrary.jsx` — edit + delete buttons on each card; "Upload file" option in the create form (uses `uploadApi.uploadFile`).

---

### Step 2.6 — Update/Delete program milestone (`PUT/DELETE /cohorts/:cohortId/program-milestones/:milestoneId`)

**Backend** — symmetric. Allow reorder via a `position: Number` field if you want drag-and-drop later.

**Frontend** — `ProgramMilestones.jsx` adds edit + delete actions per milestone.

---

### Step 2.7 — Update/Delete deliverable (`PUT/DELETE /cohorts/:cohortId/deliverables/:deliverableId`)

**Backend** — symmetric. Block deletion if any `DeliverableSubmission` already exists (return 409 with `"Cannot delete a deliverable that has submissions. Archive it instead."`) — or add an `archived: Boolean` field.

**Frontend** — `DeliverablesManager.jsx` adds edit + archive actions in the deliverable card.

---

### Step 2.8 — Update/Delete announcement (`PUT/DELETE /cohorts/:cohortId/announcements/:announcementId`) + mark-as-read

**Backend**

- PUT/DELETE controllers.
- New endpoint `POST /cohorts/:cohortId/announcements/:announcementId/read` — pushes `req.user.id` into `Announcement.readBy` (idempotent).

**Frontend**

- `CommunicationCenter.jsx` — edit/delete actions for admins; auto-mark-as-read on render for non-admins.

---

### Step 2.9 — Per-startup snapshot endpoint (`GET /startups/:startupId/snapshot`)

**Why** — fixes defect #13. `StartupSnapshotModal` currently relies on `CohortDashboardWithSidebar` to pre-build the object; once `members` is enriched (Step 1.1) this works, but a dedicated endpoint is needed if the modal is opened from anywhere else and as the single source of truth.

**Backend**

- New controller method in `server/src/controllers/organizations.controller.js`: `getStartupSnapshot`.
- Route: `organizationsRouter.get("/startups/:startupId/snapshot", requireAuth, asyncHandler(organizationsController.getStartupSnapshot));`
  - Access check: org admin of the startup's current cohort, mentor assigned to the founder, or the founder/team-member themselves.
- Aggregation: founder + startup + last 4 weeks of `WeeklyOutcome`s + active `Milestone` + recent `Task`s + `Activity` count.

**Frontend**

- File: `client/src/components/organizations/StartupSnapshotModal.jsx` — accept `startupId`/`founderId` and fetch on open; remove prop-prebuilt fallbacks.
- File: `client/src/utils/api/organizationApi.js#getStartupSnapshot` (L220–223) — keep as-is; route now exists.

---

### Step 2.10 — Mentor update + status; auto-send magic-link on invite

**Backend**

- File: `server/src/routes/mentors.routes.js` — add `PUT /mentors/:mentorId` (`requireMentorProfileOrgAdmin`) for editing expertise/status.
- File: `server/src/controllers/mentors.controller.js#inviteOrganizationMentor` (L153–188): if the email isn't a registered user, instead of returning 400, create the `MentorProfile` with `status: "pending"`, mint a token via the existing `requestMentorLink` logic, and email it (after Step 2.11). Then a non-registered mentor can complete signup via the magic link.

**Frontend**

- `MentorManager.jsx` — add edit-mentor button (expertise + status). Show pending mentors distinctly.

---

### Step 2.11 — Email transport (founder + mentor invite emails)

**Decision needed** — Open Question Q2 (email provider). Suggested defaults: SendGrid, Resend, or AWS SES.

**Backend**

- New file: `server/src/services/emailService.js` — `sendEmail({ to, subject, html, text })`. Driver via `EMAIL_DRIVER` env.
- `npm i @sendgrid/mail` (or your choice) in `server/`.
- Two templates to start (inline HTML is fine for v1):
  1. Cohort invitation (used by `invitations.controller.js#createInvitation`).
  2. Mentor magic link (used by `mentors.controller.js#requestMentorLink` and `inviteOrganizationMentor`).
- `URL` shape: `${PUBLIC_APP_URL}/invitation/${token}` and `${PUBLIC_APP_URL}/mentor/${token}` respectively.
- Idempotency: do not block the request on email-send failure; log and continue (notifications already work in-app).

**Frontend** — no changes.

**Acceptance** — Inviting a founder triggers an inbox email with the join link. Inviting a non-registered mentor triggers a magic-link email.

---

### Step 2.12 — Server-side notifications on event create + RSVPs

**Backend**

- File: `server/src/controllers/cohortWorkspace.controller.js#createCohortEvent` — after creating the event, broadcast a `cohort-event-created` in-app notification to every cohort founder (use `broadcastNotification`).
- File: server-side RSVP endpoint — there's already an RSVP route somewhere in `events.routes.js`; verify it emits and notifies the event organiser when attendees join.

**Frontend**

- File: `client/src/components/organizations/EventManager.jsx` L190–198 — **delete** the client-side `notifyEventCreated(...)` call. Server-side fanout replaces it.
- File: `client/src/utils/eventNotifications.js` — can be deprecated or kept only for non-cohort flows.

---

### Step 2.13 — Cancel / resend founder invitations

**Backend**

- `POST /invitations/:invitationId/cancel` → sets `status: "cancelled"` (extend enum in `CohortInvitation`), notifies the founder if they're a registered user.
- `POST /invitations/:invitationId/resend` → mints a fresh token, resets `expiresAt`, re-sends email.
- Access: caller must be an admin of the invitation's organisation.

**Frontend**

- File: `client/src/components/organizations/CohortDashboardWithSidebar.jsx` → "Members" tab — show pending invites distinctly. Add Cancel + Resend actions.

---

### Step 2.14 — Founder messages back to org (two-way Communication Center)

**Backend**

- New: `POST /messages/founder-to-org` — accepts `{ organizationId, cohortId, subject, body }`, validates the caller is a cohort member, creates `Message` with `messageType: "dm"`, `fromUserId: req.user.id`, `toUserId: <orgAdminUserId>` (broadcast to all admins by creating one Message per admin, OR pick the primary admin).
- Simpler v1: founder writes "to the org" → message goes to *all* org admins of that organisation in one shot.

**Frontend**

- New action in the founder-facing virtual office: "Message your accelerator" → opens the same compose form. (This may already exist; verify.)
- `CommunicationCenter.jsx` inbox — group incoming founder messages by founder; show reply button.

---

## PHASE 3 — Scale, Real-time & Polish

### Step 3.1 — Server-side pagination, search, filter, sort for every list endpoint

**Backend** — apply a uniform query contract:

```
?q=<text>          // optional search
&limit=<n>         // default 25, max 100
&skip=<n>          // default 0
&sortBy=<field>    // default createdAt
&sortOrder=asc|desc // default desc
&status=<value>    // optional filter (per resource)
```

Apply to: members, mentors, deliverables, submissions, events, resources, announcements, milestones, messages.

Response shape:

```json
{ "success": true, "data": { "items": [...], "total": 123, "limit": 25, "skip": 0 } }
```

Add a `TEXT` index on key fields (Resource.title/description, Deliverable.title, Event.title, ProgramMilestone.title) to back `?q`.

**Frontend** — every list page that already has a search/filter UI (Resource Library, Mentor Manager, Members tab) should debounce queries and pass them to the server. Add pagination controls or infinite scroll where appropriate.

---

### Step 3.2 — Org-side real-time (sockets) on dashboards

**Frontend**

- New hook: `client/src/hooks/useOrgRealtime.js` — `useOrgRealtime(organizationId, { onMessage, onDeliverableSubmitted, onAnnouncement, onMembershipChange })`. Internally joins `organization:<id>` and relevant `cohort:<id>` rooms.
- Subscribe in: `OrganizationDashboard.jsx`, `CohortDashboardWithSidebar.jsx`, `CommunicationCenter.jsx` (live inbox), `DeliverablesManager.jsx` (live submission counter).
- Optimistic UI on create/update/delete for primary actions.

**Backend** — sockets are already wired; verify that all new CRUD endpoints from Phase 2 emit the right events (`event-created`, `event-deleted`, etc.).

---

### Step 3.3 — Real portfolio-health scoring

**Backend**

- File: `server/src/controllers/cohortWorkspace.controller.js#getCohortPortfolioHealth` L201–251.
- Replace `defaultFactors` (L194–199) with real per-startup aggregations:
  - `weeklyExecution` (0–20): based on last 4 weeks of `WeeklyOutcome` completion rate.
  - `taskCompletion` (0–25): % of tasks completed in trailing 14 days.
  - `teamActivity` (0–25): activity events count in trailing 14 days, normalised.
  - `milestoneProgress` (0–30): completed milestones / total milestones.
- Sum to `score` (0–100). Compute `status` from existing thresholds.

---

### Step 3.4 — Richer cohort analytics (trends, velocity, histograms)

**Backend**

- Extend `getCohortAnalyticsOverview` (L118–192) with:
  - Engagement trend: last 8 weeks of activity counts.
  - Milestone velocity: completed-milestones-per-week.
  - Weekly outcome streak histogram.
  - Optional `?range=30d|90d|all` query param.

**Frontend** — `CohortAnalyticsDashboard.jsx` renders the new series (sparklines/charts).

---

### Step 3.5 — Sidebar badge counts (`GET /cohorts/:cohortId/badge-counts`)

**Backend**

- New endpoint returning:

  ```json
  { "success": true, "data": {
    "unreadMessages": 0,
    "pendingSubmissions": 0,
    "newAnnouncements": 0,
    "upcomingEventsNext7d": 0
  } }
  ```

**Frontend**

- `OrganizationSidebar.jsx` — replace hardcoded zeros with live counts; refresh every 60s and on socket events.

---

### Step 3.6 — Permissions audit + negative-path tests

For each new endpoint added in Phases 1–2, verify the right middleware is attached. Add Jest tests that hit each route with:
- No auth (expect 401).
- Auth but wrong role (expect 403).
- Auth + correct role + invalid input (expect 400).
- Auth + correct role + valid input (expect 200/201).

---

### Step 3.7 — Remove deprecated helper exports

File: `client/src/utils/organizationBackendHelpers.js` — delete:
- `getAllOrganizations` (L74–79)
- `getOrganizationMembers` (L81–84)
- `getOrganizationMembersByOrg` (L86–91)
- `getAllCohorts` (L189–194)
- `updateCohortStats` (L196–199)
- `getAllCohortInvitations` (L275–278)
- `getCohortInvitations` (L280–285)
- `createCohortMembership` (L388–408)
- `getAllCohortMemberships` (L340–343)
- `getCohortMemberships` (L345–350)
- `calculateStartupStatus` (L512–515)

Grep for callers first; remove dead code paths.

---

## Definition of Done

**Last reconciled:** 2026-05-19 — Phases 0–7 code + Phase 8 doc sync ([`CODING_TODO_STEPS.md`](CODING_TODO_STEPS.md)). Items marked `[x]` are implemented in repo; staging/prod QA may still be required where noted.

The integration is done when **every one of these** is true:

- [ ] Every list endpoint paginates and accepts `?q`, `?limit`, `?skip`, `?sortBy`, `?sortOrder` server-side (**partial** — org lists + cohort invitations paginated; P2 enumeration lists deferred per [`PAGINATION_AUDIT.md`](PAGINATION_AUDIT.md)).
- [ ] No field rendered in an org UI is `undefined`/`N/A` because the schema dropped it (verify on staging).
- [x] Every Create/Read/Update/Delete affordance visible in the UI hits a working endpoint, with role-gating and validation (Step 3.6 permissions audit + HTTP matrix in CI).
- [x] Add-admin-by-email works end-to-end (success path + 404 + 409) (`addOrganizationAdmin`; covered in permission matrix).
- [x] Logo upload works for real images (≤ 5 MB) (`POST /uploads` → Cloudinary).
- [x] File uploads (logo, resource files, deliverable submissions, message/announcement attachments) flow through one upload service and return URLs.
- [x] Cohort member list returns joined founder + startup + progress data; cohort response includes `stats`.
- [x] Founder invitation email is delivered via real transport (and resend works) (Mailtrap + Step 2.13; **verify live delivery on staging/prod**).
- [x] Mentor magic-link email is delivered; non-registered mentors can be invited (Step 2.10).
- [x] `Event`, `Resource`, `ProgramMilestone`, `Message` schemas carry every field the UI sends (code complete; spot-check payloads on staging).
- [x] Communication Center inbox shows real subjects, sender names, and supports mark-as-read.
- [x] Org dashboards refresh in real time via sockets on the primary actions (deliverable submitted, new message, new announcement) (`useOrgRealtime` + server emits; **manual** two-browser QA in [`CODING_TODO_STEPS.md`](CODING_TODO_STEPS.md) Phase 3).
- [x] Portfolio Health and Analytics show real, derived data — no hardcoded 15/12/15/10 (Steps 3.3–3.4).
- [x] Server-side notifications fire on event create, deliverable submit, deliverable review, invitation response, mentor assignment.
- [x] All `alert()` calls in `client/src/components/organizations/**` are replaced with the central toast/error helper (grep clean).
- [ ] Negative-path tests (401/403/404/400/409) cover every new endpoint (**partial** — Step 3.6 matrix covers org integration routes, not every legacy endpoint).

---

## Open Decisions Required Before Phase 1 Starts

Pin these down — Phase 1 work depends on them.

1. **File storage** — S3, Cloudflare R2, Cloudinary, or local disk? Needed for Steps 2.1–2.2 (and Step 1.12 Option A). *Default recommendation*: S3 in prod, local disk in dev.
2. **Email provider** — SendGrid, Resend, AWS SES, Postmark? Needed for Step 2.11. *Default recommendation*: Resend (simplest API), SES (cheapest at scale).
3. **`activityStatus` thresholds** — exact definitions for `active` / `slowing` / `stalled`. *Default proposal*: lastActive ≤ 7d = active, 8–21d = slowing, > 21d = stalled.
4. **Cohort delete behaviour** — hard-delete (current) or soft-delete with `deletedAt`? Affects Step 2.3.
5. **Founder invite acceptance without a Startup** — auto-create a placeholder Startup, block acceptance, or allow membership without one? Affects `invitations.controller.js#respondToInvitation` L395–410.
6. **Mentor invite to non-registered users** — invite-and-wait via magic link (recommended) or "must be a registered user first"? Affects Step 2.10.
7. **Resource categories** — fixed enum (current proposal) or free-form per org? Affects Step 1.6.
8. **Analytics visibility** — admin-only, or do founders/mentors see the analytics tab too? Affects Step 3.6 (permissions on `getCohortAnalyticsOverview`).
9. **Cohort messaging scope** — Communication Center inbox: org-wide (current) or per-cohort? Affects Step 1.8 and `listOrganizationMessages` filter.

---

### Suggested commit sequence (one PR per step is ideal, but Phase 1 can be 3–4 PRs grouped by area)

1. PR-1: Step 1.1 + 1.2 — Cohort member enrichment + cohort stats (one tight backend change set, large frontend cleanup).
2. PR-2: Step 1.3 + 1.4 — Add-admin fix + admin list enrichment.
3. PR-3: Step 1.5 + 1.6 + 1.7 — Schema extensions for Event / Resource / ProgramMilestone.
4. PR-4: Step 1.8 + 1.9 — Message + Announcement contract fixes.
5. PR-5: Step 1.10 + 1.11 + 1.12 — Invitations, mentors, logo cap.
6. PR-6: Step 1.13 — Error helper + alert() cleanup.
7. Then Phase 2 PRs in dependency order (Step 2.1 first, then 2.2; the CRUD steps 2.3–2.8 can ship in parallel; 2.11 unblocks 2.10 + 2.13).
8. Phase 3 last.
