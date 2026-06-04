import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  canDeleteMessageForEveryone,
  isServerMessageId,
  mergeMessageIntoThread,
} from "../../utils/messaging";
import {
  deleteMessageForEveryone,
  deleteMessageForMe,
} from "../../utils/messageActionsApi";
import {
  downloadAttachmentWithAuth,
  isProxiedAttachmentUrl,
} from "../../utils/downloadAttachment";
import { resolveAttachmentDeliveryUrl } from "../../utils/resolveMediaUrl";
import { normalizeMessageAttachments } from "../../utils/messageAttachmentUtils";

export function useChatMessageHandlers({
  currentUserId,
  setMessages,
  onReply,
  onForward,
}) {
  const handleCopy = useCallback(async (message) => {
    const text = String(message.content || "").trim();
    if (!text) {
      toast.error("No text to copy");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy message");
    }
  }, []);

  const handleSaveMedia = useCallback(async (message) => {
    const attachments = normalizeMessageAttachments(message);
    const att = attachments[0];
    if (!att?.url) {
      toast.error("No file to save");
      return;
    }
    const href = resolveAttachmentDeliveryUrl(att.url, {
      fileName: att.fileName,
      fileType: att.fileType,
      disposition: "attachment",
    });
    try {
      if (isProxiedAttachmentUrl(href)) {
        await downloadAttachmentWithAuth(href, att.fileName || "download");
      } else {
        const a = document.createElement("a");
        a.href = href;
        a.download = att.fileName || "download";
        a.rel = "noopener noreferrer";
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      toast.success("Download started");
    } catch (err) {
      toast.error(err?.message || "Download failed");
    }
  }, []);

  const bulkDeleteForMe = useCallback(
    async (messageIds) => {
      const ids = (messageIds || []).filter((id) => isServerMessageId(id));
      if (ids.length === 0) return;
      try {
        await Promise.all(ids.map((id) => deleteMessageForMe(id)));
        const idSet = new Set(ids.map(String));
        setMessages((prev) => prev.filter((row) => !idSet.has(String(row.id))));
        toast.success(
          ids.length === 1 ? "Message removed" : `${ids.length} messages removed`,
        );
      } catch (err) {
        toast.error(err?.message || "Could not delete messages");
      }
    },
    [setMessages],
  );

  const handleDeleteForMe = useCallback(
    async (message) => {
      if (!isServerMessageId(message.id)) return;
      try {
        await deleteMessageForMe(message.id);
        setMessages((prev) => prev.filter((row) => String(row.id) !== String(message.id)));
        toast.success("Message removed");
      } catch (err) {
        toast.error(err?.message || "Could not delete message");
      }
    },
    [setMessages],
  );

  const handleDeleteForEveryone = useCallback(
    async (message) => {
      if (!isServerMessageId(message.id)) return;
      if (!canDeleteMessageForEveryone(message, currentUserId)) {
        toast.error("You can only delete your own messages within 48 hours");
        return;
      }
      try {
        const updated = await deleteMessageForEveryone(message.id);
        if (updated) {
          setMessages((prev) =>
            mergeMessageIntoThread(prev, { message: updated }, currentUserId),
          );
        }
        toast.success("Message deleted for everyone");
      } catch (err) {
        toast.error(err?.message || "Could not delete message");
      }
    },
    [currentUserId, setMessages],
  );

  const handleRealtimeUpdate = useCallback(
    (update) => {
      if (update?.action === "message_updated") {
        setMessages((prev) => mergeMessageIntoThread(prev, update, currentUserId));
      }
    },
    [currentUserId, setMessages],
  );

  return {
    handleCopy,
    handleSaveMedia,
    handleDeleteForMe,
    bulkDeleteForMe,
    handleDeleteForEveryone,
    handleRealtimeUpdate,
    onReply: onReply || (() => {}),
    onForward: onForward || (() => {}),
  };
}

export function useReplyState() {
  const [replyingTo, setReplyingTo] = useState(null);
  const clearReply = useCallback(() => setReplyingTo(null), []);
  return { replyingTo, setReplyingTo, clearReply };
}
