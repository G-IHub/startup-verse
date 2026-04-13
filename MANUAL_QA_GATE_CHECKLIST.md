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

**One-shot (recommended):** from `server/` run `node scripts/alignment-gate-smoke.mjs` (chains phase1, phase2, phase3.1, phase3 weekly-loop smokes).

Or individually:

```bash
cd server && node scripts/phase1-contract-smoke.mjs
cd server && node scripts/phase2-auth-regression-smoke.mjs
cd server && node scripts/phase3-1-behavior-smoke.mjs
cd server && node scripts/phase3-weekly-loop-smoke.mjs
```

---

When **all** sections above are checked (or explicitly waived with reason), treat the **manual QA gate** as passed for the alignment “go” decision in `ALIGNMENT_TODO.plan.md`.
