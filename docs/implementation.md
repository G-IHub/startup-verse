# StartupVerse — implementation plan (blueprint-driven)

This file turns [`startup-verse_master_blueprint.md`](startup-verse_master_blueprint.md) into **ordered, shippable work**. Product intent lives in the blueprint; **this plan** is how you implement and verify features until the MVP scope described there is complete.

**Current stack (repo reality, not blueprint fiction):** React 18 + Vite (JS/JSX), Tailwind + Radix, Express 5 + MongoDB + Mongoose, JWT auth, Socket.IO, HTTP via `client/src/utils/backendClient.js` and `client/src/utils/api/*`. Keep [`server/API_PARITY_MATRIX.md`](server/API_PARITY_MATRIX.md) updated when you add or rename API surface.

**Quality bar on every merge:** `cd server && npm run test:alignment-gate`; before release, [`MANUAL_QA_GATE_CHECKLIST.md`](MANUAL_QA_GATE_CHECKLIST.md) (especially Virtual Office). After client API path changes: `npm run export:client-api-call-catalog` and `npm run export:client-api-inventory` from `server/` so committed artifacts stay in sync.

**Remediation lock (2026-04-13):** before any net-new feature work, keep these enforced in code and gate checks: (1) founder/invitation/notification ownership checks, (2) atomic `POST /api/v1/interests/:interestId/onboard` transaction with rollback semantics, (3) weekly loop status update stability + execution-score streak contract, (4) immutable `Activity` records, and (5) short-lived presence records (TTL-backed persistence for realtime resilience).

**Virtual Office Task Panel polish (2026-04-13):** task mutations now enforce a strict server-side lifecycle (`pending -> in-progress/blocked`, `in-progress -> pending/blocked/completed`, `blocked -> pending/in-progress`, `completed` terminal), blocked payloads always require canonical `blockerReason` + `blockerNote`, task updates emit consistent `task:updated` realtime events for founder and team-member paths, and client task subscriptions include bounded polling fallback when sockets disconnect.

**Virtual Office Team Hub polish (2026-04-13):** Team Hub now uses canonical message/announcement contracts via backend APIs, message and announcement access is startup-scoped with ownership guards, notification deep-links can open Team Hub context (including targeted message threads), and realtime subscriptions (`message:created`, `announcement:created`) include bounded polling fallback so chat and announcement streams stay fresh during socket outages.

**Virtual Office Wall of Wins polish (2026-04-13):** Wall of Wins now has startup-scoped persistent REST endpoints (`GET/POST /api/v1/startups/:startupId/wins`) backed by immutable `Activity` rows (`type: "win"`), canonical win payload normalization across backend/client, dedicated realtime fanout (`win:created`) with bounded polling fallback, optimistic create/reconcile behavior in UI, and notification deeplinks that can open Team Hub in wins context.

---

## How each feature should be built (repeatable pattern)

For **every** meaningful feature slice:

1. **Anchor** — Cite the blueprint section(s) (e.g. §7 loop, §8 Virtual Office). If behaviour is not in the blueprint, it is not MVP unless you explicitly extend the blueprint.
2. **Contract** — Add or adjust Express routes under `/api/v1` with [`server/src/utils/apiResponse.js`](server/src/utils/apiResponse.js) envelopes; validate input server-side.
3. **Permissions** — Use existing middleware patterns (`requireAuth`, `requireOrgAdmin`, cohort/deliverable helpers). Never widen scope “for speed.”
4. **Data** — Mongoose models aligned with blueprint §13; index foreign keys as blueprint §25 states.
5. **Client** — Prefer thin API modules in `client/src/utils/api/` + hooks/components; avoid new raw `fetch(API_BASE_URL` outside allowed paths (alignment smoke).
6. **Realtime** — If the blueprint calls for live UI (§8, §16), emit via the existing Socket.IO path; **always** keep REST + polling usable if sockets fail.
7. **Activity** — Where the blueprint expects an audit trail (§6.7, §7 step 4), create **immutable** `Activity` records on the server at the moment of truth (not only in the client).
8. **Verify** — Automated gate + manual steps for the slice; update `API_PARITY_MATRIX.md` if routes or naming change.

---

## Phase 0 — Baseline and safety (do first)

| Step | Blueprint ref | Work |
|------|----------------|------|
| 0.1 | §15, §19.5 | **Admin hardening:** Ensure every destructive or sensitive **admin** API uses server-side `isAdmin` / role checks; client `?admin=true` entry must not grant capability without the same user being admin in JWT + DB. |
| 0.2 | §25 | **Secrets and fields:** No `hashedPassword` or internal-only fields in JSON responses; `User` password stays `select: false` where applicable. |
| 0.3 | §11–12 (adapted) | **Doc hygiene:** When you change stack or routes, update the blueprint §11–12/§25 **or** add a one-line “implementation note” in this file so newcomers are not misled. |
| 0.4 | — | **Keep gates green:** Alignment gate + client `npm run build` on branches that touch API or client API usage. |

**Exit criteria:** Admin surface cannot be used without server-enforced admin; no regressions on alignment gate.

---

## Phase 1 — Weekly execution loop (heart of the product)

**Blueprint:** §7 (full loop), §6.3–6.6 (Task, Milestone, WeeklyOutcome, Execution Score), §6.7 (Activity).

| Step | Feature | Implementation notes |
|------|---------|----------------------|
| 1.1 | **Weekly goal (Step 1)** | Founder creates/updates current week `WeeklyOutcome` with `status: "active"` and plain-language goal; visible to team via API + UI. |
| 1.2 | **Milestones (Step 2)** | 2–4 milestones per week with `order`; enforce ordering in API if product requires it. |
| 1.3 | **Tasks (Steps 3–4)** | CRUD + assignee; statuses `pending` → `in-progress` → `completed` \| `blocked` with **required** `blockerReason` + `blockerNote` when blocked. |
| 1.4 | **Milestone counts** | Keep `tasksCompleted` / `totalTasks` in sync with tasks (transaction or consistent update hooks). |
| 1.5 | **Outcome logging (Step 6)** | Founder sets week outcome to `completed` \| `partial` \| `missed`; **immutable after submit** (reject PATCH/delete on submitted outcome per blueprint §7). |
| 1.6 | **Execution score (Step 7)** | Implement exactly blueprint §6.6 (composition + streak rules: completed extends streak; missed resets; partial neutral). Serve via existing execution-score route pattern; no manual score edits. |
| 1.7 | **Activities** | On task status change, milestone completion, weekly submit, join, etc., append **immutable** Activity rows (§6.7 types). |

**Exit criteria:** A founder can run a full week **without** Virtual Office polish: goal → milestones → tasks → team execution → weekly outcome → score reflects data; activities recorded for key events.

---

## Phase 2 — Virtual Startup Office (integrated team surface)

**Blueprint:** §8 (all sub-areas), §16 (realtime topics), §23 (UX: alive, deep links, mobile, empty states).

Build in **thin vertical slices** so each slice is usable without waiting for the whole office:

| Step | Component area | Blueprint intent | Engineering approach |
|------|----------------|-------------------|------------------------|
| 2.1 | **Presence & status** | Online/offline + `TeamMemberStatus` (§6.19) | Socket presence + REST fallback; status text + mood; join startup room on `startupId`. |
| 2.2 | **Live activity feed** | Stream of §6.7 types, filterable | Read from Activity API; subscribe to socket events for append; avoid “pagination that hides the whole story” unless performance forces bounded windows with clear UX. |
| 2.3 | **Task panel** | Full lifecycle inline, blocked capture, deep links | Reuse founder/team-member task APIs; notification `actionUrl` routes into correct office tab (§23). |
| 2.4 | **Team hub** | Messaging + announcements + unread | Messages + announcements APIs + UI badges; cohort/org announcements where membership applies. |
| 2.5 | **Wall of wins** | Celebrations → activity | Persist wins (model or activity payload); broadcast to feed. |
| 2.6 | **Calendar & agenda** | Cohort deadlines, events, meetings | Prefer **one server aggregation** the UI can trust: blueprint §19.3 asks for `GET /api/v1/calendar/:userId`; if the product currently exposes this under `agenda` or another path, **normalize** to blueprint or document the canonical route in `API_PARITY_MATRIX.md`. |
| 2.7 | **Check-ins** | Short daily check-in → Activity | Minimal POST + list UI. |
| 2.8 | **Interactive tour** | Joyride, first-run not fully ignorable | Blueprint §8; wire to “first visit” flag on user/profile. |

**Exit criteria:** With two users on a startup, task changes and presence show up in-office without refresh; a notification deep-link opens the right context; office still usable with sockets disabled (degraded polling).

---

## Phase 3 — Talent marketplace (ecosystem growth)

**Blueprint:** §9 (both sides), §6.14–6.18, §14 Talent + Interest + Invitations, atomic transition §9.

| Step | Feature | Implementation notes |
|------|---------|----------------------|
| 3.1 | **Talent profile** | Rich fields per §6.1 / talent profile model; edit + public/safe view. |
| 3.2 | **Startup posts** | Founder CRUD for `StartupPost`; list “opportunities” for talent. |
| 3.3 | **Interest & invitations** | `Interest` and `FounderTalentInvitation` flows; threaded `messages[]` if product requires; align URLs with §14. |
| 3.4 | **Inbox** | Sent/received unified UX (blueprint §9); all state changes go through API. |
| 3.5 | **Onboard (atomic)** | `POST …/interests/:interestId/onboard` (or equivalent canonical route) must run in a **transaction**: set `onboarded`, role → `team-member`, `startupId`, `TeamMemberProfile`, `Activity` type `join`, presence membership — **rollback on any failure** (blueprint §9). |
| 3.6 | **Smart match scores** | §9: skill overlap, availability, experience fit, industry preference — implement as pure function on server (testable), return from browse/match endpoints; show consistently founder ↔ talent. |
| 3.7 | **TalentApplication & SavedItem** | Formal apply + bookmarks per §6.17–6.18 if not already complete end-to-end. |

**Exit criteria:** Talent can discover → express interest → founder accepts → **atomic** onboard → new team member appears in office and execution loop.

---

## Phase 4 — Organisation layer (B2B cohort OS)

**Blueprint:** §10, §6.8–6.13, §14 org/cohort/invitation routes, `requireOrgAdmin`.

| Step | Feature | Implementation notes |
|------|---------|----------------------|
| 4.1 | **Org CRUD & admins** | Organisation + `OrganizationAdmin`; all mutations guarded. |
| 4.2 | **Cohorts** | Create/list/detail; status and dates; destroy/archive per product rules. |
| 4.3 | **Cohort invitations** | Token URLs `?invitation=<token>`; accept → `CohortMembership`. |
| 4.4 | **Deliverables & submissions** | Org defines deliverables; founder submits; org reviews; align with §6.12–6.13. |
| 4.5 | **Mentors** | Assign mentors to founders or cohorts; access rules consistent with mentor middleware. |
| 4.6 | **Events & announcements** | Cohort-scoped comms; widgets named in blueprint §10 dashboard component list. |
| 4.7 | **Resource library** | Upload/list/download or link model — whatever MVP implies; org-only write, founder read within cohort. |
| 4.8 | **Cohort analytics dashboard** | Portfolio metrics Recharts-friendly from real aggregates (no fake numbers). |
| 4.9 | **Communication centre** | Cohort-wide messaging distinct from founder team hub if blueprint requires both. |

**Exit criteria:** Org admin never sees founder-only routes mixed in confusingly; founder cohort experience (deliverables, events, resources) works end-to-end for one pilot cohort.

---

## Phase 5 — Notifications, Google, and API completeness

**Blueprint:** §16 (unread), §19.1–19.3, §14 “Other”, alignment orphan segments.

| Step | Topic | Notes |
|------|--------|------|
| 5.1 | **Notifications** | Blueprint §19.1 is **outdated** relative to current Express (`notifications` routes exist). Close the **intent gap**: typed triggers (`task-assigned`, `weekly-outcome-reminder`, `task-blocked`, `weekly-review-reminder`, `streak-at-risk`) from domain events, delivery reliability (queue already aligned with prior work — extend rather than duplicate). |
| 5.2 | **Google OAuth & Meet** | §19.2: implement authorize/callback, persist tokens per user, Meet create/instant endpoints; keep UI behind feature flag until tokens work. |
| 5.3 | **Calendar canonical URL** | Either implement `GET /api/v1/calendar/:userId` per §19.3 or formally alias blueprint to existing `agenda` route and update blueprint text once. |
| 5.4 | **Client–server segment gaps** | Alignment smoke allowlist today includes: `compensation`, `compensation-contracts`, `compensation-status`, `meetings`, `memberships`, `onboard-team-member`, `performance`, `startups`. For each: **implement** real routes + migrate client **or** remove dead client calls **or** ticket explicitly with reason in `API_PARITY_MATRIX.md` and shrink allowlist. |

**Exit criteria:** No silent “works in UI only” calls; orphan list trends toward zero; calendar and meetings story coherent with Virtual Office §8.

---

## Phase 6 — Design system, acquisition surfaces, and polish

**Blueprint:** §4 (audiences), §12 URL entry points, §22–23 (beta, design system), §17 (free forever — no gating).

| Step | Work |
|------|------|
| 6.1 | **Landing / query routes** — `?aspiring=true`, `?execution=true`, `?accelerator=true`, invitations, challenge page: each loads the correct entry experience and auth path. |
| 6.2 | **Mobile** — Critical flows usable on small viewports (§23.5). |
| 6.3 | **Empty states** — Motivating copy + one clear CTA (§23.6). |
| 6.4 | **Execution challenge** — If still in GTM (§22), wire metrics (week-2 retention, etc.) to smallest honest instrumentation. |
| 6.5 | **“Free forever” audit** — No accidental paywalls on §17-listed capabilities. |

---

## Explicitly out of scope for this plan (blueprint agrees)

| Item | Blueprint ref | Action |
|------|----------------|--------|
| Payments / Stripe | §19.4 | Do not build until post-beta. |
| AI execution coach | §19.6, §18 | Do not build in beta. |
| Premium / investor / unlimited seats | §18, §4 Audience 3 | Future phases only. |
| “Blueprint §11 stack” (TS, TanStack Query, Zustand, Axios) | §11–12 | Optional migration **only** if team chooses; not required for MVP completeness. |

---

## Suggested sequencing (summary)

1. **Phase 0** — Security and gates.  
2. **Phase 1** — Weekly loop + activities + score (nothing else matters if this is weak).  
3. **Phase 2** — Virtual Office (makes loop *felt* by the team).  
4. **Phase 3** — Talent marketplace + atomic onboard.  
5. **Phase 4** — Organisation cohort OS.  
6. **Phase 5** — Notifications polish, Google, calendar URL parity, API orphan closure.  
7. **Phase 6** — GTM surfaces, mobile, polish, free-forever audit.

---

## “Done” definition for the MVP described in the blueprint

The project is in a good **MVP-complete** posture when:

- A **founder** and **two team members** can run the **full weekly loop** (§7) with immutable outcomes and accurate execution score (§6.6).  
- The **Virtual Office** (§8) gives shared presence, activity, tasks, hub, wins, calendar/check-ins without socket-hard dependency.  
- **Talent** can join via marketplace flows through **atomic** onboard (§9).  
- At least one **organisation** can run a **cohort** with invitations, deliverables, and founder participation (§10).  
- **Admin** and **org** permissions are enforced server-side (§15, §19.5).  
- Alignment + manual QA gates pass; **blueprint §19** either implemented or consciously superseded with matrix/README notes.

After that, treat **premium**, **payments**, and **AI** as separate product programs (blueprint §18–20), not as hidden scope inside MVP tickets.
