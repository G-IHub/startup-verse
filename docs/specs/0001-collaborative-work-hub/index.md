# 0001. Collaborative work hub for tasks and programs

**Date**: 2026-08-13
**Status**: In Progress

## Summary

StartupVerse already has weekly tasks and organisation programs (cohorts). What is missing is substance. A task must open as its own page where the founder writes the brief, attaches files and links, the team comments, and a team member can message the founder in existing chat. A founder can connect GitHub, pick a repo, import issues as those same tasks, then assign them. Programs stay as cohorts. Org admins can list a program in a directory. Founders request to join. Everyone enrolled shares one notes thread. Build this on the current stack. Do not rewrite the weekly loop or the org dashboard.

## Structure

- [0001-task-detail.md](0001-task-detail.md): dedicated task page, brief, files, links, comments, message founder. Supports the core collaboration decision.
- [0001-github-import.md](0001-github-import.md): founder GitHub OAuth, pick repo, pick issues, import as tasks. Supports filling the task list from GitHub without a heavy GitHub product.
- [0001-program-collaboration.md](0001-program-collaboration.md): listed program directory, join requests, shared notes, team member access to the existing Program tab. Supports org and startup collaboration on the cohort.

## Cross child contract

- A GitHub import creates a normal `Task` for the founder startup. That task opens with the same task page as a hand created task.
- Program in the UI means the existing `Cohort`. No third Program collection. No sub programs.
- Auth is the existing JWT session. Startup membership gates tasks. Org admin membership gates listing and join review.
- File bytes go through existing `POST /uploads`. The task stores the returned URL metadata only.
- Message founder opens the existing DM chat with `metadata.taskId` set. Do not invent a second inbox.
- New comments live in `TaskComment`. The old `POST /team-members/:id/tasks/:taskId/comments` route must proxy into `TaskComment` (same startup member gate and notifications) or return 410. Do not keep writing Mixed `Task.comments`. If that array has leftover rows, show them on the task page as read only history.
- Founder `PUT` on a task must allowlist fields (title, status, assign, priority, description, links). It must not mass assign `attachments` or GitHub ids. Team member task update must not write `description`, `links`, or `attachments`.
- Message founder navigates to existing chat with both `with=<founderId>` and `taskId=<taskId>` on the URL. The first compose payload stores `metadata.taskId`. A `taskId` query alone is not enough with today’s chat router.
- Comment notifications use one notification type, deep link to the task page (not the kanban query), and send a single notification when founder and assignee are the same person.
- GitHub issue identity is `owner/repo#number` (or GitHub’s global issue id), not the per repo number alone. Duplicate key on import is returned as skipped, not as 500.
- Join accept is one atomic pending to accepted update. Duplicate membership is 409. Deleted cohorts 404. Org is notified on a new request. Founder is notified on accept or decline.
- Program Notes is a real tab id in `PROGRAM_NAV_TABS` / `normalizeProgramTab`. Notes always use an explicit `cohortId`, never `memberships[0]` only. Mentors are out of scope for notes.

## Requirements

**User stories**:
- As a founder, I want to open each task as a page and write instructions so the team knows what to do.
- As a team member, I want to read that brief, comment, and message the founder so we can work without leaving the task.
- As a founder, I want to import GitHub issues as tasks and assign them so engineering work shows up in the weekly loop.
- As an organisation admin, I want to list a program, accept join requests, and post notes so enrolled startups share one program room.
- As a founder or team member in a program, I want to see program info, activities, and shared notes so the Program tab is not founder only.

**Acceptance criteria** (the contract):
- **AC-1**: Clicking a task in the Office list (or any task list on the startup) opens a dedicated task page with title, status, assignee, brief, files, links, and comments.
- **AC-2**: Creating a task keeps the founder on the list. The new row is clickable straight away. Description is not required at create time.
- **AC-3**: Only the founder can edit the brief, add or remove links, and add or remove files. Team members on that startup can read them.
- **AC-4**: Anyone on the startup can post a comment. Comments persist and show after reload. The founder and the assignee receive a notification. Comments do not stream live. Refresh on submit and on load is enough.
- **AC-5**: A team member can Message founder from the task page. Chat opens at `/chat?with=<founderId>&taskId=<taskId>`. The first send stores `metadata.taskId`.
- **AC-6**: Only the founder can connect GitHub with an OAuth App, pick a repo, pick issues, and import them as tasks. An issue already imported is skipped with a clear message. After import the founder can assign those tasks.
- **AC-7**: Org admin can mark a cohort `listed`. Listed programs appear in a founder directory. Founders request to join. Org admin accepts or declines. Accept creates `CohortMembership`. One pending request per startup per program. A declined startup may request again. An already enrolled startup cannot request. Unlisted programs do not appear in the directory and cannot be joined by a cold link. Only members and that org’s admins can open them.
- **AC-8**: Each program has one shared notes thread. Org admins, plus founder and team members of enrolled startups, can read and add notes. Team members use the same Program tab as founders (overview, deliverables, milestones, events, mentors, communication, plus notes).
- **AC-9**: A user who is not on the startup cannot open that startup’s task (403 or 404). A user who is not the founder cannot edit the brief, connect GitHub, or import issues. A user who is not org admin for that org cannot list the program or review join requests.

## Decision

**Chosen option**: Extend the current Task, Cohort, chat, and upload stack. Add a task page, a GitHub import path, and program join plus notes. Do not add a new Program entity and do not add sub programs.

## Feature design

**Data model sketch**: see each child spec. Shared entities: `Task` (extend), `TaskComment` (new), `GitHubConnection` (new), `Cohort.listed` (extend), `ProgramJoinRequest` (new), `ProgramNote` (new).

**API surface**: see child specs. All routes sit under existing `/api/v1` with bearer JWT.

**Key invariants**:
- Task always belongs to one startup and one founder. GET by id uses a startup member guard, not `founderGuard` (that helper is founder or admin only and would 403 team members).
- GitHub import never creates a second task for the same issue identity on that startup.
- Join accept is the only founder initiated path that creates `CohortMembership` besides the existing invitation accept path.
- Unlisted cohorts stay out of directory queries (`listed: true` and `deletedAt: null`).
- `listed` is set on the existing cohort update route, not a new invented PATCH if PUT already updates the cohort.

**Security model**:
- Task read/comment: founder or team member of `task.startupId`.
- Task brief/files/links/GitHub: founder of that startup (or platform admin).
- Program directory: authenticated founders.
- Join review and `listed` flag: `requireOrgAdmin` for that cohort’s organisation.
- Program notes: org admin of that org, or user whose startup has active `CohortMembership`.
- GitHub access tokens encrypted at rest. Never returned to the client.

**Configuration required**:
- `GITHUB_CLIENT_ID`: GitHub OAuth App client id
- `GITHUB_CLIENT_SECRET`: GitHub OAuth App client secret
- `GITHUB_CALLBACK_URL`: must match the OAuth App callback, example `https://<api-host>/api/v1/github/oauth/callback`
- `GITHUB_TOKEN_ENCRYPTION_KEY`: symmetric key used to encrypt the founder GitHub token at rest

## Build plan

Tracer bullet slices (end to end through client, API, and Mongo before the next slice). No `AGENTS.md` build approach is recorded, so this is the default.

1. Slice 1: task page. Schema plus `GET` task, brief/links/files, comments, notifications, Message founder, list click through. Child [0001-task-detail.md](0001-task-detail.md). Satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-9**.
2. Slice 2: GitHub OAuth plus import into those tasks. Child [0001-github-import.md](0001-github-import.md). Satisfies **AC-6**, **AC-9**.
3. Slice 3: listed directory, join requests, shared notes, confirm team member Program tab. Child [0001-program-collaboration.md](0001-program-collaboration.md). Satisfies **AC-7**, **AC-8**, **AC-9**.
4. Verify against this umbrella with `/check verify` on a founder account, a team member on the same startup, and an org admin. Satisfies **AC-1** through **AC-9**.

## Consequences

**Positive**:
- The weekly loop gains a real work object, not only a title row.
- GitHub work can enter the same loop without a second tracker.
- Programs become a room both the org and the startup can use.

**Negative / tradeoffs**:
- This is three slices. Shipping only the task page still leaves GitHub and join incomplete.
- GitHub `repo` scope can read private repositories. That is the cost of importing private issues.
- One shared notes thread per cohort is noisy if many startups enroll. That is accepted for this slice.

**Neutral**:
- Kanban and weekly create flows stay. They become entry points into the page.
- Old Mixed `Task.comments` is leftover data, not the write path.

## Follow-up

- [ ] Create a GitHub OAuth App and set the four server env vars before slice 2 can be tested against real GitHub.
- [ ] Root `AGENTS.md` is missing. `/sync` should capture stack conventions after this ships.
- [ ] Live comment sockets, GitHub webhooks, and two way issue sync are out of scope.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).
