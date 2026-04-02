import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { ScrollArea } from "../ui/scroll-area";
import {
  MessageSquare,
  Send,
  Users,
  ArrowLeft,
  CheckCheck,
} from "lucide-react";
import {
  sendMessage,
  getConversation,
  getUserConversations,
  markMessagesAsRead,
  formatMessageTime,
} from "../../utils/messaging";
export function TeamMessaging({ currentUser, teamMembers }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const messagesEndRef = useRef(null);

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, [currentUser.id, currentUser.startupId, teamMembers, refreshKey]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
      markMessagesAsRead(
        currentUser.id,
        selectedConversation,
        currentUser.startupId,
      );
    }
  }, [selectedConversation, refreshKey]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // ✅ REALTIME: Removed refresh polling (was every 3s) - messages now update via real-time subscription

  const loadConversations = () => {
    const convs = getUserConversations(
      currentUser.id,
      currentUser.startupId,
      teamMembers,
    );
    setConversations(convs);
  };
  const loadMessages = (otherUserId) => {
    const msgs = getConversation(
      currentUser.id,
      otherUserId,
      currentUser.startupId,
    );
    setMessages(msgs);
  };
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    const isTeamMessage = selectedConversation.startsWith("team-");
    const recipient = conversations.find(
      (c) => c.userId === selectedConversation,
    );
    sendMessage(
      currentUser.id,
      currentUser.name,
      currentUser.role,
      selectedConversation,
      recipient?.userName || "Team",
      newMessage,
      currentUser.startupId,
      isTeamMessage,
    );
    setNewMessage("");
    setRefreshKey((prev) => prev + 1);
  };
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  const selectedConv = conversations.find(
    (c) => c.userId === selectedConversation,
  );
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
      <Card
        className={`lg:col-span-1 ${selectedConversation ? "hidden lg:block" : ""}`}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Messages
          </CardTitle>
          <CardDescription>Chat with your team members</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[480px]">
            {teamMembers.length > 0 && (
              <div
                className={`flex items-start gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors border-b ${selectedConversation === `team-${currentUser.startupId}` ? "bg-primary/5" : ""}`}
                onClick={() =>
                  setSelectedConversation(`team-${currentUser.startupId}`)
                }
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">Team Chat</p>
                    {conversations.find((c) => c.isTeamChat)?.unreadCount ? (
                      <Badge
                        variant="default"
                        className="h-5 min-w-5 rounded-full px-1.5 text-xs"
                      >
                        {conversations.find((c) => c.isTeamChat)?.unreadCount}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {conversations.find((c) => c.isTeamChat)?.lastMessage ||
                      "Start team conversation"}
                  </p>
                  {conversations.find((c) => c.isTeamChat)?.lastMessageTime && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatMessageTime(
                        conversations.find((c) => c.isTeamChat).lastMessageTime,
                      )}
                    </p>
                  )}
                </div>
              </div>
            )}
            {conversations
              .filter((c) => !c.isTeamChat)
              .map((conversation) => (
                <div
                  key={conversation.userId}
                  className={`flex items-start gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors border-b ${selectedConversation === conversation.userId ? "bg-primary/5" : ""}`}
                  onClick={() => setSelectedConversation(conversation.userId)}
                >
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {conversation.userName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {conversation.userName}
                        </p>
                        {conversation.userRole && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {conversation.userRole}
                          </Badge>
                        )}
                      </div>
                      {conversation.unreadCount > 0 && (
                        <Badge
                          variant="default"
                          className="h-5 min-w-5 rounded-full px-1.5 text-xs"
                        >
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {conversation.lastMessage || "No messages yet"}
                    </p>
                    {conversation.lastMessageTime > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatMessageTime(conversation.lastMessageTime)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            {conversations.length === 0 && (
              <div className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No conversations yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Start chatting with your team members
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
      <Card
        className={`lg:col-span-2 ${!selectedConversation ? "hidden lg:block" : ""}`}
      >
        {selectedConversation ? (
          <>
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setSelectedConversation(null)}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                {selectedConv?.isTeamChat ? (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                ) : (
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {selectedConv?.userName
                        .split(" ")
                        .map((n) => n[0])
                        .join("") || "?"}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <CardTitle className="text-base">
                    {selectedConv?.userName || "Unknown"}
                  </CardTitle>
                  {selectedConv?.userRole && !selectedConv.isTeamChat && (
                    <CardDescription className="text-xs">
                      {selectedConv.userRole}
                    </CardDescription>
                  )}
                  {selectedConv?.isTeamChat && (
                    <CardDescription className="text-xs">
                      {teamMembers.length + 1}
                      {" members"}
                    </CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex flex-col h-[calc(600px-140px)]">
              <ScrollArea className="flex-1 p-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <MessageSquare className="w-16 h-16 text-muted-foreground opacity-50 mb-4" />
                    <p className="text-sm text-muted-foreground">
                      No messages yet
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Start the conversation!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message, index) => {
                      const isOwnMessage = message.senderId === currentUser.id;
                      const showDate =
                        index === 0 ||
                        new Date(message.timestamp).toDateString() !==
                          new Date(
                            messages[index - 1].timestamp,
                          ).toDateString();
                      return (
                        <div key={message.id}>
                          {showDate && (
                            <div className="flex items-center justify-center my-4">
                              <div className="bg-muted px-3 py-1 rounded-full">
                                <p className="text-[10px] text-muted-foreground">
                                  {new Date(
                                    message.timestamp,
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </p>
                              </div>
                            </div>
                          )}
                          <div
                            className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}
                          >
                            {!isOwnMessage && (
                              <Avatar className="w-8 h-8 flex-shrink-0">
                                <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                                  {message.senderName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div
                              className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"} max-w-[70%]`}
                            >
                              {!isOwnMessage && (
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-xs font-medium">
                                    {message.senderName}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] px-1.5 py-0"
                                  >
                                    {message.senderRole}
                                  </Badge>
                                </div>
                              )}
                              <div
                                className={`px-3 py-2 rounded-lg ${isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {message.content}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                <p className="text-[10px] text-muted-foreground">
                                  {new Date(
                                    message.timestamp,
                                  ).toLocaleTimeString("en-US", {
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                </p>
                                {isOwnMessage && (
                                  <CheckCheck className="w-3 h-3 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    size="sm"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <MessageSquare className="w-20 h-20 text-muted-foreground opacity-30 mb-4" />
            <p className="text-muted-foreground">
              Select a conversation to start messaging
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
