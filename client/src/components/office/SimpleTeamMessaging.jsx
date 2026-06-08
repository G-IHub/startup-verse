import React, { useState, useEffect, useRef } from "react";
import { useIsMobile } from "../ui/use-mobile";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Input } from "../ui/input";
import { cn } from "../ui/utils";
import { ScrollArea } from "../ui/scroll-area";
// 🔥 REALTIME: Import real-time messaging hook

import { subscribeToMessages } from "../../utils/realtimeSubscriptions";
import {
  X,
  Search,
  ArrowLeft,
  MessageSquare,
  Paperclip,
} from "lucide-react";
import { toast } from "sonner";
import {
  sendMessage as sendMessageUtil,
  getConversation,
  getUserConversations,
  markMessagesAsRead,
  formatMessageTime,
  uploadMessageFile,
} from "../../utils/messaging";
import { ChatComposer } from "../messaging/ChatComposer";
import { ChatMessageList } from "../messaging/ChatMessageList";
import { ChatSelectionToolbar } from "../messaging/ChatSelectionToolbar";
import { ForwardMessageModal } from "../messaging/ForwardMessageModal";
import {
  useChatMessageHandlers,
  useReplyState,
} from "../messaging/useChatMessageHandlers";
import { mergeMessageIntoThread } from "../../utils/messaging";
import { useChatMentionables } from "../messaging/useChatMentionables";
import { buildMessageMentionMetadata } from "../../utils/chatMentions";
import {
  avatarFallbackClass,
  chatShell,
  chatSidebarPaneClass,
  chatThreadPaneClass,
  sidebarRowClass,
} from "../messaging/chatStyles";
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
  onSelectedPeerChange,
  embedded = false,
  fullPage = false,
  strictMode = false,
}) {
  const isMobile = useIsMobile();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [pendingMentions, setPendingMentions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const mentionsEnabled =
    Boolean(startupId) &&
    (currentUserRole === "founder" || currentUserRole === "team-member");
  const {
    mentionables,
    loading: mentionablesLoading,
    error: mentionablesError,
  } = useChatMentionables({
    startupId,
    enabled: mentionsEnabled,
  });
  const [pendingFile, setPendingFile] = useState(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const messagesEndRef = useRef(null);
  const teamMembersRef = useRef(teamMembers);
  const [forwardMessages, setForwardMessages] = useState([]);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectionToolbar, setSelectionToolbar] = useState(null);
  const { replyingTo, setReplyingTo, clearReply } = useReplyState();

  const openForward = (message) => {
    setForwardMessages(message ? [message] : []);
    setForwardOpen(true);
  };

  const nameForMessage = (message) => {
    const roster =
      teamMembersRef.current.length > 0 ? teamMembersRef.current : teamMembers;
    return (
      message.senderName ||
      roster.find((m) => String(m.id) === String(message.senderId))?.name ||
      "?"
    );
  };

  const {
    handleCopy,
    handleSaveMedia,
    handleDeleteForMe,
    bulkDeleteForMe,
    handleDeleteForEveryone,
    handleRealtimeUpdate,
  } = useChatMessageHandlers({
    currentUserId,
    setMessages,
    onReply: (message) => {
      setReplyingTo({ ...message, senderName: nameForMessage(message) });
    },
    onForward: openForward,
  });
  useEffect(() => { teamMembersRef.current = teamMembers; }, [teamMembers]);

  const selectConversation = (peerUserId) => {
    const next = peerUserId ? String(peerUserId) : null;
    setSelectedConversation(next);
    onSelectedPeerChange?.(next);
  };

  // Keep local selection in sync with URL-driven initialSelectedUserId
  useEffect(() => {
    setSelectedConversation(initialSelectedUserId ? String(initialSelectedUserId) : null);
  }, [initialSelectedUserId]);

  // Load conversations — only re-run when the user or startup changes,
  // not on every teamMembers reference change (which happens on every re-render).
  useEffect(() => {
    loadConversations();
  }, [currentUserId, startupId]);

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
          if (touches) {
            handleRealtimeUpdate(update);
          }
          void loadConversations();
          return;
        }

        const touchesCurrentConversation =
          String(m.senderId) === String(selectedConversation) ||
          String(m.recipientId) === String(selectedConversation);
        if (!touchesCurrentConversation) {
          void loadConversations();
          return;
        }
        setMessages((prev) => mergeMessageIntoThread(prev, update, currentUserId));
        if (startupId && selectedConversation) {
          void markMessagesAsRead(currentUserId, selectedConversation, startupId).then(
            () => loadConversations(),
          );
        } else {
          void loadConversations();
        }
      },
      {
        userId: currentUserId,
        peerUserId: selectedConversation,
      },
    );
    return () => unsub?.();
  }, [startupId, selectedConversation, currentUserId]);

  const loadConversations = async () => {
    // Use the ref so we always have the latest roster without
    // needing teamMembers in the useEffect dependency array.
    const currentMembers = teamMembersRef.current;
    const convs = await getUserConversations(
      currentUserId,
      startupId,
      currentMembers,
      { strict: strictMode },
    );
    setConversations(convs);
  };
  const loadMessages = async (otherUserId) => {
    console.log("📥 Loading messages for conversation:", {
      currentUserId,
      otherUserId,
      startupId,
    });
    setMessagesLoading(true);
    try {
      const msgs = await getConversation(currentUserId, otherUserId, startupId, {
      strict: strictMode,
    });
    console.log("📥 Loaded messages:", msgs.length, msgs);
    setMessages(msgs);
    } catch (err) {
      toast.error(err?.message || "Failed to load messages");
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };
  const resolveSenderName = (message) => {
    const roster =
      teamMembersRef.current.length > 0 ? teamMembersRef.current : teamMembers;
    return (
      message.senderName ||
      roster.find((m) => String(m.id) === String(message.senderId))?.name ||
      "?"
    );
  };

  const sendMessage = async () => {
    if (!selectedConversation) return;
    const text = messageInput.trim();
    if (!text && !pendingFile) return;

    const recipient = conversations.find((c) => c.userId === selectedConversation);
    const optimisticId = `opt-${Date.now()}`;
    const mentionMetadata = buildMessageMentionMetadata(text, pendingMentions);
    let attachmentPayload = null;

    if (pendingFile) {
      setIsUploading(true);
      setUploadProgress(0);
      setMessages((prev) => [
        ...prev,
        {
          id: optimisticId,
          senderId: currentUserId,
          senderName: currentUserName,
          content: text,
          timestamp: Date.now(),
          _uploading: true,
          attachments: [],
          metadata: mentionMetadata,
        },
      ]);
      setMessageInput("");
      setPendingMentions([]);

      try {
        const uploadResult = await uploadMessageFile(
          pendingFile,
          startupId,
          currentUserId,
          {
            strict: strictMode,
            onProgress: setUploadProgress,
          },
        );
        if (!uploadResult?.url) {
          throw new Error("Upload failed");
        }
        attachmentPayload = {
          url: uploadResult.url,
          fileName: uploadResult.fileName,
          fileSize: uploadResult.fileSize,
          fileType: uploadResult.fileType,
        };
      } catch (err) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        toast.error(err?.message || "Failed to upload file");
        setIsUploading(false);
        setUploadProgress(0);
        return;
      } finally {
        setPendingFile(null);
        setIsUploading(false);
        setUploadProgress(0);
      }
    } else {
      setMessageInput("");
      setPendingMentions([]);
    }

    setMessages((prev) => prev.filter((m) => m.id !== optimisticId));

    try {
      await sendMessageUtil(
        currentUserId,
        currentUserName,
        currentUserRole,
        selectedConversation,
        recipient?.userName || "Team",
        text,
        startupId,
        false,
        attachmentPayload?.url,
        attachmentPayload?.fileName,
        attachmentPayload?.fileSize,
        attachmentPayload?.fileType,
        {
          strict: strictMode,
          attachments: attachmentPayload ? [attachmentPayload] : [],
          ...(replyingTo?.id ? { replyToMessageId: replyingTo.id } : {}),
          ...(Object.keys(mentionMetadata).length > 0
            ? { metadata: mentionMetadata }
            : {}),
        },
      );
      clearReply();
      onActivity?.(
        attachmentPayload ? "file-share" : "message-send",
        attachmentPayload
          ? `shared ${attachmentPayload.fileName}`
          : `sent a message to ${recipient?.userName}`,
        attachmentPayload ? (
          <Paperclip className="w-3.5 h-3.5" />
        ) : (
          <MessageSquare className="w-3.5 h-3.5" />
        ),
      );
      await loadMessages(selectedConversation);
      await loadConversations();
    } catch (err) {
      toast.error(err?.message || "Failed to send message");
    }
  };
  const selectedConv = conversations.find(
    (c) => c.userId === selectedConversation,
  );

  // Use stable ref value so a transient empty teamMembers prop during a
  // parent re-fetch doesn't wipe the conversation list mid-chat.
  const stableMembers = teamMembersRef.current.length > 0
    ? teamMembersRef.current
    : teamMembers;

  // Filter conversations and sort by most recent message
  const filteredConversations = stableMembers
    .map((member) => ({
      member,
      conversation: conversations.find((c) => c.userId === member.id),
    }))
    .filter(({ member }) =>
      String(member.name || "").toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      // Sort by most recent message time (newest first)
      const timeA = a.conversation?.lastMessageTime || 0;
      const timeB = b.conversation?.lastMessageTime || 0;
      return timeB - timeA;
    });
  const getOnlineStatus = (userId) => {
    const member = stableMembers.find((m) => m.id === userId);
    return Boolean(member?.isOnline);
  };
  const handleFileSelect = (file) => {
    if (!file || !selectedConversation) return;
    setPendingFile(file);
  };
  const panelMotion = {
    type: "spring",
    damping: 28,
    stiffness: 260,
  };

  const messageActionProps = {
    onReply: (message) => setReplyingTo({ ...message, senderName: nameForMessage(message) }),
    onCopy: handleCopy,
    onSaveMedia: handleSaveMedia,
    onForward: openForward,
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

  const forwardModal = (
    <ForwardMessageModal
      open={forwardOpen}
      onOpenChange={setForwardOpen}
      messages={forwardMessages}
      conversations={conversations}
      currentUserId={currentUserId}
      startupId={startupId}
      onForwarded={() => loadConversations()}
    />
  );

  // ── Full-page two-pane layout (talent chat page) ──────────────────────────
  if (fullPage) {
    const selectedMember = stableMembers.find((m) => m.id === selectedConversation);
    const selectedDisplayName =
      selectedConversation === currentUserId
        ? `${selectedMember?.name || "Unknown"} (You)`
        : selectedMember?.name || "Unknown";

    return (
      <div className="flex h-full w-full min-h-0 overflow-hidden bg-surface-page">
        <div className={chatSidebarPaneClass(Boolean(selectedConversation))}>
          <div className="px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 rounded-card border-0 bg-surface-page pl-9 font-body text-xs text-text-heading placeholder:text-text-muted transition-colors focus-visible:bg-primary-tint/50 focus-visible:ring-0"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare className="mx-auto mb-2 h-8 w-8 text-text-muted" />
                <p className="font-body text-xs text-text-muted">
                  {searchQuery ? "No conversations found" : "No contacts yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-1 px-3 py-2">
                {filteredConversations.map(({ member, conversation }) => {
                  const isSel = selectedConversation === member.id;
                  const displayName =
                    member.id === currentUserId ? `${member.name} (You)` : member.name;
                  return (
                    <div
                      key={member.id}
                      onClick={() => selectConversation(member.id)}
                      className={sidebarRowClass(isSel)}
                    >
                      <Avatar className="h-9 w-9 shrink-0 rounded-card">
                        <AvatarFallback className={avatarFallbackClass()}>
                          {String(member.name || member.id || "?")
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="w-0 flex-1">
                        <div className="mb-0.5 flex items-center justify-between gap-1">
                          <p
                            className={cn(
                              "truncate font-body text-sm font-semibold",
                              isSel ? "text-primary" : "text-text-heading",
                            )}
                          >
                            {displayName}
                          </p>
                          {conversation?.lastMessageTime > 0 && (
                            <p className="shrink-0 font-body text-[10px] text-text-muted">
                              {formatMessageTime(conversation.lastMessageTime)}
                            </p>
                          )}
                        </div>
                        {conversation?.lastMessage ? (
                          <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
                            <p
                              className={cn(
                                "block min-w-0 flex-1 truncate font-body text-xs",
                                conversation.unreadCount > 0
                                  ? "font-semibold text-text-heading"
                                  : "text-text-muted",
                              )}
                              title={conversation.lastMessage}
                            >
                              {conversation.lastMessage}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-primary px-1 font-body text-[9px] font-bold text-white">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="truncate font-body text-xs text-text-muted">
                            {member.title || member.role || ""}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className={chatThreadPaneClass(Boolean(selectedConversation))}>
          {!selectedConversation ? (
            <div className="flex h-full flex-col items-center justify-center px-4 text-center">
              <MessageSquare className="mb-3 h-12 w-12 text-text-muted" />
              <p className="font-body text-sm text-text-muted">Select a conversation</p>
            </div>
          ) : (
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
                  {isMobile && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 shrink-0 p-0"
                      onClick={() => selectConversation(null)}
                      aria-label="Back to conversations"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  )}
                  <Avatar className="h-8 w-8 shrink-0 rounded-card">
                    <AvatarFallback className={avatarFallbackClass()}>
                      {String(selectedMember?.name || selectedConversation || "?")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-heading text-sm font-semibold text-text-heading">
                      {selectedDisplayName}
                    </p>
                    <p className="truncate font-body text-xs text-text-muted">
                      {selectedMember?.title || "Founder"}
                    </p>
                  </div>
                </div>
              )}
              <div className={chatShell.threadScroll}>
                <ScrollArea className="h-full">
                  <div className={chatShell.threadColumn}>
                    <ChatMessageList
                      messages={messages}
                      loading={messagesLoading}
                      currentUserId={currentUserId}
                      resolveSenderName={resolveSenderName}
                      messagesEndRef={messagesEndRef}
                      {...messageActionProps}
                    />
                  </div>
                </ScrollArea>
              </div>
              {!selectionMode && (
                <div className={chatShell.composerFooter}>
                  <div className={chatShell.composerColumn}>
                    <ChatComposer
                      value={messageInput}
                      onChange={setMessageInput}
                      onSend={sendMessage}
                      onFileSelect={handleFileSelect}
                      pendingFile={pendingFile}
                      onClearPendingFile={() => setPendingFile(null)}
                      uploading={isUploading}
                      uploadProgress={uploadProgress}
                      disabled={!selectedConversation}
                      replyingTo={replyingTo}
                      onCancelReply={clearReply}
                      mentionsEnabled={mentionsEnabled}
                      mentionables={mentionables}
                      mentionablesLoading={mentionablesLoading}
                      mentionablesError={mentionablesError}
                      pendingMentions={pendingMentions}
                      onMentionsChange={setPendingMentions}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        {forwardModal}
      </div>
    );
  }

  // ── Original sliding/embedded single-pane layout ──────────────────────────
  return (
    <motion.div
      initial={embedded ? { opacity: 0, y: 16 } : { x: "100%" }}
      animate={embedded ? { opacity: 1, y: 0 } : { x: 0 }}
      exit={embedded ? { opacity: 0, y: 16 } : { x: "100%" }}
      transition={panelMotion}
      className={
        embedded
          ? "h-[72vh] w-full office-panel office-panel-shell office-motion-soft flex flex-col"
          : "fixed top-0 right-0 h-full z-[70] w-full office-panel office-panel-shell office-motion-soft flex flex-col rounded-none md:rounded-l-xl"
      }
      style={embedded || isMobile ? {} : { width: "50vw", minWidth: 380, maxWidth: 760 }}
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
            <div className="office-panel-header flex items-center justify-between px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-900">
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
            <div className="px-4 py-3 border-b border-border bg-surface-container-low">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs bg-gray-50 border-gray-200"
                />
              </div>
            </div>
            <ScrollArea className="flex-1 office-panel-body">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-xs text-gray-500">
                    {searchQuery
                      ? "No conversations found"
                      : "No team members yet"}
                  </p>
                </div>
              ) : (
                filteredConversations.map(({ member, conversation }) => (
                  <motion.div
                    key={member.id}
                    onClick={() => selectConversation(member.id)}
                    className="flex w-full items-start gap-3 overflow-hidden px-4 py-3 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="text-xs font-medium bg-blue-600 text-white">
                          {String(member.name || member.id || "?")
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {member.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="w-0 flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <p
                          className={`text-xs truncate ${conversation && conversation.unreadCount > 0 ? "font-bold text-gray-900" : "font-medium text-gray-900"}`}
                        >
                          {member.id === currentUserId ? `${member.name} (You)` : member.name}
                        </p>
                        {conversation && conversation.lastMessageTime > 0 && (
                          <p className="text-[10px] text-gray-500 flex-shrink-0 ml-2">
                            {formatMessageTime(conversation.lastMessageTime)}
                          </p>
                        )}
                      </div>
                      {conversation && conversation.lastMessage ? (
                        <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                          <p
                            className={`block w-full min-w-0 flex-1 basis-0 overflow-hidden text-ellipsis whitespace-nowrap text-[11px] ${conversation.unreadCount > 0 ? "font-semibold text-gray-900" : "text-gray-600"}`}
                            title={conversation.lastMessage}
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
                        <p className="text-[11px] text-gray-500">
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
            {selectionMode && selectionToolbar ? (
              <ChatSelectionToolbar
                selectedCount={selectionToolbar.selectedCount}
                onCancel={selectionToolbar.onCancel}
                onDelete={selectionToolbar.onDelete}
                onForward={selectionToolbar.onForward}
              />
            ) : (
              <div className="office-panel-header flex items-center justify-between px-3 py-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 flex-shrink-0"
                    onClick={() => selectConversation(null)}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-[10px] font-medium bg-blue-600 text-white">
                        {String(selectedConv?.userName || selectedConversation || "?")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {getOnlineStatus(selectedConversation) && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-semibold text-gray-900 truncate">
                      {(() => {
                        const name = selectedConv?.userName ||
                          stableMembers.find((m) => m.id === selectedConversation)?.name ||
                          "Unknown";
                        return selectedConversation === currentUserId ? `${name} (You)` : name;
                      })()}
                    </h3>
                    <p className="text-[10px] text-gray-500">
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
            )}
            <div className={cn("flex-1 overflow-hidden", chatShell.threadScroll)}>
              <ScrollArea className="h-full bg-surface-page">
                <div className={chatShell.threadColumn}>
                  <ChatMessageList
                    messages={messages}
                    loading={messagesLoading}
                    currentUserId={currentUserId}
                    resolveSenderName={resolveSenderName}
                    emptyLabel="No messages yet"
                    messagesEndRef={messagesEndRef}
                    {...messageActionProps}
                  />
                </div>
              </ScrollArea>
            </div>
            {!selectionMode && (
              <div className={chatShell.composerFooter}>
                <div className={chatShell.composerColumn}>
                  <ChatComposer
                    value={messageInput}
                    onChange={setMessageInput}
                    onSend={sendMessage}
                    onFileSelect={handleFileSelect}
                    pendingFile={pendingFile}
                    onClearPendingFile={() => setPendingFile(null)}
                    uploading={isUploading}
                    uploadProgress={uploadProgress}
                    disabled={!selectedConversation}
                    replyingTo={replyingTo}
                    onCancelReply={clearReply}
                    mentionsEnabled={mentionsEnabled}
                    mentionables={mentionables}
                    mentionablesLoading={mentionablesLoading}
                    mentionablesError={mentionablesError}
                    pendingMentions={pendingMentions}
                    onMentionsChange={setPendingMentions}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {forwardModal}
    </motion.div>
  );
}
