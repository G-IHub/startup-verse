# StartupVerse — Projects Feature: Implementation Plan

> **Purpose of this document:** A complete, implementation-ready specification for the Projects feature. Read every section before writing a single line of code. The ordering in Section 11 is the build sequence — follow it exactly.

---

## 1. Vision & Mental Model

### What changes

Today, the **weekly outcome** is the primary execution container. A founder sets a weekly goal, creates milestones under it, and tasks under those milestones. The week ends, it resets. There is no persistent home for a body of work that spans multiple weeks.

After this feature, the **Project** becomes the primary container. A project represents a real startup initiative — "Build the MVP", "Q3 Fundraising Push", "Launch Marketing Site", "Hire First Engineer". Milestones live inside a project and represent meaningful checkpoints. Tasks live under milestones. The weekly loop (WeeklyOutcome) still exists but now acts as a **sprint/cycle** — a time-boxed focus window inside a project, not a standalone container.

**In one sentence:** Projects give startup work a persistent identity. The weekly loop gives it weekly momentum.

### The hierarchy

```
Startup
  └── Project (new — the persistent initiative)
        ├── Milestone (checkpoint — no longer weekly-only)
        │     └── Task (unit of work)
        └── WeeklyOutcome (weekly sprint scoped to this project)
              └── Milestone (a milestone planned for this week)
```

### How Linear and ClickUp map to StartupVerse

| Linear concept | ClickUp concept | StartupVerse equivalent |
|---|---|---|
| Project | Space/Folder | Project |
| Issue | Task | Task |
| Milestone | Milestone | Milestone |
| Cycle | Sprint | WeeklyOutcome (weekly cycle) |
| Identifier (TES-40) | Task ID | Already exists in tabs — extend to projects |
| Status | Status | Existing TASK_STATUSES enum |
| Board view | Board view | Project Board tab |
| Backlog | List view | Project Milestones tab |
| — | Roadmap | Project Roadmap tab (phase 2) |

### What makes it startup-specific (not just a Linear clone)

1. **Projects tie to startup stage** — a project can be tagged to the founder's current startup stage (Idea / MVP / Launch / Growth etc.)
2. **Weekly cycle is built in** — every project has a "This week" view that bridges to the existing WeeklyOutcome flow on Home
3. **GitHub sync is an optional power feature** — not mandatory, not front-and-center
4. **Team assignment is native** — tasks can be assigned to team members from inside a project
5. **Execution score is project-aware** — the existing execution score should reflect project progress, not just weekly completion

---

## 2. URL & Routing Structure

### Slug format

Every project has a human-readable slug derived from the project name, scoped to the startup:

```
/projects                              → Projects list (all projects for this startup)
/projects/:projectSlug                 → Project detail (default: Board view)
/projects/:projectSlug/milestones      → Milestones view
/projects/:projectSlug/settings        → Project settings
```

The **public-facing URL** (for sharing/inviting) would eventually be:
```
startupverse.space/:startupSlug/:projectSlug
```
But for the SPA router in this implementation, use `/projects/:projectSlug`. The `startupSlug` is stored on the Project model for future use.

**Slug generation rule (server-side):**
```javascript
// "Build the MVP v2" → "build-the-mvp-v2"
const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
```
Enforce uniqueness within the startup: if slug exists, append `-2`, `-3`, etc.

### Navigation placement

Add "Projects" to the sidebar **between Office and Browse**:

```
Home
Office
Projects   ← NEW (icon: ti-layout-kanban or ti-folders)
Browse
Chat
───────────
Inbox
Analytics
Settings
```

---

## 3. Data Model

### 3.1 New model: `server/src/models/Project.js`

```javascript
import mongoose from 'mongoose';
const { Schema } = mongoose;

const projectMemberSchema = new Schema({
  userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role:     { type: String, enum: ['owner', 'member', 'viewer'], default: 'member' },
  addedAt:  { type: Date, default: Date.now },
}, { _id: false });

const githubRepoSchema = new Schema({
  owner:          { type: String, default: '' },
  repo:           { type: String, default: '' },
  syncEnabled:    { type: Boolean, default: false },
  lastSyncedAt:   { type: Date, default: null },
}, { _id: false });

const projectSchema = new Schema({
  // Anchors
  startupId:   { type: Schema.Types.ObjectId, ref: 'Startup', required: true, index: true },
  founderId:   { type: Schema.Types.ObjectId, ref: 'User',    required: true, index: true },

  // Identity
  name:        { type: String, required: true, trim: true, minlength: 2, maxlength: 200 },
  slug:        { type: String, required: true, trim: true, lowercase: true, maxlength: 220 },
  description: { type: String, default: '', maxlength: 5000 },
  color:       { type: String, default: '#1A56DB' }, // hex color for project label

  // Status & classification
  status:      { type: String, enum: ['active', 'paused', 'completed', 'archived'], default: 'active', index: true },
  priority:    { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  startupStage:{ type: String, default: '' }, // mirrors Startup stage tag (optional)

  // Dates
  startDate:   { type: Date, default: null },
  dueDate:     { type: Date, default: null },

  // Visibility
  visibility:  { type: String, enum: ['private', 'team'], default: 'team' },

  // GitHub integration
  githubRepo:  { type: githubRepoSchema, default: () => ({}) },

  // Team
  members:     [projectMemberSchema],

  // Denormalised counters (kept in sync by syncProjectCounters helper)
  totalMilestones:     { type: Number, default: 0, min: 0 },
  completedMilestones: { type: Number, default: 0, min: 0 },
  totalTasks:          { type: Number, default: 0, min: 0 },
  completedTasks:      { type: Number, default: 0, min: 0 },
}, { timestamps: true });

// Compound indexes
projectSchema.index({ startupId, slug }, { unique: true });
projectSchema.index({ startupId, status });
projectSchema.index({ founderId, status });
```

### 3.2 Migrations to existing models (additive — nothing breaks)

#### `server/src/models/Milestone.js` — add these fields:

```javascript
projectId: { type: Schema.Types.ObjectId, ref: 'Project', index: true, default: null },
// Replace the untyped status string with a proper enum:
status: {
  type: String,
  enum: ['pending', 'in-progress', 'completed', 'blocked'],
  default: 'pending',
  index: true,
},
```

> **Note:** `status` already exists on Milestone but has no enum. Adding the enum is safe because all existing values are already `"pending"` (the default) or were set to valid strings. Mongoose will reject future invalid writes without touching stored documents.

#### `server/src/models/Task.js` — add these fields:

```javascript
projectId:      { type: Schema.Types.ObjectId, ref: 'Project', index: true, default: null },
githubIssueId:  { type: String, default: null, index: true, sparse: true },
githubIssueUrl: { type: String, default: '' },
```

#### `server/src/utils/enums.js` — add:

```javascript
export const PROJECT_STATUSES      = ['active', 'paused', 'completed', 'archived'];
export const PROJECT_PRIORITIES    = ['low', 'medium', 'high'];
export const PROJECT_MEMBER_ROLES  = ['owner', 'member', 'viewer'];
export const MILESTONE_STATUSES    = ['pending', 'in-progress', 'completed', 'blocked'];
```

### 3.3 New helper: `server/src/utils/syncProjectCounters.js`

```javascript
// Recount milestones and tasks for a project and update denormalised counters.
// Call after any milestone or task create/update/delete that affects a project.
export async function syncProjectCounters(projectId) {
  if (!projectId) return;
  const [milestones, tasks] = await Promise.all([
    Milestone.find({ projectId }),
    Task.find({ projectId }),
  ]);
  const totalMilestones     = milestones.length;
  const completedMilestones = milestones.filter(m => m.status === 'completed').length;
  const totalTasks          = tasks.length;
  const completedTasks      = tasks.filter(t => t.status === 'completed').length;
  await Project.findByIdAndUpdate(projectId, {
    totalMilestones,
    completedMilestones,
    totalTasks,
    completedTasks,
  });
}
```

### 3.4 Fix existing `syncMilestoneCounters` to also set milestone status

In the existing `syncMilestoneCounters` helper, after updating `totalTasks`/`tasksCompleted`, also compute and set `status`:

```javascript
const newStatus =
  totalTasks === 0           ? 'pending'
  : tasksCompleted >= totalTasks ? 'completed'
  : tasksCompleted > 0           ? 'in-progress'
  :                               'pending';

await Milestone.findByIdAndUpdate(milestoneId, {
  totalTasks,
  tasksCompleted,
  status: newStatus,
});

// If this milestone has a projectId, sync project counters too
const milestone = await Milestone.findById(milestoneId);
if (milestone?.projectId) {
  await syncProjectCounters(milestone.projectId);
}
```

---

## 4. Backend API

### 4.1 New router: `server/src/routes/projects.routes.js`

Mount at `/api/v1` alongside existing routes.

```
GET    /founders/:founderId/projects
POST   /founders/:founderId/projects
GET    /founders/:founderId/projects/:projectSlug
PUT    /founders/:founderId/projects/:projectSlug
DELETE /founders/:founderId/projects/:projectSlug          (sets status: 'archived')
POST   /founders/:founderId/projects/:projectSlug/members
DELETE /founders/:founderId/projects/:projectSlug/members/:userId
PUT    /founders/:founderId/projects/:projectSlug/github
POST   /founders/:founderId/projects/:projectSlug/github/sync
GET    /founders/:founderId/projects/:projectSlug/milestones
GET    /founders/:founderId/projects/:projectSlug/tasks
```

All routes use the existing `founderGuard(req, founderId)` middleware.

### 4.2 Controller: `server/src/controllers/projects.controller.js`

#### `createProject`
- Validate: `name` required, 2–200 chars
- Generate `slug` from name, enforce uniqueness within `startupId`
- Resolve `startupId` from `Startup.findOne({ founderId })` if not provided in body
- Add the creating founder as a member with `role: 'owner'`
- Return the created project

#### `listProjects`
- `Project.find({ founderId, status: { $ne: 'archived' } }).sort({ updatedAt: -1 })`
- Optionally accept `?status=active|paused|completed|archived` query param

#### `getProject`
- Find by `{ startupId, slug: projectSlug }`
- Populate member `userId` with `name`, `avatar`, `email`
- Return with live milestone/task counts (don't rely solely on denormalised counters here)

#### `updateProject`
- Allowed fields: `name`, `description`, `status`, `priority`, `startDate`, `dueDate`, `visibility`, `color`
- If `name` changes, regenerate and re-validate slug
- Call `syncProjectCounters` after save

#### `archiveProject`
- Set `status: 'archived'` only — never delete
- Do NOT delete milestones or tasks

#### `addMember` / `removeMember`
- Validate `userId` exists and belongs to same startup's team
- Prevent removing the last `owner`

#### `connectGithub`
- Update `githubRepo` sub-doc fields
- Return updated project

#### `syncGithub`
- Call `githubSyncService.syncProjectIssues(project)`
- Return `{ created, updated, total, lastSyncedAt }`

#### `getProjectMilestones`
- `Milestone.find({ projectId }).populate('tasks').sort({ sequence: 1 })`
- Include task counts per milestone

#### `getProjectTasks`
- `Task.find({ projectId }).sort({ createdAt: -1 })`
- Accept `?status=`, `?milestoneId=`, `?assignedTo=` filters

### 4.3 GitHub sync service: `server/src/services/githubSyncService.js`

```javascript
export async function syncProjectIssues(project) {
  const { owner, repo } = project.githubRepo;
  if (!owner || !repo) throw new Error('GitHub repo not configured');

  // Fetch open issues (paginate if needed, max 100 for now)
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=100`,
    { headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, 'X-GitHub-Api-Version': '2022-11-28' } }
  );
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const issues = await res.json();

  let created = 0, updated = 0;

  for (const issue of issues) {
    // Skip pull requests (GitHub API returns PRs in issues endpoint)
    if (issue.pull_request) continue;

    const githubIssueId = String(issue.number);
    const existing = await Task.findOne({ projectId: project._id, githubIssueId });

    const priorityLabel = issue.labels?.find(l => l.name.startsWith('priority:'))?.name.split(':')[1];
    const priority = ['low', 'medium', 'high'].includes(priorityLabel) ? priorityLabel : 'medium';

    const payload = {
      title:         issue.title.slice(0, 200),
      description:   (issue.body || '').slice(0, 5000),
      status:        issue.state === 'closed' ? 'completed' : 'pending',
      githubIssueUrl: issue.html_url,
      priority,
    };

    if (existing) {
      await Task.findByIdAndUpdate(existing._id, payload);
      updated++;
    } else {
      await Task.create({
        ...payload,
        founderId:     project.founderId,
        startupId:     project.startupId,
        projectId:     project._id,
        githubIssueId,
      });
      created++;
    }
  }

  await Project.findByIdAndUpdate(project._id, { 'githubRepo.lastSyncedAt': new Date() });
  await syncProjectCounters(project._id);

  return { created, updated, total: issues.length };
}
```

**Environment variable required:** `GITHUB_TOKEN` (personal access token with `repo` scope). Add to `.env` and document in `.env.example`.

### 4.4 Existing route change: weekly plan creation

In `createWeeklyPlan` controller, add optional `projectId` to the milestone and task creation:

```javascript
// If projectId is present in the plan payload, attach it to created milestones and tasks
const projectId = plan.projectId || null;
// Pass projectId when creating Milestone and Task documents
```

Also update `createMilestone` to require either a `projectId` or to validate that `weeklyOutcomeId` is provided. The business rule: **a milestone must belong to either a project, a weekly outcome, or both**.

### 4.5 Bug fixes (do in same pass)

**Bug 1 — Team member counter sync:**  
In `teamMembers.controller.js`, after updating a task, call `syncMilestoneCounters(task.milestoneId)`. Currently missing.

**Bug 2 — Execution score double-wrapping:**  
In `getExecutionData` and `getStartupSnapshot`, fix:
```javascript
// Wrong:
computeExecutionScoreMetrics({ tasks, outcomes })
// Correct:
computeExecutionScoreMetrics(tasks, outcomes)
```

**Bug 3 — deleteTask has no realtime emit:**  
After deleting a task, emit `task:updated` (or `task:deleted`) to the startup room so Kanban boards update live.

---

## 5. Frontend State Management

### 5.1 New store: `client/src/state/useProjectStore.js`

Follow the exact same Zustand pattern as `useWeeklyLoopStore.js`. No TanStack Query.

```javascript
const useProjectStore = create((set, get) => ({
  founderId: null,
  projects: [],
  activeProject: null,
  projectMilestones: [],
  projectTasks: [],
  loading: false,
  refreshing: false,
  error: null,
  lastLoadedAt: null,

  // Load all projects for a founder
  async load(founderId) { ... },

  // Set the active project and load its milestones + tasks
  async setActiveProject(projectSlug) { ... },

  // CRUD
  async createProject(data) { ... },
  async updateProject(slug, data) { ... },
  async archiveProject(slug) { ... },

  // Members
  async addMember(slug, { userId, role }) { ... },
  async removeMember(slug, userId) { ... },

  // GitHub
  async connectGithub(slug, { owner, repo, syncEnabled }) { ... },
  async triggerGithubSync(slug) { ... },

  // Milestones within a project
  async createMilestone(projectSlug, data) { ... },
  async updateMilestone(projectSlug, milestoneId, data) { ... },
  async deleteMilestone(projectSlug, milestoneId) { ... },

  // Tasks within a project
  async createTask(projectSlug, data) { ... },
  async updateTaskStatus(taskId, status, blockerPayload) { ... },

  // Realtime patch (called from socket listener)
  patchTask(taskId, updates) {
    set(s => ({
      projectTasks: s.projectTasks.map(t => t._id === taskId ? { ...t, ...updates } : t),
    }));
  },

  async refresh() { ... },
}));
```

### 5.2 Updates to `useWeeklyLoopStore.js`

- `saveWeeklyPlan(plan)` — accept optional `projectId` in `plan` payload and pass it through to the API
- No structural changes, no regressions

### 5.3 Realtime subscription

In `useProjectStore`, after loading a project, subscribe to the existing `startup:{startupId}` Socket.IO room and listen for:
- `task:updated` → `patchTask`
- `project:updated` → patch `activeProject` in store
- `project:synced` → refresh `projectTasks` (after GitHub sync)

---

## 6. UI Specification

### Design language (match existing app exactly)

| Token | Value |
|---|---|
| Primary blue | `#1A56DB` |
| Navy | `#0F2044` |
| Teal accent | `#0D9488` |
| Background | `#FFFFFF` (main), `#F9FAFB` (surface) |
| Border | `#E5E7EB` |
| Text primary | `#111928` |
| Text secondary | `#6B7280` |
| Font (body) | DM Sans |
| Font (headings) | Syne |
| Border radius (cards) | `12px` |
| Border radius (buttons) | `8px` |
| Sidebar active bg | `rgba(26, 86, 219, 0.08)` |
| Sidebar active text | `#1A56DB` |

Status colors for project/milestone badges:

| Status | Background | Text |
|---|---|---|
| active | `#EFF6FF` | `#1D4ED8` |
| paused | `#FFFBEB` | `#B45309` |
| completed | `#F0FDF4` | `#166534` |
| archived | `#F3F4F6` | `#6B7280` |
| in-progress | `#EEF2FF` | `#4338CA` |
| blocked | `#FFF1F2` | `#BE123C` |

---

### 6.1 Sidebar update

**File:** wherever the sidebar nav items are defined (likely `Sidebar.jsx` or the nav component)

Add between Office and Browse:

```jsx
{
  label: 'Projects',
  path: '/projects',
  icon: 'ti-layout-kanban',   // Tabler icon
}
```

Active state: highlight when pathname starts with `/projects`.

---

### 6.2 Projects list page — `/projects`

**File:** `client/src/components/projects/ProjectsPage.jsx`

**Layout:** Full-width page, consistent with Home and Office pages.

#### Header

```
┌─────────────────────────────────────────────────────────────────┐
│  Projects                               [+ New project]         │
│  3 active · 1 paused                                            │
└─────────────────────────────────────────────────────────────────┘
```

- Heading: Syne font, 24px, `#111928`
- Subtitle: count of active/paused projects
- "+ New project" button: filled blue (`#1A56DB`), ti-plus icon

#### Filter bar (below header)

```
[All] [Active] [Paused] [Completed]     🔍 Search projects...
```

Pill-style tab filters. Search filters by project name client-side.

#### Project cards grid

Two-column grid on desktop, single column on mobile. Each card:

```
┌────────────────────────────────────────────────┐
│  ● Build the MVP              [active]  [···]  │  ← color dot, name, status badge, kebab menu
│  Launch our core product before Q3             │  ← description (truncated, 2 lines)
│                                                │
│  ████████░░░░░░░░  40%  ·  4/10 tasks done    │  ← progress bar + fraction
│                                                │
│  3 milestones  ·  Due Jul 15                   │  ← meta row
│  [YA] [AT]  +2                                 │  ← member avatars
│  github: shopydash/backend  ↻ Synced 2h ago   │  ← github row (if connected)
└────────────────────────────────────────────────┘
```

- Card border: `1px solid #E5E7EB`, radius: `12px`
- Hover: border color transitions to `#1A56DB` with `0.2s ease`
- Click anywhere on card → navigate to `/projects/:slug`
- Kebab menu (···): Edit, Pause, Archive
- Color dot: `8px` circle using `project.color`

#### Empty state

When no projects exist:

```
         [folder icon, large, muted]

         Start your first project

  Projects help you organise startup work into named
  initiatives — like "Build MVP" or "Q3 Fundraising".
  Each project gets its own board, milestones, and timeline.

              [+ Create your first project]
```

---

### 6.3 Create project modal

**File:** `client/src/components/projects/CreateProjectModal.jsx`

Use existing Radix UI Dialog pattern (same as other modals in the app).

**Fields:**

```
Project name *
┌─────────────────────────────────────────┐
│ e.g. Build the MVP                      │
└─────────────────────────────────────────┘
  URL: startupverse.space/shopydash/build-the-mvp  ← live slug preview

Description
┌─────────────────────────────────────────┐
│ What is this project about?             │
│                                         │
└─────────────────────────────────────────┘

Priority              Due date (optional)
[Low] [Medium●] [High]   [Pick a date]

Visibility
[● Team — all team members can see this]
[○ Private — only you]

Color label
[●] [●] [●] [●] [●] [●]   ← 6 preset colors

▼ Connect GitHub (optional, collapsible)
  Owner / org: [          ]
  Repository:  [          ]
```

- Submit button: "Create project"
- On success: navigate to `/projects/:newSlug`
- The slug preview updates live as the user types the name
- Color swatches: `#1A56DB`, `#0D9488`, `#7C3AED`, `#DC2626`, `#D97706`, `#059669`

---

### 6.4 Project detail page — `/projects/:projectSlug`

**File:** `client/src/components/projects/ProjectDetailPage.jsx`

#### Page header (always visible)

```
←  Build the MVP                          [● active]     [Share] [Settings]
   Launch our core product before Q3

   [Board]  [Milestones]  [Settings]
   ─────                                   ← active tab underline (blue)
```

- Back arrow navigates to `/projects`
- Project name: Syne, 22px
- Status badge: pill with appropriate color
- Tabs: same style as Office page tabs (text + underline on active)

---

### 6.5 Tab 1: Board view

**File:** `client/src/components/projects/views/ProjectBoardView.jsx`

A Kanban board. Four columns, fixed:

```
PENDING          IN PROGRESS       COMPLETED        BLOCKED
────────         ───────────       ─────────        ───────

┌──────────┐    ┌──────────┐
│ Task A   │    │ Task C   │
│ Milestone│    │ Milestone│
│ 🔴 High  │    │ 🟡 Med   │
└──────────┘    └──────────┘
┌──────────┐
│ Task B   │
│ No mile. │
│ 🟢 Low   │
└──────────┘

[+ Add task]    [+ Add task]      [+ Add task]     [+ Add task]
```

**Task card design:**

```
┌─────────────────────────────────┐
│ Implement auth flow             │  ← title, 14px, DM Sans
│ ○ Sprint: Build MVP Week 3      │  ← milestone chip (if linked), 12px muted
│                                 │
│ [🔴 High]          [YA avatar]  │  ← priority badge + assignee
└─────────────────────────────────┘
```

- Card width: fills column (columns are equal width, `~23%` each with gaps)
- Drag to move between columns (native HTML5 DnD — same pattern as office TaskManagementPanel)
- On drop: call `updateTaskStatus(taskId, newStatus)` → `useProjectStore`
- Click card → opens Task detail slide-over panel (reuse or extend existing pattern)

**"+ Add task" button** at the bottom of each column opens an inline quick-add form:
```
┌─────────────────────────────────┐
│ Task name...                    │
│ [Milestone ▼]  [Assignee ▼]    │
│                 [Cancel] [Add]  │
└─────────────────────────────────┘
```

**Column headers** show count badges:
```
PENDING  (5)     IN PROGRESS  (3)     COMPLETED  (12)     BLOCKED  (1)
```

---

### 6.6 Tab 2: Milestones view

**File:** `client/src/components/projects/views/ProjectMilestonesView.jsx`

A structured list. Think Linear's "Milestones" page.

```
Milestones                                              [+ Add milestone]

──────────────────────────────────────────────────────────────────────────

▼  Implement core authentication                     [in-progress]  [···]
   Due: Jul 5, 2026  ·  3/5 tasks done
   ████████░░░░░░░░  60%

   ✓  Set up JWT middleware                          [completed]
   ●  Build login endpoint                           [in-progress]    [YA]
   ●  Build registration endpoint                    [pending]
   ○  Add refresh token logic                        [pending]
   ✗  Fix session timeout bug                        [blocked]    ⚠ reason

                                                   [+ Add task to milestone]

──────────────────────────────────────────────────────────────────────────

▶  Design system setup                               [pending]      [···]
   Due: Jul 12, 2026  ·  0/4 tasks done

──────────────────────────────────────────────────────────────────────────

                                                   [+ Add milestone]
```

**Milestone row:**
- Chevron ▼/▶ to expand/collapse tasks
- Title: 15px, DM Sans, 500 weight
- Status badge: right-aligned
- Kebab menu (···): Edit, Mark complete, Delete
- Progress bar: thin (4px), blue fill

**Task row (within expanded milestone):**
- Status icon: ✓ (completed), ● (in-progress), ○ (pending), ✗ (blocked)
- Title: 14px
- Assignee avatar: right-aligned
- Click task → task detail panel

**Add milestone inline form:**

```
┌─────────────────────────────────────────────────────────┐
│ Milestone name...                                       │
│ [Due date]        [Priority ▼]       [Cancel]  [Create] │
└─────────────────────────────────────────────────────────┘
```

---

### 6.7 Tab 3: Settings

**File:** `client/src/components/projects/views/ProjectSettingsView.jsx`

Sections:

```
General
───────
Name            [Build the MVP                           ]
Description     [Launch our core product before Q3       ]
Color           [●] [●] [●] [●] [●] [●]
Status          [Active ▼]
Priority        [Medium ▼]
Start date      [  ]   Due date  [Jul 15, 2026]

                                              [Save changes]

Team
────
Members (3)                                      [+ Add member]

[YA]  Yakubu Abdulbasit   owner       —
[AT]  Ajibola Tunde       member      [Remove]

GitHub Integration
──────────────────
Connect a GitHub repository to automatically sync issues as tasks.

  Repository owner   [shopydash                ]
  Repository name    [backend                  ]
  Sync enabled       [● ON]
  Last synced        2 hours ago    [↻ Sync now]

                                       [Save GitHub settings]

Danger zone
───────────
Archive this project
Tasks and milestones are preserved but the project is hidden.
                                                   [Archive project]
```

---

### 6.8 Weekly loop integration (Home page)

**File:** Update `OutcomeSelectionModal.jsx` and `IntentCaptureModal.jsx`

When a founder clicks "Set This Week's Goal" on the Home page, they now see a project selector step first:

```
Step 1 of 3: Choose a project

Which project is this week's work for?

[●] Build the MVP         (active · 4 tasks pending)
[○] Q3 Fundraising Push   (active · 2 tasks pending)
[○] + No project (general work)

                                    [Next →]
```

This adds `projectId` to the weekly plan payload. If "No project" is selected, the flow continues as before (`projectId: null`).

On the Home page's "This week's focus" section, add a small project label chip above the weekly goal:

```
THIS WEEK'S FOCUS
📁 Build the MVP

Set a clear, achievable goal...
```

---

### 6.9 Office page update

In the existing **Tasks tab** of the Office page, add a project filter dropdown to the existing filter bar:

```
[All projects ▼]  [All milestones ▼]  [Status ▼]  🔍 Search...
```

When a project is selected, filter `localTasks` by `projectId`. No new API call needed — tasks already have `projectId` after migration.

---

## 7. Component Tree

```
client/src/
├── components/
│   └── projects/
│       ├── ProjectsPage.jsx              ← /projects list
│       ├── CreateProjectModal.jsx        ← modal for creating project
│       ├── ProjectDetailPage.jsx         ← /projects/:slug shell + tabs
│       ├── ProjectCard.jsx               ← card used in ProjectsPage grid
│       ├── ProjectHeaderBar.jsx          ← name, status, tab nav (reused in detail)
│       └── views/
│           ├── ProjectBoardView.jsx      ← kanban board
│           ├── ProjectBoardColumn.jsx    ← single kanban column
│           ├── ProjectBoardTaskCard.jsx  ← task card in board
│           ├── ProjectMilestonesView.jsx ← milestone list
│           ├── MilestoneRow.jsx          ← single milestone (expandable)
│           ├── MilestoneTaskRow.jsx      ← task row inside milestone
│           └── ProjectSettingsView.jsx   ← settings tab
├── state/
│   └── useProjectStore.js               ← new Zustand store
└── domains/
    └── founder/
        └── mappers/
            └── projectMapper.js         ← derive UI view model from raw project data
```

---

## 8. Routing

Find the main client router file (likely `App.jsx` or `router.jsx`) and add:

```jsx
import ProjectsPage        from './components/projects/ProjectsPage';
import ProjectDetailPage   from './components/projects/ProjectDetailPage';

// Inside the routes:
<Route path="/projects"          element={<ProjectsPage />} />
<Route path="/projects/:slug"    element={<ProjectDetailPage />} />
```

The `ProjectDetailPage` reads `useParams().slug`, calls `useProjectStore.setActiveProject(slug)` on mount.

---

## 9. Realtime Events

In `server/src/realtime/events.js`, add these emissions to the `startup:{startupId}` room:

| Event | When emitted | Payload |
|---|---|---|
| `project:created` | POST /projects succeeds | `{ project }` |
| `project:updated` | PUT /projects/:slug succeeds | `{ projectId, changes }` |
| `project:archived` | DELETE /projects/:slug | `{ projectId }` |
| `project:synced` | GitHub sync completes | `{ projectId, created, updated }` |

In `useProjectStore`, subscribe to these after `setActiveProject` is called:

```javascript
socket.on('project:updated', ({ projectId, changes }) => {
  if (projectId === get().activeProject?._id) {
    set(s => ({ activeProject: { ...s.activeProject, ...changes } }));
  }
});

socket.on('project:synced', ({ projectId }) => {
  if (projectId === get().activeProject?._id) get().refresh();
});
```

---

## 10. Backward Compatibility

| Concern | How it's handled |
|---|---|
| Existing milestones without `projectId` | `projectId: null` by default — all existing queries still work |
| Existing tasks without `projectId` | Same — `projectId: null`, no query breakage |
| Weekly loop on Home | Unchanged. `projectId` is optional in `createWeeklyPlan` payload |
| Office Kanban | Unchanged — still shows all tasks; optional project filter added |
| Team member dashboard | Unchanged |
| Cohort ProgramMilestones | Completely separate system, not touched |
| `Milestone.status` enum | Only rejects future invalid writes; stored docs unaffected |

> **The rule:** No existing API endpoint changes its response shape. All new fields are additive. All new routes are additive.

---

## 11. Implementation Order

Follow this sequence exactly. Each step should be committed independently.

### Phase 1 — Data layer (no UI)
1. Create `server/src/models/Project.js`
2. Add `projectId`, `githubIssueId`, `githubIssueUrl` to `Task.js`
3. Add `projectId` and enum `status` to `Milestone.js`
4. Update `server/src/utils/enums.js`
5. Create `server/src/utils/syncProjectCounters.js`
6. Update `syncMilestoneCounters` to auto-set milestone status + call `syncProjectCounters`
7. **Bug fix:** team member counter sync in `teamMembers.controller.js`
8. **Bug fix:** execution score double-wrapping in `getExecutionData` + `getStartupSnapshot`
9. **Bug fix:** emit `task:deleted` from `deleteTask`

### Phase 2 — Backend API
10. Create `server/src/controllers/projects.controller.js` (all handlers)
11. Create `server/src/routes/projects.routes.js`
12. Register the new router in the main Express app (`server/src/app.js` or `index.js`)
13. Create `server/src/services/githubSyncService.js`
14. Add `projectId` passthrough to `createWeeklyPlan` and `createMilestone`
15. Add realtime emissions for project events

### Phase 3 — Frontend state
16. Create `client/src/state/useProjectStore.js`
17. Update `useWeeklyLoopStore.js` to accept `projectId` in plan payload

### Phase 4 — UI (build in this order)
18. Add "Projects" nav item to sidebar
19. Register `/projects` and `/projects/:slug` routes in client router
20. Build `ProjectsPage.jsx` + `ProjectCard.jsx` (list + empty state)
21. Build `CreateProjectModal.jsx` (with live slug preview)
22. Build `ProjectDetailPage.jsx` shell (header + tab switcher, no tab content yet)
23. Build `ProjectBoardView.jsx` (board + drag-drop + quick-add task)
24. Build `ProjectMilestonesView.jsx` (milestone list + inline forms)
25. Build `ProjectSettingsView.jsx` (all three settings sections)
26. Update `OutcomeSelectionModal.jsx` — project selector as step 1
27. Update Office Tasks tab — add project filter dropdown

### Phase 5 — Polish
28. Empty states for all views
29. Loading skeletons (match existing skeleton style in the app)
30. Error states
31. Mobile responsiveness
32. Add `projectId` to `chat-mentionables` endpoint so projects can be @mentioned in Chat

---

## 12. Environment Variables

Add to `.env` and `.env.example`:

```
# GitHub integration (optional — only needed for GitHub sync feature)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

---

## 13. What NOT to build in this pass

- Roadmap / timeline / Gantt view (phase 2)
- Project templates
- Project-level comments or activity feed
- GitHub App (OAuth-based installation) — use personal token for now
- Public project sharing page at `startupverse.space/:startupSlug/:projectSlug`
- Cross-project milestone dependencies
- Project analytics dashboard

These are deliberately deferred. Build what's in this document first, ship it, get feedback, then extend.
