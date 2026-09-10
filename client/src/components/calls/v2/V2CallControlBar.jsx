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
import { cn } from "../../ui/utils";
import { v2CallShell } from "./v2CallStyles";

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

const V2CallControlBar = forwardRef(function V2CallControlBar(
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
    v2CallShell.controlIconBtn,
    isMicrophoneEnabled
      ? v2CallShell.controlIconBtnActive
      : v2CallShell.controlIconBtnMuted,
  );

  const cameraClass = cn(
    v2CallShell.controlIconBtn,
    isCameraEnabled
      ? v2CallShell.controlIconBtnActive
      : v2CallShell.controlIconBtnMuted,
  );

  const screenShareClass = cn(
    v2CallShell.controlIconBtn,
    isScreenShareEnabled
      ? v2CallShell.controlIconBtnShareActive
      : v2CallShell.controlIconBtn,
  );

  return (
    <div className="flex w-full justify-center">
      <div className="relative">
        {deviceError && (
          <p className="absolute bottom-full left-1/2 mb-2 w-max max-w-[min(100vw-2rem,320px)] -translate-x-1/2 rounded-2xl border border-red-200 bg-v2-surface px-3 py-2 text-center font-body text-xs text-red-600 shadow-sm">
            {deviceError}
          </p>
        )}

        <div
          className={v2CallShell.controlBar}
          role="toolbar"
          aria-label="Call controls"
        >
          <button
            type="button"
            className={cn(v2CallShell.controlIconBtn, "md:hidden")}
            onClick={onOpenParticipants}
            aria-label="Open participants"
          >
            <Users className="h-5 w-5" aria-hidden />
          </button>

          <button
            type="button"
            className={cn(v2CallShell.controlIconBtn, "md:hidden")}
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
            className={v2CallShell.endCallBtn}
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

export default V2CallControlBar;
