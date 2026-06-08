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

export function chatDeepLink(peerUserId) {
  if (!peerUserId) return "/chat";
  return appendQuery("/chat", { with: peerUserId });
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
  const tab = params.tab || "received";
  const base =
    tab === "sent" ? "/inbox/sent" : tab === "received" ? "/inbox/received" : "/inbox";
  if (!params.invitationId) return base;
  return appendQuery(base, { invitationId: params.invitationId });
}
