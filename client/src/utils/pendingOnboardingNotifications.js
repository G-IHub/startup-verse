const PENDING_ONBOARDING_NOTIFICATION_TYPES = new Set([
  "invitation-accepted",
  "interest-accepted",
  "onboarding-pending",
]);

function notificationCoversPending(notification, pending) {
  if (!PENDING_ONBOARDING_NOTIFICATION_TYPES.has(notification?.type)) {
    return false;
  }
  const meta = notification?.metadata || {};
  if (pending.interestId && String(meta.interestId || "") === pending.interestId) {
    return true;
  }
  if (
    pending.invitationId &&
    String(meta.invitationId || meta.inviteId || "") === pending.invitationId
  ) {
    return true;
  }
  return false;
}

export function buildSyntheticPendingNotifications(
  pendingItems,
  serverNotifications = [],
) {
  const synthetic = [];

  for (const item of pendingItems) {
    const covered = serverNotifications.some((notification) =>
      notificationCoversPending(notification, item),
    );
    if (covered) continue;

    if (item.invitationId) {
      synthetic.push({
        id: `pending-invitation-${item.invitationId}`,
        type: "invitation-accepted",
        title: `${item.talentName} accepted your invitation`,
        message: "Ready to onboard. Set compensation to add them to your team.",
        read: false,
        timestamp: item.respondedAt || new Date().toISOString(),
        metadata: {
          invitationId: item.invitationId,
          talentId: item.talentId,
          synthetic: true,
        },
      });
    } else if (item.interestId) {
      synthetic.push({
        id: `pending-interest-${item.interestId}`,
        type: "interest-received",
        title: `${item.talentName} is ready to onboard`,
        message: "They accepted your interest. Set compensation to add them to your team.",
        read: false,
        timestamp: item.respondedAt || new Date().toISOString(),
        metadata: {
          interestId: item.interestId,
          talentId: item.talentId,
          synthetic: true,
        },
      });
    }
  }

  return synthetic;
}

export function applySyntheticNotificationState(
  notifications,
  { readIds = new Set(), dismissedIds = new Set() } = {},
) {
  return notifications
    .filter((notification) => !dismissedIds.has(notification.id))
    .map((notification) =>
      readIds.has(notification.id)
        ? { ...notification, read: true }
        : notification,
    );
}
