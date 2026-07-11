import React from "react";
import {
  spotlightFilmstripClass,
  spotlightMainClass,
} from "./callStyles";
import { getParticipantKey, isCameraEnabled, isScreenShareEnabled } from "./callParticipantUtils";
import ParticipantTile from "./ParticipantTile";

export default function SpotlightLayout({
  mainParticipant,
  filmstripParticipants,
  speakingSet,
  isScreenSharing = false,
}) {
  if (!mainParticipant) return null;

  const mainKey = getParticipantKey(mainParticipant);

  return (
    <div
      className={`flex h-full min-h-0 w-full ${
        isScreenSharing ? "flex-col" : "flex-col sm:flex-row"
      }`}
    >
      <div className={spotlightMainClass({ screenShare: isScreenSharing })}>
        <ParticipantTile
          key={`${mainKey}-${mainParticipant.sid || "main"}`}
          participant={mainParticipant}
          isSpeaking={speakingSet.has(mainKey)}
          isMain
          fillStage
          className="h-full min-h-0 rounded-lg sm:rounded-xl"
        />
      </div>

      {filmstripParticipants.length > 0 && (
        <div className={spotlightFilmstripClass({ screenShare: isScreenSharing })}>
          {filmstripParticipants.map((participant) => {
            const key = getParticipantKey(participant);
            const compact =
              !isCameraEnabled(participant) && !isScreenShareEnabled(participant);

            return (
              <ParticipantTile
                key={`${key}-${participant.sid || index}`}
                participant={participant}
                isSpeaking={speakingSet.has(key)}
                compact={compact}
                showName
                screenShareLayout={isScreenSharing}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
