# 0001. Program collaboration

## Summary

A program is the existing cohort, shown as Program in the UI. Org admins can list a program in a founder directory. Founders request to join. Accept creates the same membership invitations already use. Enrolled founders, team members, and org admins share one notes thread. Team members already have the Program tab. Keep it, and add notes. No sub programs.

## Requirements

**User stories**:
- As an org admin, I want to list a program and accept join requests so the right startups get in.
- As a founder, I want to browse listed programs and request to join so I am not stuck waiting for an invite only.
- As a team member, I want the same Program tab and shared notes so I can see what the organisation posted.

**Acceptance criteria**:
- **AC-7**: `listed` programs appear in the founder directory. Request to join. Org accepts or declines. Accept creates `CohortMembership`. One pending request per startup per program. Declined may request again. Already a member cannot request. Unlisted programs stay out of the directory and cannot be joined by a cold link. Only members and that org’s admins can open them. Existing invitation flow stays.
- **AC-8**: One shared notes thread per program. Org admins and enrolled founder plus team members can read and add notes. Team members see the same Program tabs as founders.
- **AC-9**: Non org admins cannot set `listed` or review requests. Users not enrolled (and not org admin) cannot read notes.

## Decision

**Chosen option**: Keep `Cohort` as Program. Add `listed` on cohort, `ProgramJoinRequest`, and `ProgramNote`. Do not add a Program collection. Do not add sub programs.

Short rationale: founder UI already says Program for a cohort. A new entity would rewrite membership, invitations, deliverables, and widgets. Sub programs were declined.

## Feature design

**Data model sketch**:

`Cohort` additive:
- `listed` boolean, default `false`, indexed with `deletedAt`

`ProgramJoinRequest` (new):
- `cohortId` ObjectId required
- `founderId` ObjectId required
- `startupId` ObjectId required
- `message` string optional, max 2000
- `status` enum `pending` | `accepted` | `declined`, default `pending`
- `reviewedBy` ObjectId nullable
- `reviewedAt` Date nullable
- timestamps
- unique partial index: one `pending` row per `{ startupId, cohortId }`
- on accept: one atomic update `pending` to `accepted` (filter status pending). Then create `CohortMembership`. If membership already exists, 409 and keep accepted. Notify the founder.

`ProgramNote` (new):
- `cohortId` ObjectId required, indexed
- `authorId` ObjectId required
- `body` string required, max 5000
- timestamps
- index `{ cohortId: 1, createdAt: -1 }`

**State transitions**:
- Join request: pending → accepted | declined
- Declined: founder may create a new pending request
- Accepted or already member: POST request returns 409

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/programs` | GET | page | listed cohorts (name, org, dates, description) | bearer, founder | |
| existing cohort update (`PUT` `/cohorts/:cohortId` or the current org cohort update) | PUT | listed plus existing fields | cohort | bearer, org admin | 403 |
| `/programs/:cohortId/join-requests` | POST | message | request | bearer, founder | 404 if unlisted or deleted, 409 if member or pending |
| `/organizations/:orgId/cohorts/:cohortId/join-requests` | GET | status | requests[] | bearer, org admin | 403 |
| `/organizations/:orgId/cohorts/:cohortId/join-requests/:id` | PATCH | status=accepted\|declined | request | bearer, org admin | 403, 409 |
| `/programs/:cohortId/notes` | GET | page | notes[] | bearer, member or org admin | 403, 404 |
| `/programs/:cohortId/notes` | POST | body | note | bearer, member or org admin | 403, 422 |

Directory GET must filter `listed: true`, `deletedAt: null`. Unlisted or deleted id on join POST returns 404 (do not leak existence). Notes GET on unlisted still works for members and org admins. Add `notes` to `PROGRAM_NAV_TABS` so `normalizeProgramTab` does not coerce it to overview.

**Key invariants**:
- Invitation accept and join request accept both write `CohortMembership` and must not create two memberships (`cohortId` + `startupId` unique already).
- Team member Program tab keeps using `getStartupMemberships`. If the founder is enrolled, the team sees the program.
- Notes are cohort wide and always queried by explicit `cohortId` (not `memberships[0]`). Mentors are out of scope for notes.
- New join request notifies org admins. Accept or decline notifies the founder.

**Security model**:
- Directory: founders (role founder). Team members do not request join. They inherit membership through the startup.
- `listed` and join review: `requireOrgAdmin` for that org.
- Notes: org admin or user with active membership for that cohort (founder or team member of the member startup).

**Configuration required**: none.

**Critical test scenarios**:
- Happy path: org lists a cohort, founder sees it, requests, org accepts, founder and team member see Program tab plus notes, verifies **AC-7**, **AC-8**
- Failure: second pending request returns 409, verifies **AC-7**
- Failure: founder requests an unlisted id, 404, verifies **AC-7**
- Auth: team member cohort update with `listed` returns 403, verifies **AC-9**
- Auth: outsider GET notes returns 403, verifies **AC-8**, **AC-9**

## Build plan

1. Add `listed` on Cohort (default false). Add `ProgramJoinRequest` and `ProgramNote`. Satisfies **AC-7**, **AC-8**
2. Directory GET, founder request (404 deleted or unlisted), org list/review with atomic accept, notifications both ways. Set `listed` on the existing cohort update. Org UI: listed toggle plus request inbox. Satisfies **AC-7**, **AC-9**
3. Notes GET/POST by explicit `cohortId`. Add `notes` to `PROGRAM_NAV_TABS`. Program tab Notes panel for founder and team member. Org cohort dashboard: same thread. Mentors out of scope. Satisfies **AC-8**
4. Confirm team member sidebar still exposes Program children and that membership load uses startup id. Satisfies **AC-8**

## Migration plan

**Strategy**: no migration needed
**Phases**:
1. Deploy additive `listed` default false. Existing cohorts stay unlisted until an admin lists them.
2. Invitations keep working in parallel.
**Rollback**: revert the release. New collections can sit unused.
**Risks**: an admin lists a cohort that was meant to stay private. Default false avoids that.

## Consequences

**Positive**: programs are joinable and writable without cloning Linear or building a second org product.
**Negative / tradeoffs**: one notes thread for every startup in the cohort will mix voices. Directory is founder only, so a team member cannot apply on their own.
**Neutral**: invitation links remain the private path.

## Follow-up

- [ ] Join codes for unlisted programs are out of scope.
- [ ] Sub programs are out of scope.
