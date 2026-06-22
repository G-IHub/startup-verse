# StartupVerse — Projects Feature: Execution Plan

> **Purpose:** Step-by-step checklist to implement the Projects feature. Product spec lives in [`startupverse-projects-plan.md`](./startupverse-projects-plan.md). **Follow phases in order.** Each numbered step is one commit unless noted otherwise.
>
> **Status:** Not started · Last updated: 2026-06-22

---

## How to use this document

1. Read the full spec ([`startupverse-projects-plan.md`](./startupverse-projects-plan.md)) once before Phase 0.
2. Complete **Phase 0** and verify exit criteria before any Projects work.
3. Check off steps as they ship. Do not skip ahead within a phase.
4. After backend route changes, update [`server/API_PARITY_MATRIX.md`](../server/API_PARITY_MATRIX.md).
5. Keep the alignment gate green: `cd server && npm run test:alignment-gate`.
6. After client API path changes: from `server/`, run `npm run export:client-api-call-catalog` and `npm run export:client-api-inventory`.

---

## Repo alignment (spec vs reality)

The spec is correct on behaviour; these are **implementation path** adjustments for this codebase:

| Spec says | Repo reality |
|-----------|--------------|
| Register routes in `App.jsx` | Dashboard shell uses [`client/src/app/dashboardPaths.js`](../client/src/app/dashboardPaths.js) (`PATH_TO_PAGE`, `DASHBOARD_ROUTE_PATHS`, `dashboardStateToPath`) + routes in [`client/src/App.jsx`](../client/src/App.jsx) + page switch in [`client/src/components/DashboardHybrid.jsx`](../client/src/components/DashboardHybrid.jsx) |
| Sidebar in `Sidebar.jsx` with Tabler icons | Founder nav is [`client/src/components/layout/VerticalSidebar.jsx`](../client/src/components/layout/VerticalSidebar.jsx) — uses **Lucide** icons; add Projects between Office and Browse |
| `syncMilestoneCounters` in utils | Today it is a **local function** inside [`server/src/controllers/founders.controller.js`](../server/src/controllers/founders.controller.js) (lines ~59–64). Phase 0 extracts it so team-member updates can call it |
| `founderGuard` middleware | Pattern is inline `founderGuard(req, founderId)` in controllers — match existing [`founders.controller.js`](../server/src/controllers/founders.controller.js) |
| Zustand + `apiClient` | Match [`client/src/state/useWeeklyLoopStore.js`](../client/src/state/useWeeklyLoopStore.js) — no TanStack Query |
| Kanban DnD | Reuse HTML5 drag-drop from [`client/src/components/office/TaskManagementPanel.jsx`](../client/src/components/office/TaskManagementPanel.jsx) |

---

## Progress overview

| Phase | Name | Steps | Status |
|-------|------|-------|--------|
| **0** | Pre-flight bug fixes | 0.1–0.4 | ⬜ Not started |
| **1** | Data layer | 1.1–1.6 | ⬜ Blocked on Phase 0 |
| **2** | Backend API | 2.1–2.6 | ⬜ |
| **3** | Frontend state | 3.1–3.2 | ⬜ |
| **4** | UI | 4.1–4.10 | ⬜ |
| **5** | Polish | 5.1–5.4 | ⬜ |

---

## Phase 0 — Pre-flight bug fixes (do first)

> **Spec ref:** §4.5 (bugs bundled with Projects work).  
> **Why first:** Milestone counters, execution score, and realtime task sync must be correct before project-scoped counters and Kanban boards depend on them.

### 0.1 — Extract `syncMilestoneCounters` to shared util

**Prerequisite for 0.2 and Phase 1.**

| | |
|---|---|
| **Create** | `server/src/utils/syncMilestoneCounters.js` |
| **Update** | `server/src/controllers/founders.controller.js` — import and remove local copy |

**Implementation:**
- Move the existing helper (uses `Task.find`, `computeMilestoneCounters` from [`server/src/domain/weeklyLoopRules.js`](../server/src/domain/weeklyLoopRules.js), `Milestone.findByIdAndUpdate`).
- Export `syncMilestoneCounters(milestoneId)` — **no** project-counter logic yet (that comes in Phase 1.6).

**Verify:**
- Founder task create/update/delete still updates milestone `totalTasks` / `tasksCompleted`.
- No behaviour change; only relocation.

**Commit:** `fix: extract syncMilestoneCounters to shared util`

---

### 0.2 — Bug: team member task updates skip milestone counter sync

**Spec bug 1**

| | |
|---|---|
| **File** | `server/src/controllers/teamMembers.controller.js` → `updateTask` |
| **After** | `findOneAndUpdate` succeeds (~line 92) |

**Implementation:**
```javascript
import { syncMilestoneCounters } from "../utils/syncMilestoneCounters.js";
// ...
if (task.milestoneId) {
  await syncMilestoneCounters(task.milestoneId);
}
```

**Verify:**
- Team member marks assigned task `completed` via team-member API.
- Parent milestone `tasksCompleted` increments (check Mongo or founder GET milestones).

**Commit:** `fix: sync milestone counters after team member task update`

---

### 0.3 — Bug: execution score double-wrapped arguments

**Spec bug 2**

| | |
|---|---|
| **File** | `server/src/controllers/founders.controller.js` |
| **Broken** | `getExecutionData` (~line 1818), `getStartupSnapshot` (~line 1852) |
| **Correct pattern** | Already used in home snapshot path (~line 1365): `computeExecutionScoreMetrics(tasks, outcomes)` |

**Implementation:**
```javascript
// Wrong:
computeExecutionScoreMetrics({ tasks, outcomes })
// Correct:
computeExecutionScoreMetrics(tasks, outcomes)
```

**Verify:**
- `GET /api/v1/founders/:founderId/execution-data` returns sensible `metrics.executionScore` (not always 0 from empty task list parsing).
- `GET /api/v1/startups/:founderId/snapshot` → `executionScore` matches task/outcome data.

**Commit:** `fix: execution score metrics argument shape in execution-data and snapshot`

---

### 0.4 — Bug: `deleteTask` missing realtime emit

**Spec bug 3**

| | |
|---|---|
| **File** | `server/src/controllers/founders.controller.js` → `deleteTask` (~lines 731–751) |
| **Pattern** | Match `updateTask` paths: `emitRealtime(SOCKET_EVENTS.TASK_UPDATED, …)` or add `TASK_DELETED` |

**Implementation:**
- After successful delete + `syncMilestoneCounters`, emit to `startupRoom(deleted.startupId)`.
- Prefer **`task:updated`** with a deleted payload shape clients already handle, **or** add `TASK_DELETED: "task:deleted"` to [`server/src/realtime/events.js`](../server/src/realtime/events.js) and emit `{ taskId, milestoneId, deleted: true }`.
- Ensure Office [`TaskManagementPanel.jsx`](../client/src/components/office/TaskManagementPanel.jsx) / [`useOfficeStore.js`](../client/src/state/useOfficeStore.js) remove the task on either event (check existing socket listeners).

**Verify:**
- Founder deletes task from dashboard; Office Kanban removes card without refresh (two browser tabs).

**Commit:** `fix: emit realtime event when founder deletes task`

---

### Phase 0 exit criteria

- [ ] All four steps committed on a dedicated branch (e.g. `fix/weekly-loop-counter-and-realtime`).
- [ ] `cd server && npm run test:alignment-gate` passes.
- [ ] Manual smoke: team member completes task → milestone count updates; execution score non-zero when tasks exist; delete task updates Office live.
- [ ] **Merge Phase 0 before starting Phase 1.**

---

## Phase 1 — Data layer (no UI)

> **Spec ref:** §3, §11 Phase 1 (steps 1–6; bugs moved to Phase 0).

### 1.1 — Create `Project` model

| | |
|---|---|
| **Create** | `server/src/models/Project.js` |
| **Spec** | §3.1 — full schema, compound indexes `{ startupId, slug }` unique |

**Verify:** Model loads; `mongoose.model` does not conflict on hot reload.

**Commit:** `feat(projects): add Project mongoose model`

---

### 1.2 — Extend `Task` model

| | |
|---|---|
| **Update** | `server/src/models/Task.js` |

**Add fields:** `projectId`, `githubIssueId` (sparse index), `githubIssueUrl` — all optional / `default: null`.

**Commit:** `feat(projects): add projectId and GitHub fields to Task`

---

### 1.3 — Extend `Milestone` model

| | |
|---|---|
| **Update** | `server/src/models/Milestone.js` |

**Add:** `projectId` (optional). **Tighten:** `status` enum `pending | in-progress | completed | blocked` (spec §3.2).

**Commit:** `feat(projects): add projectId and status enum to Milestone`

---

### 1.4 — Update enums

| | |
|---|---|
| **Update** | `server/src/utils/enums.js` |

**Add:** `PROJECT_STATUSES`, `PROJECT_PRIORITIES`, `PROJECT_MEMBER_ROLES`, `MILESTONE_STATUSES`.

**Commit:** `feat(projects): add project and milestone status enums`

---

### 1.5 — Create `syncProjectCounters` helper

| | |
|---|---|
| **Create** | `server/src/utils/syncProjectCounters.js` |

**Spec:** §3.3 — recount milestones/tasks by `projectId`, update denormalised fields on `Project`.

**Commit:** `feat(projects): add syncProjectCounters helper`

---

### 1.6 — Enhance `syncMilestoneCounters` (status + project bubble-up)

| | |
|---|---|
| **Update** | `server/src/utils/syncMilestoneCounters.js` |

**Spec:** §3.4 — after counter update, set milestone `status` from task completion; if `milestone.projectId`, call `syncProjectCounters`.

**Also update:** Every existing call site in `founders.controller.js` (no behaviour regression for non-project milestones).

**Commit:** `feat(projects): auto-set milestone status and sync project counters`

---

### Phase 1 exit criteria

- [ ] Existing milestones/tasks without `projectId` unchanged in DB.
- [ ] Creating/completing tasks still updates milestone counters and status.
- [ ] Alignment gate passes.

---

## Phase 2 — Backend API

> **Spec ref:** §4, §9, §11 Phase 2.

### 2.1 — Projects controller

| | |
|---|---|
| **Create** | `server/src/controllers/projects.controller.js` |

**Handlers (spec §4.2):** `createProject`, `listProjects`, `getProject`, `updateProject`, `archiveProject`, `addMember`, `removeMember`, `connectGithub`, `syncGithub`, `getProjectMilestones`, `getProjectTasks`.

**Shared helpers:** slug generation (§2), `Startup.findOne({ founderId })` for `startupId`, founder as `owner` member on create.

**Commit:** `feat(projects): add projects controller`

---

### 2.2 — Projects routes

| | |
|---|---|
| **Create** | `server/src/routes/projects.routes.js` |
| **Register** | [`server/src/routes/index.js`](../server/src/routes/index.js) |

**Routes (spec §4.1):** all under `/founders/:founderId/projects…` with `requireAuth` + `asyncHandler`.

**Commit:** `feat(projects): register projects API routes`

---

### 2.3 — GitHub sync service

| | |
|---|---|
| **Create** | `server/src/services/githubSyncService.js` |
| **Env** | `GITHUB_TOKEN` in `.env.example` (spec §12) |

**Commit:** `feat(projects): add GitHub issue sync service`

---

### 2.4 — Weekly plan `projectId` passthrough

| | |
|---|---|
| **Update** | `server/src/controllers/founders.controller.js` → `createWeeklyPlan` (~lines 1187–1220) |
| **Update** | `createMilestone` handler (if separate) — business rule: milestone must have `projectId` and/or `weeklyOutcomeId` |

**Pass `plan.projectId`** into `Milestone.create` and `Task.create` when present.

**Client payload (Phase 3):** [`client/src/domains/founder/mappers/weeklyPlanPayload.js`](../client/src/domains/founder/mappers/weeklyPlanPayload.js).

**Commit:** `feat(projects): attach projectId in weekly plan and milestone creation`

---

### 2.5 — Realtime project events

| | |
|---|---|
| **Update** | `server/src/realtime/events.js` — add `PROJECT_CREATED`, `PROJECT_UPDATED`, `PROJECT_ARCHIVED`, `PROJECT_SYNCED` |
| **Update** | `projects.controller.js` — emit to `startupRoom(startupId)` on success |

**Commit:** `feat(projects): add project realtime socket events`

---

### 2.6 — API parity matrix

| | |
|---|---|
| **Update** | `server/API_PARITY_MATRIX.md` |

Document all new `/founders/:founderId/projects` routes.

**Commit:** `docs: add projects routes to API parity matrix`

---

### Phase 2 exit criteria

- [ ] Postman/curl: create → list → get → update → archive project.
- [ ] Create milestone/task with `projectId`; counters update on `Project`.
- [ ] `POST …/github/sync` works when `GITHUB_TOKEN` set (or returns clear error).
- [ ] Alignment gate passes.

---

## Phase 3 — Frontend state

> **Spec ref:** §5, §11 Phase 3.

### 3.1 — `useProjectStore`

| | |
|---|---|
| **Create** | `client/src/state/useProjectStore.js` |
| **Create** | `client/src/domains/founder/mappers/projectMapper.js` (optional but spec §7) |
| **Create** | `client/src/utils/api/projectApi.js` — thin wrappers over `apiGet`/`apiPost`/etc. |

Mirror [`useWeeklyLoopStore.js`](../client/src/state/useWeeklyLoopStore.js): `load`, `setActiveProject`, CRUD, members, GitHub, milestones, tasks, `patchTask`, `refresh`, socket hooks (spec §5.3).

**Commit:** `feat(projects): add useProjectStore and project API module`

---

### 3.2 — Weekly loop store `projectId`

| | |
|---|---|
| **Update** | `client/src/state/useWeeklyLoopStore.js` → `saveWeeklyPlan` |
| **Update** | `client/src/domains/founder/mappers/weeklyPlanPayload.js` — include optional `projectId` |

**Commit:** `feat(projects): pass projectId through weekly plan save`

---

### Phase 3 exit criteria

- [ ] Store loads projects in devtools / temporary test button.
- [ ] Weekly plan POST body includes `projectId` when set.
- [ ] Client build passes.

---

## Phase 4 — UI

> **Spec ref:** §6–§8, §11 Phase 4. Build in this order.

### 4.1 — Sidebar nav item

| | |
|---|---|
| **Update** | `client/src/components/layout/VerticalSidebar.jsx` |

Insert **Projects** between Office and Browse (founder + team-member roles). Lucide: `LayoutKanban` or `FolderKanban`. Active when path starts with `/projects`.

**Commit:** `feat(projects): add Projects to sidebar navigation`

---

### 4.2 — Dashboard routing

| | |
|---|---|
| **Update** | `client/src/app/dashboardPaths.js` — `/projects`, `/projects/:slug`, `/projects/:slug/milestones`, `/projects/:slug/settings` |
| **Update** | `client/src/App.jsx` — add to `DASHBOARD_ROUTE_PATHS` |
| **Update** | `client/src/components/DashboardHybrid.jsx` — lazy-load project pages, `case` in render switch |

**Commit:** `feat(projects): register projects dashboard routes`

---

### 4.3 — Projects list page

| | |
|---|---|
| **Create** | `client/src/components/projects/ProjectsPage.jsx` |
| **Create** | `client/src/components/projects/ProjectCard.jsx` |

Spec §6.2: header, filters, grid, empty state.

**Commit:** `feat(projects): add projects list page`

---

### 4.4 — Create project modal

| | |
|---|---|
| **Create** | `client/src/components/projects/CreateProjectModal.jsx` |

Spec §6.3: Radix Dialog, live slug preview, optional GitHub collapsible.

**Commit:** `feat(projects): add create project modal`

---

### 4.5 — Project detail shell

| | |
|---|---|
| **Create** | `client/src/components/projects/ProjectDetailPage.jsx` |
| **Create** | `client/src/components/projects/ProjectHeaderBar.jsx` |

Spec §6.4: header, tabs (Board / Milestones / Settings), `setActiveProject(slug)` on mount.

**Commit:** `feat(projects): add project detail page shell`

---

### 4.6 — Board view (Kanban)

| | |
|---|---|
| **Create** | `client/src/components/projects/views/ProjectBoardView.jsx` |
| **Create** | `ProjectBoardColumn.jsx`, `ProjectBoardTaskCard.jsx` |

Spec §6.5: four columns, DnD, quick-add, task slide-over (reuse Office task panel pattern).

**Commit:** `feat(projects): add project board kanban view`

---

### 4.7 — Milestones view

| | |
|---|---|
| **Create** | `ProjectMilestonesView.jsx`, `MilestoneRow.jsx`, `MilestoneTaskRow.jsx` |

Spec §6.6: expandable list, inline add milestone/task.

**Commit:** `feat(projects): add project milestones view`

---

### 4.8 — Settings view

| | |
|---|---|
| **Create** | `client/src/components/projects/views/ProjectSettingsView.jsx` |

Spec §6.7: General, Team, GitHub, Danger zone.

**Commit:** `feat(projects): add project settings view`

---

### 4.9 — Home weekly loop integration

| | |
|---|---|
| **Update** | `client/src/components/execution-engine/OutcomeSelectionModal.jsx` |
| **Update** | `client/src/components/execution-engine/IntentCaptureModal.jsx` (if part of flow) |
| **Update** | Founder Home “This week’s focus” — project chip (spec §6.8) |

**Commit:** `feat(projects): project selector in weekly goal flow`

---

### 4.10 — Office tasks project filter

| | |
|---|---|
| **Update** | `client/src/components/office/TaskManagementPanel.jsx` (or Office tasks filter bar) |

Spec §6.9: `[All projects ▼]` filters `localTasks` by `projectId` client-side.

**Commit:** `feat(projects): add project filter to office tasks tab`

---

### Phase 4 exit criteria

- [ ] Founder can create project → land on board → add task → drag columns.
- [ ] Milestones view CRUD works.
- [ ] Settings: edit name, add member, archive.
- [ ] Weekly goal flow: pick project → plan saves with `projectId`.
- [ ] Office filter narrows tasks by project.
- [ ] `npm run build` (client) passes.

---

## Phase 5 — Polish

> **Spec ref:** §11 Phase 5.

### 5.1 — Empty, loading, and error states

All project views: match existing skeleton components (grep `Skeleton` in client).

**Commit:** `feat(projects): add loading and error states to project views`

---

### 5.2 — Mobile responsiveness

Projects list grid → single column; board horizontal scroll or stacked columns on small screens.

**Commit:** `feat(projects): improve mobile layout for project views`

---

### 5.3 — Chat @mentions for projects

| | |
|---|---|
| **Update** | `GET /startups/:startupId/chat-mentionables` in [`server/src/routes/messages.routes.js`](../server/src/routes/messages.routes.js) |
| **Update** | Chat mention picker UI if needed |

Include active projects in mentionables list.

**Commit:** `feat(projects): include projects in chat mentionables`

---

### 5.4 — Manual QA pass

Use checklist derived from spec §6 + Phase 4 exit criteria. Test realtime with two tabs. Test team-member task update → project board reflects change.

**Commit:** _(none — QA only)_

---

## Phase 5 / feature exit criteria

- [ ] All phases complete.
- [ ] Alignment gate green.
- [ ] No regressions: weekly loop without project (`projectId: null`) works as before.
- [ ] Backward compatibility table (spec §10) verified.
- [ ] Deferred items (spec §13) **not** built: Roadmap, templates, activity feed, public URLs, GitHub App OAuth.

---

## Deferred (do not build in this pass)

Per spec §13:

- Roadmap / Gantt view
- Project templates
- Project comments / activity feed
- GitHub App (OAuth) — PAT only
- Public URL `startupverse.space/:startupSlug/:projectSlug`
- Cross-project milestone dependencies
- Project analytics dashboard

---

## Quick reference — new files

```
server/src/
  models/Project.js
  controllers/projects.controller.js
  routes/projects.routes.js
  services/githubSyncService.js
  utils/syncProjectCounters.js
  utils/syncMilestoneCounters.js          ← extracted Phase 0.1

client/src/
  state/useProjectStore.js
  utils/api/projectApi.js
  domains/founder/mappers/projectMapper.js
  components/projects/
    ProjectsPage.jsx
    CreateProjectModal.jsx
    ProjectDetailPage.jsx
    ProjectCard.jsx
    ProjectHeaderBar.jsx
    views/
      ProjectBoardView.jsx
      ProjectBoardColumn.jsx
      ProjectBoardTaskCard.jsx
      ProjectMilestonesView.jsx
      MilestoneRow.jsx
      MilestoneTaskRow.jsx
      ProjectSettingsView.jsx
```

---

## Spec crosswalk (§11 → this plan)

| Spec §11 step | This plan |
|---------------|-----------|
| 1–6 Data layer | Phase 1 |
| 7–9 Bug fixes | **Phase 0** (before Phase 1) |
| 10–15 Backend API | Phase 2 |
| 16–17 Frontend state | Phase 3 |
| 18–27 UI | Phase 4 |
| 28–32 Polish | Phase 5 |
