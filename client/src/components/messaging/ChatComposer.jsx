import React, { useRef, useState, useCallback, useMemo } from "react";
import { Paperclip, Send, Smile, Loader2, X } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { cn } from "../ui/utils";
import { PendingAttachmentPreview } from "./PendingAttachmentPreview";
import { ChatMentionPicker } from "./ChatMentionPicker";
import {
  composerDockClass,
  composerIconButtonClass,
  composerInputClass,
  composerReplyStripClass,
  composerSendButtonClass,
} from "./chatStyles";
import {
  createMentionFromMilestone,
  createMentionFromTask,
  detectMentionQuery,
  getFilteredMentionables,
  insertMentionIntoText,
  reconcileMentionsWithBody,
} from "../../utils/chatMentions";

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
  mentionsEnabled = false,
  mentionables = { milestones: [], tasks: [] },
  mentionablesLoading = false,
  mentionablesError = "",
  pendingMentions = [],
  onMentionsChange,
}) {
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [caretIndex, setCaretIndex] = useState(0);
  const [mentionHighlightIndex, setMentionHighlightIndex] = useState(0);

  const mentionDetection = useMemo(() => {
    if (!mentionsEnabled) return null;
    return detectMentionQuery(value, caretIndex);
  }, [mentionsEnabled, value, caretIndex]);

  const filteredMentionables = useMemo(() => {
    if (!mentionDetection) return { milestones: [], tasks: [], flat: [] };
    return getFilteredMentionables(mentionables, mentionDetection.query);
  }, [mentionDetection, mentionables]);

  const mentionPickerOpen = mentionsEnabled && Boolean(mentionDetection);

  const canSend =
    !disabled && !uploading && (Boolean(value?.trim()) || Boolean(pendingFile));

  const updateCaret = useCallback((target) => {
    if (!target) return;
    setCaretIndex(target.selectionStart ?? 0);
  }, []);

  const applyMention = useCallback(
    (mention) => {
      if (!mention) return;
      const { text, caret } = insertMentionIntoText(value, caretIndex, mention.label);
      const nextMentions = [
        ...reconcileMentionsWithBody(value, pendingMentions),
        mention,
      ];
      onChange?.(text);
      onMentionsChange?.(nextMentions);
      setMentionHighlightIndex(0);
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(caret, caret);
        setCaretIndex(caret);
      });
    },
    [caretIndex, onChange, onMentionsChange, pendingMentions, value],
  );

  const handleValueChange = useCallback(
    (nextValue, target) => {
      onChange?.(nextValue);
      if (mentionsEnabled && onMentionsChange) {
        onMentionsChange(reconcileMentionsWithBody(nextValue, pendingMentions));
      }
      updateCaret(target || textareaRef.current);
      setMentionHighlightIndex(0);
    },
    [mentionsEnabled, onChange, onMentionsChange, pendingMentions, updateCaret],
  );

  const handleKeyDown = (e) => {
    if (mentionPickerOpen) {
      const { flat } = filteredMentionables;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (flat.length === 0) return;
        setMentionHighlightIndex((prev) => (prev + 1) % flat.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (flat.length === 0) return;
        setMentionHighlightIndex((prev) => (prev - 1 + flat.length) % flat.length);
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const selected = flat[mentionHighlightIndex] || flat[0];
        if (!selected) return;
        const mention =
          selected.kind === "milestone"
            ? createMentionFromMilestone(selected.row)
            : createMentionFromTask(selected.row);
        applyMention(mention);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        const next = `${String(value || "").slice(0, mentionDetection.caret)} ${String(value || "").slice(mentionDetection.caret)}`;
        handleValueChange(next, e.target);
        return;
      }
    }

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
      <ChatMentionPicker
        open={mentionPickerOpen}
        query={mentionDetection?.query || ""}
        mentionables={filteredMentionables}
        loading={mentionablesLoading}
        error={mentionablesError}
        highlightIndex={mentionHighlightIndex}
        onSelect={applyMention}
      />

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

        <div className="flex items-center gap-1.5">
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
            ref={textareaRef}
            placeholder={placeholder}
            value={value}
            onChange={(e) => handleValueChange(e.target.value, e.target)}
            onClick={(e) => updateCaret(e.target)}
            onKeyUp={(e) => updateCaret(e.target)}
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
