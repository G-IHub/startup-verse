import React, { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Send,
  Search,
  Phone,
  Video,
  MoreHorizontal,
  Users,
  Star,
  CheckCheck,
  MessageSquare,
} from "lucide-react";
import {
  sendMessage,
  getConversation,
  getUserConversations,
  markMessagesAsRead,
  formatMessageTime,
} from "../../utils/messaging";
import { getStartupId } from "../../utils/startupId";
import {
  fetchClientPreferences,
  mergeClientPreferencesPatch,
} from "../../utils/api/clientPreferencesApi";

const STARRED_PREF_KEY = "messaging_starred_conversations";
export default function MessagingSystem({
  user,
  teamMembers = [],
  onStartVideoCall,
}) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [starredConversations, setStarredConversations] = useState(new Set());
  const messagesEndRef = useRef(null);

  // Get user's startup ID using centralized utility
  const startupId = getStartupId(user);

  useEffect(() => {
    const uid = user?._id ?? user?.id;
    if (!uid) return;
    let cancelled = false;
    fetchClientPreferences(String(uid))
      .then((prefs) => {
        if (cancelled) return;
        const arr = prefs[STARRED_PREF_KEY];
        if (Array.isArray(arr)) {
          setStarredConversations(new Set(arr.map(String)));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?._id, user?.id]);

  const toggleStar = async (targetUserId) => {
    const newStarred = new Set(starredConversations);
    if (newStarred.has(targetUserId)) {
      newStarred.delete(targetUserId);
    } else {
      newStarred.add(targetUserId);
    }
    setStarredConversations(newStarred);
    const uid = user?._id ?? user?.id;
    if (uid) {
      try {
        await mergeClientPreferencesPatch(String(uid), {
          [STARRED_PREF_KEY]: Array.from(newStarred),
        });
      } catch {
        /* ignore */
      }
    }
  };

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, [user.id, startupId, teamMembers, refreshKey]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
      markMessagesAsRead(user.id, selectedConversation, startupId);
      setRefreshKey((prev) => prev + 1);
    }
  }, [selectedConversation]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // ✅ REALTIME: Removed message polling (was every 3s) - messages now update via real-time subscription

  const loadConversations = () => {
    const convs = getUserConversations(user.id, startupId, teamMembers);
    setConversations(convs);
  };
  const loadMessages = (otherUserId) => {
    const msgs = getConversation(user.id, otherUserId, startupId);
    setMessages(msgs);
  };
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    const isTeamMessage = selectedConversation.startsWith("team-");
    const recipient = conversations.find(
      (c) => c.userId === selectedConversation,
    );
    sendMessage(
      user.id,
      user.name,
      user.role,
      selectedConversation,
      recipient?.userName || "Team",
      newMessage,
      startupId,
      isTeamMessage,
    );
    setNewMessage("");
    loadMessages(selectedConversation);
    loadConversations();
  };
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  const handleVideoCall = () => {
    if (
      onStartVideoCall &&
      selectedConversation &&
      !selectedConversation.startsWith("team-")
    ) {
      onStartVideoCall(selectedConversation);
    }
  };
  const selectedConv = conversations.find(
    (c) => c.userId === selectedConversation,
  );

  // Filter conversations based on search
  const filteredConversations = conversations.filter((conv) =>
    conv.userName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Filter for tabs
  const unreadConversations = filteredConversations.filter(
    (c) => c.unreadCount > 0,
  );
  const starredConvs = filteredConversations.filter((c) =>
    starredConversations.has(c.userId),
  );
  return (
    <div className="h-full flex flex-col lg:flex-row bg-background">
      <div
        className={`w-full lg:w-80 border-r border-border flex flex-col ${selectedConversation ? "hidden lg:flex" : "flex"}`}
      >
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Messages</h2>
          </div>
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>
        <Tabs defaultValue="all" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mx-3 mt-2">
            <TabsTrigger value="all" className="text-xs">
              {"All "}
              {filteredConversations.length > 0 &&
                `(${filteredConversations.length})`}
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">
              {"Unread "}
              {unreadConversations.length > 0 &&
                `(${unreadConversations.length})`}
            </TabsTrigger>
            <TabsTrigger value="starred" className="text-xs">
              {"Starred "}
              {starredConvs.length > 0 && `(${starredConvs.length})`}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="flex-1 mt-2">
            <ScrollArea className="h-full">
              <div className="space-y-1 px-2">
                {filteredConversations.length === 0 && (
                  <div className="p-8 text-center">
                    <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      {searchQuery
                        ? "No conversations found"
                        : "No conversations yet"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {searchQuery
                        ? "Try a different search"
                        : "Start chatting with your team"}
                    </p>
                  </div>
                )}
                {filteredConversations.map((conversation) => {
                  const isSelected =
                    selectedConversation === conversation.userId;
                  const isStarred = starredConversations.has(
                    conversation.userId,
                  );
                  return (
                    <div
                      key={conversation.userId}
                      onClick={() =>
                        setSelectedConversation(conversation.userId)
                      }
                      className={`p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? "bg-accent" : "hover:bg-muted/50"}`}
                    >
                      <div className="flex items-start space-x-2">
                        {conversation.isTeamChat ? (
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <Users className="w-4 h-4 text-primary" />
                          </div>
                        ) : (
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {conversation.userName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1 flex-1 min-w-0">
                              <h4 className="text-sm font-medium truncate">
                                {conversation.userName}
                              </h4>
                              {isStarred && (
                                <Star className="w-3 h-3 text-yellow-500 fill-current flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {conversation.lastMessageTime > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  {formatMessageTime(
                                    conversation.lastMessageTime,
                                  )}
                                </span>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 hover:bg-transparent"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleStar(conversation.userId);
                                }}
                              >
                                <Star
                                  className={`w-3 h-3 ${isStarred ? "text-yellow-500 fill-current" : "text-muted-foreground"}`}
                                />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <p className="text-xs text-muted-foreground truncate flex-1">
                              {conversation.lastMessage || "No messages yet"}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <Badge className="text-xs ml-2 h-5 min-w-5 rounded-full px-1.5">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="unread" className="flex-1 mt-2">
            <ScrollArea className="h-full">
              <div className="space-y-1 px-2">
                {unreadConversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <CheckCheck className="w-12 h-12 text-green-500 mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      All caught up!
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      No unread messages
                    </p>
                  </div>
                ) : (
                  unreadConversations.map((conversation) => {
                    const isSelected =
                      selectedConversation === conversation.userId;
                    return (
                      <div
                        key={conversation.userId}
                        onClick={() =>
                          setSelectedConversation(conversation.userId)
                        }
                        className={`p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? "bg-accent" : "hover:bg-muted/50"}`}
                      >
                        <div className="flex items-start space-x-2">
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {conversation.userName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium truncate">
                                {conversation.userName}
                              </h4>
                              <Badge className="text-xs h-5 min-w-5 rounded-full px-1.5">
                                {conversation.unreadCount}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {conversation.lastMessage}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="starred" className="flex-1 mt-2">
            <ScrollArea className="h-full">
              <div className="space-y-1 px-2">
                {starredConvs.length === 0 ? (
                  <div className="p-8 text-center">
                    <Star className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      No starred conversations
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Star important chats to find them easily
                    </p>
                  </div>
                ) : (
                  starredConvs.map((conversation) => {
                    const isSelected =
                      selectedConversation === conversation.userId;
                    return (
                      <div
                        key={conversation.userId}
                        onClick={() =>
                          setSelectedConversation(conversation.userId)
                        }
                        className={`p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? "bg-accent" : "hover:bg-muted/50"}`}
                      >
                        <div className="flex items-start space-x-2">
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {conversation.userName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <h4 className="text-sm font-medium truncate">
                                  {conversation.userName}
                                </h4>
                                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              </div>
                              {conversation.lastMessageTime > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  {formatMessageTime(
                                    conversation.lastMessageTime,
                                  )}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {conversation.lastMessage || "No messages yet"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
      <div
        className={`flex-1 flex flex-col ${selectedConversation ? "flex" : "hidden lg:flex"}`}
      >
        {selectedConv ? (
          <>
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden flex-shrink-0 h-8 w-8 p-0"
                    onClick={() => setSelectedConversation(null)}
                  >
                    ←
                  </Button>
                  {selectedConv.isTeamChat ? (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                  ) : (
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {selectedConv.userName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold truncate">
                      {selectedConv.userName}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {selectedConv.isTeamChat
                        ? `${teamMembers.length + 1} members`
                        : selectedConv.userRole || "Team Member"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={handleVideoCall}
                  >
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
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
                    const isOwnMessage = message.senderId === user.id;
                    const showDate =
                      index === 0 ||
                      new Date(message.timestamp).toDateString() !==
                        new Date(messages[index - 1].timestamp).toDateString();
                    return (
                      <div key={message.id}>
                        {showDate && (
                          <div className="flex items-center justify-center my-4">
                            <div className="bg-muted px-3 py-1 rounded-full">
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(message.timestamp).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )}
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
                                {new Date(message.timestamp).toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true,
                                  },
                                )}
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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-20 h-20 text-muted-foreground opacity-30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-1">
                Select a conversation
              </h3>
              <p className="text-sm text-muted-foreground">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
