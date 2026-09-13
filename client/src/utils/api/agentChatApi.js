/**
 * agentChatApi.js — client wrapper for AI Product Manager's real conversation
 * endpoints (docs/ai-agent-roadmap.md Phase 3). Scoped to the "pm" agent
 * only for now — see server/src/controllers/agentChat.controller.js.
 */
import { request } from "../backendClient";

export async function getPmMessages(founderId, conversationId) {
  const qs = conversationId ? `?conversationId=${encodeURIComponent(conversationId)}` : "";
  const payload = await request(`/founders/${founderId}/agent-chat/pm/messages${qs}`, { method: "GET" });
  return payload?.data || { messages: [], agentId: null, conversationId: null };
}

export async function sendPmMessage(founderId, content, conversationId) {
  const payload = await request(`/founders/${founderId}/agent-chat/pm/messages`, {
    method: "POST",
    body: JSON.stringify({ content, ...(conversationId ? { conversationId } : {}) }),
  });
  return payload?.data || {};
}

/** Real, distinct past conversations for the History dropdown — see listConversations in agentChat.controller.js. */
export async function getPmConversations(founderId) {
  const payload = await request(`/founders/${founderId}/agent-chat/pm/conversations`, { method: "GET" });
  return payload?.data?.conversations || [];
}
