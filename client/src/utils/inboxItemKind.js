/** Shared inbox row classification (UI + actions menu). */

export function isOrgInboxMessage(item) {
  if (!item || typeof item !== "object") return false;
  if (item.inboxKind === "org-message" || item.itemType === "org-message") {
    return true;
  }
  const messageType = String(item.messageType || "");
  if (
    item.organizationId &&
    messageType &&
    messageType !== "dm"
  ) {
    return true;
  }
  return (
    Boolean(item.subject) &&
    Boolean(item.sentByName) &&
    item.talentId == null &&
    item.founderId == null &&
    item.status == null &&
    item.itemType !== "interest" &&
    item.itemType !== "invitation"
  );
}

export function isInboxInvitation(item) {
  if (!item) return false;
  if (isOrgInboxMessage(item)) return false;
  if (item.itemType === "interest" || item.itemType === "organization-invitation") {
    return false;
  }
  return item.itemType === "invitation" || item.kind === "founder-talent";
}

export function isInboxInterest(item) {
  if (!item) return false;
  if (isOrgInboxMessage(item)) return false;
  if (item.itemType === "interest") return true;
  if (isInboxInvitation(item) || item.itemType === "organization-invitation") {
    return false;
  }
  const talentId = String(item.talentId?._id || item.talentId || "");
  if (!talentId) return false;
  return item.founderId != null || item.startupId != null || item.startupTitle != null;
}

export function isFounderInboxRole(role) {
  return String(role || "").toLowerCase().includes("founder");
}

export function isTalentInboxRole(role) {
  const r = String(role || "").toLowerCase();
  return r.includes("talent") || r === "team-member" || r === "team_member";
}
