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

export const SITES_HOSTNAME = process.env.SITES_HOSTNAME || "sites.startupverse.space";
const MAX_SLUG_LENGTH = 60;
const MAX_SLUG_ATTEMPTS = 50;

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
 * Upserts the real, latest production HTML for a startup's hosted site.
 * One site per startup (the startup's current real product), not one per
 * build — matches how the Product Viewer already treats "latest production
 * HTML" as the current build.
 */
export async function publishHostedSite({ startup, html, filePath, sourceEventId }) {
  const slug = await ensureStartupSlug(startup);
  await HostedSite.findOneAndUpdate(
    { startupId: startup._id },
    { startupId: startup._id, founderId: startup.founderId, slug, html, filePath: filePath || "", sourceEventId: sourceEventId || null },
    { upsert: true, new: true },
  );
  return { slug, url: `https://${SITES_HOSTNAME}/${slug}` };
}
