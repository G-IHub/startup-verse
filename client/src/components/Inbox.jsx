import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config/apiBase.js";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Send,
  Mail,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  MessageSquare,
  User as UserIconLucide,
  UserPlus,
  ArrowLeft,
  Inbox as InboxIcon,
  Heart,
  Calendar,
  Building2,
  MessageCircle,
  Handshake,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Label } from "./ui/label";
import * as inboxApi from "../utils/api/inboxApi";
import * as organizationApi from "../utils/api/organizationApi";
import { subscribeToInterests, subscribeToInvitations } from "../utils/socketIoRealtime.js";
import CompensationSetupWizard from "./compensation/CompensationSetupWizard";
import { getStartupId } from "../utils/startupId";
import { ChatComposer } from "./messaging/ChatComposer";
import { MessageAttachmentBubble } from "./messaging/MessageAttachmentBubble";
import { uploadMessageFile, sendMessage as sendDirectMessage } from "../utils/messaging";
import {
  normalizeMessageAttachments,
  formatConversationPreview,
} from "../utils/messageAttachmentUtils";
import { InboxItemMenu } from "./InboxItemMenu";
import {
  isOrgInboxMessage,
  isInboxInterest,
  isFounderInboxRole,
  isTalentInboxRole,
} from "../utils/inboxItemKind";
import { deleteMessageForMe } from "../utils/messageActionsApi";

// Default fetch options for cookie-based auth
const defaultOptions = {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
};

const INBOX_CARD_BASE =
  "cursor-pointer rounded-input border border-surface-border bg-surface-card shadow-none transition-all duration-200 ease-in-out hover:bg-surface-page";
const INBOX_CARD_UNREAD = "border-primary/35 bg-primary/5";
const INBOX_AVATAR_FALLBACK =
  "rounded-input bg-primary font-body text-xs font-semibold text-white";
const INBOX_PRIMARY_BTN =
  "h-9 rounded-input bg-primary font-body text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.20)] transition-colors duration-200 ease-in-out hover:bg-primary-hover [&_svg]:text-white";
const INBOX_OUTLINE_BTN =
  "h-9 rounded-input border border-surface-border bg-surface-card font-body text-[13px] font-semibold text-text-body transition-colors duration-200 ease-in-out hover:border-primary hover:bg-primary-tint hover:text-primary [&_svg]:text-text-body";
const INBOX_CALLOUT =
  "rounded-input border border-primary/20 bg-primary-tint p-4";
const INBOX_SKILL_BADGE =
  "h-5 rounded-pill border-0 bg-surface-page px-2 py-0 font-body text-[10px] font-medium text-text-body shadow-none";

// Normalize MongoDB _id to id so all item.id references work
const normalizeItem = (item) => {
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
    (hasOrgCohortKeys && !hasTalentChannelShape) || isLegacyOrgFounderInvite
      ? "organization-invitation"
      : isFounderTalentInvite
        ? "invitation"
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
  // MongoDB may populate founderId/talentId as objects — extract name if missing
  const founderName = item.founderName ||
    (item.founderId && typeof item.founderId === "object" ? item.founderId.name : "") ||
    item.metadata?.founderName ||
    "Founder";
  const talentName = item.talentName ||
    (item.talentId && typeof item.talentId === "object" ? item.talentId.name : "") ||
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
    startupTitle: item.startupTitle || item.companyName || item.metadata?.startupTitle || "",
    messages,
    sentAt: item.sentAt || item.createdAt || null,
    lastActivityAt:
      item.lastActivityAt ||
      messages[messages.length - 1]?.timestamp ||
      item.updatedAt ||
      item.createdAt ||
      null,
  };
};
const normalizeItems = (arr) => (Array.isArray(arr) ? arr.map(normalizeItem) : []);
const isFounderTalentInvitation = (item) => item?.itemType === "invitation";
const isOrganizationInvitation = (item) => item?.itemType === "organization-invitation";

// Session-only read tracking (no persistent client cache)
const inboxReadTimestamps = {};
const markAsRead = (messageId) => {
  inboxReadTimestamps[messageId] = new Date().toISOString();
};
const isInterestItem = isInboxInterest;

/** One pending interest row per talent (newest wins). */
const dedupeReceivedInterests = (items) => {
  const rest = [];
  const byTalent = new Map();
  for (const item of items) {
    if (!isInterestItem(item)) {
      rest.push(item);
      continue;
    }
    const talentId = String(item.talentId?._id || item.talentId || "");
    if (!talentId) continue;
    const itemTime = new Date(item.sentAt || item.createdAt || 0).getTime();
    const prev = byTalent.get(talentId);
    const prevTime = prev
      ? new Date(prev.sentAt || prev.createdAt || 0).getTime()
      : 0;
    if (!prev || itemTime >= prevTime) {
      byTalent.set(talentId, item);
    }
  }
  return [...rest, ...byTalent.values()];
};

const hasNewActivity = (
  messageId,
  lastActivityAt,
  sentAt,
  item,
  currentUserId,
) => {
  const lastReadAt = inboxReadTimestamps[messageId];
  const uid = String(currentUserId || "");

  // Talent interest rows: inbox is for the initial expression only — ongoing chat uses Chat/DM
  if (isInterestItem(item)) {
    if (lastReadAt) return false;
    if (item.status !== "pending") return false;
    if (Array.isArray(item.messages) && item.messages.length > 0) return false;
    const sentDate = new Date(sentAt || item.sentAt || item.createdAt);
    if (Number.isNaN(sentDate.getTime())) return false;
    const hoursSinceSent =
      (Date.now() - sentDate.getTime()) / (1000 * 60 * 60);
    return hoursSinceSent < 24;
  }

  // If no lastActivityAt, it's an old message from before this feature → not new
  if (!lastActivityAt) return false;
  const activityDate = new Date(lastActivityAt);
  const sentDate = new Date(sentAt);
  const now = new Date();
  const hoursSinceSent =
    (now.getTime() - sentDate.getTime()) / (1000 * 60 * 60);
  const hoursSinceActivity =
    (now.getTime() - activityDate.getTime()) / (1000 * 60 * 60);

  // Check if the last activity was caused by the current user (they sent a message)
  // If so, don't show as NEW - only show NEW when OTHER person sends a message
  if (item.messages && item.messages.length > 0) {
    const lastMessage = item.messages[item.messages.length - 1];
    if (String(lastMessage.senderId) === uid) {
      return false;
    }
  }

  // Check if status was changed by the recipient (not initial pending status)
  // If status changed from pending and we haven't read it yet, show as NEW
  if (item.status !== "pending" && !lastReadAt) {
    // Status was changed (accepted/declined) and we haven't read it
    return hoursSinceActivity < 24; // Show as NEW if status change was recent
  }

  // If lastActivityAt equals sentAt, there's been no activity since initial send
  // In this case, only mark as new if it's very recent (< 1 hour) and never read
  if (lastActivityAt === sentAt) {
    // No replies/status changes yet
    // Only show as NEW if sent very recently (< 1 hour) and never read
    if (!lastReadAt && hoursSinceSent < 1) {
      return true;
    }
    return false;
  }

  // There was activity after initial send (reply or status change from OTHER person)
  // Show as NEW only if activity is recent (< 24 hours) and never read
  // OR if activity happened after last read
  if (!lastReadAt) {
    // If never read, only show as NEW if activity is recent (< 24 hours)
    return hoursSinceActivity < 24;
  }

  // If we've read it before, show as NEW only if there's been activity since last read
  if (new Date(lastActivityAt) > new Date(lastReadAt)) {
    return true;
  }
  return false;
};

// Count messages with new activity (for badge count)
const countUnreadMessages = (messages, userId) => {
  return messages.filter((msg) =>
    hasNewActivity(
      msg.id,
      msg.lastActivityAt || msg.sentAt,
      msg.sentAt,
      msg,
      userId,
    ),
  ).length;
};
export default function Inbox({ user, onBack, initialTab = "received", onNavigate }) {
  // Handle both _id (MongoDB) and id fields
  const userId = user?._id || user?.id;
  const isTalentInboxUser = isTalentInboxRole(user?.role);
  const isFounderInboxUser = isFounderInboxRole(user?.role);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [receivedItems, setReceivedItems] = useState([]);
  const [sentItems, setSentItems] = useState([]);
  const [orgInvitations, setOrgInvitations] = useState([]);
  const [orgMessages, setOrgMessages] = useState([]);
  const [founderCohorts, setFounderCohorts] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [pendingInboxFile, setPendingInboxFile] = useState(null);
  const [inboxUploadProgress, setInboxUploadProgress] = useState(0);
  const [isInboxUploading, setIsInboxUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [readMessages, setReadMessages] = useState([]);
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);
  const [onboardingTalent, setOnboardingTalent] = useState(null);
  const [showOrgMessageComposer, setShowOrgMessageComposer] = useState(false);
  const [pendingInvitationAcceptance, setPendingInvitationAcceptance] = useState(null);
  const [acceptanceConfirmed, setAcceptanceConfirmed] = useState(false);
  const [orgMessageData, setOrgMessageData] = useState({
    cohortId: "",
    subject: "",
    message: "",
  });
  useEffect(() => {
    if (userId) {
      loadInboxData();
    }
  }, [user, userId]);

  // Refresh data when initialTab changes (e.g., navigating from TeamMatching)
  useEffect(() => {
    setActiveTab(initialTab);
    // Refresh data when navigating to inbox
    if (userId) {
      loadInboxData();
    }
  }, [initialTab]);

  // Subscribe to real-time socket events for instant inbox updates
  useEffect(() => {
    if (!userId) return;

    // Subscribe to interest events
    const unsubInterests = subscribeToInterests(userId, (event) => {
      console.log("📨 [Inbox] Interest event received:", event);
      // Refresh inbox data when interest is created or updated
      loadInboxData();
    });

    // Subscribe to invitation events
    const unsubInvitations = subscribeToInvitations(userId, (event) => {
      console.log("📨 [Inbox] Invitation event received:", event);
      // Refresh inbox data when invitation is created or updated
      loadInboxData();
    });

    return () => {
      unsubInterests?.();
      unsubInvitations?.();
    };
  }, [userId]);

  const loadInboxData = async () => {
    if (!userId) {
      console.error("❌ [Inbox] No userId available, skipping load");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    console.log(
      "🔄 [Inbox] Loading inbox data for user:",
      userId,
      "role:",
      user?.role,
    );
    try {
      if (isTalentInboxUser) {
        // Talent receives invitations from founders
        const invitations = normalizeItems(
          await inboxApi.getReceivedInvitations(userId),
        ).filter(isFounderTalentInvitation);
        setReceivedItems(invitations);

        // Talent sends interests to founders
        const interests = normalizeItems(
          await inboxApi.getSentInterests(userId),
        ).filter((item) => !isFounderTalentInvitation(item) && !isOrganizationInvitation(item));
        setSentItems(interests);
        console.log("✅ [Inbox] Loaded talent inbox data:", {
          receivedInvitations: invitations.length,
          sentInterests: interests.length,
        });
      } else if (isFounderInboxUser) {
        // Founders receive interests from talent
        console.log(
          "🔍 [Inbox-Founder] Fetching received interests for:",
          userId,
        );
        const interests = await inboxApi.getReceivedInterests(userId);
        console.log("📥 [Inbox-Founder] Received interests:", interests);
        setReceivedItems(
          dedupeReceivedInterests(
            normalizeItems(interests).filter(
              (item) =>
                !isFounderTalentInvitation(item) && !isOrganizationInvitation(item),
            ),
          ),
        );

        // Founders send invitations to talent
        const rawInvitations = await inboxApi.getSentInvitations(userId);
        const invitations = normalizeItems(rawInvitations).filter(
          isFounderTalentInvitation,
        );
        console.log(
          "📤 [Inbox-Founder] Sent invitations (should only be to talent):",
          invitations,
        );
        console.log(
          "🔍 [Inbox-Founder] Checking invitation types:",
          invitations.map((inv) => ({
            id: inv.id.slice(0, 20),
            hasFounderId: "founderId" in inv,
            hasTalentId: "talentId" in inv,
            hasOrganizationId: "organizationId" in inv,
            hasCohortId: "cohortId" in inv,
            type:
              "organizationId" in inv || "cohortId" in inv
                ? "ORG_INVITATION (WRONG!)"
                : "talent_invitation (correct)",
          })),
        );
        setSentItems(invitations);

        // Founders also receive organization invitations
        console.log(
          "🔍 [Inbox-Founder] Fetching organization invitations for:",
          userId,
        );
        const orgInvites = await inboxApi.getOrganizationInvitations(userId);
        console.log("📥 [Inbox-Founder] Organization invitations:", orgInvites);
        setOrgInvitations(orgInvites);

        // Load organization messages for founder
        try {
          const response = await fetch(
            `${API_BASE_URL}/messages/${userId}`,
            defaultOptions,
          );
          if (response.ok) {
            const messagesData = await response.json();
            const messageList = Array.isArray(messagesData?.data)
              ? messagesData.data
              : messagesData?.messages || messagesData?.data?.messages || [];
            const orgOnly = messageList
              .filter(
                (m) =>
                  Boolean(m?.organizationId) &&
                  String(m?.messageType || "dm") !== "dm",
              )
              .map((m) => {
                const id = String(m.id || m._id || "");
                const isIncoming = String(m.toUserId) === String(userId);
                return {
                  ...m,
                  id,
                  _id: id,
                  inboxKind: "org-message",
                  itemType: "org-message",
                  message: m.body || m.message || "",
                  subject: m.subject || "(No subject)",
                  read: Boolean(m.readAt),
                  sentAt: m.createdAt || m.sentAt,
                  sentByName:
                    m.from?.name ||
                    m.sentByName ||
                    m.metadata?.sentByName ||
                    "Organization",
                  type: isIncoming ? "received" : "sent",
                };
              });
            setOrgMessages(orgOnly);
            console.log(
              "📨 [Inbox-Founder] Organization messages loaded:",
              messageList.length,
            );
          }
        } catch (error) {
          console.error("Error loading organization messages:", error);
        }

        // Load founder cohorts for message composer (server memberships)
        try {
          const { memberships } =
            await organizationApi.getFounderMemberships(userId);
          const seen = new Set();
          const cohortsWithDetails = [];
          for (const m of memberships || []) {
            const c = m.cohort;
            if (!c) continue;
            const cid = String(c._id ?? c.id ?? "");
            if (!cid || seen.has(cid)) continue;
            seen.add(cid);
            cohortsWithDetails.push({
              id: cid,
              name: c.name || "",
              organizationId: String(c.organizationId ?? ""),
              organizationName: c.name || "",
            });
          }
          setFounderCohorts(cohortsWithDetails);
          console.log(
            "📚 [Inbox-Founder] Loaded cohorts:",
            cohortsWithDetails.length,
          );
        } catch (error) {
          console.error("Error loading founder cohorts:", error);
          setFounderCohorts([]);
        }
        console.log("✅ [Inbox] Loaded founder inbox data:", {
          receivedInterests: interests.length,
          sentInvitations: invitations.length,
          organizationInvitations: orgInvites.length,
          organizationMessages: orgMessages.length,
          interestsData: interests,
          invitationsData: invitations,
          orgInvitationsData: orgInvites,
        });
      }
    } catch (error) {
      console.error("❌ [Inbox] Error loading inbox data:", {
        error: error.message,
        stack: error.stack,
        userId: userId,
        role: user?.role,
        timestamp: new Date().toISOString(),
      });
      toast.error(`Failed to load inbox data: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };
  const handleRespond = async (item, action) => {
    const message = responseMessage.trim();
    if (!message && action === "accept") {
      toast.error("Please write a message with your response");
      return;
    }
    setIsSending(true);
    try {
      const responseText =
        message ||
        (action === "decline"
          ? "Thank you for your interest, but we're moving forward with other candidates."
          : "");
      if (isFounderInboxUser) {
        // Founder responding to interest - server now handles automatic onboarding
        await inboxApi.updateInterestStatus(
          item.id,
          action === "accept" ? "accepted" : "declined",
          responseText,
        );
        // Note: Server automatically onboards talent as team member when accepting
      } else {
        // This shouldn't happen as talent doesn't accept/reject, but keeping for completeness
        toast.error("Invalid action for your role");
        return;
      }
      toast.success(
        action === "accept"
          ? "✅ Accepted! They've been added to your team."
          : "❌ Declined and response sent",
      );
      setSelectedItem(null);
      setResponseMessage("");
      await loadInboxData();
    } catch (error) {
      console.error("❌ Error responding:", error);
      toast.error("Failed to send response. Please try again.");
    } finally {
      setIsSending(false);
    }
  };
  const handleSendMessage = async (item) => {
    const message = responseMessage.trim();
    if (!message && !pendingInboxFile) {
      toast.error("Please write a message or attach a file");
      return;
    }
    setIsSending(true);
    let attachments = [];
    try {
      if (pendingInboxFile) {
        setIsInboxUploading(true);
        setInboxUploadProgress(0);
        const uploadResult = await uploadMessageFile(
          pendingInboxFile,
          getStartupId(user),
          userId,
          { onProgress: setInboxUploadProgress },
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
        setPendingInboxFile(null);
      }

      const messagePayload = {
        text: message,
        sender: user.name,
        senderId: userId,
        timestamp: new Date().toISOString(),
        attachments,
      };

      const isInv = isFounderTalentInvitation(item);
      if (isInv) {
        await inboxApi.addInvitationMessage(item.id, messagePayload);
      } else {
        const peerId = isTalentInboxUser
          ? String(item.founderId?._id || item.founderId || "")
          : String(item.talentId?._id || item.talentId || "");
        const peerName = isTalentInboxUser
          ? item.founderName || "Founder"
          : item.talentName || "Talent";
        if (!peerId) {
          throw new Error("Chat recipient unavailable");
        }
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
      markAsRead(item.id);
      await loadInboxData();

      if (isInv) {
        if (activeTab === "sent") {
          const updated = await inboxApi.getSentInvitations(userId);
          const updatedItem = updated.find(
            (i) => String(i.id ?? i._id ?? "") === String(item.id ?? item._id ?? ""),
          );
          if (updatedItem) setSelectedItem(normalizeItem(updatedItem));
        } else {
          const updated = await inboxApi.getReceivedInvitations(userId);
          const updatedItem = updated.find(
            (i) => String(i.id ?? i._id ?? "") === String(item.id ?? item._id ?? ""),
          );
          if (updatedItem) setSelectedItem(normalizeItem(updatedItem));
        }
      } else if (activeTab === "sent") {
        const updated = await inboxApi.getSentInterests(userId);
        const updatedItem = updated.find(
          (i) => String(i.id ?? i._id ?? "") === String(item.id ?? item._id ?? ""),
        );
        if (updatedItem) setSelectedItem(normalizeItem(updatedItem));
      } else {
        const updated = await inboxApi.getReceivedInterests(userId);
        const updatedItem = updated.find(
          (i) => String(i.id ?? i._id ?? "") === String(item.id ?? item._id ?? ""),
        );
        if (updatedItem) setSelectedItem(normalizeItem(updatedItem));
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(error?.message || "Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
      setIsInboxUploading(false);
      setInboxUploadProgress(0);
    }
  };
  const handleRespondToInvitation = async (item, action) => {
    const message = responseMessage.trim();
    setIsSending(true);
    console.log("🎯 [Talent] Responding to invitation:", {
      action,
      invitationId: item.id,
      message,
    });
    try {
      const responseText =
        message ||
        (action === "decline"
          ? "Thank you for the invitation, but I'm not interested."
          : "");
      if (isTalentInboxUser) {
        // Talent responding to invitation
        console.log("📤 Calling updateInvitationStatus API...");
        await inboxApi.updateInvitationStatus(
          item.id,
          action === "accept" ? "accepted" : "declined",
          responseText,
        );
        console.log("✅ API call successful");
      } else {
        // This shouldn't happen as founders don't accept/reject invitations, but keeping for completeness
        toast.error("Invalid action for your role");
        return;
      }
      if (action === "accept") {
        // Silent refresh so auth/session state rehydrates with new role (team-member).
        setPendingInvitationAcceptance(null);
        setAcceptanceConfirmed(false);
        setSelectedItem(null);
        setResponseMessage("");
        window.location.reload();
        return;
      }
      toast.success("❌ Declined and response sent!");
      setSelectedItem(null);
      setPendingInvitationAcceptance(null);
      setAcceptanceConfirmed(false);
      setResponseMessage("");
      await loadInboxData();
    } catch (error) {
      console.error("❌ [Talent] Error responding to invitation:", error);
      toast.error(
        `Failed to ${action} invitation: ${error.message || "Please try again"}`,
      );
    } finally {
      setIsSending(false);
    }
  };
  const handleReviewStartupBeforeAccept = () => {
    if (!pendingInvitationAcceptance?.startupId || !onNavigate) return;
    setPendingInvitationAcceptance(null);
    setAcceptanceConfirmed(false);
    setSelectedItem(null);
    onNavigate("startup-detail", {
      startupId: pendingInvitationAcceptance.startupId,
    });
  };
  const handleRespondToOrgInvitation = async (item, action) => {
    setIsSending(true);
    console.log("🏢 [Founder] Responding to organization invitation:", {
      action,
      invitationId: item.id,
    });
    try {
      await inboxApi.respondToOrganizationInvitation(
        item.id,
        userId,
        action === "accept",
      );
      toast.success(
        action === "accept"
          ? "✅ Joined cohort successfully!"
          : "❌ Declined invitation",
      );
      setSelectedItem(null);
      setResponseMessage("");
      await loadInboxData();
    } catch (error) {
      console.error("❌ [Founder] Error responding to org invitation:", error);
      toast.error(
        `Failed to ${action} invitation: ${error.message || "Please try again"}`,
      );
    } finally {
      setIsSending(false);
    }
  };
  const handleSendOrgMessage = async (e) => {
    e.preventDefault();
    if (
      !orgMessageData.cohortId ||
      !orgMessageData.subject ||
      !orgMessageData.message
    ) {
      toast.error("Please fill in all fields");
      return;
    }
    const cohort = founderCohorts.find((c) => c.id === orgMessageData.cohortId);
    if (!cohort) {
      toast.error("Cohort not found");
      return;
    }
    setIsSending(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/messages/send-from-founder`,
        {
          ...defaultOptions,
          method: "POST",
          body: JSON.stringify({
            cohortId: cohort.id,
            organizationId: cohort.organizationId,
            founderId: userId,
            founderName: user?.name || "Unknown",
            startupName: user?.companyName || user?.name + "'s Startup" || "Startup",
            subject: orgMessageData.subject,
            message: orgMessageData.message,
          }),
        },
      );
      if (!response.ok) throw new Error("Failed to send message");
      toast.success("Message sent to organization!");
      setOrgMessageData({
        cohortId: "",
        subject: "",
        message: "",
      });
      setShowOrgMessageComposer(false);
      await loadInboxData();
    } catch (error) {
      console.error("Error sending organization message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };
  const getStatusBadge = (status) => {
    switch (status) {
      case "accepted":
        return (
          <Badge className="rounded-full border-0 bg-status-success/10 px-3 py-[3px] font-body text-[12px] font-semibold text-status-success shadow-none">
            <CheckCircle2 className="mr-1 h-3 w-3 text-status-success" />
            Accepted
          </Badge>
        );
      case "declined":
        return (
          <Badge className="rounded-full border-0 bg-status-error/10 px-3 py-[3px] font-body text-[12px] font-semibold text-status-error shadow-none">
            <XCircle className="mr-1 h-3 w-3 text-status-error" />
            Declined
          </Badge>
        );
      case "proposed-by-founder":
        return (
          <Badge className="rounded-full border-0 bg-primary-tint px-3 py-[3px] font-body text-[12px] font-semibold text-primary shadow-none">
            <Handshake className="mr-1 h-3 w-3 text-primary" />
            Offer Sent
          </Badge>
        );
      case "proposed-by-talent":
        return (
          <Badge className="rounded-full border-0 bg-accent-tint px-3 py-[3px] font-body text-[12px] font-semibold text-accent shadow-none">
            <Handshake className="mr-1 h-3 w-3 text-accent" />
            Proposed
          </Badge>
        );
      default:
        return (
          <Badge className="rounded-full border-0 bg-status-warning/10 px-3 py-[3px] font-body text-[12px] font-semibold text-status-warning shadow-none">
            <Clock className="mr-1 h-3 w-3 text-status-warning" />
            Pending
          </Badge>
        );
    }
  };
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Format date and time in detail
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Time formatting
    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    // Date formatting based on recency
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
  };

  // Sort messages by date - newest activity first (replies/status changes bubble to top)
  const getInboxSortDate = (item) => {
    if (isInterestItem(item)) {
      return new Date(item.sentAt || item.createdAt || 0);
    }
    return new Date(
      item.lastActivityAt ||
        item.respondedAt ||
        item.sentAt ||
        item.createdAt ||
        0,
    );
  };

  const sortMessagesByDate = (items) => {
    const sorted = [...items].sort((a, b) => {
      const dateA = getInboxSortDate(a).getTime();
      const dateB = getInboxSortDate(b).getTime();
      if (Number.isNaN(dateA) && Number.isNaN(dateB)) return 0;
      if (Number.isNaN(dateA)) return 1;
      if (Number.isNaN(dateB)) return -1;

      return dateB - dateA;
    });
    console.log(
      "📊 [Inbox] Sorted messages by activity (NEWEST FIRST):",
      sorted.map((m, index) => ({
        position: index + 1,
        id: m.id.slice(0, 8),
        sentAt: m.sentAt,
        lastActivityAt: m.lastActivityAt,
        createdAt: m.createdAt,
        status: m.status,
        type:
          "cohortId" in m
            ? "org_invitation"
            : "startupTitle" in m
              ? "interest"
              : "invitation",
      })),
    );
    return sorted;
  };
  const isInvitation = (item) => {
    return isFounderTalentInvitation(item);
  };

  const receivedOrgMessagesForDisplay =
    isFounderInboxUser
      ? orgMessages.filter(
          (msg) => msg.type === "received" || !msg.type || !msg.fromFounder,
        )
      : [];

  const allReceivedForStats = isFounderInboxUser
    ? [...receivedItems, ...orgInvitations, ...receivedOrgMessagesForDisplay]
    : receivedItems;

  const pendingReceivedCount =
    receivedItems.filter((i) => i.status === "pending").length +
    orgInvitations.filter((i) => i.status === "pending").length;

  const unreadOrgMessageCount = receivedOrgMessagesForDisplay.filter(
    (m) => !m.read,
  ).length;

  const activityUnreadCount = countUnreadMessages(
    allReceivedForStats.filter(
      (item) =>
        !isOrgInboxMessage(item),
    ),
    userId,
  );

  const getDateGroupLabel = (date) => {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfItem = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const diffDays = Math.round(
      (startOfToday - startOfItem) / (1000 * 60 * 60 * 24),
    );
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year:
        date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const renderInboxSummary = () => {
    if (isLoading) return null;
    const stats = [
      {
        label: "Pending",
        value: pendingReceivedCount,
        hint: "Needs your response",
        accent: pendingReceivedCount > 0,
      },
      {
        label: "Unread",
        value: unreadOrgMessageCount + activityUnreadCount,
        hint: "New since last visit",
        accent: unreadOrgMessageCount + activityUnreadCount > 0,
      },
      {
        label: activeTab === "received" ? "In received" : "In sent",
        value: activeTab === "received" ? allReceivedForStats.length : sentItems.length,
        hint: activeTab === "received" ? "All items" : "Messages you sent",
        accent: false,
      },
    ];
    return (
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-card border border-surface-border bg-surface-card px-4 py-3 shadow-soft"
          >
            <p className="font-body text-[11px] font-medium uppercase tracking-wide text-text-muted">
              {stat.label}
            </p>
            <p
              className={`mt-0.5 font-heading text-2xl font-extrabold tabular-nums ${
                stat.accent ? "text-primary" : "text-text-heading"
              }`}
            >
              {stat.value}
            </p>
            <p className="mt-0.5 font-body text-xs text-text-muted">{stat.hint}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderDateSeparator = (label) => (
    <div
      key={`date-${label}`}
      className="flex items-center gap-3 py-1"
      aria-hidden
    >
      <div className="h-px flex-1 bg-surface-border" />
      <span className="shrink-0 font-body text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </span>
      <div className="h-px flex-1 bg-surface-border" />
    </div>
  );

  const renderReceivedTab = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
          <p className="font-body text-sm text-text-muted">Loading inbox...</p>
        </div>
      );
    }

    const allReceivedItems = allReceivedForStats;
    console.log("📊 [Inbox-RenderReceived] Displaying received items:", {
      role: user?.role,
      receivedCount: receivedItems.length,
      orgInvitationsCount: orgInvitations.length,
      orgMessagesCount: receivedOrgMessagesForDisplay.length,
      totalCount: allReceivedItems.length,
      items: allReceivedItems.map((item) => ({
        id: item.id.slice(0, 8),
        type: isInvitation(item) ? "invitation" : "interest",
        from: isInvitation(item) ? item.founderName : item.talentName,
        status: item.status,
      })),
    });
    if (allReceivedItems.length === 0) {
      return (
        <Card className="rounded-card border-0 bg-surface-card shadow-soft">
          <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <InboxIcon className="mb-4 h-16 w-16 text-surface-border" />
            <h3 className="mb-2 font-heading text-lg font-semibold text-text-heading">
              No messages yet
            </h3>
            <p className="max-w-sm font-body text-sm text-text-muted">
              {isTalentInboxUser
                ? "When founders send you invitations, they'll appear here."
                : "When talent expresses interest in your startup or you receive organization invitations, they'll appear here."}
            </p>
          </CardContent>
        </Card>
      );
    }

    const sortedItems = sortMessagesByDate(allReceivedItems);
    let lastDateLabel = null;
    return (
      <div className="w-full space-y-2">
        {sortedItems.map((item) => {
          const itemDate = getInboxSortDate(item);
          const dateLabel = !Number.isNaN(itemDate.getTime())
            ? getDateGroupLabel(itemDate)
            : null;
          const showSeparator = dateLabel && dateLabel !== lastDateLabel;
          if (showSeparator) lastDateLabel = dateLabel;
          // Check if this is an organization message
          if (isOrgInboxMessage(item)) {
            // Render organization message card
            const orgMsg = item;
            const isNewMessage = !orgMsg.read;
            return (
              <React.Fragment key={orgMsg.id}>
                {showSeparator ? renderDateSeparator(dateLabel) : null}
              <Card
                className={`${INBOX_CARD_BASE} ${isNewMessage ? INBOX_CARD_UNREAD : ""}`}
                onClick={() => {
                  setSelectedItem(orgMsg);
                  markAsRead(orgMsg.id);
                }}
              >
                <CardContent className="px-3 py-2.5">
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className={INBOX_AVATAR_FALLBACK}>
                          <Building2 className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      {isNewMessage && (
                        <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-primary ring-2 ring-surface-card" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <div className="flex flex-1 items-center gap-2">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <h4 className="font-heading text-[13px] font-semibold text-text-heading">
                            {orgMsg.subject}
                          </h4>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                        {isNewMessage && (
                          <Badge className="rounded-full border-0 bg-primary-tint px-2 py-0 font-body text-[10px] font-semibold text-primary shadow-none">
                            NEW
                          </Badge>
                        )}
                        <InboxItemMenu
                          {...buildInboxMenuProps(orgMsg, "received", isNewMessage)}
                        />
                        </div>
                      </div>
                      <p className="mb-2 font-body text-xs text-text-body">
                        From{" "}
                        <span className="font-medium text-primary">
                          {orgMsg.sentByName || "Organization"}
                        </span>
                      </p>
                      <p className="mb-1.5 line-clamp-2 font-body text-[12px] text-text-body">
                        {orgMsg.message}
                      </p>
                      <div className="flex items-center gap-2 font-body text-xs text-text-muted">
                        <Calendar className="h-3 w-3" />
                        <span
                          className={
                            isNewMessage ? "font-semibold text-primary" : ""
                          }
                        >
                          {formatDateTime(orgMsg.sentAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </React.Fragment>
            );
          }

          // Check if this is an organization invitation
          const isOrgInvite = isOrganizationInvitation(item);
          if (isOrgInvite) {
            // Render organization invitation card
            const orgInvite = item;
            const isNewMessage = hasNewActivity(
              orgInvite.id,
              orgInvite.respondedAt || orgInvite.sentAt || orgInvite.createdAt,
              orgInvite.sentAt || orgInvite.createdAt,
              orgInvite,
              userId,
            );
            return (
              <React.Fragment key={orgInvite.id}>
                {showSeparator ? renderDateSeparator(dateLabel) : null}
              <Card
                className={`${INBOX_CARD_BASE} ${isNewMessage ? INBOX_CARD_UNREAD : ""}`}
                onClick={() => {
                  setSelectedItem(orgInvite);
                  markAsRead(orgInvite.id);
                  setReadMessages((prev) => [...prev, orgInvite.id]);
                }}
              >
                <CardContent className="px-3 py-2.5">
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className={INBOX_AVATAR_FALLBACK}>
                          {(orgInvite.organizationName || "O")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {isNewMessage && (
                        <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-primary ring-2 ring-surface-card" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <div className="flex flex-1 items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <h4 className="font-heading text-[13px] font-semibold text-text-heading">
                            Cohort invitation
                          </h4>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          {getStatusBadge(orgInvite.status)}
                          {orgInvite.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className={`hidden h-7 gap-1.5 whitespace-nowrap text-xs sm:inline-flex ${INBOX_OUTLINE_BTN}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedItem(orgInvite);
                                markAsRead(orgInvite.id);
                              }}
                            >
                              Review
                            </Button>
                          )}
                          <InboxItemMenu
                            {...buildInboxMenuProps(orgInvite, "received", isNewMessage)}
                          />
                        </div>
                      </div>
                      <p className="mb-2 font-body text-xs text-text-body">
                        <span className="font-medium text-primary">
                          {orgInvite.organizationName || "Organization"}
                        </span>
                        <span className="text-text-muted"> · </span>
                        <span className="font-medium text-text-heading">
                          {orgInvite.cohortName || "Cohort"}
                        </span>
                      </p>
                      {orgInvite.message && (
                        <p className="mb-1.5 line-clamp-2 font-body text-[12px] text-text-body">
                          {orgInvite.message}
                        </p>
                      )}
                      <div className="flex items-center gap-2 font-body text-xs text-text-muted">
                        <Calendar className="h-3 w-3" />
                        <span
                          className={
                            isNewMessage ? "font-semibold text-primary" : ""
                          }
                        >
                          {formatDateTime(
                            orgInvite.respondedAt ||
                              orgInvite.sentAt ||
                              orgInvite.createdAt,
                          )}
                        </span>
                        {isNewMessage && (
                          <Badge className="ml-2 rounded-full border-0 bg-primary-tint px-2 py-0 font-body text-[10px] font-semibold text-primary shadow-none">
                            NEW
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </React.Fragment>
            );
          }

          // Render regular talent interest/invitation
          const sentBy = isInvitation(item)
            ? item.founderName
            : item.talentName;
          const sentBySafe = String(sentBy || "Unknown");
          const sentById = isInvitation(item) ? item.founderId : item.talentId;
          const isNewMessage = hasNewActivity(
            item.id,
            item.lastActivityAt || item.sentAt || item.createdAt,
            item.sentAt || item.createdAt,
            item,
            userId,
          );

          // Get talent details for interests (when founder receives interest from talent)
          const talentArea = !isInvitation(item) && item.talentArea;
          const talentSkills = !isInvitation(item) && item.talentSkills;
          return (
            <React.Fragment key={item.id}>
              {showSeparator ? renderDateSeparator(dateLabel) : null}
            <Card
              className={`${INBOX_CARD_BASE} ${isNewMessage ? INBOX_CARD_UNREAD : ""}`}
              onClick={() => {
                setSelectedItem(item);
                markAsRead(item.id);
                setReadMessages((prev) => [...prev, item.id]);
              }}
            >
              <CardContent className="px-3 py-2.5">
                <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className={INBOX_AVATAR_FALLBACK}>
                          {sentBySafe[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    {isNewMessage && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full ring-2 ring-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-1">
                        {isTalentInboxUser ? (
                          <UserPlus className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                        ) : (
                          <Heart className="h-3.5 w-3.5 shrink-0 text-status-error" />
                        )}
                        <h4 className="font-heading text-[13px] font-semibold text-text-heading">
                          {isInvitation(item)
                            ? `Invitation from ${sentBySafe}`
                            : `Interest from ${sentBySafe}`}
                        </h4>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {getStatusBadge(item.status)}
                        {isFounderInboxUser &&
                          isInterestItem(item) &&
                          onNavigate && (
                          <Button
                            size="sm"
                            variant="outline"
                            className={`h-7 gap-1.5 whitespace-nowrap text-xs ${INBOX_OUTLINE_BTN}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              const talentId = String(
                                item.talentId?._id || item.talentId || "",
                              );
                              onNavigate("founder-chat", {
                                messageUserId: talentId,
                              });
                            }}
                          >
                            <MessageCircle className="h-3 w-3" />
                            Chat
                          </Button>
                        )}
                        <InboxItemMenu
                          {...buildInboxMenuProps(item, "received", isNewMessage)}
                        />
                      </div>
                    </div>
                    {(isInvitation(item) && item.companyName) ||
                    (!isInvitation(item) && (talentArea || item.startupTitle)) ? (
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <UserIconLucide className="h-3 w-3 text-text-muted" />
                        <p className="font-body text-xs font-normal text-text-muted">
                          {isInvitation(item) && item.companyName && (
                            <span className="font-medium">
                              {item.companyName}
                            </span>
                          )}
                          {!isInvitation(item) && (
                            <>
                              {talentArea && (
                                <span className="font-medium text-text-muted">
                                  {talentArea}
                                </span>
                              )}
                              {item.startupTitle && (
                                <span className={talentArea ? "ml-1" : ""}>
                                  {talentArea ? "• " : ""}
                                  {"Interested in "}
                                  <span className="font-medium">
                                    {item.startupTitle}
                                  </span>
                                </span>
                              )}
                            </>
                          )}
                        </p>
                      </div>
                    ) : null}
                    {!isInvitation(item) &&
                      talentSkills &&
                      talentSkills.length > 0 && (
                        <div className="flex items-center gap-1 mb-2 flex-wrap">
                          {talentSkills.slice(0, 3).map((skill, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className={INBOX_SKILL_BADGE}
                            >
                              {skill}
                            </Badge>
                          ))}
                          {talentSkills.length > 3 && (
                            <span className="font-body text-xs text-text-muted">
                              +{talentSkills.length - 3}
                              {" more"}
                            </span>
                          )}
                        </div>
                      )}
                    {String(item.message || "").trim() ||
                    (!isInterestItem(item) &&
                      item.messages?.length > 0 &&
                      formatConversationPreview(
                        item.messages[item.messages.length - 1],
                      )) ? (
                      <p
                        className={`mb-1.5 line-clamp-2 font-body text-[12px] font-normal text-text-body ${isNewMessage ? "font-medium" : ""}`}
                      >
                        {String(item.message || "").trim() ||
                          (!isInterestItem(item) &&
                            item.messages?.length > 0 &&
                            formatConversationPreview(
                              item.messages[item.messages.length - 1],
                            ))}
                      </p>
                    ) : null}
                    <div className="flex items-center gap-2 font-body text-xs text-text-muted">
                      <Calendar className="h-3 w-3 text-text-muted" />
                      <span
                        className={
                          isNewMessage ? "font-semibold text-primary" : ""
                        }
                      >
                        {formatDateTime(
                          isInterestItem(item)
                            ? item.sentAt || item.createdAt
                            : item.lastActivityAt || item.sentAt || item.createdAt,
                        )}
                      </span>
                      {isNewMessage && (
                        <Badge
                          variant="default"
                          className="ml-2 h-5 rounded-full border-0 bg-primary-tint px-2 text-[10px] font-semibold text-primary shadow-none"
                        >
                          NEW
                        </Badge>
                      )}
                    </div>
                    {isFounderInboxUser && !isInvitation(item) && onNavigate && (
                      <div className="mt-3 sm:hidden">
                        <Button
                          size="sm"
                          variant="outline"
                          className={`h-7 gap-1.5 text-xs ${INBOX_OUTLINE_BTN}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            const talentId = String(
                              item.talentId?._id || item.talentId || "",
                            );
                            onNavigate("founder-chat", {
                              messageUserId: talentId,
                            });
                          }}
                        >
                          <MessageCircle className="h-3 w-3" />
                          Open Chat
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            </React.Fragment>
          );
        })}
      </div>
    );
  };
  const renderSentTab = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
          <p className="font-body text-sm text-text-muted">Loading sent items...</p>
        </div>
      );
    }
    if (sentItems.length === 0) {
      return (
        <Card className="rounded-card border-0 bg-surface-card shadow-soft">
          <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <Send className="mb-4 h-16 w-16 text-surface-border" />
            <h3 className="mb-2 font-heading text-lg font-semibold text-text-heading">
              No sent messages
            </h3>
            <p className="max-w-sm font-body text-sm text-text-muted">
              {isTalentInboxUser
                ? "Express interest in startups to connect with founders."
                : "Send invitations to talent to build your team."}
            </p>
          </CardContent>
        </Card>
      );
    }

    // Sort messages by date - newest first
    const sortedItems = sortMessagesByDate(sentItems);
    console.log("📤 [Inbox-RenderSent] Displaying sent items:", {
      role: user?.role,
      sentCount: sentItems.length,
      items: sortedItems.map((item) => ({
        id: item.id.slice(0, 8),
        type: isInvitation(item) ? "invitation" : "interest",
        to: isInvitation(item) ? item.talentName : item.founderName,
        status: item.status,
      })),
    });
    let lastDateLabel = null;
    return (
      <div className="w-full space-y-2">
        {sortedItems.map((item) => {
          const itemDate = getInboxSortDate(item);
          const dateLabel = !Number.isNaN(itemDate.getTime())
            ? getDateGroupLabel(itemDate)
            : null;
          const showSeparator = dateLabel && dateLabel !== lastDateLabel;
          if (showSeparator) lastDateLabel = dateLabel;
          const recipientName = isInvitation(item)
            ? item.talentName
            : item.founderName;
          const recipientNameSafe = String(recipientName || "Unknown");
          const hasResponse = item.status !== "pending";
          const isNewActivity = hasNewActivity(
            item.id,
            item.lastActivityAt || item.sentAt || item.createdAt,
            item.sentAt || item.createdAt,
            item,
            userId,
          );
          return (
            <React.Fragment key={item.id}>
              {showSeparator ? renderDateSeparator(dateLabel) : null}
            <Card
              className={`${INBOX_CARD_BASE} ${isNewActivity ? INBOX_CARD_UNREAD : ""}`}
              onClick={() => {
                setSelectedItem(item);
                markAsRead(item.id);
              }}
            >
              <CardContent className="px-3 py-2.5">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className={INBOX_AVATAR_FALLBACK}>
                        {recipientNameSafe[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isNewActivity && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full ring-2 ring-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-1">
                        <Send className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                        <h4 className="font-heading text-[13px] font-semibold text-text-heading">
                          {isInvitation(item)
                            ? `Invitation to ${recipientNameSafe}`
                            : `Your interest in ${item.startupTitle || "startup"}`}
                        </h4>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {getStatusBadge(item.status)}
                        <InboxItemMenu
                          {...buildInboxMenuProps(item, "sent", isNewActivity)}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <UserIconLucide className="h-3 w-3 text-text-muted" />
                        <p className="font-body text-xs font-normal text-text-muted">
                        {"Sent to "}
                        {recipientNameSafe}
                        {item.companyName && ` • ${item.companyName}`}
                      </p>
                    </div>
                      {String(item.message || "").trim() ? (
                        <p className="mb-1.5 line-clamp-2 font-body text-[12px] font-normal text-text-body">{item.message}</p>
                      ) : null}
                    {hasResponse && item.response && (
                        <div className="mt-2 rounded-input bg-primary-tint p-3">
                          <p className="mb-1 flex items-center gap-1 font-body text-xs font-semibold text-primary">
                            <CheckCircle2 className="h-3 w-3 text-primary" />
                          {recipientName}
                          {" responded:"}
                        </p>
                          <p className="font-body text-sm text-text-body line-clamp-2">{item.response}</p>
                      </div>
                    )}
                      <div className="mt-2 flex items-center gap-2 font-body text-xs text-text-muted">
                        <Calendar className="h-3 w-3 text-text-muted" />
                      <span
                        className={
                            isNewActivity ? "font-semibold text-primary" : ""
                        }
                      >
                        {formatDateTime(
                          item.lastActivityAt || item.sentAt || item.createdAt,
                        )}
                      </span>
                      {hasResponse && !isNewActivity && (
                        <Badge
                          variant="secondary"
                          className="ml-2 h-5 text-[10px] px-2"
                        >
                          REPLIED
                        </Badge>
                      )}
                      {isNewActivity && (
                        <Badge
                          variant="default"
                          className="ml-2 h-5 rounded-full border-0 bg-primary-tint px-2 text-[10px] font-semibold text-primary shadow-none"
                        >
                          NEW
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            </React.Fragment>
          );
        })}
      </div>
    );
  };
  const handleOpenCompensationWizard = () => {
    // Open compensation wizard with talent details
    setOnboardingTalent({
      talentId: selectedItem.talentId,
      talentName: selectedItem.talentName,
      talentArea: selectedItem.talentArea,
      talentSkills: selectedItem.talentSkills,
      interestId: selectedItem.id,
    });
    setShowOnboardingWizard(true);
    setSelectedItem(null);
  };
  const handleMarkItemRead = (item) => {
    markAsRead(item.id);
    setReadMessages((prev) =>
      prev.includes(item.id) ? prev : [...prev, item.id],
    );
  };

  const handleDeleteInboxItem = async (item) => {
    if (!item?.id) return;
    setIsSending(true);
    try {
      if (isOrgInboxMessage(item)) {
        await deleteMessageForMe(item.id);
      } else if (isInterestItem(item)) {
        await inboxApi.deleteInterest(item.id);
      } else if (isFounderTalentInvitation(item)) {
        await inboxApi.deleteInvitation(item.id);
      } else {
        return;
      }
      toast.success("Removed from inbox");
      if (selectedItem?.id === item.id) setSelectedItem(null);
      await loadInboxData();
    } catch (error) {
      toast.error(error?.message || "Could not remove item");
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickDeclineInterest = async (item) => {
    setIsSending(true);
    try {
      await inboxApi.updateInterestStatus(
        item.id,
        "declined",
        "Thank you for your interest.",
      );
      toast.success("Interest declined");
      if (selectedItem?.id === item.id) setSelectedItem(null);
      await loadInboxData();
    } catch (error) {
      toast.error(error?.message || "Could not decline");
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickAcceptInterest = async (item) => {
    setIsSending(true);
    try {
      await inboxApi.updateInterestStatus(item.id, "accepted", "");
      toast.success("Accepted — they've been added to your team.");
      if (selectedItem?.id === item.id) setSelectedItem(null);
      await loadInboxData();
    } catch (error) {
      toast.error(error?.message || "Could not accept");
    } finally {
      setIsSending(false);
    }
  };

  const buildInboxMenuProps = (item, activeTabName, isNew) => ({
    item,
    activeTab: activeTabName,
    userRole: user?.role,
    isFounderInboxUser,
    isTalentInboxUser,
    isNew,
    hasNavigate: Boolean(onNavigate),
    disabled: isSending,
    onMarkRead: () => handleMarkItemRead(item),
    onOpenDetail: isOrgInboxMessage(item)
      ? () => {
          setSelectedItem(item);
          handleMarkItemRead(item);
        }
      : undefined,
    onOpenChat: () => openChatForItem(item),
    onViewProfile: () => openTalentProfileFromItem(item),
    onAccept: () => {
      if (isInterestItem(item) && isFounderInboxUser) {
        void handleQuickAcceptInterest(item);
      } else if (isInvitation(item) && isTalentInboxUser) {
        setPendingInvitationAcceptance(item);
        setAcceptanceConfirmed(false);
      } else if (isOrganizationInvitation(item) && isFounderInboxUser) {
        void handleRespondToOrgInvitation(item, "accept");
      }
    },
    onDecline: () => {
      if (isInterestItem(item) && isFounderInboxUser) {
        void handleQuickDeclineInterest(item);
      } else if (isInvitation(item) && isTalentInboxUser) {
        void handleRespondToInvitation(item, "decline");
      } else if (isOrganizationInvitation(item) && isFounderInboxUser) {
        void handleRespondToOrgInvitation(item, "decline");
      } else if (
        activeTabName === "sent" &&
        (isInterestItem(item) || isInvitation(item))
      ) {
        if (isInterestItem(item)) {
          void inboxApi
            .updateInterestStatus(item.id, "left", "")
            .then(() => {
              toast.success("Interest withdrawn");
              return loadInboxData();
            })
            .catch((err) => toast.error(err?.message || "Could not withdraw"));
        } else {
          void inboxApi
            .updateInvitationStatus(item.id, "cancelled", "")
            .then(() => {
              toast.success("Invitation withdrawn");
              return loadInboxData();
            })
            .catch((err) => toast.error(err?.message || "Could not withdraw"));
        }
      }
    },
    onDelete: () => handleDeleteInboxItem(item),
  });

  const openChatForItem = (item) => {
    if (!onNavigate || !item) return;
    const targetId = isInvitation(item)
      ? String(item.founderId?._id || item.founderId || "")
      : String(item.talentId?._id || item.talentId || "");
    if (!targetId) {
      toast.error("Chat user unavailable for this conversation.");
      return;
    }
    setSelectedItem(null);
    const chatPage = isTalentInboxUser ? "talent-chat" : "founder-chat";
    onNavigate(chatPage, { messageUserId: targetId });
  };
  const getTalentIdFromItem = (item) =>
    String(item?.talentId?._id || item?.talentId || "");
  const openTalentProfileFromItem = (item) => {
    if (!onNavigate || !item) return;
    const talentId = getTalentIdFromItem(item);
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
    setSelectedItem(null);
    onNavigate("talent-profile", { talent, talentId });
  };
  const renderConversationDialog = () => {
    if (!selectedItem) return null;

    // Check if this is an organization invitation
    const isOrgInvite = isOrganizationInvitation(selectedItem);
    if (isOrgInvite) {
      // Render simplified dialog for organization invitations
      const orgInvite = selectedItem;
      return (
        <Dialog
          open={!!selectedItem}
          onOpenChange={() => setSelectedItem(null)}
        >
          <DialogContent className="max-w-lg rounded-card border-0 shadow-soft">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-heading text-[18px] font-bold text-text-heading">
                <Building2 className="h-5 w-5 text-primary" />
                Cohort invitation
              </DialogTitle>
              <DialogDescription className="font-body text-[13px] text-text-body">
                Join{" "}
                <span className="font-medium text-text-heading">
                  {orgInvite.cohortName || "this cohort"}
                </span>{" "}
                with{" "}
                <span className="font-medium text-text-heading">
                  {orgInvite.organizationName || "this organization"}
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 font-body">
              <div className="rounded-input border border-primary/20 bg-primary-tint p-4">
                <div className="mb-3 flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className={INBOX_AVATAR_FALLBACK}>
                      {(orgInvite.organizationName || "O")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-heading text-[16px] font-semibold text-text-heading">
                      {orgInvite.organizationName || "Organization"}
                    </h3>
                    <p className="font-body text-[13px] text-primary">
                      {orgInvite.cohortName || "Cohort"}
                    </p>
                  </div>
                  {getStatusBadge(orgInvite.status)}
                </div>
                {orgInvite.message && (
                  <div className="mt-3 border-t border-primary/15 pt-3">
                    <p className="mb-1 font-body text-[12px] font-medium text-text-muted">
                      Message
                    </p>
                    <p className="font-body text-[13px] text-text-body">
                      {orgInvite.message}
                    </p>
                  </div>
                )}
                <div className="mt-3 flex items-center gap-2 border-t border-primary/15 pt-3 font-body text-[12px] text-text-muted">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {formatDateTime(orgInvite.sentAt || orgInvite.createdAt)}
                  </span>
                </div>
              </div>
              {orgInvite.status === "pending" ? (
                <div className="space-y-3">
                  <p className="text-center font-body text-[13px] text-text-body">
                    Accept to join the cohort. Your program gets read-only access
                    to execution progress to support your journey.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        handleRespondToOrgInvitation(orgInvite, "accept")
                      }
                      className={`flex-1 ${INBOX_PRIMARY_BTN}`}
                      disabled={isSending}
                    >
                      {isSending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      )}
                      Accept invitation
                    </Button>
                    <Button
                      onClick={() =>
                        handleRespondToOrgInvitation(orgInvite, "decline")
                      }
                      className={`flex-1 ${INBOX_OUTLINE_BTN}`}
                      variant="outline"
                      disabled={isSending}
                    >
                      {isSending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4" />
                      )}
                      Decline
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className={`rounded-input border p-4 ${
                    orgInvite.status === "accepted"
                      ? "border-status-success/30 bg-status-success/10"
                      : "border-status-error/30 bg-status-error/10"
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    {orgInvite.status === "accepted" ? (
                      <CheckCircle2 className="h-5 w-5 text-status-success" />
                    ) : (
                      <XCircle className="h-5 w-5 text-status-error" />
                    )}
                    <p className="font-heading text-[14px] font-semibold text-text-heading">
                      {orgInvite.status === "accepted"
                        ? "Invitation accepted"
                        : "Invitation declined"}
                    </p>
                  </div>
                  {orgInvite.respondedAt && (
                    <p className="font-body text-[12px] text-text-muted">
                      {formatDateTime(orgInvite.respondedAt)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      );
    }

    // Regular talent invitation/interest dialog
    const isInv = isInvitation(selectedItem);
    const otherPartyName = isInv
      ? activeTab === "received"
        ? selectedItem?.founderName
        : selectedItem?.talentName
      : activeTab === "received"
        ? selectedItem?.talentName
        : selectedItem?.founderName;
    const otherPartyNameSafe = otherPartyName
      ? String(otherPartyName)
      : "Unknown";
    console.log("🔍 [Inbox Dialog] Debug info:", {
      isInvitation: isInv,
      userRole: user.role,
      activeTab,
      status: selectedItem.status,
      selectedItem: selectedItem,
      hasTalentId: "talentId" in selectedItem,
      hasTalentName: "talentName" in selectedItem,
    });
    return (
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto rounded-card border border-surface-border bg-surface-card shadow-modal">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading text-text-heading">
              <MessageSquare className="h-5 w-5 text-primary" />
              Conversation
            </DialogTitle>
            <DialogDescription className="font-body text-sm font-normal text-text-body">
              {"Chat with "}
              {otherPartyNameSafe}
              {isInv &&
                selectedItem.companyName &&
                ` from ${selectedItem.companyName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-input border border-primary/15 bg-primary-tint p-4">
              <div className="flex items-start gap-3 mb-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className={INBOX_AVATAR_FALLBACK}>
                    {otherPartyNameSafe
                      .split(" ")
                      .filter(Boolean)
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-body text-sm font-semibold text-text-heading">
                      {otherPartyNameSafe}
                    </p>
                    {isInv && selectedItem.companyName && (
                      <Badge variant="outline" className="text-xs">
                        {selectedItem.companyName}
                      </Badge>
                    )}
                  </div>
                  <p className="font-body text-xs font-normal text-text-muted">
                    {formatDateTime(
                      selectedItem.lastActivityAt ||
                        selectedItem.sentAt ||
                        selectedItem.createdAt,
                    )}
                  </p>
                </div>
              </div>
              <p className="border-b border-surface-border pb-3 font-body text-sm font-normal text-text-heading">{selectedItem.message}</p>
            </div>
            {selectedItem.messages && selectedItem.messages.length > 0 && (
              <div className="max-h-64 space-y-3 overflow-y-auto rounded-input border border-surface-border bg-surface-page p-3">
                {selectedItem.messages.map((msg, idx) => {
                  const isMe = String(msg.senderId) === String(userId);
                  const attachments = normalizeMessageAttachments({
                    attachments: msg.attachments,
                    content: msg.text,
                  });
                  return (
                    <div
                      key={`${msg.timestamp || idx}-${idx}`}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[85%] space-y-1 ${isMe ? "text-right" : "text-left"}`}>
                        <p className="font-body text-[10px] text-text-muted">{msg.sender}</p>
                        {attachments.length > 0 && (
                          <MessageAttachmentBubble
                            attachments={attachments}
                            isMe={isMe}
                            caption={msg.text?.trim() || ""}
                          />
                        )}
                        {!attachments.length && msg.text?.trim() ? (
                          <p className="rounded-input bg-primary-tint px-3 py-2 font-body text-sm text-text-body">
                            {msg.text}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {(selectedItem.status === "pending" ||
              selectedItem.status === "proposed-by-founder" ||
              selectedItem.status === "proposed-by-talent") && (
              <div className="space-y-2 border-t border-surface-border pt-4">
                <Label className="font-body text-sm text-text-heading">Reply</Label>
                <ChatComposer
                  value={responseMessage}
                  onChange={setResponseMessage}
                  onSend={() => handleSendMessage(selectedItem)}
                  onFileSelect={setPendingInboxFile}
                  pendingFile={pendingInboxFile}
                  onClearPendingFile={() => setPendingInboxFile(null)}
                  uploading={isInboxUploading}
                  uploadProgress={inboxUploadProgress}
                  disabled={isSending}
                />
              </div>
            )}
            {isFounderInboxUser && onNavigate && getTalentIdFromItem(selectedItem) && (
              <Button
                onClick={() => openTalentProfileFromItem(selectedItem)}
                variant="outline"
                className={`w-full gap-2 ${INBOX_OUTLINE_BTN}`}
              >
                <ExternalLink className="h-4 w-4 text-primary" />
                View Talent Profile
              </Button>
            )}
            {/* ── Pending interest (not yet a proposal) ── */}
            {selectedItem.status === "pending" && activeTab === "received" && (
              <div className="space-y-3 border-t border-surface-border pt-4">
                {isTalentInboxUser ? (
                  <div className="space-y-2">
                    <Button
                      onClick={() => openChatForItem(selectedItem)}
                      className={`w-full ${INBOX_OUTLINE_BTN}`}
                      variant="outline"
                      disabled={isSending}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Open Chat
                    </Button>
                    {isInvitation(selectedItem) && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setPendingInvitationAcceptance(selectedItem);
                            setAcceptanceConfirmed(false);
                          }}
                          className={`flex-1 ${INBOX_PRIMARY_BTN}`}
                          variant="default"
                          disabled={isSending}
                        >
                          {isSending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                          )}
                          Accept Invitation
                        </Button>
                        <Button
                          onClick={() =>
                            handleRespondToInvitation(selectedItem, "decline")
                          }
                          className={`flex-1 ${INBOX_OUTLINE_BTN}`}
                          variant="outline"
                          disabled={isSending}
                        >
                          {isSending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4 mr-2" />
                          )}
                          Decline Invitation
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Founder sees pending interest — continue in chat or propose team membership */
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      {onNavigate && (
                        <Button
                          variant="outline"
                          className={`gap-1.5 ${INBOX_OUTLINE_BTN}`}
                          disabled={isSending}
                          onClick={() => {
                            const talentId = String(selectedItem.talentId?._id || selectedItem.talentId || "");
                            setSelectedItem(null);
                            onNavigate("founder-chat", { messageUserId: talentId });
                          }}
                        >
                          <MessageCircle className="h-4 w-4 text-primary" />
                          Chat
                        </Button>
                      )}
                    </div>
                    <div className="rounded-input border border-primary/20 bg-primary-tint p-3">
                      <p className="mb-2 font-body text-xs font-medium text-primary">
                        Ready to bring them on board?
                      </p>
                      <Button
                        onClick={async () => {
                          setIsSending(true);
                          try {
                            await inboxApi.proposeTeamMembership(selectedItem.id, "founder");
                            toast.success("Team membership offer sent!");
                            setSelectedItem(null);
                            await loadInboxData();
                          } catch (err) {
                            toast.error("Failed to send offer.");
                          } finally {
                            setIsSending(false);
                          }
                        }}
                        className={`w-full ${INBOX_PRIMARY_BTN}`}
                        disabled={isSending}
                      >
                        {isSending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Handshake className="mr-2 h-4 w-4 text-white" />
                        )}
                        Propose Team Membership
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* ── Talent viewing their sent interest: propose themselves ── */}
            {selectedItem.status === "pending" && activeTab === "sent" && isTalentInboxUser && !isInvitation(selectedItem) && (
              <div className="space-y-3 border-t border-surface-border pt-4">
                <div className={INBOX_CALLOUT}>
                  <p className="mb-2 font-body text-xs font-medium text-primary">
                    Confident this is the right fit?
                  </p>
                  <Button
                    onClick={async () => {
                      setIsSending(true);
                      try {
                        await inboxApi.proposeTeamMembership(selectedItem.id, "talent");
                        toast.success("Team membership proposal sent!");
                        setSelectedItem(null);
                        await loadInboxData();
                      } catch (err) {
                        toast.error("Failed to send proposal.");
                      } finally {
                        setIsSending(false);
                      }
                    }}
                    className={`w-full ${INBOX_PRIMARY_BTN}`}
                    disabled={isSending}
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Handshake className="w-4 h-4 mr-2" />
                    )}
                    Propose Myself as Team Member
                  </Button>
                </div>
              </div>
            )}
            {/* ── Talent receives a "proposed-by-founder" offer ── */}
            {selectedItem.status === "proposed-by-founder" && isTalentInboxUser && (
              <div className={`mt-4 ${INBOX_CALLOUT}`}>
                <div className="mb-2 flex items-center gap-2">
                  <Handshake className="h-5 w-5 text-primary" />
                  <p className="font-heading text-sm font-semibold text-text-heading">
                    Team membership offer
                  </p>
                </div>
                <p className="mb-3 font-body text-sm text-text-body">
                  {selectedItem.founderName || "The founder"} has proposed you as a team member. Accept to join their startup.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      setIsSending(true);
                      try {
                        await inboxApi.acceptTeamMembershipProposal(selectedItem.id);
                        toast.success("Welcome to the team!");
                        setSelectedItem(null);
                        await loadInboxData();
                      } catch (err) {
                        toast.error("Failed to accept offer.");
                      } finally {
                        setIsSending(false);
                      }
                    }}
                    className={`flex-1 ${INBOX_PRIMARY_BTN}`}
                    disabled={isSending}
                  >
                    {isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Accept
                  </Button>
                  <Button
                    onClick={async () => {
                      setIsSending(true);
                      try {
                        await inboxApi.declineTeamMembershipProposal(selectedItem.id);
                        toast.success("Offer declined.");
                        setSelectedItem(null);
                        await loadInboxData();
                      } catch (err) {
                        toast.error("Failed to decline offer.");
                      } finally {
                        setIsSending(false);
                      }
                    }}
                    className={`flex-1 ${INBOX_OUTLINE_BTN}`}
                    variant="outline"
                    disabled={isSending}
                  >
                    {isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                    Decline
                  </Button>
                </div>
              </div>
            )}
            {/* ── Founder receives a "proposed-by-talent" offer ── */}
            {selectedItem.status === "proposed-by-talent" && isFounderInboxUser && (
              <div className={`mt-4 ${INBOX_CALLOUT}`}>
                <div className="mb-2 flex items-center gap-2">
                  <Handshake className="h-5 w-5 text-primary" />
                  <p className="font-heading text-sm font-semibold text-text-heading">
                    Team membership proposal
                  </p>
                </div>
                <p className="mb-3 font-body text-sm text-text-body">
                  {selectedItem.talentName || "This talent"} is proposing to join your team. Accept to onboard them.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleOpenCompensationWizard}
                    className={`flex-1 ${INBOX_PRIMARY_BTN}`}
                    disabled={isSending}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Accept & Onboard
                  </Button>
                  <Button
                    onClick={async () => {
                      setIsSending(true);
                      try {
                        await inboxApi.declineTeamMembershipProposal(selectedItem.id);
                        toast.success("Proposal declined.");
                        setSelectedItem(null);
                        await loadInboxData();
                      } catch (err) {
                        toast.error("Failed to decline.");
                      } finally {
                        setIsSending(false);
                      }
                    }}
                    className={`flex-1 ${INBOX_OUTLINE_BTN}`}
                    variant="outline"
                    disabled={isSending}
                  >
                    {isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                    Decline
                  </Button>
                </div>
              </div>
            )}
            {(selectedItem.status === "accepted" || selectedItem.status === "declined") && (
              <div
                className={`rounded-input border p-4 ${
                  selectedItem.status === "accepted"
                    ? "border-status-success/30 bg-status-success/10"
                    : "border-status-error/30 bg-status-error/10"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {selectedItem.status === "accepted" ? (
                    <CheckCircle2 className="w-5 h-5 text-status-success" />
                  ) : (
                    <XCircle className="w-5 h-5 text-status-error" />
                  )}
                  <p className="font-heading text-sm font-semibold text-text-heading">
                    {selectedItem.status === "accepted"
                      ? "Accepted"
                      : "Declined"}
                  </p>
                </div>
                {selectedItem.response && (
                  <p className="font-body text-sm text-text-body">
                    {selectedItem.response}
                  </p>
                )}
                {selectedItem.status === "accepted" &&
                  isFounderInboxUser &&
                  activeTab === "received" &&
                  !isInvitation(selectedItem) && (
                    <div className="mt-3 border-t border-status-success/20 pt-3">
                      <Button
                        onClick={handleOpenCompensationWizard}
                        className={`w-full ${INBOX_PRIMARY_BTN}`}
                        size="sm"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Onboard Team
                      </Button>
                      <p className="mt-2 text-center font-body text-xs text-text-muted">
                        {"Configure compensation & complete onboarding for "}
                        {selectedItem.talentName}
                      </p>
                    </div>
                  )}
              </div>
            )}
            {(selectedItem.status === "accepted" || selectedItem.status === "declined") && (
              <div className="space-y-3 border-t border-surface-border pt-4">
                <Label className="font-body text-sm text-text-heading">Continue conversation</Label>
                <Button
                  onClick={() => openChatForItem(selectedItem)}
                  className={`w-full ${INBOX_PRIMARY_BTN}`}
                  disabled={isSending}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Open Chat
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };
  return (
    <div
      className={`min-h-screen p-2 font-body md:p-3 lg:p-4 bg-surface-page`}
    >
      <Dialog
        open={Boolean(pendingInvitationAcceptance)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingInvitationAcceptance(null);
            setAcceptanceConfirmed(false);
          }
        }}
      >
        <DialogContent className="max-w-xl rounded-card border border-surface-border bg-surface-card shadow-modal">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading text-text-heading">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Review invitation terms
            </DialogTitle>
            <DialogDescription className="font-body text-sm text-text-body">
              Accepting this invitation means you confirm that you have reviewed the startup information, compensation or equity expectations, and the opportunity details shared by the startup.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className={INBOX_CALLOUT}>
              <div className="space-y-1">
                <p className="font-heading text-base font-semibold text-text-heading">
                  {pendingInvitationAcceptance?.companyName ||
                    pendingInvitationAcceptance?.startupTitle ||
                    "Startup invitation"}
                </p>
                <p className="font-body text-sm text-text-body">
                  Invited by {pendingInvitationAcceptance?.founderName || "Founder"}
                </p>
              </div>
              <p className="mt-3 font-body text-sm leading-relaxed text-text-body">
                Before you join, make sure you are comfortable with the startup&apos;s shared equity structure, role expectations, compensation approach, and any information presented in the original startup post.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setAcceptanceConfirmed((prev) => !prev)}
              className="flex w-full items-start gap-3 rounded-input border border-surface-border bg-surface-card p-4 text-left transition-colors duration-200 ease-in-out hover:border-primary hover:bg-primary-tint/40"
            >
              <span
                className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors duration-200 ${
                  acceptanceConfirmed
                    ? "border-primary bg-primary text-white"
                    : "border-surface-border bg-surface-card text-transparent"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
              <span>
                <span className="block font-body text-sm font-semibold text-text-heading">
                  I understand and agree to proceed based on the startup information provided
                </span>
                <span className="mt-1 block font-body text-xs text-text-muted">
                  This includes the startup post, role scope, and any equity or compensation details shared with this invitation.
                </span>
              </span>
            </button>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                className={INBOX_OUTLINE_BTN}
                onClick={handleReviewStartupBeforeAccept}
                disabled={!pendingInvitationAcceptance?.startupId}
              >
                <ExternalLink className="mr-2 h-4 w-4 text-primary" />
                Review startup post
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className={INBOX_OUTLINE_BTN}
                  onClick={() => {
                    setPendingInvitationAcceptance(null);
                    setAcceptanceConfirmed(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className={INBOX_PRIMARY_BTN}
                  disabled={!acceptanceConfirmed || isSending}
                  onClick={() => {
                    if (!pendingInvitationAcceptance) return;
                    handleRespondToInvitation(pendingInvitationAcceptance, "accept");
                  }}
                >
                  {isSending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Confirm Acceptance
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {onboardingTalent && (
        <CompensationSetupWizard
          isOpen={showOnboardingWizard}
          onClose={() => {
            setShowOnboardingWizard(false);
            setOnboardingTalent(null);
          }}
          teamMemberName={onboardingTalent.talentName}
          teamMemberId={onboardingTalent.talentId}
          founderId={userId}
          startupId={getStartupId(user)}
          onComplete={async (compensationConfig) => {
            try {
              console.log(
                "🎉 [Onboarding] Completing onboarding with config:",
                compensationConfig,
              );

              if (!onboardingTalent.interestId) {
                throw new Error("Missing interest record for onboarding.");
              }
              await inboxApi.markInterestAsOnboarded(
                onboardingTalent.interestId,
              );
              toast.success(
                `🎉 ${onboardingTalent.talentName} has been successfully onboarded to your team!`,
              );
              setShowOnboardingWizard(false);
              setOnboardingTalent(null);
              await loadInboxData(); // Refresh inbox
            } catch (error) {
              console.error("❌ [Onboarding] Error:", error);
              toast.error("Failed to onboard team member. Please try again.");
            }
          }}
        />
      )}
      {renderConversationDialog()}
      <div className="mb-3 flex items-center gap-4 md:mb-4">
      {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-text-body transition-all duration-200 ease-in-out hover:bg-transparent hover:text-primary [&_svg]:text-text-body [&_svg]:transition-all [&_svg]:duration-200 [&_svg]:ease-in-out hover:[&_svg]:text-primary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-heading">Inbox</h1>
          <p className="font-body text-sm font-normal text-text-muted">
            Invitations, interests, and responses
          </p>
        </div>
      </div>
      {isFounderInboxUser && founderCohorts.length > 0 && (
        <Card className="mb-4 rounded-card border border-surface-border bg-surface-card shadow-soft">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-heading text-[14px] font-semibold text-text-heading">
                Message your organization
              </p>
              <p className="font-body text-[12px] text-text-muted">
                Contact your accelerator or program
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setShowOrgMessageComposer(true)}
              className={`gap-2 ${INBOX_PRIMARY_BTN}`}
            >
              <Building2 className="h-4 w-4" />
              Compose
            </Button>
          </CardContent>
        </Card>
      )}
      <Dialog
        open={showOrgMessageComposer}
        onOpenChange={setShowOrgMessageComposer}
      >
        <DialogContent className="max-w-lg rounded-card border border-surface-border bg-surface-card shadow-modal">
          <DialogHeader>
            <DialogTitle className="font-heading text-text-heading">
              Message organization
            </DialogTitle>
            <DialogDescription className="font-body text-sm text-text-body">
              Send a message to your accelerator or program
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendOrgMessage} className="space-y-4">
            <div>
              <Label className="font-body text-sm text-text-heading">Select organization</Label>
              <select
                value={orgMessageData.cohortId}
                onChange={(e) =>
                  setOrgMessageData({
                    ...orgMessageData,
                    cohortId: e.target.value,
                  })
                }
                required={true}
                className="mt-1 h-9 w-full rounded-input border border-surface-border bg-surface-page px-3 font-body text-sm text-text-body"
              >
                <option value="">Choose an organization...</option>
                {founderCohorts.map((cohort) => (
                  <option key={cohort.id} value={cohort.id}>
                    {cohort.organizationName || cohort.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="font-body text-sm text-text-heading">Subject</Label>
              <input
                type="text"
                value={orgMessageData.subject}
                onChange={(e) =>
                  setOrgMessageData({
                    ...orgMessageData,
                    subject: e.target.value,
                  })
                }
                placeholder="Message subject"
                required={true}
                className="mt-1 h-9 w-full rounded-input border border-surface-border bg-surface-page px-3 font-body text-sm text-text-body"
              />
            </div>
            <div>
              <Label className="font-body text-sm text-text-heading">Message</Label>
              <Textarea
                value={orgMessageData.message}
                onChange={(e) =>
                  setOrgMessageData({
                    ...orgMessageData,
                    message: e.target.value,
                  })
                }
                placeholder="Type your message..."
                required={true}
                className="mt-1 min-h-[120px] rounded-input border-surface-border bg-surface-page font-body text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className={INBOX_OUTLINE_BTN}
                onClick={() => {
                  setShowOrgMessageComposer(false);
                  setOrgMessageData({
                    cohortId: "",
                    subject: "",
                    message: "",
                  });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className={INBOX_PRIMARY_BTN} disabled={isSending}>
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {renderInboxSummary()}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)}>
        <TabsList className="mb-3 grid h-auto min-h-10 w-full grid-cols-2 gap-0 rounded-none border-0 border-b border-surface-border bg-transparent p-0 md:mb-4">
          <TabsTrigger
            value="received"
            className="relative rounded-none border-0 border-b-2 border-transparent bg-transparent font-body font-medium text-text-body shadow-none transition-colors duration-200 ease-in-out hover:text-primary data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-primary data-[state=active]:shadow-none [&_svg]:text-text-muted data-[state=active]:[&_svg]:text-primary hover:[&_svg]:text-primary"
          >
            <InboxIcon className="mr-2 h-4 w-4" />
            Received
            {!isLoading &&
              receivedItems.filter((i) => i.status === "pending").length +
                orgInvitations.filter((i) => i.status === "pending").length >
                0 && (
                isFounderInboxUser ? (
                  <span className="ml-2 h-2 w-2 rounded-full bg-primary" />
                ) : (
                  <Badge className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-pill bg-primary p-0 text-[10px] font-semibold text-primary-foreground">
                    {receivedItems.filter((i) => i.status === "pending").length +
                      orgInvitations.filter((i) => i.status === "pending").length}
                  </Badge>
                )
              )}
          </TabsTrigger>
          <TabsTrigger
            value="sent"
            className="rounded-none border-0 border-b-2 border-transparent bg-transparent font-body font-medium text-text-body shadow-none transition-colors duration-200 ease-in-out hover:text-primary data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-primary data-[state=active]:shadow-none [&_svg]:text-text-muted data-[state=active]:[&_svg]:text-primary hover:[&_svg]:text-primary"
          >
            <Send className="mr-2 h-4 w-4" />
            Sent
          </TabsTrigger>
        </TabsList>
        <TabsContent value="received">{renderReceivedTab()}</TabsContent>
        <TabsContent value="sent">{renderSentTab()}</TabsContent>
      </Tabs>
    </div>
  );
}
