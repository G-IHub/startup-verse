import crypto from "crypto";
import mongoose from "mongoose";
import FounderTalentInvitation from "../models/FounderTalentInvitation.js";
import Interest from "../models/Interest.js";
import CohortMembership from "../models/CohortMembership.js";
import Startup from "../models/Startup.js";
import User from "../models/User.js";
import TeamMemberProfile from "../models/TeamMemberProfile.js";
import Presence from "../models/Presence.js";
import Activity from "../models/Activity.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import { sendTokenResponse } from "../utils/sendToken.js";
import { emitRealtime } from "../services/realtime.service.js";
import { SOCKET_EVENTS } from "../realtime/events.js";
import { startupRoom } from "../realtime/rooms.js";
import { mapActivityToDto } from "../utils/activityDto.js";

const isAdmin = (req) => req.user?.isAdmin === true;
const isSelfOrAdmin = (req, userId) => isAdmin(req) || req.user?.id === String(userId);
const canAccessInvitation = (req, invitation) =>
  isAdmin(req) ||
  req.user?.id === String(invitation?.founderId || "") ||
  req.user?.id === String(invitation?.talentId || "");
const canAccessInterest = (req, interest) =>
  isAdmin(req) ||
  req.user?.id === String(interest?.founderId || "") ||
  req.user?.id === String(interest?.talentId || "");

export const createInvitation = async (req, res) => {
  const requestedFounderId = req.body?.founderId || req.user.id;
  if (!isSelfOrAdmin(req, requestedFounderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const invitation = await FounderTalentInvitation.create({
    founderId: requestedFounderId,
    talentId: req.body?.talentId || null,
    startupId: req.body?.startupId || null,
    email: req.body?.email || "",
    message: req.body?.message || "",
    token: crypto.randomUUID(),
    status: "pending",
    kind: "org-founder",
    metadata: req.body?.metadata || {},
  });
  return apiSuccess(res, invitation, 201);
};

export const getFounderInvitations = async (req, res) => {
  if (!isSelfOrAdmin(req, req.params.founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const invitations = await FounderTalentInvitation.find({ founderId: req.params.founderId }).sort({ createdAt: -1 });
  return apiSuccess(res, invitations);
};

export const getInvitationByToken = async (req, res) => {
  const invitation = await FounderTalentInvitation.findOne({ token: req.params.token });
  if (!invitation) {
    return apiError(res, "Invitation not found.", 404);
  }
  const startup = invitation.startupId
    ? await Startup.findById(invitation.startupId, { name: 1 })
    : null;
  return apiSuccess(res, {
    invitation,
    startupName: startup?.name || "",
  });
};

export const acceptInvitationByToken = async (req, res) => {
  const { token } = req.params;
  const { name, email, password, bio = "", linkedin = "", github = "" } = req.body || {};

  if (!name || !email || !password) {
    return apiError(res, "name, email, and password are required.", 400);
  }

  const invitation = await FounderTalentInvitation.findOne({ token });
  if (!invitation) {
    return apiError(res, "Invitation not found.", 404);
  }
  if (invitation.status !== "pending") {
    return apiError(res, "This invitation is no longer available.", 409);
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  if (
    invitation.email &&
    String(invitation.email).toLowerCase().trim() &&
    String(invitation.email).toLowerCase().trim() !== normalizedEmail
  ) {
    return apiError(res, "Email does not match this invitation.", 403);
  }

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return apiError(res, "Account already exists for this email.", 409);
  }

  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    password: String(password),
    role: "team-member",
    startupId: invitation.startupId || null,
    founderId: invitation.founderId || null,
    onboardingComplete: true,
    profile: {
      bio: String(bio || ""),
      linkedin: String(linkedin || ""),
      github: String(github || ""),
      invitedViaToken: token,
    },
  });

  invitation.status = "accepted";
  invitation.talentId = user._id;
  invitation.metadata = {
    ...(invitation.metadata || {}),
    acceptedAt: new Date().toISOString(),
    acceptedUserId: user._id.toString(),
  };
  await invitation.save();

  return sendTokenResponse(user, 201, res, "Invitation accepted.");
};

export const respondToInvitation = async (req, res) => {
  const invitation = await FounderTalentInvitation.findById(req.params.invitationId);
  if (!invitation) return apiError(res, "Invitation not found.", 404);
  if (!canAccessInvitation(req, invitation)) {
    return apiError(res, "Forbidden.", 403);
  }
  invitation.status = req.body?.status || "accepted";
  await invitation.save();


  if (invitation.status === "accepted" && invitation.startupId && invitation.founderId) {
    await CohortMembership.findOneAndUpdate(
      { startupId: invitation.startupId },
      {
        startupId: invitation.startupId,
        founderId: invitation.founderId,
        cohortId: req.body?.cohortId || null,
        status: "active",
      },
      { upsert: true, new: true },
    );
  }

  return apiSuccess(res, invitation);
};

export const sendFounderTalentInvitation = async (req, res) => {
  const founderId = req.body?.founderId || req.user.id;
  if (!isSelfOrAdmin(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const invitation = await FounderTalentInvitation.create({
    founderId,
    talentId: req.body?.talentId || null,
    startupId: req.body?.startupId || null,
    email: req.body?.email || "",
    message: req.body?.message || "",
    token: crypto.randomUUID(),
    status: "pending",
    kind: "founder-talent",
  });
  return apiSuccess(res, invitation, 201);
};

export const getSentFounderTalentInvitations = async (req, res) => {
  if (!isSelfOrAdmin(req, req.params.founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const invitations = await FounderTalentInvitation.find({ founderId: req.params.founderId }).sort({ createdAt: -1 });
  return apiSuccess(res, invitations);
};

export const getReceivedFounderTalentInvitations = async (req, res) => {
  if (!isSelfOrAdmin(req, req.params.talentId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const invitations = await FounderTalentInvitation.find({ talentId: req.params.talentId }).sort({ createdAt: -1 });
  return apiSuccess(res, invitations);
};

export const updateFounderTalentInvitationStatus = async (req, res) => {
  const invitation = await FounderTalentInvitation.findById(req.params.invitationId);
  if (!invitation) return apiError(res, "Invitation not found.", 404);
  if (!canAccessInvitation(req, invitation)) {
    return apiError(res, "Forbidden.", 403);
  }
  invitation.status = req.body?.status || "pending";
  await invitation.save();
  return apiSuccess(res, invitation);
};

export const addMessageToFounderTalentInvitation = async (req, res) => {
  const invitation = await FounderTalentInvitation.findById(req.params.invitationId);
  if (!invitation) return apiError(res, "Invitation not found.", 404);
  if (!canAccessInvitation(req, invitation)) {
    return apiError(res, "Forbidden.", 403);
  }

  const existing = Array.isArray(invitation.metadata?.messages) ? invitation.metadata.messages : [];
  invitation.metadata = {
    ...(invitation.metadata || {}),
    messages: [
      ...existing,
      { senderId: req.user.id, body: req.body?.message || "", sentAt: new Date().toISOString() },
    ],
  };

  await invitation.save();
  return apiSuccess(res, invitation);
};

export const createInterest = async (req, res) => {
  const talentId = req.body?.talentId || req.user.id;
  if (!isSelfOrAdmin(req, talentId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const interest = await Interest.create({
    talentId,
    founderId: req.body?.founderId,
    startupId: req.body?.startupId || null,
    message: req.body?.message || "",
    status: "pending",
    messages: [],
  });
  return apiSuccess(res, interest, 201);
};

export const getReceivedInterests = async (req, res) => {
  if (!isSelfOrAdmin(req, req.params.founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const interests = await Interest.find({ founderId: req.params.founderId }).sort({ createdAt: -1 });
  return apiSuccess(res, interests);
};

export const getSentInterests = async (req, res) => {
  if (!isSelfOrAdmin(req, req.params.talentId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const interests = await Interest.find({ talentId: req.params.talentId }).sort({ createdAt: -1 });
  return apiSuccess(res, interests);
};

export const getInterestById = async (req, res) => {
  const interest = await Interest.findById(req.params.interestId);
  if (!interest) return apiError(res, "Interest not found.", 404);
  if (!canAccessInterest(req, interest)) {
    return apiError(res, "Forbidden.", 403);
  }
  return apiSuccess(res, interest);
};

export const updateInterestStatus = async (req, res) => {
  const interest = await Interest.findById(req.params.interestId);
  if (!interest) return apiError(res, "Interest not found.", 404);
  if (!canAccessInterest(req, interest)) {
    return apiError(res, "Forbidden.", 403);
  }
  interest.status = req.body?.status || "pending";
  await interest.save();
  return apiSuccess(res, interest);
};

export const addMessageToInterest = async (req, res) => {
  const interest = await Interest.findById(req.params.interestId);
  if (!interest) return apiError(res, "Interest not found.", 404);
  if (!canAccessInterest(req, interest)) {
    return apiError(res, "Forbidden.", 403);
  }

  interest.messages = [
    ...(interest.messages || []),
    { senderId: req.user.id, body: req.body?.message || "", sentAt: new Date().toISOString() },
  ];

  await interest.save();
  return apiSuccess(res, interest);
};

export const onboardInterest = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    let responsePayload = null;
    let activityEvent = null;
    await session.withTransaction(async () => {
      const interest = await Interest.findById(req.params.interestId).session(session);
      if (!interest) {
        throw new Error("Interest not found.");
      }
      if (!canAccessInterest(req, interest)) {
        const forbidden = new Error("Forbidden.");
        forbidden.statusCode = 403;
        throw forbidden;
      }

      const startupId =
        interest.startupId ||
        (await Startup.findOne({ founderId: interest.founderId }, { _id: 1 }).session(session))?._id;

      if (!startupId) {
        const err = new Error("Unable to resolve startup for onboarding.");
        err.statusCode = 422;
        throw err;
      }

      const talent = await User.findById(interest.talentId).session(session);
      if (!talent) {
        throw new Error("Talent user not found.");
      }

      interest.status = "accepted";
      interest.onboarded = true;
      await interest.save({ session });

      talent.role = "team-member";
      talent.startupId = startupId;
      talent.founderId = interest.founderId;
      talent.onboardingComplete = true;
      await talent.save({ session });

      await TeamMemberProfile.findOneAndUpdate(
        { userId: talent._id },
        {
          userId: talent._id,
          founderId: interest.founderId,
          startupId,
        },
        { upsert: true, new: true, runValidators: true, session },
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
          metadata: { source: "interest-onboarding" },
        },
        { upsert: true, new: true, runValidators: true, session },
      );

      const createdActivity = await Activity.create(
        [{
          startupId,
          userId: talent._id,
          type: "join",
          text: "Team member onboarded from accepted interest.",
          metadata: {
            interestId: interest._id,
            founderId: interest.founderId,
            userName: talent.name || "",
            icon: "👋",
          },
        }],
        { session },
      );
      activityEvent = mapActivityToDto(createdActivity?.[0]);

      responsePayload = { onboarded: true, interest };
    });
    if (activityEvent?.startupId) {
      emitRealtime(SOCKET_EVENTS.ACTIVITY_CREATED, activityEvent, [startupRoom(activityEvent.startupId)]);
    }
    return apiSuccess(res, responsePayload);
  } catch (error) {
    if (error.message === "Interest not found.") {
      return apiError(res, "Interest not found.", 404);
    }
    if (error.statusCode === 403) {
      return apiError(res, "Forbidden.", 403);
    }
    if (error.statusCode === 422) {
      return apiError(res, error.message, 422);
    }
    return apiError(res, "Unable to onboard interest atomically.", 500, [error.message]);
  } finally {
    await session.endSession();
  }
};
