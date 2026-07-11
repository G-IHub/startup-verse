import React from "react";
import { Track } from "livekit-client";
import {
  useIsSpeaking,
  useParticipantTracks,
  VideoTrack,
} from "@livekit/components-react";
import { cn } from "../ui/utils";
import {
  avatarFallbackClass,
  filmstripTileClass,
  tileAvatarOffClass,
  tileClass,
  tileNameLabelClass,
} from "./callStyles";
import {
  getParticipantInitial,
  getParticipantKey,
  getParticipantName,
  findParticipantTrackRef,
  trackPublicationSid,
  isCameraEnabled,
  isMicrophoneEnabled,
  isScreenShareEnabled,
} from "./callParticipantUtils";
import CallParticipantBadge from "./CallParticipantBadge";

export default function ParticipantTile({
  participant,
  isSpeaking = false,
  compact = false,
  isMain = false,
  fillStage = false,
  showName = true,
  screenShareLayout = false,
  className,
}) {
  const cameraOn = isCameraEnabled(participant);
  const screenOn = isScreenShareEnabled(participant);
  const muted = !isMicrophoneEnabled(participant);
  const name = getParticipantName(participant);
  const participantKey = getParticipantKey(participant);
  const trackIdentity = participant?.identity || participantKey;
  const liveSpeaking = useIsSpeaking(participant);
  const showSpeakingRing = isSpeaking || liveSpeaking;

  const screenTracks = useParticipantTracks(
    [Track.Source.ScreenShare],
    trackIdentity,
  );
  const screenTrack = findParticipantTrackRef(
    screenTracks,
    participant,
    Track.Source.ScreenShare,
  );

  const cameraTracks = useParticipantTracks(
    [Track.Source.Camera],
    trackIdentity,
  );
  const cameraTrack = findParticipantTrackRef(
    cameraTracks,
    participant,
    Track.Source.Camera,
  );

  const screenTrackKey = screenTrack
    ? `${participantKey}-screen-${trackPublicationSid(screenTrack)}`
    : `${participantKey}-screen-off`;
  const cameraTrackKey = cameraTrack
    ? `${participantKey}-camera-${trackPublicationSid(cameraTrack)}`
    : `${participantKey}-camera-off`;

  const tileWrapperClass = compact
    ? cn(filmstripTileClass({ screenShare: screenShareLayout }), className)
    : cn(
        tileClass({ isSpeaking: showSpeakingRing, compact, isMain, fillStage }),
        className,
      );

  const videoObjectFit = screenOn ? "object-contain" : "object-cover";

  const videoState = screenOn
    ? "presenting screen"
    : cameraOn
      ? "camera on"
      : "camera off";
  const audioState = muted ? "muted" : "microphone on";
  const tileAriaLabel = `${name}, ${audioState}, ${videoState}`;

  return (
    <div className={tileWrapperClass} aria-label={tileAriaLabel}>
      {screenOn && screenTrack ? (
        <VideoTrack
          key={screenTrackKey}
          trackRef={screenTrack}
          className={cn("h-full w-full bg-slate-950", videoObjectFit)}
        />
      ) : cameraOn && cameraTrack ? (
        <VideoTrack
          key={cameraTrackKey}
          trackRef={cameraTrack}
          className={cn("h-full w-full bg-slate-950", videoObjectFit)}
        />
      ) : (
        <div className={tileAvatarOffClass(compact)}>
          <div className={avatarFallbackClass(compact)}>
            {getParticipantInitial(participant)}
          </div>
        </div>
      )}

      {showName && !compact && (
        <CallParticipantBadge
          name={name}
          muted={muted}
          cameraOn={cameraOn}
          screenOn={screenOn}
          compact={compact}
        />
      )}

      {showName && compact && (
        <span className={tileNameLabelClass()}>{name}</span>
      )}
    </div>
  );
}
