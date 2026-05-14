import crypto from "crypto";
import MentorProfile from "../models/MentorProfile.js";
import User from "../models/User.js";
import Organization from "../models/Organization.js";
import CohortMembership from "../models/CohortMembership.js";
import { assertFounderInMentorOrganization } from "../utils/mentorFounderAssignment.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import { createNotification } from "../services/notificationService.js";

const isProduction = process.env.NODE_ENV === "production";

const MENTOR_COOKIE = "mentor_token";

// Canonical mentor DTO used across list, invite, get, assign, unassign, and
// session payloads. Pre-Step-1.11 rows physically lack `status`/`invitedAt`/
// `lastLoginAt`; lean reads don't materialize schema defaults, so the mapper
// fills them here. `cohortIds` is always derived from CohortMembership joins
// at the call site.
function mapMentor(mentor, user, cohortIds = []) {
  const doc = mentor?.toObject ? mentor.toObject() : mentor || {};
  return {
    id: String(doc._id || ""),
    userId: doc.userId ? String(doc.userId) : null,
    organizationId: doc.organizationId ? String(doc.organizationId) : null,
    name: user?.name || "",
    email: user?.email || "",
    avatarUrl: user?.avatarUrl || "",
    expertise: Array.isArray(doc.expertise) ? doc.expertise : [],
    status: doc.status || "active",
    assignedFounderIds: Array.isArray(doc.assignedFounders)
      ? doc.assignedFounders.map(String)
      : [],
    cohortIds: Array.from(new Set((cohortIds || []).map(String))),
    invitedAt: doc.invitedAt || doc.createdAt || null,
    lastLoginAt: doc.lastLoginAt || null,
    createdAt: doc.createdAt || null,
    updatedAt: doc.updatedAt || null,
  };
}

// Compute the unique set of cohortIds a mentor reaches through their
// assignedFounders → CohortMembership join.
async function cohortIdsForFounders(founderIds) {
  const ids = Array.from(new Set((founderIds || []).map(String).filter(Boolean)));
  if (ids.length === 0) return [];
  const memberships = await CohortMembership.find(
    { founderId: { $in: ids } },
    { cohortId: 1 },
  ).lean();
  return Array.from(new Set(memberships.map((m) => String(m.cohortId))));
}

async function mentorPayloadFromToken(token) {
  const trimmed = String(token || "").trim();
  if (!trimmed) return null;
  const mentor = await MentorProfile.findOne({ token: trimmed });
  if (!mentor) return null;
  const user = mentor.userId
    ? await User.findById(mentor.userId).select("name email avatarUrl").lean()
    : null;
  const organization = mentor.organizationId
    ? await Organization.findById(mentor.organizationId).select("name").lean()
    : null;
  const cohortIds = await cohortIdsForFounders(mentor.assignedFounders || []);
  return {
    ...mapMentor(mentor, user, cohortIds),
    organizationName: organization?.name || "",
  };
}

export function setMentorSessionCookie(res, token) {
  res.cookie(MENTOR_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearMentorSessionCookie(res) {
  res.clearCookie(MENTOR_COOKIE, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    path: "/",
  });
}

export const createMentorSession = async (req, res) => {
  const token = String(req.body?.token || "").trim();
  const mentor = await mentorPayloadFromToken(token);
  if (!mentor) {
    return apiError(res, "Invalid or expired mentor token.", 401);
  }
  setMentorSessionCookie(res, token);
  // Bump lastLoginAt on the underlying MentorProfile so admins can see when
  // a mentor last actually used their session. Awaited so the response and
  // any immediate re-read reflect the new timestamp.
  await MentorProfile.updateOne(
    { token },
    { $set: { lastLoginAt: new Date() } },
  );
  mentor.lastLoginAt = new Date();
  return apiSuccess(res, { mentor });
};

export const getMentorSessionMe = async (req, res) => {
  const token = String(req.cookies?.[MENTOR_COOKIE] || "").trim();
  if (!token) {
    return apiSuccess(res, { mentor: null });
  }
  const mentor = await mentorPayloadFromToken(token);
  if (!mentor) {
    clearMentorSessionCookie(res);
    return apiSuccess(res, { mentor: null });
  }
  return apiSuccess(res, { mentor });
};

export const logoutMentorSession = async (req, res) => {
  clearMentorSessionCookie(res);
  return apiSuccess(res, { ok: true });
};

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
  const mentorDto = await mentorPayloadFromToken(token);
  return apiSuccess(res, {
    verified: true,
    token,
    mentor: mentorDto,
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
  const mentorDocs = await MentorProfile.find({ organizationId: req.params.orgId })
    .sort({ createdAt: -1 })
    .lean();

  const userIds = [
    ...new Set(mentorDocs.map((m) => (m.userId ? String(m.userId) : "")).filter(Boolean)),
  ];
  const users = userIds.length
    ? await User.find(
        { _id: { $in: userIds } },
        { name: 1, email: 1, avatarUrl: 1 },
      ).lean()
    : [];
  const usersById = new Map(users.map((u) => [String(u._id), u]));

  const allFounderIds = [
    ...new Set(
      mentorDocs.flatMap((m) =>
        Array.isArray(m.assignedFounders) ? m.assignedFounders.map(String) : [],
      ),
    ),
  ];
  const memberships = allFounderIds.length
    ? await CohortMembership.find(
        { founderId: { $in: allFounderIds } },
        { founderId: 1, cohortId: 1 },
      ).lean()
    : [];
  const cohortIdsByFounder = new Map();
  for (const m of memberships) {
    const f = String(m.founderId);
    const set = cohortIdsByFounder.get(f) || new Set();
    set.add(String(m.cohortId));
    cohortIdsByFounder.set(f, set);
  }

  return apiSuccess(res, {
    mentors: mentorDocs.map((mentor) => {
      const cohortIds = new Set();
      for (const f of mentor.assignedFounders || []) {
        const s = cohortIdsByFounder.get(String(f));
        if (s) for (const c of s) cohortIds.add(c);
      }
      return mapMentor(
        mentor,
        usersById.get(String(mentor.userId)),
        [...cohortIds],
      );
    }),
  });
};

export const inviteOrganizationMentor = async (req, res) => {
  const orgId = req.params.orgId;
  const body = req.body || {};
  let user = null;
  if (body.userId) {
    user = await User.findById(body.userId).select("name email avatarUrl").lean();
  }
  if (!user && body.email) {
    user = await User.findOne({ email: String(body.email).trim().toLowerCase() })
      .select("name email avatarUrl")
      .lean();
  }
  // Interim: `MentorProfile.userId` is required + globally unique today, so
  // we can't persist a "pending" invite for an unregistered email. Step
  // 2.10/2.11 will lift this via a magic-link delivery and a separate
  // pending-invite row.
  if (!user) {
    return apiError(res, "userId or a registered user email is required.", 400);
  }
  const userId = user._id;

  const expertise = Array.isArray(body.expertise)
    ? body.expertise
    : typeof body.expertise === "string"
      ? body.expertise.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

  const mentor = await MentorProfile.findOneAndUpdate(
    { userId },
    {
      $set: {
        userId,
        organizationId: orgId,
        expertise,
        status: "active",
      },
      $setOnInsert: { invitedAt: new Date() },
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );

  await createNotification({
    userId,
    type: "mentor-invited",
    title: "You're invited to mentor",
    message: "An organisation has invited you to join as a mentor.",
    actionUrl: `/?view=mentor-portal`,
    metadata: { mentorId: String(mentor._id), organizationId: String(orgId) },
  }).catch(() => null);

  // New invites have no founder assignments yet, so cohortIds is [].
  return apiSuccess(res, { mentor: mapMentor(mentor, user, []) }, 201);
};

export const getMentorById = async (req, res) => {
  const mentor = await MentorProfile.findById(req.params.mentorId);
  if (!mentor) {
    return apiError(res, "Mentor not found.", 404);
  }
  const user = mentor.userId
    ? await User.findById(mentor.userId).select("name email avatarUrl").lean()
    : null;
  const cohortIds = await cohortIdsForFounders(mentor.assignedFounders || []);
  return apiSuccess(res, { mentor: mapMentor(mentor, user, cohortIds) });
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

  const user = mentor.userId
    ? await User.findById(mentor.userId).select("name email avatarUrl").lean()
    : null;
  const cohortIds = await cohortIdsForFounders(mentor.assignedFounders || []);
  return apiSuccess(res, { mentor: mapMentor(mentor, user, cohortIds) });
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

  const user = mentor.userId
    ? await User.findById(mentor.userId).select("name email avatarUrl").lean()
    : null;
  const cohortIds = await cohortIdsForFounders(mentor.assignedFounders || []);
  return apiSuccess(res, { mentor: mapMentor(mentor, user, cohortIds) });
};
