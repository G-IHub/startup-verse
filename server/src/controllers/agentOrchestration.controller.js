/**
 * agentOrchestration.controller.js — real endpoints for docs/ai-agent-roadmap.md
 * Phase 0. Backs Approval Queue, Audit Trail, Autonomy Settings, and the
 * Workroom's coordination feed once the client is rewired to call these
 * instead of reading hardcoded arrays.
 */
import Agent from "../models/Agent.js";
import ActionType from "../models/ActionType.js";
import AutonomySetting from "../models/AutonomySetting.js";
import AgentEvent from "../models/AgentEvent.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import { proposeAction, resolveApproval } from "../services/orchestrator.service.js";

function founderGuard(req, founderId) {
  return req.user.isAdmin === true || req.user.id === String(founderId);
}

export const listAgents = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) return apiError(res, "Forbidden.", 403);
  const agents = await Agent.find({ founderId }).sort({ createdAt: 1 }).lean();
  return apiSuccess(res, agents);
};

export const listActionTypes = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) return apiError(res, "Forbidden.", 403);
  const agents = await Agent.find({ founderId }, { _id: 1 }).lean();
  const agentIds = agents.map((a) => a._id);
  const actionTypes = await ActionType.find({ agentId: { $in: agentIds } })
    .populate("agentId", "name agentKey")
    .sort({ createdAt: 1 })
    .lean();
  return apiSuccess(res, actionTypes);
};

export const listAutonomySettings = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) return apiError(res, "Forbidden.", 403);
  const agents = await Agent.find({ founderId }, { _id: 1 }).lean();
  const agentIds = agents.map((a) => a._id);
  const actionTypes = await ActionType.find({ agentId: { $in: agentIds } })
    .populate("agentId", "name agentKey")
    .lean();
  const settings = await AutonomySetting.find({ actionTypeId: { $in: actionTypes.map((a) => a._id) } }).lean();
  const settingByActionType = new Map(settings.map((s) => [String(s.actionTypeId), s]));

  // Merge: every action type shows its effective mode, whether or not a
  // AutonomySetting row exists yet (falls back to the ActionType's own default).
  const merged = actionTypes.map((at) => ({
    ...at,
    effectiveMode: settingByActionType.get(String(at._id))?.mode || at.defaultMode,
    settingUpdatedAt: settingByActionType.get(String(at._id))?.updatedAt || null,
  }));
  return apiSuccess(res, merged);
};

export const updateAutonomySetting = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) return apiError(res, "Forbidden.", 403);

  const actionType = await ActionType.findById(req.params.actionTypeId).populate("agentId", "founderId");
  if (!actionType) return apiError(res, "Action type not found.", 404);
  if (String(actionType.agentId?.founderId) !== String(founderId)) return apiError(res, "Forbidden.", 403);

  if (!actionType.adjustable) {
    return apiError(res, "This action is permanently locked and cannot be made autonomous.", 403);
  }

  const mode = String(req.body?.mode || "");
  if (!["autonomous", "ask_first"].includes(mode)) {
    return apiError(res, "mode must be 'autonomous' or 'ask_first'.", 400);
  }

  const setting = await AutonomySetting.findOneAndUpdate(
    { actionTypeId: actionType._id },
    { actionTypeId: actionType._id, mode, updatedBy: req.user.id },
    { upsert: true, new: true, runValidators: true },
  );
  return apiSuccess(res, setting);
};

export const listAgentEvents = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) return apiError(res, "Forbidden.", 403);

  const query = { founderId };
  if (req.query.status) {
    query.status = req.query.status.includes(",") ? { $in: req.query.status.split(",") } : req.query.status;
  }
  if (req.query.approverId) query.approverId = req.query.approverId;

  const events = await AgentEvent.find(query)
    .populate({
      path: "actionTypeId",
      select: "actionKey label riskCategory agentId",
      populate: { path: "agentId", select: "name agentKey" },
    })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  return apiSuccess(res, events);
};

export const proposeAgentAction = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) return apiError(res, "Forbidden.", 403);

  const { actorType, actorId, actionTypeId, targetType, targetId, payload, startupId, parentEventId } = req.body || {};
  if (!actorType || !actorId || !actionTypeId || !targetType) {
    return apiError(res, "actorType, actorId, actionTypeId, and targetType are required.", 400);
  }

  try {
    const result = await proposeAction({
      founderId,
      startupId,
      actorType,
      actorId,
      actionTypeId,
      targetType,
      targetId,
      payload,
      parentEventId: parentEventId || null,
    });
    return apiSuccess(res, result, 201);
  } catch (err) {
    return apiError(res, err.message || "Could not propose action.", err.statusCode || 500);
  }
};

export const resolveAgentEvent = async (req, res) => {
  const event = await AgentEvent.findById(req.params.eventId);
  if (!event) return apiError(res, "Event not found.", 404);
  if (req.user.isAdmin !== true && req.user.id !== String(event.approverId) && req.user.id !== String(event.founderId)) {
    return apiError(res, "Forbidden.", 403);
  }

  const decision = String(req.body?.decision || "");
  try {
    const result = await resolveApproval({ eventId: event._id, decision, approverId: req.user.id });
    return apiSuccess(res, result);
  } catch (err) {
    return apiError(res, err.message || "Could not resolve event.", err.statusCode || 500);
  }
};
