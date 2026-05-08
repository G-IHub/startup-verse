import { getTalentProfileCompletionPercent } from "../../../utils/talentProfileCompletion";
import { TALENT_ACTIONS_MIN_COMPLETION } from "../../../constants/talentProfile";

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function toId(value, fallback = "") {
  return String(value || fallback || "").trim();
}

function toNumber(value, fallback = 0) {
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toDateValue(value) {
  const parsed = new Date(value || Date.now());
  return Number.isFinite(parsed.getTime()) ? parsed.getTime() : Date.now();
}

function toRelativePosted(value) {
  const postedMs = toDateValue(value);
  const daysAgo = Math.floor((Date.now() - postedMs) / (1000 * 60 * 60 * 24));
  if (daysAgo <= 0) return "Today";
  if (daysAgo === 1) return "1 day ago";
  return `${daysAgo} days ago`;
}

function parseContentObject(raw) {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw;
  }
  if (typeof raw !== "string") return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function getEquityRange(opportunity) {
  const equityMin = toNumber(opportunity?.offer?.equityMin, NaN);
  const equityMax = toNumber(opportunity?.offer?.equityMax, NaN);
  if (!Number.isFinite(equityMin) || !Number.isFinite(equityMax)) return null;
  return {
    min: equityMin,
    max: equityMax,
    label: `${equityMin}-${equityMax}%`,
    midpoint: (equityMin + equityMax) / 2,
  };
}

function getEquityBucket(equityRange) {
  if (!equityRange) return "Not specified";
  if (equityRange.max <= 2) return "0-2%";
  if (equityRange.max <= 5) return "2-5%";
  if (equityRange.max <= 10) return "5-10%";
  return "10%+";
}

function getTeamSizeBucket(teamSize) {
  if (!teamSize) return "Unknown";
  if (teamSize <= 5) return "1-5";
  if (teamSize <= 10) return "6-10";
  if (teamSize <= 20) return "11-20";
  return "21+";
}

function calculateMatchScore(opportunity, talentProfile) {
  if (!talentProfile || typeof talentProfile !== "object") return 0;
  let score = 0;

  const talentSkills = toArray(talentProfile.skills).map((item) =>
    String(item || "").toLowerCase(),
  );
  const lookingFor = toArray(opportunity.lookingFor).map((item) =>
    String(item || "").toLowerCase(),
  );
  const tags = toArray(opportunity.tags).map((item) =>
    String(item || "").toLowerCase(),
  );

  if (talentSkills.length > 0 && (lookingFor.length > 0 || tags.length > 0)) {
    const startupKeywords = [...lookingFor, ...tags];
    const matchingSkills = talentSkills.filter((skill) =>
      startupKeywords.some(
        (keyword) => keyword.includes(skill) || skill.includes(keyword),
      ),
    );
    score += Math.min(40, (matchingSkills.length / talentSkills.length) * 40);
  }

  const interests = [
    ...toArray(talentProfile.interests),
    ...toArray(talentProfile.industryPreferences),
  ].map((item) => String(item || "").toLowerCase());
  const industry = String(opportunity.industry || "").toLowerCase();
  if (
    industry &&
    interests.some(
      (item) => item.includes(industry) || industry.includes(item),
    )
  ) {
    score += 20;
  }

  const talentLocation = String(talentProfile.location || "").toLowerCase();
  const startupLocation = String(opportunity.location || "").toLowerCase();
  if (talentLocation && startupLocation) {
    if (
      talentLocation === startupLocation ||
      talentLocation.includes(startupLocation) ||
      startupLocation.includes(talentLocation)
    ) {
      score += 10;
    } else if (
      startupLocation.includes("remote") ||
      talentLocation.includes("remote")
    ) {
      score += 5;
    }
  }

  const talentCommitment = String(
    talentProfile.preferredCommitment || "",
  ).toLowerCase();
  const startupCommitment = String(opportunity.commitment || "").toLowerCase();
  if (talentCommitment && startupCommitment) {
    if (
      talentCommitment === startupCommitment ||
      startupCommitment.includes(talentCommitment) ||
      startupCommitment.includes("flexible") ||
      talentCommitment.includes("flexible")
    ) {
      score += 10;
    }
  }

  const stage = String(opportunity.stage || "").toLowerCase();
  if (stage.includes("idea") || stage.includes("mvp")) {
    score += 10;
  } else if (stage.includes("traction") || stage.includes("seed")) {
    score += 8;
  } else if (stage) {
    score += 5;
  }

  const daysAgo = Math.floor(
    (Date.now() - toDateValue(opportunity.postedDate)) / (1000 * 60 * 60 * 24),
  );
  if (daysAgo <= 3) score += 10;
  else if (daysAgo <= 7) score += 7;
  else if (daysAgo <= 14) score += 4;

  return Math.min(100, Math.max(0, Math.round(score)));
}

function normalizeOpportunity(row, index, talentProfile, savedIdSet, sentInterestMap) {
  const parsedContent = parseContentObject(row?.content);
  const merged = { ...parsedContent, ...(row || {}) };
  const id = toId(merged.id || merged._id, `opportunity-${index}`);
  const startupId = toId(merged.startupId || id, id);
  const founderId = toId(
    merged.founderId || merged.ownerId || merged.createdBy || "",
  );
  const title = String(merged.title || merged.name || "Startup opportunity");
  const description = String(
    merged.description || merged.summary || merged.content || "",
  ).trim();
  const postedDate = merged.postedDate || merged.createdAt || Date.now();

  const normalized = {
    ...merged,
    id,
    startupId,
    founderId,
    title,
    founder: String(
      merged.founder ||
        merged.founderName ||
        merged.ownerName ||
        (founderId ? `Founder ${founderId.slice(0, 6)}` : "Founder"),
    ),
    description: description || "No startup description provided yet.",
    stage: String(merged.stage || "Not specified"),
    funding: String(merged.funding || "Not specified"),
    commitment: String(merged.commitment || "Flexible"),
    location: String(merged.location || "Remote"),
    teamSize: Math.max(0, toNumber(merged.teamSize, 0)),
    tags: toArray(merged.tags),
    lookingFor: toArray(merged.lookingFor),
    offer: merged.offer && typeof merged.offer === "object" ? merged.offer : null,
    interested: Math.max(0, toNumber(merged.interested, 0)),
    postedDate,
    posted: toRelativePosted(postedDate),
  };

  const directScore = toNumber(normalized.match ?? normalized.matchScore, NaN);
  const matchScore = Number.isFinite(directScore)
    ? Math.round(directScore)
    : calculateMatchScore(normalized, talentProfile);
  const equityRange = getEquityRange(normalized);
  const saved = savedIdSet.has(id) || savedIdSet.has(startupId);
  const sentInterest = sentInterestMap.get(startupId) || sentInterestMap.get(id);

  return {
    ...normalized,
    matchScore,
    equityRange,
    equityBucket: getEquityBucket(equityRange),
    teamSizeBucket: getTeamSizeBucket(normalized.teamSize),
    postedDateValue: toDateValue(postedDate),
    isSaved: saved,
    interestStatus: sentInterest?.status || null,
    hasExpressedInterest: Boolean(sentInterest),
  };
}

function toSavedIdSet(savedRows) {
  const ids = new Set();
  for (const row of toArray(savedRows)) {
    if (!row || typeof row !== "object") continue;
    const primaryId = toId(row.itemId || row.startupId || row.id || "");
    if (primaryId) ids.add(primaryId);
  }
  return ids;
}

function toSentInterestMap(sentRows) {
  const map = new Map();
  for (const row of toArray(sentRows)) {
    if (!row || typeof row !== "object") continue;
    const startupId = toId(row.startupId || row.opportunityId || row.itemId || "");
    if (!startupId) continue;
    map.set(startupId, row);
  }
  return map;
}

export function mapTalentHomeViewModel({
  user,
  opportunityRows = [],
  savedRows = [],
  sentInterestRows = [],
  invitationRows = [],
  applicationRows = [],
  fallbackUsed = false,
}) {
  const completion = getTalentProfileCompletionPercent(user);
  const threshold = TALENT_ACTIONS_MIN_COMPLETION;
  const savedIdSet = toSavedIdSet(savedRows);
  const sentInterestMap = toSentInterestMap(sentInterestRows);

  const opportunities = toArray(opportunityRows)
    .map((row, index) =>
      normalizeOpportunity(row, index, user?.profile || {}, savedIdSet, sentInterestMap),
    )
    .sort((left, right) => right.matchScore - left.matchScore);

  const sentInterests = toArray(sentInterestRows);
  const invitations = toArray(invitationRows);
  const applications = toArray(applicationRows);

  const sentInterestStartupIds = sentInterests
    .map((row) => toId(row.startupId || row.opportunityId || row.itemId))
    .filter(Boolean);

  return {
    profileGate: {
      completion,
      threshold,
      canUsePrimaryActions: completion >= threshold,
    },
    opportunities,
    savedIdSet,
    sentInterestStartupIds,
    summary: {
      opportunityCount: opportunities.length,
      savedCount: savedIdSet.size,
      sentInterestCount: sentInterests.length,
      pendingInterestCount: sentInterests.filter(
        (item) => String(item?.status || "").toLowerCase() === "pending",
      ).length,
      acceptedInterestCount: sentInterests.filter(
        (item) => String(item?.status || "").toLowerCase() === "accepted",
      ).length,
      rejectedInterestCount: sentInterests.filter(
        (item) => String(item?.status || "").toLowerCase() === "rejected",
      ).length,
      invitationCount: invitations.length,
      pendingInvitationCount: invitations.filter(
        (item) => String(item?.status || "").toLowerCase() === "pending",
      ).length,
      applicationCount: applications.length,
    },
    fallbackUsed,
  };
}
