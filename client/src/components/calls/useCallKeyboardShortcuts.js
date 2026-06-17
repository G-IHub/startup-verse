import { useEffect } from "react";
import { useLocalParticipant } from "@livekit/components-react";
import { hasBareKeyModifier, isCallTextInputFocused } from "./callFocusUtils";

export function useCallKeyboardShortcuts({
  enabled = true,
  callType,
  onRequestLeave,
  leaveDialogOpen = false,
}) {
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } =
    useLocalParticipant();
  const isVideoCall = callType === "video";

  useEffect(() => {
    if (!enabled) return undefined;

    const handleKeyDown = (event) => {
      if (!hasBareKeyModifier(event)) return;
      if (isCallTextInputFocused()) return;
      if (leaveDialogOpen && event.key === "Escape") return;

      const key = event.key.toLowerCase();

      if (key === "m") {
        event.preventDefault();
        void localParticipant?.setMicrophoneEnabled(!isMicrophoneEnabled);
        return;
      }

      if (key === "v" && isVideoCall) {
        event.preventDefault();
        void localParticipant?.setCameraEnabled(!isCameraEnabled);
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        onRequestLeave?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    enabled,
    callType,
    isVideoCall,
    isMicrophoneEnabled,
    isCameraEnabled,
    localParticipant,
    onRequestLeave,
    leaveDialogOpen,
  ]);
}
