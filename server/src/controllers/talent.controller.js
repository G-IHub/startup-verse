import TalentProfile from "../models/TalentProfile.js";
import TalentApplication from "../models/TalentApplication.js";
import SavedItem from "../models/SavedItem.js";
import Startup from "../models/Startup.js";
import FounderTalentInvitation from "../models/FounderTalentInvitation.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";

export const createOrUpdateProfile = async (req, res) => {
  const requestedUserId = String(req.body?.userId || "").trim();
  const targetUserId = requestedUserId || req.user.id;
  const isSelf = String(req.user.id) === String(targetUserId);
  if (!isSelf && req.user.isAdmin !== true) {
    return apiError(res, "Forbidden.", 403);
  }

  const profile = await TalentProfile.findOneAndUpdate(
    { userId: targetUserId },
    {
      userId: targetUserId,
      headline: req.body?.headline || "",
      bio: req.body?.bio || "",
      skills: req.body?.skills || [],
      availability: req.body?.availability || "open",
      portfolioLinks: req.body?.portfolioLinks || [],
    },
    { upsert: true, new: true, runValidators: true },
  );
  return apiSuccess(res, profile, 201);
};

export const getProfile = async (req, res) => {
  const profile = await TalentProfile.findOne({ userId: req.params.userId });
  if (!profile) {
    return apiError(res, "Talent profile not found.", 404);
  }
  return apiSuccess(res, profile);
};

export const getProfiles = async (req, res) => {
  const profiles = await TalentProfile.find({}).sort({ createdAt: -1 }).limit(100);
  return apiSuccess(res, profiles);
};

export const browseTalent = async (req, res) => {
  const profiles = await TalentProfile.find({}).sort({ createdAt: -1 }).limit(100);
  return apiSuccess(res, profiles);
};

export const getOpportunities = async (req, res) => {
  const startups = await Startup.find({}).sort({ createdAt: -1 }).limit(100);
  return apiSuccess(res, startups);
};

export const applyForPosition = async (req, res) => {
  const application = await TalentApplication.create({
    talentId: req.params.talentId,
    startupId: req.body?.startupId || null,
    founderId: req.body?.founderId || null,
    position: req.body?.position || "",
    coverNote: req.body?.coverNote || "",
    status: req.body?.status || "submitted",
  });
  return apiSuccess(res, application, 201);
};

export const getApplications = async (req, res) => {
  const applications = await TalentApplication.find({ talentId: req.params.talentId }).sort({ createdAt: -1 });
  return apiSuccess(res, applications);
};

export const saveItem = async (req, res) => {
  const item = await SavedItem.findOneAndUpdate(
    {
      talentId: req.params.talentId,
      itemType: req.body?.itemType,
      itemId: req.body?.itemId,
    },
    {
      talentId: req.params.talentId,
      itemType: req.body?.itemType,
      itemId: req.body?.itemId,
      metadata: req.body?.metadata || {},
    },
    { upsert: true, new: true, runValidators: true },
  );
  return apiSuccess(res, item, 201);
};

export const getSavedItems = async (req, res) => {
  const items = await SavedItem.find({ talentId: req.params.talentId }).sort({ createdAt: -1 });
  return apiSuccess(res, items);
};

export const unsaveItem = async (req, res) => {
  await SavedItem.findOneAndDelete({
    talentId: req.params.talentId,
    itemType: req.params.itemType,
    itemId: req.params.itemId,
  });
  return apiSuccess(res, { deleted: true });
};

export const getMatches = async (req, res) => {
  const invitations = await FounderTalentInvitation.find({ talentId: req.params.talentId }).sort({ createdAt: -1 });
  return apiSuccess(res, invitations);
};
