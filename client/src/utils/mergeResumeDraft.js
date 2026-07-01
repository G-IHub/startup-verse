/**
 * Merge parsed resume draft into ProfilePage editedProfile state.
 */

function nextId(index = 0) {
  return `${Date.now()}-${index}`;
}

function dedupeSkills(skills) {
  const seen = new Set();
  const out = [];
  for (const s of skills) {
    const trimmed = String(s || "").trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

function mapWorkRows(rows) {
  return (Array.isArray(rows) ? rows : []).map((row, index) => ({
    id: nextId(index),
    company: String(row?.company || "").trim(),
    position: String(row?.position || "").trim(),
    startDate: String(row?.startDate || "").trim(),
    endDate: String(row?.endDate || "").trim(),
    current: Boolean(row?.current),
    description: String(row?.description || "").trim(),
  }));
}

function mapEducationRows(rows) {
  return (Array.isArray(rows) ? rows : []).map((row, index) => ({
    id: nextId(index),
    institution: String(row?.institution || "").trim(),
    degree: String(row?.degree || "").trim(),
    field: String(row?.field || "").trim(),
    graduationYear: String(row?.endYear || row?.graduationYear || "").trim(),
    startYear: String(row?.startYear || "").trim(),
    current: Boolean(row?.current),
  }));
}

function mapCertRows(rows) {
  return (Array.isArray(rows) ? rows : []).map((row, index) => ({
    id: nextId(index),
    name: String(row?.name || "").trim(),
    issuer: String(row?.issuer || "").trim(),
    year: String(row?.year || "").trim(),
    credentialUrl: String(row?.url || row?.credentialUrl || "").trim(),
  }));
}

function mapPortfolioRows(rows) {
  return (Array.isArray(rows) ? rows : []).map((row, index) => ({
    id: nextId(index),
    title: String(row?.title || "").trim(),
    description: String(row?.description || "").trim(),
    url: String(row?.url || "").trim(),
    type: String(row?.type || "project").trim(),
  }));
}

function mergeArraySection(existing, incoming, mode) {
  if (mode === "replace") return incoming;
  return [...existing, ...incoming];
}

/**
 * @param {object} profile - current editedProfile
 * @param {object} draft - parsed draft from API
 * @param {object} options
 * @param {Record<string, boolean>} options.sections - which sections to apply
 * @param {Record<string, 'append'|'replace'>} options.arrayModes
 * @param {object} [options.resumeMeta]
 */
export function mergeResumeDraft(profile, draft, options = {}) {
  const sections = options.sections || {};
  const arrayModes = options.arrayModes || {};
  const resumeMeta = options.resumeMeta || {};
  const next = { ...profile };

  if (sections.identity) {
    if (draft.fullName) {
      next.name = draft.fullName;
      next.fullName = draft.fullName;
    }
    if (draft.professionalTitle) next.professionalTitle = draft.professionalTitle;
    if (draft.location) next.location = draft.location;
    if (draft.bio) next.bio = draft.bio;
    if (draft.yearsOfExperience) next.yearsOfExperience = draft.yearsOfExperience;
  }

  if (sections.skills && Array.isArray(draft.skills) && draft.skills.length) {
    const mode = arrayModes.skills || "append";
    const incoming = dedupeSkills(draft.skills);
    next.skills =
      mode === "replace"
        ? incoming
        : dedupeSkills([...(profile.skills || []), ...incoming]);
  }

  if (sections.work && Array.isArray(draft.workExperiences)) {
    const incoming = mapWorkRows(draft.workExperiences);
    if (incoming.length) {
      const mode = arrayModes.work || "append";
      next.workExperience = mergeArraySection(
        profile.workExperience || [],
        incoming,
        mode,
      );
    }
  }

  if (sections.education && Array.isArray(draft.educationList)) {
    const incoming = mapEducationRows(draft.educationList);
    if (incoming.length) {
      const mode = arrayModes.education || "append";
      next.education = mergeArraySection(profile.education || [], incoming, mode);
    }
  }

  if (sections.certifications && Array.isArray(draft.certifications)) {
    const incoming = mapCertRows(draft.certifications);
    if (incoming.length) {
      const mode = arrayModes.certifications || "append";
      next.certifications = mergeArraySection(
        profile.certifications || [],
        incoming,
        mode,
      );
    }
  }

  if (sections.projects && Array.isArray(draft.portfolioItems)) {
    const incoming = mapPortfolioRows(draft.portfolioItems);
    if (incoming.length) {
      const mode = arrayModes.projects || "append";
      next.portfolioItems = mergeArraySection(
        profile.portfolioItems || [],
        incoming,
        mode,
      );
    }
  }

  if (sections.links) {
    if (draft.linkedinUrl) next.linkedin = draft.linkedinUrl;
    if (draft.githubUrl) next.github = draft.githubUrl;
    if (draft.websiteUrl) next.website = draft.websiteUrl;
  }

  if (resumeMeta.url) next.resumeUrl = resumeMeta.url;
  if (resumeMeta.key) next.resumeKey = resumeMeta.key;
  if (resumeMeta.fileName) next.resumeFileName = resumeMeta.fileName;
  if (resumeMeta.parsedAt) next.resumeParsedAt = resumeMeta.parsedAt;

  return next;
}

export const DEFAULT_RESUME_SECTIONS = {
  identity: true,
  skills: true,
  work: true,
  education: true,
  certifications: true,
  projects: true,
  links: true,
};

export const DEFAULT_ARRAY_MODES = {
  skills: "append",
  work: "append",
  education: "append",
  certifications: "append",
  projects: "append",
};

export function countDraftItems(draft) {
  if (!draft) return {};
  return {
    identity: [
      draft.fullName,
      draft.professionalTitle,
      draft.location,
      draft.bio,
      draft.yearsOfExperience,
    ].filter(Boolean).length,
    skills: Array.isArray(draft.skills) ? draft.skills.length : 0,
    work: Array.isArray(draft.workExperiences) ? draft.workExperiences.length : 0,
    education: Array.isArray(draft.educationList) ? draft.educationList.length : 0,
    certifications: Array.isArray(draft.certifications)
      ? draft.certifications.length
      : 0,
    projects: Array.isArray(draft.portfolioItems) ? draft.portfolioItems.length : 0,
    links: [draft.linkedinUrl, draft.githubUrl, draft.websiteUrl].filter(Boolean)
      .length,
  };
}
