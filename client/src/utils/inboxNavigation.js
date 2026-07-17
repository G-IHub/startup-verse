function normalizeUserId(value) {
  const id = String(value?._id || value || "").trim();
  if (!id || id === "undefined" || id === "null") return "";
  return id;
}

export function resolveInboxChatNavigation(item, isTalentInboxUser) {
  if (!item) return null;
  const targetId = normalizeUserId(
    isTalentInboxUser ? item.founderId : item.talentId,
  );
  if (!targetId) return null;

  return {
    page: isTalentInboxUser ? "talent-chat" : "founder-chat",
    options: { messageUserId: targetId },
  };
}

export function navigateToInboxChat({
  item,
  isTalentInboxUser,
  onClose,
  onNavigate,
}) {
  const navigation = resolveInboxChatNavigation(item, isTalentInboxUser);
  if (!navigation || typeof onNavigate !== "function") return false;

  onClose?.();
  onNavigate(navigation.page, navigation.options);
  return true;
}
