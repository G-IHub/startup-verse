/**
 * V2TeamChatPane
 * A clean group-chat view for the Virtual Office inline chat card.
 * Uses startupId as the shared "team room" recipient so all members
 * share one message thread. No conversation picker, no search.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Send } from "lucide-react";
import { cn } from "../../ui/utils";
import { V2Avatar } from "../../shared/v2-primitives";
import { subscribeToMessages } from "../../../utils/realtimeSubscriptions";
import {
  getConversation,
  sendMessage as sendMessageUtil,
  formatMessageTime,
} from "../../../utils/messaging";

export function V2TeamChatPane({ user, startupId, teamMembers = [] }) {
  const currentUserId = String(user?._id ?? user?.id ?? "");
  const currentUserName = user?.name ?? "You";
  const currentUserRole = user?.role ?? "founder";

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const loadingRef = useRef(false);
  const shouldScrollRef = useRef(false); // only scroll after the user sends

  // Name lookup: id → display name
  const nameById = useMemo(() => {
    const map = {};
    map[currentUserId] = currentUserName;
    for (const m of teamMembers) {
      const id = String(m._id ?? m.id ?? "");
      if (id) map[id] = m.name ?? "Team member";
    }
    return map;
  }, [teamMembers, currentUserId, currentUserName]);

  // startupId acts as the virtual "group room" recipient
  const roomId = startupId;

  const loadMessages = useCallback(async () => {
    if (!currentUserId || !roomId || loadingRef.current) return;
    loadingRef.current = true;
    try {
      const msgs = await getConversation(currentUserId, roomId, startupId);
      setMessages(msgs);
    } finally {
      loadingRef.current = false;
    }
  }, [currentUserId, roomId, startupId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Scroll to bottom only after the user sends a message (not on background loads)
  useEffect(() => {
    if (shouldScrollRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      shouldScrollRef.current = false;
    }
  }, [messages]);

  // Auto-grow the textarea as the user types; collapse back to 1 row when empty
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [input]);

  // Real-time subscription for incoming messages
  useEffect(() => {
    if (!startupId) return undefined;
    const unsub = subscribeToMessages(
      startupId,
      (update) => {
        if (update?.message || update?.action === "new_message") {
          void loadMessages();
        }
      },
      { userId: currentUserId, peerUserId: roomId },
    );
    return () => unsub?.();
  }, [startupId, currentUserId, roomId, loadMessages]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending || !roomId) return;

    const optimisticId = `opt-${Date.now()}`;
    setInput("");
    setSending(true);
    shouldScrollRef.current = true; // scroll after this send resolves

    // Optimistic message so the UI feels instant
    setMessages((prev) => [
      ...prev,
      {
        id: optimisticId,
        senderId: currentUserId,
        senderName: currentUserName,
        content: text,
        timestamp: Date.now(),
      },
    ]);

    try {
      await sendMessageUtil(
        currentUserId,
        currentUserName,
        currentUserRole,
        roomId,
        "Team",
        text,
        startupId,
        true, // isTeamMessage
      );
      // Replace optimistic message with the real one from server
      await loadMessages();
    } catch (_) {
      // Keep optimistic message on failure so the user sees their text
    } finally {
      setSending(false);
    }
  }, [input, sending, roomId, currentUserId, currentUserName, currentUserRole, startupId, loadMessages]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Message thread ── */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-center font-body text-[11px] text-v2-muted">
              No messages yet — say hi to the team!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((msg) => {
              const isMe = String(msg.senderId) === currentUserId;
              const senderName =
                nameById[String(msg.senderId)] ?? msg.senderName ?? "?";

              return (
                <div
                  key={msg.id}
                  className={cn("flex items-start gap-2", isMe && "flex-row-reverse")}
                >
                  <V2Avatar name={senderName} size={28} className="mt-0.5 shrink-0" />
                  <div className={cn("flex max-w-[78%] flex-col", isMe && "items-end")}>
                    {/* Sender name + time */}
                    <div
                      className={cn(
                        "mb-0.5 flex items-center gap-1 font-body text-[9px] text-v2-subtle",
                        isMe ? "justify-end" : "justify-start",
                      )}
                    >
                      {!isMe && (
                        <span className="font-semibold text-v2-muted">{senderName}</span>
                      )}
                      <span>{formatMessageTime(msg.timestamp)}</span>
                    </div>
                    {/* Bubble */}
                    <div
                      className={cn(
                        "rounded-2xl px-3 py-2 font-body text-[11px] leading-relaxed",
                        isMe
                          ? "rounded-tr-sm bg-v2-blue-tint text-v2-heading"
                          : "rounded-tl-sm bg-v2-page text-v2-heading",
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Composer ── */}
      <div className="shrink-0 border-t border-v2-border px-3 py-2.5">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message the team..."
            className="min-w-0 flex-1 resize-none overflow-hidden rounded-2xl border border-v2-border bg-v2-page px-4 py-2 font-body text-[12px] text-v2-heading placeholder:text-v2-muted outline-none transition-colors focus:border-v2-blue/50 focus:ring-0 leading-relaxed max-h-[120px] overflow-y-auto"
            style={{ height: "auto" }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-v2-blue text-white transition-colors hover:bg-v2-blue-dark disabled:opacity-40"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
