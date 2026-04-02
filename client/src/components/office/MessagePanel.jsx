import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
// 🔥 REALTIME: Import real-time messaging hook
import { broadcastMessageUpdate } from "../../utils/supabaseRealtimeSubscriptions";
import {
  X,
  Send,
  Search,
  Smile,
  Paperclip,
  Phone,
  Video,
  ArrowLeft,
  Image as ImageIcon,
  MessageSquare,
} from "lucide-react";
import {
  sendMessage as sendMessageUtil,
  getConversation,
  getUserConversations,
  markMessagesAsRead,
  formatMessageTime,
} from "../../utils/messaging";
export function MessagePanel({
  onClose,
  onStartCall,
  currentUserId,
  currentUserName,
  currentUserRole,
  startupId,
  teamMembers = [],
  onActivity,
}) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const messagesEndRef = useRef(null);

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, [currentUserId, startupId, teamMembers, refreshKey]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
      markMessagesAsRead(currentUserId, selectedConversation, startupId);
    }
  }, [selectedConversation]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // ✅ REALTIME: Removed message polling (was every 3s) - messages now update via real-time subscription

  const loadConversations = async () => {
    const convs = await getUserConversations(
      currentUserId,
      startupId,
      teamMembers,
    );
    setConversations(convs);
  };
  const loadMessages = async (otherUserId) => {
    const msgs = await getConversation(currentUserId, otherUserId, startupId);
    setMessages(msgs);
  };
  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;
    const isTeamMessage = selectedConversation.startsWith("team-");
    const recipient = conversations.find(
      (c) => c.userId === selectedConversation,
    );
    const inputValue = messageInput;
    setMessageInput(""); // Clear input immediately for better UX

    const result = await sendMessageUtil(
      currentUserId,
      currentUserName,
      currentUserRole,
      selectedConversation,
      recipient?.userName || "Team",
      inputValue,
      startupId,
      isTeamMessage,
    );

    // Track activity
    const recipientName = recipient?.userName || "Team";
    onActivity?.(
      "message-send",
      `sent a message to ${recipientName}`,
      <MessageSquare className="w-3.5 h-3.5" />,
    );

    // 🔥 REALTIME: Broadcast message to all users
    await broadcastMessageUpdate(startupId, "new_message", {
      conversationId: selectedConversation,
      senderId: currentUserId,
      recipientId: selectedConversation,
      message: result,
    });

    // Reload messages and conversations
    await loadMessages(selectedConversation);
    await loadConversations();
  };
  const selectedConv = conversations.find(
    (c) => c.userId === selectedConversation,
  );
  const filteredConversations = conversations.filter((conv) =>
    conv.userName.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const getStatusColor = (online) => {
    return online ? "bg-green-500" : "bg-gray-400";
  };
  const handleBackToList = () => {
    setSelectedConversation(null);
    setSearchQuery("");
  };
  return (
    <motion.div
      initial={{
        x: "100%",
      }}
      animate={{
        x: 0,
      }}
      exit={{
        x: "100%",
      }}
      transition={{
        type: "spring",
        damping: 25,
        stiffness: 200,
      }}
      className="fixed top-0 right-0 h-full z-[70] w-full md:w-96 bg-white dark:bg-gray-900 border-l-2 border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col"
    >
      <AnimatePresence mode="wait">
        {!selectedConversation ? (
          <motion.div
            key="list"
            initial={{
              opacity: 0,
              x: -20,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
              x: -20,
            }}
            className="flex flex-col h-full"
          >
            <div className="p-3 border-b-2 border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold">Team Messages</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={onClose}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-[11px]"
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {filteredConversations.length === 0 ? (
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
                ) : (
                  filteredConversations.map((conv) => (
                    <motion.div
                      key={conv.userId}
                      whileHover={{
                        scale: 1.01,
                      }}
                      whileTap={{
                        scale: 0.99,
                      }}
                      onClick={() => setSelectedConversation(conv.userId)}
                      className="p-2.5 rounded-lg cursor-pointer mb-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="relative">
                          <Avatar className="w-9 h-9">
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                              {conv.userName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-900 ${getStatusColor(true)}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="text-[11px] font-medium truncate">
                              {conv.userName}
                            </p>
                            <p className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
                              {conv.lastMessageTime > 0
                                ? formatMessageTime(conv.lastMessageTime)
                                : ""}
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] text-muted-foreground truncate">
                              {conv.lastMessage || "No messages yet"}
                            </p>
                            {conv.unreadCount > 0 && (
                              <Badge className="ml-2 h-3.5 px-1.5 text-[9px] bg-blue-600">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{
              opacity: 0,
              x: 20,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
              x: 20,
            }}
            className="flex flex-col h-full"
          >
            <div className="p-3 border-b-2 border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 flex-shrink-0"
                    onClick={handleBackToList}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </Button>
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {selectedConv?.userName
                          .split(" ")
                          .map((n) => n[0])
                          .join("") || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-900 ${getStatusColor(true)}`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[12px] font-semibold truncate">
                      {selectedConv?.userName || "Unknown"}
                    </h3>
                    <p className="text-[9px] text-muted-foreground">
                      {selectedConv?.userRole || "Active now"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => onStartCall?.(selectedConversation, "audio")}
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => onStartCall?.(selectedConversation, "video")}
                  >
                    <Video className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={onClose}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
            <ScrollArea className="flex-1 p-3">
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
                <div className="space-y-3">
                  {messages.map((message, index) => {
                    const isMe = message.senderId === currentUserId;
                    const showDate =
                      index === 0 ||
                      new Date(message.timestamp).toDateString() !==
                        new Date(messages[index - 1].timestamp).toDateString();
                    return (
                      <div key={message.id}>
                        {showDate && (
                          <div className="flex items-center justify-center my-4">
                            <div className="bg-muted px-3 py-1 rounded-full">
                              <p className="text-[9px] text-muted-foreground">
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
                        <motion.div
                          initial={{
                            opacity: 0,
                            y: 10,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          transition={{
                            delay: index * 0.05,
                          }}
                          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`flex gap-2 max-w-[80%] ${isMe ? "flex-row-reverse" : "flex-row"}`}
                          >
                            {!isMe && (
                              <Avatar className="w-7 h-7 flex-shrink-0">
                                <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                                  {message.senderName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div>
                              <div
                                className={`rounded-2xl px-3 py-2 ${isMe ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100" : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"}`}
                              >
                                <p className="text-[11px]">{message.content}</p>
                              </div>
                              <p className="text-[9px] text-muted-foreground mt-0.5 px-2">
                                {new Date(message.timestamp).toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true,
                                  },
                                )}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
            <div className="p-3 border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
              <div className="flex items-end gap-2">
                <div className="flex gap-0.5">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                    <Paperclip className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                    <ImageIcon className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex-1 relative">
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    className="pr-8 h-8 text-[11px]"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <Smile className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <Button
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full"
                  onClick={sendMessage}
                  disabled={!messageInput.trim()}
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
