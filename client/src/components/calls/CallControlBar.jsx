import React, { forwardRef, useCallback, useState } from "react";
import {
  MessageSquare,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  Users,
  Video,
  VideoOff,
} from "lucide-react";
import { Track } from "livekit-client";
import { TrackToggle, useLocalParticipant } from "@livekit/components-react";
import { cn } from "../ui/utils";
import { callShell } from "./callStyles";

const ControlToggle = forwardRef(function ControlToggle(
  { source, showIcon, className, children, onDeviceError, title, ...rest },
  ref,
) {
  return (
    <TrackToggle
      ref={ref}
      source={source}
      showIcon={showIcon}
      className={className}
      onDeviceError={onDeviceError}
      title={title}
      {...rest}
    >
      {children}
    </TrackToggle>
  );
});

const CallControlBar = forwardRef(function CallControlBar(
  {
    callType,
    isInitiator = false,
    onRequestLeave,
    onOpenParticipants,
    onOpenMessages,
  },
  micControlRef,
) {
  const isVideoCall = callType === "video";
  const { isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } =
    useLocalParticipant();
  const [deviceError, setDeviceError] = useState(null);

  const handleDeviceError = useCallback((error) => {
    setDeviceError(error?.message || "Could not access your device.");
  }, []);

  const endCallLabel = isInitiator ? "End call for everyone" : "Leave call";

  const micClass = cn(
    callShell.controlIconBtn,
    isMicrophoneEnabled
      ? callShell.controlIconBtnActive
      : callShell.controlIconBtnMuted,
  );

  const cameraClass = cn(
    callShell.controlIconBtn,
    isCameraEnabled
      ? callShell.controlIconBtnActive
      : callShell.controlIconBtnMuted,
  );

  const screenShareClass = cn(
    callShell.controlIconBtn,
    isScreenShareEnabled
      ? callShell.controlIconBtnShareActive
      : callShell.controlIconBtn,
  );

  return (
    <div className="flex w-full justify-center">
      <div className="relative">
      {deviceError && (
        <p className="absolute bottom-full left-1/2 mb-2 w-max max-w-[min(100vw-2rem,320px)] -translate-x-1/2 rounded-2xl border border-status-error/20 bg-surface-card px-3 py-2 text-center font-body text-xs text-status-error shadow-soft">
          {deviceError}
        </p>
      )}

      <div
        className={callShell.controlBar}
        role="toolbar"
        aria-label="Call controls"
      >
        <button
          type="button"
          className={cn(callShell.controlIconBtn, "md:hidden")}
          onClick={onOpenParticipants}
          aria-label="Open participants"
        >
          <Users className="h-5 w-5" aria-hidden />
        </button>

        <button
          type="button"
          className={cn(callShell.controlIconBtn, "md:hidden")}
          onClick={onOpenMessages}
          aria-label="Open messages"
        >
          <MessageSquare className="h-5 w-5" aria-hidden />
        </button>

        <ControlToggle
          ref={micControlRef}
          source={Track.Source.Microphone}
          showIcon={false}
          className={micClass}
          onDeviceError={handleDeviceError}
          title={isMicrophoneEnabled ? "Mute (M)" : "Unmute (M)"}
          aria-label={isMicrophoneEnabled ? "Mute microphone" : "Unmute microphone"}
        >
          {isMicrophoneEnabled ? (
            <Mic className="h-5 w-5" aria-hidden />
          ) : (
            <MicOff className="h-5 w-5" aria-hidden />
          )}
        </ControlToggle>

        {isVideoCall && (
          <ControlToggle
            source={Track.Source.Camera}
            showIcon={false}
            className={cameraClass}
            onDeviceError={handleDeviceError}
            title={isCameraEnabled ? "Turn off camera (V)" : "Turn on camera (V)"}
            aria-label={isCameraEnabled ? "Turn off camera" : "Turn on camera"}
          >
            {isCameraEnabled ? (
              <Video className="h-5 w-5" aria-hidden />
            ) : (
              <VideoOff className="h-5 w-5" aria-hidden />
            )}
          </ControlToggle>
        )}

        {isVideoCall && (
          <ControlToggle
            source={Track.Source.ScreenShare}
            showIcon={false}
            className={screenShareClass}
            onDeviceError={handleDeviceError}
            aria-label={isScreenShareEnabled ? "Stop screen share" : "Share screen"}
          >
            {isScreenShareEnabled ? (
              <MonitorOff className="h-5 w-5" aria-hidden />
            ) : (
              <Monitor className="h-5 w-5" aria-hidden />
            )}
          </ControlToggle>
        )}

        <button
          type="button"
          className={callShell.endCallBtn}
          onClick={onRequestLeave}
          aria-label={endCallLabel}
          title={endCallLabel}
        >
          <PhoneOff className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </div>
    </div>
  );
});

export default CallControlBar;
