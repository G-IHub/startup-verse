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

export async function getAgents(founderId) {
  return apiRequest(`/founders/${founderId}/agents`);
}

export async function getActionTypes(founderId) {
  return apiRequest(`/founders/${founderId}/action-types`);
}

export async function getAutonomySettings(founderId) {
  return apiRequest(`/founders/${founderId}/autonomy-settings`);
}

export async function updateAutonomySetting(founderId, actionTypeId, mode) {
  return apiRequest(`/founders/${founderId}/action-types/${actionTypeId}/autonomy`, {
    method: "PATCH",
    body: JSON.stringify({ mode }),
  });
}

/** params: { status, approverId } — status can be comma-separated for multiple. */
export async function getAgentEvents(founderId, params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) query.append(k, v); });
  const qs = query.toString();
  return apiRequest(`/founders/${founderId}/agent-events${qs ? `?${qs}` : ""}`);
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
