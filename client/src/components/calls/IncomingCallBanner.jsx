import React, { useCallback, useEffect, useRef } from "react";
import { PhoneIncoming } from "lucide-react";

export default function IncomingCallBanner({ callData, onJoin, onDismiss }) {
  const joinButtonRef = useRef(null);
  const lastFocusedRoomRef = useRef(null);
  const isVisible = Boolean(callData);

  const handleJoin = useCallback(() => {
    onJoin?.();
  }, [onJoin]);

  const handleDismiss = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);

  useEffect(() => {
    if (!callData?.roomName) return;

    if (lastFocusedRoomRef.current === callData.roomName) return;
    lastFocusedRoomRef.current = callData.roomName;

    const frame = requestAnimationFrame(() => {
      joinButtonRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [callData?.roomName]);

  const initiatorName = callData?.initiatorName || "A teammate";
  const callType = callData?.callType || "video";
  const isInvite = Boolean(callData?.invited);
  const callTypeLabel = callType === "voice" ? "voice" : "video";

  const title = isInvite
    ? `${initiatorName} invited you to a ${callTypeLabel} call`
    : `${initiatorName} started a ${callTypeLabel} call`;

  return (
    <div
      className={`fixed inset-x-0 z-[1000] flex justify-center px-3 transition-all duration-300 ease-out sm:px-4 ${
        isVisible
          ? "top-14 translate-y-0 opacity-100 pointer-events-auto sm:top-16"
          : "top-0 -translate-y-full opacity-0 pointer-events-none"
      }`}
      role={isVisible ? "alertdialog" : undefined}
      aria-label={isVisible ? "Team call in progress" : undefined}
      aria-live="polite"
      aria-hidden={!isVisible}
    >
      <div className="pointer-events-auto w-full max-w-xl overflow-hidden rounded-2xl border border-surface-border bg-surface-card shadow-[0_16px_40px_rgba(15,23,42,0.14)] ring-1 ring-primary/10">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-tint text-primary">
              <PhoneIncoming className="h-5 w-5" aria-hidden />
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-heading text-sm font-semibold leading-snug text-text-heading">
                {title}
              </p>
              <p className="mt-0.5 font-body text-xs text-text-muted">
                {isInvite ? "Tap join to enter the call" : "Team call in progress"}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:pl-0 pl-14">
            <button
              ref={joinButtonRef}
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              onClick={handleJoin}
              aria-label={`Join ${callTypeLabel} call with ${initiatorName}`}
            >
              Join call
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-lg px-3 text-xs font-semibold text-text-muted transition-colors hover:bg-surface-page hover:text-text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              onClick={handleDismiss}
              aria-label="Dismiss call notification"
            >
              Dismiss
            </button>
          </div>
        </div>

        <div
          className="h-1 bg-primary/15"
          aria-hidden
        >
          <div className="h-full w-2/5 animate-pulse bg-primary/70" />
        </div>
      </div>
    </div>
  );
}
