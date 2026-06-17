import React from "react";
import { callShell } from "./callStyles";
import { useCallStageLayout } from "./useCallStageLayout";
import ParticipantGrid from "./ParticipantGrid";
import SpotlightLayout from "./SpotlightLayout";

export default function CallStage({ callType }) {
  const {
    layoutMode,
    dedupedParticipants,
    mainParticipant,
    filmstripParticipants,
    speakingSet,
    isScreenSharing,
  } = useCallStageLayout({ callType });

  return (
    <div className={callShell.stage}>
      {dedupedParticipants.length === 0 ? (
        <div className="flex h-full items-center justify-center font-body text-sm text-text-muted">
          Connecting…
        </div>
      ) : layoutMode === "spotlight" ? (
        <SpotlightLayout
          mainParticipant={mainParticipant}
          filmstripParticipants={filmstripParticipants}
          speakingSet={speakingSet}
          isScreenSharing={isScreenSharing}
        />
      ) : (
        <ParticipantGrid
          participants={dedupedParticipants}
          speakingSet={speakingSet}
        />
      )}
    </div>
  );
}
