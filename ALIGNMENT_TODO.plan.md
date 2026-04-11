# StartupVerse Alignment TODO Plan

Purpose: align implementation with `startup-verse_master_blueprint.md` before any net-new feature work.

How to use this file:
- Work top to bottom.
- Do not skip gates.
- Mark each item `[x]` only when verified.
- If any gate fails, pause feature development and fix first.

---

## Phase 0 - Alignment Baseline (No Feature Work)

- [ ] Confirm the blueprint is the product source-of-truth (`startup-verse_master_blueprint.md`).
- [ ] Confirm current technical source docs (`server/API_PARITY_MATRIX.md`, `server/BACKEND_IMPLEMENTATION_PLAN.md`).
- [ ] Freeze net-new feature scope until this checklist is complete.
- [ ] Create one tracking issue/board with this plan as the master checklist.

Definition of done:
- Team agrees that this alignment plan is blocking for new features.

---

## Phase 1 - API Contract Lock (Backend + Frontend)

### 1.1 Canonical endpoint inventory
- [ ] Export full list of active frontend API calls (method + path + payload/params).
- [ ] Map each call to canonical backend route in `/api/v1/*`.
- [ ] Mark any call currently using compatibility alias endpoints.
- [ ] Mark any call still using legacy vendor-hosted function URLs.

### 1.2 Response and error envelope consistency
- [ ] Verify all backend routes return canonical envelope:
  - success: `{ success: true, data: ... }`
  - error: `{ success: false, message: "...", errors?: [...] }`
- [ ] Normalize inconsistent frontend parsing assumptions (no route-specific ad-hoc parsing).
- [ ] Ensure status code handling is consistent (`400/401/403/404/409/422/500`).

### 1.3 Contract tests
- [ ] Add/complete route contract tests for all high-traffic flows:
  - auth
  - founder weekly loop
  - team task updates
  - talent matching/invitations/interests
  - organization/cohort operations
- [ ] Fail build on contract mismatch.

Definition of done:
- Every frontend runtime API call maps cleanly to a canonical backend route with stable envelope behavior.

---

## Phase 2 - Auth and Session Consistency (Frontend + Backend)

### 2.1 Session key standardization
- [ ] Pick one canonical storage scheme for auth/session (single token key + single user/session key).
- [ ] Replace all inconsistent key usage (`startupverse_token`, `startupverse_user`, `startupverse_users`) with canonical keys.
- [ ] Remove dead/legacy session helpers after migration.

### 2.2 Token and identity flow hardening
- [ ] Ensure all protected calls use `Authorization: Bearer <token>`.
- [ ] Ensure token payload assumptions match backend middleware (`userId`, `role`, `isAdmin`).
- [ ] Validate sign-in/sign-out/session refresh behavior across all dashboards.

### 2.3 Role-based route protection checks
- [ ] Audit all backend admin-sensitive endpoints for `requireRole('admin')` where required.
- [ ] Audit all org-sensitive endpoints for `requireOrgAdmin`.
- [ ] Add tests for unauthorized/forbidden cases.

Definition of done:
- No session/key drift and no role bypass paths remain.

---

## Phase 3 - Weekly Execution Loop Integrity (Core Product)

### 3.1 Domain invariants enforcement (backend)
- [ ] Enforce `WeeklyOutcome` immutability once final (`completed|partial|missed`).
- [ ] Enforce `Activity` append-only semantics (no update/delete behavior).
- [ ] Ensure `Execution Score` is derived-only (never manually persisted as authoritative state).
- [ ] Enforce blocked-task requirements (`blockerReason`, `blockerNote`).
- [ ] Ensure milestone progress counters stay synchronized with task state.

### 3.2 End-to-end loop verification
- [ ] Test full flow:
  - goal creation
  - milestone sequencing
  - task creation/assignment
  - task status transitions
  - weekly outcome close
  - execution score recalculation
- [ ] Add regression tests for streak behavior rules.

Definition of done:
- Weekly loop behavior matches blueprint non-negotiables end-to-end.

---

## Phase 4 - Realtime Convergence and Fallback

### 4.1 Transport unification
- [ ] Decide and document canonical realtime transport contract (Socket.IO target contract).
- [ ] Migrate active client realtime consumers to canonical transport.
- [ ] Remove direct runtime dependence on non-canonical realtime transports for core flows.

### 4.2 Event contract parity
- [ ] Verify event coverage for:
  - presence
  - task updates
  - activity feed
  - announcements
  - wins
  - unread counts
- [ ] Validate room scoping and tenant safety.

### 4.3 Graceful degradation
- [ ] Implement and verify polling fallback for all critical live features.
- [ ] Confirm degraded mode keeps core workflows functional.

Definition of done:
- Realtime is coherent and resilient, with tested fallback.

---

## Phase 5 - Legacy hosted runtime cutover completion

### 5.1 Runtime reference cleanup
- [ ] Remove active runtime references to legacy vendor function URLs.
- [ ] Remove runtime imports bound to vendor-only helpers after replacement.
- [ ] Confirm no active code path composes legacy function URLs via hard-coded project IDs.

### 5.2 Compatibility endpoint reduction
- [ ] Mark which compatibility routes are still required by client runtime.
- [ ] Migrate client callers to canonical routes.
- [ ] Deprecate/remove compatibility routes only after zero runtime callers remain.

### 5.3 Verification gates
- [ ] Grep gate: no active runtime legacy function URL usage.
- [ ] Build gate: client and server build cleanly.
- [ ] Smoke gate: core founder/team/talent/org journeys pass against Express backend only.

Definition of done:
- Express backend is the sole runtime API backend path for core product flows.

---

## Phase 6 - Backend Completeness for Blueprint Gaps

### 6.1 Google integration status
- [ ] Keep placeholder routes explicitly documented as placeholders if not in current scope.
- [ ] If promoting to active scope, implement full OAuth/token lifecycle and meeting creation properly.

### 6.2 Notification reliability
- [ ] Move from endpoint-only notification triggers toward event-driven reliability model.
- [ ] Add queue/retry strategy for critical reminder types.
- [ ] Add observability for delivery failures.

### 6.3 Calendar aggregation endpoint hardening
- [ ] Ensure `GET /api/v1/calendar/:userId` returns a robust, unified, sorted timeline.
- [ ] Validate inclusion of milestones, events, deliverables, meetings.

Definition of done:
- Blueprint-defined backend gaps are either fully implemented or intentionally deferred with explicit scope notes.

---

## Phase 7 - Frontend Architecture Normalization

### 7.1 API layer normalization
- [ ] Standardize API usage through canonical client modules/hooks.
- [ ] Remove duplicate ad-hoc network utilities where canonical modules exist.
- [ ] Ensure consistent loading/error state handling in UI.

### 7.2 State management hygiene
- [ ] Keep server state handling consistent (single strategy).
- [ ] Keep UI-only state separated from server state.
- [ ] Eliminate localStorage use for non-session data where not required.

### 7.3 Virtual Office cohesion check
- [ ] Validate that presence, feed, tasks, team hub, wins, and agenda remain context-linked.
- [ ] Validate deep linking from notifications to specific in-office targets.
- [ ] Verify no data-context loss when navigating key workflows.

Definition of done:
- Frontend behavior is coherent with ecosystem-first product model.

---

## Phase 8 - Security, Multi-Tenancy, and Data Integrity

- [ ] Validate org/cohort tenant boundaries across all write endpoints.
- [ ] Add negative tests for cross-org/cross-startup access attempts.
- [ ] Audit sensitive data exposure in API responses (`hashedPassword`, secret tokens, internals).
- [ ] Add request validation coverage for all mutation routes.

Definition of done:
- No known cross-tenant or privilege-escalation paths in targeted flows.

---

## Phase 9 - Cleanup and Documentation Consolidation

- [ ] Remove obsolete debug/deploy artifacts after cutover gates pass.
- [ ] Update `server/API_PARITY_MATRIX.md` to reflect final canonical status.
- [ ] Add a concise "Current Architecture" doc for new contributors.
- [ ] Document deprecated routes/features and removal timeline.

Definition of done:
- Repo reflects current runtime reality with minimal legacy clutter.

---

## Final Go/No-Go Gate Before New Features

All must be true:
- [ ] API contract lock complete.
- [ ] Auth/session consistency complete.
- [ ] Weekly loop invariants enforced and tested.
- [ ] Realtime convergence + fallback tested.
- [ ] Legacy hosted runtime cutover complete.
- [ ] Security/tenant checks passing.
- [ ] Core journey smoke tests passing.

If any item is not complete: no new feature implementation yet.

---

## Suggested Execution Order (Strict)

1. Phase 1 (API contract lock)
2. Phase 2 (auth/session consistency)
3. Phase 3 (weekly loop integrity)
4. Phase 4 (realtime convergence)
5. Phase 5 (legacy hosted cutover)
6. Phase 8 (security and tenant hardening)
7. Phase 6 (blueprint gap completion based on scope)
8. Phase 7 (frontend normalization)
9. Phase 9 (cleanup/docs)
10. Final Go/No-Go gate

---

## Notes

- Do not start premium/future-only blueprint items during this alignment cycle.
- Keep all currently built beta core features ungated.
- Prefer stabilization and consistency over introducing additional moving parts.
