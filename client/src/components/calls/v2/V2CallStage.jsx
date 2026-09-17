import React from "react";
import { v2CallShell } from "./v2CallStyles";
import { useCallStageLayout } from "../useCallStageLayout";
import V2ParticipantGrid from "./V2ParticipantGrid";
import V2SpotlightLayout from "./V2SpotlightLayout";

export default function V2CallStage({ callType }) {
  const {
    layoutMode,
    dedupedParticipants,
    mainParticipant,
    filmstripParticipants,
    speakingSet,
    isScreenSharing,
  } = useCallStageLayout({ callType });

  return (
    <div className={v2CallShell.stage}>
      {dedupedParticipants.length === 0 ? (
        <div className="flex h-full items-center justify-center font-body text-sm text-white/70">
          Connecting…
        </div>
      ) : layoutMode === "spotlight" ? (
        <V2SpotlightLayout
          mainParticipant={mainParticipant}
          filmstripParticipants={filmstripParticipants}
          speakingSet={speakingSet}
          isScreenSharing={isScreenSharing}
        />
      ) : (
        <V2ParticipantGrid
          participants={dedupedParticipants}
          speakingSet={speakingSet}
        />
      )}
    </div>
  );
}
