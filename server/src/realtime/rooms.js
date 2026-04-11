export function startupRoom(startupId) {
  return `startup:${startupId}`;
}

export function userRoom(userId) {
  return `user:${userId}`;
}

export function organizationRoom(organizationId) {
  return `organization:${organizationId}`;
}