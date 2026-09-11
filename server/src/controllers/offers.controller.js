import Offer from "../models/Offer.js";
import Startup from "../models/Startup.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import { OFFER_STATUSES } from "../utils/enums.js";

function founderGuard(req, founderId) {
  return req.user.isAdmin === true || req.user.id === String(founderId);
}

export const createOffer = async (req, res) => {
  const b = req.body?.offer || req.body || {};
  const founderId = b.founderId || req.user.id;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }

  const talentId = String(b.talentId || "").trim();
  const role = String(b.role || "").trim();
  if (!talentId || !role) {
    return apiError(res, "talentId and role are required.", 400);
  }

  let startupId = b.startupId || null;
  if (!startupId) {
    const startup = await Startup.findOne({ founderId }).select("_id").lean();
    startupId = startup?._id || null;
  }

  const offer = await Offer.create({
    founderId,
    talentId,
    startupId,
    role: role.slice(0, 200),
    roleType: String(b.roleType || "").slice(0, 100),
    startDate: b.startDate ? new Date(b.startDate) : null,
    salaryAmount: b.salaryAmount != null ? String(b.salaryAmount).slice(0, 20) : "",
    currency: b.currency ? String(b.currency).slice(0, 10) : "",
    kpiBonusTier: b.kpiBonusTier ? String(b.kpiBonusTier) : "",
    kpiBonusPercent: Number(b.kpiBonusPercent) || 0,
    equityPercent: b.equityPercent != null ? String(b.equityPercent).slice(0, 10) : "",
    vestingMonths: Number(b.vestingMonths) || 0,
    cliffMonths: Number(b.cliffMonths) || 0,
    message: String(b.message || "").slice(0, 2000),
    expiresAt: b.expiresAt ? new Date(b.expiresAt) : null,
  });

  return apiSuccess(res, offer, 201);
};

export const getSentOffers = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const offers = await Offer.find({ founderId })
    .sort({ createdAt: -1 })
    .populate("talentId", "name email")
    .lean();
  return apiSuccess(res, offers);
};

export const getReceivedOffers = async (req, res) => {
  const talentId = req.params.talentId;
  if (req.user.isAdmin !== true && req.user.id !== String(talentId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const offers = await Offer.find({ talentId })
    .sort({ createdAt: -1 })
    .populate("founderId", "name email")
    .lean();
  return apiSuccess(res, offers);
};

export const updateOfferStatus = async (req, res) => {
  const offer = await Offer.findById(req.params.offerId);
  if (!offer) {
    return apiError(res, "Offer not found.", 404);
  }
  const isFounder = req.user.id === String(offer.founderId);
  const isTalent = req.user.id === String(offer.talentId);
  if (req.user.isAdmin !== true && !isFounder && !isTalent) {
    return apiError(res, "Forbidden.", 403);
  }

  const status = String(req.body?.status || "").trim();
  if (!OFFER_STATUSES.includes(status)) {
    return apiError(res, `status must be one of: ${OFFER_STATUSES.join(", ")}`, 400);
  }
  // Only the receiving talent accepts/declines; only the founder withdraws.
  if ((status === "accepted" || status === "declined") && !isTalent && req.user.isAdmin !== true) {
    return apiError(res, "Only the candidate can accept or decline an offer.", 403);
  }
  if (status === "withdrawn" && !isFounder && req.user.isAdmin !== true) {
    return apiError(res, "Only the founder can withdraw an offer.", 403);
  }

  offer.status = status;
  await offer.save();
  return apiSuccess(res, offer);
};
