import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { toast } from "sonner";
import { forwardMessage } from "../../utils/messageActionsApi";
import { avatarFallbackClass } from "./chatStyles";
import UserAvatar from "../shared/UserAvatar";

export function ForwardMessageModal({
  open,
  onOpenChange,
  message,
  messages: messagesProp,
  conversations = [],
  currentUserId,
  startupId,
  onForwarded,
}) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const messages = useMemo(() => {
    if (messagesProp?.length) return messagesProp;
    if (message) return [message];
    return [];
  }, [message, messagesProp]);

  const peers = conversations.filter(
    (c) => c.userId && !c.isTeamChat && String(c.userId) !== String(currentUserId),
  );

  const handleForward = async () => {
    const ids = messages.map((m) => m?.id).filter(Boolean);
    if (ids.length === 0 || !selectedUserId) {
      toast.error("Select someone to forward to");
      return;
    }
    setSubmitting(true);
    try {
      let lastCreated = null;
      for (let i = 0; i < ids.length; i += 1) {
        if (ids.length > 1) {
          toast.loading(`Forwarding ${i + 1}/${ids.length}…`, { id: "bulk-forward" });
        }
        lastCreated = await forwardMessage(ids[i], {
          toUserId: selectedUserId,
          startupId: startupId || null,
          caption: i === 0 ? caption.trim() : "",
        });
      }
      if (ids.length > 1) {
        toast.dismiss("bulk-forward");
      }
      toast.success(
        ids.length === 1 ? "Message forwarded" : `${ids.length} messages forwarded`,
      );
      onForwarded?.(lastCreated, selectedUserId);
      onOpenChange(false);
      setSelectedUserId("");
      setCaption("");
    } catch (err) {
      toast.dismiss("bulk-forward");
      toast.error(err?.message || "Could not forward message");
    } finally {
      setSubmitting(false);
    }
  };

  const title =
    messages.length > 1
      ? `Forward ${messages.length} messages`
      : "Forward message";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-card">
        <DialogHeader>
          <DialogTitle className="font-heading text-text-heading">{title}</DialogTitle>
          <DialogDescription className="font-body text-sm text-text-muted">
            Choose a conversation to send {messages.length > 1 ? "these messages" : "this message"} to.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-48 rounded-input border border-surface-border">
          <div className="p-1">
            {peers.length === 0 ? (
              <p className="p-4 text-center font-body text-xs text-text-muted">
                No conversations available
              </p>
            ) : (
              peers.map((conv) => {
                const sel = selectedUserId === conv.userId;
                return (
                  <button
                    key={conv.userId}
                    type="button"
                    onClick={() => setSelectedUserId(conv.userId)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                      sel ? "bg-primary-tint" : "hover:bg-primary-tint/50"
                    }`}
                  >
                    <UserAvatar
                      user={conv}
                      name={conv.userName}
                      src={conv.avatar || conv.avatarUrl}
                      className="h-8 w-8 rounded-card"
                      fallbackClassName={avatarFallbackClass()}
                    />
                    <span className="truncate font-body text-sm font-medium text-text-heading">
                      {conv.userName}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
        <Input
          placeholder="Add a comment (optional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="font-body text-sm"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleForward} disabled={submitting || !selectedUserId}>
            {submitting ? "Forwarding…" : "Forward"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ForwardMessageModal;
