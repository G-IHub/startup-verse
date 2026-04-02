/**
 * COMMUNICATION CENTER - Unified messaging system for organizations
 * Two-way communication between organizations and founders
 */
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
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
        `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/announcements/${cohortId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch announcements");
      const data = await response.json();
      setAnnouncements(data.announcements);
    } catch (error) {
      console.error("Error loading announcements:", error);
    } finally {
      setLoading(false);
    }
  };
  const loadMessages = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/messages/organization/${organizationId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch messages");
      const data = await response.json();
      setMessages(data.messages || []);
      console.log(
        "📨 Loaded organization messages:",
        data.messages?.length || 0,
      );
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/announcements/create`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cohortId,
            organizationId,
            title: announcementData.title,
            content: announcementData.content,
            priority: announcementData.priority,
            attachments: [],
            createdBy: userId,
            createdByName: userName,
          }),
        },
      );
      if (!response.ok) throw new Error("Failed to create announcement");

      // Reset form and reload
      setAnnouncementData({
        title: "",
        content: "",
        priority: "normal",
      });
      setShowAnnouncementForm(false);
      loadAnnouncements();
      alert("Announcement posted!");
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
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/${endpoint}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );
      if (!response.ok) throw new Error("Failed to send message");
      const data = await response.json();
      const recipientCount = messageMode === "bulk" ? data.recipientCount : 1;
      alert(
        `Message sent to ${recipientCount} startup${recipientCount > 1 ? "s" : ""}!`,
      );

      // Reset form
      setMessageData({
        subject: "",
        message: "",
      });
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
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20";
      case "normal":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      case "low":
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
    }
  };
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-[11px]">Communication Center</CardTitle>
          <CardDescription className="text-[9px]">
            Send announcements and messages to your cohort
          </CardDescription>
        </CardHeader>
      </Card>
      <Tabs defaultValue="announcements" className="w-full">
        <TabsList className="h-7 w-full grid grid-cols-2">
          <TabsTrigger value="announcements" className="text-[9px] h-6">
            <Bell className="w-3 h-3 mr-1" />
            Announcements
          </TabsTrigger>
          <TabsTrigger value="messages" className="text-[9px] h-6">
            <MessageSquare className="w-3 h-3 mr-1" />
            Messages
          </TabsTrigger>
        </TabsList>
        <TabsContent value="announcements" className="mt-3 space-y-3">
          {isAdmin && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[10px]">
                    Create Announcement
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() =>
                      setShowAnnouncementForm(!showAnnouncementForm)
                    }
                    className="h-6 text-[9px]"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {showAnnouncementForm ? "Cancel" : "New"}
                  </Button>
                </div>
              </CardHeader>
              {showAnnouncementForm && (
                <CardContent className="border-t pt-3">
                  <form
                    onSubmit={handleCreateAnnouncement}
                    className="space-y-3"
                  >
                    <div>
                      <label className="text-[9px] text-muted-foreground">
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
                        className="h-7 text-[10px]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-muted-foreground">
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
                        className="text-[10px] min-h-[80px]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-muted-foreground">
                        Priority
                      </label>
                      <select
                        value={announcementData.priority}
                        onChange={(e) =>
                          setAnnouncementData({
                            ...announcementData,
                            priority: e.target.value,
                          })
                        }
                        className="w-full h-7 text-[10px] rounded-md border border-input bg-background px-2"
                      >
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    <Button type="submit" size="sm" className="h-6 text-[9px]">
                      <Bell className="w-3 h-3 mr-1" />
                      Post Announcement
                    </Button>
                  </form>
                </CardContent>
              )}
            </Card>
          )}
          {loading ? (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="animate-pulse text-[10px]">Loading...</div>
              </CardContent>
            </Card>
          ) : announcements.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground">
                  No announcements yet
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {announcements.map((announcement) => (
                <Card key={announcement.id}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-[10px] font-medium">
                            {announcement.title}
                          </h3>
                          <Badge
                            variant="outline"
                            className={`text-[7px] ${getPriorityColor(announcement.priority)}`}
                          >
                            {announcement.priority === "urgent" && (
                              <AlertCircle className="w-2.5 h-2.5 mr-0.5" />
                            )}
                            {announcement.priority}
                          </Badge>
                        </div>
                        <p className="text-[9px] text-muted-foreground whitespace-pre-wrap">
                          {announcement.content}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[8px] text-muted-foreground">
                      <span>
                        {"By "}
                        {announcement.createdByName}
                        {" • "}
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </span>
                      <span>
                        {announcement.readBy.length}
                        {" read"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="messages" className="mt-3 space-y-3">
          {isAdmin && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[10px]">Compose Message</CardTitle>
                  <Button
                    size="sm"
                    onClick={() => setShowMessageForm(!showMessageForm)}
                    className="h-6 text-[9px]"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {showMessageForm ? "Cancel" : "New Message"}
                  </Button>
                </div>
              </CardHeader>
              {showMessageForm && (
                <CardContent className="border-t pt-3">
                  <form onSubmit={handleSendMessage} className="space-y-3">
                    <div>
                      <label className="text-[9px] text-muted-foreground mb-2 block">
                        Message Type
                      </label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={
                            messageMode === "individual" ? "default" : "outline"
                          }
                          onClick={() => {
                            setMessageMode("individual");
                            setSelectedRecipients([]);
                          }}
                          className="h-7 text-[9px] flex-1"
                        >
                          <User className="w-3 h-3 mr-1" />
                          1-on-1
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={
                            messageMode === "bulk" ? "default" : "outline"
                          }
                          onClick={() => {
                            setMessageMode("bulk");
                            setSelectedRecipient("");
                          }}
                          className="h-7 text-[9px] flex-1"
                        >
                          <Users className="w-3 h-3 mr-1" />
                          Bulk
                        </Button>
                      </div>
                    </div>
                    {messageMode === "individual" ? (
                      <div>
                        <label className="text-[9px] text-muted-foreground">
                          Select Startup
                        </label>
                        <select
                          value={selectedRecipient}
                          onChange={(e) => setSelectedRecipient(e.target.value)}
                          required={true}
                          className="w-full h-7 text-[10px] rounded-md border border-input bg-background px-2"
                        >
                          <option value="">Choose a startup...</option>
                          {cohortMembers.length === 0 ? (
                            <option disabled={true}>
                              No startups in cohort
                            </option>
                          ) : (
                            cohortMembers.map((member) => (
                              <option
                                key={member.founderId}
                                value={member.founderId}
                              >
                                {member.startupName || member.founderName}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[9px] text-muted-foreground">
                            Select Startups
                          </label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={toggleAllRecipients}
                            className="h-5 text-[8px]"
                          >
                            {selectedRecipients.length === cohortMembers.length
                              ? "Deselect All"
                              : "Select All"}
                          </Button>
                        </div>
                        <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-1">
                          {cohortMembers.length === 0 ? (
                            <p className="text-[9px] text-muted-foreground text-center py-2">
                              No startups in cohort
                            </p>
                          ) : (
                            cohortMembers.map((member) => (
                              <label
                                key={member.founderId}
                                className="flex items-center gap-2 text-[9px] hover:bg-accent/50 p-1 rounded cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedRecipients.includes(
                                    member.founderId,
                                  )}
                                  onChange={() =>
                                    toggleRecipient(member.founderId)
                                  }
                                  className="w-3 h-3"
                                />
                                <span>
                                  {member.startupName || member.founderName}
                                </span>
                              </label>
                            ))
                          )}
                        </div>
                        <p className="text-[8px] text-muted-foreground mt-1">
                          {selectedRecipients.length}
                          {" selected"}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-[9px] text-muted-foreground">
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
                        className="h-7 text-[10px]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-muted-foreground">
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
                        className="text-[10px] min-h-[100px]"
                      />
                    </div>
                    <Button
                      type="submit"
                      size="sm"
                      className="h-6 text-[9px]"
                      disabled={
                        messageMode === "individual"
                          ? !selectedRecipient
                          : selectedRecipients.length === 0
                      }
                    >
                      <Send className="w-3 h-3 mr-1" />
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              )}
            </Card>
          )}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-[10px]">Message Inbox</CardTitle>
              <CardDescription className="text-[8px]">
                {messages.length}
                {" message"}
                {messages.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-[10px] text-muted-foreground">
                    No messages yet
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((message) => {
                    const isReceived =
                      message.type === "received" || message.fromFounder;
                    const isSent = message.type === "sent";
                    return (
                      <div
                        key={message.id}
                        className={`p-3 rounded-lg border ${isReceived ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800" : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5">
                            {isReceived ? (
                              <>
                                <Mail className="w-3 h-3 text-blue-600" />
                                <span className="text-[9px] font-medium">
                                  {"From: "}
                                  {message.startupName || message.founderName}
                                </span>
                              </>
                            ) : (
                              <>
                                <MailOpen className="w-3 h-3 text-gray-600" />
                                <span className="text-[9px] font-medium">
                                  {"To: "}
                                  {cohortMembers.find(
                                    (m) => m.founderId === message.recipientId,
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
                          <Badge variant="outline" className="text-[7px]">
                            {isReceived ? "Received" : "Sent"}
                          </Badge>
                        </div>
                        <h4 className="text-[10px] font-medium mb-1">
                          {message.subject}
                        </h4>
                        <p className="text-[9px] text-muted-foreground whitespace-pre-wrap mb-2">
                          {message.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] text-muted-foreground">
                            {new Date(message.sentAt).toLocaleString()}
                          </span>
                          {isReceived && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 text-[8px]"
                              onClick={() => {
                                setMessageMode("individual");
                                setSelectedRecipient(message.founderId || "");
                                setMessageData({
                                  subject: `Re: ${message.subject}`,
                                  message: "",
                                });
                                setShowMessageForm(true);
                              }}
                            >
                              <Reply className="w-3 h-3 mr-1" />
                              Reply
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
