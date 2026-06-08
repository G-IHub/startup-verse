import React, { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "../ui/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Search,
  Phone,
  Video,
  MoreHorizontal,
  Users,
  Star,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import {
  sendMessage,
  getConversation,
  getUserConversations,
  markMessagesAsRead,
  formatMessageTime,
  uploadMessageFile,
  mergeMessageIntoThread,
} from "../../utils/messaging";
import { subscribeToMessages } from "../../utils/realtimeSubscriptions";
import { ChatComposer } from "./ChatComposer";
import { ChatMessageList } from "./ChatMessageList";
import { ChatSelectionToolbar } from "./ChatSelectionToolbar";
import { ForwardMessageModal } from "./ForwardMessageModal";
import { useChatMessageHandlers, useReplyState } from "./useChatMessageHandlers";
import { chatShell } from "./chatStyles";
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
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [starredConversations, setStarredConversations] = useState(new Set());
  const messagesEndRef = useRef(null);
  const [forwardMessages, setForwardMessages] = useState([]);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectionToolbar, setSelectionToolbar] = useState(null);
  const { replyingTo, setReplyingTo, clearReply } = useReplyState();
  const userId = user?.id ?? user?._id;

  // Get user's startup ID using centralized utility
  const startupId = getStartupId(user);

  const nameForMessage = (message) =>
    message.senderName ||
    teamMembers.find((m) => String(m.id) === String(message.senderId))?.name ||
    "?";

  const {
    handleCopy,
    handleSaveMedia,
    handleDeleteForMe,
    bulkDeleteForMe,
    handleDeleteForEveryone,
    handleRealtimeUpdate,
  } = useChatMessageHandlers({
    currentUserId: userId,
    setMessages,
    onReply: (message) => setReplyingTo({ ...message, senderName: nameForMessage(message) }),
    onForward: (message) => {
      setForwardMessages(message ? [message] : []);
      setForwardOpen(true);
    },
  });

  const messageActionProps = {
    onReply: (message) => setReplyingTo({ ...message, senderName: nameForMessage(message) }),
    onCopy: handleCopy,
    onSaveMedia: handleSaveMedia,
    onForward: (message) => {
      setForwardMessages(message ? [message] : []);
      setForwardOpen(true);
    },
    onDeleteForMe: handleDeleteForMe,
    onDeleteForEveryone: handleDeleteForEveryone,
    onSelectionModeChange: setSelectionMode,
    onSelectionToolbarChange: setSelectionToolbar,
    onBulkDeleteForMe: bulkDeleteForMe,
    onBulkForward: (msgs) => {
      setForwardMessages(msgs);
      setForwardOpen(true);
    },
  };

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
    void loadConversations();
  }, [userId, startupId, teamMembers]);

  useEffect(() => {
    if (selectedConversation) {
      void loadMessages(selectedConversation);
      void markMessagesAsRead(userId, selectedConversation, startupId);
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (!selectedConversation) return;
    const unsub = subscribeToMessages(
      startupId,
      (update) => {
        const m = update?.message;
        if (!m && update?.action !== "message_updated") return;

        if (update.action === "message_updated") {
          const touches =
            String(m?.senderId) === String(selectedConversation) ||
            String(m?.recipientId) === String(selectedConversation);
          if (touches) handleRealtimeUpdate(update);
          void loadConversations();
          return;
        }

        const touches =
          String(m.senderId) === String(selectedConversation) ||
          String(m.recipientId) === String(selectedConversation);
        if (!touches) {
          void loadConversations();
          return;
        }
        setMessages((prev) => mergeMessageIntoThread(prev, update, userId));
        void loadConversations();
      },
      { userId, peerUserId: selectedConversation },
    );
    return () => unsub?.();
  }, [startupId, selectedConversation, userId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // ✅ REALTIME: Removed message polling (was every 3s) - messages now update via real-time subscription

  const loadConversations = async () => {
    const convs = await getUserConversations(userId, startupId, teamMembers);
    setConversations(convs);
  };
  const loadMessages = async (otherUserId) => {
    setMessagesLoading(true);
    try {
      const msgs = await getConversation(userId, otherUserId, startupId);
      setMessages(msgs);
    } catch (err) {
      toast.error(err?.message || "Failed to load messages");
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };
  const handleSendMessage = async () => {
    if (!selectedConversation) return;
    const text = newMessage.trim();
    if (!text && !pendingFile) return;

    const isTeamMessage = selectedConversation.startsWith("team-");
    const recipient = conversations.find((c) => c.userId === selectedConversation);
    let attachmentPayload = null;

    if (pendingFile) {
      setIsUploading(true);
      setUploadProgress(0);
      try {
        const uploadResult = await uploadMessageFile(
          pendingFile,
          startupId,
          userId,
          { onProgress: setUploadProgress },
        );
        if (!uploadResult?.url) throw new Error("Upload failed");
        attachmentPayload = uploadResult;
      } catch (err) {
        toast.error(err?.message || "Failed to upload file");
        setIsUploading(false);
        return;
      } finally {
        setPendingFile(null);
        setIsUploading(false);
        setUploadProgress(0);
      }
    }

    setNewMessage("");
    await sendMessage(
      userId,
      user.name,
      user.role,
      selectedConversation,
      recipient?.userName || "Team",
      text,
      startupId,
      isTeamMessage,
      attachmentPayload?.url,
      attachmentPayload?.fileName,
      attachmentPayload?.fileSize,
      attachmentPayload?.fileType,
      {
        attachments: attachmentPayload ? [attachmentPayload] : [],
        ...(replyingTo?.id ? { replyToMessageId: replyingTo.id } : {}),
      },
    );
    clearReply();
    await loadMessages(selectedConversation);
    await loadConversations();
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
        className={`flex-1 flex flex-col bg-surface-page ${selectedConversation ? "flex" : "hidden lg:flex"}`}
      >
        {selectedConv ? (
          <>
            {selectionMode && selectionToolbar ? (
              <ChatSelectionToolbar
                selectedCount={selectionToolbar.selectedCount}
                onCancel={selectionToolbar.onCancel}
                onDelete={selectionToolbar.onDelete}
                onForward={selectionToolbar.onForward}
              />
            ) : (
            <div className={chatShell.threadHeader}>
              <div className="flex items-center justify-between gap-2 w-full">
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
                    <h3 className="text-base font-semibold truncate text-text-heading">
                      {selectedConv.userName}
                    </h3>
                    <p className="text-xs text-text-muted truncate">
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
            )}
            <ScrollArea className={cn("flex-1", chatShell.threadScroll)}>
              <div className={chatShell.threadColumn}>
                <ChatMessageList
                  messages={messages}
                  loading={messagesLoading}
                  currentUserId={userId}
                  resolveSenderName={(m) => m.senderName || nameForMessage(m)}
                  messagesEndRef={messagesEndRef}
                  {...messageActionProps}
                />
              </div>
            </ScrollArea>
            {!selectionMode && (
              <div className={chatShell.composerFooter}>
                <div className={chatShell.composerColumn}>
                  <ChatComposer
                    value={newMessage}
                    onChange={setNewMessage}
                    onSend={handleSendMessage}
                    onFileSelect={setPendingFile}
                    pendingFile={pendingFile}
                    onClearPendingFile={() => setPendingFile(null)}
                    uploading={isUploading}
                    uploadProgress={uploadProgress}
                    replyingTo={replyingTo}
                    onCancelReply={clearReply}
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-20 h-20 text-text-muted opacity-30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-1 text-text-heading">
                Select a conversation
              </h3>
              <p className="text-sm text-text-muted">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
      <ForwardMessageModal
        open={forwardOpen}
        onOpenChange={setForwardOpen}
        messages={forwardMessages}
        conversations={conversations}
        currentUserId={userId}
        startupId={startupId}
        onForwarded={() => loadConversations()}
      />
    </div>
  );
}
