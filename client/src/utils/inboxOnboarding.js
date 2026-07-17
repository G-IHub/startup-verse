function normalizeSourceId(value) {
  const id = String(value || "").trim();
  if (!id || id === "undefined" || id === "null") return "";
  return id;
}

export function resolveOnboardingSource(onboardingTalent) {
  const invitationId = normalizeSourceId(onboardingTalent?.invitationId);
  if (invitationId) {
    return { kind: "invitation", id: invitationId };
  }

  const interestId = normalizeSourceId(onboardingTalent?.interestId);
  if (interestId) {
    return { kind: "interest", id: interestId };
  }

  return null;
}
