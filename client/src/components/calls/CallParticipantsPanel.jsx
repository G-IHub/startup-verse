import React from "react";
import CallParticipantRoster from "./CallParticipantRoster";

export default function CallParticipantsPanel() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <CallParticipantRoster />
    </div>
  );
}
