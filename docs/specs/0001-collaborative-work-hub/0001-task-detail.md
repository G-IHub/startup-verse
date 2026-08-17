# 0001. Task detail page

## Summary

Every startup task opens as its own page. The founder writes a plain text brief, adds files and links, and the team comments. A team member can message the founder in existing chat with the task attached. Create stays on the list. The new row is clickable immediately.

## Requirements

**User stories**:
- As a founder, I want to open a task and write instructions so assignees are not guessing.
- As a team member, I want to read those instructions, comment, and ping the founder so work stays on the task.

**Acceptance criteria**:
- **AC-1**: Clicking a task opens a dedicated page (URL includes the task id) with title, status, assignee, brief, files, links, and comments.
- **AC-2**: After create, the founder stays on the list and can click the new task at once. Brief is optional at create.
- **AC-3**: Only the founder edits brief, links, and files. Team members on the startup can read them.
- **AC-4**: Anyone on the startup can comment. Comments persist. Founder and assignee get a notification. No live socket for comments.
- **AC-5**: Message founder opens existing DM chat at `/chat?with=<founderId>&taskId=<taskId>`. The first send stores `metadata.taskId`.
- **AC-9**: Users outside the startup cannot read or comment (403 or 404). Non founders cannot edit the brief.

## Decision

**Chosen option**: Dedicated route inside the dashboard shell, Linear style layout using current Office tokens. Extend `Task` for links and attachments. New `TaskComment` collection. Reuse `POST /uploads` and existing chat.

Short rationale: a page is what the founder asked for. Cards cannot hold a brief, files, and a thread. Embedding comments on Task already failed (Mixed blobs, founder has no UI).

## Feature design

**Data model sketch**:

`Task` (existing, additive fields):
- `links`: array of `{ url: string required, label: string optional }`, default `[]`
- `attachments`: array of `{ url: string required, name: string, mimeType: string, size: number, uploadedBy: ObjectId, createdAt: Date }`, default `[]`
- existing `description` is the brief (plain text, already max 5000)

`TaskComment` (new):
- `taskId` ObjectId required, indexed
- `startupId` ObjectId required, indexed
- `authorId` ObjectId required
- `body` string required, trim, min 1, max 5000
- timestamps
- index `{ taskId: 1, createdAt: 1 }`

**State transitions**: none new. Existing task status machine stays.

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/founders/:founderId/tasks/:taskId` | GET | founderId, taskId | task plus commentCount | bearer, startup member | 404, 403 |
| `/founders/:founderId/tasks/:taskId` | PUT | description, links (founder) | task | bearer, founder | 403, 422 |
| `/founders/:founderId/tasks/:taskId/attachments` | POST | url, name, mimeType, size (after `POST /uploads`) | task | bearer, founder | 403, 422 |
| `/founders/:founderId/tasks/:taskId/attachments/:attachmentId` | DELETE | | task | bearer, founder | 403, 404 |
| `/founders/:founderId/tasks/:taskId/comments` | GET | page, pageSize | comments[], pagination | bearer, startup member | 403, 404 |
| `/founders/:founderId/tasks/:taskId/comments` | POST | body | comment | bearer, startup member | 403, 422 |
| `/uploads` | POST | file | url | bearer | 413, 422 |

Team member access uses the same GET/POST comment routes (authorize as startup member, not `founderGuard`). If `POST /team-members/:id/tasks/:taskId/comments` stays, it must proxy into `TaskComment` with the same gate and notifications, or return 410. Founder `PUT /founders/:id/tasks/:id` allowlists fields. Team member `PUT` must not write `description`, `links`, or `attachments`.

**Key invariants**:
- Brief, links, files change only if `req.user` is the founder (or admin).
- Comment `startupId` must match `task.startupId`.
- Attachment URL must be a URL returned by `POST /uploads` or an existing Cloudinary URL. Reject random remote URLs.
- Message founder is client navigation to `/chat?with=<founderId>&taskId=<taskId>`. The first outbound message stores `metadata.taskId`. No new message collection.

**Security model**:
- Read task and comments: `req.user` is founder of `task.founderId` or a team member whose `startupId` matches `task.startupId`.
- Write brief/links/files: founder only.
- Notifications: on comment create, notify founder and assignee if they are not the author. One notification type. Deep link is the task page. If founder equals assignee, send once. Reuse `createNotification`.

**Configuration required**: none beyond existing upload env.

**Critical test scenarios**:
- Happy path: founder creates a title only task, clicks it, writes a brief, uploads a file, adds a link, team member comments, founder sees the comment after reload, verifies **AC-1**, **AC-2**, **AC-3**, **AC-4**
- Happy path: team member clicks Message founder and lands in existing chat with that founder and the task id, verifies **AC-5**
- Failure: empty comment body returns 422, verifies **AC-4**
- Auth: a user from another startup GET returns 403 or 404, verifies **AC-9**
- Auth: team member PUT brief returns 403, verifies **AC-3**, **AC-9**

## Build plan

1. Add `links` and `attachments` on `Task`. Add `TaskComment` model. Allowlist founder PUT. Stop team member updates from writing the brief. Proxy or retire the Mixed comment route. Satisfies **AC-3**, **AC-4**, **AC-9**
2. Add GET task by id and comment list/create with a startup member guard (not `founderGuard`). Notify founder and assignee once, linking to the task page. Render leftover Mixed comments as read only history. Satisfies **AC-1**, **AC-4**, **AC-9**
3. Add founder update for description and links, attachment add/remove after `POST /uploads`. Satisfies **AC-3**
4. Add dashboard route such as `/office/tasks/:taskId` (keep `taskId` query working by redirecting to the page). Build the page with current tokens: header (title, status, assignee), brief editor (founder) or read view (team), files, links, comments, Message founder (`/chat?with=&taskId=`). Satisfies **AC-1**, **AC-5**
5. Make every task row in Office and related lists navigate to that route. After create, stay on the list. Satisfies **AC-2**

## Consequences

**Positive**: the weekly loop has a document, not only a card.
**Negative / tradeoffs**: create is still title first. Empty briefs stay possible until the founder opens the page.
**Neutral**: kanban remains the map. The page is the territory.

## Follow-up

- [ ] Markdown or rich text for the brief is out of scope.
- [ ] Socket push for comments is out of scope.
