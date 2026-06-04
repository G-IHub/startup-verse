import React from "react";
import {
  Copy,
  Download,
  Forward,
  Reply,
  Trash2,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "../ui/context-menu";
import { useIsMobile } from "../ui/use-mobile";
import { cn } from "../ui/utils";
import {
  canDeleteMessageForEveryone,
  isServerMessageId,
} from "../../utils/messaging";
import { normalizeMessageAttachments } from "../../utils/messageAttachmentUtils";

function buildActions({
  message,
  isMe,
  currentUserId,
  onReply,
  onCopy,
  onSaveMedia,
  onForward,
  onDeleteForMe,
  onDeleteForEveryone,
}) {
  const isDm = String(message.messageType || "dm") === "dm";
  const hasServerId = isServerMessageId(message.id);
  const attachments = normalizeMessageAttachments(message);
  const hasText = Boolean(String(message.content || "").trim());
  const hasMedia = attachments.length > 0;
  const canCopy = hasText && !message.deletedForEveryone;
  const canSave = hasMedia && !message.deletedForEveryone;
  const canForward = isDm && hasServerId && !message.deletedForEveryone;
  const canDeleteEveryone =
    isDm && hasServerId && canDeleteMessageForEveryone(message, currentUserId);

  const items = [];

  if (!message.deletedForEveryone) {
    items.push({
      key: "reply",
      label: "Reply",
      icon: Reply,
      onClick: () => onReply?.(message),
    });
  }

  if (canCopy) {
    items.push({
      key: "copy",
      label: "Copy",
      icon: Copy,
      onClick: () => onCopy?.(message),
    });
  }

  if (canSave) {
    items.push({
      key: "save",
      label: "Save",
      icon: Download,
      onClick: () => onSaveMedia?.(message),
    });
  }

  if (canForward) {
    items.push({
      key: "forward",
      label: "Forward",
      icon: Forward,
      onClick: () => onForward?.(message),
    });
  }

  if (hasServerId && !message.deletedForEveryone) {
    items.push({ key: "sep1", separator: true });
    items.push({
      key: "delete-me",
      label: "Delete for me",
      icon: Trash2,
      destructive: true,
      onClick: () => onDeleteForMe?.(message),
    });
  }

  if (canDeleteEveryone) {
    items.push({
      key: "delete-all",
      label: "Delete for everyone",
      icon: Trash2,
      destructive: true,
      onClick: () => onDeleteForEveryone?.(message),
    });
  }

  return items;
}

function MenuItems({ items, MenuItem, Separator }) {
  return items.map((item) =>
    item.separator ? (
      <Separator key={item.key} />
    ) : (
      <MenuItem
        key={item.key}
        className={item.destructive ? "text-destructive focus:text-destructive" : ""}
        onClick={item.onClick}
      >
        <item.icon className="mr-2 h-4 w-4" />
        {item.label}
      </MenuItem>
    ),
  );
}

export function MessageActionsMenu({
  message,
  isMe,
  currentUserId,
  onReply,
  onCopy,
  onSaveMedia,
  onForward,
  onDeleteForMe,
  onDeleteForEveryone,
  children,
  className,
  selectionMode = false,
}) {
  const isMobile = useIsMobile();

  if (message._uploading || message.deletedForEveryone || selectionMode) {
    return <div className={className}>{children}</div>;
  }

  if (!isServerMessageId(message.id)) {
    return <div className={className}>{children}</div>;
  }

  const items = buildActions({
    message,
    isMe,
    currentUserId,
    onReply,
    onCopy,
    onSaveMedia,
    onForward,
    onDeleteForMe,
    onDeleteForEveryone,
  });

  const wrapper = <div className={cn("group relative", className)}>{children}</div>;

  if (items.length === 0 || isMobile) {
    return wrapper;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{wrapper}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <MenuItems
          items={items}
          MenuItem={ContextMenuItem}
          Separator={ContextMenuSeparator}
        />
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default MessageActionsMenu;
