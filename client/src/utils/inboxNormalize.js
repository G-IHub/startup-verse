/** Shared inbox item normalization for notification hub modals. */

export function normalizeInboxItem(item) {
  if (!item) return item;
  const id = String(item._id ?? item.id ?? "");
  const hasOrgCohortKeys = Boolean(item.organizationId) && Boolean(item.cohortId);
  const isLegacyOrgFounderInvite = String(item.kind || "") === "org-founder";
  const isFounderTalentInvite = String(item.kind || "") === "founder-talent";
  const hasTalentChannelShape =
    Object.prototype.hasOwnProperty.call(item, "talentId") ||
    Object.prototype.hasOwnProperty.call(item, "startupId") ||
    Object.prototype.hasOwnProperty.call(item, "talentName");
  const itemType =
    item.itemType === "org-message" || item.inboxKind === "org-message"
      ? "org-message"
      : (hasOrgCohortKeys && !hasTalentChannelShape) || isLegacyOrgFounderInvite
        ? "organization-invitation"
        : isFounderTalentInvite || item.itemType === "invitation"
          ? "invitation"
          : item.itemType === "interest"
            ? "interest"
            : "interest";
  const rawMessages = Array.isArray(item.messages)
    ? item.messages
    : Array.isArray(item.metadata?.messages)
      ? item.metadata.messages
      : [];
  const messages = rawMessages.map((message) => {
    const nestedText =
      message?.text && typeof message.text === "object" ? message.text : null;
    const resolvedSender =
      message.sender ||
      message.senderName ||
      nestedText?.sender ||
      nestedText?.senderName ||
      "Unknown";
    const resolvedSenderId =
      message.senderId || nestedText?.senderId || nestedText?.sender_id || "";
    const resolvedText =
      typeof message.text === "string"
        ? message.text
        : typeof message.body === "string"
          ? message.body
          : typeof message.content === "string"
            ? message.content
            : typeof nestedText?.text === "string"
              ? nestedText.text
              : typeof nestedText?.body === "string"
                ? nestedText.body
                : "";
    const resolvedTimestamp =
      message.timestamp ||
      message.sentAt ||
      nestedText?.timestamp ||
      nestedText?.sentAt ||
      null;
    return {
      ...message,
      senderId: String(resolvedSenderId),
      sender: String(resolvedSender),
      text: String(resolvedText),
      attachments: Array.isArray(message.attachments) ? message.attachments : [],
      timestamp: resolvedTimestamp,
    };
  });
  const founderName =
    item.founderName ||
    (item.founderId && typeof item.founderId === "object"
      ? item.founderId.name
      : "") ||
    item.metadata?.founderName ||
    "Founder";
  const talentName =
    item.talentName ||
    (item.talentId && typeof item.talentId === "object"
      ? item.talentId.name
      : "") ||
    item.metadata?.talentName ||
    "Talent";
  return {
    ...item,
    id,
    _id: id,
    itemType,
    founderName,
    talentName,
    companyName: item.companyName || item.metadata?.startupTitle || "",
    startupTitle:
      item.startupTitle || item.companyName || item.metadata?.startupTitle || "",
    messages,
    sentAt: item.sentAt || item.createdAt || null,
    lastActivityAt:
      item.lastActivityAt ||
      messages[messages.length - 1]?.timestamp ||
      item.updatedAt ||
      item.createdAt ||
      null,
  };
}

export function normalizeInboxItems(arr) {
  return Array.isArray(arr) ? arr.map(normalizeInboxItem) : [];
}

export function isFounderTalentInvitation(item) {
  return item?.itemType === "invitation";
}

export function isOrganizationInvitation(item) {
  return item?.itemType === "organization-invitation";
}

export const INVITE_NOTIFICATION_TYPES = new Set([
  "interest-received",
  "talent-invitation-received",
  "cohort-invitation",
  "team-invitation",
  "team-member-onboarded",
  "cohort-invitation-expiring",
  "cohort-invitation-response",
  "message-received",
  "org-announcement",
  "org-announcement-urgent",
]);

export function isInviteNotificationType(type) {
  return INVITE_NOTIFICATION_TYPES.has(String(type || ""));
}

export const INBOX_AVATAR_FALLBACK =
  "rounded-input bg-primary font-body text-xs font-semibold text-white";
export const INBOX_PRIMARY_BTN =
  "h-9 rounded-input bg-primary font-body text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.20)] transition-colors duration-200 ease-in-out hover:bg-primary-hover [&_svg]:text-white";
export const INBOX_OUTLINE_BTN =
  "h-9 rounded-input border border-surface-border bg-surface-card font-body text-[13px] font-semibold text-text-body transition-colors duration-200 ease-in-out hover:border-primary hover:bg-primary-tint hover:text-primary [&_svg]:text-text-body";
export const INBOX_CALLOUT =
  "rounded-input border border-primary/20 bg-primary-tint p-4";

export function formatInboxDateTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 0) return `Today at ${timeStr}`;
  if (diffDays === 1) return `Yesterday at ${timeStr}`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return (
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    }) + ` at ${timeStr}`
  );
}

/** Custom event name for opening the notification hub / invite modal from deep links. */
export const NOTIFICATION_HUB_EVENT = "sv:notification-hub";

export function openNotificationHub(detail = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(NOTIFICATION_HUB_EVENT, { detail: { open: true, ...detail } }),
  );
}
