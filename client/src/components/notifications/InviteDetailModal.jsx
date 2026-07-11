import React, { useEffect, useState } from "react";
import {
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Handshake,
  Loader2,
  MessageCircle,
  MessageSquare,
  UserPlus,
  XCircle,
  Clock,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { ChatComposer } from "../messaging/ChatComposer";
import { MessageAttachmentBubble } from "../messaging/MessageAttachmentBubble";
import { normalizeMessageAttachments } from "../../utils/messageAttachmentUtils";
import CompensationSetupWizard from "../compensation/CompensationSetupWizard";
import { getStartupId } from "../../utils/startupId";
import { useInboxActions, resolveInboxItem } from "../../hooks/useInboxActions";
import { isOrgInboxMessage } from "../../utils/inboxItemKind";
import {
  normalizeInboxItem,
  isFounderTalentInvitation,
  isOrganizationInvitation,
  INBOX_AVATAR_FALLBACK,
  INBOX_PRIMARY_BTN,
  INBOX_OUTLINE_BTN,
  INBOX_CALLOUT,
  formatInboxDateTime,
} from "../../utils/inboxNormalize";

function StatusBadge({ status }) {
  switch (status) {
    case "accepted":
      return (
        <Badge className="rounded-full border-0 bg-status-success/10 px-3 py-[3px] font-body text-[12px] font-semibold text-status-success shadow-none">
          <CheckCircle2 className="mr-1 h-3 w-3 text-status-success" />
          Accepted
        </Badge>
      );
    case "declined":
      return (
        <Badge className="rounded-full border-0 bg-status-error/10 px-3 py-[3px] font-body text-[12px] font-semibold text-status-error shadow-none">
          <XCircle className="mr-1 h-3 w-3 text-status-error" />
          Declined
        </Badge>
      );
    case "proposed-by-founder":
      return (
        <Badge className="rounded-full border-0 bg-primary-tint px-3 py-[3px] font-body text-[12px] font-semibold text-primary shadow-none">
          <Handshake className="mr-1 h-3 w-3 text-primary" />
          Offer Sent
        </Badge>
      );
    case "proposed-by-talent":
      return (
        <Badge className="rounded-full border-0 bg-accent-tint px-3 py-[3px] font-body text-[12px] font-semibold text-accent shadow-none">
          <Handshake className="mr-1 h-3 w-3 text-accent" />
          Proposed
        </Badge>
      );
    default:
      return (
        <Badge className="rounded-full border-0 bg-status-warning/10 px-3 py-[3px] font-body text-[12px] font-semibold text-status-warning shadow-none">
          <Clock className="mr-1 h-3 w-3 text-status-warning" />
          Pending
        </Badge>
      );
  }
}

/**
 * Detail modal for interests, founder-talent invites, org cohort invites, and org messages.
 * Opened from the notification bell hub.
 */
export default function InviteDetailModal({
  open,
  onOpenChange,
  user,
  onNavigate,
  invitationId,
  interestId,
  messageId,
  initialItem = null,
  direction = "received",
}) {
  const [item, setItem] = useState(initialItem ? normalizeInboxItem(initialItem) : null);
  const [loading, setLoading] = useState(false);
  const [pendingInvitationAcceptance, setPendingInvitationAcceptance] = useState(null);
  const [acceptanceConfirmed, setAcceptanceConfirmed] = useState(false);
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);
  const [onboardingTalent, setOnboardingTalent] = useState(null);

  const actions = useInboxActions({
    user,
    onNavigate,
    onItemUpdated: (next) => {
      if (next == null) {
        setItem(null);
        onOpenChange?.(false);
        return;
      }
      setItem(normalizeInboxItem(next));
    },
  });

  const {
    userId,
    isTalentInboxUser,
    isFounderInboxUser,
    isSending,
    responseMessage,
    setResponseMessage,
    pendingFile,
    setPendingFile,
    uploadProgress,
    isUploading,
  } = actions;

  useEffect(() => {
    if (!open) return;
    if (initialItem) {
      setItem(normalizeInboxItem(initialItem));
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const resolved = await resolveInboxItem({
          userId,
          role: user?.role,
          invitationId,
          interestId,
          messageId,
        });
        if (!cancelled) setItem(resolved);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, initialItem, invitationId, interestId, messageId, userId, user?.role]);

  const close = () => {
    setPendingInvitationAcceptance(null);
    setAcceptanceConfirmed(false);
    onOpenChange?.(false);
  };

  const handleOpenCompensationWizard = (sourceItem) => {
    const src = sourceItem || item;
    if (!src) return;
    setOnboardingTalent({
      talentId: src.talentId,
      talentName: src.talentName,
      talentArea: src.talentArea,
      talentSkills: src.talentSkills,
      interestId: src.id,
    });
    setShowOnboardingWizard(true);
    setItem(null);
    onOpenChange?.(false);
  };

  const handleReviewStartupBeforeAccept = () => {
    if (!pendingInvitationAcceptance?.startupId || !onNavigate) return;
    setPendingInvitationAcceptance(null);
    setAcceptanceConfirmed(false);
    close();
    onNavigate("startup-detail", {
      startupId: pendingInvitationAcceptance.startupId,
    });
  };

  const getTalentId = (row) => String(row?.talentId?._id || row?.talentId || "");

  const renderOrgInvite = (orgInvite) => (
    <DialogContent className="max-w-lg rounded-card border-0 shadow-soft">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 font-heading text-[18px] font-bold text-text-heading">
          <Building2 className="h-5 w-5 text-primary" />
          Cohort invitation
        </DialogTitle>
        <DialogDescription className="font-body text-[13px] text-text-body">
          Join{" "}
          <span className="font-medium text-text-heading">
            {orgInvite.cohortName || "this cohort"}
          </span>{" "}
          with{" "}
          <span className="font-medium text-text-heading">
            {orgInvite.organizationName || "this organization"}
          </span>
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 font-body">
        <div className="rounded-input border border-primary/20 bg-primary-tint p-4">
          <div className="mb-3 flex items-start gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className={INBOX_AVATAR_FALLBACK}>
                {(orgInvite.organizationName || "O")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="font-heading text-[16px] font-semibold text-text-heading">
                {orgInvite.organizationName || "Organization"}
              </h3>
              <p className="font-body text-[13px] text-primary">
                {orgInvite.cohortName || "Cohort"}
              </p>
            </div>
            <StatusBadge status={orgInvite.status} />
          </div>
          {orgInvite.message ? (
            <div className="mt-3 border-t border-primary/15 pt-3">
              <p className="mb-1 font-body text-[12px] font-medium text-text-muted">
                Message
              </p>
              <p className="font-body text-[13px] text-text-body">{orgInvite.message}</p>
            </div>
          ) : null}
          <div className="mt-3 flex items-center gap-2 border-t border-primary/15 pt-3 font-body text-[12px] text-text-muted">
            <Calendar className="h-3 w-3" />
            <span>{formatInboxDateTime(orgInvite.sentAt || orgInvite.createdAt)}</span>
          </div>
        </div>
        {orgInvite.status === "pending" ? (
          <div className="space-y-3">
            <p className="text-center font-body text-[13px] text-text-body">
              Accept to join the cohort. Your program gets read-only access to execution
              progress to support your journey.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => actions.respondToOrgInvitation(orgInvite, "accept")}
                className={`flex-1 ${INBOX_PRIMARY_BTN}`}
                disabled={isSending}
              >
                {isSending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Accept invitation
              </Button>
              <Button
                onClick={() => actions.respondToOrgInvitation(orgInvite, "decline")}
                className={`flex-1 ${INBOX_OUTLINE_BTN}`}
                variant="outline"
                disabled={isSending}
              >
                {isSending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                Decline
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={`rounded-input border p-4 ${
              orgInvite.status === "accepted"
                ? "border-status-success/30 bg-status-success/10"
                : "border-status-error/30 bg-status-error/10"
            }`}
          >
            <div className="mb-2 flex items-center gap-2">
              {orgInvite.status === "accepted" ? (
                <CheckCircle2 className="h-5 w-5 text-status-success" />
              ) : (
                <XCircle className="h-5 w-5 text-status-error" />
              )}
              <p className="font-heading text-[14px] font-semibold text-text-heading">
                {orgInvite.status === "accepted"
                  ? "Invitation accepted"
                  : "Invitation declined"}
              </p>
            </div>
          </div>
        )}
      </div>
    </DialogContent>
  );

  const renderOrgMessage = (msg) => (
    <DialogContent className="max-w-lg rounded-card border border-surface-border bg-surface-card shadow-modal">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 font-heading text-text-heading">
          <Building2 className="h-5 w-5 text-primary" />
          {msg.subject || "Organization message"}
        </DialogTitle>
        <DialogDescription className="font-body text-sm text-text-body">
          From {msg.sentByName || "Organization"}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <p className="whitespace-pre-wrap font-body text-[13px] text-text-body">
          {msg.message || msg.body || ""}
        </p>
        <p className="font-body text-[11px] text-text-muted">
          {formatInboxDateTime(msg.sentAt || msg.createdAt)}
        </p>
      </div>
    </DialogContent>
  );

  const renderConversation = (selectedItem) => {
    const isInv = isFounderTalentInvitation(selectedItem);
    const otherPartyName = isInv
      ? direction === "received"
        ? selectedItem?.founderName
        : selectedItem?.talentName
      : direction === "received"
        ? selectedItem?.talentName
        : selectedItem?.founderName;
    const otherPartyNameSafe = otherPartyName ? String(otherPartyName) : "Unknown";

    return (
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto rounded-card border border-surface-border bg-surface-card shadow-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-text-heading">
            <MessageSquare className="h-5 w-5 text-primary" />
            Conversation
          </DialogTitle>
          <DialogDescription className="font-body text-sm font-normal text-text-body">
            Chat with {otherPartyNameSafe}
            {isInv && selectedItem.companyName
              ? ` from ${selectedItem.companyName}`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-input border border-primary/15 bg-primary-tint p-4">
            <div className="mb-2 flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className={INBOX_AVATAR_FALLBACK}>
                  {otherPartyNameSafe
                    .split(" ")
                    .filter(Boolean)
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-body text-sm font-semibold text-text-heading">
                    {otherPartyNameSafe}
                  </p>
                  {isInv && selectedItem.companyName ? (
                    <Badge variant="outline" className="text-xs">
                      {selectedItem.companyName}
                    </Badge>
                  ) : null}
                </div>
                <p className="font-body text-xs font-normal text-text-muted">
                  {formatInboxDateTime(
                    selectedItem.lastActivityAt ||
                      selectedItem.sentAt ||
                      selectedItem.createdAt,
                  )}
                </p>
              </div>
            </div>
            <p className="border-b border-surface-border pb-3 font-body text-sm font-normal text-text-heading">
              {selectedItem.message}
            </p>
          </div>

          {selectedItem.messages?.length > 0 ? (
            <div className="max-h-64 space-y-3 overflow-y-auto rounded-input border border-surface-border bg-surface-page p-3">
              {selectedItem.messages.map((msg, idx) => {
                const isMe = String(msg.senderId) === String(userId);
                const attachments = normalizeMessageAttachments({
                  attachments: msg.attachments,
                  content: msg.text,
                });
                return (
                  <div
                    key={`${msg.timestamp || idx}-${idx}`}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] space-y-1 ${isMe ? "text-right" : "text-left"}`}
                    >
                      <p className="font-body text-[10px] text-text-muted">{msg.sender}</p>
                      {attachments.length > 0 ? (
                        <MessageAttachmentBubble
                          attachments={attachments}
                          isMe={isMe}
                          caption={msg.text?.trim() || ""}
                        />
                      ) : null}
                      {!attachments.length && msg.text?.trim() ? (
                        <p className="rounded-input bg-primary-tint px-3 py-2 font-body text-sm text-text-body">
                          {msg.text}
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {(selectedItem.status === "pending" ||
            selectedItem.status === "proposed-by-founder" ||
            selectedItem.status === "proposed-by-talent") && (
            <div className="space-y-2 border-t border-surface-border pt-4">
              <Label className="font-body text-sm text-text-heading">Reply</Label>
              <ChatComposer
                value={responseMessage}
                onChange={setResponseMessage}
                onSend={() => actions.sendThreadMessage(selectedItem)}
                onFileSelect={setPendingFile}
                pendingFile={pendingFile}
                onClearPendingFile={() => setPendingFile(null)}
                uploading={isUploading}
                uploadProgress={uploadProgress}
                disabled={isSending}
              />
            </div>
          )}

          {isFounderInboxUser && onNavigate && getTalentId(selectedItem) ? (
            <Button
              onClick={() => actions.openTalentProfile(selectedItem)}
              variant="outline"
              className={`w-full gap-2 ${INBOX_OUTLINE_BTN}`}
            >
              <ExternalLink className="h-4 w-4 text-primary" />
              View Talent Profile
            </Button>
          ) : null}

          {selectedItem.status === "pending" && direction === "received" ? (
            <div className="space-y-3 border-t border-surface-border pt-4">
              {isTalentInboxUser ? (
                <div className="space-y-2">
                  <Button
                    onClick={() => actions.openChatForItem(selectedItem)}
                    className={`w-full ${INBOX_OUTLINE_BTN}`}
                    variant="outline"
                    disabled={isSending}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Open Chat
                  </Button>
                  {isInv ? (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setPendingInvitationAcceptance(selectedItem);
                          setAcceptanceConfirmed(false);
                        }}
                        className={`flex-1 ${INBOX_PRIMARY_BTN}`}
                        disabled={isSending}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Accept Invitation
                      </Button>
                      <Button
                        onClick={() =>
                          actions.respondToInvitation(selectedItem, "decline")
                        }
                        className={`flex-1 ${INBOX_OUTLINE_BTN}`}
                        variant="outline"
                        disabled={isSending}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Decline Invitation
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-2">
                  {onNavigate ? (
                    <Button
                      variant="outline"
                      className={`gap-1.5 ${INBOX_OUTLINE_BTN}`}
                      disabled={isSending}
                      onClick={() => actions.openChatForItem(selectedItem)}
                    >
                      <MessageCircle className="h-4 w-4 text-primary" />
                      Chat
                    </Button>
                  ) : null}
                  <div className="rounded-input border border-primary/20 bg-primary-tint p-3">
                    <p className="mb-2 font-body text-xs font-medium text-primary">
                      Ready to bring them on board?
                    </p>
                    <Button
                      onClick={() => actions.proposeMembership(selectedItem, "founder")}
                      className={`w-full ${INBOX_PRIMARY_BTN}`}
                      disabled={isSending}
                    >
                      {isSending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Handshake className="mr-2 h-4 w-4 text-white" />
                      )}
                      Propose Team Membership
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => actions.quickAcceptInterest(selectedItem)}
                      className={`flex-1 ${INBOX_PRIMARY_BTN}`}
                      disabled={isSending}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Accept
                    </Button>
                    <Button
                      onClick={() => actions.quickDeclineInterest(selectedItem)}
                      className={`flex-1 ${INBOX_OUTLINE_BTN}`}
                      variant="outline"
                      disabled={isSending}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Decline
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {selectedItem.status === "pending" &&
          direction === "sent" &&
          isTalentInboxUser &&
          !isInv ? (
            <div className={`mt-4 ${INBOX_CALLOUT}`}>
              <p className="mb-2 font-body text-xs font-medium text-primary">
                Confident this is the right fit?
              </p>
              <Button
                onClick={() => actions.proposeMembership(selectedItem, "talent")}
                className={`w-full ${INBOX_PRIMARY_BTN}`}
                disabled={isSending}
              >
                <Handshake className="mr-2 h-4 w-4" />
                Propose Myself as Team Member
              </Button>
            </div>
          ) : null}

          {selectedItem.status === "proposed-by-founder" && isTalentInboxUser ? (
            <div className={`mt-4 ${INBOX_CALLOUT}`}>
              <div className="mb-2 flex items-center gap-2">
                <Handshake className="h-5 w-5 text-primary" />
                <p className="font-heading text-sm font-semibold text-text-heading">
                  Team membership offer
                </p>
              </div>
              <p className="mb-3 font-body text-sm text-text-body">
                {selectedItem.founderName || "The founder"} has proposed you as a team
                member. Accept to join their startup.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => actions.acceptMembership(selectedItem)}
                  className={`flex-1 ${INBOX_PRIMARY_BTN}`}
                  disabled={isSending}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Accept
                </Button>
                <Button
                  onClick={() => actions.declineMembership(selectedItem)}
                  className={`flex-1 ${INBOX_OUTLINE_BTN}`}
                  variant="outline"
                  disabled={isSending}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Decline
                </Button>
              </div>
            </div>
          ) : null}

          {selectedItem.status === "proposed-by-talent" && isFounderInboxUser ? (
            <div className={`mt-4 ${INBOX_CALLOUT}`}>
              <div className="mb-2 flex items-center gap-2">
                <Handshake className="h-5 w-5 text-primary" />
                <p className="font-heading text-sm font-semibold text-text-heading">
                  Team membership proposal
                </p>
              </div>
              <p className="mb-3 font-body text-sm text-text-body">
                {selectedItem.talentName || "This talent"} is proposing to join your
                team. Accept to onboard them.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleOpenCompensationWizard(selectedItem)}
                  className={`flex-1 ${INBOX_PRIMARY_BTN}`}
                  disabled={isSending}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Accept & Onboard
                </Button>
                <Button
                  onClick={() => actions.declineMembership(selectedItem)}
                  className={`flex-1 ${INBOX_OUTLINE_BTN}`}
                  variant="outline"
                  disabled={isSending}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Decline
                </Button>
              </div>
            </div>
          ) : null}

          {(selectedItem.status === "accepted" ||
            selectedItem.status === "declined") && (
            <>
              <div
                className={`rounded-input border p-4 ${
                  selectedItem.status === "accepted"
                    ? "border-status-success/30 bg-status-success/10"
                    : "border-status-error/30 bg-status-error/10"
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  {selectedItem.status === "accepted" ? (
                    <CheckCircle2 className="h-5 w-5 text-status-success" />
                  ) : (
                    <XCircle className="h-5 w-5 text-status-error" />
                  )}
                  <p className="font-heading text-sm font-semibold text-text-heading">
                    {selectedItem.status === "accepted" ? "Accepted" : "Declined"}
                  </p>
                </div>
                {selectedItem.response ? (
                  <p className="font-body text-sm text-text-body">
                    {selectedItem.response}
                  </p>
                ) : null}
                {selectedItem.status === "accepted" &&
                isFounderInboxUser &&
                direction === "received" &&
                !isInv ? (
                  <div className="mt-3 border-t border-status-success/20 pt-3">
                    <Button
                      onClick={() => handleOpenCompensationWizard(selectedItem)}
                      className={`w-full ${INBOX_PRIMARY_BTN}`}
                      size="sm"
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Onboard Team
                    </Button>
                  </div>
                ) : null}
              </div>
              <div className="space-y-3 border-t border-surface-border pt-4">
                <Label className="font-body text-sm text-text-heading">
                  Continue conversation
                </Label>
                <Button
                  onClick={() => actions.openChatForItem(selectedItem)}
                  className={`w-full ${INBOX_PRIMARY_BTN}`}
                  disabled={isSending}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Open Chat
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    );
  };

  return (
    <>
      <Dialog
        open={open && !pendingInvitationAcceptance}
        onOpenChange={(next) => {
          if (!next) close();
        }}
      >
        {loading ? (
          <DialogContent className="max-w-sm rounded-card border border-surface-border bg-surface-card shadow-modal">
            <div className="flex items-center justify-center gap-2 py-8 font-body text-sm text-text-muted">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Loading…
            </div>
          </DialogContent>
        ) : !item ? (
          <DialogContent className="max-w-sm rounded-card border border-surface-border bg-surface-card shadow-modal">
            <DialogHeader>
              <DialogTitle className="font-heading text-text-heading">
                Item unavailable
              </DialogTitle>
              <DialogDescription className="font-body text-sm text-text-body">
                This invite or message could not be found. It may have been removed.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        ) : isOrganizationInvitation(item) ? (
          renderOrgInvite(item)
        ) : isOrgInboxMessage(item) ? (
          renderOrgMessage(item)
        ) : (
          renderConversation(item)
        )}
      </Dialog>

      <Dialog
        open={Boolean(pendingInvitationAcceptance)}
        onOpenChange={(next) => {
          if (!next) {
            setPendingInvitationAcceptance(null);
            setAcceptanceConfirmed(false);
          }
        }}
      >
        <DialogContent className="max-w-xl rounded-card border border-surface-border bg-surface-card shadow-modal">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading text-text-heading">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Review invitation terms
            </DialogTitle>
            <DialogDescription className="font-body text-sm text-text-body">
              Accepting this invitation means you confirm that you have reviewed the
              startup information, compensation or equity expectations, and the
              opportunity details shared by the startup.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className={INBOX_CALLOUT}>
              <div className="space-y-1">
                <p className="font-heading text-base font-semibold text-text-heading">
                  {pendingInvitationAcceptance?.companyName ||
                    pendingInvitationAcceptance?.startupTitle ||
                    "Startup invitation"}
                </p>
                <p className="font-body text-sm text-text-body">
                  Invited by {pendingInvitationAcceptance?.founderName || "Founder"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAcceptanceConfirmed((prev) => !prev)}
              className="flex w-full items-start gap-3 rounded-input border border-surface-border bg-surface-card p-4 text-left transition-colors duration-200 ease-in-out hover:border-primary hover:bg-primary-tint/40"
            >
              <span
                className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors duration-200 ${
                  acceptanceConfirmed
                    ? "border-primary bg-primary text-white"
                    : "border-surface-border bg-surface-card text-transparent"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
              <span>
                <span className="block font-body text-sm font-semibold text-text-heading">
                  I understand and agree to proceed based on the startup information
                  provided
                </span>
              </span>
            </button>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                className={INBOX_OUTLINE_BTN}
                onClick={handleReviewStartupBeforeAccept}
                disabled={!pendingInvitationAcceptance?.startupId}
              >
                <ExternalLink className="mr-2 h-4 w-4 text-primary" />
                Review startup post
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className={INBOX_OUTLINE_BTN}
                  onClick={() => {
                    setPendingInvitationAcceptance(null);
                    setAcceptanceConfirmed(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className={INBOX_PRIMARY_BTN}
                  disabled={!acceptanceConfirmed || isSending}
                  onClick={() => {
                    if (!pendingInvitationAcceptance) return;
                    void actions.respondToInvitation(
                      pendingInvitationAcceptance,
                      "accept",
                    );
                  }}
                >
                  {isSending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Confirm Acceptance
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {onboardingTalent ? (
        <CompensationSetupWizard
          isOpen={showOnboardingWizard}
          onClose={() => {
            setShowOnboardingWizard(false);
            setOnboardingTalent(null);
          }}
          teamMemberName={onboardingTalent.talentName}
          teamMemberId={onboardingTalent.talentId}
          founderId={userId}
          startupId={getStartupId(user)}
          onComplete={async () => {
            await actions.markInterestOnboarded(onboardingTalent.interestId);
            setShowOnboardingWizard(false);
            setOnboardingTalent(null);
          }}
        />
      ) : null}
    </>
  );
}
