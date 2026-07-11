import { useCallback, useEffect, useState } from "react";
import * as inboxApi from "../utils/api/inboxApi";
import * as teamMemberApi from "../utils/api/teamMemberApi";
import { isFounderInboxRole, isTalentInboxRole } from "../utils/inboxItemKind";

function matchUserId(record, peerUserId) {
  const candidates = [
    record?.talentId,
    record?.founderId,
    record?.userId,
    record?.id,
    record?._id,
  ];
  return candidates.some((value) => {
    if (!value) return false;
    if (typeof value === "object" && value._id) {
      return String(value._id) === String(peerUserId);
    }
    return String(value) === String(peerUserId);
  });
}

/**
 * Relationship between the current user and a chat peer (invite, interest, team).
 * @param {{ _id?: string, id?: string, role?: string }} currentUser
 * @param {string | null | undefined} peerUserId
 * @param {{ startupId?: string }} [options]
 */
export function usePeerRelationship(currentUser, peerUserId, options = {}) {
  const userId = String(currentUser?._id || currentUser?.id || "");
  const peerId = peerUserId ? String(peerUserId) : "";
  const isFounder = isFounderInboxRole(currentUser?.role);
  const isTalent = isTalentInboxRole(currentUser?.role);
  const startupId = String(options.startupId || currentUser?.startupId || "");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("none");
  const [invitation, setInvitation] = useState(null);
  const [interest, setInterest] = useState(null);

  const load = useCallback(async () => {
    if (!userId || !peerId) {
      setStatus("none");
      setInvitation(null);
      setInterest(null);
      return;
    }

    setLoading(true);
    try {
      if (isFounder) {
        const [teamMembers, sentInvitations, receivedInterests] = await Promise.all([
          startupId
            ? teamMemberApi.getStartupTeamMembers(startupId).catch(() => [])
            : Promise.resolve([]),
          inboxApi.getSentInvitations(userId).catch(() => []),
          inboxApi.getReceivedInterests(userId).catch(() => []),
        ]);

        const onTeam = (teamMembers || []).some(
          (member) => String(member.id || member.userId || member._id || "") === peerId,
        );
        if (onTeam) {
          setStatus("team-member");
          setInvitation(null);
          setInterest(null);
          return;
        }

        const pendingInvite = (sentInvitations || []).find(
          (row) =>
            matchUserId(row, peerId) &&
            String(row.status || "pending") === "pending",
        );
        if (pendingInvite) {
          setStatus("invitation-pending");
          setInvitation(pendingInvite);
          setInterest(null);
          return;
        }

        const peerInterest = (receivedInterests || []).find(
          (row) =>
            matchUserId(row, peerId) &&
            ["pending", "accepted"].includes(String(row.status || "pending")),
        );
        if (peerInterest) {
          setStatus(
            String(peerInterest.status) === "accepted"
              ? "interest-accepted"
              : "interest-received",
          );
          setInterest(peerInterest);
          setInvitation(null);
          return;
        }

        setStatus("none");
        setInvitation(null);
        setInterest(null);
        return;
      }

      if (isTalent) {
        const [receivedInvitations, sentInterests] = await Promise.all([
          inboxApi.getReceivedInvitations(userId).catch(() => []),
          inboxApi.getSentInterests(userId).catch(() => []),
        ]);

        const pendingInvite = (receivedInvitations || []).find(
          (row) =>
            matchUserId(row, peerId) &&
            String(row.status || "pending") === "pending",
        );
        if (pendingInvite) {
          setStatus("invitation-pending");
          setInvitation(pendingInvite);
          setInterest(null);
          return;
        }

        const sentInterest = (sentInterests || []).find(
          (row) =>
            matchUserId(row, peerId) &&
            ["pending", "accepted"].includes(String(row.status || "pending")),
        );
        if (sentInterest) {
          setStatus(
            String(sentInterest.status) === "accepted"
              ? "interest-accepted"
              : "interest-sent",
          );
          setInterest(sentInterest);
          setInvitation(null);
          return;
        }

        setStatus("none");
        setInvitation(null);
        setInterest(null);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, peerId, isFounder, isTalent, startupId]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    loading,
    status,
    invitation,
    interest,
    refetch: load,
  };
}
