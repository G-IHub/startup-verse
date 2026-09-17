/**
 * hostedSitePublic.js — serves a real HostedSite's HTML at
 * sites.startupverse.space/{slug}. Deliberately mounted at the app root
 * (app.js), not under /api/v1, and gated on the request's real hostname:
 * this must be a genuinely separate origin from the main app
 * (www./api.startupverse.space) — an AI-Developer-generated page can
 * contain arbitrary <script>, and it must never share cookies/session with
 * the authenticated app, same reasoning as GitHub Pages (github.io) being
 * a separate origin from github.com. No auth here at all — this is meant
 * to be public, like GitHub Pages.
 */
import { Router } from "express";
import HostedSite from "../models/HostedSite.js";
import { recordFormSubmission } from "../services/hostedSiteService.js";

const SITES_HOSTNAME = process.env.SITES_HOSTNAME || "sites.startupverse.space";
const IS_DEV = process.env.NODE_ENV === "development";

/**
 * Robust hostname resolution — works both locally (req.hostname) and behind
 * a reverse proxy / load balancer that may rewrite the Host header or add
 * X-Forwarded-Host. Checks all three in priority order:
 *   1. X-Forwarded-Host (set by proxies like Railway, Render, Cloudflare)
 *   2. req.headers.host (raw Host header from the client)
 *   3. req.hostname (Express-parsed, falls back to the bound address)
 */
function resolveHostname(req) {
  const fwd = req.headers["x-forwarded-host"];
  const rawHost = req.headers.host;
  // x-forwarded-host may be comma-separated when chained; take the first value
  if (fwd) return String(fwd).split(",")[0].trim().split(":")[0].toLowerCase();
  if (rawHost) return String(rawHost).split(":")[0].toLowerCase();
  return (req.hostname || "").toLowerCase();
}

// In development, bypass the hostname guard so founders can test their deployed
// pages at http://localhost:5000/{slug} without needing a tunnel.
// The same-origin/XSS isolation concern only applies in production where real
// session cookies exist alongside real founder data.
function isSitesHost(req) {
  if (IS_DEV) return true;
  return resolveHostname(req) === SITES_HOSTNAME.toLowerCase();
}

const router = Router();

router.get("/:slug", async (req, res, next) => {
  if (!isSitesHost(req)) return next();

  const slug = String(req.params.slug || "").toLowerCase();
  const site = await HostedSite.findOne({ slug }).lean();
  if (!site) {
    res.status(404).type("text/plain").send("No site found at this address.");
    return;
  }
  res.status(200).type("text/html").send(site.html);
});

/**
 * Real, public form-capture endpoint (2026-09-15). A page served from
 * sites.startupverse.space submits here same-origin; a page served from a
 * founder's own real custom domain (Part 3) submits here cross-origin —
 * app.js has a dedicated permissive CORS carve-out for this whole host
 * (ahead of the main app's restrictive, allowlisted CORS policy) so that
 * still works. No auth here, by design — the page itself is public.
 * express.json() (app.js, applied globally before this router is
 * mounted) has already parsed req.body by the time this runs.
 */
router.post("/:slug/submit", async (req, res, next) => {
  if (!isSitesHost(req)) return next();

  const slug = String(req.params.slug || "").toLowerCase();
  const result = await recordFormSubmission({ slug, rawData: req.body });
  if (!result.ok && result.reason === "not_found") {
    res.status(404).json({ success: false, error: "No site found at this address." });
    return;
  }
  // A genuinely empty/malformed submission still gets a real 200 — this is
  // public, unauthenticated traffic; a form's own JS shouldn't have to
  // handle a confusing error for a case that isn't actually its fault.
  res.status(200).json({ success: true });
});

export default router;
