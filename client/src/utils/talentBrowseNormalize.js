/**
 * Maps TalentProfile API shape → fields founder browse UIs expect (name, talentName, role, experience).
 */

export function augmentTalentBrowseFields(profile) {
  if (!profile || typeof profile !== "object") return null;

  const populatedUser =
    profile.userId &&
    typeof profile.userId === "object" &&
    !Array.isArray(profile.userId)
      ? profile.userId
      : null;

  const displayName =
    String(profile.fullName || "").trim() ||
    String(profile.name || "").trim() ||
    String(profile.talentName || "").trim() ||
    String(populatedUser?.name || "").trim() ||
    "";

  const roleLabel =
    String(profile.professionalTitle || "").trim() ||
    String(profile.headline || "").trim() ||
    String(profile.role || "").trim() ||
    "";

  const expRaw =
    profile.yearsOfExperience != null &&
    String(profile.yearsOfExperience).trim() !== ""
      ? String(profile.yearsOfExperience).trim()
      : profile.experience != null && String(profile.experience).trim() !== ""
        ? String(profile.experience).trim()
        : "";

  const skills = Array.isArray(profile.skills) ? profile.skills : [];

  const avatar =
    String(profile.avatarUrl || "").trim() ||
    String(profile.avatar || "").trim() ||
    String(populatedUser?.avatarUrl || "").trim() ||
    String(populatedUser?.avatar || "").trim() ||
    "";

  return {
    ...profile,
    name: displayName || profile.name,
    talentName: displayName || profile.talentName,
    role: roleLabel || profile.role,
    experience: expRaw || profile.experience,
    avatar,
    avatarUrl: avatar || profile.avatarUrl,
    talentSkills: Array.isArray(profile.talentSkills)
      ? profile.talentSkills
      : skills,
  };
}

function hasMeaningfulTalentContent(profile) {
  if (!profile || typeof profile !== "object") return false;
  return Boolean(
    String(profile.bio || "").trim() ||
      String(profile.professionalGoals || "").trim() ||
      (Array.isArray(profile.skills) && profile.skills.length > 0) ||
      (Array.isArray(profile.workExperiences) && profile.workExperiences.length > 0) ||
      (Array.isArray(profile.educationList) && profile.educationList.length > 0) ||
      (Array.isArray(profile.certifications) && profile.certifications.length > 0) ||
      (Array.isArray(profile.portfolioItems) && profile.portfolioItems.length > 0) ||
      String(profile.professionalTitle || profile.headline || "").trim(),
  );
}

/** True when the profile object is hydrated enough to render (not an id-only stub). */
export function isTalentProfileReadyForDisplay(profile) {
  if (!profile || typeof profile !== "object") return false;
  const normalized = augmentTalentBrowseFields(profile) || profile;
  const name = String(
    normalized.fullName || normalized.name || normalized.talentName || "",
  ).trim();
  if (!name || name === "Talent") return false;
  return hasMeaningfulTalentContent(normalized);
}

export function normalizeTalentProfileRecord(profile, fallback = {}) {
  const normalized = augmentTalentBrowseFields(profile) || profile || {};
  return {
    ...(fallback || {}),
    ...normalized,
    id:
      String(
        normalized.userId?._id ||
          normalized.userId ||
          normalized._id ||
          normalized.id ||
          fallback?.id ||
          fallback?._id ||
          "",
      ) || fallback?.id,
    _id:
      String(
        normalized._id ||
          normalized.id ||
          normalized.userId?._id ||
          normalized.userId ||
          fallback?._id ||
          fallback?.id ||
          "",
      ) || fallback?._id,
    fullName:
      normalized.fullName ||
      normalized.name ||
      normalized.talentName ||
      fallback?.fullName ||
      fallback?.name ||
      "Talent",
    professionalTitle:
      normalized.professionalTitle ||
      normalized.headline ||
      normalized.role ||
      fallback?.professionalTitle ||
      fallback?.headline ||
      "",
  };
}
