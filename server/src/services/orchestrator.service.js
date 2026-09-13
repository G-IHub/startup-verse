/**
 * orchestrator.service.js — docs/ai-agent-roadmap.md.
 *
 * The only code allowed to write to AgentEvent. No agent talks to an
 * external API or another agent directly — everything routes through here,
 * which is what makes the "locked" enforcement real instead of decorative
 * (see docs/ai-agent-orchestration-architecture.md Section 2-3).
 *
 * Phase 0 had no real integration adapters — every action just logged a
 * status. Phase 1 (AI Developer/GitHub) adds the first real ones: when an
 * ActionType's actionKey has a registered executor (agentExecutors.js), the
 * autonomous branch and the post-approval execution branch below actually
 * call it, and a real failure is stored as a genuine "failed" status with
 * the error attached — not silently reported as success.
 */
import ActionType from "../models/ActionType.js";
import AutonomySetting from "../models/AutonomySetting.js";
import AgentEvent from "../models/AgentEvent.js";
import Task from "../models/Task.js";
import { emitRealtime } from "./realtime.service.js";
import { SOCKET_EVENTS } from "../realtime/events.js";
import { startupRoom, userRoom } from "../realtime/rooms.js";
import { logger } from "../config/logger.js";
import { hasExecutor, runExecutor } from "./agentExecutors.js";
import { validateTaskStatusTransition } from "../domain/weeklyLoopRules.js";
import { syncMilestoneCounters } from "../utils/syncMilestoneCounters.js";

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

/**
 * Populates actionTypeId (and its agentId) before building the DTO, so a
 * live socket push carries the same rich display data as the REST list
 * endpoint (agent name, action label, risk category) instead of just an id
 * the client can't render anything meaningful from.
 */
async function publishEvent(event) {
  await event.populate({
    path: "actionTypeId",
    select: "actionKey label riskCategory agentId",
    populate: { path: "agentId", select: "name agentKey" },
  });
  const actionType = event.actionTypeId;
  const agent = actionType?.agentId;
  const dto = {
    id: String(event._id),
    founderId: String(event.founderId),
    startupId: event.startupId ? String(event.startupId) : null,
    actorType: event.actorType,
    actorId: event.actorId,
    actionTypeId: actionType ? {
      id: String(actionType._id),
      actionKey: actionType.actionKey,
      label: actionType.label,
      riskCategory: actionType.riskCategory,
      agentId: agent ? { id: String(agent._id), name: agent.name, agentKey: agent.agentKey } : null,
    } : null,
    targetType: event.targetType,
    targetId: event.targetId,
    payload: event.payload,
    result: event.result ?? null,
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

const COMPLETED_STATUSES = ["autonomous_completed", "human_completed"];

/**
 * Idempotency guard for executable actions (docs/ai-agent-roadmap.md Phase 1
 * checklist item). Keyed on (founderId, actionTypeId, targetType, targetId) —
 * the same tuple a retried orchestrator call would resend. If a prior call
 * already executed this exact action to completion, return that instead of
 * running the real adapter again, so a network-retried propose/resolve can't
 * double-open a PR or double-deploy. Only applies to action types with a real
 * executor — actions with no side effect (Phase 0's log-only path) don't need
 * it, and duplicates there are harmless.
 */
async function findCompletedDuplicate({ founderId, actionTypeId, targetType, targetId }) {
  if (!targetId) return null;
  return AgentEvent.findOne({
    founderId,
    actionTypeId,
    targetType,
    targetId,
    status: { $in: COMPLETED_STATUSES },
  }).sort({ createdAt: -1 });
}

/**
 * Task-completion feedback (docs/ai-agent-roadmap.md Phase 3, step 3): closes
 * the loop the other direction from the hand-off in agentChat.controller.js.
 * A hand-off that named a real Execution Engine Task moves it pending ->
 * in-progress the moment AI Developer starts (this function), and the
 * matching completeLinkedTask() below moves it in-progress -> completed once
 * the same pipeline's github_merge_main actually reaches production. Both
 * are best-effort: a Task-side failure (already completed, bad transition,
 * task deleted) must never break the real GitHub action it's just recording
 * against, so every failure here is caught and logged, never thrown.
 */
async function advanceTaskToInProgress(taskId) {
  if (!taskId) return;
  try {
    const task = await Task.findById(taskId);
    if (!task) return;
    if (!validateTaskStatusTransition(task.status, "in-progress").ok) return;
    task.status = "in-progress";
    await task.save();
    await syncMilestoneCounters(task.milestoneId);
    if (task.startupId) {
      emitRealtime(SOCKET_EVENTS.TASK_UPDATED, task, [startupRoom(task.startupId)]);
    }
  } catch (err) {
    logger.error("[orchestrator] failed to advance linked task to in-progress", { taskId: String(taskId), message: err.message });
  }
}

/**
 * Finds the github_open_pr event that started this pipeline (same founderId +
 * targetId — the grouping key every step of a hand-off's PR/staging/prod
 * chain already shares, per V2AIDeveloperWorkspace.jsx's own grouping) and,
 * if it was linked to a real Task, marks that Task completed now that
 * production deploy has actually happened.
 */
async function completeLinkedTask(founderId, targetId) {
  if (!targetId) return;
  try {
    const openPrType = await ActionType.findOne({ actionKey: "github_open_pr" }, { _id: 1 });
    if (!openPrType) return;
    const origin = await AgentEvent.findOne({ founderId, targetId, actionTypeId: openPrType._id, taskId: { $ne: null } }).sort({ createdAt: 1 });
    if (!origin?.taskId) return;
    const task = await Task.findById(origin.taskId);
    if (!task) return;
    if (!validateTaskStatusTransition(task.status, "completed").ok) return;
    task.status = "completed";
    await task.save();
    await syncMilestoneCounters(task.milestoneId);
    if (task.startupId) {
      emitRealtime(SOCKET_EVENTS.TASK_UPDATED, task, [startupRoom(task.startupId)]);
    }
  } catch (err) {
    logger.error("[orchestrator] failed to complete linked task", { founderId: String(founderId), targetId, message: err.message });
  }
}

/**
 * Step 1 of the decision loop: an agent (or the seed script, in Phase 0)
 * proposes an action. Branches on the ActionType's real risk category and
 * current autonomy mode. Never executes a sensitive_locked action here —
 * only ever logs it as pending_approval and stops, per the architecture
 * doc's Section 2.
 */
export async function proposeAction({ founderId, startupId, actorType, actorId, actionTypeId, targetType, targetId, payload, parentEventId = null, taskId = null }) {
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
    taskId: taskId || null,
  };

  // Hand-off started: if this open_pr is linked to a real planned Task, move
  // it pending -> in-progress now, regardless of which branch below the
  // event itself takes (ask_first vs. autonomous — either way, work has
  // genuinely begun from the founder's point of view).
  if (actionType.actionKey === "github_open_pr" && taskId) {
    await advanceTaskToInProgress(taskId);
  }

  // Branch a) sensitive_locked -> ALWAYS pending_approval, regardless of mode.
  // Branch b) reversible + ask_first -> pending_approval (re-checked live, not cached).
  if (actionType.riskCategory === "sensitive_locked" || (actionType.riskCategory === "reversible" && mode === "ask_first")) {
    const approverId = resolveApprover(actionType.approverRule, founderId);
    const event = await AgentEvent.create({ ...baseDoc, status: "pending_approval", approverId });
    const dto = await publishEvent(event);
    return { event: dto, executed: false };
  }

  // Branch c) reversible + autonomous -> execute immediately.
  // Branch d) read_only -> always executes, always autonomous.
  // If a real executor is registered for this action type, actually run it —
  // otherwise (no adapter built yet for this action) fall back to Phase 0's
  // "log it as done" behavior, which stays correct for agents/actions that
  // are genuinely just informational (e.g. AI Growth Analyst's read_only work).
  let status = "autonomous_completed";
  let result = null;
  if (hasExecutor(actionType.actionKey)) {
    const duplicate = await findCompletedDuplicate({ founderId, actionTypeId: actionType._id, targetType, targetId });
    if (duplicate) {
      result = { ...duplicate.result, reusedFromEventId: String(duplicate._id) };
      logger.warn(`[orchestrator] duplicate propose for ${actionType.actionKey}/${targetId} — reusing prior result instead of re-executing.`);
    } else {
      try {
        result = await runExecutor(actionType.actionKey, { founderId, payload: payload || {}, targetType, targetId: targetId || "" });
      } catch (err) {
        status = "failed";
        result = { error: err.message || "Execution failed." };
        logger.error(`[orchestrator] executor "${actionType.actionKey}" failed`, { message: err.message });
      }
    }
  }
  const event = await AgentEvent.create({ ...baseDoc, status, result });
  const dto = await publishEvent(event);

  if (actionType.actionKey === "github_merge_main" && status === "autonomous_completed") {
    await completeLinkedTask(founderId, targetId);
  }

  return { event: dto, executed: status !== "failed" };
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
  const resolvedDto = await publishEvent(pending);

  if (decision === "declined") {
    return { resolved: resolvedDto, execution: null };
  }

  // Real execution point. If the approved action type has a registered
  // executor, actually run it now — this is the moment a locked action (e.g.
  // deploy_prod) really takes effect, only after a human said yes.
  const actionType = await ActionType.findById(pending.actionTypeId);
  let execStatus = "human_completed";
  let execResult = null;
  if (actionType && hasExecutor(actionType.actionKey)) {
    const duplicate = await findCompletedDuplicate({
      founderId: pending.founderId,
      actionTypeId: actionType._id,
      targetType: pending.targetType,
      targetId: pending.targetId,
    });
    if (duplicate) {
      execResult = { ...duplicate.result, reusedFromEventId: String(duplicate._id) };
      logger.warn(`[orchestrator] duplicate resolve for ${actionType.actionKey}/${pending.targetId} — reusing prior result instead of re-executing.`);
    } else {
      try {
        execResult = await runExecutor(actionType.actionKey, {
          founderId: pending.founderId,
          payload: pending.payload || {},
          targetType: pending.targetType,
          targetId: pending.targetId || "",
        });
      } catch (err) {
        execStatus = "failed";
        execResult = { error: err.message || "Execution failed." };
        logger.error(`[orchestrator] executor "${actionType.actionKey}" failed on approval`, { message: err.message });
      }
    }
  }

  const executionEvent = await AgentEvent.create({
    founderId: pending.founderId,
    startupId: pending.startupId,
    actorType: "human",
    actorId: String(approverId),
    actionTypeId: pending.actionTypeId,
    targetType: pending.targetType,
    targetId: pending.targetId,
    payload: pending.payload,
    status: execStatus,
    result: execResult,
    parentEventId: pending._id,
  });
  const executionDto = await publishEvent(executionEvent);

  if (actionType?.actionKey === "github_merge_main" && execStatus === "human_completed") {
    await completeLinkedTask(pending.founderId, pending.targetId);
  }

  return { resolved: resolvedDto, execution: executionDto };
}
