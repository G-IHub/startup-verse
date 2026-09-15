/**
 * customDomainPublic.js — serves a founder's real hosted product at their
 * own real custom domain (2026-09-15, Part 3). Mounted before every other
 * route in app.js: checks the request's real hostname against a real,
 * verified (certificateStatus: "issued") CustomDomain on every request,
 * and falls through untouched (`next()`) the moment it doesn't match —
 * this must never affect www./api.startupverse.space or anything else.
 *
 * Real known scaling tradeoff, worth revisiting once there are many real
 * custom domains: this is a DB lookup on every single request server-wide,
 * not just requests for a custom domain. Fine at today's real scale (a
 * handful of founders at most); an in-memory cache of active domains,
 * refreshed periodically, is the real fix once that stops being true —
 * not built now since no real custom domain exists yet to measure against.
 *
 * Single-page hosting only, matching how AI Developer only builds
 * single-file products so far: every real path on a matched custom domain
 * serves the same startup's current HostedSite content, not per-path
 * routing.
 */
import CustomDomain from "../models/CustomDomain.js";
import HostedSite from "../models/HostedSite.js";

export default async function customDomainPublicMiddleware(req, res, next) {
  if (req.method !== "GET") return next();

  const hostname = req.hostname;
  const record = await CustomDomain.findOne({ domain: hostname, certificateStatus: "issued" }).lean();
  if (!record) return next();

  const site = await HostedSite.findOne({ startupId: record.startupId }).lean();
  if (!site) {
    res.status(404).type("text/plain").send("This domain is connected, but nothing has been published yet.");
    return;
  }
  res.status(200).type("text/html").send(site.html);
}
