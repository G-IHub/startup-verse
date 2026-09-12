# StartupVerse — AI Agent System Roadmap

**Status as of 2026-09-12:** Phase 0 not started. Everything under "AI Staff" in the app today (`/v2/ai-staff`) is a fully interactive, real UI with **zero backend** — no event log, no orchestrator, no real agent, no real integration. This file is the plan to close that gap in deliberate, checkpointed phases, not all at once.

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

## Zikorail integration (decided 2026-09-12)

- We own Zikorail. It already runs DeepSeek in production for real customer conversations and already implements the exact trust pattern this product is built around (payment-confirmation escalation before anything charges, "Intelligent Handoff" to a human for sensitive conversations).
- **AI Sales/Marketing is the first agent to go real**, specifically because of this — not because it's the easiest integration (the architecture doc's own suggestion was AI Developer/GitHub for that reason), but because Zikorail gives it a working reference implementation and real distribution, per the vision doc's already-settled plan.
- Since we own it, `send_message_batch` becomes a **direct internal call into Zikorail**, not a generic third-party adapter — a real simplification versus the architecture doc's generic "integration adapter" framing.
- **Open item, not yet verified — check before Phase 1 ships**: confirm Zikorail's cold-outreach path (unsolicited messages to clinics that never messaged first) is actually running through Meta's official WhatsApp Business API with approved templates, not a QR-linked number. This is a Meta policy enforcement issue (bans numbers for unsolicited outbound at volume), not a business decision — ownership doesn't exempt us from it.
- **Open item — access**: this session has no read access to Zikorail's codebase or API surface. Before writing the adapter, get either repo access or a written contract (endpoints, auth, message-status webhooks).

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

- [ ] `Agent` model (id, name, role, capabilities, status)
- [ ] `ActionType` model (id, agentId, riskCategory: reversible/sensitive_locked/read_only, defaultMode, adjustable, approverRule)
- [ ] `AutonomySetting` model (actionTypeId, mode, updatedBy, updatedAt) — reject writes where the target `ActionType.adjustable === false`, server-side
- [ ] `Event` model (actorType, actorId, actionTypeId, targetType, targetId, payload, status, approverId, parentEventId, startupId) — the source of truth
- [ ] `Task` model (title, startupId, status, currentOwner, milestoneId)
- [ ] `orchestrator.service.js` — the only code allowed to write to `Event`. Implements the 4-branch decision loop from the architecture doc Section 2.
- [ ] Real endpoints: propose an action, list/filter events, resolve a pending approval
- [ ] Publish new/updated `Event` rows via existing `emitRealtime()` + per-startup Socket.IO rooms
- [ ] Rewire `V2ApprovalQueue.jsx` to read `Event` where `status = pending_approval AND approverId = currentUser`, live-updating
- [ ] Rewire `V2AuditTrail.jsx` to read the full paginated `Event` history
- [ ] Rewire `V2AutonomySettings.jsx` to read/write real `AutonomySetting` rows, with `adjustable: false` rows rendered as genuinely locked (not just styled that way)
- [ ] Rewire `V2AgentWorkroom.jsx`'s coordination feed to render real `Event`/`Task` chains via `parentEventId` traversal
- [ ] Seed a synthetic test agent + test events to verify the whole loop before any real agent exists

## Phase 1 — One agent, fully real: AI Sales/Marketing → Zikorail
**Goal:** one real founder decision causes one real external effect, safely.
**Done when:** a founder clicks Approve on a real pending outreach batch in Approval Queue, and a real WhatsApp message actually sends via Zikorail — logged as two real `Event` rows (escalation, then execution).

- [ ] Get Zikorail codebase access or a written integration contract (endpoints, auth, message-status webhooks)
- [ ] Verify Zikorail's cold-outreach path uses the official WhatsApp Business API with approved templates (compliance go/no-go)
- [ ] Define real `ActionType` rows: `personalize_outreach` (reversible/autonomous), `send_message_batch` (**sensitive_locked**, `adjustable: false`)
- [ ] Build the Zikorail adapter as a direct internal call (not a generic third-party wrapper)
- [ ] Wire AI Marketing/Sales's agent logic to call DeepSeek for drafting/personalization, model passed as config
- [ ] Idempotency key on `send_message_batch` so a retried orchestrator call can't double-send
- [ ] `V2AIMarketingWorkspace.jsx`/`V2AISalesWorkspace.jsx` read real pipeline/outreach data instead of static mock arrays
- [ ] End-to-end verification with a real (test) WhatsApp number before calling this phase done

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

- [ ] **AI Developer** — GitHub adapter; `write_code`/`open_pr`/`deploy_staging` autonomous, `deploy_prod` locked (`ask_first`, approverRule: `role:engineering`); sprint-plan approval sits one level above via AI PM; DeepSeek-powered per the model strategy above
- [ ] **AI Finance** — real ledger/invoice actions; `send_payment`/`send_invoice` **sensitive_locked**, non-adjustable, always escalates regardless of DeepSeek or any model's confidence
- [ ] **AI Legal** — real document drafting from templates; any `send_document`/`publish_contract` action **sensitive_locked**
- [ ] **AI Product Manager** — sprint-plan proposal flow feeding the Execution Engine for real, becoming the actual upstream gate for AI Developer's work
- [ ] **AI Growth Analyst** — read-only category; safe to run fully autonomous from day one since nothing it does executes an external effect

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
- Blueprint submission/creator flow
- Surfacing the Approval Queue directly on the Founder Dashboard
- The full "13 AI staff roles" bundle beyond the agents listed in Phase 3
- V2 talent-side experience (tracked separately — see CLAUDE.md, deliberately sequenced after founder-side V2 work)

---

## How to use this file
- Check items off (`- [x]`) as they're actually verified live, not when code is merged — matches this project's standing "nothing is done until verified working" rule.
- Add a dated note under the relevant phase when a real decision changes (model swap, agent reordering, a Zikorail constraint discovered) — don't silently edit past decisions away.
- When a phase's "Done when" condition is met, add a dated confirmation line under that phase header before moving on.
