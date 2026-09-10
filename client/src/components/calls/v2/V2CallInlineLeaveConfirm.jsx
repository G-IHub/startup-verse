import React from "react";
import { Button } from "../../ui/button";

export default function V2CallInlineLeaveConfirm({
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
        aria-labelledby="v2-call-leave-title"
        aria-describedby="v2-call-leave-description"
        className="w-full max-w-sm rounded-2xl border border-v2-border bg-v2-surface p-6 shadow-lg"
      >
        <h2
          id="v2-call-leave-title"
          className="font-heading text-base font-bold text-v2-heading"
        >
          {title}
        </h2>
        <p
          id="v2-call-leave-description"
          className="mt-2 font-body text-sm text-v2-muted"
        >
          {description}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Stay in call
          </Button>
          <Button
            type="button"
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
