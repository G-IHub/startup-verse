import React from "react";
import { Reply } from "lucide-react";
import { cn } from "../ui/utils";
import { useSwipeToReply } from "./useSwipeToReply";
import { swipeReplyIconClass, swipeReplyTrackClass } from "./chatStyles";

export function SwipeableMessageRow({
  enabled,
  isMe,
  onReply,
  onTouchHandlers,
  children,
  className,
}) {
  const { offsetX, swipeHandlers } = useSwipeToReply({
    enabled,
    onReply,
  });

  const mergedHandlers = enabled
    ? {
        onTouchStart: (e) => {
          swipeHandlers.onTouchStart?.(e);
          onTouchHandlers?.onTouchStart?.(e);
        },
        onTouchMove: (e) => {
          swipeHandlers.onTouchMove?.(e);
          onTouchHandlers?.onTouchMove?.(e);
        },
        onTouchEnd: (e) => {
          swipeHandlers.onTouchEnd?.(e);
          onTouchHandlers?.onTouchEnd?.(e);
        },
        onTouchCancel: (e) => {
          swipeHandlers.onTouchCancel?.(e);
          onTouchHandlers?.onTouchCancel?.(e);
        },
      }
    : onTouchHandlers || {};

  return (
    <div
      className={cn("relative w-full touch-pan-y", className)}
      {...mergedHandlers}
    >
      {enabled && (
        <div
          className={cn(
            swipeReplyTrackClass(isMe),
            isMe ? "right-0 justify-end pr-1" : "left-0 justify-start pl-1",
          )}
          aria-hidden
        >
          <div
            className={swipeReplyIconClass(offsetX >= 40)}
            style={{ opacity: Math.min(1, offsetX / 40) }}
          >
            <Reply className="h-4 w-4" />
          </div>
        </div>
      )}
      <div
        className="relative z-[1] transition-transform duration-150 ease-out"
        style={{ transform: offsetX > 0 ? `translateX(${offsetX}px)` : undefined }}
      >
        {children}
      </div>
    </div>
  );
}

export default SwipeableMessageRow;
