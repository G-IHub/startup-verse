/**
 * COMMUNICATION CENTER - Unified messaging system for organizations
 * Two-way communication between organizations and founders
 */
import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { unwrapData } from "../../utils/apiEnvelope";
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
  const [announcements, setAnnouncements] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageMode, setMessageMode] = useState("individual");
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState("");
  const [announcementData, setAnnouncementData] = useState({
    title: "",
    content: "",
    priority: "normal",
  });
  const [messageData, setMessageData] = useState({
    subject: "",
    message: "",
  });

  useEffect(() => {
    loadAnnouncements();
    loadMessages();
  }, [cohortId, organizationId]);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/cohorts/${cohortId}/announcements`,
        { ...defaultOptions },
      );
      if (!response.ok) throw new Error("Failed to fetch announcements");
      const inner = unwrapData(await response.json());
      setAnnouncements(inner.announcements || []);
    } catch (error) {
      console.error("Error loading announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/messages/organization/${organizationId}`,
        defaultOptions,
      );
      if (!response.ok) throw new Error("Failed to fetch messages");
      const raw = unwrapData(await response.json());
      const list = Array.isArray(raw) ? raw : raw.messages || [];
      setMessages(list);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
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
      if (!response.ok) throw new Error("Failed to create announcement");
      setAnnouncementData({ title: "", content: "", priority: "normal" });
      setShowAnnouncementForm(false);
      loadAnnouncements();
    } catch (error) {
      console.error("Error creating announcement:", error);
      alert("Failed to create announcement");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (messageMode === "bulk" && selectedRecipients.length === 0) {
      alert("Please select at least one recipient");
      return;
    }
    if (messageMode === "individual" && !selectedRecipient) {
      alert("Please select a recipient");
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
      if (!response.ok) throw new Error("Failed to send message");
      const inner = unwrapData(await response.json());
      const recipientCount =
        messageMode === "bulk"
          ? (inner.recipientCount ?? inner.recipients?.length ?? 1)
          : 1;
      alert(
        `Message sent to ${recipientCount} startup${recipientCount > 1 ? "s" : ""}!`,
      );
      setMessageData({ subject: "", message: "" });
      setSelectedRecipients([]);
      setSelectedRecipient("");
      setShowMessageForm(false);
      loadMessages();
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
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

      <Tabs defaultValue="announcements" className="w-full">
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
              title="Create Announcement"
              description="Post an update visible to all cohort members"
              triggerLabel="New"
              isOpen={showAnnouncementForm}
              onToggle={setShowAnnouncementForm}
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
                <Button type="submit" size="sm" className={PRIMARY_BUTTON}>
                  <Bell className="mr-2 h-4 w-4" />
                  Post Announcement
                </Button>
              </form>
            </CollapsibleFormCard>
          )}

          {loading ? (
            <SectionCard>
              <SectionCard.Body className="p-8 text-center">
                <div className="font-body text-[13px] text-text-muted animate-pulse">
                  Loading announcements...
                </div>
              </SectionCard.Body>
            </SectionCard>
          ) : announcements.length === 0 ? (
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
            <SectionCard.Header
              title="Message Inbox"
              description={`${messages.length} message${messages.length !== 1 ? "s" : ""}`}
            />
            <SectionCard.Body>
              {messages.length === 0 ? (
                <EmptyStateBlock
                  variant="compact"
                  icon={MessageSquare}
                  tone="info"
                  title="No messages yet"
                  description="Conversations with cohort startups will appear here"
                />
              ) : (
                <div className="space-y-2">
                  {messages.map((message) => {
                    const isReceived =
                      message.type === "received" || message.fromFounder;
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "rounded-input border p-3",
                          isReceived
                            ? "border-primary/20 bg-primary-tint"
                            : "border-surface-border bg-surface-page",
                        )}
                      >
                        <div className="mb-1 flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {isReceived ? (
                              <>
                                <Mail className="h-3.5 w-3.5 text-primary" />
                                <span className="font-body text-[12px] font-semibold text-text-heading">
                                  From:{" "}
                                  {message.startupName || message.founderName}
                                </span>
                              </>
                            ) : (
                              <>
                                <MailOpen className="h-3.5 w-3.5 text-text-muted" />
                                <span className="font-body text-[12px] font-semibold text-text-heading">
                                  To:{" "}
                                  {cohortMembers.find(
                                    (m) =>
                                      m.founderId === message.recipientId,
                                  )?.startupName ||
                                    cohortMembers.find(
                                      (m) =>
                                        m.founderId === message.recipientId,
                                    )?.founderName ||
                                    "Startup"}
                                </span>
                              </>
                            )}
                          </div>
                          <StatusBadge
                            tone={isReceived ? "info" : "success"}
                            label={isReceived ? "Received" : "Sent"}
                          />
                        </div>
                        <h4 className="mb-1 font-heading text-[14px] font-bold text-text-heading">
                          {message.subject}
                        </h4>
                        <p className="mb-2 whitespace-pre-wrap font-body text-[13px] text-text-body">
                          {message.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="font-body text-[12px] text-text-muted">
                            {new Date(message.sentAt).toLocaleString()}
                          </span>
                          {isReceived && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setMessageMode("individual");
                                setSelectedRecipient(message.founderId || "");
                                setMessageData({
                                  subject: `Re: ${message.subject}`,
                                  message: "",
                                });
                                setShowMessageForm(true);
                              }}
                              className="h-8 rounded-input font-body text-[12px] font-medium text-primary hover:bg-primary-tint"
                            >
                              <Reply className="mr-1 h-3.5 w-3.5" />
                              Reply
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard.Body>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
