import { useCallback, useRef, useState } from "react";

const SWIPE_THRESHOLD = 56;
const MAX_SWIPE_OFFSET = 72;
const VERTICAL_CANCEL = 24;

export function useSwipeToReply({ enabled, onReply }) {
  const [offsetX, setOffsetX] = useState(0);
  const startRef = useRef(null);
  const triggeredRef = useRef(false);

  const reset = useCallback(() => {
    startRef.current = null;
    triggeredRef.current = false;
    setOffsetX(0);
  }, []);

  const onTouchStart = useCallback(
    (e) => {
      if (!enabled) return;
      const touch = e.touches[0];
      if (!touch) return;
      startRef.current = { x: touch.clientX, y: touch.clientY };
      triggeredRef.current = false;
      setOffsetX(0);
    },
    [enabled],
  );

  const onTouchMove = useCallback(
    (e) => {
      if (!enabled || !startRef.current) return;
      const touch = e.touches[0];
      if (!touch) return;
      const deltaX = touch.clientX - startRef.current.x;
      const deltaY = touch.clientY - startRef.current.y;
      if (Math.abs(deltaY) > VERTICAL_CANCEL && Math.abs(deltaY) > Math.abs(deltaX)) {
        reset();
        return;
      }
      if (deltaX > 0) {
        setOffsetX(Math.min(deltaX, MAX_SWIPE_OFFSET));
      }
    },
    [enabled, reset],
  );

  const onTouchEnd = useCallback(
    (e) => {
      if (!enabled || !startRef.current) {
        reset();
        return;
      }
      const touch = e.changedTouches[0];
      if (!touch) {
        reset();
        return;
      }
      const deltaX = touch.clientX - startRef.current.x;
      const deltaY = touch.clientY - startRef.current.y;
      if (
        deltaX >= SWIPE_THRESHOLD &&
        Math.abs(deltaY) < VERTICAL_CANCEL &&
        !triggeredRef.current
      ) {
        triggeredRef.current = true;
        onReply?.();
      }
      reset();
    },
    [enabled, onReply, reset],
  );

  const onTouchCancel = useCallback(() => {
    reset();
  }, [reset]);

  return {
    offsetX,
    swipeHandlers: enabled
      ? {
          onTouchStart,
          onTouchMove,
          onTouchEnd,
          onTouchCancel,
        }
      : {},
  };
}
