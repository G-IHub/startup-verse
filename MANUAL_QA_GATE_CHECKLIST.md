# Manual QA gate (pre–new-feature work)

Use this after automated smoke scripts pass. Check each box when verified in a staging environment against the Express API.

## Auth and session

- [ ] Sign up, sign in, sign out; token present for protected calls.
- [ ] Wrong/expired token returns 401 on a protected route.
- [ ] `organization-admin` can reach org admin–only routes only when listed in `OrganizationAdmin` for that org.

## Founder / team weekly loop

- [ ] Create or view goals, milestones, tasks; update task status including blocked with reason.
- [ ] Weekly outcome flow (create/close) matches expected statuses.
- [ ] Execution score or derived UI loads without server error.

## Organization / cohort

- [ ] Create or select organization; list cohorts; open cohort workspace.
- [ ] **Cohort reads** (events, announcements, resources, milestones, members, analytics, portfolio, cohort detail): founder in cohort, team member with `startupId`, org admin, and org-linked mentor can read; unrelated user gets 403.
- [ ] **Cohort writes** (events, announcements, resources, milestones, deliverables create, cohort members): only org admin (or platform admin), not random founder.

## Deliverables

- [ ] List cohort deliverables as participant, mentor, and org admin.
- [ ] Submit as founder; submit as team member (submission keyed to linked founder).
- [ ] Review submission as org admin and as mentor (org-linked or assigned founder in cohort).
- [ ] Non-member cannot list or submit.

## Communication Center (org messaging)

- [ ] `GET /messages/organization/:organizationId`: org admin sees all org messages; founder/team/mentor in org scope sees only messages where they are sender or recipient; unrelated user gets 403.
- [ ] `POST /messages/bulk-send` with `cohortId`, `organizationId`, `recipientIds` (cohort founders): creates messages; rejects recipients not in cohort or cohort not in org.
- [ ] `POST /messages/send-individual` with valid `recipientId` in cohort: one message created.

## Mentors

- [ ] Invite mentor to org (`MentorProfile.organizationId` set).
- [ ] Assign founder to mentor with `cohortId` in body; unassign; non–org-admin cannot assign.

## Realtime (if enabled)

- [ ] Socket connects with auth; message create emits to expected rooms without cross-org leakage (spot-check).

## Regression scripts (local)

**One-shot (recommended):** from `server/` run `node scripts/alignment-gate-smoke.mjs` or `npm run test:alignment-gate` (Phase 1 contract + all-controller envelopes + client path inventory + client/server route prefixes + HTTP envelope sample, then Phase 2–3 smokes).

Or individually:

```bash
cd server && node scripts/phase1-contract-smoke.mjs
cd server && node scripts/phase1-envelope-all-controllers-smoke.mjs
cd server && node scripts/phase1-client-api-inventory-smoke.mjs
cd server && node scripts/phase1-client-server-route-smoke.mjs
cd server && node scripts/phase1-http-api-envelope-smoke.mjs
cd server && node scripts/phase2-auth-regression-smoke.mjs
cd server && node scripts/phase3-1-behavior-smoke.mjs
cd server && node scripts/phase3-weekly-loop-smoke.mjs
```

**Phase 1.1 inventory (regenerate after client API edits):** `npm run export:client-api-inventory` → writes `server/API_CLIENT_CALL_INVENTORY.md`.

**Phase 1.1 call catalog (commit with client API changes):** `npm run export:client-api-call-catalog` → `server/API_CLIENT_CALL_CATALOG.json` + `server/API_ROUTE_MAPPING.generated.md`. **Server route manifest:** `npm run export:server-route-manifest`.

**Phase 1.3 HTTP flows (Mongo + full `.env`):** `RUN_CONTRACT_HTTP_FLOWS=1 npm run test:phase1-http-flows` from `server/` (also runs when `RUN_CONTRACT_HTTP_FLOWS=1` in `alignment-gate-smoke`).

## Virtual Office cohesion (Phase 7.3)

- [ ] Open Virtual Startup Office with a founder who has `startupId`; confirm presence list, activity feed, tasks panel, and agenda/calendar widgets load without console errors.
- [ ] **Calendar/agenda:** As a **founder**, open `AgendaPanel` / office calendar; confirm items load via `GET /calendar/:userId` (same user id) and filters (upcoming / today / week / overdue) behave sensibly.
- [ ] **Calendar/agenda:** As a **team member** linked to a startup with cohort membership, confirm the same calendar load shows cohort events/deliverables/milestones (not only founder-only membership rows).
- [ ] **Calendar/agenda:** Optional — call `GET /calendar/:userId?start=…&end=…` with a narrow window and confirm results stay within the range.
- [ ] **Check-ins:** Submit a daily check-in from Virtual Office; confirm it appears in the live activity feed with type `check-in` and that a second browser/session for another team member sees it (realtime or after refresh).
- [ ] **Check-ins:** Confirm `GET /startups/:startupId/activities?type=check-in&limit=20` returns only check-in rows for an authorized member.
- [ ] **Check-ins:** Disconnect or block the network briefly and submit a check-in; confirm the UI shows an error and does not claim success if the POST fails.
- [ ] **Virtual Office tour (first visit):** Open Virtual Office as a user with `virtualOfficeTourCompleted` false; confirm the Joyride runs, **Skip Tour** is not shown, and finishing sets the flag (profile + no auto-restart on reload).
- [ ] **Virtual Office tour (replay):** Use “Replay Tour” (or equivalent); confirm the tour runs again and Skip is available; after skip or finish, behavior matches expectations.
- [ ] Navigate away and back without losing startup context (`startupId` / room join).
- [ ] Trigger or simulate a notification with `actionUrl` and confirm navigation lands in the expected office tab or route.
- [ ] Task panel lifecycle guardrails: invalid transitions (for example `completed -> pending`) are rejected with a visible validation error.
- [ ] Blocking a task requires both blocker reason and blocker note in UI and API payloads.
- [ ] Task panel remains fresh during temporary socket disconnect (bounded polling fallback) and stops polling after reconnect.
- [ ] Team Hub messaging: send/receive between two users updates unread/read state correctly after refresh.
- [ ] Team Hub announcements: create announcement appears for both users and realtime fallback works if socket disconnects.
- [ ] Notification deep-links into Team Hub open the expected context (announcement or message thread).
- [ ] Wall of Wins: create a win from Team Hub (`category: wall-of-wins`), refresh, and confirm it persists for all startup members.
- [ ] Wall of Wins: with socket disconnected, wins list still updates via bounded polling fallback and resumes realtime on reconnect.
- [ ] Win notification deep-link (`/wins/:winId`) opens Virtual Office with Team Hub context.

---

When **all** sections above are checked (or explicitly waived with reason), treat the **manual QA gate** as passed for release confidence (use with `startup-verse_master_blueprint.md` and `cd server && npm run test:alignment-gate` in CI or locally).
