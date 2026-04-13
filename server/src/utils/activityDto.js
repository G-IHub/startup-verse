export function mapActivityToDto(activityDoc, overrides = {}) {
  const metadata = activityDoc?.metadata && typeof activityDoc.metadata === "object"
    ? activityDoc.metadata
    : {};

  return {
    id: String(activityDoc?._id || overrides.id || ""),
    startupId: String(activityDoc?.startupId || overrides.startupId || ""),
    userId: String(activityDoc?.userId || overrides.userId || ""),
    userName: String(overrides.userName || metadata.userName || ""),
    type: String(activityDoc?.type || overrides.type || "update"),
    message: String(activityDoc?.text || overrides.message || ""),
    icon: String(overrides.icon || metadata.icon || "📋"),
    timestamp: String(activityDoc?.createdAt || overrides.timestamp || new Date().toISOString()),
    metadata,
  };
}

