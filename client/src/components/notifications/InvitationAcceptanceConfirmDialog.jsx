import React, { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  INBOX_CALLOUT,
  INBOX_OUTLINE_BTN,
  INBOX_PRIMARY_BTN,
} from "../../utils/inboxNormalize";

/**
 * Confirmation step before a talent accepts a founder-talent invitation.
 * Matches the review flow in the notification invite detail modal.
 */
export default function InvitationAcceptanceConfirmDialog({
  open = false,
  onOpenChange,
  invitation = null,
  isSending = false,
  onConfirm,
  onReviewStartup,
  showReviewStartup = true,
}) {
  const [acceptanceConfirmed, setAcceptanceConfirmed] = useState(false);

  useEffect(() => {
    if (!open) setAcceptanceConfirmed(false);
  }, [open]);

  const startupTitle =
    invitation?.companyName ||
    invitation?.startupTitle ||
    "Startup invitation";
  const founderName = invitation?.founderName || "Founder";
  const canReviewStartup =
    showReviewStartup && Boolean(onReviewStartup) && Boolean(invitation?.startupId);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setAcceptanceConfirmed(false);
        onOpenChange?.(next);
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
                {startupTitle}
              </p>
              <p className="font-body text-sm text-text-body">
                Invited by {founderName}
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
            {canReviewStartup ? (
              <Button
                type="button"
                variant="outline"
                className={INBOX_OUTLINE_BTN}
                onClick={onReviewStartup}
              >
                <ExternalLink className="mr-2 h-4 w-4 text-primary" />
                Review startup post
              </Button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className={INBOX_OUTLINE_BTN}
                onClick={() => onOpenChange?.(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className={INBOX_PRIMARY_BTN}
                disabled={!acceptanceConfirmed || isSending}
                onClick={() => {
                  if (!acceptanceConfirmed || !invitation) return;
                  void onConfirm?.(invitation);
                }}
              >
                {isSending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Confirm acceptance
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
