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
  Briefcase,
  UserPlus,
  ArrowLeft,
  Inbox as InboxIcon,
  Heart,
  Calendar,
  Building2,
  MessageCircle,
  Handshake,
} from "lucide-react";
import { toast } from "sonner";
import { Label } from "./ui/label";
import * as inboxApi from "../utils/api/inboxApi";
import CompensationSetupWizard from "./compensation/CompensationSetupWizard";
import { getStartupId } from "../utils/startupId";

// Default fetch options for cookie-based auth
const defaultOptions = {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
};

// Normalize MongoDB _id to id so all item.id references work
const normalizeItem = (item) => {
  if (!item) return item;
  const id = String(item._id ?? item.id ?? "");
  // MongoDB may populate founderId/talentId as objects — extract name if missing
  const founderName = item.founderName ||
    (item.founderId && typeof item.founderId === "object" ? item.founderId.name : "") ||
    "Founder";
  const talentName = item.talentName ||
    (item.talentId && typeof item.talentId === "object" ? item.talentId.name : "") ||
    "Talent";
  return { ...item, id, _id: id, founderName, talentName };
};
const normalizeItems = (arr) => (Array.isArray(arr) ? arr.map(normalizeItem) : []);

// Track read messages with timestamps in localStorage
const READ_MESSAGES_KEY = "startupverse_read_messages_timestamps";
const markAsRead = (messageId) => {
  const readTimestamps = JSON.parse(
    localStorage.getItem(READ_MESSAGES_KEY) || "{}",
  );
  readTimestamps[messageId] = new Date().toISOString();
  localStorage.setItem(READ_MESSAGES_KEY, JSON.stringify(readTimestamps));
};
const hasNewActivity = (
  messageId,
  lastActivityAt,
  sentAt,
  item,
  currentUserId,
) => {
  const readTimestamps = JSON.parse(
    localStorage.getItem(READ_MESSAGES_KEY) || "{}",
  );
  const lastReadAt = readTimestamps[messageId];

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
    if (lastMessage.senderId === currentUserId) {
      // Current user sent the last message - don't show as NEW
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
export const countUnreadMessages = (messages, userId) => {
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
  const [activeTab, setActiveTab] = useState(initialTab);
  const [receivedItems, setReceivedItems] = useState([]);
  const [sentItems, setSentItems] = useState([]);
  const [orgInvitations, setOrgInvitations] = useState([]);
  const [orgMessages, setOrgMessages] = useState([]);
  const [founderCohorts, setFounderCohorts] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [readMessages, setReadMessages] = useState([]);
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);
  const [onboardingTalent, setOnboardingTalent] = useState(null);
  const [showOrgMessageComposer, setShowOrgMessageComposer] = useState(false);
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
      if (user?.role === "talent") {
        // Talent receives invitations from founders
        const invitations = await inboxApi.getReceivedInvitations(userId);
        setReceivedItems(normalizeItems(invitations));

        // Talent sends interests to founders
        const interests = await inboxApi.getSentInterests(userId);
        setSentItems(normalizeItems(interests));
        console.log("✅ [Inbox] Loaded talent inbox data:", {
          receivedInvitations: invitations.length,
          sentInterests: interests.length,
        });
      } else if (user?.role === "founder") {
        // Founders receive interests from talent
        console.log(
          "🔍 [Inbox-Founder] Fetching received interests for:",
          userId,
        );
        const interests = await inboxApi.getReceivedInterests(userId);
        console.log("📥 [Inbox-Founder] Received interests:", interests);
        setReceivedItems(normalizeItems(interests));

        // Founders send invitations to talent
        const rawInvitations = await inboxApi.getSentInvitations(userId);
        const invitations = normalizeItems(rawInvitations);
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
            setOrgMessages(messagesData.messages || []);
            console.log(
              "📨 [Inbox-Founder] Organization messages loaded:",
              messagesData.messages?.length || 0,
            );
          }
        } catch (error) {
          console.error("Error loading organization messages:", error);
        }

        // Load founder cohorts for message composer
        try {
          const cohortsKey = `founder:${userId}:cohorts`;
          const cohortIds = JSON.parse(
            localStorage.getItem(cohortsKey) || "[]",
          );
          const cohortsWithDetails = [];
          for (const cohortId of cohortIds) {
            const cohortData = JSON.parse(
              localStorage.getItem(`cohort:${cohortId}`) || "null",
            );
            if (cohortData) {
              cohortsWithDetails.push(cohortData);
            }
          }
          setFounderCohorts(cohortsWithDetails);
          console.log(
            "📚 [Inbox-Founder] Loaded cohorts:",
            cohortsWithDetails.length,
          );
        } catch (error) {
          console.error("Error loading founder cohorts:", error);
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
      if (user.role === "founder") {
        // Founder responding to interest
        await inboxApi.updateInterestStatus(
          item.id,
          action === "accept" ? "accepted" : "declined",
          responseText,
        );
        // On accept: trigger full onboarding — converts talent role to team-member,
        // sets startupId/founderId on their account, adds them to Presence so they
        // appear immediately in the dashboard team list.
        if (action === "accept") {
          try {
            await inboxApi.markInterestAsOnboarded(item.id);
          } catch (onboardErr) {
            console.error("⚠️ Onboarding step failed (team member may need manual onboarding):", onboardErr);
          }
        }
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
    if (!message) {
      toast.error("Please write a message");
      return;
    }
    setIsSending(true);
    console.log("💬 [Message] Sending message:", {
      itemId: item.id,
      isInvitation: "talentId" in item,
      activeTab,
      userRole: user?.role,
    });
    try {
      const messageObj = {
        text: message,
        sender: user.name,
        senderId: userId,
        timestamp: new Date().toISOString(),
      };

      // Check if this is an invitation or interest
      const isInvitation =
        "companyName" in item ||
        (!("startupTitle" in item) && "talentId" in item);
      if (isInvitation) {
        await inboxApi.addInvitationMessage(item.id, messageObj);
      } else {
        await inboxApi.addInterestMessage(item.id, messageObj);
      }
      toast.success("💬 Message sent!");
      setResponseMessage("");
      await loadInboxData();

      // Update selected item to show new message immediately
      console.log("🔄 Updating selected item with new message...");
      if (isInvitation) {
        // For invitations: check if we're viewing sent or received
        if (activeTab === "sent") {
          // Founder viewing sent invitation
          const updated = await inboxApi.getSentInvitations(userId);
          const updatedItem = updated.find((i) => i.id === item.id);
          if (updatedItem) {
            setSelectedItem(updatedItem);
            console.log("✅ Updated sent invitation with new message");
          }
        } else {
          // Talent viewing received invitation
          const updated = await inboxApi.getReceivedInvitations(userId);
          const updatedItem = updated.find((i) => i.id === item.id);
          if (updatedItem) {
            setSelectedItem(updatedItem);
            console.log("✅ Updated received invitation with new message");
          }
        }
      } else {
        // For interests: check if we're viewing sent or received
        if (activeTab === "sent") {
          // Talent viewing sent interest
          const updated = await inboxApi.getSentInterests(userId);
          const updatedItem = updated.find((i) => i.id === item.id);
          if (updatedItem) {
            setSelectedItem(updatedItem);
            console.log("✅ Updated sent interest with new message");
          }
        } else {
          // Founder viewing received interest
          const updated = await inboxApi.getReceivedInterests(userId);
          const updatedItem = updated.find((i) => i.id === item.id);
          if (updatedItem) {
            setSelectedItem(updatedItem);
            console.log("✅ Updated received interest with new message");
          }
        }
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };
  const handleRespondToInvitation = async (item, action) => {
    const message = responseMessage.trim();
    if (!message && action === "accept") {
      toast.error("Please write a message with your response");
      return;
    }
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
      if (user?.role === "talent") {
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
      toast.success(
        action === "accept"
          ? "✅ Accepted and response sent!"
          : "❌ Declined and response sent!",
      );
      setSelectedItem(null);
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
          <Badge className="bg-green-500">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Accepted
          </Badge>
        );
      case "declined":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Declined
          </Badge>
        );
      case "proposed-by-founder":
        return (
          <Badge className="bg-blue-500">
            <Handshake className="w-3 h-3 mr-1" />
            Offer Sent
          </Badge>
        );
      case "proposed-by-talent":
        return (
          <Badge className="bg-purple-500">
            <Handshake className="w-3 h-3 mr-1" />
            Proposed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
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
  const sortMessagesByDate = (items) => {
    const sorted = [...items].sort((a, b) => {
      // Use lastActivityAt if available, otherwise fall back to sentAt, then createdAt
      const dateStrA = a.lastActivityAt || a.sentAt || a.createdAt;
      const dateStrB = b.lastActivityAt || b.sentAt || b.createdAt;
      const dateA = new Date(dateStrA).getTime();
      const dateB = new Date(dateStrB).getTime();

      // Handle invalid dates - push them to the bottom
      if (isNaN(dateA) && isNaN(dateB)) return 0;
      if (isNaN(dateA)) return 1; // A is invalid, push to bottom
      if (isNaN(dateB)) return -1; // B is invalid, push to bottom

      return dateB - dateA; // Descending order (newest activity first)
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
    // Invitations have companyName, Interests have startupTitle
    return (
      "companyName" in item || (!("startupTitle" in item) && "talentId" in item)
    );
  };
  const renderReceivedTab = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
          <p className="font-body text-sm text-text-muted">Loading inbox...</p>
        </div>
      );
    }

    // Combine received items and organization invitations/messages for founders
    const receivedOrgMessages =
      user?.role === "founder"
        ? orgMessages.filter(
            (msg) => msg.type === "received" || !msg.type || !msg.fromFounder,
          )
        : [];
    const allReceivedItems =
      user?.role === "founder"
        ? [...receivedItems, ...orgInvitations, ...receivedOrgMessages]
        : receivedItems;
    console.log("📊 [Inbox-RenderReceived] Displaying received items:", {
      role: user?.role,
      receivedCount: receivedItems.length,
      orgInvitationsCount: orgInvitations.length,
      orgMessagesCount: receivedOrgMessages.length,
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
              {user.role === "talent"
                ? "When founders send you invitations, they'll appear here."
                : "When talent expresses interest in your startup or you receive organization invitations, they'll appear here."}
            </p>
          </CardContent>
        </Card>
      );
    }

    // Sort messages by date - newest first
    const sortedItems = sortMessagesByDate(allReceivedItems);
    return (
      <div className="space-y-3">
        {sortedItems.map((item) => {
          // Check if this is an organization message
          const isOrgMessage =
            "sentByName" in item &&
            !("talentId" in item) &&
            !("founderId" in item) &&
            !("status" in item);
          if (isOrgMessage) {
            // Render organization message card
            const orgMsg = item;
            const isNewMessage = !orgMsg.read;
            return (
              <Card
                key={orgMsg.id}
                className={`cursor-pointer hover:shadow-md transition-all duration-200 ${isNewMessage ? "border-primary/50 bg-primary/5" : ""}`}
                onClick={() => {
                  setSelectedItem(orgMsg);
                  markAsRead(orgMsg.id);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 font-semibold">
                          <Building2 className="w-6 h-6" />
                        </AvatarFallback>
                      </Avatar>
                      {isNewMessage && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full ring-2 ring-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-1">
                          <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <h4
                            className={`${isNewMessage ? "font-bold" : "font-medium"}`}
                          >
                            {orgMsg.subject}
                          </h4>
                        </div>
                        {isNewMessage && (
                          <Badge variant="default" className="text-[10px] px-2">
                            NEW
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {"From: "}
                        <span className="font-medium text-blue-600">
                          {orgMsg.sentByName || "Organization"}
                        </span>
                      </p>
                      <p
                        className={`text-sm line-clamp-2 mb-2 ${isNewMessage ? "font-medium" : ""}`}
                      >
                        {orgMsg.message}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
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
            );
          }

          // Check if this is an organization invitation
          const isOrgInvite = "cohortId" in item && "organizationId" in item;
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
              <Card
                key={orgInvite.id}
                className={`cursor-pointer hover:shadow-md transition-all duration-200 ${isNewMessage ? "border-primary/50 bg-primary/5" : ""}`}
                onClick={() => {
                  setSelectedItem(orgInvite);
                  markAsRead(orgInvite.id);
                  setReadMessages((prev) => [...prev, orgInvite.id]);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100 font-semibold">
                          {(orgInvite.organizationName || "O")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {isNewMessage && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full ring-2 ring-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-1">
                          <Briefcase className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <h4
                            className={`${isNewMessage ? "font-bold" : "font-medium"}`}
                          >
                            Organization Invitation
                          </h4>
                        </div>
                        {getStatusBadge(orgInvite.status)}
                      </div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Briefcase className="w-3 h-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium text-green-600">
                            {orgInvite.organizationName || "Organization"}
                          </span>
                          {" • "}
                          <span className="font-medium">
                            {orgInvite.cohortName || "Cohort"}
                          </span>
                        </p>
                      </div>
                      {orgInvite.message && (
                        <p
                          className={`text-sm line-clamp-2 mb-2 ${isNewMessage ? "font-medium" : ""}`}
                        >
                          {orgInvite.message}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
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
                          <Badge
                            variant="default"
                            className="ml-2 h-5 text-[10px] px-2"
                          >
                            NEW
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }

          // Render regular talent interest/invitation
          const sentBy = isInvitation(item)
            ? item.founderName
            : item.talentName;
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
            <Card
              key={item.id}
              className={`cursor-pointer hover:shadow-md transition-all duration-200 ${isNewMessage ? "border-primary/50 bg-primary/5" : ""}`}
              onClick={() => {
                setSelectedItem(item);
                markAsRead(item.id);
                setReadMessages((prev) => [...prev, item.id]);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {(sentBy || "?")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isNewMessage && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full ring-2 ring-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-1">
                        {user?.role === "talent" ? (
                          <UserPlus className="w-4 h-4 text-primary flex-shrink-0" />
                        ) : (
                          <Heart className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                        <h4
                          className={`${isNewMessage ? "font-bold" : "font-medium"}`}
                        >
                          {isInvitation(item)
                            ? `Invitation from ${sentBy}`
                            : `Interest from ${sentBy}`}
                        </h4>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <UserIconLucide className="w-3 h-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        {isInvitation(item) && item.companyName && (
                          <span className="font-medium">
                            {item.companyName}
                          </span>
                        )}
                        {!isInvitation(item) && (
                          <>
                            {talentArea && (
                              <span className="font-medium text-primary">
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
                    {!isInvitation(item) &&
                      talentSkills &&
                      talentSkills.length > 0 && (
                        <div className="flex items-center gap-1 mb-2 flex-wrap">
                          {talentSkills.slice(0, 3).map((skill, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 h-5"
                            >
                              {skill}
                            </Badge>
                          ))}
                          {talentSkills.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{talentSkills.length - 3}
                              {" more"}
                            </span>
                          )}
                        </div>
                      )}
                    <p
                      className={`text-sm line-clamp-2 mb-2 ${isNewMessage ? "font-medium" : ""}`}
                    >
                      {item.message}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span
                        className={
                          isNewMessage ? "font-semibold text-primary" : ""
                        }
                      >
                        {formatDateTime(
                          item.lastActivityAt || item.sentAt || item.createdAt,
                        )}
                      </span>
                      {isNewMessage && (
                        <Badge
                          variant="default"
                          className="ml-2 h-5 text-[10px] px-2"
                        >
                          NEW
                        </Badge>
                      )}
                    </div>
                    {/* Open Chat button — only for founder viewing a talent interest */}
                    {user?.role === "founder" && !isInvitation(item) && onNavigate && (
                      <div className="mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs h-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            const talentId = String(item.talentId?._id || item.talentId || "");
                            onNavigate("startup-office", { messageUserId: talentId });
                          }}
                        >
                          <MessageCircle className="w-3 h-3" />
                          Open Chat
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
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
              {user?.role === "talent"
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
    return (
      <div className="space-y-3">
        {sortedItems.map((item) => {
          const recipientName = isInvitation(item)
            ? item.talentName
            : item.founderName;
          const hasResponse = item.status !== "pending";
          const isNewActivity = hasNewActivity(
            item.id,
            item.lastActivityAt || item.sentAt || item.createdAt,
            item.sentAt || item.createdAt,
            item,
            userId,
          );
          return (
            <Card
              key={item.id}
              className={`cursor-pointer hover:shadow-md transition-all duration-200 ${isNewActivity ? "border-blue-500/50 bg-blue-50 dark:bg-blue-950/20" : "border-blue-200 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-950/10"}`}
              onClick={() => {
                setSelectedItem(item);
                markAsRead(item.id);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold">
                        {(recipientName || "?")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isNewActivity && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full ring-2 ring-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-1">
                        <Send className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <h4
                          className={
                            isNewActivity ? "font-bold" : "font-medium"
                          }
                        >
                          {isInvitation(item)
                            ? `Invitation to ${recipientName}`
                            : `Your interest in ${item.startupTitle || "startup"}`}
                        </h4>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <UserIconLucide className="w-3 h-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        {"Sent to "}
                        {recipientName}
                        {item.companyName && ` • ${item.companyName}`}
                      </p>
                    </div>
                    <p className="text-sm line-clamp-2 mb-2">{item.message}</p>
                    {hasResponse && item.response && (
                      <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-md border-l-2 border-green-600">
                        <p className="text-xs font-medium mb-1 flex items-center gap-1 text-green-700 dark:text-green-300">
                          <CheckCircle2 className="w-3 h-3" />
                          {recipientName}
                          {" responded:"}
                        </p>
                        <p className="text-sm line-clamp-2">{item.response}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                      <Calendar className="w-3 h-3" />
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
                          className="ml-2 h-5 text-[10px] px-2"
                        >
                          NEW
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
  const renderConversationDialog = () => {
    if (!selectedItem) return null;

    // Check if this is an organization invitation
    const isOrgInvite =
      "cohortId" in selectedItem && "organizationId" in selectedItem;
    if (isOrgInvite) {
      // Render simplified dialog for organization invitations
      const orgInvite = selectedItem;
      return (
        <Dialog
          open={!!selectedItem}
          onOpenChange={() => setSelectedItem(null)}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-green-600" />
                Organization Invitation
              </DialogTitle>
              <DialogDescription>
                {"Join "}
                {orgInvite.cohortName || "this cohort"}
                {" in "}
                {orgInvite.organizationName || "this organization"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3 mb-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100 font-semibold text-lg">
                      {(orgInvite.organizationName || "O")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-green-900 dark:text-green-100">
                      {orgInvite.organizationName || "Organization"}
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {orgInvite.cohortName || "Cohort"}
                    </p>
                  </div>
                </div>
                {orgInvite.message && (
                  <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                    <p className="text-sm text-muted-foreground mb-1 font-medium">
                      Message:
                    </p>
                    <p className="text-sm">{orgInvite.message}</p>
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {"Invited on "}
                      {formatDateTime(orgInvite.sentAt || orgInvite.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              {orgInvite.status === "pending" ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground text-center">
                    Accept this invitation to join the cohort and access
                    exclusive resources, mentorship, and networking
                    opportunities.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        handleRespondToOrgInvitation(orgInvite, "accept")
                      }
                      className="flex-1 bg-green-600 hover:bg-green-700"
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
                        handleRespondToOrgInvitation(orgInvite, "decline")
                      }
                      className="flex-1"
                      variant="outline"
                      disabled={isSending}
                    >
                      {isSending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-2" />
                      )}
                      Decline
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className={`p-4 rounded-lg border ${orgInvite.status === "accepted" ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {orgInvite.status === "accepted" ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                    <p className="font-semibold">
                      {orgInvite.status === "accepted"
                        ? "Invitation Accepted"
                        : "Invitation Declined"}
                    </p>
                  </div>
                  {orgInvite.respondedAt && (
                    <p className="text-xs text-muted-foreground">
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
        ? selectedItem.founderName
        : selectedItem.talentName
      : activeTab === "received"
        ? selectedItem.talentName
        : selectedItem.founderName;
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Conversation
            </DialogTitle>
            <DialogDescription>
              {"Chat with "}
              {otherPartyName}
              {isInv &&
                selectedItem.companyName &&
                ` from ${selectedItem.companyName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-start gap-3 mb-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {otherPartyName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{otherPartyName}</p>
                    {isInv && selectedItem.companyName && (
                      <Badge variant="outline" className="text-xs">
                        {selectedItem.companyName}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(selectedItem.sentAt)}
                  </p>
                </div>
              </div>
              <p className="text-sm">{selectedItem.message}</p>
            </div>
            {selectedItem.messages && selectedItem.messages.length > 0 && (
              <div className="space-y-3">
                {selectedItem.messages.map((msg, idx) => {
                  const isCurrentUser = msg.senderId === userId;
                  return (
                    <div
                      key={idx}
                      className={`flex gap-3 ${isCurrentUser ? "flex-row-reverse" : ""}`}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarFallback
                          className={`text-xs ${isCurrentUser ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100" : "bg-muted"}`}
                        >
                          {msg.sender
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`flex-1 ${isCurrentUser ? "text-right" : ""}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm">{msg.sender}</p>
                          {msg.companyName && (
                            <p className="text-xs text-primary">
                              {msg.companyName}
                            </p>
                          )}
                        </div>
                        <div
                          className={`inline-block p-3 rounded-lg ${isCurrentUser ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100" : "bg-muted"}`}
                        >
                          <p className="text-sm">{msg.text}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {/* ── Pending interest (not yet a proposal) ── */}
            {selectedItem.status === "pending" && activeTab === "received" && (
              <div className="space-y-3 pt-4 border-t">
                <Label>Reply</Label>
                <Textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Write your response..."
                  rows={3}
                  disabled={isSending}
                />
                {user?.role === "talent" ? (
                  <div className="space-y-2">
                    <Button
                      onClick={() => handleSendMessage(selectedItem)}
                      className="w-full"
                      variant="outline"
                      disabled={isSending}
                    >
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
                    {isInvitation(selectedItem) && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() =>
                            handleRespondToInvitation(selectedItem, "accept")
                          }
                          className="flex-1"
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
                          className="flex-1"
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
                  /* Founder sees pending interest — reply or propose team membership */
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSendMessage(selectedItem)}
                        className="flex-1"
                        variant="outline"
                        disabled={isSending}
                      >
                        {isSending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Send Reply
                      </Button>
                      {onNavigate && (
                        <Button
                          variant="outline"
                          className="gap-1.5"
                          disabled={isSending}
                          onClick={() => {
                            const talentId = String(selectedItem.talentId?._id || selectedItem.talentId || "");
                            setSelectedItem(null);
                            onNavigate("startup-office", { messageUserId: talentId });
                          }}
                        >
                          <MessageCircle className="w-4 h-4" />
                          Chat
                        </Button>
                      )}
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-xs text-blue-700 dark:text-blue-300 mb-2 font-medium">
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
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={isSending}
                      >
                        {isSending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Handshake className="w-4 h-4 mr-2" />
                        )}
                        Propose Team Membership
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* ── Talent viewing their sent interest: propose themselves ── */}
            {selectedItem.status === "pending" && activeTab === "sent" && user?.role === "talent" && !isInvitation(selectedItem) && (
              <div className="space-y-3 pt-4 border-t">
                <Label>Continue Conversation</Label>
                <Textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Write a follow-up message..."
                  rows={3}
                  disabled={isSending}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSendMessage(selectedItem)}
                    className="flex-1"
                    variant="outline"
                    disabled={isSending}
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Send Message
                  </Button>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <p className="text-xs text-purple-700 dark:text-purple-300 mb-2 font-medium">
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
                    className="w-full bg-purple-600 hover:bg-purple-700"
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
            {selectedItem.status === "proposed-by-founder" && user?.role === "talent" && (
              <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Handshake className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <p className="font-semibold text-blue-900 dark:text-blue-100">Team Membership Offer</p>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
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
                    className="flex-1 bg-green-600 hover:bg-green-700"
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
                    className="flex-1"
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
            {selectedItem.status === "proposed-by-talent" && user?.role === "founder" && (
              <div className="p-4 rounded-lg border bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800 mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Handshake className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <p className="font-semibold text-purple-900 dark:text-purple-100">Team Membership Proposal</p>
                </div>
                <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                  {selectedItem.talentName || "This talent"} is proposing to join your team. Accept to onboard them.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleOpenCompensationWizard}
                    className="flex-1 bg-green-600 hover:bg-green-700"
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
                    className="flex-1"
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
                className={`p-4 rounded-lg border ${selectedItem.status === "accepted" ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {selectedItem.status === "accepted" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                  <p className="font-semibold">
                    {selectedItem.status === "accepted"
                      ? "Accepted"
                      : "Declined"}
                  </p>
                </div>
                {selectedItem.response && (
                  <p className="text-sm text-muted-foreground">
                    {selectedItem.response}
                  </p>
                )}
                {selectedItem.status === "accepted" &&
                  user?.role === "founder" &&
                  activeTab === "received" &&
                  !isInvitation(selectedItem) && (
                    <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                      <Button
                        onClick={handleOpenCompensationWizard}
                        className="w-full bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Onboard Team
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        {"Configure compensation & complete onboarding for "}
                        {selectedItem.talentName}
                      </p>
                    </div>
                  )}
              </div>
            )}
            {(selectedItem.status === "accepted" || selectedItem.status === "declined") && (
              <div className="space-y-3 pt-4 border-t">
                <Label>Continue Conversation</Label>
                <Textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Write a message..."
                  rows={3}
                  disabled={isSending}
                />
                <Button
                  onClick={() => handleSendMessage(selectedItem)}
                  className="w-full"
                  disabled={isSending}
                >
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
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };
  return (
    <div className="min-h-screen bg-surface-page p-2 font-body md:p-3 lg:p-4">
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
            className="text-text-body transition-colors duration-200 ease-in-out hover:bg-transparent hover:text-primary [&_svg]:text-text-body [&_svg]:transition-colors [&_svg]:duration-200 [&_svg]:ease-in-out hover:[&_svg]:text-primary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-heading">Inbox</h1>
          <p className="font-body text-sm text-text-body">
            Manage your invitations and interests
          </p>
        </div>
      </div>
      {user?.role === "founder" && founderCohorts.length > 0 && (
        <Card className="mb-4">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Message Your Organization</p>
              <p className="text-xs text-muted-foreground">
                Contact your accelerator or program
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setShowOrgMessageComposer(true)}
              className="gap-2"
            >
              <Building2 className="w-4 h-4" />
              Compose
            </Button>
          </CardContent>
        </Card>
      )}
      <Dialog
        open={showOrgMessageComposer}
        onOpenChange={setShowOrgMessageComposer}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Message Organization</DialogTitle>
            <DialogDescription>
              Send a message to your accelerator or program
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendOrgMessage} className="space-y-4">
            <div>
              <Label className="text-sm">Select Organization</Label>
              <select
                value={orgMessageData.cohortId}
                onChange={(e) =>
                  setOrgMessageData({
                    ...orgMessageData,
                    cohortId: e.target.value,
                  })
                }
                required={true}
                className="w-full mt-1 h-9 text-sm rounded-md border border-input bg-background px-3"
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
              <Label className="text-sm">Subject</Label>
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
                className="w-full mt-1 h-9 text-sm rounded-md border border-input bg-background px-3"
              />
            </div>
            <div>
              <Label className="text-sm">Message</Label>
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
                className="mt-1 text-sm min-h-[120px]"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
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
              <Button type="submit" disabled={isSending}>
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
                <Badge className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-pill bg-primary p-0 text-[10px] font-semibold text-primary-foreground">
                  {receivedItems.filter((i) => i.status === "pending").length +
                    orgInvitations.filter((i) => i.status === "pending").length}
                </Badge>
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
