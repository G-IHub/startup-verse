/**
 * Server-side canonical deep-link builders (must match client/src/app/deepLinks.js).
 */

function appendQuery(path, params) {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== "");
  if (!entries.length) return path;
  const qs = new URLSearchParams();
  for (const [key, value] of entries) {
    qs.set(key, String(value));
  }
  return `${path}?${qs.toString()}`;
}

export function chatDeepLink(peerUserId, taskId) {
  if (!peerUserId) return "/chat";
  return appendQuery("/chat", {
    with: peerUserId,
    ...(taskId ? { taskId } : {}),
  });
}

export function taskPageDeepLink(taskId) {
  if (!taskId) return "/office";
  return `/office/tasks/${encodeURIComponent(String(taskId))}`;
}

export function officeDeepLink(params = {}) {
  const { view, tab, taskId, announcementId, winId, deliverableId, mentorId, cohortId } =
    params;
  return appendQuery("/office", {
    view: view && view !== "workspace" ? view : undefined,
    tab,
    taskId,
    announcementId,
    winId,
    deliverableId,
    mentorId,
    cohortId,
  });
}

export function inboxDeepLink(params = {}) {
  return appendQuery("/home", {
    openNotifications: "1",
    invitationId: params.invitationId || undefined,
    interestId: params.interestId || undefined,
  });
}
