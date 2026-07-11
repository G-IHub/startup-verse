import React, { useCallback, useRef } from "react";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import CallShell from "./CallShell";
import { CallSessionProvider } from "./CallSessionContext";

export default function CallRoom({
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
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-white p-6 text-center">
        <p className="font-heading text-lg font-semibold text-text-heading">
          Video calling is not configured
        </p>
        <p className="font-body text-sm text-text-muted">
          Missing VITE_LIVEKIT_URL. Contact your administrator.
        </p>
        <button
          type="button"
          className="rounded-lg bg-primary px-4 py-2 font-body text-sm text-white"
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
      data-lk-theme="default"
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
        <CallShell
          callTitle={resolvedTitle}
          callType={callType}
          onLeave={handleLeave}
        />
      </CallSessionProvider>
    </LiveKitRoom>
  );
}
