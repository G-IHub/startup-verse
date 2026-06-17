import * as presenceApi from "./presenceApi.js";

export async function logCallStartedActivity({
  userId,
  startupId,
  userName,
  role,
}) {
  const normalizedUserId = String(userId || "");
  const normalizedStartupId = String(startupId || "");
  if (!normalizedUserId || !normalizedStartupId) return;

  await presenceApi.updatePresence({
    userId: normalizedUserId,
    startupId: normalizedStartupId,
    userName: String(userName || "Team member"),
    role: String(role || "team-member"),
    isOnline: true,
    status: "in-meeting",
    activity: {
      type: "call-started",
      message: "Started a team call",
      icon: "📞",
    },
  });
}
