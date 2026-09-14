/**
 * hostedSiteService.js — real hosted-link feature (2026-09-15). Every real
 * production deploy (executeGithubMergeMain, agentExecutors.js) should end
 * with a real, always-working link, not just a real git merge. GitHub Pages
 * is best-effort (already wired, already hit real failures live: a private
 * repo on a plan that doesn't support Pages, a token missing the Pages
 * scope) — this is the guaranteed fallback, served from our own domain.
 */
import Startup from "../models/Startup.js";
import HostedSite from "../models/HostedSite.js";
import FormSubmission from "../models/FormSubmission.js";

export const SITES_HOSTNAME = process.env.SITES_HOSTNAME || "sites.startupverse.space";
const MAX_SLUG_LENGTH = 60;
const MAX_SLUG_ATTEMPTS = 50;
const MAX_SUBMISSION_FIELDS = 30;
const MAX_FIELD_VALUE_LENGTH = 2000;

function slugify(name) {
  const base = String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH);
  return base || "startup";
}

/**
 * Generates and saves a real, unique slug for a Startup the first time one
 * is needed (lazily, on first hosted deploy) rather than via a migration —
 * every existing Startup document already works fine without one until
 * then. Returns the existing slug unchanged if the Startup already has one.
 */
export async function ensureStartupSlug(startup) {
  if (startup.slug) return startup.slug;

  const base = slugify(startup.name);
  let candidate = base;
  let suffix = 1;
  for (let i = 0; i < MAX_SLUG_ATTEMPTS; i++) {
    // eslint-disable-next-line no-await-in-loop -- each attempt depends on the last one's real collision check
    const taken = await Startup.exists({ slug: candidate, _id: { $ne: startup._id } });
    if (!taken) break;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  startup.slug = candidate;
  await startup.save();
  return candidate;
}

/**
 * Injects a real, live submit URL into the served copy of the page only —
 * never into the file committed to the founder's GitHub repo, which stays
 * portable/standalone. AI Developer's system prompt (agentExecutors.js)
 * tells it to post real forms to `window.STARTUPVERSE_SUBMIT_URL` when
 * present; this is what actually defines that global, and it can only be
 * defined here since the real slug doesn't exist yet when the file is
 * first drafted. Inserted right after <head> when present, else prepended.
 */
function injectSubmitScript(html, slug) {
  const submitUrl = `https://${SITES_HOSTNAME}/${slug}/submit`;
  const script = `<script>window.STARTUPVERSE_SUBMIT_URL=${JSON.stringify(submitUrl)};</script>`;
  const headMatch = html.match(/<head[^>]*>/i);
  if (headMatch) {
    const insertAt = headMatch.index + headMatch[0].length;
    return html.slice(0, insertAt) + script + html.slice(insertAt);
  }
  return script + html;
}

/**
 * Upserts the real, latest production HTML for a startup's hosted site.
 * One site per startup (the startup's current real product), not one per
 * build — matches how the Product Viewer already treats "latest production
 * HTML" as the current build.
 */
export async function publishHostedSite({ startup, html, filePath, sourceEventId }) {
  const slug = await ensureStartupSlug(startup);
  const servedHtml = injectSubmitScript(html, slug);
  await HostedSite.findOneAndUpdate(
    { startupId: startup._id },
    { startupId: startup._id, founderId: startup.founderId, slug, html: servedHtml, filePath: filePath || "", sourceEventId: sourceEventId || null },
    { upsert: true, new: true },
  );
  return { slug, url: `https://${SITES_HOSTNAME}/${slug}` };
}

/**
 * Real, defensive sanitization for a public, unauthenticated submission —
 * anyone can POST here (same as the hosted page itself being public), so
 * this must never trust the shape of the body. Caps field count and each
 * value's length rather than rejecting outright, so a form with one
 * oversized field still records its other real fields.
 */
function sanitizeSubmissionData(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const entries = Object.entries(raw).slice(0, MAX_SUBMISSION_FIELDS);
  const clean = {};
  for (const [key, value] of entries) {
    const cleanKey = String(key).slice(0, 100);
    if (!cleanKey) continue;
    const cleanValue = typeof value === "string" || typeof value === "number" || typeof value === "boolean"
      ? String(value).slice(0, MAX_FIELD_VALUE_LENGTH)
      : null;
    if (cleanValue !== null) clean[cleanKey] = cleanValue;
  }
  return Object.keys(clean).length > 0 ? clean : null;
}

/**
 * Records a real form submission from a startup's real hosted page. Public
 * by design (no auth) — the page itself is public, so its own forms must
 * be able to post here without a founder's session. Returns null (never
 * throws) for a slug with no real hosted site, so the route can respond
 * with a real, honest 404 rather than crashing on stray/spam traffic.
 */
export async function recordFormSubmission({ slug, rawData }) {
  const data = sanitizeSubmissionData(rawData);
  if (!data) return { ok: false, reason: "empty" };

  const site = await HostedSite.findOne({ slug }).select("startupId founderId slug").lean();
  if (!site) return { ok: false, reason: "not_found" };

  await FormSubmission.create({ startupId: site.startupId, founderId: site.founderId, slug: site.slug, data });
  return { ok: true };
}
