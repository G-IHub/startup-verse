import * as inboxApi from "./api/inboxApi.js";

/**
 * Fetch talents accepted by a founder but not yet onboarded (compensation wizard).
 * Covers received interests (accepted, !onboarded) and sent invitations (accepted, !onboarded).
 */
export async function fetchPendingOnboarding(founderId, startupId) {
  const founderKey = String(founderId || "");
  if (!founderKey) return [];

  try {
    const [receivedInterests, sentInvitations] = await Promise.all([
      inboxApi.getReceivedInterests(founderKey),
      inboxApi.getSentInvitations(founderKey),
    ]);
    const pending = [];

    for (const i of receivedInterests || []) {
      if (i.status === "accepted" && !i.onboarded) {
        pending.push({
          id: `interest-${i.id}`,
          talentId: String(i.talentId),
          talentName: i.talentName || "Talent",
          respondedAt: i.respondedAt || i.updatedAt || i.sentAt,
          response: i.response || i.responseMessage || "",
          interestId: String(i.id),
          startupId: String(i.startupId || startupId || founderKey),
        });
      }
    }

    const interestTalentIds = new Set(pending.map((p) => p.talentId));

    for (const inv of sentInvitations || []) {
      if (inv.status !== "accepted") continue;
      if (inv.onboarded === true) continue;
      const tid = String(inv.talentId || "");
      if (!tid || interestTalentIds.has(tid)) continue;
      pending.push({
        id: `invitation-${inv.id}`,
        talentId: tid,
        talentName: inv.talentName || "Talent",
        respondedAt: inv.updatedAt || inv.sentAt,
        response: inv.response || "",
        invitationId: String(inv.id),
        startupId: String(inv.startupId || startupId || founderKey),
      });
    }

    return pending;
  } catch (e) {
    console.error("[fetchPendingOnboarding] failed:", e);
    return [];
  }
}

export {
  applySyntheticNotificationState,
  buildSyntheticPendingNotifications,
} from "./pendingOnboardingNotifications.js";
