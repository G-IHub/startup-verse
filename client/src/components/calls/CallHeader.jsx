import React from "react";
import { MonitorUp, Users } from "lucide-react";
import { useParticipants } from "@livekit/components-react";
import { callShell } from "./callStyles";
import {
  dedupeParticipants,
  findScreenShareParticipant,
  getParticipantName,
} from "./callParticipantUtils";

export default function CallHeader({ callTitle = "Team Call" }) {
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
    <header className={callShell.header}>
      <div className="min-w-0 flex-1">
        <h1 id="call-shell-title" className={callShell.headerTitle}>
          {callTitle}
        </h1>
        <p className={callShell.headerSubtitle}>
          {SubtitleIcon ? (
            <SubtitleIcon
              className="mr-1.5 inline h-4 w-4 -translate-y-px align-middle text-primary"
              aria-hidden
            />
          ) : null}
          {subtitle}
        </p>
      </div>
      <span className={callShell.participantPill}>
        <Users className="mr-1 inline h-3.5 w-3.5 text-primary" aria-hidden />
        <span aria-hidden>{count}</span>
        <span className="sr-only">{participantLabel}</span>
      </span>
    </header>
  );
}
