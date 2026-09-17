import React, { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import {
  Hand,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  Smile,
  Video,
  VideoOff,
} from "lucide-react";
import { Track } from "livekit-client";
import { TrackToggle, useLocalParticipant, useParticipants } from "@livekit/components-react";
import { cn } from "../../ui/utils";
import { v2CallShell } from "./v2CallStyles";
import { useCallSession } from "../CallSessionContext";
import {
  dedupeParticipants,
  getParticipantName,
  getParticipantInitial,
  isMicrophoneEnabled as participantMicOn,
} from "../callParticipantUtils";

// ── Timer ──────────────────────────────────────────────────────────────────
function useCallTimer() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ── TrackToggle wrapper ────────────────────────────────────────────────────
const ControlToggle = forwardRef(function ControlToggle(
  { source, showIcon, className, children, onDeviceError, title, style, ...rest },
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
      style={{ borderRadius: "9999px", ...style }}
      {...rest}
    >
      {children}
    </TrackToggle>
  );
});

// ── Participants popout ────────────────────────────────────────────────────
function ParticipantsPopout({ participants, teamRoster, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const presentIds = new Set(participants.map((p) => p.identity));
  const awayMembers = (teamRoster ?? []).filter((m) => {
    const id = String(m._id ?? m.id ?? m.identity ?? "");
    return !presentIds.has(id);
  });

  return (
    <div
      ref={ref}
      className="absolute bottom-full right-0 mb-2 w-[220px] rounded-[12px] border border-v2-border bg-v2-surface shadow-lg"
    >
      <div className="border-b border-v2-border px-3 py-2">
        <span className="font-body text-[11px] font-semibold text-v2-heading">In this call</span>
      </div>
      <div className="max-h-[240px] overflow-y-auto p-2">
        {participants.map((p) => {
          const name = getParticipantName(p);
          const initial = getParticipantInitial(p);
          const muted = !participantMicOn(p);
          return (
            <div key={p.sid} className="flex items-center gap-2 rounded-[8px] px-2 py-1.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-v2-blue-tint font-body text-[11px] font-semibold text-v2-blue-dark">
                {initial}
              </div>
              <span className="min-w-0 flex-1 truncate font-body text-[12px] text-v2-heading">{name}</span>
              {muted ? (
                <MicOff className="h-3 w-3 shrink-0 text-red-400" />
              ) : (
                <Mic className="h-3 w-3 shrink-0 text-v2-green" />
              )}
            </div>
          );
        })}
        {awayMembers.length > 0 && (
          <>
            <div className="my-1 border-t border-v2-border" />
            <p className="px-2 pb-1 font-body text-[10px] font-medium text-v2-subtle">Away</p>
            {awayMembers.map((m) => {
              const id = String(m._id ?? m.id ?? "");
              const name = m.name ?? m.userName ?? "Unknown";
              const initial = name[0]?.toUpperCase() ?? "?";
              return (
                <div key={id} className="flex items-center gap-2 rounded-[8px] px-2 py-1.5 opacity-50">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 font-body text-[11px] font-semibold text-gray-500">
                    {initial}
                  </div>
                  <span className="min-w-0 flex-1 truncate font-body text-[12px] text-v2-muted">{name}</span>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

// ── Reaction picker ────────────────────────────────────────────────────────
const REACTIONS = ["👍", "👏", "❤️", "😂", "🎉", "🙌"];

function ReactionPicker({ onPick, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 flex gap-1 rounded-full border border-v2-border bg-v2-surface px-3 py-2 shadow-lg"
    >
      {REACTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full text-lg hover:bg-v2-page transition-colors"
          onClick={() => { onPick(emoji); onClose(); }}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

// ── Control bar ────────────────────────────────────────────────────────────
const V2CallControlBar = forwardRef(function V2CallControlBar(
  { callType, isInitiator = false, onRequestLeave, callTitle = "" },
  micControlRef,
) {
  const isVideoCall = callType === "video";
  const { isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant();
  const allParticipants = useParticipants();
  const { teamRoster } = useCallSession();
  const timer = useCallTimer();

  const [deviceError, setDeviceError] = useState(null);
  const [handRaised, setHandRaised] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [activeReaction, setActiveReaction] = useState(null);

  const handleDeviceError = useCallback((e) => {
    setDeviceError(e?.message || "Could not access your device.");
  }, []);

  const handleReaction = useCallback((emoji) => {
    setActiveReaction(emoji);
    setTimeout(() => setActiveReaction(null), 3000);
  }, []);

  const presentCount = dedupeParticipants(allParticipants).length;
  const awayCount = Math.max(0, (teamRoster?.length ?? 0) - presentCount);
  const endCallLabel = isInitiator ? "End call" : "Leave";

  const micClass = cn(
    v2CallShell.controlIconBtn,
    !isMicrophoneEnabled && v2CallShell.controlIconBtnMuted,
  );
  const cameraClass = cn(
    v2CallShell.controlIconBtn,
    !isCameraEnabled && v2CallShell.controlIconBtnMuted,
  );
  const screenShareClass = cn(
    v2CallShell.controlIconBtn,
    isScreenShareEnabled && v2CallShell.controlIconBtnShareActive,
  );
  const handClass = cn(
    v2CallShell.controlIconBtn,
    handRaised ? "border-v2-amber/30 bg-v2-amber-tint text-v2-amber-dark" : "",
  );

  return (
    <div className="w-full px-4 py-2">
      {deviceError && (
        <p className="mb-2 rounded-xl border border-red-200 bg-v2-surface px-3 py-1.5 text-center font-body text-[11px] text-red-600">
          {deviceError}
        </p>
      )}

      <div className="flex items-center gap-3" role="toolbar" aria-label="Call controls">

        {/* LEFT — timer + session name */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="shrink-0 font-body text-[11px] font-semibold tabular-nums text-v2-heading">
            {timer}
          </span>
          {callTitle ? (
            <span className="truncate font-body text-[10px] text-v2-muted">{callTitle}</span>
          ) : null}
        </div>

        {/* CENTER — controls */}
        <div className="flex shrink-0 items-center gap-1.5">
          {/* Mic */}
          <ControlToggle
            ref={micControlRef}
            source={Track.Source.Microphone}
            showIcon={false}
            className={micClass}
            onDeviceError={handleDeviceError}
            title={isMicrophoneEnabled ? "Mute (M)" : "Unmute (M)"}
            aria-label={isMicrophoneEnabled ? "Mute microphone" : "Unmute microphone"}
          >
            {isMicrophoneEnabled ? <Mic className="h-3.5 w-3.5" aria-hidden /> : <MicOff className="h-3.5 w-3.5" aria-hidden />}
          </ControlToggle>

          {/* Camera */}
          {isVideoCall && (
            <ControlToggle
              source={Track.Source.Camera}
              showIcon={false}
              className={cameraClass}
              onDeviceError={handleDeviceError}
              title={isCameraEnabled ? "Turn off camera (V)" : "Turn on camera (V)"}
              aria-label={isCameraEnabled ? "Turn off camera" : "Turn on camera"}
            >
              {isCameraEnabled ? <Video className="h-3.5 w-3.5" aria-hidden /> : <VideoOff className="h-3.5 w-3.5" aria-hidden />}
            </ControlToggle>
          )}

          {/* Screen share */}
          {isVideoCall && (
            <ControlToggle
              source={Track.Source.ScreenShare}
              showIcon={false}
              className={screenShareClass}
              onDeviceError={handleDeviceError}
              aria-label={isScreenShareEnabled ? "Stop screen share" : "Share screen"}
            >
              {isScreenShareEnabled ? <MonitorOff className="h-3.5 w-3.5" aria-hidden /> : <Monitor className="h-3.5 w-3.5" aria-hidden />}
            </ControlToggle>
          )}

          {/* Raise hand */}
          <button
            type="button"
            className={handClass}
            onClick={() => setHandRaised((v) => !v)}
            aria-label={handRaised ? "Lower hand" : "Raise hand"}
            title={handRaised ? "Lower hand" : "Raise hand"}
          >
            <Hand className="h-3.5 w-3.5" aria-hidden />
          </button>

          {/* Reactions */}
          <div className="relative">
            {showReactions && (
              <ReactionPicker onPick={handleReaction} onClose={() => setShowReactions(false)} />
            )}
            <button
              type="button"
              className={cn(v2CallShell.controlIconBtn, activeReaction ? "border-v2-blue/25 bg-v2-blue-tint" : "")}
              onClick={() => setShowReactions((v) => !v)}
              aria-label="Send a reaction"
              title="React"
            >
              {activeReaction ? (
                <span className="text-[14px] leading-none">{activeReaction}</span>
              ) : (
                <Smile className="h-3.5 w-3.5" aria-hidden />
              )}
            </button>
          </div>

          {/* End call */}
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 font-body text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-red-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            onClick={onRequestLeave}
            aria-label={endCallLabel}
            title={endCallLabel}
          >
            <PhoneOff className="h-3 w-3" aria-hidden />
            {endCallLabel}
          </button>
        </div>

        {/* RIGHT — present / away chips */}
        <div className="relative flex flex-1 items-center justify-end gap-1.5">
          {showParticipants && (
            <ParticipantsPopout
              participants={dedupeParticipants(allParticipants)}
              teamRoster={teamRoster}
              onClose={() => setShowParticipants(false)}
            />
          )}
          <button
            type="button"
            onClick={() => setShowParticipants((v) => !v)}
            className="inline-flex items-center gap-1 rounded-full bg-v2-green-tint px-2 py-0.5 font-body text-[10px] font-medium text-v2-green-dark hover:bg-v2-green/20 transition-colors"
          >
            <span className="h-[5px] w-[5px] rounded-full bg-v2-green" />
            {presentCount} present
          </button>
          {awayCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 font-body text-[10px] font-medium text-gray-500">
              {awayCount} away
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

export default V2CallControlBar;
