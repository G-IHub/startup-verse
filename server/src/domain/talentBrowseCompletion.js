/**
 * Browse visibility: same formula as client/src/utils/talentProfileCompletion.js
 * (computeTalentProfileCompletionFromFlat + TalentProfile lean shape).
 * Keep thresholds and weights in sync when changing completion logic.
 */

export const TALENT_BROWSE_MIN_COMPLETION = 70;

function str(v) {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  return String(v).trim();
}

function nonEmptyArray(a) {
  return Array.isArray(a) && a.length > 0;
}

function listCompleteness(rows, keyFns) {
  if (!nonEmptyArray(rows)) return 0;
  const ratios = rows.map((row) => {
    if (!row || typeof row !== "object") return 0;
    const filled = keyFns.filter((fn) => fn(row)).length;
    return filled / keyFns.length;
  });
  return ratios.reduce((a, b) => a + b, 0) / ratios.length;
}

function getEmptyTalentFlat() {
  return {
    name: "",
    email: "",
    professionalTitle: "",
    yearsOfExperience: "",
    bio: "",
    location: "",
    skills: [],
    linkedin: "",
    github: "",
    website: "",
    workExperience: [],
    education: [],
    certifications: [],
    portfolioItems: [],
    availabilityStatus: "",
    preferredCommitment: "",
    experience: "",
    availability: "",
    professionalGoals: "",
    interests: [],
    industryPreferences: [],
  };
}

function talentBrowseProfileDocumentToFlat(profile) {
  const p = profile || {};
  const u =
    p.userId && typeof p.userId === "object" && !Array.isArray(p.userId)
      ? p.userId
      : {};
  return {
    name: str(p.fullName ?? u.name),
    email: str(u.email),
    professionalTitle: str(p.professionalTitle),
    yearsOfExperience: str(p.yearsOfExperience ?? ""),
    bio: str(p.bio),
    location: str(p.location),
    skills: Array.isArray(p.skills) ? p.skills : [],
    linkedin: str(p.linkedinUrl ?? p.linkedin),
    github: str(p.githubUrl ?? p.github),
    website: str(p.portfolioWebsite ?? p.websiteUrl ?? p.website),
    workExperience: Array.isArray(p.workExperiences)
      ? p.workExperiences
      : Array.isArray(p.workExperience)
        ? p.workExperience
        : [],
    education: Array.isArray(p.educationList)
      ? p.educationList
      : Array.isArray(p.education)
        ? p.education
        : [],
    certifications: Array.isArray(p.certifications) ? p.certifications : [],
    portfolioItems: Array.isArray(p.portfolioItems) ? p.portfolioItems : [],
    availabilityStatus: str(p.availabilityStatus),
    preferredCommitment: str(p.preferredCommitment),
    experience: str(p.experience ?? p.yearsOfExperience ?? ""),
    availability: str(p.availability),
    professionalGoals: str(p.professionalGoals),
    interests: Array.isArray(p.interests) ? p.interests : [],
    industryPreferences: Array.isArray(p.industryPreferences)
      ? p.industryPreferences
      : [],
  };
}

function computeTalentProfileCompletionFromFlat(flat) {
  const f = flat || getEmptyTalentFlat();

  const reqCore = [
    str(f.name),
    str(f.email),
    str(f.professionalTitle),
    str(f.yearsOfExperience),
    str(f.bio),
  ];
  const coreReqRatio =
    reqCore.map((x) => (x.length > 0 ? 1 : 0)).reduce((a, b) => a + b, 0) / 5;
  const locationPts = str(f.location).length > 0 ? 1 : 0;
  let total = coreReqRatio * 35 + locationPts * 5;

  const skillsRatio = nonEmptyArray(f.skills) ? 1 : 0;

  const linkedin = str(f.linkedin);
  const github = str(f.github);
  const website = str(f.website);
  const linkSlots = [linkedin, github, website].map((x) => (x ? 1 : 0));
  const linksRatio = linkSlots.reduce((a, b) => a + b, 0) / 3;

  const workRatio = listCompleteness(f.workExperience, [
    (row) => str(row.company).length > 0,
    (row) => str(row.position).length > 0,
    (row) => str(row.startDate).length > 0,
  ]);

  const educationRatio = listCompleteness(f.education, [
    (row) => str(row.institution).length > 0,
    (row) => str(row.degree).length > 0,
    (row) => str(row.field).length > 0,
    (row) =>
      str(row.graduationYear || row.endYear || row.startYear).length > 0,
  ]);

  const certRatio = listCompleteness(f.certifications, [
    (row) => str(row.name).length > 0,
    (row) => str(row.issuer).length > 0,
    (row) => str(row.year || row.issueYear).length > 0,
  ]);

  const portfolioRatio = listCompleteness(f.portfolioItems, [
    (row) => str(row.title).length > 0,
    (row) => str(row.description).length > 0,
  ]);

  const step2Parts = [
    skillsRatio,
    linksRatio,
    workRatio,
    educationRatio,
    certRatio,
    portfolioRatio,
  ];
  const step2Avg = step2Parts.reduce((a, b) => a + b, 0) / step2Parts.length;
  total += step2Avg * 35;

  const interestsRatio = nonEmptyArray(f.interests) ? 1 : 0;
  const industryRatio = nonEmptyArray(f.industryPreferences) ? 1 : 0;

  const step3Checks = [
    str(f.availabilityStatus).length > 0 ? 1 : 0,
    str(f.preferredCommitment).length > 0 ? 1 : 0,
    str(f.experience).length > 0 ? 1 : 0,
    str(f.availability).length > 0 ? 1 : 0,
    str(f.professionalGoals).length > 0 ? 1 : 0,
    interestsRatio,
    industryRatio,
  ];
  const step3Ratio =
    step3Checks.reduce((a, b) => a + b, 0) / step3Checks.length;
  total += step3Ratio * 25;

  return Math.min(100, Math.round(total));
}

export function getTalentBrowseCompletionPercent(profile) {
  return computeTalentProfileCompletionFromFlat(
    talentBrowseProfileDocumentToFlat(profile),
  );
}

export function filterTalentProfilesForBrowse(profiles) {
  if (!Array.isArray(profiles)) return [];
  const kept = [];
  const dropped = [];
  for (const p of profiles) {
    const flat = talentBrowseProfileDocumentToFlat(p);
    const percent = computeTalentProfileCompletionFromFlat(flat);
    const uid = p?.userId;
    const row = {
      percent,
      userIdType: uid == null ? "null" : typeof uid,
      userIdIsObject: Boolean(uid && typeof uid === "object" && !Array.isArray(uid)),
      hasEmail: Boolean(flat.email),
      hasName: Boolean(flat.name),
      hasTitle: Boolean(flat.professionalTitle),
      hasYears: Boolean(flat.yearsOfExperience),
      hasBio: Boolean(flat.bio),
      hasExperienceField: Boolean(flat.experience),
      skillsLen: Array.isArray(flat.skills) ? flat.skills.length : 0,
    };
    if (percent >= TALENT_BROWSE_MIN_COMPLETION) kept.push(row);
    else dropped.push(row);
  }
  // #region agent log
  fetch("http://127.0.0.1:7693/ingest/705ddae2-d2f3-49e3-a30b-c6cd7f1197d9", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "b96660",
    },
    body: JSON.stringify({
      sessionId: "b96660",
      hypothesisId: "A",
      location: "server/src/domain/talentBrowseCompletion.js:filterTalentProfilesForBrowse",
      message: "browse completion filter",
      data: {
        rawCount: profiles.length,
        keptCount: kept.length,
        droppedCount: dropped.length,
        droppedSample: dropped.slice(0, 12),
        keptSample: kept.slice(0, 8),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  return profiles.filter(
    (p) => getTalentBrowseCompletionPercent(p) >= TALENT_BROWSE_MIN_COMPLETION,
  );
}
