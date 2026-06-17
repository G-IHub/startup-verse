import { useEffect, useMemo, useRef, useState } from "react";
import {
  useLocalParticipant,
  useParticipants,
  useSpeakingParticipants,
} from "@livekit/components-react";
import {
  anyParticipantVideoOn,
  dedupeParticipants,
  findScreenShareParticipant,
  isCameraEnabled,
  isScreenShareEnabled,
  pickMainParticipant,
} from "./callParticipantUtils";

const SPEAKER_DEBOUNCE_MS = 250;

export function useCallStageLayout({ callType, forceGrid = false } = {}) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const speakingParticipants = useSpeakingParticipants();

  const dedupedParticipants = useMemo(
    () => dedupeParticipants(participants),
    [participants],
  );

  const [debouncedSpeaker, setDebouncedSpeaker] = useState(null);
  const debounceRef = useRef(null);

  const rawSpeaker = useMemo(() => {
    const speaking = dedupeParticipants(speakingParticipants);
    if (speaking.length > 0) return speaking[0];
    return null;
  }, [speakingParticipants]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!rawSpeaker) {
      debounceRef.current = setTimeout(() => {
        setDebouncedSpeaker(null);
      }, SPEAKER_DEBOUNCE_MS);
      return () => clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setDebouncedSpeaker(rawSpeaker);
    }, SPEAKER_DEBOUNCE_MS);

    return () => clearTimeout(debounceRef.current);
  }, [rawSpeaker]);

  const speakingSet = useMemo(() => {
    const active = debouncedSpeaker || rawSpeaker;
    if (!active) return new Set();
    return new Set([active.identity || active.sid]);
  }, [debouncedSpeaker, rawSpeaker]);

  const isVideoCall = callType === "video";
  const anyVideoOn =
    isVideoCall && !forceGrid && anyParticipantVideoOn(dedupedParticipants);

  const layoutMode = anyVideoOn ? "spotlight" : "grid";

  const mainParticipant = useMemo(() => {
    if (layoutMode !== "spotlight") return null;
    return pickMainParticipant({
      participants: dedupedParticipants,
      speakingParticipants: debouncedSpeaker ? [debouncedSpeaker] : speakingParticipants,
      localParticipant,
    });
  }, [
    layoutMode,
    dedupedParticipants,
    debouncedSpeaker,
    speakingParticipants,
    localParticipant,
  ]);

  const filmstripParticipants = useMemo(() => {
    if (!mainParticipant) return [];
    const mainKey = mainParticipant.identity || mainParticipant.sid;
    return dedupedParticipants.filter(
      (p) => (p.identity || p.sid) !== mainKey,
    );
  }, [dedupedParticipants, mainParticipant]);

  const participantsWithCamera = useMemo(
    () =>
      dedupedParticipants.filter(
        (p) => isCameraEnabled(p) || isScreenShareEnabled(p),
      ),
    [dedupedParticipants],
  );

  const screenSharer = findScreenShareParticipant(dedupedParticipants);
  const isScreenSharing = Boolean(screenSharer);

  return {
    layoutMode,
    dedupedParticipants,
    mainParticipant,
    filmstripParticipants,
    participantsWithCamera,
    speakingSet,
    localParticipant,
    isSolo: dedupedParticipants.length <= 1,
    isScreenSharing,
  };
}
