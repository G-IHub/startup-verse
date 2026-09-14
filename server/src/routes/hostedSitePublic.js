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

const router = Router();

router.get("/:slug", async (req, res, next) => {
  if (req.hostname !== SITES_HOSTNAME) return next();

  const slug = String(req.params.slug || "").toLowerCase();
  const site = await HostedSite.findOne({ slug }).lean();
  if (!site) {
    res.status(404).type("text/plain").send("No site found at this address.");
    return;
  }
  res.status(200).type("text/html").send(site.html);
});

/**
 * Real, public form-capture endpoint (2026-09-15) — same origin as the
 * hosted page itself (window.STARTUPVERSE_SUBMIT_URL, injected by
 * hostedSiteService.js's publishHostedSite), so a same-origin fetch()
 * needs no CORS headers here at all. No auth, by design — the page is
 * public, so its own forms must be able to post without a founder's
 * session. express.json() (app.js, applied globally before this router
 * is mounted) has already parsed req.body by the time this runs.
 */
router.post("/:slug/submit", async (req, res, next) => {
  if (req.hostname !== SITES_HOSTNAME) return next();

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
