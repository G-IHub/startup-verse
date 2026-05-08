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

  return {
    ...profile,
    name: displayName || profile.name,
    talentName: displayName || profile.talentName,
    role: roleLabel || profile.role,
    experience: expRaw || profile.experience,
    talentSkills: Array.isArray(profile.talentSkills)
      ? profile.talentSkills
      : skills,
  };
}
