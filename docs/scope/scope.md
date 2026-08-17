# Scope: StartupVerse

StartupVerse is the digital ecosystem where founders and teams run weekly execution, and organisations run programs (cohorts). This scope tracks the collaborative work hub that makes tasks and programs usable.

**Build approach:** Tracer Bullet (thin end to end slice through client, API, and Mongo before the next slice).
**Weight profile:** this hub is full (new GitHub OAuth, authz, and join races).

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | Collaborative work hub | Slice 1 | in-progress |

## Slice 1: Collaborative work hub

### 1. Collaborative work hub · in-progress · full

Give every task a real page (brief, files, links, comments, message founder), let founders import GitHub issues as those tasks, and let organisations list programs so founders can request to join and everyone enrolled can share notes.

**Done when:** a founder and a team member on the same startup can open a task, work from the brief, comment, and chat; the founder can import GitHub issues and assign them; an org admin can list a program, accept a join request, and share notes that the team can see on the Program tab.

- [x] Design it (spec): `/architect collaborative work hub`
- [x] Build it: `/develop collaborative work hub`
  - [x] Task page: route, GET, brief, files, links, comments, notifications, message founder (AC-1, AC-2, AC-3, AC-4, AC-5, AC-9)
  - [x] GitHub connect and import into those tasks (AC-6, AC-9)
  - [x] Listed program directory, join requests, shared notes, team Program tab (AC-7, AC-8, AC-9)
- [ ] Verify it: `/check verify collaborative work hub`
- [ ] Test it: `/test collaborative work hub`

Spec [0001](../specs/0001-collaborative-work-hub/index.md)
code in `client/src/components/office/TaskDetailPage.jsx`, `server/src/controllers/taskDetail.controller.js`, `server/src/controllers/github.controller.js`, `server/src/controllers/programs.controller.js`

## Deferred

- Live comment sockets
- GitHub webhooks and two way issue sync
- Join codes for unlisted programs
- Sub programs
- Markdown or rich text task briefs

## Legend

**The decision box.** The sub task whose label ends with `(spec)`. Other boxes are execution.

Feature lifecycle: `planned` → `in-progress` → `done`, plus `existing` and `dropped`.
