import React, { useCallback, useEffect } from "react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { cn } from "../ui/utils";
import { Check, MessageSquare } from "lucide-react";
import { useIsMobile } from "../ui/use-mobile";
import { MessageAttachmentBubble } from "./MessageAttachmentBubble";
import { MessageActionsMenu } from "./MessageActionsMenu";
import { SwipeableMessageRow } from "./SwipeableMessageRow";
import { normalizeMessageAttachments } from "../../utils/messageAttachmentUtils";
import { formatMessageTime, isServerMessageId } from "../../utils/messaging";
import { useMessageSelection, useLongPress } from "./useMessageSelection";
import {
  avatarFallbackClass,
  bubbleClass,
  dateDividerClass,
  dateDividerLineClass,
  dateDividerPillClass,
  forwardBlockClass,
  forwardBodyClass,
  forwardLabelClass,
  messageRowWidthClass,
  replyQuoteClass,
  selectionBubbleClass,
  selectionCheckClass,
  senderNameClass,
  timestampClass,
  tombstoneBubbleClass,
} from "./chatStyles";

function isSelectableMessage(message) {
  return (
    isServerMessageId(message?.id) &&
    !message._uploading &&
    !message.deletedForEveryone
  );
}

function DateDivider({ timestamp }) {
  return (
    <div className={dateDividerClass()}>
      <div className={dateDividerLineClass()} />
      <div className={dateDividerPillClass()}>
        {new Date(timestamp).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </div>
    </div>
  );
}

function SenderAvatar({ name, hidden }) {
  if (hidden) {
    return <div className="h-7 w-7 shrink-0" aria-hidden="true" />;
  }
  const initials = String(name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
  return (
    <Avatar className="h-7 w-7 shrink-0 rounded-card">
      <AvatarFallback className={avatarFallbackClass()}>{initials}</AvatarFallback>
    </Avatar>
  );
}

function ReplyQuote({ replyTo, isMe, resolveSenderName }) {
  if (!replyTo) return null;
  const name =
    replyTo.senderName ||
    (resolveSenderName
      ? resolveSenderName({ senderId: replyTo.senderId })
      : "") ||
    "Someone";
  const snippet = replyTo.deletedForEveryone
    ? "Original message deleted"
    : replyTo.bodySnippet ||
      (replyTo.hasAttachment ? "Attachment" : "");

  return (
    <div className={replyQuoteClass(isMe)}>
      <p className="font-medium">{name}</p>
      {snippet ? <p className="truncate opacity-90">{snippet}</p> : null}
    </div>
  );
}

function ForwardedHeader({ forwardedFrom, isMe, showBody = true }) {
  if (!forwardedFrom) return null;
  const name = forwardedFrom.fromUserName || "Someone";
  const snippet =
    forwardedFrom.bodySnippet ||
    (forwardedFrom.attachments?.length && !showBody ? "Attachment" : "");
  const hasBodyText = showBody && Boolean(snippet);

  return (
    <div className={forwardBlockClass()}>
      <span className={forwardLabelClass(isMe)}>Forwarded from {name}</span>
      {hasBodyText ? (
        <p className={cn(forwardBodyClass(isMe), "wrap-break-word")}>{snippet}</p>
      ) : null}
    </div>
  );
}

function ChatMessageRow({
  message,
  currentUserId,
  resolveSenderName,
  showSenderName = false,
  hideAvatar = false,
  onReply,
  onCopy,
  onSaveMedia,
  onForward,
  onDeleteForMe,
  onDeleteForEveryone,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
  onLongPressSelect,
  swipeEnabled = false,
}) {
  const isMe = String(message.senderId) === String(currentUserId);
  const attachments = normalizeMessageAttachments(message);
  const caption = String(message.content || "").trim();
  const hasMedia = attachments.length > 0 || Boolean(message._uploading);
  const hasTextOnly = !hasMedia && Boolean(caption);
  const senderName = resolveSenderName?.(message) || message.senderName || "?";
  const forwarded = message.forwardedFrom;
  const forwardedAttachments =
    forwarded && !message.deletedForEveryone
      ? normalizeMessageAttachments({ attachments: forwarded.attachments })
      : [];

  const selectable = isSelectableMessage(message);

  const { longPressHandlers } = useLongPress({
    disabled: !swipeEnabled || !selectable,
    onLongPress: () => onLongPressSelect?.(message.id),
    onTap: () => {
      if (selectionMode && selectable) {
        onToggleSelect?.(message.id);
      }
    },
  });

  if (message.deletedForEveryone) {
    return (
      <div className={cn("flex", isMe ? "justify-end" : "justify-start")}>
        <div
          className={cn(
            "flex items-end gap-2",
            messageRowWidthClass(),
            isMe ? "flex-row-reverse" : "flex-row",
          )}
        >
          {!isMe && <SenderAvatar name={senderName} hidden={hideAvatar} />}
          <div className={cn("min-w-0", isMe ? "items-end" : "items-start")}>
            <div className={tombstoneBubbleClass(isMe)}>This message was deleted</div>
            <p className={timestampClass(isMe)}>{formatMessageTime(message.timestamp)}</p>
          </div>
        </div>
      </div>
    );
  }

  const hasForwardContent = forwardedAttachments.length > 0 || forwarded?.bodySnippet;
  if (!hasMedia && !hasTextOnly && !hasForwardContent) return null;

  const bubbleBody = (
    <>
      <ReplyQuote
        replyTo={message.replyTo}
        isMe={isMe}
        resolveSenderName={resolveSenderName}
      />
      <ForwardedHeader
        forwardedFrom={forwarded}
        isMe={isMe}
        showBody={forwardedAttachments.length === 0}
      />
      {forwardedAttachments.length > 0 && (
        <MessageAttachmentBubble
          embedded
          attachments={forwardedAttachments}
          isMe={isMe}
          caption=""
        />
      )}
      {hasMedia ? (
        <MessageAttachmentBubble
          embedded
          attachments={attachments}
          isMe={isMe}
          caption={caption}
          uploading={Boolean(message._uploading)}
        />
      ) : hasTextOnly ? (
        <p className="wrap-break-word">{caption}</p>
      ) : null}
    </>
  );

  const rowInner = (
    <div className={cn("flex", isMe ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "flex items-end gap-2",
          messageRowWidthClass(),
          selectionMode && "gap-4",
          isMe ? "flex-row-reverse" : "flex-row",
        )}
      >
        {!isMe && <SenderAvatar name={senderName} hidden={hideAvatar} />}
        <div className={cn("relative min-w-0 flex flex-col", isMe ? "items-end" : "items-start")}>
          {selectionMode && selectable && (
            <div className={selectionCheckClass(isMe, isSelected)} aria-hidden>
              {isSelected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
            </div>
          )}
          {!isMe && showSenderName && !hideAvatar && (
            <p className={senderNameClass()}>{senderName}</p>
          )}
          <MessageActionsMenu
            message={message}
            isMe={isMe}
            currentUserId={currentUserId}
            onReply={onReply}
            onCopy={onCopy}
            onSaveMedia={onSaveMedia}
            onForward={onForward}
            onDeleteForMe={onDeleteForMe}
            onDeleteForEveryone={onDeleteForEveryone}
            selectionMode={selectionMode}
          >
            <div
              className={cn(
                bubbleClass({
                  isMe,
                  hasMedia: hasMedia || forwardedAttachments.length > 0,
                }),
                selectionBubbleClass(isSelected),
              )}
            >
              {bubbleBody}
            </div>
          </MessageActionsMenu>
          <p className={timestampClass(isMe)}>{formatMessageTime(message.timestamp)}</p>
        </div>
      </div>
    </div>
  );

  return (
    <SwipeableMessageRow
      enabled={swipeEnabled && selectable && !selectionMode}
      isMe={isMe}
      onReply={() => onReply?.(message)}
      onTouchHandlers={longPressHandlers}
    >
      {rowInner}
    </SwipeableMessageRow>
  );
}

export function ChatMessageList({
  messages = [],
  currentUserId,
  resolveSenderName,
  emptyLabel = "No messages yet — say hi!",
  messagesEndRef,
  className,
  onReply,
  onCopy,
  onSaveMedia,
  onForward,
  onDeleteForMe,
  onDeleteForEveryone,
  onSelectionModeChange,
  onSelectionToolbarChange,
  onBulkDeleteForMe,
  onBulkForward,
}) {
  const isMobile = useIsMobile();
  const {
    selectionMode,
    selectedCount,
    enterSelection,
    toggleSelect,
    cancelSelection,
    isSelected,
    getSelectedMessages,
  } = useMessageSelection({ onSelectionModeChange });

  const handleBulkDelete = useCallback(async () => {
    const ids = getSelectedMessages(messages).map((m) => m.id);
    if (ids.length === 0) return;
    await onBulkDeleteForMe?.(ids);
    cancelSelection();
  }, [cancelSelection, getSelectedMessages, messages, onBulkDeleteForMe]);

  const handleBulkForward = useCallback(() => {
    const selected = getSelectedMessages(messages);
    if (selected.length === 0) return;
    onBulkForward?.(selected);
    cancelSelection();
  }, [cancelSelection, getSelectedMessages, messages, onBulkForward]);

  useEffect(() => {
    if (!onSelectionToolbarChange) return;
    onSelectionToolbarChange({
      selectedCount,
      onCancel: cancelSelection,
      onDelete: handleBulkDelete,
      onForward: handleBulkForward,
    });
  }, [
    cancelSelection,
    handleBulkDelete,
    handleBulkForward,
    onSelectionToolbarChange,
    selectedCount,
  ]);

  const swipeEnabled = isMobile;

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center py-12 text-center">
        <MessageSquare className="mb-3 h-12 w-12 text-text-muted" />
        <p className="font-body text-sm text-text-muted">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {messages.map((message, index) => {
        const showDate =
          index === 0 ||
          new Date(message.timestamp).toDateString() !==
            new Date(messages[index - 1].timestamp).toDateString();

        const isMe = String(message.senderId) === String(currentUserId);
        const prev = messages[index - 1];
        const isGrouped =
          prev &&
          String(prev.senderId) === String(message.senderId) &&
          new Date(message.timestamp).toDateString() ===
            new Date(prev.timestamp).toDateString();

        return (
          <div key={message.id || index}>
            {showDate && <DateDivider timestamp={message.timestamp} />}
            <ChatMessageRow
              message={message}
              currentUserId={currentUserId}
              resolveSenderName={resolveSenderName}
              showSenderName={!isMe}
              hideAvatar={!isMe && isGrouped}
              onReply={onReply}
              onCopy={onCopy}
              onSaveMedia={onSaveMedia}
              onForward={onForward}
              onDeleteForMe={onDeleteForMe}
              onDeleteForEveryone={onDeleteForEveryone}
              selectionMode={selectionMode}
              isSelected={isSelected(message.id)}
              onToggleSelect={toggleSelect}
              onLongPressSelect={enterSelection}
              swipeEnabled={swipeEnabled}
            />
          </div>
        );
      })}
      {messagesEndRef ? <div ref={messagesEndRef} /> : null}
    </div>
  );
}

export default ChatMessageList;
