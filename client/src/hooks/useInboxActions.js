import { useCallback, useState } from "react";
import { toast } from "sonner";
import * as inboxApi from "../utils/api/inboxApi";
import { API_BASE_URL } from "../config/apiBase.js";
import * as compensationApi from "../utils/api/compensationApi";
import { getStartupId } from "../utils/startupId";
import { uploadMessageFile, sendMessage as sendDirectMessage } from "../utils/messaging";
import { deleteMessageForMe } from "../utils/messageActionsApi";
import {
  isFounderInboxRole,
  isTalentInboxRole,
  isInboxInterest,
  isOrgInboxMessage,
} from "../utils/inboxItemKind";
import {
  normalizeInboxItem,
  isFounderTalentInvitation,
  isOrganizationInvitation,
} from "../utils/inboxNormalize";
import { navigateToInboxChat } from "../utils/inboxNavigation";

const defaultFetchOptions = {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
};

function matchItemId(item, targetId) {
  return String(item?.id ?? item?._id ?? "") === String(targetId ?? "");
}

/**
 * Resolve a backing inbox entity from notification metadata / ids.
 */
export async function resolveInboxItem({
  userId,
  role,
  invitationId,
  interestId,
  messageId,
  itemType,
}) {
  if (!userId) return null;
  const isTalent = isTalentInboxRole(role);
  const isFounder = isFounderInboxRole(role);
  const invId = invitationId ? String(invitationId) : "";
  const intId = interestId ? String(interestId) : "";
  const msgId = messageId ? String(messageId) : "";

  if (itemType === "organization-invitation" || (invId && isFounder && !intId)) {
    const orgInvites = await inboxApi.getOrganizationInvitations(userId);
    const found = (orgInvites || []).find((i) => matchItemId(i, invId));
    if (found) return normalizeInboxItem({ ...found, itemType: "organization-invitation" });
  }

  if (invId) {
    if (isTalent) {
      const list = await inboxApi.getReceivedInvitations(userId);
      const found = (list || []).find((i) => matchItemId(i, invId));
      if (found) return normalizeInboxItem({ ...found, itemType: "invitation" });
    }
    if (isFounder) {
      const sent = await inboxApi.getSentInvitations(userId);
      const foundSent = (sent || []).find((i) => matchItemId(i, invId));
      if (foundSent) return normalizeInboxItem({ ...foundSent, itemType: "invitation" });
      const orgInvites = await inboxApi.getOrganizationInvitations(userId);
      const foundOrg = (orgInvites || []).find((i) => matchItemId(i, invId));
      if (foundOrg) {
        return normalizeInboxItem({ ...foundOrg, itemType: "organization-invitation" });
      }
    }
  }

  if (intId) {
    if (isFounder) {
      const list = await inboxApi.getReceivedInterests(userId);
      const found = (list || []).find((i) => matchItemId(i, intId));
      if (found) return normalizeInboxItem({ ...found, itemType: "interest" });
    }
    if (isTalent) {
      const list = await inboxApi.getSentInterests(userId);
      const found = (list || []).find((i) => matchItemId(i, intId));
      if (found) return normalizeInboxItem({ ...found, itemType: "interest" });
    }
  }

  if (msgId && isFounder) {
    try {
      const res = await fetch(`${API_BASE_URL}/messages/${userId}`, defaultFetchOptions);
      if (res.ok) {
        const data = await res.json();
        const messages = Array.isArray(data) ? data : data.messages || data.items || [];
        const found = messages.find((m) => matchItemId(m, msgId));
        if (found) {
          return {
            ...found,
            id: String(found._id ?? found.id ?? ""),
            inboxKind: "org-message",
            itemType: "org-message",
            message: found.body || found.message || "",
            subject: found.subject || "(No subject)",
            read: Boolean(found.readAt),
            sentAt: found.createdAt || found.sentAt,
            sentByName: found.from?.name || found.sentByName || "Organization",
            type: "received",
          };
        }
      }
    } catch {
      /* ignore */
    }
  }

  return null;
}

export function useInboxActions({ user, onNavigate, onItemUpdated, onClose }) {
  const userId = user?._id || user?.id;
  const isTalentInboxUser = isTalentInboxRole(user?.role);
  const isFounderInboxUser = isFounderInboxRole(user?.role);

  const [isSending, setIsSending] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const refreshItem = useCallback(
    async (item) => {
      if (!item?.id || !userId) return null;
      const resolved = await resolveInboxItem({
        userId,
        role: user?.role,
        invitationId: isFounderTalentInvitation(item) || isOrganizationInvitation(item)
          ? item.id
          : undefined,
        interestId: isInboxInterest(item) ? item.id : undefined,
        messageId: isOrgInboxMessage(item) ? item.id : undefined,
        itemType: item.itemType,
      });
      if (resolved) onItemUpdated?.(resolved);
      return resolved;
    },
    [userId, user?.role, onItemUpdated],
  );

  const quickAcceptInterest = useCallback(
    async (item) => {
      setIsSending(true);
      try {
        await inboxApi.updateInterestStatus(item.id, "accepted", "");
        toast.success("Accepted — they've been added to your team.");
        onItemUpdated?.(null);
        return true;
      } catch (error) {
        toast.error(error?.message || "Could not accept");
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [onItemUpdated],
  );

  const quickDeclineInterest = useCallback(
    async (item) => {
      setIsSending(true);
      try {
        await inboxApi.updateInterestStatus(
          item.id,
          "declined",
          "Thank you for your interest.",
        );
        toast.success("Interest declined");
        onItemUpdated?.(null);
        return true;
      } catch (error) {
        toast.error(error?.message || "Could not decline");
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [onItemUpdated],
  );

  const respondToInvitation = useCallback(
    async (item, action, messageOverride = "") => {
      const message = String(messageOverride || responseMessage || "").trim();
      setIsSending(true);
      try {
        const responseText =
          message ||
          (action === "decline"
            ? "Thank you for the invitation, but I'm not interested."
            : "");
        if (!isTalentInboxUser) {
          toast.error("Invalid action for your role");
          return false;
        }
        await inboxApi.updateInvitationStatus(
          item.id,
          action === "accept" ? "accepted" : "declined",
          responseText,
        );
        if (action === "accept") {
          setResponseMessage("");
          onItemUpdated?.(null);
          window.location.reload();
          return true;
        }
        toast.success("Declined and response sent");
        setResponseMessage("");
        onItemUpdated?.(null);
        return true;
      } catch (error) {
        toast.error(
          `Failed to ${action} invitation: ${error.message || "Please try again"}`,
        );
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [responseMessage, isTalentInboxUser, onItemUpdated],
  );

  const respondToOrgInvitation = useCallback(
    async (item, action) => {
      setIsSending(true);
      try {
        await inboxApi.respondToOrganizationInvitation(
          item.id,
          userId,
          action === "accept",
        );
        toast.success(
          action === "accept" ? "Joined cohort successfully!" : "Declined invitation",
        );
        onItemUpdated?.(null);
        return true;
      } catch (error) {
        toast.error(
          `Failed to ${action} invitation: ${error.message || "Please try again"}`,
        );
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [userId, onItemUpdated],
  );

  const sendThreadMessage = useCallback(
    async (item) => {
      const message = responseMessage.trim();
      if (!message && !pendingFile) {
        toast.error("Please write a message or attach a file");
        return false;
      }
      setIsSending(true);
      let attachments = [];
      try {
        if (pendingFile) {
          setIsUploading(true);
          setUploadProgress(0);
          const uploadResult = await uploadMessageFile(
            pendingFile,
            getStartupId(user),
            userId,
            { onProgress: setUploadProgress },
          );
          if (!uploadResult?.url) throw new Error("Upload failed");
          attachments = [
            {
              url: uploadResult.url,
              fileName: uploadResult.fileName,
              fileSize: uploadResult.fileSize,
              fileType: uploadResult.fileType,
            },
          ];
          setPendingFile(null);
        }

        const messagePayload = {
          text: message,
          sender: user.name,
          senderId: userId,
          timestamp: new Date().toISOString(),
          attachments,
        };

        if (isFounderTalentInvitation(item)) {
          await inboxApi.addInvitationMessage(item.id, messagePayload);
        } else {
          const peerId = isTalentInboxUser
            ? String(item.founderId?._id || item.founderId || "")
            : String(item.talentId?._id || item.talentId || "");
          const peerName = isTalentInboxUser
            ? item.founderName || "Founder"
            : item.talentName || "Talent";
          if (!peerId) throw new Error("Chat recipient unavailable");
          await sendDirectMessage(
            userId,
            user.name,
            user.role,
            peerId,
            peerName,
            message,
            getStartupId(user),
            false,
            attachments[0]?.url,
            attachments[0]?.fileName,
            attachments[0]?.fileSize,
            attachments[0]?.fileType,
            { attachments },
          );
        }
        toast.success("Message sent!");
        setResponseMessage("");
        const refreshed = await refreshItem(item);
        return Boolean(refreshed);
      } catch (error) {
        toast.error(error?.message || "Failed to send message. Please try again.");
        return false;
      } finally {
        setIsSending(false);
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [
      responseMessage,
      pendingFile,
      user,
      userId,
      isTalentInboxUser,
      refreshItem,
    ],
  );

  const deleteItem = useCallback(
    async (item) => {
      if (!item?.id) return false;
      setIsSending(true);
      try {
        if (isOrgInboxMessage(item)) {
          await deleteMessageForMe(item.id);
        } else if (isInboxInterest(item)) {
          await inboxApi.deleteInterest(item.id);
        } else if (isFounderTalentInvitation(item)) {
          await inboxApi.deleteInvitation(item.id);
        } else {
          return false;
        }
        toast.success("Removed");
        onItemUpdated?.(null);
        return true;
      } catch (error) {
        toast.error(error?.message || "Could not remove item");
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [onItemUpdated],
  );

  const proposeMembership = useCallback(
    async (item, direction) => {
      setIsSending(true);
      try {
        await inboxApi.proposeTeamMembership(item.id, direction);
        toast.success(
          direction === "founder"
            ? "Team membership offer sent!"
            : "Team membership proposal sent!",
        );
        onItemUpdated?.(null);
        return true;
      } catch {
        toast.error("Failed to send proposal.");
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [onItemUpdated],
  );

  const acceptMembership = useCallback(
    async (item) => {
      setIsSending(true);
      try {
        await inboxApi.acceptTeamMembershipProposal(item.id);
        toast.success("Welcome to the team!");
        onItemUpdated?.(null);
        return true;
      } catch {
        toast.error("Failed to accept offer.");
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [onItemUpdated],
  );

  const declineMembership = useCallback(
    async (item) => {
      setIsSending(true);
      try {
        await inboxApi.declineTeamMembershipProposal(item.id);
        toast.success("Offer declined.");
        onItemUpdated?.(null);
        return true;
      } catch {
        toast.error("Failed to decline.");
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [onItemUpdated],
  );

  const markInterestOnboarded = useCallback(
    async (interestId, { talentId, startupId, compensationConfig } = {}) => {
      if (compensationConfig) {
        await compensationApi.convertTalentToTeamMember(
          talentId,
          userId,
          startupId || getStartupId(user),
          compensationConfig,
          interestId,
        );
        return;
      }
      await inboxApi.markInterestAsOnboarded(interestId);
    },
    [user, userId],
  );

  const markInvitationOnboarded = useCallback(
    async ({ invitationId, talentId, startupId, compensationConfig }) => {
      await compensationApi.onboardInvitation(invitationId, {
        talentId,
        founderId: userId,
        startupId: startupId || getStartupId(user),
        compensationConfig,
      });
    },
    [user, userId],
  );

  const sendOrgMessage = useCallback(
    async ({ cohort, subject, message }) => {
      if (!cohort || !subject || !message) {
        toast.error("Please fill in all fields");
        return false;
      }
      setIsSending(true);
      try {
        const response = await fetch(`${API_BASE_URL}/messages/send-from-founder`, {
          ...defaultFetchOptions,
          method: "POST",
          body: JSON.stringify({
            cohortId: cohort.id,
            organizationId: cohort.organizationId,
            founderId: userId,
            founderName: user?.name || "Unknown",
            startupName:
              user?.companyName || `${user?.name || "Founder"}'s Startup`,
            subject,
            message,
          }),
        });
        if (!response.ok) throw new Error("Failed to send message");
        toast.success("Message sent to organization!");
        return true;
      } catch {
        toast.error("Failed to send message");
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [user, userId],
  );

  const openChatForItem = useCallback(
    (item) => {
      const opened = navigateToInboxChat({
        item,
        isTalentInboxUser,
        onNavigate,
        onClose: onClose || (() => onItemUpdated?.(null)),
      });
      if (!opened) {
        toast.error("Chat user unavailable for this conversation.");
      }
    },
    [onNavigate, isTalentInboxUser, onItemUpdated, onClose],
  );

  const openTalentProfile = useCallback(
    (item) => {
      if (!onNavigate || !item) return;
      const talentId = String(item?.talentId?._id || item?.talentId || "");
      if (!talentId) {
        toast.error("Talent profile is unavailable for this conversation.");
        return;
      }
      const talent = {
        id: talentId,
        _id: talentId,
        fullName:
          item.talentName ||
          (item.talentId && typeof item.talentId === "object"
            ? item.talentId.name
            : "Talent"),
        professionalTitle:
          item.talentArea ||
          item.role ||
          (item.talentId && typeof item.talentId === "object"
            ? item.talentId.professionalTitle
            : "") ||
          "Talent",
        skills: Array.isArray(item.talentSkills)
          ? item.talentSkills
          : item.talentSkills
            ? [String(item.talentSkills)]
            : [],
        location:
          (item.talentId && typeof item.talentId === "object"
            ? item.talentId.location
            : "") || "",
        email:
          (item.talentId && typeof item.talentId === "object"
            ? item.talentId.email
            : "") || "",
      };
      onItemUpdated?.(null);
      onNavigate("talent-profile", { talent, talentId });
    },
    [onNavigate, onItemUpdated],
  );

  return {
    userId,
    isTalentInboxUser,
    isFounderInboxUser,
    isSending,
    responseMessage,
    setResponseMessage,
    pendingFile,
    setPendingFile,
    uploadProgress,
    isUploading,
    quickAcceptInterest,
    quickDeclineInterest,
    respondToInvitation,
    respondToOrgInvitation,
    sendThreadMessage,
    deleteItem,
    proposeMembership,
    acceptMembership,
    declineMembership,
    markInterestOnboarded,
    markInvitationOnboarded,
    sendOrgMessage,
    openChatForItem,
    openTalentProfile,
    refreshItem,
  };
}
