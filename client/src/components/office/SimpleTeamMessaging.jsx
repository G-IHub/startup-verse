import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
// 🔥 REALTIME: Import real-time messaging hook

import { broadcastMessageUpdate } from "../../utils/supabaseRealtimeSubscriptions";
import {
  X,
  Send,
  Search,
  ArrowLeft,
  MessageSquare,
  Paperclip,
  Smile,
  Image as ImageIcon,
  FileText,
  Download,
} from "lucide-react";
import {
  sendMessage as sendMessageUtil,
  getConversation,
  getUserConversations,
  markMessagesAsRead,
  formatMessageTime,
  uploadMessageFile,
  formatFileSize,
} from "../../utils/messaging";
export function SimpleTeamMessaging({
  onClose,
  onStartCall,
  currentUserId,
  currentUserName,
  currentUserRole,
  startupId,
  teamMembers = [],
  onActivity,
  initialSelectedUserId = null,
}) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const commonEmojis = [
    "😊",
    "😂",
    "❤️",
    "👍",
    "🎉",
    "🔥",
    "✨",
    "💯",
    "🙌",
    "👏",
    "😍",
    "🤔",
    "😎",
    "💪",
    "🚀",
    "⭐",
  ];

  // Set initial selected conversation if provided
  useEffect(() => {
    if (initialSelectedUserId) {
      setSelectedConversation(initialSelectedUserId);
    }
  }, [initialSelectedUserId]);

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, [currentUserId, startupId, teamMembers]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
      markMessagesAsRead(currentUserId, selectedConversation, startupId).then(
        () => {
          // Reload conversations after marking as read to update unread counts
          loadConversations();
        },
      );
    }
  }, [selectedConversation]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // 🔥 REALTIME: Removed message polling (was every 2s) - messages now update via real-time subscription
  // Real-time updates are handled by the messaging system automatically

  const loadConversations = async () => {
    console.log(
      "📋 Loading conversations for user:",
      currentUserId,
      "in startup:",
      startupId,
    );
    console.log("📋 Team members:", teamMembers);
    const convs = await getUserConversations(
      currentUserId,
      startupId,
      teamMembers,
    );
    console.log("📋 Loaded conversations:", convs);
    setConversations(convs);
  };
  const loadMessages = async (otherUserId) => {
    console.log("📥 Loading messages for conversation:", {
      currentUserId,
      otherUserId,
      startupId,
    });
    const msgs = await getConversation(currentUserId, otherUserId, startupId);
    console.log("📥 Loaded messages:", msgs.length, msgs);
    setMessages(msgs);
  };
  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;
    const recipient = conversations.find(
      (c) => c.userId === selectedConversation,
    );
    const inputValue = messageInput;
    setMessageInput("");
    console.log("📤 Sending message:", {
      from: currentUserName,
      to: recipient?.userName,
      content: inputValue,
      startupId,
    });
    const result = await sendMessageUtil(
      currentUserId,
      currentUserName,
      currentUserRole,
      selectedConversation,
      recipient?.userName || "Team",
      inputValue,
      startupId,
      false,
    );
    console.log("📤 Message send result:", result);
    onActivity?.(
      "message-send",
      `sent a message to ${recipient?.userName}`,
      <MessageSquare className="w-3.5 h-3.5" />,
    );

    // 🔥 REALTIME: Broadcast message to all users
    await broadcastMessageUpdate(startupId, "new_message", {
      conversationId: selectedConversation,
      senderId: currentUserId,
      recipientId: selectedConversation,
      message: result,
    });
    await loadMessages(selectedConversation);
    await loadConversations();
  };
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  const selectedConv = conversations.find(
    (c) => c.userId === selectedConversation,
  );

  // Filter conversations and sort by most recent message
  const filteredConversations = teamMembers
    .map((member) => ({
      member,
      conversation: conversations.find((c) => c.userId === member.id),
    }))
    .filter(({ member }) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      // Sort by most recent message time (newest first)
      const timeA = a.conversation?.lastMessageTime || 0;
      const timeB = b.conversation?.lastMessageTime || 0;
      return timeB - timeA;
    });
  const getOnlineStatus = (userId) => {
    const member = teamMembers.find((m) => m.id === userId);
    return member?.online ?? false;
  };
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation) return;
    try {
      console.log("📎 Uploading file:", file.name);

      // Upload file to storage
      const uploadResult = await uploadMessageFile(
        file,
        startupId,
        currentUserId,
      );
      if (!uploadResult) {
        console.error("Failed to upload file");
        return;
      }
      console.log("✅ File uploaded successfully:", uploadResult.url);

      // Send message with file attachment
      const recipient = conversations.find(
        (c) => c.userId === selectedConversation,
      );
      await sendMessageUtil(
        currentUserId,
        currentUserName,
        currentUserRole,
        selectedConversation,
        recipient?.userName || "Team",
        `Shared file: ${file.name}`,
        startupId,
        false,
        uploadResult.url,
        uploadResult.fileName,
        uploadResult.fileSize,
        uploadResult.fileType,
      );
      onActivity?.(
        "file-share",
        `shared ${file.name}`,
        <Paperclip className="w-3.5 h-3.5" />,
      );
      await loadMessages(selectedConversation);
      await loadConversations();
    } catch (error) {
      console.error("Error handling file upload:", error);
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
  const handleEmojiSelect = (emoji) => {
    setMessageInput((prev) => prev + emoji);
    setShowEmojiPicker(false);
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
      className="fixed top-0 right-0 h-full z-[70] w-full md:w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-lg flex flex-col"
    >
      <AnimatePresence mode="wait">
        {!selectedConversation ? (
          <motion.div
            key="list"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="flex flex-col h-full"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Team Messages
              </h3>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {searchQuery
                      ? "No conversations found"
                      : "No team members yet"}
                  </p>
                </div>
              ) : (
                filteredConversations.map(({ member, conversation }) => (
                  <motion.div
                    key={member.id}
                    onClick={() => setSelectedConversation(member.id)}
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="text-xs font-medium bg-blue-600 text-black">
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {member.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p
                          className={`text-xs truncate ${conversation && conversation.unreadCount > 0 ? "font-bold text-gray-900 dark:text-white" : "font-medium text-gray-900 dark:text-white"}`}
                        >
                          {member.name}
                        </p>
                        {conversation && conversation.lastMessageTime > 0 && (
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                            {formatMessageTime(conversation.lastMessageTime)}
                          </p>
                        )}
                      </div>
                      {conversation && conversation.lastMessage ? (
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-[11px] truncate flex-1 ${conversation.unreadCount > 0 ? "font-semibold text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}
                          >
                            {conversation.lastMessage}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="flex-shrink-0 bg-blue-600 text-white text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-gray-500 dark:text-gray-500">
                          {typeof member.role === "string"
                            ? member.role
                            : "Team Member"}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </ScrollArea>
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="flex flex-col h-full"
          >
            <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 flex-shrink-0"
                  onClick={() => setSelectedConversation(null)}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="relative flex-shrink-0">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-[10px] font-medium bg-blue-600 text-black">
                      {selectedConv?.userName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  {getOnlineStatus(selectedConversation) && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                    {selectedConv?.userName ||
                      teamMembers.find((m) => m.id === selectedConversation)
                        ?.name ||
                      "Unknown"}
                  </h3>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    {getOnlineStatus(selectedConversation)
                      ? "Online"
                      : "Offline"}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full p-4 bg-gray-50 dark:bg-gray-950">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      No messages yet
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                      Start the conversation!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message, index) => {
                      const isMe = message.senderId === currentUserId;
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
                              <div className="bg-gray-200 dark:bg-gray-800 px-3 py-1 rounded-full">
                                <p className="text-[10px] text-gray-600 dark:text-gray-400">
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
                          <motion.div
                            initial={{
                              opacity: 0,
                              y: 10,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                            }}
                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`flex items-end gap-2 max-w-[75%] ${isMe ? "flex-row-reverse" : "flex-row"}`}
                            >
                              {!isMe && (
                                <Avatar className="w-6 h-6 flex-shrink-0">
                                  <AvatarFallback className="text-[9px] font-medium bg-blue-600 text-white">
                                    {message.senderName
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .substring(0, 2)
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div>
                                {message.fileUrl ? (
                                  <a
                                    href={message.fileUrl}
                                    download={message.fileName}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`block rounded-xl px-3 py-2 border hover:shadow-md transition-shadow ${isMe ? "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800" : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="flex-shrink-0 p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                        {message.fileType?.startsWith(
                                          "image/",
                                        ) ? (
                                          <ImageIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        ) : (
                                          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-medium text-gray-900 dark:text-white truncate">
                                          {message.fileName}
                                        </p>
                                        {message.fileSize && (
                                          <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                            {formatFileSize(message.fileSize)}
                                          </p>
                                        )}
                                      </div>
                                      <Download className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    </div>
                                    {message.content && (
                                      <p className="text-[10px] text-gray-600 dark:text-gray-400 mt-2">
                                        {message.content}
                                      </p>
                                    )}
                                  </a>
                                ) : (
                                  <div
                                    className={`rounded-2xl px-3 py-2 ${isMe ? "bg-blue-100 dark:bg-blue-900/20 text-gray-900 dark:text-white border border-blue-200 dark:border-blue-800" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"}`}
                                  >
                                    <p className="text-[11px] leading-relaxed break-words">
                                      {message.content}
                                    </p>
                                  </div>
                                )}
                                <p
                                  className={`text-[9px] text-gray-500 dark:text-gray-400 mt-1 ${isMe ? "text-right" : "text-left"}`}
                                >
                                  {formatMessageTime(message.timestamp)}
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
            </div>
            <div className="flex-shrink-0 p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 10,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      y: 10,
                    }}
                    className="mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="grid grid-cols-8 gap-1">
                      {commonEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleEmojiSelect(emoji)}
                          className="text-xl hover:bg-gray-200 dark:hover:bg-gray-700 rounded p-1 transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 w-9 p-0 flex-shrink-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 w-9 p-0 flex-shrink-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile className="w-4 h-4" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 h-9 text-xs border-gray-200 dark:border-gray-700"
                />
                <Button
                  size="sm"
                  onClick={sendMessage}
                  disabled={!messageInput.trim()}
                  className="h-9 w-9 p-0 flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
