function str(v) {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  return String(v).trim();
}

function nonEmptyArray(a) {
  return Array.isArray(a) && a.length > 0;
}

/** Average of per-row "filled" ratios for list objects;0 if empty list. */
function listCompleteness(rows, keys) {
  if (!nonEmptyArray(rows)) return 0;
  const ratios = rows.map((row) => {
    if (!row || typeof row !== "object") return 0;
    const filled = keys.filter((k) => str(row[k])).length;
    return filled / keys.length;
  });
  return ratios.reduce((a, b) => a + b, 0) / ratios.length;
}

/**
 * Talent profile completion 0–100 with weighted buckets:
 * - Core (professional): 40%
 * - Skills, links, experience, education, certs, portfolio: 35%
 * - Availability & goals: 25%
 */
export function getTalentProfileCompletionPercent(user) {
  if (!user || user.role !== "talent") return 100;

  const p = user.profile || {};

  const name = str(user.name || p.fullName);
  const email = str(user.email || p.email);
  const professionalTitle = str(user.professionalTitle || p.professionalTitle);
  const yearsOfExperience = str(
    user.yearsOfExperience ?? p.yearsOfExperience ?? "",
  );
  const bio = str(user.bio || p.bio);

  const coreChecks = [name, email, professionalTitle, yearsOfExperience, bio];
  const coreRatio =
    coreChecks.filter((x) => x.length > 0).length / coreChecks.length;
  let total = coreRatio * 40;

  const skills = user.skills || p.skills;
  const skillsRatio = nonEmptyArray(skills) ? 1 : 0;

  const linkedin = str(user.linkedin || p.linkedinUrl);
  const github = str(user.github || p.githubUrl);
  const website = str(user.website || p.portfolioWebsite);
  const linkSlots = [linkedin, github, website].map((x) => (x ? 1 : 0));
  const linksRatio = linkSlots.reduce((a, b) => a + b, 0) / 3;

  const work = user.workExperience || p.workExperiences;
  const workRatio = listCompleteness(work, [
    "company",
    "position",
    "startDate",
  ]);

  const education = user.education || p.educationList;
  const educationRatio = listCompleteness(education, [
    "institution",
    "degree",
    "field",
    "graduationYear",
  ]);

  const certifications = user.certifications || p.certifications;
  const certRatio = listCompleteness(certifications, [
    "name",
    "issuer",
    "issueYear",
  ]);

  const portfolioItems = user.portfolioItems || p.portfolioItems;
  const portfolioRatio = listCompleteness(portfolioItems, [
    "title",
    "description",
  ]);

  const step2Parts = [
    skillsRatio,
    linksRatio,
    workRatio,
    educationRatio,
    certRatio,
    portfolioRatio,
  ];
  const step2Avg =
    step2Parts.reduce((a, b) => a + b, 0) / step2Parts.length;
  total += step2Avg * 35;

  const availabilityStatus = str(
    user.availabilityStatus || p.availabilityStatus,
  );
  const preferredCommitment = str(
    user.preferredCommitment || p.preferredCommitment,
  );
  const experience = str(user.experience || p.experience);
  const availability = str(user.availability || p.availability);
  const professionalGoals = str(user.professionalGoals || p.professionalGoals);
  const interests = user.interests || p.interests;
  const interestsRatio = nonEmptyArray(interests) ? 1 : 0;
  const industryPreferences = user.industryPreferences || p.industryPreferences;
  const industryRatio = nonEmptyArray(industryPreferences) ? 1 : 0;

  const step3Checks = [
    availabilityStatus,
    preferredCommitment,
    experience,
    availability,
    professionalGoals,
  ].map((x) => (str(x).length > 0 ? 1 : 0));
  step3Checks.push(interestsRatio, industryRatio);
  const step3Ratio =
    step3Checks.reduce((a, b) => a + b, 0) / step3Checks.length;
  total += step3Ratio * 25;

  return Math.min(100, Math.round(total));
}
