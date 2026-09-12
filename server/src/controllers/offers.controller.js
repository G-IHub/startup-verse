import Offer from "../models/Offer.js";
import Startup from "../models/Startup.js";
import User from "../models/User.js";
import TeamMemberProfile from "../models/TeamMemberProfile.js";
import OnboardingChecklist from "../models/OnboardingChecklist.js";
import Presence from "../models/Presence.js";
import Activity from "../models/Activity.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import { OFFER_STATUSES } from "../utils/enums.js";
import { emitRealtime } from "../services/realtime.service.js";
import { createNotification } from "../services/notificationService.js";
import { chatDeepLink, officeDeepLink } from "../utils/deepLinks.js";
import { SOCKET_EVENTS } from "../realtime/events.js";
import { startupRoom } from "../realtime/rooms.js";
import { mapActivityToDto } from "../utils/activityDto.js";

function founderGuard(req, founderId) {
  return req.user.isAdmin === true || req.user.id === String(founderId);
}

const DEFAULT_ONBOARDING_TASKS = [
  "Sign employment agreement",
  "Complete identity verification",
  "Set up your StartupVerse team member account",
  "Attend onboarding call with founder",
  "Review startup roadmap and quarterly goals",
  "Set your first week's targets",
];

function sanitizeTiers(tiers) {
  if (!Array.isArray(tiers)) return [];
  return tiers.slice(0, 3).map((t, i) => ({
    tierNumber: Number(t.tierNumber) || i + 1,
    label: String(t.label || "").slice(0, 100),
    completionMin: Number(t.completionMin) || 0,
    completionMax: t.completionMax != null && t.completionMax !== "" ? Number(t.completionMax) : null,
    monthlyCash: Number(t.monthlyCash) || 0,
    bonusAmount: Number(t.bonusAmount) || 0,
    qualityScoreThreshold: t.qualityScoreThreshold != null && t.qualityScoreThreshold !== "" ? Number(t.qualityScoreThreshold) : null,
    additionalEquityPercent: Number(t.additionalEquityPercent) || 0,
  }));
}

function sanitizeKpis(kpis) {
  if (!Array.isArray(kpis)) return [];
  return kpis.slice(0, 12).map((k) => ({
    name: String(k.name || "").slice(0, 200),
    target: String(k.target || "").slice(0, 100),
    weight: Number(k.weight) || 0,
    enabled: k.enabled !== false,
  })).filter((k) => k.name);
}

// Maps an accepted offer's REAL fields into the TeamMemberProfile.compensation
// shape the payroll engine actually understands. Only Tier 1 (the base/floor)
// drives ongoing compensation — tiers 2/3 and weighted KPIs are saved on the
// offer for the candidate to see, but nothing auto-enforces them yet.
// task-based / revenue-share models aren't representable in that schema at
// all, so they're honestly skipped (compensation stays null) rather than
// forced into a shape that doesn't fit.
function offerToCompensationConfig(offer) {
  const tier1 = (offer.performanceTiers || []).find((t) => t.tierNumber === 1) || null;
  const hasSalary = ["salary", "hybrid"].includes(offer.compensationModel);
  const equityPct = parseFloat(offer.equityPercent);
  const hasEquity = ["equity-only", "hybrid"].includes(offer.compensationModel) || (Number.isFinite(equityPct) && equityPct > 0);

  let fixed = null;
  if (hasSalary) {
    const amount = tier1?.monthlyCash || parseFloat(offer.salaryAmount) || 0;
    if (amount > 0) {
      fixed = {
        paymentType: "monthly",
        amount,
        performanceGated: Boolean(tier1),
        threshold: tier1?.completionMin ?? 60,
        partialPayments: false,
        partialScale: null,
        paymentDay: offer.paymentSchedule === "15th" ? "15th" : "last",
      };
    }
  }

  let equity = null;
  if (hasEquity && Number.isFinite(equityPct) && equityPct > 0) {
    equity = {
      totalEquity: String(equityPct),
      vestingPeriod: Number(offer.vestingMonths) || 48,
      cliffEnabled: Boolean(Number(offer.cliffMonths)),
      cliffPeriod: Number(offer.cliffMonths) || 0,
      vestingFrequency: "monthly",
      performanceGated: false,
      threshold: 0,
      partialVesting: false,
      partialScale: null,
    };
  }

  if (fixed && equity) return { type: "equity-fixed", fixed, equity };
  if (fixed) return { type: "fixed", fixed };
  if (equity) return { type: "equity", equity };
  return null;
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
    employmentType: b.employmentType ? String(b.employmentType) : "",
    startDate: b.startDate ? new Date(b.startDate) : null,
    probationDays: Number(b.probationDays) || 0,
    reportingTo: b.reportingTo ? String(b.reportingTo).slice(0, 200) : "",
    workLocation: b.workLocation ? String(b.workLocation) : "",
    responsibilities: b.responsibilities ? String(b.responsibilities).slice(0, 2000) : "",

    compensationModel: b.compensationModel ? String(b.compensationModel) : "salary",
    salaryAmount: b.salaryAmount != null ? String(b.salaryAmount).slice(0, 20) : "",
    currency: b.currency ? String(b.currency).slice(0, 10) : "",
    paymentSchedule: b.paymentSchedule ? String(b.paymentSchedule) : "",
    bonusStructure: b.bonusStructure ? String(b.bonusStructure) : "",

    performanceTiers: sanitizeTiers(b.performanceTiers),
    kpis: sanitizeKpis(b.kpis),

    kpiBonusTier: b.kpiBonusTier ? String(b.kpiBonusTier) : "",
    kpiBonusPercent: Number(b.kpiBonusPercent) || 0,
    equityPercent: b.equityPercent != null ? String(b.equityPercent).slice(0, 10) : "",
    vestingMonths: Number(b.vestingMonths) || 0,
    cliffMonths: Number(b.cliffMonths) || 0,
    acceleratedVesting: b.acceleratedVesting ? String(b.acceleratedVesting) : "",
    valuationAtOffer: b.valuationAtOffer != null && b.valuationAtOffer !== "" ? Number(b.valuationAtOffer) : null,

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

  if (status !== "accepted" || offer.status === "accepted") {
    offer.status = status;
    await offer.save();
    return apiSuccess(res, offer);
  }

  // Real acceptance: convert the candidate into a real team member — role
  // change, real TeamMemberProfile (mapped from the offer's real fields),
  // real onboarding checklist, real presence row. No multi-document
  // transaction here (matches acceptInvitationByToken's pattern, not
  // onboardInterest's) — local dev Mongo runs standalone, not a replica set,
  // and session.withTransaction() hard-fails there; sequential awaits work
  // in both environments.
  let activityEvent = null;
  try {
    const talent = await User.findById(offer.talentId);
    if (!talent) {
      return apiError(res, "Talent user not found.", 404);
    }

    offer.status = "accepted";
    await offer.save();

    const startupId = offer.startupId || offer.founderId;
    talent.role = "team-member";
    talent.startupId = startupId;
    talent.founderId = offer.founderId;
    talent.onboardingComplete = true;
    await talent.save();

    const compensationConfig = offerToCompensationConfig(offer);
    await TeamMemberProfile.findOneAndUpdate(
      { userId: talent._id },
      {
        userId: talent._id,
        founderId: offer.founderId,
        startupId,
        ...(compensationConfig ? { compensation: compensationConfig } : {}),
      },
      { upsert: true, new: true, runValidators: true },
    );

    await OnboardingChecklist.findOneAndUpdate(
      { teamMemberId: talent._id },
      {
        $setOnInsert: {
          teamMemberId: talent._id,
          founderId: offer.founderId,
          startupId,
          tasks: DEFAULT_ONBOARDING_TASKS.map((title) => ({ title, done: false })),
        },
      },
      { upsert: true, new: true },
    );

    await Presence.findOneAndUpdate(
      { startupId: String(startupId), userId: String(talent._id) },
      {
        startupId: String(startupId),
        userId: String(talent._id),
        userName: talent.name || "",
        role: "team-member",
        isOnline: false,
        lastSeenAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        metadata: { source: "offer-acceptance" },
      },
      { upsert: true, new: true, runValidators: true },
    );

    const createdActivity = await Activity.create({
      startupId,
      userId: talent._id,
      type: "join",
      text: "Team member onboarded from an accepted offer.",
      metadata: {
        offerId: offer._id,
        founderId: offer.founderId,
        userName: talent.name || "",
        icon: "👋",
      },
    });
    activityEvent = mapActivityToDto(createdActivity);
  } catch (error) {
    return apiError(res, "Unable to accept offer.", 500, [error.message]);
  }

  if (activityEvent?.startupId) {
    emitRealtime(SOCKET_EVENTS.ACTIVITY_CREATED, activityEvent, [startupRoom(activityEvent.startupId)]);
  }

  try {
    await Promise.all([
      createNotification({
        userId: offer.founderId,
        type: "team-member-joined",
        title: "Offer accepted",
        message: "A candidate accepted your offer and joined your team.",
        actionUrl: chatDeepLink(offer.talentId),
        metadata: { offerId: String(offer._id), talentId: String(offer.talentId) },
      }).catch(() => null),
      createNotification({
        userId: offer.talentId,
        type: "team-member-onboarded",
        title: "Welcome to the team",
        message: "You've accepted the offer. Open the Virtual Office to begin.",
        actionUrl: officeDeepLink({ tab: "team" }),
        metadata: { offerId: String(offer._id) },
      }).catch(() => null),
    ]);
  } catch (err) {
    console.error("[updateOfferStatus] notify failed:", err.message);
  }

  return apiSuccess(res, offer);
};
