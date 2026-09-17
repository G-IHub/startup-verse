import React, { useEffect, useRef, useState } from "react";
import { Maximize2, Mic, MicOff, Minimize2, MonitorUp } from "lucide-react";
import { useParticipants } from "@livekit/components-react";
import { v2CallShell } from "./v2CallStyles";
import { useCallSession } from "../CallSessionContext";
import {
  dedupeParticipants,
  findScreenShareParticipant,
  getParticipantName,
  getParticipantInitial,
  isMicrophoneEnabled as participantMicOn,
} from "../callParticipantUtils";

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

// ── Participants dropdown ──────────────────────────────────────────────────
function ParticipantsDropdown({ participants, teamRoster, onClose }) {
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
      className="absolute right-0 top-full z-50 mt-1.5 w-[220px] rounded-[12px] border border-v2-border bg-v2-surface shadow-lg"
    >
      <div className="border-b border-v2-border px-3 py-2">
        <span className="font-body text-[11px] font-semibold text-v2-heading">In this call</span>
      </div>
      <div className="max-h-[260px] overflow-y-auto p-2">
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

// ── Header ─────────────────────────────────────────────────────────────────
export default function V2CallHeader({
  callTitle = "Team Call",
  variant = "inline",
  onTogglePopout,
}) {
  const participants = useParticipants();
  const deduped = dedupeParticipants(participants);
  const count = deduped.length;
  const screenSharer = findScreenShareParticipant(participants);
  const timer = useCallTimer();
  const { teamRoster } = useCallSession();
  const [showParticipants, setShowParticipants] = useState(false);

  let subtitle = "Waiting for teammates to join…";
  if (screenSharer) {
    subtitle = `${getParticipantName(screenSharer)} is sharing their screen`;
  } else if (count > 1) {
    subtitle = `${count} people in the call`;
  }

  return (
    <header className="flex shrink-0 items-center justify-between gap-2 border-b border-v2-border bg-v2-surface px-3 py-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <h1 id="v2-call-shell-title" className="font-heading text-[12px] font-semibold leading-none text-v2-heading">
          {callTitle}
        </h1>
        <span className="inline-flex items-center gap-1 rounded-full bg-v2-green-tint px-2 py-[2px] font-body text-[10px] font-semibold text-v2-green-dark">
          <span className="h-[5px] w-[5px] animate-pulse rounded-full bg-v2-green" />
          Live · {timer}
        </span>
        <span className="truncate font-body text-[10px] text-v2-muted">
          {screenSharer && (
            <MonitorUp className="mr-1 inline h-3 w-3 -translate-y-px text-v2-blue" aria-hidden />
          )}
          {subtitle}
        </span>
      </div>

      <div className="relative flex shrink-0 items-center gap-1.5">
        {/* Clickable "N present" chip */}
        <button
          type="button"
          onClick={() => setShowParticipants((v) => !v)}
          className="inline-flex items-center gap-1 rounded-full border border-v2-border bg-v2-page px-2 py-0.5 font-body text-[10px] font-medium text-v2-heading transition-colors hover:border-v2-blue/30 hover:bg-v2-blue-tint hover:text-v2-blue-dark"
          aria-label="Show participants"
        >
          <span className="h-[5px] w-[5px] rounded-full bg-v2-green" />
          {count} present
        </button>

        {showParticipants && (
          <ParticipantsDropdown
            participants={deduped}
            teamRoster={teamRoster}
            onClose={() => setShowParticipants(false)}
          />
        )}

        {onTogglePopout ? (
          <button
            type="button"
            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-v2-border bg-v2-page text-v2-muted transition-colors hover:border-v2-blue/40 hover:bg-v2-blue-tint hover:text-v2-blue-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v2-blue/30"
            onClick={onTogglePopout}
            aria-label={variant === "fullpage" ? "Shrink call to inline view" : "Expand call to full page"}
            title={variant === "fullpage" ? "Shrink to inline" : "Pop out to full page"}
          >
            {variant === "fullpage" ? (
              <Minimize2 className="h-3 w-3" aria-hidden />
            ) : (
              <Maximize2 className="h-3 w-3" aria-hidden />
            )}
          </button>
        ) : null}
      </div>
    </header>
  );
}
