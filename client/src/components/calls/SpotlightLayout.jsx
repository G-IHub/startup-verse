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
}) {
  if (!mainParticipant) return null;

  const mainKey = getParticipantKey(mainParticipant);

  return (
    <div className="flex h-full min-h-0 w-full flex-col sm:flex-row">
      <div className={spotlightMainClass()}>
        <ParticipantTile
          participant={mainParticipant}
          isSpeaking={speakingSet.has(mainKey)}
          isMain
          className="h-full min-h-[200px]"
        />
      </div>

      {filmstripParticipants.length > 0 && (
        <div className={spotlightFilmstripClass()}>
          {filmstripParticipants.map((participant) => {
            const key = getParticipantKey(participant);
            const compact =
              !isCameraEnabled(participant) && !isScreenShareEnabled(participant);

            return (
              <ParticipantTile
                key={key}
                participant={participant}
                isSpeaking={speakingSet.has(key)}
                compact={compact}
                showName
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
