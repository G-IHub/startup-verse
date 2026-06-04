import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "../ui/utils";
import {
  MessageSquare,
  Users,
  ArrowLeft,
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

export function TeamMessaging({ currentUser, teamMembers }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const messagesEndRef = useRef(null);
  const [forwardMessages, setForwardMessages] = useState([]);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectionToolbar, setSelectionToolbar] = useState(null);
  const { replyingTo, setReplyingTo, clearReply } = useReplyState();

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
    currentUserId: currentUser.id,
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
    void loadConversations();
  }, [currentUser.id, currentUser.startupId, teamMembers]);

  useEffect(() => {
    if (selectedConversation) {
      void loadMessages(selectedConversation);
      void markMessagesAsRead(
        currentUser.id,
        selectedConversation,
        currentUser.startupId,
      );
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!selectedConversation) return;
    const unsub = subscribeToMessages(
      currentUser.startupId,
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
        setMessages((prev) => mergeMessageIntoThread(prev, update, currentUser.id));
        void loadConversations();
      },
      { userId: currentUser.id, peerUserId: selectedConversation },
    );
    return () => unsub?.();
  }, [currentUser.startupId, selectedConversation, currentUser.id]);

  const loadConversations = async () => {
    const convs = await getUserConversations(
      currentUser.id,
      currentUser.startupId,
      teamMembers,
    );
    setConversations(convs);
  };

  const loadMessages = async (otherUserId) => {
    const msgs = await getConversation(
      currentUser.id,
      otherUserId,
      currentUser.startupId,
    );
    setMessages(msgs);
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
          currentUser.startupId,
          currentUser.id,
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
      currentUser.id,
      currentUser.name,
      currentUser.role,
      selectedConversation,
      recipient?.userName || "Team",
      text,
      currentUser.startupId,
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

  const selectedConv = conversations.find((c) => c.userId === selectedConversation);

  return (
    <div className="grid h-[min(600px,calc(100dvh-12rem))] min-h-[420px] grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className={`lg:col-span-1 ${selectedConversation ? "hidden lg:block" : ""}`}>
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
                onClick={() => setSelectedConversation(`team-${currentUser.startupId}`)}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Team Chat</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {conversations.find((c) => c.isTeamChat)?.lastMessage ||
                      "Start team conversation"}
                  </p>
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
                      {conversation.userName.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{conversation.userName}</p>
                      {conversation.unreadCount > 0 && (
                        <Badge variant="default" className="h-5 min-w-5 rounded-full px-1.5 text-xs">
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
          </ScrollArea>
        </CardContent>
      </Card>

      <Card
        className={cn(
          "flex min-h-0 flex-col lg:col-span-2",
          !selectedConversation ? "hidden lg:flex" : "flex flex-1",
        )}
      >
        {selectedConversation ? (
          <>
            {selectionMode && selectionToolbar ? (
              <ChatSelectionToolbar
                selectedCount={selectionToolbar.selectedCount}
                onCancel={selectionToolbar.onCancel}
                onDelete={selectionToolbar.onDelete}
                onForward={selectionToolbar.onForward}
              />
            ) : (
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
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {selectedConv?.userName?.split(" ").map((n) => n[0]).join("") || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{selectedConv?.userName || "Unknown"}</CardTitle>
                    {selectedConv?.userRole && (
                      <CardDescription className="text-xs">{selectedConv.userRole}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
            )}
            <CardContent className="flex min-h-0 flex-1 flex-col bg-surface-page p-0">
              <ScrollArea className={cn("flex-1", chatShell.threadScroll)}>
                <div className={chatShell.threadColumn}>
                  <ChatMessageList
                    messages={messages}
                    currentUserId={currentUser.id}
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
            </CardContent>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <MessageSquare className="w-20 h-20 text-muted-foreground opacity-30 mb-4" />
            <p className="text-muted-foreground">Select a conversation to start messaging</p>
          </div>
        )}
      </Card>
      <ForwardMessageModal
        open={forwardOpen}
        onOpenChange={setForwardOpen}
        messages={forwardMessages}
        conversations={conversations}
        currentUserId={currentUser.id}
        startupId={currentUser.startupId}
        onForwarded={() => loadConversations()}
      />
    </div>
  );
}
