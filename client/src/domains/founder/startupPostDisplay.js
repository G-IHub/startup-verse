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
