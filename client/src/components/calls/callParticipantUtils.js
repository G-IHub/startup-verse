export function getParticipantName(participant) {
  return participant?.name || participant?.identity || "Unknown";
}

export function getParticipantInitial(participant) {
  return getParticipantName(participant).charAt(0).toUpperCase() || "?";
}

export function getParticipantKey(participant) {
  return participant?.identity || participant?.sid || "";
}

export function dedupeParticipants(participants) {
  const byIdentity = new Map();

  (participants || []).forEach((participant) => {
    const key = getParticipantKey(participant);
    if (!key || byIdentity.has(key)) return;
    byIdentity.set(key, participant);
  });

  return Array.from(byIdentity.values());
}

export function isCameraEnabled(participant) {
  return Boolean(participant?.isCameraEnabled);
}

export function isScreenShareEnabled(participant) {
  return Boolean(participant?.isScreenShareEnabled);
}

export function isMicrophoneEnabled(participant) {
  return Boolean(participant?.isMicrophoneEnabled);
}

export function anyParticipantCameraOn(participants) {
  return dedupeParticipants(participants).some((participant) => isCameraEnabled(participant));
}

export function anyParticipantVideoOn(participants) {
  return dedupeParticipants(participants).some(
    (participant) => isCameraEnabled(participant) || isScreenShareEnabled(participant),
  );
}

export function findScreenShareParticipant(participants) {
  return dedupeParticipants(participants).find((participant) => isScreenShareEnabled(participant)) || null;
}

export function pickMainParticipant({
  participants,
  speakingParticipants,
  localParticipant,
}) {
  const screenSharer = findScreenShareParticipant(participants);
  if (screenSharer) {
    return screenSharer;
  }

  const deduped = dedupeParticipants(participants);

  if (deduped.length === 0) {
    return localParticipant || null;
  }

  if (deduped.length === 1) {
    return deduped[0];
  }

  const speaking = dedupeParticipants(speakingParticipants);
  if (speaking.length > 0) {
    return speaking[0];
  }

  return localParticipant || deduped[0];
}
