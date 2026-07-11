import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  Loader2,
  MessageSquare,
  Send,
  Users,
  XCircle,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { Textarea } from "../ui/textarea";

function RelationshipBadge({ status }) {
  switch (status) {
    case "team-member":
      return (
        <Badge className="border-0 bg-status-success/10 text-status-success">
          <Users className="mr-1 h-3 w-3" />
          On your team
        </Badge>
      );
    case "invitation-pending":
      return (
        <Badge className="border-0 bg-status-warning/10 text-status-warning">
          <Clock className="mr-1 h-3 w-3" />
          Invitation pending
        </Badge>
      );
    case "interest-received":
      return (
        <Badge className="border-0 bg-primary/10 text-primary">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Expressed interest
        </Badge>
      );
    case "interest-accepted":
    case "interest-sent":
      return (
        <Badge className="border-0 bg-primary/10 text-primary">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Connected via interest
        </Badge>
      );
    default:
      return null;
  }
}

export default function PeerActionCard({
  peerName = "them",
  relationshipStatus = "none",
  relationshipLoading = false,
  viewerRole = "",
  inviteMessage = "",
  onInviteMessageChange,
  onSendInvitation,
  invitationSent = false,
  onAcceptInvitation,
  onDeclineInvitation,
  onMessage,
  actionBusy = false,
}) {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const isFounder = viewerRole === "founder";
  const isTalent = viewerRole === "talent";
  const firstName = String(peerName || "them").split(" ")[0] || "them";

  const canInvite =
    isFounder &&
    relationshipStatus !== "team-member" &&
    relationshipStatus !== "invitation-pending";

  const canRespondToInvite =
    isTalent && relationshipStatus === "invitation-pending";

  return (
    <Card className="sticky top-24 border border-surface-border bg-surface-card shadow-soft">
      <CardContent className="p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h3 className="font-heading text-sm font-semibold text-text-heading">
            Next step
          </h3>
          {relationshipLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-text-muted" />
          ) : (
            <RelationshipBadge status={relationshipStatus} />
          )}
        </div>

        {canRespondToInvite ? (
          <div className="space-y-3">
            <p className="font-body text-xs leading-relaxed text-text-muted">
              Review the invitation from {firstName}&apos;s startup and choose
              whether to join the team.
            </p>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={onAcceptInvitation}
                disabled={actionBusy}
              >
                {actionBusy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Accept invitation
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={onDeclineInvitation}
                disabled={actionBusy}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Decline
              </Button>
            </div>
          </div>
        ) : canInvite ? (
          !showInviteForm ? (
            <div className="space-y-3">
              <p className="font-body text-xs leading-relaxed text-text-muted">
                Send a personalized invitation for {firstName} to join your
                startup team.
              </p>
              <Button
                className="w-full"
                size="lg"
                onClick={() => setShowInviteForm(true)}
              >
                <Send className="mr-2 h-4 w-4" />
                Invite to startup
              </Button>
            </div>
          ) : invitationSent ? (
            <div className="py-2 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-status-success/10">
                <CheckCircle2 className="h-5 w-5 text-status-success" />
              </div>
              <p className="font-body text-sm font-medium text-status-success">
                Invitation sent!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="font-body text-xs font-medium text-text-body">
                Your message
              </label>
              <Textarea
                placeholder={`Hi ${firstName}, I'm interested in having you join our team...`}
                value={inviteMessage}
                onChange={(e) => onInviteMessageChange?.(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={onSendInvitation}
                  disabled={!inviteMessage.trim() || actionBusy}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowInviteForm(false);
                    onInviteMessageChange?.("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )
        ) : relationshipStatus === "team-member" ? (
          <p className="font-body text-xs leading-relaxed text-text-muted">
            {firstName} is already on your team. Continue the conversation in
            chat.
          </p>
        ) : relationshipStatus === "invitation-pending" && isFounder ? (
          <p className="font-body text-xs leading-relaxed text-text-muted">
            Your invitation is waiting for {firstName}&apos;s response.
          </p>
        ) : null}

        {onMessage ? (
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={onMessage}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Message
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
