import MentorProfile from "../models/MentorProfile.js";
import User from "../models/User.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";

export const verifyMentorToken = async (req, res) => {
  const t = String(req.params.token || "");
  return apiSuccess(res, {
    verified: true,
    token: t,
    mentor: {
      id: `mentor-token-${t.slice(0, 8) || "session"}`,
      name: "Mentor",
      email: "",
    },
  });
};

export const requestMentorLink = async (req, res) => {
  return apiSuccess(res, {
    sent: true,
    email: req.body?.email || "",
  });
};

export const listOrganizationMentors = async (req, res) => {
  const mentors = await MentorProfile.find({ organizationId: req.params.orgId }).sort({ createdAt: -1 });
  return apiSuccess(res, {
    mentors: mentors.map((m) => {
      const o = m.toObject();
      return { ...o, id: String(o._id) };
    }),
  });
};

export const inviteOrganizationMentor = async (req, res) => {
  const orgId = req.params.orgId;
  const body = req.body || {};
  let userId = body.userId;
  if (!userId && body.email) {
    const u = await User.findOne({ email: String(body.email).trim().toLowerCase() });
    userId = u?._id;
  }
  if (!userId) {
    return apiError(res, "userId or a registered user email is required.", 400);
  }

  const expertise = Array.isArray(body.expertise)
    ? body.expertise
    : typeof body.expertise === "string"
      ? body.expertise.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

  const mentor = await MentorProfile.findOneAndUpdate(
    { userId },
    { userId, organizationId: orgId, expertise },
    { upsert: true, new: true, runValidators: true },
  );

  const o = mentor.toObject();
  return apiSuccess(res, { mentor: { ...o, id: String(o._id) } }, 201);
};

export const getMentorById = async (req, res) => {
  const mentor = await MentorProfile.findById(req.params.mentorId);
  if (!mentor) {
    return apiError(res, "Mentor not found.", 404);
  }
  const o = mentor.toObject();
  return apiSuccess(res, { mentor: { ...o, id: String(o._id) } });
};

export const deleteMentorById = async (req, res) => {
  await MentorProfile.findByIdAndDelete(req.params.mentorId);
  return apiSuccess(res, { deleted: true });
};

export const getMentorAssignedFounders = async (req, res) => {
  const mentor = await MentorProfile.findById(req.params.mentorId);
  if (!mentor) {
    return apiError(res, "Mentor not found.", 404);
  }

  const founderIds = (mentor.assignedFounders || []).map((id) => String(id));
  return apiSuccess(res, {
    mentorId: req.params.mentorId,
    founderIds,
    founders: founderIds.map((id) => ({ id, name: "", email: "" })),
  });
};

export const assignFounderToMentor = async (req, res) => {
  const founderId = String(req.body?.founderId || "").trim();
  const mentor = await MentorProfile.findById(req.params.mentorId);
  if (!mentor) {
    return apiError(res, "Mentor not found.", 404);
  }

  const founders = new Set(mentor.assignedFounders || []);
  if (founderId) founders.add(founderId);
  mentor.assignedFounders = Array.from(founders);
  await mentor.save();

  const o = mentor.toObject();
  return apiSuccess(res, { mentor: { ...o, id: String(o._id) } });
};

export const unassignFounderFromMentor = async (req, res) => {
  const mentor = await MentorProfile.findById(req.params.mentorId);
  if (!mentor) {
    return apiError(res, "Mentor not found.", 404);
  }

  mentor.assignedFounders = (mentor.assignedFounders || []).filter(
    (item) => String(item) !== String(req.params.founderId),
  );
  await mentor.save();

  const o = mentor.toObject();
  return apiSuccess(res, { mentor: { ...o, id: String(o._id) } });
};
