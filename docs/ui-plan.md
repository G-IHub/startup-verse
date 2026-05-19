# StartupVerse Main App UI Implementation Plan

This document translates the approved redesign direction into an execution checklist for the main app surfaces (non-auth).

## 0. Phase 1 Decision Lock (Must Complete Before UI Refactor)

Phase 1 is a planning-and-contract lock only. It does not include visual redesign implementation.

### 0.1 Scope Lock (Core Roles Only)
- In scope: founder, team-member, talent, virtual office, inbox/notifications, analytics, settings, shared shell primitives.
- Out of scope: auth flows/pages, organization-admin redesign, router rewrite, backend API redesign.
- Organization-admin is explicitly marked `excluded-phase2` in the contract matrix.

### 0.2 Constraint Lock
- Backend contracts are source of truth for all redesign work.
- Runtime navigation model remains the current dashboard/app-view switch system for this wave.
- Security/ownership semantics must remain aligned to server guards (`requireSelfOrAdmin`, startup-scope checks, org checks).
- Realtime experiences must remain usable with fallback modes when sockets are unavailable.

### 0.3 Restructuring Boundary Lock
- Strategy: **Progressive Domain Split** only.
- Future target domains:
  - `shell`, `founder`, `team-member`, `talent`, `office`, `inbox`, `analytics`, `settings`, `shared`
- Migration rule:
  - Introduce new modules behind stable imports.
  - Move code incrementally by screen/domain after parity checks.
- Forbidden in Phase 1:
  - Mass file moves/reorg sweep
  - Route-engine replacement
  - Organization-admin coupling into phase-1 redesign scope

### 0.4 Contract Matrix Lock
- Companion matrix is maintained at [ui-contract-matrix.md](./ui-contract-matrix.md).
- Matrix schema is locked to:
  - `screen_id`, `entry_component`, `user_role`, `primary_endpoints`, `ownership_guard`, `realtime_dependency`, `fallback_mode`
- All matrix endpoints are sourced from existing `client` entry usage and current `server/src/routes/*`.

### 0.5 Phase 1 Exit Criteria
- Every in-scope screen has mapped backend contracts in the matrix.
- Every mapped screen has guard classification (`self/admin`, `startup`, or `org`).
- Every realtime-dependent screen has explicit fallback mode documented.
- No `excluded-phase2` surface is listed as phase-1 migration deliverable.

## 1. Scope, Constraints, and Success Criteria

### In Scope (Phase 1)
- Founder main app experience
- Team Member main app experience
- Talent main app experience
- Virtual Office
- Inbox + Notification UX
- Analytics
- Settings
- Shared app shell/navigation/layout primitives
- Light + dark mode parity

### Out of Scope (Phase 2+)
- Auth pages and auth flows
- Organization Admin redesign
- Router rewrite/migration
- Backend API redesign

### Hard Constraints
- Keep existing backend contracts as source of truth.
- Keep current navigation engine (incremental shell refactor only).
- Maintain existing security/ownership behavior on all user-scoped actions.
- Keep realtime features functional with polling fallback.
- Apply only progressive domain split in later phases (no hard reorg upfront).

### Definition of Done (Program Level)
- Core role pages run fully in redesigned shell.
- Mobile usability is validated on critical flows.
- Dark mode parity is complete for redesigned pages.
- `server` alignment/security gates pass.
- `client` build passes.

### Phase 1 Non-Regression Checks
- Contract matrix endpoints resolve to current server routes.
- Core-role rows have actionable contracts (not placeholders).
- Organization-admin remains explicitly excluded from redesign backlog.

## 2. Endpoint-to-Screen Contract Map (Guardrail)

Use this map to avoid introducing UI states that cannot be backed by current server APIs.

| Domain | Primary Screens | Core Endpoints |
|---|---|---|
| Weekly loop | Founder home, task/milestone panels | `/founders/:founderId/milestones`, `/founders/:founderId/tasks`, `/founders/:founderId/weekly-outcomes`, `/execution-score/:userId` |
| Virtual office | Workspace (presence, activity, wins, task panel, team hub, agenda) | `/presence/*`, `/startups/:startupId/activities`, `/startups/:startupId/wins`, `/messages/*`, `/agenda/*`, `/calendar/:userId` |
| Marketplace | Talent home, founder team matching | `/talent/*`, `/founders/:founderId/posts`, `/talent/startup-posts`, `/invitations/*`, `/interests/*` |
| Inbox + notifications | Inbox, notification center | `/invitations/*`, `/interests/*`, `/messages/*`, `/notifications/*`, `/users/:userId/notifications*` |
| Analytics | Founder analytics page | `/founders/:founderId/analytics`, `/execution-score/:userId` |
| Settings/profile | Settings page and profile edits | `/auth/profile/:userId`, `/users/:userId`, `/users/:userId/notification-preferences` |

## 3. Design Foundation (Tokens + Typography + Readability)

### 3.1 Token System
- Define canonical tokens for:
  - Blue primary scale
  - Neutral surfaces (white-first light mode, dark surfaces for dark mode)
  - Semantic colors (`success`, `warning`, `danger`, `info`)
  - Spacing, radius, elevation, motion durations/easing
- Keep token names stable for component-level reuse.

### 3.2 Typography
- Headings: **Sora** (see [`client/src/styles/globals.css`](../client/src/styles/globals.css))
- Body/UI text: **IBM Plex Sans**
- Apply via global CSS variables, Tailwind `font-heading` / `font-body`, and utility classes.
- Rollout flags and env: [`UI_REDESIGN_ROLLOUT.md`](UI_REDESIGN_ROLLOUT.md)
- Set minimum readable size standards for app content:
  - Body: no less than 14px on desktop/mobile content regions
  - Micro labels/badges: avoid sub-12px for critical information

### 3.3 Readability Normalization
- Remove tiny-text-heavy styling on redesigned core pages.
- Standardize heading hierarchy (`display`, `h1`, `h2`, `section-title`, `label`).
- Ensure contrast compliance in both themes.

## 4. Shared App Shell and Page Templates

### 4.1 New Shell Contract
- Left navigation rail (desktop), slide-in nav (mobile)
- Top utility bar (theme toggle, notifications, profile menu)
- Page header slot (title + key actions + status chips)
- Content grid slot (role-specific main body)
- Sticky mobile action area for key actions

### 4.2 Standard Page Templates
- `overview`: KPI cards + prioritized actions + recent activity
- `workspace`: multi-zone collaboration canvas (desktop) + stacked/mobile tabs
- `list-detail`: list/table + detail panel/dialog
- `settings`: grouped forms/preferences + save states

### 4.3 Migration Rule
- Existing page logic/components remain operational while being wrapped/adapted to the new shell slots.
- No route engine rewrite in this phase.

## 5. Role-Specific Redesign Execution

### 5.1 Founder Home (Weekly Loop First)
- Surface at-a-glance:
  - Active weekly goal
  - Milestone completion
  - Task status mix (pending/in-progress/blocked/completed)
  - Execution score + streak
  - Current blockers
- Fast actions:
  - Set/update weekly goal
  - Add milestone
  - Create/assign/update task
  - Submit weekly outcome
- Keep deep links to Virtual Office task context and notifications.

### 5.2 Virtual Office
- Recompose into explicit zones:
  - Presence
  - Activity feed
  - Task panel
  - Team hub/messages
  - Wall of wins
  - Agenda/check-ins
- Keep socket-first updates plus bounded polling fallback.
- Mobile UX:
  - Prioritized zone order
  - Bottom-sheet/panel patterns for heavy interactions

### 5.3 Team Member Experience
- Prioritize "My Work Today":
  - Assigned tasks
  - Status transitions
  - Blocked-task capture and resolution
  - Check-in and progress signals
- Keep status transitions aligned with server lifecycle rules.

### 5.4 Talent Experience
- Talent home should show:
  - Profile completion status/action
  - Recommended opportunities
  - Saved items
  - Application/interest states
- Improve browse and apply flows:
  - Better filters
  - Clear compensation/role details
  - Clear handoff into inbox/onboarding

### 5.5 Inbox + Notifications
- Unify sent/received conversation and decision flow UX.
- Make unread/new activity states clear and consistent.
- Keep role-aware actions explicit (founder vs talent).
- Preserve notification deep-link behavior into relevant contexts.

### 5.6 Analytics + Settings
- Analytics layout priority:
  1. Executive summary
  2. Trends
  3. Diagnostics
- Settings:
  - Group by user task (profile, preferences, notifications, account)
  - Clear save/error states
  - Theme parity and accessibility consistency

## 6. Frontend Contract Layer (View-Model Mappers)

Create canonical UI mappers so pages consume normalized shapes instead of mixed raw payloads.

### 6.1 Mapper Targets
- Founder dashboard mapper
- Virtual office mapper (presence/activity/messages/wins/agenda)
- Team member workboard mapper
- Talent marketplace mapper
- Inbox thread/item mapper
- Analytics summary mapper
- Settings/preferences mapper

### 6.2 Mapper Rules
- Normalize IDs (`id`/`_id`), dates, status enums, ownership flags.
- Keep fallback-safe handling for partially populated/legacy payloads.
- Keep endpoint method/contract compatibility unchanged.

## 7. Rollout Strategy (Feature-Flagged)

Introduce frontend flag for phased enablement:

1. Shell + design tokens
2. Founder home
3. Virtual office
4. Team member
5. Talent
6. Inbox + notifications
7. Analytics + settings

### Rollout Rule
- Old view remains available as fallback until each redesigned area passes acceptance.
- Remove legacy UI path only after parity verification.

## 8. Testing and Quality Gates

### 8.1 Mandatory CI/Smoke Commands
```bash
cd server && npm run test:alignment-gate
cd server && npm run test:phase8-security
cd client && npm run build
```

### 8.2 Page-Level Acceptance Checklist
- Founder: weekly loop from goal to outcome submission.
- Virtual office: realtime + polling fallback for presence/activity/task/message/wins/agenda.
- Team member: task updates/blocker flows persist after refresh.
- Talent: browse/save/interest/apply and inbox transitions work.
- Inbox: role-specific sent/received actions and unread indicators are correct.
- Analytics/settings: stable loading/error states and dark mode parity.

### 8.3 Responsive + Accessibility
- Validate mobile-first behavior on all redesigned core pages.
- Keyboard navigation and visible focus states.
- Color contrast checks for light and dark modes.

## 9. Execution Checklist

- [ ] Create design token spec and apply global foundation.
- [ ] Implement typography migration (Syne + DM Sans) and readable text baselines.
- [ ] Implement new shell slots and page template primitives.
- [ ] Migrate Founder home into new shell/template.
- [ ] Migrate Virtual Office into zoned layout (desktop + mobile).
- [ ] Migrate Team Member main pages.
- [ ] Migrate Talent main pages.
- [ ] Migrate Inbox + Notification UX.
- [ ] Migrate Analytics + Settings.
- [ ] Add/complete view-model mappers for all redesigned domains.
- [ ] Run contract/security/build gates and fix regressions.
- [ ] Complete manual acceptance + responsive + accessibility checks.
- [ ] Remove deprecated UI paths after parity signoff.

## 10. Notes

- This document is implementation order and quality criteria.
- Product intent source remains `startup-verse_master_blueprint.md`.
- Organization Admin redesign is intentionally deferred to phase 2.
