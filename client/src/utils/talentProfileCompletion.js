function str(v) {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  return String(v).trim();
}

function nonEmptyArray(a) {
  return Array.isArray(a) && a.length > 0;
}

/** Per-row fill ratio for list objects using key list (each key 0 or 1). */
function listCompleteness(rows, keyFns) {
  if (!nonEmptyArray(rows)) return 0;
  const ratios = rows.map((row) => {
    if (!row || typeof row !== "object") return 0;
    const filled = keyFns.filter((fn) => fn(row)).length;
    return filled / keyFns.length;
  });
  return ratios.reduce((a, b) => a + b, 0) / ratios.length;
}

/**
 * Flatten persisted user + nested profile into one shape used for completion.
 * Matches fields written by ProfileCompletionForm for talent.
 */
export function flattenTalentUserForCompletion(user) {
  if (!user || typeof user !== "object") {
    return getEmptyTalentFlat();
  }
  const p = user.profile || {};

  const work = user.workExperience || p.workExperiences || [];
  const education = user.education || p.educationList || [];
  const certifications = user.certifications || p.certifications || [];
  const portfolioItems = user.portfolioItems || p.portfolioItems || [];

  return {
    name: str(user.name || p.fullName),
    email: str(user.email || p.email),
    professionalTitle: str(user.professionalTitle || p.professionalTitle),
    yearsOfExperience: str(
      user.yearsOfExperience ?? p.yearsOfExperience ?? "",
    ),
    bio: str(user.bio || p.bio),
    location: str(user.location || p.location),

    skills: user.skills || p.skills || [],

    linkedin: str(user.linkedin || p.linkedinUrl),
    github: str(user.github || p.githubUrl),
    website: str(
      user.website || p.portfolioWebsite || p.websiteUrl || "",
    ),

    workExperience: Array.isArray(work) ? work : [],
    education: Array.isArray(education) ? education : [],
    certifications: Array.isArray(certifications) ? certifications : [],
    portfolioItems: Array.isArray(portfolioItems) ? portfolioItems : [],

    availabilityStatus: str(user.availabilityStatus || p.availabilityStatus),
    preferredCommitment: str(
      user.preferredCommitment || p.preferredCommitment,
    ),
    experience: str(user.experience || p.experience),
    availability: str(user.availability || p.availability),
    professionalGoals: str(user.professionalGoals || p.professionalGoals),
    interests: user.interests || p.interests || [],
    industryPreferences:
      user.industryPreferences || p.industryPreferences || [],
  };
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

/**
 * Live form snapshot → same flat shape as flattenTalentUserForCompletion.
 * `email` should be the authenticated email (not always edited on step 1).
 */
export function talentFormSnapshotToFlat(snapshot) {
  const s = snapshot || {};
  const skillsRaw = s.skills;
  const skills = Array.isArray(skillsRaw)
    ? skillsRaw
    : typeof s.skillsInput === "string"
      ? s.skillsInput
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean)
      : [];

  return {
    name: str(s.fullName ?? s.name),
    email: str(s.email),
    professionalTitle: str(s.professionalTitle),
    yearsOfExperience: str(s.yearsOfExperience ?? ""),
    bio: str(s.bio),
    location: str(s.location),

    skills,

    linkedin: str(s.linkedinUrl ?? s.linkedin),
    github: str(s.githubUrl ?? s.github),
    website: str(s.portfolioWebsite ?? s.websiteUrl ?? s.website),

    workExperience: Array.isArray(s.workExperiences)
      ? s.workExperiences
      : Array.isArray(s.workExperience)
        ? s.workExperience
        : [],
    education: Array.isArray(s.educationList)
      ? s.educationList
      : Array.isArray(s.education)
        ? s.education
        : [],
    certifications: Array.isArray(s.certifications) ? s.certifications : [],
    portfolioItems: Array.isArray(s.portfolioItems) ? s.portfolioItems : [],

    availabilityStatus: str(s.availabilityStatus),
    preferredCommitment: str(s.preferredCommitment),
    experience: str(s.experience),
    availability: str(s.availability),
    professionalGoals: str(s.professionalGoals),
    interests: Array.isArray(s.interests) ? s.interests : [],
    industryPreferences: Array.isArray(s.industryPreferences)
      ? s.industryPreferences
      : [],
  };
}

/**
 * TalentProfile API lean doc (+ populated userId name/email) → same flat shape as form snapshot.
 * Used for browse eligibility without requiring full auth user object.
 */
export function talentBrowseProfileDocumentToFlat(profile) {
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

export function getTalentBrowseProfileCompletionPercent(profile) {
  return computeTalentProfileCompletionFromFlat(
    talentBrowseProfileDocumentToFlat(profile),
  );
}

/**
 * Core / step2 / step3 weights — same as stored profile buckets (TalentProfile + user flags).
 * - Core: 40% (35% five required + 5% optional location; email from account counts)
 * - Structured + skills + links: 35%
 * - Availability + goals: 25%
 */
export function computeTalentProfileCompletionFromFlat(flat) {
  return getTalentProfileCompletionBreakdownFromFlat(flat).total;
}

export function getTalentProfileCompletionBreakdownFromFlat(flat) {
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
  const coreScore = coreReqRatio * 35 + locationPts * 5;

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
  const profileDepthScore = step2Avg * 35;

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
  const availabilityScore = step3Ratio * 25;

  const total = Math.min(
    100,
    Math.round(coreScore + profileDepthScore + availabilityScore),
  );

  return {
    total,
    groups: [
      {
        key: "basics",
        label: "Basics",
        percent: Math.round((coreScore / 40) * 100),
        points: Math.round(coreScore),
        maxPoints: 40,
      },
      {
        key: "depth",
        label: "Profile depth",
        percent: Math.round(step2Avg * 100),
        points: Math.round(profileDepthScore),
        maxPoints: 35,
      },
      {
        key: "availability",
        label: "Availability",
        percent: Math.round(step3Ratio * 100),
        points: Math.round(availabilityScore),
        maxPoints: 25,
      },
    ],
  };
}

export function getTalentProfileCompletionPercent(user) {
  if (!user || user.role !== "talent") return 100;
  const flat = flattenTalentUserForCompletion(user);
  return computeTalentProfileCompletionFromFlat(flat);
}

/** Wizard / live form: pass buildSubmissionData() spread + email */
export function getTalentProfileFormCompletionPercent(formSnapshot) {
  const flat = talentFormSnapshotToFlat(formSnapshot);
  return computeTalentProfileCompletionFromFlat(flat);
}

export function getTalentProfileFormCompletionBreakdown(formSnapshot) {
  const flat = talentFormSnapshotToFlat(formSnapshot);
  return getTalentProfileCompletionBreakdownFromFlat(flat);
}

/**
 * Map persisted user (top-level + profile) into TalentProfileForm initialData keys.
 */
export function persistedTalentToFormInitialData(user) {
  const f = flattenTalentUserForCompletion(user);
  return {
    fullName: f.name,
    email: f.email,
    professionalTitle: f.professionalTitle,
    location: f.location,
    bio: f.bio,
    yearsOfExperience: f.yearsOfExperience,
    skills: Array.isArray(f.skills) ? [...f.skills] : [],
    linkedinUrl: f.linkedin,
    githubUrl: f.github,
    portfolioWebsite: f.website,
    workExperiences: Array.isArray(f.workExperience)
      ? f.workExperience.map((row) => ({ ...row }))
      : [],
    educationList: Array.isArray(f.education)
      ? f.education.map((row) => ({
          ...row,
          graduationYear:
            row.graduationYear ?? row.endYear ?? row.startYear ?? "",
        }))
      : [],
    certifications: Array.isArray(f.certifications)
      ? f.certifications.map((row) => ({
          ...row,
          issueYear: row.issueYear ?? row.year ?? "",
          credentialUrl: row.credentialUrl ?? row.url ?? "",
        }))
      : [],
    portfolioItems: Array.isArray(f.portfolioItems)
      ? f.portfolioItems.map((row) => ({ ...row }))
      : [],
    availabilityStatus: f.availabilityStatus,
    preferredCommitment: f.preferredCommitment,
    experience: f.experience,
    availability: f.availability,
    interests: Array.isArray(f.interests) ? [...f.interests] : [],
    professionalGoals: f.professionalGoals,
    industryPreferences: Array.isArray(f.industryPreferences)
      ? [...f.industryPreferences]
      : [],
  };
}
