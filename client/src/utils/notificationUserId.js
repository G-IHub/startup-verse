export function resolveNotificationUserId(user) {
  return String(user?._id || user?.id || "").trim();
}
