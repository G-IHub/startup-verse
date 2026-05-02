import crypto from "crypto";
import mongoose from "mongoose";
import FounderTalentInvitation from "../models/FounderTalentInvitation.js";
import CohortInvitation from "../models/CohortInvitation.js";
import Cohort from "../models/Cohort.js";
import Interest from "../models/Interest.js";
import CohortMembership from "../models/CohortMembership.js";
import Startup from "../models/Startup.js";
import Organization from "../models/Organization.js";
import OrganizationAdmin from "../models/OrganizationAdmin.js";
import User from "../models/User.js";
import TeamMemberProfile from "../models/TeamMemberProfile.js";
import Presence from "../models/Presence.js";
import Activity from "../models/Activity.js";
import Message from "../models/Message.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import { sendTokenResponse } from "../utils/sendToken.js";
import { emitRealtime } from "../services/realtime.service.js";
import { createNotification, broadcastNotification } from "../services/notificationService.js";
import { SOCKET_EVENTS } from "../realtime/events.js";
import { startupRoom, userRoom } from "../realtime/rooms.js";
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

async function isOrgAdminFor(userId, organizationId) {
  if (!organizationId) return false;
  const exists = await OrganizationAdmin.exists({
    organizationId,
    userId,
  });
  return Boolean(exists);
}

// Blueprint §6.10 — org → founder cohort invitation create.
export const createInvitation = async (req, res) => {
  const cohortId = req.body?.cohortId;
  if (!cohortId) {
    return apiError(res, "cohortId is required.", 400);
  }
  const cohort = await Cohort.findById(cohortId).lean();
  if (!cohort) {
    return apiError(res, "Cohort not found.", 404);
  }

  // Caller must be an admin of the organisation that owns the cohort.
  if (!isAdmin(req)) {
    const allowed = await isOrgAdminFor(req.user.id, cohort.organizationId);
    if (!allowed) {
      return apiError(
        res,
        "Forbidden. Only organisation admins can invite founders to a cohort.",
        403,
      );
    }
  }

  const invitation = await CohortInvitation.create({
    cohortId,
    organizationId: cohort.organizationId,
    founderId: req.body?.founderId || null,
    email: req.body?.email || "",
    message: req.body?.message || "",
    token: crypto.randomUUID(),
    status: "pending",
    invitedBy: req.user.id,
    metadata: req.body?.metadata || {},
  });

  // If the invitee is an existing user, drop a notification immediately.
  if (invitation.founderId) {
    await createNotification({
      userId: invitation.founderId,
      type: "cohort-invitation",
      title: "You've been invited to a cohort",
      message: `Join "${cohort.name || "a cohort"}" via the invitation link.`,
      actionUrl: `/?invitation=${invitation.token}`,
      metadata: {
        invitationId: String(invitation._id),
        cohortId: String(cohortId),
        organizationId: String(cohort.organizationId || ""),
      },
    }).catch(() => null);
  }
  return apiSuccess(res, invitation, 201);
};

// Blueprint §14: GET /invitations/founder/:founderId — cohort invitations for a founder.
export const getFounderInvitations = async (req, res) => {
  if (!isSelfOrAdmin(req, req.params.founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  // New canonical store + legacy back-compat for rows already in FounderTalentInvitation.
  const [cohortInvites, legacyOrgInvites] = await Promise.all([
    CohortInvitation.find({ founderId: req.params.founderId })
      .sort({ createdAt: -1 })
      .lean(),
    FounderTalentInvitation.find({
      founderId: req.params.founderId,
      kind: "org-founder",
    })
      .sort({ createdAt: -1 })
      .lean(),
  ]);
  return apiSuccess(res, [...cohortInvites, ...legacyOrgInvites]);
};

// Blueprint §14: GET /invitations/token/:token
// Looks up cohort invitations first (canonical), falls back to founder-talent
// invitations for legacy / talent token flows. Response includes a `kind`
// discriminator so clients can route to the correct UI.
export const getInvitationByToken = async (req, res) => {
  const cohortInvite = await CohortInvitation.findOne({ token: req.params.token });
  if (cohortInvite) {
    const cohort = cohortInvite.cohortId
      ? await Cohort.findById(cohortInvite.cohortId).lean()
      : null;
    const organization = cohortInvite.organizationId
      ? await Organization.findById(cohortInvite.organizationId, {
          name: 1,
          logo: 1,
        }).lean()
      : null;
    return apiSuccess(res, {
      kind: "cohort",
      invitation: cohortInvite,
      cohort,
      organization,
      organizationName: organization?.name || "",
      cohortName: cohort?.name || "",
    });
  }

  const invitation = await FounderTalentInvitation.findOne({ token: req.params.token });
  if (!invitation) {
    return apiError(res, "Invitation not found.", 404);
  }
  const startup = invitation.startupId
    ? await Startup.findById(invitation.startupId, { name: 1 })
    : null;
  return apiSuccess(res, {
    kind: invitation.kind === "org-founder" ? "cohort" : "talent",
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

// Blueprint §6.10 — founder accepts/declines a cohort invitation.
// Dual-path: prefer CohortInvitation (canonical) and fall back to legacy
// FounderTalentInvitation rows with kind="org-founder".
export const respondToInvitation = async (req, res) => {
  const invitationId = req.params.invitationId;
  const requestedStatus = String(req.body?.status || "accepted").toLowerCase();
  if (!["accepted", "declined"].includes(requestedStatus)) {
    return apiError(res, "status must be 'accepted' or 'declined'.", 400);
  }

  const cohortInvite = mongoose.Types.ObjectId.isValid(String(invitationId))
    ? await CohortInvitation.findById(invitationId)
    : null;

  if (cohortInvite) {
    if (!canAccessInvitation(req, cohortInvite)) {
      return apiError(res, "Forbidden.", 403);
    }
    if (cohortInvite.status !== "pending") {
      return apiError(res, "Invitation is no longer pending.", 409);
    }
    if (cohortInvite.expiresAt && cohortInvite.expiresAt < new Date()) {
      cohortInvite.status = "expired";
      await cohortInvite.save();
      return apiError(res, "Invitation has expired.", 410);
    }
    cohortInvite.status = requestedStatus;
    cohortInvite.respondedAt = new Date();
    await cohortInvite.save();

    if (requestedStatus === "accepted" && cohortInvite.founderId && cohortInvite.cohortId) {
      const startup = await Startup.findOne({ founderId: cohortInvite.founderId });
      if (startup) {
        await CohortMembership.findOneAndUpdate(
          { cohortId: cohortInvite.cohortId, startupId: startup._id },
          {
            cohortId: cohortInvite.cohortId,
            startupId: startup._id,
            founderId: cohortInvite.founderId,
            status: "active",
            joinedAt: new Date(),
          },
          { upsert: true, new: true },
        );
      }
    }

    // Notify org admins of the response.
    if (cohortInvite.organizationId) {
      const admins = await OrganizationAdmin.find(
        { organizationId: cohortInvite.organizationId },
        { userId: 1 },
      ).lean();
      const recipients = admins.map((a) => a.userId).filter(Boolean);
      if (recipients.length) {
        await broadcastNotification(recipients, {
          type: "cohort-invitation-response",
          title: `Invitation ${requestedStatus}`,
          message: `A founder has ${requestedStatus} the cohort invitation.`,
          actionUrl: `/?view=organizations&tab=cohorts`,
          metadata: {
            invitationId: String(cohortInvite._id),
            cohortId: String(cohortInvite.cohortId || ""),
            status: requestedStatus,
          },
        });
      }
    }

    return apiSuccess(res, cohortInvite);
  }

  // Legacy fallback (org-founder rows that pre-date the CohortInvitation split).
  const invitation = await FounderTalentInvitation.findById(invitationId);
  if (!invitation) return apiError(res, "Invitation not found.", 404);
  if (!canAccessInvitation(req, invitation)) {
    return apiError(res, "Forbidden.", 403);
  }
  invitation.status = requestedStatus;
  await invitation.save();

  if (
    requestedStatus === "accepted" &&
    invitation.startupId &&
    invitation.founderId
  ) {
    await CohortMembership.findOneAndUpdate(
      { startupId: invitation.startupId },
      {
        startupId: invitation.startupId,
        founderId: invitation.founderId,
        cohortId: req.body?.cohortId || null,
        status: "active",
        joinedAt: new Date(),
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

  if (invitation.talentId) {
    await createNotification({
      userId: invitation.talentId,
      type: "talent-invitation-received",
      title: "New invitation from a founder",
      message: req.body?.message
        ? String(req.body.message).slice(0, 200)
        : "You have a new invitation from a founder.",
      actionUrl: `/?view=virtual-office&tab=invitations&invitationId=${invitation._id}`,
      metadata: {
        invitationId: String(invitation._id),
        founderId: String(founderId),
      },
    }).catch(() => null);
  }

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
  const body = req.body?.interest || req.body || {};
  const talentId = body.talentId || req.user.id;
  if (!isSelfOrAdmin(req, talentId)) {
    return apiError(res, "Forbidden.", 403);
  }
  if (!body.founderId) {
    return apiError(res, "founderId is required.", 400);
  }
  const interest = await Interest.create({
    talentId,
    founderId: body.founderId,
    startupId: body.startupId || null,
    postId: body.postId || null,
    message: body.message || "",
    status: "pending",
    messages: [],
  });

  // Auto-send DM to founder so the interest appears in the Virtual Office chat
  try {
    const talent = await User.findById(talentId, { name: 1 }).lean();
    const talentName = talent?.name || "A talent";
    const startupLabel = body.startupTitle ? ` in "${body.startupTitle}"` : "";
    const dmBody = body.message
      ? `${talentName} is interested${startupLabel}: ${body.message}`
      : `${talentName} expressed interest${startupLabel}.`;
    const dm = await Message.create({
      startupId: null,
      fromUserId: talentId,
      toUserId: body.founderId,
      body: dmBody,
      attachments: [],
      metadata: { type: "interest", interestId: String(interest._id), startupTitle: body.startupTitle || "" },
    });
    const dmDto = {
      id: String(dm._id),
      fromUserId: String(dm.fromUserId),
      toUserId: String(dm.toUserId),
      body: dm.body,
      metadata: dm.metadata,
      createdAt: dm.createdAt,
    };
    emitRealtime(SOCKET_EVENTS.MESSAGE_CREATED, dmDto, [
      userRoom(body.founderId),
      userRoom(talentId),
    ]);
  } catch (dmErr) {
    console.error("[createInterest] Failed to send interest DM:", dmErr.message);
  }

  // Notify founder of the new interest.
  await createNotification({
    userId: body.founderId,
    type: "interest-received",
    title: "New interest in your startup",
    message: body.message
      ? `New interest: ${String(body.message).slice(0, 200)}`
      : "A talent expressed interest in your startup.",
    actionUrl: `/?view=virtual-office&tab=inbox&interestId=${interest._id}`,
    metadata: {
      interestId: String(interest._id),
      talentId: String(talentId),
      startupId: String(body.startupId || ""),
    },
  }).catch(() => null);

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

      const startupId = interest.founderId;

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

    // Notify both sides of the new team-member onboarding.
    try {
      const onboardedInterest = responsePayload?.interest;
      if (onboardedInterest) {
        await Promise.all([
          createNotification({
            userId: onboardedInterest.founderId,
            type: "team-member-joined",
            title: "Team member joined",
            message: "A new team member has joined your startup.",
            actionUrl: `/?view=virtual-office&tab=team`,
            metadata: {
              interestId: String(onboardedInterest._id),
              talentId: String(onboardedInterest.talentId || ""),
            },
          }).catch(() => null),
          createNotification({
            userId: onboardedInterest.talentId,
            type: "team-member-onboarded",
            title: "Welcome to the team",
            message: "You've been onboarded. Open the Virtual Office to begin.",
            actionUrl: `/?view=virtual-office`,
            metadata: { interestId: String(onboardedInterest._id) },
          }).catch(() => null),
        ]);
      }
    } catch (err) {
      console.error("[onboardInterest] notify failed:", err.message);
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
