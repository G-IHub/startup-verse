# StartupVerse — AI Agent System Roadmap

**Status as of 2026-09-13:** Phase 0 done and verified live (event log, orchestrator, and 3 of the 4 real-data pages — see the phase section below for what's still mock and why). Phase 1's first agent is now **AI Developer via GitHub**, not Zikorail — see "Zikorail integration" below for why that pivot happened. Phase 1 not started. This file is the plan to close that gap in deliberate, checkpointed phases, not all at once.

**Source documents** (read these before touching this system — this file is the working summary, they're the reasoning):
- [ai-agent-vision-writeup.md](ai-agent-vision-writeup.md) — the actual product bet: the trust/control layer is the moat, not agent capability.
- [ai-agent-orchestration-architecture.md](ai-agent-orchestration-architecture.md) — the data model and orchestrator decision loop. Written in Postgres terms; **this roadmap corrects it for our actual stack** (Mongo/Express/Socket.IO) — see "Stack corrections" below.

---

## The one-line bet, restated

> A founder describes what they want to build. AI staff run the company — coding, marketing, selling, invoicing, contracting — while the founder approves only the handful of decisions that actually need a human.

The defensible part is **not** "AI agents that do work" (commodity — Devin, Cognition, every model vendor has this). It's the **trust and control layer**: an Approval Queue aggregating every pending decision, a per-agent per-action-type Autonomy Dial (not one switch), an immutable Audit Trail, human-*role* routing (not everything defaults to the founder), and **hard-locked categories** — money, contracts, external messages — that cannot be made autonomous by anyone, including the founder. Every phase below exists to make that layer real, not to make agents smarter.

---

## Model strategy (decided 2026-09-12)

- **DeepSeek powers agent work** — coding, drafting, building, personalizing outreach — for every agent, including AI Developer building end-to-end app/web/mobile work. Confirmed decision, not a default-until-proven-otherwise.
- **Why this is safe despite being a cheaper model:** the trust layer, not the model, carries the safety burden. Two real gates around AI Developer's work specifically:
  1. **Sprint/task plan approval** (human approves *what* gets built, via AI PM's sprint proposal) — one review per week/cycle, not per commit.
  2. **Production deploy stays hard-locked** (`ask_first`, routed to whoever holds the Engineering role) — nothing DeepSeek builds reaches a real user without a human looking at it first, typically via Product Viewer.
  - Between those two gates — writing code, opening PRs, deploying to staging — is autonomous. This matches the PR #14 example already worked out in the architecture doc (`merge_and_deploy_staging` = autonomous, `deploy_prod` = locked).
  - **Real constraint on sprint size, not a new rule**: keep sprints scoped the way AI PM's own mockup already does (a handful of milestones/week), not "build the whole app in one autonomous run" — the more that happens between the two gates, the more compounding-drift risk accumulates before a human ever sees it.
- **A stronger/more reliable model is reserved for the orchestrator's own decision logic** — classifying an action as locked vs. adjustable, resolving `approver_rule` to the right human, deciding agent handoffs. Low token volume, but this is what the entire pitch's credibility rests on (Section 4 of the vision doc) — don't optimize this on cost.
- **Model choice is a config value the orchestrator passes to each agent call, never hardcoded** into agent logic/prompts. Swapping models later is a settings change, not a rearchitecture.

---

## Zikorail integration — investigated 2026-09-13, reversed: NOT the first agent

The 2026-09-12 plan below (kept for the record, not deleted) assumed Zikorail was a stable, callable, wholly-owned asset that AI Sales/Marketing could integrate with directly. A full read of the actual Zikorail codebase (`C:\Users\Owner\Documents\WhatsApp Agent`, ground-truthed against the freshest production pulls, not its stale local files) found four independent blockers, each sufficient on its own to defer this:

1. **No callable API exists.** The "Zikorail-Core" extraction that would make the engine a service another product can call is explicitly `PARKED — do not build yet` in Zikorail's own `zikorail-core/PLAN.md`, gated on a trigger ("20–30 paying workspaces") that hasn't been hit. Every endpoint today is session-cookie auth for Zikorail's own web app — no API keys, no partner contract, no versioning.
2. **WhatsApp onboarding isn't reliably solved even for Zikorail's own team.** Only 4 of 19 active Zikorail workspaces have completed migration to the compliant Meta Cloud API; the other 15 (including Zikorail's own alert-sender) currently have **no working WhatsApp channel at all**. The unofficial transport used historically (Baileys, not whatsapp-web.js as originally assumed) got two real workspaces **permanently banned by Meta** — one of them Zikorail's highest-volume account (~26k contacts) — for exactly the bulk/cold-outreach pattern `send_message_batch` was designed around. The compliant path has its own fresh friction: a test Facebook account was permanently banned by Meta during onboarding testing this same month.
3. **The platform is mid-firefight, not steady-state.** Recent real incidents: a cost-overrun bug, an internal cost-tracking table silently broken for three months, a recurring "missing await" bug class, an autonomous review engine that silently stopped and was never diagnosed, a `git checkout` accident that wiped a route file, and zero automated tests anywhere (every fix verified live in production). Not a reason to judge the work — it's a fast-moving real business — but not a foundation to launch a second product's first real agent on.
4. **Ownership/IP is unresolved on paper.** Every Zikorail doc names the owner as Genomac Holdings Limited and never mentions StartupVerse. Its IP inventory explicitly recommends NDAs before any additional product touches the codebase — unchecked as of this writing. Independent of findings 1–3, but worth resolving before revisiting this.

**Decision:** AI Sales/Marketing via Zikorail is deferred, not cancelled — see the "Deferred" section below. **AI Developer via GitHub is now the Phase 1 agent** (see below), since it has a real, stable, versioned public API, no ban risk, no cross-company IP question, and is fully inside StartupVerse's own control. If a WhatsApp sales agent is still wanted later, the plan is a small, StartupVerse-owned, compliant Meta Cloud API integration built from scratch (Zikorail's own `whatsapp-cloud.js` is a ~200-line reference for the pattern) — reusing the *trust-pattern insight* Zikorail validated, not its code or its infrastructure.

<details>
<summary>Original 2026-09-12 plan (superseded, kept for the record)</summary>

- We own Zikorail. It already runs DeepSeek in production for real customer conversations and already implements the exact trust pattern this product is built around (payment-confirmation escalation before anything charges, "Intelligent Handoff" to a human for sensitive conversations).
- **AI Sales/Marketing is the first agent to go real**, specifically because of this — not because it's the easiest integration (the architecture doc's own suggestion was AI Developer/GitHub for that reason), but because Zikorail gives it a working reference implementation and real distribution, per the vision doc's already-settled plan.
- Since we own it, `send_message_batch` becomes a **direct internal call into Zikorail**, not a generic third-party adapter — a real simplification versus the architecture doc's generic "integration adapter" framing.
- **Open item, not yet verified — check before Phase 1 ships**: confirm Zikorail's cold-outreach path (unsolicited messages to clinics that never messaged first) is actually running through Meta's official WhatsApp Business API with approved templates, not a QR-linked number. This is a Meta policy enforcement issue (bans numbers for unsolicited outbound at volume), not a business decision — ownership doesn't exempt us from it.
- **Open item — access**: this session has no read access to Zikorail's codebase or API surface. Before writing the adapter, get either repo access or a written contract (endpoints, auth, message-status webhooks).

*(Both open items above are now resolved by the 2026-09-13 investigation: access was obtained and read; the compliance question's answer was worse than "unverified" — see findings above.)*
</details>

---

## Stack corrections to the architecture doc

The architecture doc is written assuming Postgres. Real, already-learned constraints for our actual Mongo/Express/Socket.IO stack:

- **No Postgres LISTEN/NOTIFY.** Don't reach for MongoDB Change Streams as the "obvious" Mongo equivalent either — **Change Streams require a replica set**, and local dev MongoDB runs standalone. This is the exact same class of bug already hit and fixed this session (`session.withTransaction()` failing locally for the same reason, in `offers.controller.js`'s acceptance flow). **Use the event bus we already have**: `emitRealtime()` + Socket.IO rooms per `startupId`, already powering presence/activity/chat throughout the app. Publish orchestrator writes onto this existing bus instead of introducing new infrastructure.
- **Avoid Mongo multi-document transactions for orchestrator writes**, for the same standalone-replica-set reason. Sequential awaits with idempotency keys (per the architecture doc's own Section 3) are the safer default in this environment, matching the pattern already fixed in `acceptInvitationByToken`/`updateOfferStatus`.
- The doc's tables map to new Mongoose models 1:1 conceptually (`agents`→`Agent`, `humans`→ reuse existing `User`, `action_types`→`ActionType`, `autonomy_settings`→`AutonomySetting`, `events`→`Event`, `tasks`→`Task`, `integrations`→`Integration`). No schema redesign needed, just a Mongo-shaped implementation of the same model.

---

## Phase 0 — Foundation: the event log and orchestrator skeleton
**Goal:** prove the plumbing with zero real agents. Every AI Staff page becomes a real (if empty) view over real data instead of hardcoded arrays.
**Done when:** a seeded test event shows up live in Approval Queue / Audit Trail / Workroom without a page refresh, end to end.

**✅ Confirmed done, 2026-09-12** — verified live: seeded a real test agent ("AI Sales") with a `sensitive_locked` and a `reversible` action type via the real REST endpoints (not a direct-to-DB script — that matters, see the live-push bug below), proposed both, watched the `sensitive_locked` one land in Approval Queue and the `reversible` one land straight in Audit Trail as `autonomous_completed`, approved the pending one and watched the resulting `approved` + `human_completed` rows appear as two separate log lines with no page refresh, flipped the adjustable action type's autonomy setting and confirmed the locked one still rejects the same PATCH with a 403, then deleted all test data. Everything below is checked off on that basis.

- [x] `Agent` model (id, name, role, capabilities, status) — `server/src/models/Agent.js`
- [x] `ActionType` model (id, agentId, riskCategory: reversible/sensitive_locked/read_only, defaultMode, adjustable, approverRule) — `server/src/models/ActionType.js`
- [x] `AutonomySetting` model (actionTypeId, mode, updatedBy, updatedAt) — reject writes where the target `ActionType.adjustable === false`, server-side — `server/src/models/AutonomySetting.js`, enforced in `agentOrchestration.controller.js`'s `updateAutonomySetting`
- [x] `AgentEvent` model (actorType, actorId, actionTypeId, targetType, targetId, payload, status, approverId, parentEventId, startupId) — the source of truth. Named `AgentEvent`, not `Event` — this codebase already has an unrelated calendar/cohort `Event` model.
- [x] `AgentTask` model (title, startupId, status, currentOwner, milestoneId) — schema only for now, see note below. Named `AgentTask` for the same collision reason.
- [x] `orchestrator.service.js` — the only code allowed to write to `AgentEvent`. Implements the 4-branch decision loop from the architecture doc Section 2.
- [x] Real endpoints: propose an action, list/filter events, resolve a pending approval — `server/src/routes/agentOrchestration.routes.js`
- [x] Publish new/updated `AgentEvent` rows via existing `emitRealtime()` — **not** per-startup Socket.IO rooms as originally written here; the founder's own `userRoom()` instead, since approvals are founder-scoped, not startup-scoped, in Phase 0. See "Stack corrections" below for why Socket.IO over Change Streams in the first place.
- [x] Rewire `V2ApprovalQueue.jsx` to read `AgentEvent` where `status = pending_approval`, live-updating
- [x] Rewire `V2AuditTrail.jsx` to read the full `AgentEvent` history
- [x] Rewire `V2AutonomySettings.jsx` to read/write real `AutonomySetting` rows, with `adjustable: false` rows rendered as genuinely locked (not just styled that way) — confirmed the server-side 403 actually fires, not just a disabled button
- [ ] Rewire `V2AgentWorkroom.jsx`'s coordination feed to render real `AgentEvent`/`AgentTask` chains via `parentEventId` traversal — **deliberately deferred**, see note below
- [x] Seed a synthetic test agent + test events to verify the whole loop before any real agent exists

**Real bug found and fixed during this verification**: the first version of `publishEvent()` in `orchestrator.service.js` emitted a DTO with a bare `actionTypeId` string, not the populated action-type/agent info the REST list endpoints return. A live-pushed event rendered as "Unknown agent" / a generic title until the next refetch — the data was correct in the DB, only the live broadcast was thin. Fixed by having `publishEvent()` populate `actionTypeId` (and its `agentId`) before building the DTO, so a live push and a REST fetch now render identically. Caught by testing the live-push path through the real running server via its REST endpoint (`curl` against `/agent-events/propose`) rather than a standalone Node script — a standalone script has no live Socket.IO server in-process, so `emitRealtime()` silently no-ops there; that's a testing-methodology note for next time, not an app bug.

**Scope note, not yet raised with the user before this pass — flagging here per SOP**: only the event-driven pages (Approval Queue, Autonomy Settings, Audit Trail) were rewired to real data this pass. The 4 agent-specific illustrative workspace pages (`V2AIFinanceWorkspace.jsx`, `V2AILegalWorkspace.jsx`, `V2AIMarketingWorkspace.jsx`, `V2AISalesWorkspace.jsx`) and `V2AIStaffManage.jsx`'s hired-roster mock content were deliberately left untouched — they need Phase 1's real integrations to have any real content, and rewiring them now to point at an empty event log would just make them look broken rather than more real. `V2AgentWorkroom.jsx`'s coordination feed was left mock for the same reason plus time — its "while you were away" narrative needs real coordinated activity to summarize, which doesn't exist until Phase 1.
**Real, expected behavior change**: with real agents/events now driving Approval Queue, Autonomy Settings, and Audit Trail, and zero real agents existing yet, all three pages now show genuinely empty states ("Queue clear ✓", "No agents yet", "No activity logged yet") instead of the rich mock content they showed before this pass. This is the correct Phase 0 outcome, not a regression — it fills in the moment Phase 1 ships a real agent.

## Phase 1 — One agent, fully real: AI Developer → GitHub
**Goal:** one real founder decision causes one real external effect, safely.
**Done when:** a founder approves a real sprint/task plan, AI Developer autonomously opens a real PR and deploys it to a real staging environment on a real (test) repo, and a production deploy attempt is forced into `pending_approval` regardless of autonomy setting — logged as real `AgentEvent` rows, visible live in Approval Queue/Audit Trail with no page refresh.

**Changed 2026-09-13**: this phase was originally scoped as AI Sales/Marketing via Zikorail — reversed after investigation, see "Zikorail integration" above. AI Developer/GitHub was the architecture doc's own original suggestion for the first agent, precisely because it doesn't depend on a third-party consumer platform's stability, ban risk, or API availability.

- [ ] Choose/create a real (test) GitHub repo + a GitHub App or PAT scoped to it — this is StartupVerse's own integration, not borrowed infrastructure
- [ ] Define real `ActionType` rows: `write_code`/`open_pr` (reversible/autonomous), `deploy_staging` (reversible/autonomous), `deploy_prod` (**sensitive_locked**, `adjustable: false`, `approverRule: role:engineering`)
- [ ] Build the GitHub adapter (`services/githubAdapter.js` or similar) — real API calls (open PR, merge, trigger a staging deploy), not mocked responses
- [ ] Wire AI Developer's agent logic to call DeepSeek for the actual code-writing/drafting, model passed as config per the model strategy above
- [ ] Sprint/task-plan approval sits one level above per-commit autonomy — a human approves the plan (via AI PM, see Phase 3) once per cycle, not every PR
- [ ] Idempotency key on `deploy_staging`/`deploy_prod` so a retried orchestrator call can't double-deploy
- [ ] `V2AIStaffManage.jsx`'s AI Developer card and any dedicated workspace page read real PR/deploy data instead of static mock arrays
- [ ] End-to-end verification on a real (test) repo before calling this phase done

## Phase 2 — Enforcement hardening
**Goal:** "locked" is a server-side guarantee, not a UI convention.
**Done when:** a crafted API request attempting to bypass Autonomy Settings for a locked action type is still forced into `pending_approval` by the orchestrator itself.

- [ ] Server-side rejection of any attempt to set `mode: autonomous` on an `adjustable: false` action type, independent of what the client sends
- [ ] Idempotency keys extended to every executable action type, not just messaging
- [ ] Real connect/disconnect in `V2Integrations.jsx` that actually revokes the adapter's credential access, including mid-flight
- [ ] Scoped, revocable credentials per integration stored via a secrets vault reference, never raw keys in the `Integration` document

## Phase 3 — Add agents one at a time
**Goal:** each new agent is proven real before the next one starts, per the vision doc's explicit risk call ("prove one agent before expanding" over shipping seven shallow agents at once).
**Done when:** each listed agent has real `ActionType` rows, a real integration (or honestly none, if out of scope), and at least one real end-to-end approval→execution loop verified live.

- [ ] **AI Product Manager** — sprint-plan proposal flow feeding the Execution Engine for real, becoming the actual upstream gate for AI Developer's work (AI Developer itself moved to Phase 1, 2026-09-13)
- [ ] **AI Finance** — real ledger/invoice actions; `send_payment`/`send_invoice` **sensitive_locked**, non-adjustable, always escalates regardless of DeepSeek or any model's confidence
- [ ] **AI Legal** — real document drafting from templates; any `send_document`/`publish_contract` action **sensitive_locked**
- [ ] **AI Growth Analyst** — read-only category; safe to run fully autonomous from day one since nothing it does executes an external effect
- [ ] **AI Sales/Marketing** — moved here from Phase 1, 2026-09-13 (see "Zikorail integration" above). Channel is now a small, StartupVerse-owned Meta WhatsApp Cloud API integration built from scratch, not Zikorail — `send_message_batch` stays **sensitive_locked**/non-adjustable regardless of channel

## Phase 4 — The hard part (design pass, not a checklist to rush)
**Goal:** name and design against the failure modes before they show up in production, since none of these are solved by adding more integrations.
**Not "done" in the checkbox sense — revisit this section after Phase 1 generates real failure data.**

- [ ] Reliable task-completion signals — an agent correctly knowing it's done, not just claiming to be
- [ ] Handoff correctness — which agent/human gets notified next, with what context, as real variability enters (not a fixed workflow diagram)
- [ ] Drift/hallucination compounding across multi-step autonomous chains — the Audit Trail and Approval Queue are the mitigation, not a cure
- [ ] Stuck/looping agent recovery without a human having to babysit every task

---

## Deferred / explicitly out of scope for now
(Not forgotten — listed so nobody assumes silence means "already planned.")
- **Any direct technical integration with Zikorail** — deferred 2026-09-13 per the investigation above (no callable API, unreliable WhatsApp onboarding even for Zikorail's own team, active operational firefighting, unresolved ownership/IP question). Not ruled out forever — revisit only if Zikorail's own Core extraction ships and the ownership question is resolved; don't restart this by default just because time has passed.
- Blueprint submission/creator flow
- Surfacing the Approval Queue directly on the Founder Dashboard
- The full "13 AI staff roles" bundle beyond the agents listed in Phase 3
- V2 talent-side experience (tracked separately — see CLAUDE.md, deliberately sequenced after founder-side V2 work)

---

## How to use this file
- Check items off (`- [x]`) as they're actually verified live, not when code is merged — matches this project's standing "nothing is done until verified working" rule.
- Add a dated note under the relevant phase when a real decision changes (model swap, agent reordering, a Zikorail constraint discovered) — don't silently edit past decisions away.
- When a phase's "Done when" condition is met, add a dated confirmation line under that phase header before moving on.
