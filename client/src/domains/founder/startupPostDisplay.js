import { formatMoney, getCurrencyName } from "../../utils/formatMoney";
import { getCountryByCode } from "../../config/compensationCountries";

export function normalizeLookingFor(lookingFor) {
  if (Array.isArray(lookingFor)) {
    return lookingFor.map((r) => String(r).trim()).filter(Boolean);
  }
  if (typeof lookingFor === "string" && lookingFor.trim()) {
    return lookingFor
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);
  }
  return [];
}

export function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags.map((t) => String(t).trim()).filter(Boolean);
  }
  if (typeof tags === "string" && tags.trim()) {
    return tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

function parseContentObject(content) {
  if (!content) return {};
  if (typeof content === "object" && !Array.isArray(content)) return content;
  if (typeof content !== "string") return {};
  const trimmed = content.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return {};
  try {
    const parsed = JSON.parse(trimmed);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function isFilledValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value == null) return false;
  if (typeof value === "string") return value.trim() !== "";
  return true;
}

function pickFilled(primary, fallback) {
  return isFilledValue(primary) ? primary : fallback;
}

function mergeOffer(contentOffer, rowOffer) {
  const fromContent =
    contentOffer && typeof contentOffer === "object" ? contentOffer : {};
  const fromRow = rowOffer && typeof rowOffer === "object" ? rowOffer : {};
  const keys = new Set([...Object.keys(fromContent), ...Object.keys(fromRow)]);
  if (keys.size === 0) return null;

  const merged = {};
  for (const key of keys) {
    merged[key] = pickFilled(fromRow[key], fromContent[key]);
  }
  return merged;
}

/**
 * Merge legacy `content` JSON into a startup post so talent detail/browse
 * surfaces fields collected on Launch Startup that may only live in the blob
 * (or were stripped from older offer schemas).
 */
export function hydrateStartupPostForDisplay(post) {
  if (!post || typeof post !== "object") return post;

  const fromContent = parseContentObject(post.content);
  const offer = mergeOffer(fromContent.offer, post.offer);
  const id = String(post.id || post._id || fromContent.id || "").trim();

  return {
    ...fromContent,
    ...post,
    id,
    title: pickFilled(post.title, fromContent.title),
    tagline: pickFilled(post.tagline, fromContent.tagline),
    brandColor: pickFilled(post.brandColor, fromContent.brandColor),
    logoUrl: pickFilled(
      post.logoUrl || post.logo,
      fromContent.logoUrl || fromContent.logo,
    ),
    description: pickFilled(post.description, fromContent.description),
    industry: pickFilled(post.industry, fromContent.industry),
    stage: pickFilled(post.stage, fromContent.stage),
    commitment: pickFilled(post.commitment, fromContent.commitment),
    location: pickFilled(post.location, fromContent.location),
    lookingFor: pickFilled(post.lookingFor, fromContent.lookingFor),
    tags: pickFilled(post.tags, fromContent.tags),
    website: pickFilled(post.website, fromContent.website),
    linkedinUrl: pickFilled(post.linkedinUrl, fromContent.linkedinUrl),
    twitterUrl: pickFilled(post.twitterUrl, fromContent.twitterUrl),
    githubUrl: pickFilled(post.githubUrl, fromContent.githubUrl),
    contactEmail: pickFilled(post.contactEmail, fromContent.contactEmail),
    pitchDeckUrl: pickFilled(post.pitchDeckUrl, fromContent.pitchDeckUrl),
    founder:
      pickFilled(post.founder, post.founderName) ||
      pickFilled(fromContent.founder, fromContent.founderName) ||
      "Founder",
    founderId: pickFilled(
      post.founderId?._id ?? post.founderId,
      fromContent.founderId,
    ),
    offer,
  };
}

export function hasStartupLinks(startup) {
  if (!startup) return false;
  return Boolean(
    startup.website ||
      startup.linkedinUrl ||
      startup.twitterUrl ||
      startup.githubUrl ||
      startup.pitchDeckUrl ||
      startup.contactEmail,
  );
}

export function hasCompensationDetails(offer) {
  if (!offer || typeof offer !== "object") return false;
  return Boolean(
    offer.compensationPhilosophy ||
      offer.equityMin ||
      offer.equityMax ||
      offer.salaryApproach ||
      offer.salaryMin ||
      offer.salaryMax ||
      offer.currency ||
      (Array.isArray(offer.benefits) && offer.benefits.length > 0) ||
      (Array.isArray(offer.whyJoinUs) && offer.whyJoinUs.length > 0) ||
      offer.customPerks,
  );
}

export function formatEquityRange(offer) {
  const min = offer?.equityMin;
  const max = offer?.equityMax;
  if (min && max) return `${min}% – ${max}%`;
  if (min) return `From ${min}%`;
  if (max) return `Up to ${max}%`;
  return "";
}

export function formatSalaryRange(offer) {
  const min = offer?.salaryMin;
  const max = offer?.salaryMax;
  const currency = offer?.currency || "";

  if (!currency) {
    if (min && max) return `${Number(min).toLocaleString()} – ${Number(max).toLocaleString()}`;
    if (min) return `From ${Number(min).toLocaleString()}`;
    if (max) return `Up to ${Number(max).toLocaleString()}`;
    return "";
  }

  if (min && max) {
    return `${formatMoney(min, currency)} – ${formatMoney(max, currency)}`;
  }
  if (min) return `From ${formatMoney(min, currency)}`;
  if (max) return `Up to ${formatMoney(max, currency)}`;
  return "";
}

export function getCompensationCurrencyLabel(offer) {
  if (!offer?.currency) return "";
  const country = getCountryByCode(offer.compensationCountry);
  const currencyName = getCurrencyName(offer.currency);
  if (country) {
    return `${country.name} — ${currencyName} (${offer.currency})`;
  }
  return `${currencyName} (${offer.currency})`;
}

export function resolveBrandAccent(brandColor) {
  return brandColor && /^#[0-9A-Fa-f]{6}$/.test(brandColor)
    ? brandColor
    : null;
}
