/**
 * agentChatApi.js — client wrapper for AI Product Manager's real conversation
 * endpoints (docs/ai-agent-roadmap.md Phase 3). Scoped to the "pm" agent
 * only for now — see server/src/controllers/agentChat.controller.js.
 */
import { request } from "../backendClient";

export async function getPmMessages(founderId) {
  const payload = await request(`/founders/${founderId}/agent-chat/pm/messages`, { method: "GET" });
  return payload?.data || { messages: [], agentId: null };
}

export async function sendPmMessage(founderId, content) {
  const payload = await request(`/founders/${founderId}/agent-chat/pm/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
  return payload?.data || {};
}
