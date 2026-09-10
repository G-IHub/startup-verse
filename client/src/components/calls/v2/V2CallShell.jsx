import React, { useCallback, useEffect, useRef, useState } from "react";
import { ConnectionState } from "livekit-client";
import * as FocusScope from "@radix-ui/react-focus-scope";
import {
  useChat,
  useConnectionState,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import { v2CallShell } from "./v2CallStyles";
import V2CallHeader from "./V2CallHeader";
import V2CallStage from "./V2CallStage";
import V2CallControlBar from "./V2CallControlBar";
import V2CallCollapsibleSidePanel from "./V2CallCollapsibleSidePanel";
import V2CallInlineLeaveConfirm from "./V2CallInlineLeaveConfirm";
import { useCallSession } from "../CallSessionContext";
import { useCallPresence } from "../useCallPresence";
import { useCallKeyboardShortcuts } from "../useCallKeyboardShortcuts";
import { useCallSidePanelCollapsed } from "../useCallSidePanelCollapsed";

/**
 * V2 restyle of calls/CallShell.jsx. Adds a `variant` ("inline" | "fullpage")
 * so the same session/stage/controls can render embedded in a dashboard card
 * (no focus trap, fills its container) or as a full-page in-app view (focus
 * trapped like a dialog). `onTogglePopout` renders the pop-out/pop-in icon in
 * the header — the caller owns where "fullpage" actually gets mounted.
 */
export default function V2CallShell({
  callTitle,
  callType,
  onLeave,
  variant = "inline",
  onTogglePopout,
}) {
  const connectionState = useConnectionState();
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const { chatMessages } = useChat();
  const {
    currentUserId,
    startupId,
    userName,
    userRole,
    isInitiator,
    roomName,
    callType: sessionCallType,
  } = useCallSession();

  const [wasConnected, setWasConnected] = useState(false);
  const [activeTab, setActiveTab] = useState("participants");
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const { collapsed: sidePanelCollapsed, toggleCollapsed: toggleSidePanel, setCollapsed } =
    useCallSidePanelCollapsed();
  const micControlRef = useRef(null);
  const previousFocusRef = useRef(null);
  const isFullpage = variant === "fullpage";

  useCallPresence({
    userId: currentUserId,
    userName,
    role: userRole,
    startupId,
    roomName,
    callType: sessionCallType,
    isInCall: true,
  });

  useEffect(() => {
    if (connectionState === ConnectionState.Connected) {
      setWasConnected(true);
    }
  }, [connectionState]);

  useEffect(() => {
    if (!isFullpage) return undefined;
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
  }, [isFullpage]);

  const isConnecting = connectionState === ConnectionState.Connecting;
  const isReconnecting = connectionState === ConnectionState.Reconnecting;
  const isDisconnected =
    wasConnected && connectionState === ConnectionState.Disconnected;
  const isConnected = connectionState === ConnectionState.Connected;

  let overlayMessage = null;
  if (isConnecting) overlayMessage = "Connecting…";
  else if (isReconnecting) overlayMessage = "Reconnecting…";
  else if (isDisconnected) overlayMessage = "Connection lost";

  const openSidePanelTab = (tab) => {
    setActiveTab(tab);
    setCollapsed?.(false);
  };

  const handleRequestLeave = useCallback(() => {
    setLeaveDialogOpen(true);
  }, []);

  const handleConfirmLeave = useCallback(() => {
    setLeaveDialogOpen(false);
    void room?.disconnect(true);
    onLeave?.();
  }, [room, onLeave]);

  useCallKeyboardShortcuts({
    enabled: isFullpage && isConnected && !leaveDialogOpen,
    callType,
    onRequestLeave: handleRequestLeave,
    leaveDialogOpen,
  });

  const shell = (
    <div
      role={isFullpage ? "dialog" : undefined}
      aria-modal={isFullpage ? "true" : undefined}
      aria-labelledby="v2-call-shell-title"
      className={v2CallShell.root}
    >
      <V2CallHeader
        callTitle={callTitle}
        variant={variant}
        onTogglePopout={onTogglePopout}
      />

      <div className={v2CallShell.bodyRow}>
        <div className={v2CallShell.videoColumn}>
          <div className={v2CallShell.videoMain}>
            <div className={v2CallShell.stageCard}>
              <V2CallStage callType={callType} />
              {overlayMessage && (
                <div
                  className={v2CallShell.stageOverlay}
                  role="status"
                  aria-live="polite"
                >
                  {overlayMessage}
                </div>
              )}
            </div>

            <div className={v2CallShell.controlsRow}>
              <V2CallControlBar
                ref={micControlRef}
                callType={callType}
                isInitiator={isInitiator}
                onRequestLeave={handleRequestLeave}
                onOpenParticipants={() => openSidePanelTab("participants")}
                onOpenMessages={() => openSidePanelTab("messages")}
              />
            </div>
          </div>
        </div>

        <V2CallCollapsibleSidePanel
          collapsed={sidePanelCollapsed}
          onToggle={toggleSidePanel}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          messageCount={chatMessages.length}
        />
      </div>

      <V2CallInlineLeaveConfirm
        open={leaveDialogOpen}
        isInitiator={isInitiator}
        onCancel={() => setLeaveDialogOpen(false)}
        onConfirm={handleConfirmLeave}
      />
    </div>
  );

  if (!isFullpage) return shell;

  return (
    <FocusScope.Root trapped={!leaveDialogOpen} loop asChild>
      {shell}
    </FocusScope.Root>
  );
}
