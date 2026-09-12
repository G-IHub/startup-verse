# StartupVerse — Agent Orchestration Architecture
### Turning the Agent Workroom from a mockup into a real, live system

This document sketches the actual data model and system architecture required to make the Agent Workroom (and everything wired to it — Approval Queue, Autonomy Settings, Audit Trail) genuinely live, rather than a scripted walkthrough.

The core principle: **every page we built is just a different view over one event log.** If we get that log and the orchestrator that writes to it right, the UI barely has to change.

---

## 1. Core data model

### 1.1 `agents` — the registry of AI staff
```
agent_id        text (pk)      e.g. "agent_dev", "agent_finance"
name            text           "AI Developer"
role            text           "Development"
capabilities    jsonb          ["write_code","open_pr","merge_pr","deploy_staging","deploy_prod"]
status          enum           idle | working | blocked
created_at      timestamp
```

### 1.2 `humans` — founders and team members
```
human_id        text (pk)
name            text           "James S."
role            text           "Engineering"
is_founder      bool
permissions     jsonb          ["approve_deploy_prod","publish_dns"]
```

### 1.3 `action_types` — the permission surface
Every distinct thing an agent can do is declared once, with its **fixed** risk category. This table is what makes "locked" actions actually locked — it's read by the orchestrator, not just the settings UI.
```
action_type_id      text (pk)     "send_payment", "merge_billing_code", "publish_content"
agent_id            fk -> agents
risk_category       enum          reversible | sensitive_locked | read_only
default_mode        enum          autonomous | ask_first
adjustable          bool          false for anything in sensitive_locked
approver_rule       text          "founder" | "role:marketing" | "role:engineering"
```
`sensitive_locked` rows (payments, contracts, external sends, billing-code merges) have `adjustable = false` — the Autonomy Settings UI simply refuses to render a toggle for these, enforced server-side, not just hidden client-side.

### 1.4 `autonomy_settings` — the adjustable subset
```
id              pk
action_type_id  fk -> action_types (must have adjustable = true)
mode            enum       autonomous | ask_first
updated_by      fk -> humans
updated_at      timestamp
```

### 1.5 `events` — the single source of truth
This is the table everything else is a view of.
```
event_id         uuid (pk)
timestamp        timestamp
actor_type       enum        agent | human | system
actor_id         text        fk -> agents.agent_id OR humans.human_id
action_type_id   fk -> action_types
target_type      text        "pr", "invoice", "content", "message_batch", "sprint_plan"
target_id        text
payload           jsonb       action-specific detail (diff, message text, amount, etc.)
status           enum        autonomous_completed | pending_approval | approved | declined | human_completed
approver_id      fk -> humans (nullable until resolved)
parent_event_id  uuid (nullable, self-fk)   -- the handoff chain
startup_id       fk -> startups
```
`parent_event_id` is what lets the Workroom draw "A handed off to B" arrows — it's just parent/child traversal over this table, not a separate concept.

### 1.6 `tasks` — the thing being handed off
A lightweight wrapper so multiple events (opened → reviewed → merged → deployed) can be grouped as one visible thread in the UI.
```
task_id         uuid (pk)
title           text        "Landing page hero rebuild"
startup_id      fk
status          enum        open | blocked | done
current_owner   text        agent_id or human_id
milestone_id    fk -> milestones (nullable)
```

### 1.7 `integrations` — connected external systems
```
integration_id   pk
provider         text        "stripe","github","docusign","whatsapp"
startup_id       fk
scopes           jsonb       ["read_balance","create_invoice"]
credentials_ref  text        pointer to secrets vault, never raw creds in this table
connected_by     fk -> humans
status           enum        connected | disconnected
```

---

## 2. The orchestrator

The orchestrator is the only thing allowed to call `agents` into action and the only thing allowed to write to `events`. No agent talks to an external API or to another agent directly — everything routes through here. This is what makes enforcement real instead of decorative.

**Decision loop, every time an agent wants to do something:**

```
1. Agent proposes an action:
   { agent_id, action_type_id, target, payload }

2. Orchestrator looks up action_types row for that action_type_id
   → risk_category, default_mode/current autonomy_settings, approver_rule

3. Branch:
   a) risk_category = sensitive_locked
        → ALWAYS create event with status = pending_approval
        → resolve approver via approver_rule (founder, or role:marketing → look up
          the human currently holding that role for this startup)
        → notify that approver (Approval Queue + push notification)
        → STOP. Do not execute anything yet.

   b) risk_category = reversible AND current mode = ask_first
        → same as (a): pending_approval, but this is adjustable, so re-check
          autonomy_settings on every call, not just at agent startup

   c) risk_category = reversible AND current mode = autonomous
        → execute immediately via the relevant integration adapter
        → write event with status = autonomous_completed
        → check task graph: does this completion unblock a dependent task?
          if yes, notify the next agent/human and create the next event
          with parent_event_id pointing back to this one

   d) risk_category = read_only
        → always executes, always autonomous, event logged for audit only
```

**Approval resolution** (when a human clicks Approve/Decline in the Approval Queue):
```
1. Update the pending event: status = approved | declined, approver_id, resolved_at
2. If approved → orchestrator now actually executes the original action
   via the integration adapter (this is the point where money moves,
   the email sends, the PR merges — not before)
3. Write a new event for the execution itself, parent_event_id = the approval event
4. Propagate to any blocked downstream tasks
```

This is why, in the mockup, "AI Sales escalates → founder approves → messages send" is three separate log lines, not one. That's not a UI choice — it's the actual sequence of writes a real system would need.

---

## 3. Enforcement layer (why this can't be bypassed)

- **Integration adapters are the only code with real credentials.** An agent never sees a Stripe key. It calls the orchestrator's internal API; the orchestrator calls the adapter; the adapter holds the scoped credential from `integrations.credentials_ref`.
- **`sensitive_locked` is enforced at the orchestrator, not the frontend.** Even if someone crafted a request that skipped the Autonomy Settings UI entirely, the orchestrator's own lookup of `action_types.adjustable` would still force it into `pending_approval`.
- **Idempotency keys** on every executed action (especially `send_payment`, `send_message_batch`) so a retried or duplicated orchestrator call can't send the same invoice twice.
- **Scoped, revocable credentials per integration** — disconnecting in the Integrations Hub should immediately invalidate the adapter's ability to act, mid-flight if necessary.

---

## 4. Making it live in the browser

- **Event bus**: Postgres `LISTEN/NOTIFY` is enough at this scale (one startup's worth of activity); Kafka/Redis Streams only becomes worth it once you're running this across thousands of startups concurrently.
- **Push layer**: a WebSocket (or SSE) gateway subscribed to the event bus, filtered per `startup_id`, pushing new/updated rows to connected clients.
- **Client-side**, each page becomes a thin subscriber over the same stream, not a separately-maintained mockup:
  - **Agent Workroom** — renders `events` joined to `tasks`, grouped by `parent_event_id` chains, live-appending as they arrive
  - **Approval Queue** — a filtered view: `WHERE status = 'pending_approval' AND approver_id = current_user`
  - **Audit Trail** — the full `events` table, paginated, exportable
  - **Autonomy Settings** — reads/writes `autonomy_settings`, with `action_types.adjustable = false` rows rendered as locked, not just styled that way

---

## 5. The PR #14 story, mapped to this model

To ground it — here's the actual sequence of writes the "6:02am–8:15am" mockup narrative would generate for real:

| Time | Event written | status | parent_event_id |
|---|---|---|---|
| 6:02 | `agent_dev` → `open_pr`, target=PR#14 | autonomous_completed | — |
| 6:14 | `agent_designer` → `review_assets`, target=PR#14 | autonomous_completed | ↑ event 1 |
| 6:22 | `agent_dev` → `merge_and_deploy_staging` | autonomous_completed | ↑ event 2 |
| 6:22 | `agent_dev` → `deploy_prod` (mode=ask_first, approver_rule=role:engineering → James) | pending_approval | ↑ event 3 |
| 7:03 | `james_s` → resolves event 4 | approved → human_completed | ↑ event 4 |
| 7:40 | `agent_marketing` → `draft_outreach` | autonomous_completed | — |
| 7:47 | `agent_sales` → `personalize_and_queue` | autonomous_completed | ↑ event 6 |
| 7:52 | `agent_sales` → `send_message_batch` (risk=sensitive_locked) | pending_approval | ↑ event 7 |

Nothing about the UI changes here — this is the exact shape the Agent Workroom already renders. The only difference is these rows come from real agent behavior instead of hand-written HTML.

---

## 6. What's genuinely hard (the part APIs don't solve)

Wiring GitHub, Stripe, and WhatsApp is the *easy* 80%. The unsolved 20% — the actual reason multi-agent orchestration is a hard problem industry-wide right now:

- **Reliable task completion signals.** An agent needs to correctly know when it's actually done, not just believe it's done. A false "autonomous_completed" event is worse than a slow one.
- **Handoff correctness.** Deciding which agent gets notified next, and with what context, is itself a judgment call an orchestrator (possibly LLM-driven) has to make — this isn't a fixed workflow diagram once real variability enters.
- **Drift and hallucination compounding across a chain.** Five autonomous steps deep, small misunderstandings from step one can silently corrupt step five. This is exactly why the Audit Trail and Approval Queue matter more than they'd seem to on paper.
- **Recovering from a stuck or looping agent** without a human having to babysit every task.

These are the problems worth spending real engineering time on — everything in sections 1–4 above is comparatively standard backend work.

---

## 7. Suggested build order

1. `events` table + orchestrator's core decision loop (sections 1.5, 1.3, 2) — get real writes happening for *one* agent (AI Developer, since GitHub's API is the most mature integration point) before touching the rest.
2. Enforcement layer for `sensitive_locked` actions — build this before adding a second agent, since it's the part that protects you if something goes wrong.
3. Event bus + WebSocket push — swap the Workroom's static HTML for a live subscriber.
4. Add agents one at a time (Sales → Finance → Legal → Marketing), each forcing you to define its `action_types` rows honestly before it goes live.
5. Approval Queue and Audit Trail become nearly free once step 1–3 exist — they're just different filters on `events`.
