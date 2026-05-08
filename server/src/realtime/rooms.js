export function startupRoom(startupId) {
  return `startup:${startupId}`;
}

export function userRoom(userId) {
  return `user:${userId}`;
}

export function organizationRoom(organizationId) {
  return `organization:${organizationId}`;
}

/** Isolated from `startup:${id}` so announcement listeners do not leave the shared startup room on unsubscribe. */
export function announcementRoom(startupId) {
  return `announcements:${String(startupId)}`;
}