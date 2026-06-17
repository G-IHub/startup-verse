import React, { useCallback, useEffect, useRef, useState } from "react";
import { ConnectionState } from "livekit-client";
import * as FocusScope from "@radix-ui/react-focus-scope";
import { useChat, useConnectionState, useLocalParticipant } from "@livekit/components-react";
import { callShell } from "./callStyles";
import { cn } from "../ui/utils";
import CallHeader from "./CallHeader";
import CallStage from "./CallStage";
import CallControlBar from "./CallControlBar";
import CallSidePanel from "./CallSidePanel";
import CallSideDrawer from "./CallSideDrawer";
import CallLeaveDialog from "./CallLeaveDialog";
import { useCallSession } from "./CallSessionContext";
import { useCallPresence } from "./useCallPresence";
import { useCallKeyboardShortcuts } from "./useCallKeyboardShortcuts";

export default function CallShell({ callTitle, callType, onLeave }) {
  const connectionState = useConnectionState();
  const { localParticipant } = useLocalParticipant();
  const { chatMessages } = useChat();
  const {
    currentUserId,
    startupId,
    userName,
    userRole,
    isInitiator,
  } = useCallSession();

  const [wasConnected, setWasConnected] = useState(false);
  const [activeTab, setActiveTab] = useState("participants");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const micControlRef = useRef(null);
  const previousFocusRef = useRef(null);

  useCallPresence({
    userId: currentUserId,
    userName,
    role: userRole,
    startupId,
    isInCall: true,
    connectionState,
  });

  useEffect(() => {
    if (connectionState === ConnectionState.Connected) {
      setWasConnected(true);
    }
  }, [connectionState]);

  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    const frame = requestAnimationFrame(() => {
      const control = micControlRef.current;
      if (control && typeof control.focus === "function") {
        control.focus();
      }
    });

    return () => {
      cancelAnimationFrame(frame);
      const previous = previousFocusRef.current;
      if (previous instanceof HTMLElement && previous.isConnected) {
        previous.focus();
      }
    };
  }, []);

  const isConnecting = connectionState === ConnectionState.Connecting;
  const isReconnecting = connectionState === ConnectionState.Reconnecting;
  const isDisconnected =
    wasConnected && connectionState === ConnectionState.Disconnected;
  const isConnected = connectionState === ConnectionState.Connected;

  let overlayMessage = null;
  if (isConnecting) overlayMessage = "Connecting…";
  else if (isReconnecting) overlayMessage = "Reconnecting…";
  else if (isDisconnected) overlayMessage = "Connection lost";

  const openDrawerTab = (tab) => {
    setActiveTab(tab);
    setDrawerOpen(true);
  };

  const handleRequestLeave = useCallback(() => {
    setLeaveDialogOpen(true);
  }, []);

  const handleConfirmLeave = useCallback(() => {
    setLeaveDialogOpen(false);
    localParticipant?.room?.disconnect();
    onLeave?.();
  }, [localParticipant, onLeave]);

  useCallKeyboardShortcuts({
    enabled: isConnected && !leaveDialogOpen,
    callType,
    onRequestLeave: handleRequestLeave,
    leaveDialogOpen,
  });

  return (
    <FocusScope.Root trapped loop asChild>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="call-shell-title"
        className={callShell.root}
      >
        <CallHeader callTitle={callTitle} />

        <div className={callShell.bodyRow}>
          <div className={callShell.stageCard}>
            <CallStage callType={callType} />
            {overlayMessage && (
              <div
                className={callShell.stageOverlay}
                role="status"
                aria-live="polite"
              >
                {overlayMessage}
              </div>
            )}
          </div>

          <div className={callShell.sidePanelCard}>
            <CallSidePanel
              activeTab={activeTab}
              onTabChange={setActiveTab}
              messageCount={chatMessages.length}
            />
          </div>
        </div>

        <div className={cn(callShell.controlFloat, "relative")}>
          <CallControlBar
            ref={micControlRef}
            callType={callType}
            isInitiator={isInitiator}
            onRequestLeave={handleRequestLeave}
            onOpenParticipants={() => openDrawerTab("participants")}
            onOpenMessages={() => openDrawerTab("messages")}
          />
        </div>

        <CallSideDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          messageCount={chatMessages.length}
        />

        <CallLeaveDialog
          open={leaveDialogOpen}
          onOpenChange={setLeaveDialogOpen}
          isInitiator={isInitiator}
          onConfirm={handleConfirmLeave}
        />
      </div>
    </FocusScope.Root>
  );
}
