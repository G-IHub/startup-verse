import React, { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Mic, MicOff, UserPlus, Video, VideoOff } from "lucide-react";
import { useParticipants } from "@livekit/components-react";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import {
  dedupeParticipants,
  getParticipantKey,
  getParticipantName,
  isCameraEnabled,
  isMicrophoneEnabled,
} from "./callParticipantUtils";
import { useCallSession } from "./CallSessionContext";
import { API_BASE_URL } from "../../config/apiBase.js";
import {
  participantCardClass,
  participantListClass,
  rosterAvatarClass,
  statusDotClass,
} from "./callStyles";

const INVITE_COOLDOWN_MS = 30000;

function StatusDot({ variant, label }) {
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      <span className={statusDotClass(variant)} aria-hidden />
      <span className="font-body text-xs text-text-muted">{label}</span>
    </span>
  );
}

function InCallRow({ participant, isLocal }) {
  const name = getParticipantName(participant);
  const micOn = isMicrophoneEnabled(participant);
  const camOn = isCameraEnabled(participant);

  return (
    <li className={participantCardClass()}>
      <div className={rosterAvatarClass()}>{name.charAt(0).toUpperCase()}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-body text-sm font-medium text-text-heading">
          {name}
          {isLocal && (
            <span className="ml-1 font-normal text-text-muted">(You)</span>
          )}
        </p>
        <StatusDot variant="in-call" label="In call" />
      </div>
      <div className="flex shrink-0 items-center gap-1 text-text-muted">
        {micOn ? (
          <Mic className="h-3.5 w-3.5" aria-label="Microphone on" />
        ) : (
          <MicOff className="h-3.5 w-3.5 text-status-error" aria-label="Muted" />
        )}
        {camOn ? (
          <Video className="h-3.5 w-3.5" aria-label="Camera on" />
        ) : (
          <VideoOff className="h-3.5 w-3.5" aria-label="Camera off" />
        )}
      </div>
    </li>
  );
}

function InviteRow({ member, onInvite, onCooldown }) {
  const id = String(member.id);
  const isOnline = member.isOnline !== false;
  const cooldown = onCooldown(id);

  return (
    <li className={participantCardClass()}>
      <div className={cn(rosterAvatarClass(), !isOnline && "opacity-60")}>
        {String(member.name || "?").charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-body text-sm font-medium text-text-heading">
          {member.name || "Teammate"}
        </p>
        <StatusDot variant={isOnline ? "online" : "offline"} label={isOnline ? "Online" : "Offline"} />
      </div>
      <Button
        type="button"
        size="sm"
        className="h-8 shrink-0 gap-1 bg-primary px-2.5 text-xs text-white hover:bg-primary-hover"
        disabled={cooldown}
        onClick={() => onInvite(member)}
        aria-label={`Invite ${member.name || "teammate"} to call`}
      >
        <UserPlus className="h-3.5 w-3.5" aria-hidden />
        {cooldown ? "Sent" : "Invite"}
      </Button>
    </li>
  );
}

export default function CallParticipantRoster() {
  const { roomName, teamRoster, currentUserId } = useCallSession();
  const participants = useParticipants();
  const cooldownRef = useRef(new Map());
  const [, setCooldownTick] = useState(0);

  const inCallIds = useMemo(() => {
    const ids = new Set();
    dedupeParticipants(participants).forEach((p) => {
      const key = getParticipantKey(p);
      if (key) ids.add(key);
    });
    return ids;
  }, [participants]);

  const sortedInCall = useMemo(() => {
    const deduped = dedupeParticipants(participants);
    return [...deduped].sort((a, b) => {
      const aLocal = getParticipantKey(a) === currentUserId;
      const bLocal = getParticipantKey(b) === currentUserId;
      if (aLocal && !bLocal) return -1;
      if (!aLocal && bLocal) return 1;
      return getParticipantName(a).localeCompare(getParticipantName(b));
    });
  }, [participants, currentUserId]);

  const inviteCandidates = useMemo(() => {
    return (teamRoster || []).filter((member) => {
      const id = String(member?.id || "");
      if (!id || id === currentUserId) return false;
      return !inCallIds.has(id);
    });
  }, [teamRoster, currentUserId, inCallIds]);

  const isOnCooldown = useCallback((userId) => {
    const until = cooldownRef.current.get(userId);
    return until && until > Date.now();
  }, []);

  const handleInvite = useCallback(
    async (member) => {
      const inviteeUserId = String(member?.id || "");
      if (!inviteeUserId || isOnCooldown(inviteeUserId)) return;

      try {
        const response = await fetch(
          `${API_BASE_URL}/calls/invite/${encodeURIComponent(roomName)}`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ inviteeUserId }),
          },
        );
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error || payload?.message || "Invite failed.");
        }
        cooldownRef.current.set(inviteeUserId, Date.now() + INVITE_COOLDOWN_MS);
        setCooldownTick((n) => n + 1);
        toast.success(`Invite sent to ${member.name || "teammate"}`);
      } catch (error) {
        toast.error(error?.message || "Could not send invite.");
      }
    },
    [roomName, isOnCooldown],
  );

  return (
    <ul className={cn(participantListClass(), "min-h-0 flex-1 overflow-y-auto")}>
      {sortedInCall.map((participant) => {
        const key = getParticipantKey(participant);
        return (
          <InCallRow
            key={key}
            participant={participant}
            isLocal={key === currentUserId}
          />
        );
      })}
      {inviteCandidates.map((member) => (
        <InviteRow
          key={String(member.id)}
          member={member}
          onInvite={handleInvite}
          onCooldown={isOnCooldown}
        />
      ))}
    </ul>
  );
}
