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

export default router;
