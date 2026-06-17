export const MAX_CALL_CHAT_LENGTH = 2000;

export function trimMessage(text) {
  return String(text || "").trim().slice(0, MAX_CALL_CHAT_LENGTH);
}

export function formatCallChatTime(timestamp) {
  if (!timestamp) return "";
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
