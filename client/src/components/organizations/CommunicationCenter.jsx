/**
 * COMMUNICATION CENTER - Unified messaging system for organizations
 * Two-way communication between organizations and founders
 */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { API_BASE_URL } from "../../config/apiBase.js";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";
import {
  Plus,
  MessageSquare,
  Bell,
  Send,
  Users,
  AlertCircle,
  User,
  Mail,
  MailOpen,
  Reply,
  Pencil,
  Trash2,
  Search,
} from "lucide-react";
import { unwrapData } from "../../utils/apiEnvelope";
import { useOrgListQuery } from "../../hooks/useOrgListQuery";
import { useOrgRealtime } from "../../hooks/useOrgRealtime";
import {
  getCohortAnnouncementsPage,
  getOrganizationMessagesPage,
} from "../../utils/api/organizationApi";
import PaginationControls from "../shared/PaginationControls";
import { toastError } from "../../utils/toastError";
import { toast } from "sonner";
import {
  updateCohortAnnouncement as updateCohortAnnouncementApi,
  deleteCohortAnnouncement as deleteCohortAnnouncementApi,
  markCohortAnnouncementRead as markCohortAnnouncementReadApi,
} from "../../utils/api/organizationApi";
import {
  GradientHero,
  SectionCard,
  CollapsibleFormCard,
  StatusBadge,
  EmptyStateBlock,
} from "./_primitives";
import { cn } from "../ui/utils";

const API_BASE = API_BASE_URL;

const defaultOptions = {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
};

const PRIORITY_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
  { value: "low", label: "Low" },
];

const PRIMARY_BUTTON =
  "h-9 rounded-input bg-primary font-body text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.25)] hover:bg-primary-hover";

export default function CommunicationCenter({
  cohortId,
  organizationId,
  userId,
  userName,
  isAdmin,
  cohortMembers = [],
}) {
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageMode, setMessageMode] = useState("individual");
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState("");
  const [activeTab, setActiveTab] = useState("announcements");
  const [announcementData, setAnnouncementData] = useState({
    title: "",
    content: "",
    priority: "normal",
  });
  const [editingAnnouncementId, setEditingAnnouncementId] = useState(null);
  const [messageData, setMessageData] = useState({
    subject: "",
    message: "",
  });
  const [selectedThreadFounderId, setSelectedThreadFounderId] = useState(null);

  const {
    items: announcementRows,
    total: announcementsTotal,
    limit: announcementsLimit,
    loading: announcementsLoading,
    q: announcementsQ,
    setSearch: setAnnouncementsSearch,
    currentPage: announcementsPage,
    totalPages: announcementsTotalPages,
    hasNext: announcementsHasNext,
    hasPrev: announcementsHasPrev,
    goToPage: goToAnnouncementsPage,
    nextPage: announcementsNextPage,
    prevPage: announcementsPrevPage,
    refresh: refreshAnnouncements,
  } = useOrgListQuery({
    fetchFn: useCallback(
      (params) => getCohortAnnouncementsPage(cohortId, params),
      [cohortId],
    ),
    initialLimit: 25,
  });

  const announcements = announcementRows;

  const {
    items: messages,
    total: messagesTotal,
    limit: messagesLimit,
    loading: messagesLoading,
    q: messagesQ,
    setSearch: setMessagesSearch,
    currentPage: messagesPage,
    totalPages: messagesTotalPages,
    hasNext: messagesHasNext,
    hasPrev: messagesHasPrev,
    goToPage: goToMessagesPage,
    nextPage: messagesNextPage,
    prevPage: messagesPrevPage,
    refresh: refreshMessages,
  } = useOrgListQuery({
    fetchFn: useCallback(
      (params) => getOrganizationMessagesPage(organizationId, params),
      [organizationId],
    ),
    initialLimit: 50,
    autoFetch: activeTab === "messages",
  });

  useOrgRealtime(organizationId, cohortId, {
    onMessage: () => {
      refreshMessages().catch(() => {});
    },
    onAnnouncement: () => {
      refreshAnnouncements().catch(() => {});
    },
  });

  // Step 2.14: group inbound messages by founder so admins can triage by
  // conversation instead of scanning a flat list. Outbound (Sent) rows still
  // render in a separate flat list below.
  const meIdStr = String(userId || "");
  const founderThreads = useMemo(() => {
    const byFounder = new Map();
    for (const m of messages) {
      if (String(m.toUserId || "") !== meIdStr) continue;
      const senderId = String(m.fromUserId || m.from?.id || "");
      if (!senderId) continue;
      const fallbackMember = cohortMembers.find(
        (cm) => String(cm.founderId) === senderId,
      );
      const t = byFounder.get(senderId) || {
        founderId: senderId,
        founderName:
          m.from?.name ||
          m.metadata?.founderName ||
          fallbackMember?.founderName ||
          "Founder",
        startupName:
          m.from?.startupName ||
          m.metadata?.startupName ||
          fallbackMember?.startupName ||
          "",
        messages: [],
        unread: 0,
        latestAt: 0,
      };
      t.messages.push(m);
      if (!m.readAt) t.unread += 1;
      const at = new Date(m.createdAt || m.sentAt || 0).getTime();
      if (at > t.latestAt) t.latestAt = at;
      byFounder.set(senderId, t);
    }
    for (const t of byFounder.values()) {
      t.messages.sort(
        (a, b) =>
          new Date(a.createdAt || a.sentAt || 0).getTime() -
          new Date(b.createdAt || b.sentAt || 0).getTime(),
      );
    }
    return [...byFounder.values()].sort((a, b) => b.latestAt - a.latestAt);
  }, [messages, meIdStr, cohortMembers]);

  const sentMessages = useMemo(
    () => messages.filter((m) => String(m.toUserId || "") !== meIdStr),
    [messages, meIdStr],
  );

  const selectedThread = useMemo(
    () =>
      founderThreads.find((t) => t.founderId === selectedThreadFounderId) ||
      founderThreads[0] ||
      null,
    [founderThreads, selectedThreadFounderId],
  );

  const replyToFounder = (founderId, subject = "") => {
    setMessageMode("individual");
    setSelectedRecipient(founderId);
    setMessageData({
      subject: subject ? `Re: ${subject}` : "",
      message: "",
    });
    setShowMessageForm(true);
  };

  useEffect(() => {
    if (activeTab !== "messages") return;
    if (!userId) return;
    const meIdStr = String(userId);
    const unreadInboundIds = messages
      .filter(
        (m) =>
          !m.readAt && String(m.toUserId || "") === meIdStr,
      )
      .map((m) => m.id || m._id)
      .filter(Boolean);
    if (unreadInboundIds.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`${API_BASE}/messages/mark-read`, {
          ...defaultOptions,
          method: "POST",
          body: JSON.stringify({ messageIds: unreadInboundIds }),
        });
        if (!response.ok) return;
        if (cancelled) return;
        await refreshMessages();
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, messages, userId]);

  useEffect(() => {
    if (activeTab !== "announcements") return;
    if (isAdmin) return;
    if (!userId) return;
    const meIdStr = String(userId);
    const unreadIds = announcements
      .filter((a) => {
        const readBy = Array.isArray(a.readBy) ? a.readBy : [];
        return !readBy.map((v) => String(v)).includes(meIdStr);
      })
      .map((a) => a.id || a._id)
      .filter(Boolean);
    if (unreadIds.length === 0) return;

    let cancelled = false;
    (async () => {
      const marked = [];
      for (const id of unreadIds) {
        try {
          await markCohortAnnouncementReadApi(cohortId, id);
          marked.push(String(id));
        } catch (error) {
          console.error("Error marking announcement as read:", error);
        }
      }
      if (cancelled || marked.length === 0) return;
      await refreshAnnouncements();
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, announcements, isAdmin, userId, cohortId]);

  const resetAnnouncementForm = () => {
    setAnnouncementData({ title: "", content: "", priority: "normal" });
    setEditingAnnouncementId(null);
    setShowAnnouncementForm(false);
  };

  const handleStartEditAnnouncement = (announcement) => {
    setEditingAnnouncementId(announcement.id || announcement._id);
    setAnnouncementData({
      title: announcement.title || "",
      content: announcement.body || announcement.content || "",
      priority: announcement.priority || "normal",
    });
    setShowAnnouncementForm(true);
    window?.scrollTo?.({ top: 0, behavior: "smooth" });
  };

  const handleDeleteAnnouncement = async (announcement) => {
    const id = announcement.id || announcement._id;
    if (!id) return;
    const ok =
      typeof window !== "undefined" && typeof window.confirm === "function"
        ? window.confirm(
            `Delete announcement "${announcement.title || ""}"? This cannot be undone.`,
          )
        : true;
    if (!ok) return;
    try {
      await deleteCohortAnnouncementApi(cohortId, id);
      await refreshAnnouncements();
      if (String(editingAnnouncementId) === String(id)) {
        resetAnnouncementForm();
      }
      toast.success("Announcement deleted");
    } catch (error) {
      console.error("Error deleting announcement:", error);
      toastError(error, "Failed to delete announcement");
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      if (editingAnnouncementId) {
        const payload = {
          title: announcementData.title,
          body: announcementData.content,
          priority: announcementData.priority,
        };
        await updateCohortAnnouncementApi(
          cohortId,
          editingAnnouncementId,
          payload,
        );
        toast.success("Announcement updated");
        resetAnnouncementForm();
        await refreshAnnouncements();
        return;
      }

      const response = await fetch(
        `${API_BASE}/cohorts/${cohortId}/announcements`,
        {
          ...defaultOptions,
          method: "POST",
          body: JSON.stringify({
            organizationId,
            title: announcementData.title,
            body: announcementData.content,
            priority: announcementData.priority,
            founderId: userId,
          }),
        },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const err = new Error(body?.message || "Failed to create announcement");
        err.status = response.status;
        throw err;
      }
      resetAnnouncementForm();
      await refreshAnnouncements();
    } catch (error) {
      console.error("Error saving announcement:", error);
      toastError(
        error,
        editingAnnouncementId
          ? "Failed to update announcement"
          : "Failed to create announcement",
      );
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (messageMode === "bulk" && selectedRecipients.length === 0) {
      toast.error("Please select at least one recipient");
      return;
    }
    if (messageMode === "individual" && !selectedRecipient) {
      toast.error("Please select a recipient");
      return;
    }
    try {
      const endpoint =
        messageMode === "bulk"
          ? "messages/bulk-send"
          : "messages/send-individual";
      const body =
        messageMode === "bulk"
          ? {
              cohortId,
              organizationId,
              recipientIds: selectedRecipients,
              subject: messageData.subject,
              message: messageData.message,
              sentBy: userId,
              sentByName: userName,
            }
          : {
              cohortId,
              organizationId,
              recipientId: selectedRecipient,
              subject: messageData.subject,
              message: messageData.message,
              sentBy: userId,
              sentByName: userName,
            };
      const response = await fetch(`${API_BASE}/${endpoint}`, {
        ...defaultOptions,
        method: "POST",
        body: JSON.stringify(body),
      });
      const responseJson = await response.json().catch(() => ({}));
      if (!response.ok) {
        const err = new Error(responseJson?.message || "Failed to send message");
        err.status = response.status;
        throw err;
      }
      const inner = unwrapData(responseJson);
      const recipientCount =
        messageMode === "bulk"
          ? (inner.recipientCount ?? inner.recipients?.length ?? 1)
          : 1;
      toast.success(
        `Message sent to ${recipientCount} startup${recipientCount > 1 ? "s" : ""}!`,
      );
      setMessageData({ subject: "", message: "" });
      setSelectedRecipients([]);
      setSelectedRecipient("");
      setShowMessageForm(false);
      await refreshMessages();
    } catch (error) {
      console.error("Error sending message:", error);
      toastError(error, "Failed to send message");
    }
  };

  const toggleRecipient = (recipientId) => {
    if (selectedRecipients.includes(recipientId)) {
      setSelectedRecipients(
        selectedRecipients.filter((id) => id !== recipientId),
      );
    } else {
      setSelectedRecipients([...selectedRecipients, recipientId]);
    }
  };

  const toggleAllRecipients = () => {
    if (selectedRecipients.length === cohortMembers.length) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(cohortMembers.map((m) => m.founderId));
    }
  };

  const heroActions = isAdmin
    ? [
        {
          label: "New Announcement",
          icon: Plus,
          variant: "white",
          onClick: () => {
            setShowAnnouncementForm(true);
            window?.scrollTo?.({ top: 0, behavior: "smooth" });
          },
        },
      ]
    : [];

  return (
    <div className="space-y-4 font-body">
      <GradientHero
        icon={Bell}
        title="Communication"
        subtitle="Send announcements and direct messages to your cohort"
        actions={heroActions}
      />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid h-10 w-full grid-cols-2 rounded-card bg-surface-page p-1">
          <TabsTrigger
            value="announcements"
            className="h-8 rounded-input font-body text-[13px] font-medium data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-soft"
          >
            <Bell className="mr-2 h-4 w-4" />
            Announcements
          </TabsTrigger>
          <TabsTrigger
            value="messages"
            className="h-8 rounded-input font-body text-[13px] font-medium data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-soft"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Messages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="announcements" className="mt-3 space-y-3">
          {isAdmin && (
            <CollapsibleFormCard
              title={
                editingAnnouncementId
                  ? "Edit Announcement"
                  : "Create Announcement"
              }
              description={
                editingAnnouncementId
                  ? "Update this announcement for all cohort members"
                  : "Post an update visible to all cohort members"
              }
              triggerLabel={editingAnnouncementId ? "Editing" : "New"}
              isOpen={showAnnouncementForm}
              onToggle={(next) => {
                setShowAnnouncementForm(next);
                if (!next && editingAnnouncementId) {
                  resetAnnouncementForm();
                }
              }}
            >
              <form
                onSubmit={handleCreateAnnouncement}
                className="space-y-3"
              >
                <div>
                  <label className="mb-2 block font-body text-[13px] font-medium text-text-heading">
                    Title
                  </label>
                  <Input
                    value={announcementData.title}
                    onChange={(e) =>
                      setAnnouncementData({
                        ...announcementData,
                        title: e.target.value,
                      })
                    }
                    placeholder="e.g., Week 3 Check-in"
                    required={true}
                    className="font-body text-[13px]"
                  />
                </div>
                <div>
                  <label className="mb-2 block font-body text-[13px] font-medium text-text-heading">
                    Message
                  </label>
                  <Textarea
                    value={announcementData.content}
                    onChange={(e) =>
                      setAnnouncementData({
                        ...announcementData,
                        content: e.target.value,
                      })
                    }
                    placeholder="What do you want to announce?"
                    required={true}
                    className="min-h-[80px] font-body text-[13px]"
                  />
                </div>
                <div>
                  <label className="mb-2 block font-body text-[13px] font-medium text-text-heading">
                    Priority
                  </label>
                  <Select
                    value={announcementData.priority}
                    onValueChange={(value) =>
                      setAnnouncementData({
                        ...announcementData,
                        priority: value,
                      })
                    }
                  >
                    <SelectTrigger className="font-body text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="font-body text-[13px]"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" className={PRIMARY_BUTTON}>
                    <Bell className="mr-2 h-4 w-4" />
                    {editingAnnouncementId
                      ? "Save Changes"
                      : "Post Announcement"}
                  </Button>
                  {editingAnnouncementId && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={resetAnnouncementForm}
                      className="h-9 rounded-input border border-surface-border bg-white font-body text-[13px] font-medium text-text-body hover:bg-surface-page"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CollapsibleFormCard>
          )}

          <SectionCard>
            <SectionCard.Body className="p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                <Input
                  value={announcementsQ}
                  onChange={(e) => setAnnouncementsSearch(e.target.value)}
                  placeholder="Search announcements…"
                  className="pl-8 font-body text-[13px]"
                />
              </div>
            </SectionCard.Body>
          </SectionCard>

          {announcementsLoading ? (
            <SectionCard>
              <SectionCard.Body className="p-8 text-center">
                <div className="font-body text-[13px] text-text-muted animate-pulse">
                  Loading announcements...
                </div>
              </SectionCard.Body>
            </SectionCard>
          ) : announcementsTotal === 0 ? (
            <SectionCard>
              <SectionCard.Body className="p-0">
                <EmptyStateBlock
                  variant="centered"
                  icon={Bell}
                  tone="info"
                  title="No announcements yet"
                  description={
                    isAdmin
                      ? "Announcements you post appear here for all cohort members"
                      : "Your organization hasn't posted any announcements yet"
                  }
                  action={
                    isAdmin ? (
                      <Button
                        size="sm"
                        onClick={() => setShowAnnouncementForm(true)}
                        className={PRIMARY_BUTTON}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        New Announcement
                      </Button>
                    ) : null
                  }
                />
              </SectionCard.Body>
            </SectionCard>
          ) : (
            <div className="space-y-2">
              {announcements.map((announcement) => (
                <SectionCard key={announcement.id}>
                  <SectionCard.Body>
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2 flex-wrap">
                          <h3 className="font-heading text-[14px] font-bold text-text-heading">
                            {announcement.title}
                          </h3>
                          <StatusBadge
                            status={announcement.priority || "normal"}
                            icon={
                              announcement.priority === "urgent"
                                ? AlertCircle
                                : undefined
                            }
                          />
                        </div>
                        <p className="whitespace-pre-wrap font-body text-[13px] text-text-body">
                          {announcement.body || announcement.content}
                        </p>
                      </div>
                      {isAdmin && (
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() =>
                              handleStartEditAnnouncement(announcement)
                            }
                            aria-label="Edit announcement"
                            className="h-8 w-8 rounded-input p-0 text-text-muted hover:bg-primary-tint hover:text-primary"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() =>
                              handleDeleteAnnouncement(announcement)
                            }
                            aria-label="Delete announcement"
                            className="h-8 w-8 rounded-input p-0 text-text-muted hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between font-body text-[12px] text-text-muted">
                      <span>
                        By {announcement.createdByName} •{" "}
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </span>
                      <span>{announcement.readBy?.length ?? 0} read</span>
                    </div>
                  </SectionCard.Body>
                </SectionCard>
              ))}
            </div>
          )}

          {!announcementsLoading && announcementsTotal > announcementsLimit && (
            <PaginationControls
              currentPage={announcementsPage}
              totalPages={announcementsTotalPages}
              hasNext={announcementsHasNext}
              hasPrev={announcementsHasPrev}
              onNext={announcementsNextPage}
              onPrev={announcementsPrevPage}
              onGoToPage={goToAnnouncementsPage}
              totalItems={announcementsTotal}
              pageSize={announcementsLimit}
            />
          )}
        </TabsContent>

        <TabsContent value="messages" className="mt-3 space-y-3">
          {isAdmin && (
            <CollapsibleFormCard
              title="Compose Message"
              description="Send a 1-on-1 or bulk message to startups in this cohort"
              triggerLabel="New Message"
              isOpen={showMessageForm}
              onToggle={setShowMessageForm}
            >
              <form onSubmit={handleSendMessage} className="space-y-3">
                <div>
                  <label className="mb-2 block font-body text-[13px] font-medium text-text-heading">
                    Message Type
                  </label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setMessageMode("individual");
                        setSelectedRecipients([]);
                      }}
                      className={cn(
                        "h-9 flex-1 rounded-input font-body text-[13px] font-medium transition-colors",
                        messageMode === "individual"
                          ? "bg-primary text-white shadow-[0_4px_16px_rgba(58,90,254,0.25)] hover:bg-primary-hover"
                          : "border border-surface-border bg-white text-text-body hover:bg-primary-tint hover:text-primary",
                      )}
                    >
                      <User className="mr-2 h-4 w-4" />
                      1-on-1
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setMessageMode("bulk");
                        setSelectedRecipient("");
                      }}
                      className={cn(
                        "h-9 flex-1 rounded-input font-body text-[13px] font-medium transition-colors",
                        messageMode === "bulk"
                          ? "bg-primary text-white shadow-[0_4px_16px_rgba(58,90,254,0.25)] hover:bg-primary-hover"
                          : "border border-surface-border bg-white text-text-body hover:bg-primary-tint hover:text-primary",
                      )}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Bulk
                    </Button>
                  </div>
                </div>

                {messageMode === "individual" ? (
                  <div>
                    <label className="mb-2 block font-body text-[13px] font-medium text-text-heading">
                      Select Startup
                    </label>
                    <Select
                      value={selectedRecipient}
                      onValueChange={(value) => setSelectedRecipient(value)}
                    >
                      <SelectTrigger className="font-body text-[13px]">
                        <SelectValue placeholder="Choose a startup..." />
                      </SelectTrigger>
                      <SelectContent>
                        {cohortMembers.length === 0 ? (
                          <SelectItem
                            value="__no_members__"
                            disabled={true}
                            className="font-body text-[13px]"
                          >
                            No startups in cohort
                          </SelectItem>
                        ) : (
                          cohortMembers.map((member) => (
                            <SelectItem
                              key={member.founderId}
                              value={member.founderId}
                              className="font-body text-[13px]"
                            >
                              {member.startupName || member.founderName}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="font-body text-[13px] font-medium text-text-heading">
                        Select Startups
                      </label>
                      <Button
                        type="button"
                        size="sm"
                        onClick={toggleAllRecipients}
                        className="h-8 rounded-input font-body text-[12px] font-medium text-primary hover:bg-primary-tint"
                      >
                        {selectedRecipients.length === cohortMembers.length
                          ? "Deselect All"
                          : "Select All"}
                      </Button>
                    </div>
                    <div className="max-h-48 space-y-1 overflow-y-auto rounded-input border border-surface-border bg-white p-2">
                      {cohortMembers.length === 0 ? (
                        <p className="py-3 text-center font-body text-[13px] text-text-muted">
                          No startups in cohort
                        </p>
                      ) : (
                        cohortMembers.map((member) => (
                          <label
                            key={member.founderId}
                            className="flex cursor-pointer items-center gap-2 rounded-input p-2 hover:bg-primary-tint/40"
                          >
                            <Checkbox
                              checked={selectedRecipients.includes(
                                member.founderId,
                              )}
                              onCheckedChange={() =>
                                toggleRecipient(member.founderId)
                              }
                            />
                            <span className="font-body text-[13px] text-text-body">
                              {member.startupName || member.founderName}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                    <p className="mt-1 font-body text-[12px] text-text-muted">
                      {selectedRecipients.length} selected
                    </p>
                  </div>
                )}

                <div>
                  <label className="mb-2 block font-body text-[13px] font-medium text-text-heading">
                    Subject
                  </label>
                  <Input
                    value={messageData.subject}
                    onChange={(e) =>
                      setMessageData({
                        ...messageData,
                        subject: e.target.value,
                      })
                    }
                    placeholder="Message subject"
                    required={true}
                    className="font-body text-[13px]"
                  />
                </div>
                <div>
                  <label className="mb-2 block font-body text-[13px] font-medium text-text-heading">
                    Message
                  </label>
                  <Textarea
                    value={messageData.message}
                    onChange={(e) =>
                      setMessageData({
                        ...messageData,
                        message: e.target.value,
                      })
                    }
                    placeholder="Type your message..."
                    required={true}
                    className="min-h-[100px] font-body text-[13px]"
                  />
                </div>
                <Button
                  type="submit"
                  size="sm"
                  className={PRIMARY_BUTTON}
                  disabled={
                    messageMode === "individual"
                      ? !selectedRecipient
                      : selectedRecipients.length === 0
                  }
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </form>
            </CollapsibleFormCard>
          )}

          <SectionCard>
            <SectionCard.Body className="p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                <Input
                  value={messagesQ}
                  onChange={(e) => setMessagesSearch(e.target.value)}
                  placeholder="Search messages…"
                  className="pl-8 font-body text-[13px]"
                />
              </div>
            </SectionCard.Body>
          </SectionCard>

          <SectionCard>
            <SectionCard.Header
              title="Founder threads"
              description={
                founderThreads.length === 0
                  ? "No inbound messages yet"
                  : `${founderThreads.length} founder${founderThreads.length !== 1 ? "s" : ""}`
              }
            />
            <SectionCard.Body>
              {messagesLoading ? (
                <div className="py-8 text-center font-body text-[13px] text-text-muted animate-pulse">
                  Loading messages…
                </div>
              ) : founderThreads.length === 0 ? (
                <EmptyStateBlock
                  variant="compact"
                  icon={MessageSquare}
                  tone="info"
                  title="No messages yet"
                  description="Messages from cohort founders will appear here, grouped by founder."
                />
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[260px,1fr]">
                  <div className="space-y-1.5 md:max-h-[520px] md:overflow-y-auto md:pr-1">
                    {founderThreads.map((t) => {
                      const isActive =
                        (selectedThread?.founderId || founderThreads[0]?.founderId) ===
                        t.founderId;
                      const latest = t.messages[t.messages.length - 1];
                      return (
                        <button
                          key={t.founderId}
                          type="button"
                          onClick={() => setSelectedThreadFounderId(t.founderId)}
                          className={cn(
                            "w-full rounded-input border p-2.5 text-left transition-colors",
                            isActive
                              ? "border-primary/40 bg-primary-tint"
                              : "border-surface-border bg-white hover:bg-surface-page",
                          )}
                        >
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="truncate font-body text-[13px] font-semibold text-text-heading">
                              {t.founderName}
                              {t.startupName ? (
                                <span className="ml-1 font-normal text-text-muted">
                                  · {t.startupName}
                                </span>
                              ) : null}
                            </span>
                            {t.unread > 0 ? (
                              <span className="rounded-full bg-primary px-1.5 py-0.5 font-body text-[10px] font-bold text-white">
                                {t.unread}
                              </span>
                            ) : null}
                          </div>
                          <p className="truncate font-body text-[12px] text-text-muted">
                            {latest?.subject || latest?.body || "(no subject)"}
                          </p>
                          <p className="font-body text-[11px] text-text-muted">
                            {t.latestAt
                              ? new Date(t.latestAt).toLocaleString()
                              : ""}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                  <div className="rounded-input border border-surface-border bg-white">
                    {selectedThread ? (
                      <>
                        <div className="flex items-center justify-between border-b border-surface-border p-3">
                          <div>
                            <h4 className="font-heading text-[14px] font-bold text-text-heading">
                              {selectedThread.founderName}
                              {selectedThread.startupName ? (
                                <span className="ml-1 font-body text-[12px] font-normal text-text-muted">
                                  · {selectedThread.startupName}
                                </span>
                              ) : null}
                            </h4>
                            <p className="font-body text-[12px] text-text-muted">
                              {selectedThread.messages.length} message
                              {selectedThread.messages.length === 1 ? "" : "s"}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() =>
                              replyToFounder(
                                selectedThread.founderId,
                                selectedThread.messages[
                                  selectedThread.messages.length - 1
                                ]?.subject || "",
                              )
                            }
                            className="h-8 rounded-input bg-primary font-body text-[12px] font-semibold text-white hover:bg-primary-hover"
                          >
                            <Reply className="mr-1 h-3.5 w-3.5" />
                            Reply
                          </Button>
                        </div>
                        <div className="space-y-2 p-3 md:max-h-[440px] md:overflow-y-auto">
                          {selectedThread.messages.map((msg) => {
                            const sentAt = msg.createdAt || msg.sentAt;
                            const msgKey = msg.id || msg._id;
                            return (
                              <div
                                key={msgKey}
                                className="rounded-input border border-primary/20 bg-primary-tint p-3"
                              >
                                <div className="mb-1 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <Mail className="h-3.5 w-3.5 text-primary" />
                                    <span className="font-body text-[12px] font-semibold text-text-heading">
                                      {selectedThread.founderName}
                                    </span>
                                  </div>
                                  <span className="font-body text-[11px] text-text-muted">
                                    {sentAt
                                      ? new Date(sentAt).toLocaleString()
                                      : ""}
                                  </span>
                                </div>
                                {msg.subject ? (
                                  <h5 className="mb-1 font-heading text-[13px] font-bold text-text-heading">
                                    {msg.subject}
                                  </h5>
                                ) : null}
                                <p className="whitespace-pre-wrap font-body text-[13px] text-text-body">
                                  {msg.body ?? msg.message ?? ""}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="p-6 text-center font-body text-[13px] text-text-muted">
                        Select a founder to read their messages.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </SectionCard.Body>
          </SectionCard>

          {sentMessages.length > 0 && (
            <SectionCard>
              <SectionCard.Header
                title="Sent"
                description={`${sentMessages.length} message${sentMessages.length !== 1 ? "s" : ""}`}
              />
              <SectionCard.Body>
                <div className="space-y-2">
                  {sentMessages.map((message) => {
                    const recipientLabel =
                      message.to?.startupName ||
                      message.to?.name ||
                      cohortMembers.find(
                        (m) => String(m.founderId) === String(message.toUserId),
                      )?.startupName ||
                      cohortMembers.find(
                        (m) => String(m.founderId) === String(message.toUserId),
                      )?.founderName ||
                      message.to?.email ||
                      "Startup";
                    const messageBody = message.body ?? message.message ?? "";
                    const sentAt = message.createdAt || message.sentAt;
                    const messageKey = message.id || message._id;
                    return (
                      <div
                        key={messageKey}
                        className="rounded-input border border-surface-border bg-surface-page p-3"
                      >
                        <div className="mb-1 flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <MailOpen className="h-3.5 w-3.5 text-text-muted" />
                            <span className="font-body text-[12px] font-semibold text-text-heading">
                              To: {recipientLabel}
                            </span>
                          </div>
                          <StatusBadge tone="success" label="Sent" />
                        </div>
                        <h4 className="mb-1 font-heading text-[14px] font-bold text-text-heading">
                          {message.subject || "(no subject)"}
                        </h4>
                        <p className="mb-2 whitespace-pre-wrap font-body text-[13px] text-text-body">
                          {messageBody}
                        </p>
                        <span className="font-body text-[12px] text-text-muted">
                          {sentAt ? new Date(sentAt).toLocaleString() : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </SectionCard.Body>
            </SectionCard>
          )}

          {!messagesLoading && messagesTotal > messagesLimit && (
            <PaginationControls
              currentPage={messagesPage}
              totalPages={messagesTotalPages}
              hasNext={messagesHasNext}
              hasPrev={messagesHasPrev}
              onNext={messagesNextPage}
              onPrev={messagesPrevPage}
              onGoToPage={goToMessagesPage}
              totalItems={messagesTotal}
              pageSize={messagesLimit}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
