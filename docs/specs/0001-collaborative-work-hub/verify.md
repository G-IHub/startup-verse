# Verify: Collaborative work hub · spec 0001 · updated 2026-08-13
_Steps derived from spec 0001 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual

- [ ] Sign in as a founder. Open Office tasks. Click a task row. Expect `/office/tasks/:taskId` with title, status, assignee, brief, files, links, and comments. → AC-1
- [ ] Create a task from the list. Stay on the list. The new row is clickable and opens the same task page. Description is not required at create time. → AC-2
- [ ] As founder, edit the brief, add a link, attach a file (via `POST /uploads`). As a team member on that startup, those fields are readable and not editable. → AC-3
- [ ] As founder or team member, post a comment. Reload. The comment is still there. Founder and assignee each get one `task-comment` notification (one only if they are the same person). The notification opens the task page. Comments do not stream live. → AC-4
- [ ] As a team member, click Message founder. Chat opens at `/chat?with=<founderId>&taskId=<taskId>`. The first send stores `metadata.taskId`. → AC-5
- [ ] As founder, connect GitHub in Settings (needs the four env vars). From the task list, Import, pick a repo, pick issues. New tasks appear. Import the same issue again and it is skipped. Assign an imported task with the existing assign control. A team member cannot connect or import. → AC-6
- [ ] As org admin, list a cohort from the cohort home toggle. As founder, see it in Program overview directory and request to join. As org admin, accept (membership created) or decline. A second pending request is blocked. A member cannot request again. An unlisted program is absent from the directory. A cold join POST returns 404. Invitation flow still works. → AC-7
- [ ] Open Program Notes as org admin and as an enrolled founder or team member. Post a note. Both sides see it after reload. Team members see the same Program tabs as founders, including Notes. → AC-8
- [ ] A user who is not on the startup cannot open that startup’s task (403). A non founder cannot edit the brief, connect GitHub, or import. A non org admin cannot set `listed` or review join requests. → AC-9

## Commands

- [ ] `node --test src/controllers/collabHub.controller.test.js` (from `server/`) → all five tests pass (GET task 403, empty comment 422, unlisted join 404, duplicate GitHub skip) → AC-3, AC-4, AC-6, AC-7, AC-9

## Acceptance-criteria coverage

- AC-1 covered by the task page click through step
- AC-2 covered by the create and stay on list step
- AC-3 covered by founder edit vs team read, plus the 403/422 tests
- AC-4 covered by comment persist and notify step, plus empty body 422
- AC-5 covered by Message founder chat URL and first send metadata
- AC-6 covered by GitHub connect/import/skip, plus duplicate skip test
- AC-7 covered by listed directory, join review, unlisted 404 test
- AC-8 covered by shared notes and team Program tabs
- AC-9 covered by outsider 403, founder only GitHub, org admin only listing
