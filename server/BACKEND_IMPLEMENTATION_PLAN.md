# StartupVerse Backend Implementation Plan

Document status: Implementation design only (no code changes in this phase)  
Target stack: Node.js + Express + MongoDB (Mongoose), JavaScript-first

## 0) Purpose, Scope, and Source-of-Truth

### Purpose
This document defines the backend implementation blueprint for StartupVerse, aligned to the new architecture and business model in:

- `StartupVerse_AI_Agent_Prompt.md`
- `StartupVerse_Strategy_Ecosystem_Model.pdf`

It also maps current frontend dependencies to required backend contracts and defines a conservative cleanup plan for third-party BaaS-era artifacts.

### Scope

- In scope:
  - Backend architecture design
  - Data model specifications
  - Public API contracts
  - Legacy hosted backend decommission plan
  - Cleanup manifest (plan only)
  - Test and acceptance plan
- Out of scope in this phase:
  - Implementing backend code
  - Deleting files/folders
  - Editing frontend behavior

### Source-of-truth precedence

1. Strategy and architecture intent in prompt/PDF
2. Required runtime behavior implied by active frontend code
3. Existing repo structure and dependency reality

### Non-negotiable constraints for this phase

- Final architecture excludes third-party BaaS as a core backend dependency.
- Backend runtime must be Express + MongoDB/Mongoose.
- This file is design-only; no implementation or deletions are executed in this phase.

---

## 1) Current-State vs Target Audit Matrix

| Area | Expected (Prompt/PDF) | Current Repo | Delta | Migration Action |
|---|---|---|---|---|
| Server application code | Express API app with route groups, models, middleware, jobs, realtime | `server/` has `package.json`, `package-lock.json`, `tsconfig.json`; no `src/` backend code | Critical gap | Build full `server/src/*` architecture (see Section 2) |
| Backend data layer | MongoDB + Mongoose entity model | MongoDB dependencies installed but no schemas | Critical gap | Implement model catalog from Section 3 |
| Auth and permissions | JWT + role-based + org-admin middleware | No middleware code exists yet | Critical gap | Implement `requireAuth`, `requireRole`, `requireOrgAdmin` |
| Frontend API routing | Unified API base (`VITE_API_URL`) | Mixed: many files use `VITE_API_URL`, others hardcode legacy vendor function URLs | High inconsistency | Standardize all runtime API calls to Express base after parity |
| Realtime | Legacy vendor replacement with server-side realtime strategy | Vendor-specific realtime helper files and channel assumptions remain in client | High inconsistency | Replace with Socket.IO event contract and polling fallback |
| Frontend state model (target in prompt) | TanStack Query for server state, Zustand for UI state, router-driven navigation | Active app uses custom `fetch` wrappers, localStorage-heavy state, query-param view switching in `App.jsx` | Architectural mismatch | Preserve behavior short term; plan staged refactor after backend parity |
| Routing model | Router-centric role routing | Active app does view selection from URL params and local session helpers | Partial mismatch | Keep existing UX contract; align server auth/role responses first |
| Legacy hosted decommission readiness | No runtime vendor-BaaS dependency | Vendor function URLs/usages remain in runtime and support files | Not ready | Execute decommission phases in Section 5 |
| Cleanup posture | Conservative and safe | Many historical debug/deploy/test artifacts in `client/src` | Needs triage | Use cleanup matrix in Section 6; defer risky removals until parity gates pass |

---

## 2) Target Backend Architecture (JavaScript)

### 2.1 Canonical server structure

```text
server/
  src/
    app.js
    index.js
    config/
      env.js
      db.js
      cors.js
      jwt.js
      logger.js
    models/
      User.js
      Startup.js
      FounderProfile.js
      Task.js
      Milestone.js
      WeeklyOutcome.js
      Activity.js
      TeamMemberProfile.js
      TeamMemberStatus.js
      Organization.js
      OrganizationAdmin.js
      Cohort.js
      CohortInvitation.js
      CohortMembership.js
      Deliverable.js
      DeliverableSubmission.js
      StartupPost.js
      FounderTalentInvitation.js
      Interest.js
      TalentApplication.js
      SavedItem.js
    routes/
      index.js
      auth.routes.js
      users.routes.js
      founders.routes.js
      teamMembers.routes.js
      talent.routes.js
      organizations.routes.js
      cohorts.routes.js
      invitations.routes.js
      interests.routes.js
      deliverables.routes.js
      messages.routes.js
      notifications.routes.js
      agenda.routes.js
      executionScore.routes.js
      presence.routes.js
      health.routes.js
      google.routes.js
    controllers/
      *.controller.js
    services/
      auth.service.js
      executionScore.service.js
      matching.service.js
      notification.service.js
      message.service.js
      agenda.service.js
      presence.service.js
    middleware/
      requireAuth.js
      requireRole.js
      requireOrgAdmin.js
      errorHandler.js
      notFound.js
      validateRequest.js
      requestId.js
    validators/
      *.validator.js
    realtime/
      socketServer.js
      events.js
      rooms.js
    jobs/
      notificationReminders.job.js
      streakRisk.job.js
      dailyAgenda.job.js
    utils/
      apiResponse.js
      pagination.js
      enums.js
      constants.js
      sanitize.js
      objectId.js
      date.js
  BACKEND_IMPLEMENTATION_PLAN.md
```

### 2.2 Runtime responsibilities

- `app.js`: Express app wiring (middleware, routes, error handlers)
- `index.js`: process bootstrap, DB connect, HTTP server, Socket.IO attach
- `config/*`: environment validation, DB connection, CORS/JWT setup
- `models/*`: Mongoose schemas and indexes
- `controllers/*`: request/response orchestration only
- `services/*`: business logic and cross-model flows
- `validators/*`: payload and query validation
- `realtime/*`: Socket.IO namespaces/rooms/events
- `jobs/*`: scheduled notification/reminder workloads

### 2.3 Environment contract

| Variable | Required | Purpose |
|---|---|---|
| `NODE_ENV` | Yes | Runtime mode (`development`, `test`, `production`) |
| `PORT` | Yes | API port (default target `8000`) |
| `CORS_ORIGIN` | Yes | Allowed frontend origin(s) |
| `JWT_SECRET` | Yes | JWT signing secret |
| `JWT_EXPIRES_IN` | Yes | Token TTL |
| `MONGODB_CONNECTION_URI` | Yes | MongoDB connection string |

### 2.4 Cross-cutting backend policy

- API envelope standard:
  - success: `{ success: true, data: ... }`
  - error: `{ success: false, message: "...", errors?: [...] }`
- Never return secret fields (`hashedPassword`, internal secret tokens).
- Route versioning stays `/api/v1/*`.
- All protected routes require `Authorization: Bearer <token>`.

---

## 3) Data Model Catalogue (MongoDB/Mongoose)

## 3.1 Schema policy (applies to all models)

- Use `timestamps: true` on all persistent models.
- Use ObjectId references for entity links.
- Index foreign keys heavily used in queries (`userId`, `founderId`, `startupId`, `cohortId`, etc.).
- Prefer enum guards for status/role fields.
- Add optimistic concurrency where cross-entity writes must remain consistent.
- Enforce immutable-history rules:
  - Activity records are append-only.
  - Weekly outcome entries cannot be silently rewritten once final status is submitted.
  - Execution score is derived, not manually stored as authoritative state.

## 3.2 Model specifications

### 1) User

- Required fields:
  - `name`, `email`, `hashedPassword`, `role`
- Core fields:
  - `startupId`, `founderId`, `onboardingComplete`, `isAdmin`, `profile`
  - Optional profile metadata (`bio`, `location`, `skills`, portfolio fields, etc.)
- Enums:
  - `role`: `founder`, `team-member`, `talent`, `mentor`, `investor`, `freelancer`, `organization-admin`, `admin` (internal)
- Indexes:
  - unique `email`
  - `role`
  - `startupId`
- Relationships:
  - one user to one active role state
- Integrity rules:
  - `role` is system-of-record for permissions and dashboard behavior.

### 2) Startup

- Required fields:
  - `founderId`, `name`
- Optional fields:
  - `description`, `industry`, `stage`, `website`, `logo`, `data`
- Indexes:
  - unique `founderId` (one-founder-one-startup constraint)
  - `stage`, `industry`
- Relationships:
  - belongs to founder user
  - has tasks, milestones, outcomes, posts, cohort memberships

### 3) FounderProfile

- Required fields:
  - `userId`, `startupId`
- Optional fields:
  - experience/background metadata
- Indexes:
  - unique `userId`
  - `startupId`
- Relationships:
  - one-to-one with founder user

### 4) Task

- Required fields:
  - `founderId`, `startupId`, `title`, `status`
- Optional fields:
  - `description`, `assignedTo`, `milestoneId`, `comments[]`, `incentive`, `actionButton`
  - `blockerReason`, `blockerNote`
- Enums:
  - `status`: `pending`, `in-progress`, `completed`, `blocked`
- Indexes:
  - `founderId`, `startupId`, `assignedTo`, `milestoneId`, `status`, `createdAt`
- Integrity rules:
  - blocked tasks require blocker fields.

### 5) Milestone

- Required fields:
  - `founderId`, `startupId`, `title`, `order`, `weekId`
- Optional fields:
  - `tasksCompleted`, `totalTasks`
- Indexes:
  - compound unique: `founderId + weekId + order`
  - `startupId`
- Integrity rules:
  - order must be contiguous/sequenced.
  - completion counters are derived from linked tasks.

### 6) WeeklyOutcome

- Required fields:
  - `founderId`, `startupId`, `weekId`, `status`
- Optional fields:
  - `goal`, `completionData`, `notes`
- Enums:
  - `status`: `active`, `completed`, `partial`, `missed`
- Indexes:
  - unique `founderId + weekId`
  - `startupId`, `status`
- Integrity rules:
  - one record per founder per week.
  - final state write-lock policy once week is closed.

### 7) Activity

- Required fields:
  - `userId`, `startupId`, `type`, `data`, `timestamp`
- Enums:
  - `type`: `check-in`, `task-complete`, `milestone`, `chat`, `status-change`, `join`, `celebration`
- Indexes:
  - `startupId + timestamp`
  - `userId + timestamp`
  - `type`
- Integrity rules:
  - immutable/append-only.

### 8) TeamMemberProfile

- Required fields:
  - `userId`, `startupId`
- Optional fields:
  - role/department/work type/skills
- Indexes:
  - unique `userId`
  - `startupId`

### 9) TeamMemberStatus

- Required fields:
  - `memberId`, `startupId`, `statusText`, `updatedAt`
- Optional fields:
  - `mood`
- Indexes:
  - `memberId`
  - `startupId + updatedAt`

### 10) Organization

- Required fields:
  - `name`, `type`
- Optional fields:
  - `description`, `logo`, `settings`
- Indexes:
  - `name`
  - `type`

### 11) OrganizationAdmin

- Required fields:
  - `organizationId`, `userId`
- Indexes:
  - unique `organizationId + userId`
  - `userId`
- Integrity rules:
  - controls org-level write permissions.

### 12) Cohort

- Required fields:
  - `organizationId`, `name`, `startDate`, `endDate`, `status`
- Optional fields:
  - `description`
- Enums:
  - `status`: `draft`, `active`, `completed`, `archived`
- Indexes:
  - `organizationId + status`
  - `startDate`, `endDate`

### 13) CohortInvitation

- Required fields:
  - `cohortId`, `founderId`, `token`, `status`, `expiresAt`
- Enums:
  - `status`: `pending`, `accepted`, `declined`
- Indexes:
  - unique `token`
  - `founderId + status`
  - `cohortId`

### 14) CohortMembership

- Required fields:
  - `cohortId`, `founderId`, `startupId`, `joinedAt`
- Indexes:
  - unique `cohortId + startupId`
  - `founderId`
  - `startupId`

### 15) Deliverable

- Required fields:
  - `cohortId`, `title`, `dueDate`, `type`
- Optional fields:
  - `description`
- Indexes:
  - `cohortId + dueDate`
  - `type`

### 16) DeliverableSubmission

- Required fields:
  - `deliverableId`, `founderId`, `status`
- Optional fields:
  - `url`, `notes`, `attachments`, `feedback`
- Enums:
  - `status`: `submitted`, `reviewed`
- Indexes:
  - unique `deliverableId + founderId`
  - `founderId + status`

### 17) StartupPost

- Required fields:
  - `founderId`, `startupId`, `title`, `role`, `type`
- Optional fields:
  - `description`, `requirements`
- Indexes:
  - `founderId`
  - `startupId`
  - `role`, `type`

### 18) FounderTalentInvitation

- Required fields:
  - `founderId`, `talentId`, `role`, `status`
- Optional fields:
  - `message`, `messages[]`
- Enums:
  - `status`: `pending`, `accepted`, `declined`, `withdrawn`
- Indexes:
  - `founderId + status`
  - `talentId + status`

### 19) Interest

- Required fields:
  - `talentId`, `founderId`, `postId`, `status`
- Optional fields:
  - `message`, `messages[]`, `onboarded`
- Enums:
  - `status`: `pending`, `accepted`, `declined`, `withdrawn`
- Indexes:
  - `founderId + status`
  - `talentId + status`
  - `postId`
- Integrity rules:
  - onboarding transition updates role/startup assignment transactionally.

### 20) TalentApplication

- Required fields:
  - `talentId`, `postId`, `startupId`, `status`
- Optional fields:
  - `coverLetter`
- Enums:
  - `status`: `pending`, `reviewed`, `shortlisted`, `rejected`, `accepted`
- Indexes:
  - `talentId + status`
  - `postId + status`

### 21) SavedItem

- Required fields:
  - `talentId`, `itemType`, `itemId`
- Enums:
  - `itemType`: `job`, `startup`
- Indexes:
  - unique `talentId + itemType + itemId`
  - `talentId`

---

## 4) Public API Contract

## 4.1 API envelope and status behavior

- Success payload:

```json
{ "success": true, "data": {} }
```

- Error payload:

```json
{ "success": false, "message": "Error message", "errors": [] }
```

- Standard HTTP codes:
  - `200`, `201`, `400`, `401`, `403`, `404`, `409`, `422`, `500`

## 4.2 Route groups (canonical)

All routes are versioned under `/api/v1`.

### Health

- `GET /health`

### Auth and Accounts

- `POST /auth/signup`
- `POST /auth/signin`
- `PUT /auth/profile/:userId`
- `GET /auth/account/:userId`

### Users

- `GET /users/:userId`
- `POST /users/search-by-email`

### Founder domain

- `POST /founders/profile`
- `GET /founders/profile/:userId`
- `GET /founders/:founderId/startup`
- `POST /founders/startup`
- `GET /founders/startup/:startupId`
- `GET /founders/:founderId/milestones`
- `POST /founders/:founderId/milestones`
- `DELETE /founders/:founderId/milestones/:milestoneId`
- `GET /founders/:founderId/tasks`
- `POST /founders/:founderId/tasks`
- `PUT /founders/:founderId/tasks/:taskId`
- `PUT /founders/:founderId/tasks/:taskId/status`
- `PUT /founders/:founderId/tasks/:taskId/assign`
- `DELETE /founders/:founderId/tasks/:taskId`
- `GET /founders/:founderId/weekly-outcomes`
- `POST /founders/:founderId/weekly-outcomes`
- `GET /founders/:founderId/posts`
- `POST /founders/:founderId/posts`
- `DELETE /founders/:founderId/posts/:postId`
- `GET /founders/:founderId/invitations`
- `POST /founders/invitations`

### Team members

- `POST /team-members/profile`
- `GET /team-members/profile/:userId`
- `GET /team-members/:teamMemberId/tasks`
- `PUT /team-members/:teamMemberId/tasks/:taskId`
- `POST /team-members/:teamMemberId/tasks/:taskId/comments`
- `GET /team-members/:teamMemberId/activity`
- `GET /team-members/:teamMemberId/status`
- `POST /team-members/:teamMemberId/status`
- `GET /team-members/:teamMemberId/performance`

### Talent

- `POST /talent/profile`
- `GET /talent/profile/:userId`
- `GET /talent/browse`
- `GET /talent/opportunities`
- `POST /talent/:talentId/applications`
- `GET /talent/:talentId/applications`
- `POST /talent/:talentId/saved`
- `GET /talent/:talentId/saved`
- `DELETE /talent/:talentId/saved/:itemType/:itemId`
- `GET /talent/:talentId/matches`

### Organization and cohorts

- `POST /organizations/create`
- `GET /organizations/user/:userId`
- `GET /organizations/:orgId`
- `PUT /organizations/:orgId/update`
- `GET /organizations/:orgId/admins`
- `POST /organizations/:orgId/admins`
- `DELETE /organizations/:orgId/admins/:adminUserId`
- `POST /cohorts/create`
- `GET /cohorts/organization/:orgId`
- `GET /cohorts/:cohortId`
- `DELETE /cohorts/:cohortId`
- `GET /cohorts/:cohortId/members`

### Invitations and interests

- `POST /invitations/create` (org -> founder)
- `GET /invitations/founder/:founderId`
- `GET /invitations/token/:token`
- `POST /invitations/:invitationId/respond`
- `POST /invitations/send` (founder -> talent)
- `GET /invitations/sent/:founderId`
- `GET /invitations/received/:talentId`
- `PUT /invitations/:invitationId/status`
- `POST /invitations/:invitationId/messages`
- `POST /interests/send` (talent -> founder)
- `GET /interests/received/:founderId`
- `GET /interests/sent/:talentId`
- `GET /interests/:interestId`
- `PUT /interests/:interestId/status`
- `POST /interests/:interestId/messages`
- `POST /interests/:interestId/onboard`

### Deliverables

- `GET /deliverables/founder/:founderId`
- `GET /deliverables/:cohortId`
- `POST /deliverables/create`
- `POST /deliverables/:deliverableId/submit`
- `GET /deliverables/:deliverableId/submissions`
- `POST /deliverables/submissions/:submissionId/review`

### Messages and inbox

- `POST /messages/send`
- `POST /messages/send-from-founder`
- `GET /messages/:userId`
- `GET /messages/conversation/:startupId/:userId/:otherUserId`
- `GET /messages/conversations/:startupId/:userId`
- `POST /messages/mark-read`
- `GET /messages/unread-count/:startupId/:userId`
- `POST /messages/upload-file`
- `GET /messages/organization/:organizationId`

### Notifications

- `GET /notifications`
- `POST /notifications`
- `POST /notifications/batch`
- `PUT /notifications/:notificationId/read`
- `DELETE /notifications/:notificationId`
- `POST /users/:userId/notifications/mark-all-read`
- `POST /notifications/test`
- `POST /notifications/weekly-outcome-reminder`
- `POST /notifications/task-assigned`
- `POST /notifications/task-blocked`
- `POST /notifications/weekly-review-reminder`
- `POST /notifications/streak-at-risk`

### Agenda and calendar

- `GET /agenda/:startupId`
- `GET /agenda/user/:userId`
- `GET /agenda/:startupId/upcoming`
- `POST /agenda/notifications/daily`
- `GET /agenda/:startupId/weekly-summary`
- `GET /calendar/:userId` (aggregated endpoint)

### Execution score

- `GET /execution-score/:userId`

### Presence and realtime

- `POST /presence/update`
- `GET /presence/:startupId`
- `DELETE /presence/:startupId/:userId`

### Google integration (placeholders, planned)

- `GET /google/status/:userId` (planned)
- `GET /google/oauth/authorize` (planned)
- `GET /google/oauth/callback` (planned)
- `POST /google/create-meeting` (planned)
- `POST /google/instant-meeting/:userId` (planned)
- `POST /google/disconnect/:userId` (planned)

---

## 5) Legacy hosted backend decommission plan (backend-centric)

## 5.1 Dependency categories and replacement map

| Category | Current State | Replacement |
|---|---|---|
| Hardcoded vendor function URLs | Runtime files call legacy hosted function bases | Replace with `VITE_API_URL` Express routes |
| Vendor realtime channel helpers | Legacy realtime modules and channel semantics in office/presence flows | Socket.IO event contracts + polling fallback |
| Vendor deploy/debug docs and scripts | `deploy-backend.*`, `QUICK_DEPLOY_COMMANDS.txt`, related check files | Remove after backend parity and cutover |
| Vendor-specific migration helpers | `utils/migrations/*` targeting function URLs | Replace with server-native migration/admin tasks |

## 5.2 Decommission phases

1. Phase A: API parity
   - Implement all required Express endpoints that currently map to legacy vendor function URLs.
2. Phase B: Realtime parity
   - Implement Socket.IO channels/events for presence, tasks, activities, announcements, wins, unread counts.
3. Phase C: Client cutover
   - Redirect runtime API clients to `VITE_API_URL`.
   - Remove runtime imports that depend on `projectId`/vendor-hosted endpoints.
4. Phase D: Cleanup
   - Remove deprecated vendor runtime and deployment artifacts per Section 6.

## 5.3 Cutover gate (must pass before deleting runtime vendor paths)

- Every vendor-dependent runtime endpoint has Express equivalent with successful smoke tests.
- Realtime event parity verified (connected and fallback modes).
- Frontend build and core flows pass against local Express backend.
- Grep checks show zero vendor-BaaS usage in active runtime code paths (excluding intentionally retained historical docs if any).

---

## 6) Conservative Cleanup Manifest (Plan-Only)

This is a deletion plan, not an execution record. No deletions are performed in this phase.

### Keep

| Path / Pattern | Reason |
|---|---|
| `StartupVerse_AI_Agent_Prompt.md` | Strategic and architectural source of truth |
| `StartupVerse_Strategy_Ecosystem_Model.pdf` | Strategic source of truth |
| `client/src/components/**`, `client/src/hooks/**`, `client/src/contexts/**`, `client/src/app/**`, `client/src/utils/**` | Core product runtime |
| `server/package.json`, `server/package-lock.json`, `server/tsconfig.json` | Backend bootstrap essentials |
| All `node_modules` directories | Explicitly excluded from cleanup in this plan |

### Delete (safe candidates, non-runtime historical clutter)

| Path / Pattern | Reason | Preconditions |
|---|---|---|
| `client/src/imports/app-logs-1.txt` | Historical log artifact | Team confirms no documentation dependency |
| `client/src/imports/startupverse-logs.txt` | Historical log artifact | Team confirms no documentation dependency |
| `client/src/runner-style one-off debug html/txt files` | Non-runtime diagnostics | Confirm no active debugging workflow relies on them |

### Delete After Parity (must wait for legacy hosted cutover gate)

| Path / Pattern | Reason |
|---|---|
| `client/src/utils/socketIoRealtime.js` | Socket.IO realtime client |
| `client/src/utils/realtimeSubscriptions.js` | Re-exports realtime helpers |
| `client/src/utils/backendCacheVersion.js` | Backend version / cache invalidation |
| `client/src/utils/organizationBackendHelpers.js` | Organization REST wrappers |
| `client/src/deploy-backend.bat`, `client/src/deploy-backend.sh`, `client/src/deploy.bat`, `client/src/deploy.sh` | Legacy stubs (point to `/server`) |
| `client/src/QUICK_DEPLOY_COMMANDS.txt`, `client/src/DEPLOY_VISUAL_GUIDE.txt`, `client/src/FIX_IN_3_WAYS.txt`, `client/src/CHECK_IF_IT_WORKED.txt` | Legacy migration guides (review/remove) |
| Hardcoded vendor API helper files once replaced | Prevent mixed transport paths in runtime |

---

## 7) Test Plan and Acceptance Criteria

## 7.1 Contract coverage checklist

- For each active frontend endpoint call, map to one backend route in Section 4.
- Verify method, path params, query params, and response envelope.
- Validate pagination and filtering behavior for list endpoints.

## 7.2 Model validation scenarios

- Required fields rejected when missing.
- Enum fields reject invalid values.
- Unique indexes enforce constraints (`email`, `cohortId+startupId`, etc.).
- Relationship integrity checks (ObjectId references and ownership rules).

## 7.3 Auth and permission scenarios

- Protected route without token -> `401`.
- Valid token with wrong role -> `403`.
- Org-admin route with non-admin user -> `403`.
- Admin-only routes enforce role + `isAdmin` policy.

## 7.4 Weekly execution loop scenarios

- Founder creates weekly goal (active outcome).
- Founder creates milestones with sequence constraints.
- Founder/team creates and updates tasks.
- Blocked task requires reason/note.
- Weekly outcome closes as `completed`, `partial`, or `missed`.
- Execution score endpoint reflects latest derived metrics.

## 7.5 Realtime and fallback scenarios

- Socket connected:
  - Presence, task status, activity feed, announcements, wins, unread counts propagate.
- Socket disconnected:
  - Polling fallback preserves functional visibility and data freshness.

## 7.6 Vendor-BaaS removal gates

- Runtime grep gate:
  - No legacy vendor function host references in active runtime code.
  - No `projectId`-based vendor URL composition in active runtime code.
- Build gate:
  - Frontend build succeeds without missing realtime or API helper modules.
- Smoke gate:
  - Core founder/team/talent/org flows pass against Express backend.

## 7.7 Build and runtime verification

- Backend starts cleanly with validated env vars.
- Health endpoint responds.
- Frontend app runs against backend using `VITE_API_URL`.
- Critical user journeys pass manual smoke tests:
  - auth, onboarding, founder execution loop, messaging/inbox, organization cohort flow, talent matching.

---

## 8) Assumptions and Defaults

- Plan file location is `server/BACKEND_IMPLEMENTATION_PLAN.md`.
- Backend implementation language is JavaScript.
- Cleanup mode is conservative.
- No backend implementation occurs in this phase.
- No file/folder deletion occurs in this phase.
- `node_modules` directories are explicitly out of cleanup scope.

---

## 9) Implementation Sequence (When Build Phase Starts)

1. Scaffold `server/src` structure and bootstrapping.
2. Implement config, middleware, and shared response utilities.
3. Implement model layer (Section 3).
4. Implement route/controller/service layers by domain (Section 4).
5. Implement Socket.IO realtime layer with polling fallback.
6. Cut frontend API calls fully to Express base URL.
7. Validate with Section 7 test plan.
8. Execute conservative cleanup once parity gates pass.

