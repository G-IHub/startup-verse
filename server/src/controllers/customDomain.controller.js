/**
 * customDomain.controller.js — real founder-facing custom-domain endpoints
 * (2026-09-15), backed by railwayAdapter.js. See CustomDomain.js for the
 * data shape and the adapter file for the honest "not configured yet" gate
 * (no real Railway credentials exist in this environment).
 */
import Startup from "../models/Startup.js";
import CustomDomain from "../models/CustomDomain.js";
import { createCustomDomain, getCustomDomainStatus, deleteCustomDomain, railwayConfigured } from "../services/railwayAdapter.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";

function founderGuard(req, founderId) {
  return req.user.isAdmin === true || req.user.id === String(founderId);
}

// Deliberately conservative: a real registrable domain or subdomain, no
// protocol, no path, no port — this becomes a real Railway custom domain
// and a real DNS record a founder configures, so it must be a plausible
// real hostname before we ever call the real API with it.
const DOMAIN_PATTERN = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

export const getCustomDomain = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) return apiError(res, "Forbidden.", 403);
  const startup = await Startup.findOne({ founderId }).lean();
  if (!startup) return apiSuccess(res, { domain: null, railwayConfigured: railwayConfigured() });
  const record = await CustomDomain.findOne({ startupId: startup._id }).lean();
  return apiSuccess(res, { domain: record || null, railwayConfigured: railwayConfigured() });
};

export const createFounderCustomDomain = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) return apiError(res, "Forbidden.", 403);

  const domain = String(req.body?.domain || "").trim().toLowerCase();
  if (!DOMAIN_PATTERN.test(domain)) {
    return apiError(res, "Enter a real domain (e.g. myapp.com or www.myapp.com), no protocol or path.", 422);
  }

  const startup = await Startup.findOne({ founderId });
  if (!startup) return apiError(res, "Set up your startup profile first.", 422);

  const existing = await CustomDomain.findOne({ startupId: startup._id });
  if (existing) return apiError(res, "This startup already has a custom domain — remove it first to add a different one.", 409);

  const taken = await CustomDomain.findOne({ domain });
  if (taken) return apiError(res, "This domain is already connected to a different StartupVerse account.", 409);

  const railwayResult = await createCustomDomain({ domain });
  const record = await CustomDomain.create({
    startupId: startup._id,
    founderId,
    domain,
    railwayDomainId: railwayResult.railwayDomainId,
    cnameTarget: railwayResult.cnameTarget,
    verificationToken: railwayResult.verificationToken,
    certificateStatus: railwayResult.certificateStatus === "issued" ? "issued" : railwayResult.certificateStatus === "failed" ? "failed" : "pending",
  });

  return apiSuccess(res, { domain: record.toObject() }, 201);
};

/** Real, live re-check against Railway — the founder triggers this after adding their real DNS records, rather than us polling on a cron that doesn't exist yet. */
export const refreshFounderCustomDomain = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) return apiError(res, "Forbidden.", 403);

  const startup = await Startup.findOne({ founderId }).lean();
  const record = startup ? await CustomDomain.findOne({ startupId: startup._id }) : null;
  if (!record) return apiError(res, "No custom domain set up yet.", 404);

  const status = await getCustomDomainStatus({ railwayDomainId: record.railwayDomainId });
  record.certificateStatus = status.certificateStatus === "issued" ? "issued" : status.certificateStatus === "failed" ? "failed" : "pending";
  await record.save();

  return apiSuccess(res, { domain: record.toObject() });
};

export const deleteFounderCustomDomain = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) return apiError(res, "Forbidden.", 403);

  const startup = await Startup.findOne({ founderId }).lean();
  const record = startup ? await CustomDomain.findOne({ startupId: startup._id }) : null;
  if (!record) return apiError(res, "No custom domain to remove.", 404);

  await deleteCustomDomain({ railwayDomainId: record.railwayDomainId });
  await CustomDomain.deleteOne({ _id: record._id });

  return apiSuccess(res, { removed: true });
};
