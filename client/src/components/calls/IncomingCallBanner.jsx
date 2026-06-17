import React, { useCallback, useEffect, useRef } from "react";
import { PhoneIncoming } from "lucide-react";

const AUTO_DISMISS_MS = 30000;

export default function IncomingCallBanner({ callData, onJoin, onDismiss }) {
  const timerRef = useRef(null);
  const joinButtonRef = useRef(null);
  const lastFocusedRoomRef = useRef(null);
  const isVisible = Boolean(callData);

  const clearDismissTimer = useCallback(() => {
    if (!timerRef.current) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const handleDismiss = useCallback(() => {
    clearDismissTimer();
    onDismiss?.();
  }, [clearDismissTimer, onDismiss]);

  const handleJoin = useCallback(() => {
    clearDismissTimer();
    onJoin?.();
  }, [clearDismissTimer, onJoin]);

  useEffect(() => {
    clearDismissTimer();

    if (!callData) return undefined;

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      onDismiss?.();
    }, AUTO_DISMISS_MS);

    return clearDismissTimer;
  }, [callData, clearDismissTimer, onDismiss]);

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
      className={`fixed left-0 right-0 top-0 z-[1000] flex justify-center px-3 transition-all duration-300 ease-out sm:px-4 ${
        isVisible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "-translate-y-full opacity-0 pointer-events-none"
      }`}
      role={isVisible ? "alertdialog" : undefined}
      aria-label={isVisible ? "Incoming call" : undefined}
      aria-live="polite"
      aria-hidden={!isVisible}
    >
      <div className="flex w-full items-center gap-3 rounded-b-2xl border-l-4 border-l-[#FF6B00] bg-white px-4 py-3 shadow-[0_14px_36px_rgba(15,23,42,0.16)] sm:max-w-[420px]">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFF0E6] text-[#FF6B00]">
          <PhoneIncoming className="h-5 w-5" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#1A1A1A]">{title}</p>
          <p className="mt-0.5 font-body text-xs text-text-muted">
            {isInvite ? "Tap join to enter the call" : "Team call in progress"}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            ref={joinButtonRef}
            type="button"
            className="h-9 rounded-lg bg-[#FF6B00] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#e86100]"
            onClick={handleJoin}
            aria-label={`Join ${callTypeLabel} call with ${initiatorName}`}
          >
            Join
          </button>
          <button
            type="button"
            className="h-9 rounded-lg px-3 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            onClick={handleDismiss}
            aria-label="Dismiss incoming call"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
