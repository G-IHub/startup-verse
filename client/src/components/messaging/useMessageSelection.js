import { useCallback, useRef, useState } from "react";
import { isServerMessageId } from "../../utils/messaging";

const LONG_PRESS_MS = 450;
const MOVE_CANCEL_PX = 10;

export function useMessageSelection({ onSelectionModeChange } = {}) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const setMode = useCallback(
    (active) => {
      setSelectionMode(active);
      onSelectionModeChange?.(active);
    },
    [onSelectionModeChange],
  );

  const enterSelection = useCallback(
    (messageId) => {
      if (!isServerMessageId(messageId)) return;
      setMode(true);
      setSelectedIds(new Set([String(messageId)]));
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(10);
      }
    },
    [setMode],
  );

  const toggleSelect = useCallback((messageId) => {
    if (!isServerMessageId(messageId)) return;
    const id = String(messageId);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const cancelSelection = useCallback(() => {
    setSelectedIds(new Set());
    setMode(false);
  }, [setMode]);

  const isSelected = useCallback(
    (messageId) => selectedIds.has(String(messageId)),
    [selectedIds],
  );

  const getSelectedMessages = useCallback(
    (messages) =>
      messages.filter(
        (m) => isServerMessageId(m.id) && selectedIds.has(String(m.id)),
      ),
    [selectedIds],
  );

  return {
    selectionMode,
    selectedIds,
    selectedCount: selectedIds.size,
    enterSelection,
    toggleSelect,
    cancelSelection,
    isSelected,
    getSelectedMessages,
  };
}

export function useLongPress({ onLongPress, onTap, disabled }) {
  const timerRef = useRef(null);
  const movedRef = useRef(false);
  const firedRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onTouchStart = useCallback(
    (e) => {
      if (disabled) return;
      movedRef.current = false;
      firedRef.current = false;
      clearTimer();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (!movedRef.current) {
          firedRef.current = true;
          onLongPress?.(e);
        }
      }, LONG_PRESS_MS);
    },
    [clearTimer, disabled, onLongPress],
  );

  const onTouchMove = useCallback(() => {
    if (!movedRef.current) {
      movedRef.current = true;
      clearTimer();
    }
  }, [clearTimer]);

  const onTouchEnd = useCallback(
    (e) => {
      const pending = timerRef.current !== null;
      clearTimer();
      if (!firedRef.current && !movedRef.current && pending && onTap) {
        onTap(e);
      }
      movedRef.current = false;
      firedRef.current = false;
    },
    [clearTimer, onTap],
  );

  const onTouchCancel = useCallback(() => {
    clearTimer();
    movedRef.current = false;
    firedRef.current = false;
  }, [clearTimer]);

  return {
    longPressHandlers: disabled
      ? {}
      : {
          onTouchStart,
          onTouchMove,
          onTouchEnd,
          onTouchCancel,
        },
  };
}
