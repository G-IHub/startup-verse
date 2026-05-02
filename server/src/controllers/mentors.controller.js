import crypto from "crypto";
import MentorProfile from "../models/MentorProfile.js";
import User from "../models/User.js";
import Organization from "../models/Organization.js";
import { assertFounderInMentorOrganization } from "../utils/mentorFounderAssignment.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import { createNotification } from "../services/notificationService.js";

// Phase D2: real mentor magic-link verification.
export const verifyMentorToken = async (req, res) => {
  const token = String(req.params.token || "").trim();
  if (!token) {
    return apiError(res, "Token is required.", 400);
  }
  const mentor = await MentorProfile.findOne({ token });
  if (!mentor) {
    return apiSuccess(res, { verified: false, token });
  }
  const user = await User.findById(mentor.userId).select("name email avatarUrl").lean();
  const organization = mentor.organizationId
    ? await Organization.findById(mentor.organizationId).select("name").lean()
    : null;
  return apiSuccess(res, {
    verified: true,
    token,
    mentor: {
      id: String(mentor._id),
      name: user?.name || "",
      email: user?.email || "",
      avatarUrl: user?.avatarUrl || "",
      organizationId: mentor.organizationId ? String(mentor.organizationId) : null,
      organizationName: organization?.name || "",
      expertise: mentor.expertise || [],
    },
  });
};

// Phase D2: real mentor magic-link issuer.
// Resolves the user by email, ensures (or upserts) a MentorProfile, mints a
// fresh token, and returns it. In a future Phase G2 step the email sender will
// deliver the magic link to the mentor's inbox.
export const requestMentorLink = async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const organizationId = req.body?.organizationId || null;
  if (!email) {
    return apiError(res, "email is required.", 400);
  }
  const user = await User.findOne({ email });
  if (!user) {
    return apiError(res, "No registered user with that email.", 404);
  }

  const token = crypto.randomUUID();
  const mentor = await MentorProfile.findOneAndUpdate(
    { userId: user._id },
    {
      userId: user._id,
      organizationId: organizationId || undefined,
      token,
      tokenIssuedAt: new Date(),
    },
    { upsert: true, new: true, runValidators: true },
  );

  await createNotification({
    userId: user._id,
    type: "mentor-link",
    title: "Mentor access link",
    message: "Your mentor magic link has been generated.",
    actionUrl: `/?mentor-token=${token}`,
    metadata: { mentorId: String(mentor._id), token },
    skipPreferences: true,
  });

  return apiSuccess(res, {
    sent: true,
    email,
    token,
    mentorId: String(mentor._id),
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

  await createNotification({
    userId,
    type: "mentor-invited",
    title: "You're invited to mentor",
    message: "An organisation has invited you to join as a mentor.",
    actionUrl: `/?view=mentor-portal`,
    metadata: { mentorId: String(mentor._id), organizationId: String(orgId) },
  }).catch(() => null);

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
  const founders = founderIds.length
    ? await User.find({ _id: { $in: founderIds } })
        .select("name email avatarUrl role")
        .lean()
    : [];
  const byId = new Map(founders.map((f) => [String(f._id), f]));
  return apiSuccess(res, {
    mentorId: req.params.mentorId,
    founderIds,
    founders: founderIds.map((id) => {
      const u = byId.get(id);
      return {
        id,
        name: u?.name || "",
        email: u?.email || "",
        avatarUrl: u?.avatarUrl || "",
        role: u?.role || "",
      };
    }),
  });
};

export const assignFounderToMentor = async (req, res) => {
  const founderId = String(req.body?.founderId || "").trim();
  const cohortId = req.body?.cohortId ? String(req.body.cohortId).trim() : "";

  if (!founderId) {
    return apiError(res, "founderId is required.", 400);
  }

  const mentor = await MentorProfile.findById(req.params.mentorId);
  if (!mentor) {
    return apiError(res, "Mentor not found.", 404);
  }

  const mentorOrgId = mentor.organizationId;
  if (!mentorOrgId) {
    return apiError(res, "Mentor is not linked to an organization.", 400);
  }

  const scope = await assertFounderInMentorOrganization(founderId, mentorOrgId, cohortId || null);
  if (!scope.ok) {
    return apiError(res, scope.message, 400);
  }

  const founders = new Set((mentor.assignedFounders || []).map((id) => String(id)));
  const wasAlreadyAssigned = founders.has(founderId);
  if (founderId) founders.add(founderId);
  mentor.assignedFounders = Array.from(founders);
  await mentor.save();

  if (!wasAlreadyAssigned) {
    const mentorUser = await User.findById(mentor.userId)
      .select("name email")
      .lean();
    await Promise.all([
      createNotification({
        userId: founderId,
        type: "mentor-assigned",
        title: "Mentor assigned",
        message: `${mentorUser?.name || "A mentor"} has been assigned to support you.`,
        actionUrl: `/?view=virtual-office&tab=mentors&mentorId=${mentor._id}`,
        metadata: { mentorId: String(mentor._id), cohortId: cohortId || null },
      }).catch(() => null),
      mentor.userId
        ? createNotification({
            userId: mentor.userId,
            type: "mentor-assigned",
            title: "Founder assigned to you",
            message: "A founder has been added to your mentee list.",
            actionUrl: `/?view=mentor-portal`,
            metadata: { mentorId: String(mentor._id), founderId },
          }).catch(() => null)
        : Promise.resolve(null),
    ]);
  }

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
