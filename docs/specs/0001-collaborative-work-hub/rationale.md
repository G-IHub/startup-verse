# 0001 Collaborative work hub: rationale

## Context

> ⚠️ Premise note: This topic is three buildable features (task page, GitHub import, program join and notes). The umbrella records the shared contract. Each child is the build spec for one slice. The product blueprint says StartupVerse is not a task manager. The task page is still in scope because the weekly loop is hollow without a place for instructions, files, and talk. Do not grow this into a generic tracker (no custom workflows, no time tracking, no GitHub two way sync).

StartupVerse already stores `Task` with a title, optional description, assignee, status, and a Mixed comments array. The Office UI is a kanban and a create dialog. Deep links scroll to a card. There is no `GET` by id page. Team members have a comment API that writes unstructured blobs. Founders have no comment UI. Files exist for chat and avatars via `POST /uploads`, not for tasks. Chat DMs already exist.

GitHub appears only as a profile URL. There is no OAuth and no issue import.

Organisations create `Cohort` records. Founders join through `CohortInvitation`. `CohortMembership` ties a startup to a cohort. The Program tab already lists overview, deliverables, milestones, events, mentors, and communication for both founder and team member roles. What is missing is a way for a founder to find a program and ask to join, a listed flag so private cohorts stay private, and a shared notes thread. Sub programs were considered and rejected.

If this stays unbuilt, the weekly loop remains a to do list, and the Program tab remains a read of org widgets with no shared writing surface.

## Options considered

### Option 1: Extend Task, Cohort, chat, and uploads (chosen)

Add a task page on the existing task. Add GitHub as a founder OAuth import. Keep Cohort as Program. Add `listed`, join requests, and notes.

**Pros**:
- Matches the data that already ships.
- One work object for hand created and imported items.
- Org dashboard and Program tab stay the shells they are.

**Cons**:
- Three slices still have to land before the story feels complete.
- Task schema grows (`links`, `attachments`, GitHub ids).

### Option 2: New work item type besides Task

A second entity (Issue, Ticket, Tag) with its own page, leaving weekly tasks as titles.

**Pros**:
- Weekly loop stays untouched.

**Cons**:
- Two lists, two assignment paths, two places to look. The founder already called these tasks.

### Option 3: New Program collection plus sub programs

Org creates Program, cohort hangs under it, children for sub programs.

**Pros**:
- Matches some accelerator language (program then cohort).

**Cons**:
- The app already treats cohort as program in the founder UI. A third entity would force a rewrite of membership, invitations, deliverables, and the Program tab. Sub programs were declined.

## Rationale

Fix in place. The gap is missing surfaces on objects that already exist, not the wrong objects. A dedicated page is the smallest way to stop the to do list feeling. GitHub must create those same tasks so assignment and comments stay one path. Cohort as Program avoids a migration of every org widget. Listed plus request to join adds discovery without making every private cohort public. Shared notes plus existing Program tabs give team members the same room as founders without cloning the org dashboard.

## Existing system (what we extend)

- `server/src/models/Task.js`: title, description (up to 5000), status, assignee, milestone, Mixed comments, blockers.
- `server/src/routes/founders.routes.js`: list, create, update, status, assign, delete. No get by id.
- `POST /team-members/:id/tasks/:taskId/comments`: writes Mixed comments.
- `client/src/components/office/TaskManagementPanel.jsx`: kanban, create dialog, scroll to `initialTaskId`.
- `client/src/app/dashboardPaths.js`: `taskId` query opens the panel, not a page. `/program` already exists for founder and team member.
- `server/src/models/Cohort.js` plus `CohortMembership`, `CohortInvitation`.
- `client/src/components/program/ProgramWorkspace.jsx`: membership based Program tab.
- `server/src/services/uploadService.js` and `POST /uploads`.
- `server/src/models/Message.js`: DMs with `metadata`.
- Google OAuth connect UI exists as a pattern (`GoogleAccountConnect`, `/google/oauth/authorize`). GitHub should follow that popup plus callback shape, implemented for real.
