/**
 * orchestrator.service.js — Phase 0 of docs/ai-agent-roadmap.md.
 *
 * The only code allowed to write to AgentEvent. No agent talks to an
 * external API or another agent directly — everything routes through here,
 * which is what makes the "locked" enforcement real instead of decorative
 * (see docs/ai-agent-orchestration-architecture.md Section 2-3).
 *
 * Phase 0 has no real agent and no real integration adapters yet — this is
 * the decision loop and event-writing plumbing, proven with a seeded test
 * agent. Real adapters (Zikorail, GitHub, etc.) get called from the
 * `executeAction` stub added per-agent in later phases.
 */
import ActionType from "../models/ActionType.js";
import AutonomySetting from "../models/AutonomySetting.js";
import AgentEvent from "../models/AgentEvent.js";
import { emitRealtime } from "./realtime.service.js";
import { SOCKET_EVENTS } from "../realtime/events.js";
import { startupRoom, userRoom } from "../realtime/rooms.js";
import { logger } from "../config/logger.js";

/**
 * Resolves an approverRule string to a real human user id.
 * Phase 0 only resolves "founder" for real. "role:*" rules are accepted and
 * stored, but fall back to the founder with a warning — resolving a human by
 * job-title/role text is deferred until a real agent (Marketing/Sales, per
 * the roadmap) actually needs role-based routing. Not fabricated as if solved.
 */
function resolveApprover(approverRule, founderId) {
  if (!approverRule || approverRule === "founder") return founderId;
  if (approverRule.startsWith("role:")) {
    logger.warn(`[orchestrator] approverRule "${approverRule}" not yet resolvable by role — falling back to founder. See docs/ai-agent-roadmap.md.`);
    return founderId;
  }
  return founderId;
}

function publishEvent(event) {
  const dto = {
    id: String(event._id),
    founderId: String(event.founderId),
    startupId: event.startupId ? String(event.startupId) : null,
    actorType: event.actorType,
    actorId: event.actorId,
    actionTypeId: String(event.actionTypeId),
    targetType: event.targetType,
    targetId: event.targetId,
    payload: event.payload,
    status: event.status,
    approverId: event.approverId ? String(event.approverId) : null,
    parentEventId: event.parentEventId ? String(event.parentEventId) : null,
    createdAt: event.createdAt,
    resolvedAt: event.resolvedAt,
  };
  const rooms = [userRoom(event.founderId)];
  if (event.startupId) rooms.push(startupRoom(event.startupId));
  emitRealtime(SOCKET_EVENTS.AGENT_EVENT_UPDATED, dto, rooms);
  return dto;
}

/**
 * Step 1 of the decision loop: an agent (or the seed script, in Phase 0)
 * proposes an action. Branches on the ActionType's real risk category and
 * current autonomy mode. Never executes a sensitive_locked action here —
 * only ever logs it as pending_approval and stops, per the architecture
 * doc's Section 2.
 */
export async function proposeAction({ founderId, startupId, actorType, actorId, actionTypeId, targetType, targetId, payload, parentEventId = null }) {
  const actionType = await ActionType.findById(actionTypeId);
  if (!actionType) {
    const err = new Error("Unknown action type.");
    err.statusCode = 404;
    throw err;
  }

  let mode = actionType.defaultMode;
  if (actionType.adjustable) {
    const setting = await AutonomySetting.findOne({ actionTypeId: actionType._id });
    if (setting) mode = setting.mode;
  }

  const baseDoc = {
    founderId,
    startupId: startupId || null,
    actorType,
    actorId: String(actorId),
    actionTypeId: actionType._id,
    targetType,
    targetId: targetId || "",
    payload: payload || {},
    parentEventId,
  };

  // Branch a) sensitive_locked -> ALWAYS pending_approval, regardless of mode.
  // Branch b) reversible + ask_first -> pending_approval (re-checked live, not cached).
  if (actionType.riskCategory === "sensitive_locked" || (actionType.riskCategory === "reversible" && mode === "ask_first")) {
    const approverId = resolveApprover(actionType.approverRule, founderId);
    const event = await AgentEvent.create({ ...baseDoc, status: "pending_approval", approverId });
    const dto = publishEvent(event);
    return { event: dto, executed: false };
  }

  // Branch c) reversible + autonomous -> execute immediately.
  // Branch d) read_only -> always executes, always autonomous.
  // Phase 0 has no real integration adapters yet, so "execute" just means
  // "log it as done" — real adapters plug in here per-agent in later phases.
  const event = await AgentEvent.create({ ...baseDoc, status: "autonomous_completed" });
  const dto = publishEvent(event);
  return { event: dto, executed: true };
}

/**
 * A human resolves a pending_approval event (Approve/Decline in the queue).
 * If approved, this is the point where a real action would actually execute
 * via an integration adapter — Phase 0 has none, so it just marks the event
 * resolved. Writes a second event for the resolution, matching the
 * architecture doc's "escalation and execution are separate log lines"
 * design (Section 2, "Approval resolution").
 */
export async function resolveApproval({ eventId, decision, approverId }) {
  if (!["approved", "declined"].includes(decision)) {
    const err = new Error("decision must be 'approved' or 'declined'.");
    err.statusCode = 400;
    throw err;
  }

  const pending = await AgentEvent.findById(eventId);
  if (!pending) {
    const err = new Error("Event not found.");
    err.statusCode = 404;
    throw err;
  }
  if (pending.status !== "pending_approval") {
    const err = new Error("This event is no longer pending approval.");
    err.statusCode = 409;
    throw err;
  }

  pending.status = decision;
  pending.approverId = approverId;
  pending.resolvedAt = new Date();
  await pending.save();
  const resolvedDto = publishEvent(pending);

  if (decision === "declined") {
    return { resolved: resolvedDto, execution: null };
  }

  // Real execution point — no adapter exists yet in Phase 0.
  const executionEvent = await AgentEvent.create({
    founderId: pending.founderId,
    startupId: pending.startupId,
    actorType: "human",
    actorId: String(approverId),
    actionTypeId: pending.actionTypeId,
    targetType: pending.targetType,
    targetId: pending.targetId,
    payload: pending.payload,
    status: "human_completed",
    parentEventId: pending._id,
  });
  const executionDto = publishEvent(executionEvent);

  return { resolved: resolvedDto, execution: executionDto };
}
