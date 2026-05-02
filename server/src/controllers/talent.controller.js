import TalentProfile from "../models/TalentProfile.js";
import TalentApplication from "../models/TalentApplication.js";
import SavedItem from "../models/SavedItem.js";
import Startup from "../models/Startup.js";
import StartupPost from "../models/StartupPost.js";
import FounderTalentInvitation from "../models/FounderTalentInvitation.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import { attachMatchScores } from "../utils/talentMatching.js";

export const createOrUpdateProfile = async (req, res) => {
  const requestedUserId = String(req.body?.userId || "").trim();
  const targetUserId = requestedUserId || req.user.id;
  const isSelf = String(req.user.id) === String(targetUserId);
  if (!isSelf && req.user.isAdmin !== true) {
    return apiError(res, "Forbidden.", 403);
  }

  const b = req.body?.profileData || req.body || {};

  const update = {
    userId: targetUserId,
    ...(b.fullName != null ? { fullName: String(b.fullName).trim().slice(0, 100) } : {}),
    ...(b.professionalTitle != null ? { professionalTitle: String(b.professionalTitle).slice(0, 200) } : {}),
    ...(b.headline != null ? { headline: String(b.headline).slice(0, 200) } : {}),
    ...(b.location != null ? { location: String(b.location).slice(0, 200) } : {}),
    ...(b.bio != null ? { bio: String(b.bio).slice(0, 2000) } : {}),
    ...(b.professionalGoals != null ? { professionalGoals: String(b.professionalGoals).slice(0, 2000) } : {}),
    ...(Array.isArray(b.skills) ? { skills: b.skills.map((s) => String(s).slice(0, 100)) } : {}),
    ...(b.yearsOfExperience != null ? { yearsOfExperience: String(b.yearsOfExperience) } : {}),
    ...(b.availability != null ? { availability: String(b.availability).slice(0, 50) } : {}),
    ...(b.availabilityStatus != null ? { availabilityStatus: String(b.availabilityStatus) } : {}),
    ...(b.preferredCommitment != null ? { preferredCommitment: String(b.preferredCommitment) } : {}),
    ...(b.linkedinUrl != null ? { linkedinUrl: String(b.linkedinUrl).slice(0, 1000) } : {}),
    ...(b.githubUrl != null ? { githubUrl: String(b.githubUrl).slice(0, 1000) } : {}),
    ...(b.websiteUrl != null ? { websiteUrl: String(b.websiteUrl).slice(0, 1000) } : {}),
    ...(Array.isArray(b.portfolioLinks) ? { portfolioLinks: b.portfolioLinks } : {}),
    ...(Array.isArray(b.preferredRoles) ? { preferredRoles: b.preferredRoles } : {}),
    ...(Array.isArray(b.industryPreferences) ? { industryPreferences: b.industryPreferences } : {}),
    ...(Array.isArray(b.interests) ? { interests: b.interests } : {}),
    ...(Array.isArray(b.workExperiences) ? { workExperiences: b.workExperiences } : {}),
    ...(Array.isArray(b.educationList) ? { educationList: b.educationList } : {}),
    ...(Array.isArray(b.certifications) ? { certifications: b.certifications } : {}),
    ...(Array.isArray(b.portfolioItems) ? { portfolioItems: b.portfolioItems } : {}),
  };

  const profile = await TalentProfile.findOneAndUpdate(
    { userId: targetUserId },
    update,
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

/** Paginated feed of all startup posts (talent matching / browse). */
export const getStartupPostsFeed = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 50));
  const skip = (page - 1) * pageSize;
  const [rawPosts, total] = await Promise.all([
    StartupPost.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate("founderId", "name")
      .lean(),
    StartupPost.countDocuments({}),
  ]);
  const posts = rawPosts.map((post) => {
    const resolvedName =
      post.founderName ||
      post.founderId?.name ||
      "";
    const lookingFor = Array.isArray(post.lookingFor) ? post.lookingFor : [];
    return {
      ...post,
      founderId: post.founderId?._id ?? post.founderId,
      founderName: resolvedName,
      founder: resolvedName,
      role: lookingFor[0] || "",
      requirements: lookingFor,
      type: post.stage || "startup",
    };
  });
  return apiSuccess(res, { posts, total, page, pageSize });
};

export const applyForPosition = async (req, res) => {
  const letter = String(req.body?.coverLetter || req.body?.coverNote || "").slice(0, 2000);
  const application = await TalentApplication.create({
    talentId: req.params.talentId,
    startupId: req.body?.startupId || null,
    founderId: req.body?.founderId || null,
    postId: req.body?.postId || null,
    position: req.body?.position || "",
    coverNote: letter,
    coverLetter: letter,
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
  const talentId = req.params.talentId;
  const [invitations, profile, posts] = await Promise.all([
    FounderTalentInvitation.find({ talentId }).sort({ createdAt: -1 }).lean(),
    TalentProfile.findOne({ userId: talentId }).lean(),
    StartupPost.find({ visibility: "public" }).sort({ createdAt: -1 }).limit(150).lean(),
  ]);

  const scored = attachMatchScores(profile, posts).sort(
    (a, b) => (b.matchScore || 0) - (a.matchScore || 0),
  );

  return apiSuccess(res, {
    invitations,
    matches: scored,
    opportunities: scored,
  });
};
