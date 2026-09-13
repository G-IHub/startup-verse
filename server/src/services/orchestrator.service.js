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
import Agent from "../models/Agent.js";
import Startup from "../models/Startup.js";
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

/**
 * Real-time-only "in progress" signal — never persisted to AgentEvent,
 * since every AgentEvent is only ever written *after* a real action
 * finishes (success or fail); there was no live "AI Developer is working
 * right now" moment captured anywhere before this. Emitted right before a
 * real executor actually runs (never for a reused-duplicate result, which
 * completes instantly with no real work happening), so the Workroom can
 * show real, live activity instead of only ever seeing things after the
 * fact. Best-effort: a failure here must never block the real action.
 */
async function emitActionStarted({ founderId, startupId, actionType, targetId, payload }) {
  try {
    await actionType.populate({ path: "agentId", select: "name agentKey" });
    const agent = actionType.agentId;
    const rooms = [userRoom(founderId)];
    if (startupId) rooms.push(startupRoom(startupId));
    emitRealtime(SOCKET_EVENTS.AGENT_ACTION_STARTED, {
      founderId: String(founderId),
      startupId: startupId ? String(startupId) : null,
      actionKey: actionType.actionKey,
      actionLabel: actionType.label,
      agentId: agent ? { id: String(agent._id), name: agent.name, agentKey: agent.agentKey } : null,
      targetId: targetId || "",
      taskDescription: payload?.taskDescription || payload?.filePath || null,
      startedAt: new Date().toISOString(),
    }, rooms);
  } catch (err) {
    logger.error("[orchestrator] failed to emit action-started signal", { message: err.message });
  }
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
 * A taskId-linked github_open_pr that genuinely fails (no GitHub connection,
 * bad repo, etc.) must not leave its Task silently stuck at "pending"
 * forever — that would jam advanceBuildQueueIfIdle below, which only ever
 * looks for the oldest still-"pending" queued task and would keep re-picking
 * the same broken one on every future trigger. Marking it "blocked" instead
 * makes the failure visible in the Execution Engine and lets the queue move
 * on to the next real task.
 */
async function markLinkedTaskBlocked(taskId, reason) {
  if (!taskId) return;
  try {
    const task = await Task.findById(taskId);
    if (!task) return;
    if (!validateTaskStatusTransition(task.status, "blocked").ok) return;
    task.status = "blocked";
    task.blockerReason = "AI Developer hand-off failed";
    task.blockerNote = String(reason || "Unknown error").slice(0, 1000);
    await task.save();
    await syncMilestoneCounters(task.milestoneId);
    if (task.startupId) {
      emitRealtime(SOCKET_EVENTS.TASK_UPDATED, task, [startupRoom(task.startupId)]);
    }
  } catch (err) {
    logger.error("[orchestrator] failed to mark linked task blocked", { taskId: String(taskId), message: err.message });
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
    // taskId is only ever set on the github_open_pr event that started this
    // pipeline (see advanceTaskToInProgress's call site below), so this alone
    // identifies it — no need to also filter by actionTypeId. That matters:
    // ActionType rows are per-founder (agentId -> Agent -> one founder), not
    // global, so looking one up by actionKey alone without an agent/founder
    // scope would risk matching a *different* founder's row entirely.
    const origin = await AgentEvent.findOne({ founderId, targetId, taskId: { $ne: null } }).sort({ createdAt: 1 });
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
    // One task finishing is exactly what should start the next queued one —
    // see advanceBuildQueueIfIdle below.
    await advanceBuildQueueIfIdle(founderId);
  } catch (err) {
    logger.error("[orchestrator] failed to complete linked task", { founderId: String(founderId), targetId, message: err.message });
  }
}

/**
 * Sequential build-queue trigger (docs/ai-agent-roadmap.md Phase 3): once a
 * founder approves a sprint plan, tasks AI PM flagged as `buildTask: true`
 * should start reaching AI Developer on their own — one at a time, not all
 * at once, since every github_open_pr branches off the same `staging`
 * branch and running several simultaneously risks real merge conflicts with
 * nothing in the system to resolve them. So: if a buildTask is already
 * "in-progress", do nothing (it'll trigger the next one itself when
 * completeLinkedTask marks it done); otherwise, start the oldest still-
 * "pending" one. Called right after a sprint plan's tasks are created (see
 * resolveApproval/proposeAction below) and again every time a task in the
 * queue completes.
 */
async function advanceBuildQueueIfIdle(founderId) {
  try {
    const alreadyRunning = await Task.findOne({ founderId, buildTask: true, status: "in-progress" });
    if (alreadyRunning) return;

    const next = await Task.findOne({ founderId, buildTask: true, status: "pending" }).sort({ createdAt: 1 });
    if (!next) return;

    const startup = await Startup.findOne({ founderId }).lean();
    const owner = startup?.defaultGithubRepo?.owner;
    const repo = startup?.defaultGithubRepo?.repo;
    if (!owner || !repo) {
      logger.warn(`[orchestrator] build task ${next._id} is queued but no default GitHub repo is set for founder ${founderId} — leaving it pending until one is set (Integrations page).`);
      return;
    }
    if (!next.buildFilePath) {
      await markLinkedTaskBlocked(next._id, "AI PM flagged this task for AI Developer but didn't specify a file path.");
      return;
    }

    const devAgent = await Agent.findOne({ founderId, agentKey: "dev" });
    if (!devAgent) return;
    const openPrType = await ActionType.findOne({ agentId: devAgent._id, actionKey: "github_open_pr" });
    if (!openPrType) return;

    await proposeAction({
      founderId,
      startupId: next.startupId,
      actorType: "agent",
      actorId: String(devAgent._id),
      actionTypeId: openPrType._id,
      targetType: "pr",
      targetId: `sprint-task-${next._id}`,
      payload: { owner, repo, filePath: next.buildFilePath, taskDescription: next.description || next.title },
      taskId: next._id,
    });
  } catch (err) {
    logger.error("[orchestrator] failed to advance build queue", { founderId: String(founderId), message: err.message });
  }
}

/**
 * Auto-advances AI Developer's own PR -> staging -> production pipeline the
 * moment one stage finishes successfully, instead of requiring a manual
 * "Merge to staging" / "Request production deploy" click every time (real
 * gap the founder hit and flagged directly: a direct AI PM hand-off made
 * them do both by hand, when the whole point of a hand-off is that the
 * founder only comes back in for a real approval). Reuses proposeAction
 * itself for the next stage, so this never bypasses a real gate — it only
 * decides WHEN to ask. github_merge_staging is autonomous by default, so it
 * just runs; github_merge_main is sensitive_locked, so this always lands it
 * in the Approval Queue exactly as a manual "Request production deploy"
 * click already does, just without the founder having to click it first.
 * Applies uniformly to every github_open_pr, taskId-linked or not, so a
 * one-off direct hand-off now behaves the same as a sprint-plan build task.
 */
async function autoAdvancePipeline({ founderId, startupId, actionKey, status, targetId, payload, result, taskId }) {
  if (!["autonomous_completed", "human_completed"].includes(status)) return;
  const nextActionKey =
    actionKey === "github_open_pr" ? "github_merge_staging" :
    actionKey === "github_merge_staging" ? "github_merge_main" :
    null;
  if (!nextActionKey) return;

  try {
    const owner = payload?.owner;
    const repo = payload?.repo;
    if (!owner || !repo) return;

    const nextPayload = nextActionKey === "github_merge_staging"
      ? { owner, repo, prNumber: result?.prNumber }
      : { owner, repo };
    if (nextActionKey === "github_merge_staging" && !nextPayload.prNumber) return;

    const devAgent = await Agent.findOne({ founderId, agentKey: "dev" });
    if (!devAgent) return;
    const nextType = await ActionType.findOne({ agentId: devAgent._id, actionKey: nextActionKey });
    if (!nextType) return;

    await proposeAction({
      founderId,
      startupId,
      actorType: "agent",
      actorId: String(devAgent._id),
      actionTypeId: nextType._id,
      targetType: nextActionKey === "github_merge_staging" ? "pr" : "repo",
      targetId,
      payload: nextPayload,
      taskId,
    });
  } catch (err) {
    logger.error(`[orchestrator] failed to auto-advance pipeline from ${actionKey}`, { founderId: String(founderId), targetId, message: err.message });
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

  // Branch a) sensitive_locked -> ALWAYS pending_approval, regardless of mode.
  // Branch b) reversible + ask_first -> pending_approval (re-checked live, not cached).
  if (actionType.riskCategory === "sensitive_locked" || (actionType.riskCategory === "reversible" && mode === "ask_first")) {
    const approverId = resolveApprover(actionType.approverRule, founderId);
    const event = await AgentEvent.create({ ...baseDoc, status: "pending_approval", approverId });
    const dto = await publishEvent(event);
    // Hand-off requested: a linked Task can move to in-progress now — nothing
    // has failed yet at this point, only real failures below skip this.
    if (actionType.actionKey === "github_open_pr" && taskId) {
      await advanceTaskToInProgress(taskId);
    }
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
      await emitActionStarted({ founderId, startupId, actionType, targetId, payload });
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

  if (actionType.actionKey === "github_open_pr" && taskId) {
    if (status === "failed") {
      await markLinkedTaskBlocked(taskId, result?.error);
    } else {
      await advanceTaskToInProgress(taskId);
    }
  }
  if (actionType.actionKey === "github_merge_main" && status === "autonomous_completed") {
    await completeLinkedTask(founderId, targetId);
  }
  if (actionType.actionKey === "propose_sprint_plan" && status === "autonomous_completed") {
    await advanceBuildQueueIfIdle(founderId);
  }
  if (["github_open_pr", "github_merge_staging"].includes(actionType.actionKey) && status !== "failed") {
    await autoAdvancePipeline({ founderId, startupId, actionKey: actionType.actionKey, status, targetId, payload, result, taskId });
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
    if (pending.taskId) {
      const declinedActionType = await ActionType.findById(pending.actionTypeId);
      if (declinedActionType?.actionKey === "github_open_pr") {
        await markLinkedTaskBlocked(pending.taskId, "The founder declined this hand-off in the Approval Queue.");
      }
    }
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
      await emitActionStarted({ founderId: pending.founderId, startupId: pending.startupId, actionType, targetId: pending.targetId, payload: pending.payload });
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

  if (actionType?.actionKey === "github_open_pr" && pending.taskId && execStatus === "failed") {
    await markLinkedTaskBlocked(pending.taskId, execResult?.error);
  }
  if (actionType?.actionKey === "github_merge_main" && execStatus === "human_completed") {
    await completeLinkedTask(pending.founderId, pending.targetId);
  }
  if (actionType?.actionKey === "propose_sprint_plan" && execStatus === "human_completed") {
    await advanceBuildQueueIfIdle(pending.founderId);
  }
  if (["github_open_pr", "github_merge_staging"].includes(actionType?.actionKey) && execStatus !== "failed") {
    await autoAdvancePipeline({
      founderId: pending.founderId,
      startupId: pending.startupId,
      actionKey: actionType.actionKey,
      status: execStatus,
      targetId: pending.targetId,
      payload: pending.payload,
      result: execResult,
      taskId: pending.taskId,
    });
  }

  return { resolved: resolvedDto, execution: executionDto };
}
