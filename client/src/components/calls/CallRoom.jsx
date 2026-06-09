import React, { useMemo } from "react";
import {
  LiveKitRoom,
  VideoConference,
  useLocalParticipant,
  useParticipants,
} from "@livekit/components-react";

function MicIcon({ muted = false }) {
  if (muted) {
    return (
      <svg
        className="h-4 w-4 text-gray-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m2 2 20 20" />
        <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
        <path d="M15 9.34V5a3 3 0 0 0-5.94-.6" />
        <path d="M17 12a5 5 0 0 1-.55 2.28" />
        <path d="M7 12a5 5 0 0 0 7.54 4.29" />
        <path d="M12 19v3" />
      </svg>
    );
  }

  return (
    <svg
      className="h-4 w-4 text-[#5B5BD6]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <path d="M12 19v3" />
    </svg>
  );
}

function getParticipantName(participant) {
  return participant?.name || participant?.identity || "Unknown";
}

function getParticipantInitial(participant) {
  return getParticipantName(participant).charAt(0).toUpperCase() || "?";
}

function VoiceCallUI({ roomName, onLeave }) {
  const participants = useParticipants();
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();

  const dedupedParticipants = useMemo(() => {
    const byIdentity = new Map();

    participants.forEach((participant) => {
      const key = participant?.identity || participant?.sid;
      if (!key || byIdentity.has(key)) return;
      byIdentity.set(key, participant);
    });

    return Array.from(byIdentity.values());
  }, [participants]);

  const handleToggleMicrophone = () => {
    localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  };

  const handleLeave = () => {
    localParticipant.room?.disconnect();
    onLeave?.();
  };

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <div className="flex items-center justify-center border-b border-gray-100 px-6 py-5">
        <p className="text-base font-semibold text-[#1A1A1A]">{roomName}</p>
      </div>

      <div className="flex flex-1 flex-wrap content-start justify-center gap-4 overflow-y-auto p-6">
        {dedupedParticipants.map((participant) => {
          const participantName = getParticipantName(participant);
          const isMuted = !participant.isMicrophoneEnabled;

          return (
            <div
              key={participant.identity || participant.sid}
              className="flex w-36 flex-col items-center gap-2 rounded-xl border border-[#E0E8FF] bg-[#F4F7FF] p-5"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#5B5BD6] text-sm font-semibold text-white">
                {getParticipantInitial(participant)}
              </div>
              <p className="text-center text-sm font-medium text-[#1A1A1A]">
                {participantName}
              </p>
              <MicIcon muted={isMuted} />
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-4 border-t border-gray-100 bg-white px-6 py-4">
        <button
          type="button"
          className="h-11 w-28 rounded-lg bg-[#5B5BD6] text-sm font-semibold text-white transition-colors hover:bg-[#4a4ac4]"
          onClick={handleToggleMicrophone}
        >
          {isMicrophoneEnabled ? "Mute" : "Unmute"}
        </button>
        <button
          type="button"
          className="h-11 w-28 rounded-lg bg-[#FF3B30] text-sm font-semibold text-white transition-colors hover:bg-[#e0352a]"
          onClick={handleLeave}
        >
          Leave Call
        </button>
      </div>
    </div>
  );
}

export default function CallRoom({ token, roomName, callType, onLeave }) {
  const serverUrl = import.meta.env.VITE_LIVEKIT_URL;
  const isVideoCall = callType === "video";

  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      connect={true}
      audio={true}
      video={isVideoCall}
      onDisconnected={onLeave}
      className="h-full w-full"
    >
      {isVideoCall ? (
        <VideoConference />
      ) : (
        <VoiceCallUI roomName={roomName} onLeave={onLeave} />
      )}
    </LiveKitRoom>
  );
}
