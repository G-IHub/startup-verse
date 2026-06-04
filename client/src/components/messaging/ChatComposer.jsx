import React, { useRef, useState, useCallback } from "react";
import { Paperclip, Send, Smile, Loader2, X } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { cn } from "../ui/utils";
import { PendingAttachmentPreview } from "./PendingAttachmentPreview";
import {
  composerDockClass,
  composerIconButtonClass,
  composerInputClass,
  composerReplyStripClass,
  composerSendButtonClass,
} from "./chatStyles";

export const CHAT_FILE_ACCEPT = "image/*,video/*,.pdf,.doc,.docx,.txt";

const COMMON_EMOJIS = [
  "😊", "😂", "❤️", "👍", "🎉", "🔥", "✨", "💯",
  "🙌", "👏", "😍", "🤔", "😎", "💪", "🚀", "⭐",
];

export function ChatComposer({
  value,
  onChange,
  onSend,
  onFileSelect,
  disabled = false,
  uploading = false,
  uploadProgress = 0,
  pendingFile = null,
  onClearPendingFile,
  placeholder = "Type a message...",
  showEmojiPicker = true,
  replyingTo = null,
  onCancelReply,
  className,
}) {
  const fileInputRef = useRef(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const canSend =
    !disabled && !uploading && (Boolean(value?.trim()) || Boolean(pendingFile));

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSend?.();
    }
  };

  const pickFile = () => fileInputRef.current?.click();

  const handleFiles = useCallback(
    (files) => {
      const file = files?.[0];
      if (file && onFileSelect) onFileSelect(file);
    },
    [onFileSelect],
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || uploading) return;
    handleFiles(e.dataTransfer?.files);
  };

  return (
    <div
      className={cn("relative", className)}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled && !uploading) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <div className={composerDockClass()}>
        {replyingTo && (
          <div className={composerReplyStripClass()}>
            <div className="min-w-0 flex-1 border-l-2 border-primary pl-2">
              <p className="font-body text-xs font-semibold text-primary">
                Replying to{" "}
                {replyingTo.senderName || "message"}
              </p>
              <p className="truncate font-body text-xs text-text-muted">
                {replyingTo.deletedForEveryone
                  ? "Original message deleted"
                  : replyingTo.content?.trim() ||
                    (replyingTo.attachments?.length ? "Attachment" : "Message")}
              </p>
            </div>
            <button
              type="button"
              onClick={onCancelReply}
              className="shrink-0 rounded-full p-1 text-text-muted hover:bg-primary-tint hover:text-text-heading"
              aria-label="Cancel reply"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {dragOver && (
          <div className="pointer-events-none mb-2 flex items-center justify-center rounded-xl border-2 border-dashed border-primary bg-primary-tint/40 py-3">
            <p className="font-body text-xs font-medium text-primary">Drop file to attach</p>
          </div>
        )}

        {showEmojiPicker && emojiOpen && (
          <div className="mb-2 rounded-xl border border-surface-border bg-surface-page p-2">
            <div className="grid grid-cols-8 gap-1">
              {COMMON_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onChange?.((value || "") + emoji);
                    setEmojiOpen(false);
                  }}
                  className="rounded-lg p-1 text-xl transition-colors hover:bg-primary-tint"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {pendingFile && (
          <PendingAttachmentPreview
            file={pendingFile}
            uploading={uploading}
            uploadProgress={uploadProgress}
            onRemove={onClearPendingFile}
          />
        )}

        <div className="flex items-end gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={CHAT_FILE_ACCEPT}
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={disabled || uploading}
            className={composerIconButtonClass()}
            onClick={pickFile}
            aria-label="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          {showEmojiPicker && (
            <button
              type="button"
              disabled={disabled}
              className={composerIconButtonClass()}
              onClick={() => setEmojiOpen((o) => !o)}
              aria-label="Add emoji"
            >
              <Smile className="h-4 w-4" />
            </button>
          )}
          <Textarea
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || uploading}
            rows={1}
            className={composerInputClass()}
          />
          <button
            type="button"
            onClick={() => canSend && onSend?.()}
            disabled={!canSend}
            className={composerSendButtonClass(!canSend)}
            aria-label="Send message"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatComposer;
