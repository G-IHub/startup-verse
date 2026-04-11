import crypto from "crypto";
import FounderTalentInvitation from "../models/FounderTalentInvitation.js";
import Interest from "../models/Interest.js";
import CohortMembership from "../models/CohortMembership.js";
import Startup from "../models/Startup.js";
import User from "../models/User.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import { sendTokenResponse } from "../utils/sendToken.js";

export const createInvitation = async (req, res) => {
  const invitation = await FounderTalentInvitation.create({
    founderId: req.body?.founderId,
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
  const invitation = await FounderTalentInvitation.findByIdAndUpdate(
    req.params.invitationId,
    { status: req.body?.status || "accepted" },
    { new: true },
  );

  if (!invitation) return apiError(res, "Invitation not found.", 404);

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
  const invitation = await FounderTalentInvitation.create({
    founderId: req.body?.founderId || req.user.id,
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
  const invitations = await FounderTalentInvitation.find({ founderId: req.params.founderId }).sort({ createdAt: -1 });
  return apiSuccess(res, invitations);
};

export const getReceivedFounderTalentInvitations = async (req, res) => {
  const invitations = await FounderTalentInvitation.find({ talentId: req.params.talentId }).sort({ createdAt: -1 });
  return apiSuccess(res, invitations);
};

export const updateFounderTalentInvitationStatus = async (req, res) => {
  const invitation = await FounderTalentInvitation.findByIdAndUpdate(
    req.params.invitationId,
    { status: req.body?.status || "pending" },
    { new: true },
  );
  if (!invitation) return apiError(res, "Invitation not found.", 404);
  return apiSuccess(res, invitation);
};

export const addMessageToFounderTalentInvitation = async (req, res) => {
  const invitation = await FounderTalentInvitation.findById(req.params.invitationId);
  if (!invitation) return apiError(res, "Invitation not found.", 404);

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
  const interest = await Interest.create({
    talentId: req.body?.talentId || req.user.id,
    founderId: req.body?.founderId,
    startupId: req.body?.startupId || null,
    message: req.body?.message || "",
    status: "pending",
    messages: [],
  });
  return apiSuccess(res, interest, 201);
};

export const getReceivedInterests = async (req, res) => {
  const interests = await Interest.find({ founderId: req.params.founderId }).sort({ createdAt: -1 });
  return apiSuccess(res, interests);
};

export const getSentInterests = async (req, res) => {
  const interests = await Interest.find({ talentId: req.params.talentId }).sort({ createdAt: -1 });
  return apiSuccess(res, interests);
};

export const getInterestById = async (req, res) => {
  const interest = await Interest.findById(req.params.interestId);
  if (!interest) return apiError(res, "Interest not found.", 404);
  return apiSuccess(res, interest);
};

export const updateInterestStatus = async (req, res) => {
  const interest = await Interest.findByIdAndUpdate(
    req.params.interestId,
    { status: req.body?.status || "pending" },
    { new: true },
  );
  if (!interest) return apiError(res, "Interest not found.", 404);
  return apiSuccess(res, interest);
};

export const addMessageToInterest = async (req, res) => {
  const interest = await Interest.findById(req.params.interestId);
  if (!interest) return apiError(res, "Interest not found.", 404);

  interest.messages = [
    ...(interest.messages || []),
    { senderId: req.user.id, body: req.body?.message || "", sentAt: new Date().toISOString() },
  ];

  await interest.save();
  return apiSuccess(res, interest);
};

export const onboardInterest = async (req, res) => {
  const interest = await Interest.findByIdAndUpdate(req.params.interestId, { status: "accepted" }, { new: true });
  if (!interest) return apiError(res, "Interest not found.", 404);
  return apiSuccess(res, { onboarded: true, interest });
};
