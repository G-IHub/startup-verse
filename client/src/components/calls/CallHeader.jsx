import React from "react";
import { Users } from "lucide-react";
import { useParticipants } from "@livekit/components-react";
import { callShell } from "./callStyles";
import { dedupeParticipants } from "./callParticipantUtils";

export default function CallHeader({ callTitle = "Team Call" }) {
  const participants = useParticipants();
  const count = dedupeParticipants(participants).length;
  const participantLabel =
    count === 1 ? "1 participant in call" : `${count} participants in call`;

  return (
    <header className={callShell.header}>
      <div className="min-w-0 flex-1">
        <h1 id="call-shell-title" className={callShell.headerTitle}>
          {callTitle}
        </h1>
        {count <= 1 && (
          <p className={callShell.headerSubtitle}>You are in the call</p>
        )}
      </div>
      <span className={callShell.participantPill}>
        <Users className="mr-1 inline h-3.5 w-3.5 text-primary" aria-hidden />
        <span aria-hidden>{count}</span>
        <span className="sr-only">{participantLabel}</span>
      </span>
    </header>
  );
}
