/**
 * Real, deterministic heuristic match score (0-100) between a talent profile
 * and a founder's needed roles/industry. Ported verbatim from
 * TeamMatching.jsx's calculateTalentMatchScore (V1) so V2's founder-side
 * Browse Talent page can compute the same honest, non-fabricated number
 * without modifying V1's file. This is rule-based scoring on real profile
 * fields — not machine learning — label it "Matched", not "AI-matched", in
 * UI copy that founders will read as your own words, not the platform's.
 */
export function calculateTalentMatchScore(talent, neededRoles = [], industry = "") {
  let score = 0;

  const roles = Array.isArray(neededRoles) ? neededRoles : [];
  const talentRole = talent?.role || talent?.professionalTitle || "";
  if (
    roles.length > 0 &&
    roles.some(
      (role) =>
        talentRole.toLowerCase().includes(String(role).toLowerCase()) ||
        String(role).toLowerCase().includes(talentRole.toLowerCase()),
    )
  ) {
    score += 40;
  }

  const founderIndustry = String(industry || "");
  const talentInterests = Array.isArray(talent?.interests)
    ? talent.interests
    : Array.isArray(talent?.industryPreferences)
      ? talent.industryPreferences
      : [];
  if (
    founderIndustry &&
    talentInterests.length > 0 &&
    talentInterests.some(
      (interest) =>
        String(interest).toLowerCase().includes(founderIndustry.toLowerCase()) ||
        founderIndustry.toLowerCase().includes(String(interest).toLowerCase()),
    )
  ) {
    score += 30;
  }

  if (talent?.availability === "Immediately") {
    score += 15;
  } else if (talent?.availability?.includes?.("week")) {
    score += 10;
  }

  const experience = String(talent?.experience || talent?.yearsOfExperience || "");
  if (["7", "8", "9", "10+"].some((n) => experience.includes(n))) {
    score += 15;
  } else if (["3", "4", "5"].some((n) => experience.includes(n))) {
    score += 10;
  }

  return score;
}
