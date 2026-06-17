import React from "react";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import { participantBadgeClass } from "./callStyles";

export default function CallParticipantBadge({
  name,
  muted,
  cameraOn,
  screenOn,
  compact = false,
}) {
  if (compact) return null;

  const label = screenOn ? "Presenting" : name;

  return (
    <div className={participantBadgeClass()}>
      <span className="truncate font-body text-xs font-medium text-white">{label}</span>
      <span className="flex shrink-0 items-center gap-1 text-white/90">
        {muted ? (
          <MicOff className="h-3 w-3" aria-hidden />
        ) : (
          <Mic className="h-3 w-3" aria-hidden />
        )}
        {screenOn ? (
          <Video className="h-3 w-3" aria-hidden />
        ) : cameraOn ? (
          <Video className="h-3 w-3" aria-hidden />
        ) : (
          <VideoOff className="h-3 w-3" aria-hidden />
        )}
      </span>
    </div>
  );
}
