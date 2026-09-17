import React, { useCallback, useRef } from "react";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import V2CallShell from "./V2CallShell";
import { CallSessionProvider } from "../CallSessionContext";

export default function V2CallRoom({
  token,
  roomName,
  callType,
  callTitle,
  currentUserId,
  initiatorId,
  startupId,
  userName,
  userRole,
  teamRoster = [],
  variant = "inline",
  onTogglePopout,
  onLeave,
}) {
  const serverUrl = import.meta.env.VITE_LIVEKIT_URL;
  const isVideoCall = callType === "video";
  const leavingRef = useRef(false);

  const handleLeave = useCallback(() => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    onLeave?.();
  }, [onLeave]);

  const resolvedTitle =
    callTitle ||
    `Team ${isVideoCall ? "Video" : "Voice"} Call`;

  if (!serverUrl) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-[14px] border border-v2-border bg-v2-surface p-6 text-center">
        <p className="font-heading text-lg font-semibold text-v2-heading">
          Video calling is not configured
        </p>
        <p className="font-body text-sm text-v2-muted">
          Missing VITE_LIVEKIT_URL. Contact your administrator.
        </p>
        <button
          type="button"
          className="rounded-full bg-v2-blue px-4 py-2 font-body text-sm text-white hover:bg-v2-blue-dark"
          onClick={handleLeave}
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      connect={true}
      audio={true}
      video={isVideoCall}
      className="h-full min-h-0 w-full"
      onDisconnected={handleLeave}
    >
      <RoomAudioRenderer />
      <CallSessionProvider
        roomName={roomName}
        callType={callType}
        currentUserId={currentUserId}
        initiatorId={initiatorId}
        startupId={startupId}
        userName={userName}
        userRole={userRole}
        teamRoster={teamRoster}
        onLeave={handleLeave}
      >
        <V2CallShell
          callTitle={resolvedTitle}
          callType={callType}
          variant={variant}
          onTogglePopout={onTogglePopout}
          onLeave={handleLeave}
        />
      </CallSessionProvider>
    </LiveKitRoom>
  );
}
