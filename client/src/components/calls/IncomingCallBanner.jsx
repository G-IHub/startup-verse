import React, { useCallback, useEffect, useRef } from "react";
import { PhoneIncoming } from "lucide-react";

const AUTO_DISMISS_MS = 30000;

export default function IncomingCallBanner({ callData, onJoin, onDismiss }) {
  const timerRef = useRef(null);
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

  const initiatorName = callData?.initiatorName || "A teammate";
  const callType = callData?.callType || "team";
  const roomName = callData?.roomName || "";

  return (
    <div
      className={`fixed left-0 right-0 top-0 z-[1000] flex justify-center px-3 transition-all duration-300 ease-out sm:px-4 ${
        isVisible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "-translate-y-full opacity-0 pointer-events-none"
      }`}
      aria-live="polite"
      aria-hidden={!isVisible}
    >
      <div className="flex w-full items-center gap-3 rounded-b-2xl border-l-4 border-l-[#FF6B00] bg-white px-4 py-3 shadow-[0_14px_36px_rgba(15,23,42,0.16)] sm:max-w-[420px]">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFF0E6] text-[#FF6B00]">
          <PhoneIncoming className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#1A1A1A]">
            {initiatorName} started a {callType} call
          </p>
          {roomName ? (
            <p className="mt-0.5 truncate text-xs font-medium text-gray-500">
              {roomName}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="h-9 rounded-lg bg-[#FF6B00] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#e86100]"
            onClick={handleJoin}
          >
            Join
          </button>
          <button
            type="button"
            className="h-9 rounded-lg px-3 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            onClick={handleDismiss}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
