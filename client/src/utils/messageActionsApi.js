import { request } from "./backendClient.js";
import { mapMessageDto } from "./messaging.js";

export async function deleteMessageForMe(messageId) {
  const payload = await request(`/messages/${messageId}?scope=forMe`, {
    method: "DELETE",
  });
  return payload?.data || payload;
}

export async function deleteMessageForEveryone(messageId) {
  const payload = await request(`/messages/${messageId}?scope=forEveryone`, {
    method: "DELETE",
  });
  const row = payload?.data || payload?.message || payload;
  return mapMessageDto(row);
}

export async function forwardMessage(messageId, { toUserId, startupId, caption = "" }) {
  const payload = await request(`/messages/${messageId}/forward`, {
    method: "POST",
    body: JSON.stringify({ toUserId, startupId, caption }),
  });
  const row = payload?.data || payload?.message || payload;
  return mapMessageDto(row);
}
