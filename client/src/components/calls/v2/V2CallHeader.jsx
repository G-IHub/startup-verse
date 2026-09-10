import React from "react";
import { Maximize2, Minimize2, MonitorUp, Users } from "lucide-react";
import { useParticipants } from "@livekit/components-react";
import { v2CallShell } from "./v2CallStyles";
import {
  dedupeParticipants,
  findScreenShareParticipant,
  getParticipantName,
} from "../callParticipantUtils";

export default function V2CallHeader({
  callTitle = "Team Call",
  variant = "inline",
  onTogglePopout,
}) {
  const participants = useParticipants();
  const deduped = dedupeParticipants(participants);
  const count = deduped.length;
  const screenSharer = findScreenShareParticipant(participants);
  const participantLabel =
    count === 1 ? "1 participant in call" : `${count} participants in call`;

  let subtitle = "You are in the call";
  let subtitleIcon = null;

  if (screenSharer) {
    subtitle = `${getParticipantName(screenSharer)} is sharing their screen`;
    subtitleIcon = MonitorUp;
  } else if (count > 1) {
    subtitle = `${count} teammates connected`;
  } else {
    subtitle =
      "You are in the call. Invite teammates from the panel, or wait for others to join.";
  }

  const SubtitleIcon = subtitleIcon;

  return (
    <header className={v2CallShell.header}>
      <div className="min-w-0 flex-1">
        <h1 id="v2-call-shell-title" className={v2CallShell.headerTitle}>
          {callTitle}
        </h1>
        <p className={v2CallShell.headerSubtitle}>
          {SubtitleIcon ? (
            <SubtitleIcon
              className="mr-1.5 inline h-4 w-4 -translate-y-px align-middle text-v2-blue"
              aria-hidden
            />
          ) : null}
          {subtitle}
        </p>
      </div>
      <div className={v2CallShell.headerActions}>
        <span className={v2CallShell.participantPill}>
          <Users className="mr-1 inline h-3.5 w-3.5 text-v2-blue" aria-hidden />
          <span aria-hidden>{count}</span>
          <span className="sr-only">{participantLabel}</span>
        </span>
        {onTogglePopout ? (
          <button
            type="button"
            className={v2CallShell.popoutBtn}
            onClick={onTogglePopout}
            aria-label={variant === "fullpage" ? "Shrink call to inline view" : "Expand call to full page"}
            title={variant === "fullpage" ? "Shrink to inline" : "Pop out to full page"}
          >
            {variant === "fullpage" ? (
              <Minimize2 className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" aria-hidden />
            )}
          </button>
        ) : null}
      </div>
    </header>
  );
}
