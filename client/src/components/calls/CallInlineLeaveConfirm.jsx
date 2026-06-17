import React from "react";
import { Button } from "../ui/button";

export default function CallInlineLeaveConfirm({
  open,
  isInitiator,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  const title = isInitiator ? "End call for everyone?" : "Leave call?";
  const description = isInitiator
    ? "This ends the call for all participants."
    : "You will leave the call. Others can continue.";
  const confirmLabel = isInitiator ? "End call" : "Leave call";

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel?.();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="call-leave-title"
        aria-describedby="call-leave-description"
        className="w-full max-w-sm rounded-2xl border border-surface-border bg-surface-card p-6 shadow-modal"
      >
        <h2
          id="call-leave-title"
          className="font-heading text-base font-bold text-text-heading"
        >
          {title}
        </h2>
        <p
          id="call-leave-description"
          className="mt-2 font-body text-sm text-text-body"
        >
          {description}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Stay in call
          </Button>
          <Button
            type="button"
            className="bg-status-error text-white hover:bg-status-error/90"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
