/**
 * salesMarketing.controller.js
 *
 * Two endpoints for AI Sales and AI Marketing workspaces:
 *
 *   POST /founders/:founderId/agents/:agentKey/generate
 *     Runs one sales/marketing executor immediately and stores the result
 *     as an AgentEvent. Returns the result so the UI can show it right away.
 *
 *   GET /founders/:founderId/agents/:agentKey/outputs
 *     Lists completed AgentEvents for this agent, newest first.
 *     Used to populate the workspace on load.
 */
import Agent from "../models/Agent.js";
import ActionType from "../models/ActionType.js";
import AgentEvent from "../models/AgentEvent.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import { ensureCoreAgentsSeeded } from "../services/coreAgentSeeds.js";
import { hasExecutor, runExecutor } from "../services/agentExecutors.js";
import { logger } from "../config/logger.js";

function founderGuard(req, founderId) {
  return req.user.isAdmin === true || req.user.id === String(founderId);
}

const ALLOWED_AGENT_KEYS = ["sales", "mkt"];

export const generateOutput = async (req, res) => {
  const { founderId, agentKey } = req.params;
  if (!founderGuard(req, founderId)) return apiError(res, "Forbidden.", 403);
  if (!ALLOWED_AGENT_KEYS.includes(agentKey)) return apiError(res, "Unknown agent.", 400);

  const { actionKey, payload = {} } = req.body || {};
  if (!actionKey) return apiError(res, "actionKey is required.", 400);

  await ensureCoreAgentsSeeded(founderId);

  const agent = await Agent.findOne({ founderId, agentKey });
  if (!agent) return apiError(res, "Agent not found.", 404);

  const actionType = await ActionType.findOne({ agentId: agent._id, actionKey });
  if (!actionType) return apiError(res, `Action '${actionKey}' not found for this agent.`, 404);

  if (!hasExecutor(actionKey)) return apiError(res, `No executor registered for '${actionKey}'.`, 500);

  const targetId = `${agentKey}-${actionKey}-${Date.now()}`;

  const event = await AgentEvent.create({
    founderId,
    actorType: "agent",
    actorId: String(agent._id),
    actionTypeId: actionType._id,
    targetType: agentKey,
    targetId,
    payload,
    status: "autonomous_completed",
  });

  try {
    const result = await runExecutor(actionKey, { founderId, payload, targetId });
    event.result = result;
    await event.save();
    return apiSuccess(res, { eventId: String(event._id), actionKey, result });
  } catch (err) {
    logger.error("[salesMarketing] executor failed", { agentKey, actionKey, message: err.message });
    event.status = "failed";
    event.result = { error: err.message };
    await event.save();
    return apiError(res, err.message || "Generation failed.", err.statusCode || 500);
  }
};

export const listOutputs = async (req, res) => {
  const { founderId, agentKey } = req.params;
  if (!founderGuard(req, founderId)) return apiError(res, "Forbidden.", 403);
  if (!ALLOWED_AGENT_KEYS.includes(agentKey)) return apiError(res, "Unknown agent.", 400);

  await ensureCoreAgentsSeeded(founderId);

  const agent = await Agent.findOne({ founderId, agentKey });
  if (!agent) return apiSuccess(res, []);

  const actionTypes = await ActionType.find({ agentId: agent._id }).select("_id actionKey label");
  const actionTypeMap = new Map(actionTypes.map((at) => [String(at._id), at]));

  const events = await AgentEvent.find({
    founderId,
    actionTypeId: { $in: actionTypes.map((at) => at._id) },
    status: { $in: ["autonomous_completed", "human_completed"] },
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const enriched = events.map((e) => {
    const at = actionTypeMap.get(String(e.actionTypeId));
    return {
      id: String(e._id),
      actionKey: at?.actionKey || "",
      label: at?.label || "",
      payload: e.payload,
      result: e.result,
      createdAt: e.createdAt,
    };
  });

  return apiSuccess(res, enriched);
};
