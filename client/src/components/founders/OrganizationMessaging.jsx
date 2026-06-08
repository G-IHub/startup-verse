/**
 * ORGANIZATION MESSAGING - For founders to communicate with their organizations
 */
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/apiBase.js";
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
import { Plus, MessageSquare, Send, Mail, MailOpen } from "lucide-react";

// Default fetch options for cookie-based auth

const defaultOptions = {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
};

export default function OrganizationMessaging({
  founderId,
  founderName,
  startupName,
  cohorts = [],
}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState("");
  const [messageData, setMessageData] = useState({
    subject: "",
    message: "",
  });
  useEffect(() => {
    loadMessages();
  }, [founderId]);
  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/messages/${founderId}`,
        {
          ...defaultOptions,
        },
      );
      if (!response.ok) throw new Error("Failed to fetch messages");
      const data = await response.json();
      setMessages(data.messages || []);
      console.log("📨 Loaded founder messages:", data.messages?.length || 0);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedCohort) {
      alert("Please select which organization to message");
      return;
    }
    const cohort = cohorts.find((c) => c.id === selectedCohort);
    if (!cohort) {
      alert("Cohort not found");
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}/messages/send-from-founder`,
        {
          ...defaultOptions,
          method: "POST",
          body: JSON.stringify({
            cohortId: cohort.id,
            organizationId: cohort.organizationId,
            founderId,
            founderName,
            startupName,
            subject: messageData.subject,
            message: messageData.message,
          }),
        },
      );
      if (!response.ok) throw new Error("Failed to send message");
      alert("Message sent to organization!");

      // Reset form
      setMessageData({
        subject: "",
        message: "",
      });
      setSelectedCohort("");
      setShowMessageForm(false);
      loadMessages();
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    }
  };
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-[11px]">Organization Messages</CardTitle>
          <CardDescription className="text-[9px]">
            Communicate with your accelerators and programs
          </CardDescription>
        </CardHeader>
      </Card>
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
                <label className="text-[9px] text-muted-foreground">
                  Select Organization
                </label>
                <select
                  value={selectedCohort}
                  onChange={(e) => setSelectedCohort(e.target.value)}
                  required={true}
                  className="w-full h-7 text-[10px] rounded-md border border-input bg-background px-2"
                >
                  <option value="">Choose an organization...</option>
                  {cohorts.length === 0 ? (
                    <option disabled={true}>
                      Not part of any organizations
                    </option>
                  ) : (
                    cohorts.map((cohort) => (
                      <option key={cohort.id} value={cohort.id}>
                        {cohort.organizationName || cohort.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
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
                disabled={!selectedCohort}
              >
                <Send className="w-3 h-3 mr-1" />
                Send to Organization
              </Button>
            </form>
          </CardContent>
        )}
      </Card>
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
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-pulse text-[10px]">Loading...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-[10px] text-muted-foreground">
                No messages yet
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((message) => {
                const isSent = message.type === "sent";
                const isReceived = message.type === "received" || !message.type;
                return (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg border ${isSent ? "bg-gray-50 border-gray-200" : "bg-blue-50/50 border-blue-200"}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        {isSent ? (
                          <>
                            <MailOpen className="w-3 h-3 text-gray-600" />
                            <span className="text-[9px] font-medium">
                              To: Organization
                            </span>
                          </>
                        ) : (
                          <>
                            <Mail className="w-3 h-3 text-blue-600" />
                            <span className="text-[9px] font-medium">
                              {"From: "}
                              {message.sentByName || "Organization"}
                            </span>
                          </>
                        )}
                      </div>
                      <Badge variant="outline" className="text-[7px]">
                        {isSent ? "Sent" : "Received"}
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
                      {!isSent && !message.read && (
                        <Badge className="text-[7px] h-4">New</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
