/**
 * Real AI Staff orchestration API — docs/ai-agent-roadmap.md Phase 0.
 * Backs Approval Queue, Audit Trail, and Autonomy Settings once they read
 * real AgentEvent/ActionType/AutonomySetting data instead of mock arrays.
 */
import { request } from "../backendClient";

async function apiRequest(endpoint, options = {}) {
  const payload = await request(endpoint, options);
  return payload.data;
}

/**
 * The list endpoints return lean Mongoose docs (`_id`, not `id`), while the
 * orchestrator's socket DTOs already use `id` (see orchestrator.service.js
 * publishEvent). Normalize here so callers never have to branch on source.
 */
function withId(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const id = obj.id ?? (obj._id != null ? String(obj._id) : undefined);
  const next = { ...obj, id };
  if (next.agentId && typeof next.agentId === "object") next.agentId = withId(next.agentId);
  if (next.actionTypeId && typeof next.actionTypeId === "object") next.actionTypeId = withId(next.actionTypeId);
  return next;
}

export async function getAgents(founderId) {
  const rows = await apiRequest(`/founders/${founderId}/agents`);
  return (rows || []).map(withId);
}

export async function getActionTypes(founderId) {
  const rows = await apiRequest(`/founders/${founderId}/action-types`);
  return (rows || []).map(withId);
}

export async function getAutonomySettings(founderId) {
  const rows = await apiRequest(`/founders/${founderId}/autonomy-settings`);
  return (rows || []).map(withId);
}

export async function updateAutonomySetting(founderId, actionTypeId, mode) {
  const setting = await apiRequest(`/founders/${founderId}/action-types/${actionTypeId}/autonomy`, {
    method: "PATCH",
    body: JSON.stringify({ mode }),
  });
  return withId(setting);
}

/** params: { status, approverId } — status can be comma-separated for multiple. */
export async function getAgentEvents(founderId, params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) query.append(k, v); });
  const qs = query.toString();
  const rows = await apiRequest(`/founders/${founderId}/agent-events${qs ? `?${qs}` : ""}`);
  return (rows || []).map(withId);
}

export async function proposeAgentAction(founderId, body) {
  return apiRequest(`/founders/${founderId}/agent-events/propose`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function resolveAgentEvent(eventId, decision) {
  return apiRequest(`/agent-events/${eventId}/resolve`, {
    method: "POST",
    body: JSON.stringify({ decision }),
  });
}
