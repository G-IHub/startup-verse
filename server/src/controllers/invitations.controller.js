import crypto from "crypto";
import mongoose from "mongoose";
import FounderTalentInvitation from "../models/FounderTalentInvitation.js";
import CohortInvitation from "../models/CohortInvitation.js";
import Cohort from "../models/Cohort.js";
import Interest from "../models/Interest.js";
import CohortMembership from "../models/CohortMembership.js";
import Startup from "../models/Startup.js";
import StartupPost from "../models/StartupPost.js";
import Organization from "../models/Organization.js";
import OrganizationAdmin from "../models/OrganizationAdmin.js";
import User from "../models/User.js";
import TalentProfile from "../models/TalentProfile.js";
import TeamMemberProfile from "../models/TeamMemberProfile.js";
import Presence from "../models/Presence.js";
import Activity from "../models/Activity.js";
import Message from "../models/Message.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import { sendTokenResponse } from "../utils/sendToken.js";
import { publicAppUrl } from "../utils/publicAppUrl.js";
import { emitRealtime } from "../services/realtime.service.js";
import { createNotification, broadcastNotification } from "../services/notificationService.js";
import { sendEmail } from "../services/emailService.js";
import { renderCohortInvitationEmail } from "../services/emailTemplates/cohortInvitation.js";
import { logger } from "../config/logger.js";
import { SOCKET_EVENTS } from "../realtime/events.js";
import { emitToOrganization } from "../realtime/emitOrg.js";
import { startupRoom, userRoom } from "../realtime/rooms.js";
import { mapActivityToDto } from "../utils/activityDto.js";
import {
  parseListQuery,
  paginatedSuccess,
  listDocumentsWithSearch,
} from "../utils/listQuery.js";

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

const toIdString = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
};

async function loadUsersMap(userIds) {
  const ids = [...new Set(userIds.map(toIdString).filter(Boolean))];
  if (!ids.length) return new Map();
  const users = await User.find({ _id: { $in: ids } }, { name: 1, profile: 1 }).lean();
  return new Map(users.map((user) => [String(user._id), user]));
}

async function loadStartupsMap(startupIds) {
  const ids = [...new Set(startupIds.map(toIdString).filter(Boolean))];
  if (!ids.length) return new Map();
  const startups = await Startup.find({ _id: { $in: ids } }, { name: 1, founderId: 1 }).lean();
  return new Map(startups.map((startup) => [String(startup._id), startup]));
}

async function loadFounderStartupPostTitlesMap(founderIds) {
  const ids = [...new Set(founderIds.map(toIdString).filter(Boolean))];
  if (!ids.length) return new Map();
  const posts = await StartupPost.find(
    { founderId: { $in: ids } },
    { founderId: 1, title: 1, createdAt: 1 },
  )
    .sort({ createdAt: -1 })
    .lean();
  const titlesByFounderId = new Map();
  for (const post of posts) {
    const founderId = toIdString(post.founderId);
    if (!founderId || titlesByFounderId.has(founderId)) continue;
    const title = String(post.title || "").trim();
    if (title) titlesByFounderId.set(founderId, title);
  }
  return titlesByFounderId;
}

function isGenericStartupLabel(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return !normalized || normalized === "my startup";
}

async function loadTalentProfilesMap(userIds) {
  const ids = [...new Set(userIds.map(toIdString).filter(Boolean))];
  if (!ids.length) return new Map();
  const profiles = await TalentProfile.find(
    { userId: { $in: ids } },
    { userId: 1, professionalTitle: 1, skills: 1, fullName: 1 },
  ).lean();
  return new Map(profiles.map((profile) => [String(profile.userId), profile]));
}

function mapConversationMessages(rawMessages, usersById) {
  const messages = Array.isArray(rawMessages) ? rawMessages : [];
  return messages.map((message) => {
    const senderId = toIdString(message.senderId);
    const sender = usersById.get(senderId);
    return {
      senderId,
      sender: message.sender || sender?.name || "Unknown",
      text: message.text || message.body || "",
      timestamp: message.timestamp || message.sentAt || null,
      companyName: message.companyName || "",
    };
  });
}

function buildLastActivityAt(item, messages) {
  const lastMessage = messages[messages.length - 1];
  return lastMessage?.timestamp || item.updatedAt || item.createdAt;
}

function serializeFounderTalentInvitation(invitation, context) {
  const founderId = toIdString(invitation.founderId);
  const talentId = toIdString(invitation.talentId);
  const startupId = toIdString(invitation.startupId);
  const founder = context.usersById.get(founderId);
  const talent = context.usersById.get(talentId);
  const startup = context.startupsById.get(startupId);
  const founderStartupPostTitle = context.founderStartupPostTitlesByFounderId?.get(founderId) || "";
  const messages = mapConversationMessages(invitation.metadata?.messages, context.usersById);
  const metadataStartupTitle = String(invitation.metadata?.startupTitle || "").trim();
  const startupModelName = String(startup?.name || "").trim();
  const resolvedStartupTitle = !isGenericStartupLabel(metadataStartupTitle)
    ? metadataStartupTitle
    : !isGenericStartupLabel(startupModelName)
      ? startupModelName
      : founderStartupPostTitle;

  return {
    ...invitation,
    id: String(invitation._id),
    _id: String(invitation._id),
    founderId,
    talentId,
    startupId,
    founderName: invitation.metadata?.founderName || founder?.name || "Founder",
    talentName: invitation.metadata?.talentName || talent?.name || "Talent",
    companyName: resolvedStartupTitle,
    startupTitle: resolvedStartupTitle,
    role: invitation.metadata?.role || talent?.profile?.professionalTitle || "",
    message: invitation.message || "",
    messages,
    sentAt: invitation.createdAt,
    lastActivityAt: buildLastActivityAt(invitation, messages),
  };
}

function serializeInterest(interest, context) {
  const founderId = toIdString(interest.founderId);
  const talentId = toIdString(interest.talentId);
  const startupId = toIdString(interest.startupId);
  const founder = context.usersById.get(founderId);
  const talent = context.usersById.get(talentId);
  const startup = context.startupsById.get(startupId);
  const talentProfile = context.talentProfilesById.get(talentId);
  const messages = mapConversationMessages(interest.messages, context.usersById);

  return {
    ...interest,
    id: String(interest._id),
    _id: String(interest._id),
    founderId,
    talentId,
    startupId,
    founderName: founder?.name || "Founder",
    talentName: talentProfile?.fullName || talent?.name || "Talent",
    startupTitle: startup?.name || "",
    talentArea:
      talentProfile?.professionalTitle ||
      talent?.profile?.professionalTitle ||
      "",
    talentSkills:
      Array.isArray(talentProfile?.skills) && talentProfile.skills.length > 0
        ? talentProfile.skills
        : Array.isArray(talent?.profile?.skills)
          ? talent.profile.skills
          : [],
    message: interest.message || "",
    messages,
    sentAt: interest.createdAt,
    lastActivityAt: buildLastActivityAt(interest, messages),
  };
}

async function isOrgAdminFor(userId, organizationId) {
  if (!organizationId) return false;
  const exists = await OrganizationAdmin.exists({
    organizationId,
    userId,
  });
  return Boolean(exists);
}

const RESEND_COOLDOWN_MS = 5 * 60 * 1000;

// Step 2.13: shared helper for create + resend so the email payload stays
// identical. Fire-and-forget — failures must never bubble back to the API.
function emitCohortInvitationChanged(invitation) {
  const orgId = invitation?.organizationId ? String(invitation.organizationId) : null;
  if (!orgId) return;
  emitToOrganization(orgId, SOCKET_EVENTS.COHORT_INVITATION_CHANGED, {
    invitationId: String(invitation._id),
    cohortId: invitation.cohortId ? String(invitation.cohortId) : null,
    status: invitation.status,
  });
}

function sendCohortInvitationEmail({ invitation, cohort, inviterName }) {
  const base = publicAppUrl();
  const inviteUrl = `${base}/invitation/${invitation.token}`;
  Promise.resolve()
    .then(async () => {
      const organization = cohort?.organizationId
        ? await Organization.findById(cohort.organizationId, { name: 1 }).lean()
        : null;
      return sendEmail({
        to: invitation.email,
        ...renderCohortInvitationEmail({
          organizationName: organization?.name || "",
          cohortName: cohort?.name || "",
          inviterName: inviterName || "",
          inviteUrl,
          message: invitation.message || "",
        }),
        tags: [{ name: "kind", value: "cohort-invitation" }],
      });
    })
    .catch((err) =>
      logger.warn("invitation.email_failed", { error: String(err?.message || err) }),
    );
}

// Blueprint §6.10 — org → founder cohort invitation create.
export const createInvitation = async (req, res) => {
  const cohortId = req.body?.cohortId;
  if (!cohortId) {
    return apiError(res, "cohortId is required.", 400);
  }
  const cohort = await Cohort.findOne({ _id: cohortId, deletedAt: null }).lean();
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

  const rawEmail = req.body?.email ?? req.body?.founderEmail ?? "";
  const normalizedEmail = String(rawEmail).toLowerCase().trim();
  if (!normalizedEmail) {
    return apiError(res, "email is required.", 400);
  }

  const existingByEmail = await CohortInvitation.findOne({
    cohortId,
    email: normalizedEmail,
    status: "pending",
  }).lean();
  if (existingByEmail) {
    return apiError(
      res,
      "A pending invitation already exists for this email in this cohort.",
      409,
    );
  }

  const founderId = req.body?.founderId || null;
  if (founderId && mongoose.Types.ObjectId.isValid(String(founderId))) {
    const existingByFounder = await CohortInvitation.findOne({
      cohortId,
      founderId,
      status: "pending",
    }).lean();
    if (existingByFounder) {
      return apiError(
        res,
        "A pending invitation already exists for this founder in this cohort.",
        409,
      );
    }
  }

  const metadata = { ...(req.body?.metadata || {}) };
  if (typeof req.body?.founderName === "string" && req.body.founderName.trim()) {
    metadata.founderName = req.body.founderName.trim();
  }
  if (typeof req.body?.startupName === "string" && req.body.startupName.trim()) {
    metadata.startupName = req.body.startupName.trim();
  }

  const invitation = await CohortInvitation.create({
    cohortId,
    organizationId: cohort.organizationId,
    founderId,
    email: normalizedEmail,
    message: req.body?.message || "",
    token: crypto.randomUUID(),
    status: "pending",
    invitedBy: req.user.id,
    metadata,
    lastSentAt: new Date(),
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

  sendCohortInvitationEmail({
    invitation,
    cohort,
    inviterName: req.user?.name || "",
  });

  emitCohortInvitationChanged(invitation);

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
      ? await Cohort.findOne({
          _id: cohortInvite.cohortId,
          deletedAt: null,
        }).lean()
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
    if (cohortInvite.status === "cancelled") {
      return apiError(
        res,
        "This invitation was withdrawn by the organiser.",
        409,
        undefined,
        "INVITATION_CANCELLED",
      );
    }
    if (cohortInvite.status !== "pending") {
      return apiError(
        res,
        "Invitation is no longer pending.",
        409,
        undefined,
        "INVITATION_NOT_PENDING",
      );
    }
    if (cohortInvite.expiresAt && cohortInvite.expiresAt < new Date()) {
      cohortInvite.status = "expired";
      await cohortInvite.save();
      return apiError(res, "Invitation has expired.", 410, undefined, "INVITATION_EXPIRED");
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

    emitCohortInvitationChanged(cohortInvite);

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

// Step 2.13 — admin-only helper used by cancel/resend.
async function requireOrgAdminForInvitation(req, invitation) {
  if (!invitation?.organizationId) return false;
  if (isAdmin(req)) return true;
  return isOrgAdminFor(req.user?.id, invitation.organizationId);
}

// Step 2.13 — POST /invitations/:invitationId/cancel
export const cancelInvitation = async (req, res) => {
  const invitationId = req.params.invitationId;
  if (!mongoose.Types.ObjectId.isValid(String(invitationId))) {
    return apiError(res, "Invitation not found.", 404, undefined, "INVITATION_NOT_FOUND");
  }
  const invitation = await CohortInvitation.findById(invitationId);
  if (!invitation) {
    return apiError(res, "Invitation not found.", 404, undefined, "INVITATION_NOT_FOUND");
  }
  const allowed = await requireOrgAdminForInvitation(req, invitation);
  if (!allowed) {
    return apiError(
      res,
      "Forbidden. Only organisation admins can cancel this invitation.",
      403,
      undefined,
      "INVITATION_FORBIDDEN",
    );
  }
  if (invitation.status !== "pending") {
    return apiError(
      res,
      "Invitation is no longer pending.",
      409,
      undefined,
      "INVITATION_NOT_PENDING",
    );
  }

  invitation.status = "cancelled";
  invitation.respondedAt = new Date();
  await invitation.save();

  if (invitation.founderId) {
    const cohort = invitation.cohortId
      ? await Cohort.findById(invitation.cohortId, { name: 1 }).lean()
      : null;
    createNotification({
      userId: invitation.founderId,
      type: "cohort-invitation-cancelled",
      title: "Invitation withdrawn",
      message: `Your invitation to "${cohort?.name || "a cohort"}" was withdrawn by the organiser.`,
      actionUrl: "/dashboard",
      metadata: {
        invitationId: String(invitation._id),
        cohortId: String(invitation.cohortId || ""),
      },
    }).catch((err) =>
      logger.warn("invitation.cancel_notify_failed", {
        error: String(err?.message || err),
      }),
    );
  }

  emitCohortInvitationChanged(invitation);

  return apiSuccess(res, invitation);
};

// Step 2.13 — POST /invitations/:invitationId/resend
export const resendInvitation = async (req, res) => {
  const invitationId = req.params.invitationId;
  if (!mongoose.Types.ObjectId.isValid(String(invitationId))) {
    return apiError(res, "Invitation not found.", 404, undefined, "INVITATION_NOT_FOUND");
  }
  const invitation = await CohortInvitation.findById(invitationId);
  if (!invitation) {
    return apiError(res, "Invitation not found.", 404, undefined, "INVITATION_NOT_FOUND");
  }
  const allowed = await requireOrgAdminForInvitation(req, invitation);
  if (!allowed) {
    return apiError(
      res,
      "Forbidden. Only organisation admins can resend this invitation.",
      403,
      undefined,
      "INVITATION_FORBIDDEN",
    );
  }
  if (invitation.status !== "pending") {
    return apiError(
      res,
      "Invitation is no longer pending.",
      409,
      undefined,
      "INVITATION_NOT_PENDING",
    );
  }

  const lastSent = invitation.lastSentAt || invitation.createdAt;
  const elapsed = Date.now() - new Date(lastSent).getTime();
  if (elapsed < RESEND_COOLDOWN_MS) {
    const retryAfterSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
    return apiError(
      res,
      "Please wait before resending this invitation.",
      429,
      [{ retryAfterSeconds }],
      "INVITATION_RESEND_TOO_SOON",
    );
  }

  invitation.token = crypto.randomUUID();
  invitation.expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  invitation.lastSentAt = new Date();
  await invitation.save();

  const cohort = invitation.cohortId
    ? await Cohort.findById(invitation.cohortId, { name: 1, organizationId: 1 }).lean()
    : null;
  sendCohortInvitationEmail({
    invitation,
    cohort,
    inviterName: req.user?.name || "",
  });

  return apiSuccess(res, invitation);
};

function mapCohortInvitationRow(row, usersMap) {
  const founder = row.founderId ? usersMap.get(String(row.founderId)) : null;
  const invitedBy = row.invitedBy ? usersMap.get(String(row.invitedBy)) : null;
  return {
    id: String(row._id),
    cohortId: String(row.cohortId || ""),
    organizationId: row.organizationId ? String(row.organizationId) : "",
    founderId: row.founderId ? String(row.founderId) : "",
    founderName: founder?.name || row.metadata?.founderName || "",
    email: row.email || "",
    message: row.message || "",
    status: row.status,
    token: row.token,
    expiresAt: row.expiresAt,
    respondedAt: row.respondedAt,
    lastSentAt: row.lastSentAt,
    createdAt: row.createdAt,
    invitedBy: invitedBy
      ? { id: String(invitedBy._id), name: invitedBy.name || "" }
      : row.invitedBy
        ? { id: String(row.invitedBy), name: "" }
        : null,
    metadata: row.metadata || {},
  };
}

// Step 2.13 / 3.1 — GET /cohorts/:cohortId/invitations (paginated)
export const listCohortInvitations = async (req, res) => {
  const cohortId = req.params.cohortId;
  if (!mongoose.Types.ObjectId.isValid(String(cohortId))) {
    return apiError(res, "Cohort not found.", 404);
  }
  const cohort = await Cohort.findOne({ _id: cohortId, deletedAt: null })
    .select("organizationId")
    .lean();
  if (!cohort) {
    return apiError(res, "Cohort not found.", 404);
  }
  if (!isAdmin(req)) {
    const allowed = await isOrgAdminFor(req.user?.id, cohort.organizationId);
    if (!allowed) {
      return apiError(res, "Forbidden.", 403);
    }
  }

  const listOptions = parseListQuery(req, {
    defaultSortBy: "createdAt",
    allowedSortFields: ["createdAt", "lastSentAt", "expiresAt", "status", "email"],
    defaultSortOrder: "desc",
  });

  const status = listOptions.status || "pending";
  const baseFilter = { cohortId };
  if (status && status !== "all") baseFilter.status = status;

  // ?q matches email/message only; founder display name lives on User (join deferred).
  const { items: rows, total } = await listDocumentsWithSearch(CohortInvitation, {
    baseFilter,
    listOptions,
    regexFields: ["email", "message"],
    mapRow: (r) => r,
  });

  const founderIds = rows.map((r) => r.founderId).filter(Boolean);
  const invitedByIds = rows.map((r) => r.invitedBy).filter(Boolean);
  const usersMap = await loadUsersMap([...founderIds, ...invitedByIds]);
  const items = rows.map((row) => mapCohortInvitationRow(row, usersMap));

  return paginatedSuccess(res, items, total, listOptions);
};

export const sendFounderTalentInvitation = async (req, res) => {
  const body = req.body?.invitation || req.body || {};
  const founderId = body.founderId || req.user.id;
  if (!isSelfOrAdmin(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  let resolvedTalentId = body.talentId || null;
  if (resolvedTalentId) {
    const userExists = mongoose.Types.ObjectId.isValid(String(resolvedTalentId))
      ? await User.exists({ _id: resolvedTalentId })
      : null;
    if (!userExists && mongoose.Types.ObjectId.isValid(String(resolvedTalentId))) {
      const talentProfile = await TalentProfile.findById(resolvedTalentId, { userId: 1 }).lean();
      if (talentProfile?.userId) {
        resolvedTalentId = String(talentProfile.userId);
      }
    }
  }
  if (!resolvedTalentId && !body.email) {
    return apiError(res, "talentId or email is required.", 400);
  }
  if (resolvedTalentId) {
    const existingInvitation = await FounderTalentInvitation.findOne({
      founderId,
      talentId: resolvedTalentId,
      kind: "founder-talent",
    }).lean();
    if (existingInvitation) {
      return apiError(
        res,
        "Invitation already sent to this talent. You can continue in chat instead of sending another invite.",
        409,
      );
    }
  } else if (body.email) {
    const normalizedEmail = String(body.email).toLowerCase().trim();
    if (normalizedEmail) {
      const existingEmailInvitation = await FounderTalentInvitation.findOne({
        founderId,
        email: normalizedEmail,
        kind: "founder-talent",
      }).lean();
      if (existingEmailInvitation) {
        return apiError(
          res,
          "Invitation already sent to this email. Duplicate invites are blocked.",
          409,
        );
      }
    }
  }
  const founderPosts = await StartupPost.find({ founderId })
    .sort({ createdAt: -1 })
    .limit(1)
    .lean();
  const founderStartupPost = founderPosts[0] || null;
  if (!founderStartupPost) {
    return apiError(
      res,
      "Founders must launch a startup before browsing talent or sending invitations.",
      400,
    );
  }
  const resolvedStartupTitle = String(
    founderStartupPost.title ||
      body.startupTitle ||
      "",
  ).trim();
  if (!resolvedStartupTitle) {
    return apiError(res, "Startup title is required before sending invitations.", 400);
  }
  const resolvedStartupId =
    body.startupId ||
    founderStartupPost.startupId ||
    null;

  const invitation = await FounderTalentInvitation.create({
    founderId,
    talentId: resolvedTalentId,
    startupId: resolvedStartupId,
    email: body.email || "",
    message: body.message || "",
    token: crypto.randomUUID(),
    status: "pending",
    kind: "founder-talent",
    metadata: {
      founderName: body.founderName || "",
      talentName: body.talentName || "",
      startupTitle: resolvedStartupTitle,
      role: body.role || "",
    },
  });

  if (invitation.talentId) {
    // Seed the direct chat thread with the founder's invitation message so
    // both founder and talent immediately see the same conversation in Chat.
    try {
      const founderName = String(body.founderName || req.user?.name || "Founder").trim();
      const chatBody = body.message
        ? String(body.message)
        : `${founderName} invited you to discuss ${resolvedStartupTitle}.`;
      const dm = await Message.create({
        startupId: null,
        fromUserId: founderId,
        toUserId: invitation.talentId,
        body: chatBody,
        attachments: [],
        metadata: {
          type: "invitation",
          invitationId: String(invitation._id),
          startupTitle: resolvedStartupTitle,
        },
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
        userRoom(founderId),
        userRoom(invitation.talentId),
      ]);
    } catch (dmErr) {
      console.error("[sendFounderTalentInvitation] Failed to seed DM:", dmErr.message);
    }

    await createNotification({
      userId: invitation.talentId,
      type: "talent-invitation-received",
      title: "New invitation from a founder",
      message: body.message
        ? String(body.message).slice(0, 200)
        : "You have a new invitation from a founder.",
      actionUrl: `/?view=virtual-office&tab=invitations&invitationId=${invitation._id}`,
      metadata: {
        invitationId: String(invitation._id),
        founderId: String(founderId),
      },
    }).catch(() => null);

    // Emit real-time event to talent's room for instant inbox update
    emitRealtime(SOCKET_EVENTS.INVITATION_CREATED, {
      invitation: {
        id: String(invitation._id),
        founderId: String(founderId),
        talentId: String(invitation.talentId),
        startupId: String(invitation.startupId || ""),
        message: invitation.message,
        status: invitation.status,
        createdAt: invitation.createdAt,
      },
    }, [userRoom(invitation.talentId)]);
  }

  return apiSuccess(res, invitation, 201);
};

export const getSentFounderTalentInvitations = async (req, res) => {
  if (!isSelfOrAdmin(req, req.params.founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const invitations = await FounderTalentInvitation.find({
    founderId: req.params.founderId,
    kind: "founder-talent",
  })
    .sort({ createdAt: -1 })
    .lean();
  const [usersById, startupsById, founderStartupPostTitlesByFounderId] = await Promise.all([
    loadUsersMap(invitations.flatMap((invitation) => [invitation.founderId, invitation.talentId])),
    loadStartupsMap(invitations.map((invitation) => invitation.startupId)),
    loadFounderStartupPostTitlesMap(invitations.map((invitation) => invitation.founderId)),
  ]);
  return apiSuccess(
    res,
    invitations.map((invitation) =>
      serializeFounderTalentInvitation(invitation, {
        usersById,
        startupsById,
        founderStartupPostTitlesByFounderId,
      }),
    ),
  );
};

export const getReceivedFounderTalentInvitations = async (req, res) => {
  if (!isSelfOrAdmin(req, req.params.talentId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const invitations = await FounderTalentInvitation.find({
    talentId: req.params.talentId,
    kind: "founder-talent",
  })
    .sort({ createdAt: -1 })
    .lean();
  const [usersById, startupsById, founderStartupPostTitlesByFounderId] = await Promise.all([
    loadUsersMap(invitations.flatMap((invitation) => [invitation.founderId, invitation.talentId])),
    loadStartupsMap(invitations.map((invitation) => invitation.startupId)),
    loadFounderStartupPostTitlesMap(invitations.map((invitation) => invitation.founderId)),
  ]);
  return apiSuccess(
    res,
    invitations.map((invitation) =>
      serializeFounderTalentInvitation(invitation, {
        usersById,
        startupsById,
        founderStartupPostTitlesByFounderId,
      }),
    ),
  );
};

export const updateFounderTalentInvitationStatus = async (req, res) => {
  const invitation = await FounderTalentInvitation.findById(req.params.invitationId);
  if (!invitation) return apiError(res, "Invitation not found.", 404);
  if (!canAccessInvitation(req, invitation)) {
    return apiError(res, "Forbidden.", 403);
  }
  const previousStatus = invitation.status;
  const newStatus = req.body?.status || "pending";
  invitation.status = newStatus;
  await invitation.save();

  // On accept: automatically onboard talent as team member
  if (newStatus === "accepted" && previousStatus !== "accepted" && invitation.talentId) {
    try {
      const talent = await User.findById(invitation.talentId);
      if (talent) {
        const startupId = invitation.startupId;

        talent.role = "team-member";
        talent.startupId = startupId;
        talent.founderId = invitation.founderId;
        talent.onboardingComplete = true;
        await talent.save();

        await TeamMemberProfile.findOneAndUpdate(
          { userId: talent._id },
          {
            userId: talent._id,
            founderId: invitation.founderId,
            startupId,
          },
          { upsert: true, new: true, runValidators: true },
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
            metadata: { source: "invitation-acceptance" },
          },
          { upsert: true, new: true, runValidators: true },
        );

        // Create activity for team member joining
        const createdActivity = await Activity.create({
          startupId,
          userId: talent._id,
          type: "join",
          text: "Team member joined from accepted invitation.",
          metadata: {
            invitationId: invitation._id,
            founderId: invitation.founderId,
            userName: talent.name || "",
            icon: "👋",
          },
        });

        const activityEvent = mapActivityToDto(createdActivity);
        if (activityEvent?.startupId) {
          emitRealtime(SOCKET_EVENTS.ACTIVITY_CREATED, activityEvent, [startupRoom(activityEvent.startupId)]);
        }
      }
    } catch (onboardErr) {
      console.error("[updateFounderTalentInvitationStatus] Onboarding failed:", onboardErr.message);
      // Continue - status was already updated
    }
  }

  // Emit real-time event to both parties for status update
  const eventPayload = {
    invitation: {
      id: String(invitation._id),
      founderId: String(invitation.founderId),
      talentId: String(invitation.talentId),
      startupId: String(invitation.startupId || ""),
      status: invitation.status,
      previousStatus,
      updatedAt: new Date().toISOString(),
    },
  };

  const rooms = [userRoom(invitation.founderId)];
  if (invitation.talentId) {
    rooms.push(userRoom(invitation.talentId));
  }
  emitRealtime(SOCKET_EVENTS.INVITATION_UPDATED, eventPayload, rooms);

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
  const [usersById, startupsById, founderStartupPostTitlesByFounderId] = await Promise.all([
    loadUsersMap([invitation.founderId, invitation.talentId]),
    loadStartupsMap([invitation.startupId]),
    loadFounderStartupPostTitlesMap([invitation.founderId]),
  ]);
  return apiSuccess(
    res,
    serializeFounderTalentInvitation(invitation.toObject(), {
      usersById,
      startupsById,
      founderStartupPostTitlesByFounderId,
    }),
  );
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
  const existingInterest = await Interest.findOne({
    talentId,
    founderId: body.founderId,
  }).lean();
  if (existingInterest) {
    return apiError(
      res,
      "Interest already sent to this founder. Duplicate interests are blocked.",
      409,
    );
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

  // Emit real-time event to founder's room for instant inbox update
  emitRealtime(SOCKET_EVENTS.INTEREST_CREATED, {
    interest: {
      id: String(interest._id),
      talentId: String(talentId),
      founderId: String(body.founderId),
      startupId: String(body.startupId || ""),
      message: interest.message,
      status: interest.status,
      createdAt: interest.createdAt,
    },
  }, [userRoom(body.founderId)]);

  return apiSuccess(res, interest, 201);
};

export const getReceivedInterests = async (req, res) => {
  if (!isSelfOrAdmin(req, req.params.founderId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const interests = await Interest.find({ founderId: req.params.founderId })
    .sort({ createdAt: -1 })
    .lean();
  const usersById = await loadUsersMap(
    interests.flatMap((interest) => [interest.founderId, interest.talentId]),
  );
  const startupsById = await loadStartupsMap(interests.map((interest) => interest.startupId));
  const talentProfilesById = await loadTalentProfilesMap(
    interests.map((interest) => interest.talentId),
  );
  return apiSuccess(
    res,
    interests.map((interest) =>
      serializeInterest(interest, { usersById, startupsById, talentProfilesById }),
    ),
  );
};

export const getSentInterests = async (req, res) => {
  if (!isSelfOrAdmin(req, req.params.talentId)) {
    return apiError(res, "Forbidden.", 403);
  }
  const interests = await Interest.find({ talentId: req.params.talentId })
    .sort({ createdAt: -1 })
    .lean();
  const usersById = await loadUsersMap(
    interests.flatMap((interest) => [interest.founderId, interest.talentId]),
  );
  const startupsById = await loadStartupsMap(interests.map((interest) => interest.startupId));
  const talentProfilesById = await loadTalentProfilesMap(
    interests.map((interest) => interest.talentId),
  );
  return apiSuccess(
    res,
    interests.map((interest) =>
      serializeInterest(interest, { usersById, startupsById, talentProfilesById }),
    ),
  );
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
  const previousStatus = interest.status;
  const newStatus = req.body?.status || "pending";
  interest.status = newStatus;
  await interest.save();

  // On accept: automatically onboard talent as team member
  if (newStatus === "accepted" && previousStatus !== "accepted") {
    try {
      const talent = await User.findById(interest.talentId);
      if (talent) {
        const startupId = interest.startupId || interest.founderId;

        talent.role = "team-member";
        talent.startupId = startupId;
        talent.founderId = interest.founderId;
        talent.onboardingComplete = true;
        await talent.save();

        await TeamMemberProfile.findOneAndUpdate(
          { userId: talent._id },
          {
            userId: talent._id,
            founderId: interest.founderId,
            startupId,
          },
          { upsert: true, new: true, runValidators: true },
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
            metadata: { source: "interest-acceptance" },
          },
          { upsert: true, new: true, runValidators: true },
        );

        // Create activity for team member joining
        const createdActivity = await Activity.create({
          startupId,
          userId: talent._id,
          type: "join",
          text: "Team member joined from accepted interest.",
          metadata: {
            interestId: interest._id,
            founderId: interest.founderId,
            userName: talent.name || "",
            icon: "👋",
          },
        });

        const activityEvent = mapActivityToDto(createdActivity);
        if (activityEvent?.startupId) {
          emitRealtime(SOCKET_EVENTS.ACTIVITY_CREATED, activityEvent, [startupRoom(activityEvent.startupId)]);
        }
      }
    } catch (onboardErr) {
      console.error("[updateInterestStatus] Onboarding failed:", onboardErr.message);
      // Continue - status was already updated
    }
  }

  // Emit real-time event to both parties for status update
  const eventPayload = {
    interest: {
      id: String(interest._id),
      talentId: String(interest.talentId),
      founderId: String(interest.founderId),
      startupId: String(interest.startupId || ""),
      status: interest.status,
      previousStatus,
      updatedAt: new Date().toISOString(),
    },
  };

  emitRealtime(SOCKET_EVENTS.INTEREST_UPDATED, eventPayload, [
    userRoom(interest.founderId),
    userRoom(interest.talentId),
  ]);

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
  const [usersById, startupsById, talentProfilesById] = await Promise.all([
    loadUsersMap([interest.founderId, interest.talentId]),
    loadStartupsMap([interest.startupId]),
    loadTalentProfilesMap([interest.talentId]),
  ]);
  return apiSuccess(
    res,
    serializeInterest(interest.toObject(), { usersById, startupsById, talentProfilesById }),
  );
};

export const onboardFounderTalentInvitation = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    let responsePayload = null;
    let activityEvent = null;
    const compensationConfig = req.body?.compensationConfig ?? null;

    await session.withTransaction(async () => {
      const invitation = await FounderTalentInvitation.findById(
        req.params.invitationId,
      ).session(session);
      if (!invitation) {
        throw new Error("Invitation not found.");
      }
      if (!canAccessInvitation(req, invitation)) {
        const forbidden = new Error("Forbidden.");
        forbidden.statusCode = 403;
        throw forbidden;
      }
      if (String(req.user?.id || "") !== String(invitation.founderId || "")
          && !isAdmin(req)) {
        const forbidden = new Error("Only the founder can onboard from this invitation.");
        forbidden.statusCode = 403;
        throw forbidden;
      }
      if (!invitation.talentId) {
        const unprocessable = new Error("Invitation has no talent linked yet.");
        unprocessable.statusCode = 422;
        throw unprocessable;
      }

      const startupId = invitation.startupId || invitation.founderId;

      const talent = await User.findById(invitation.talentId).session(session);
      if (!talent) {
        throw new Error("Talent user not found.");
      }

      invitation.status = "accepted";
      invitation.onboarded = true;
      await invitation.save({ session });

      talent.role = "team-member";
      talent.startupId = startupId;
      talent.founderId = invitation.founderId;
      talent.onboardingComplete = true;
      await talent.save({ session });

      await TeamMemberProfile.findOneAndUpdate(
        { userId: talent._id },
        {
          userId: talent._id,
          founderId: invitation.founderId,
          startupId,
          ...(compensationConfig ? { compensation: compensationConfig } : {}),
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
          metadata: { source: "invitation-onboarding" },
        },
        { upsert: true, new: true, runValidators: true, session },
      );

      const createdActivity = await Activity.create(
        [{
          startupId,
          userId: talent._id,
          type: "join",
          text: "Team member onboarded from accepted invitation.",
          metadata: {
            invitationId: invitation._id,
            founderId: invitation.founderId,
            userName: talent.name || "",
            icon: "👋",
          },
        }],
        { session },
      );
      activityEvent = mapActivityToDto(createdActivity?.[0]);

      responsePayload = { onboarded: true, invitation };
    });

    if (activityEvent?.startupId) {
      emitRealtime(SOCKET_EVENTS.ACTIVITY_CREATED, activityEvent, [startupRoom(activityEvent.startupId)]);
    }

    try {
      const onboardedInvitation = responsePayload?.invitation;
      if (onboardedInvitation?.talentId) {
        await Promise.all([
          createNotification({
            userId: onboardedInvitation.founderId,
            type: "team-member-joined",
            title: "Team member joined",
            message: "A new team member has been onboarded to your startup.",
            actionUrl: `/?view=virtual-office&tab=team`,
            metadata: {
              invitationId: String(onboardedInvitation._id),
              talentId: String(onboardedInvitation.talentId || ""),
            },
          }).catch(() => null),
          createNotification({
            userId: onboardedInvitation.talentId,
            type: "team-member-onboarded",
            title: "Welcome to the team",
            message: "You've been onboarded. Open the Virtual Office to begin.",
            actionUrl: `/?view=virtual-office`,
            metadata: { invitationId: String(onboardedInvitation._id) },
          }).catch(() => null),
        ]);
      }
    } catch (err) {
      console.error("[onboardFounderTalentInvitation] notify failed:", err.message);
    }

    return apiSuccess(res, responsePayload);
  } catch (error) {
    if (error.message === "Invitation not found.") {
      return apiError(res, "Invitation not found.", 404);
    }
    if (error.message === "Talent user not found.") {
      return apiError(res, "Talent user not found.", 404);
    }
    if (error.statusCode === 403) {
      return apiError(res, error.message || "Forbidden.", 403);
    }
    if (error.statusCode === 422) {
      return apiError(res, error.message, 422);
    }
    return apiError(res, "Unable to onboard invitation atomically.", 500, [error.message]);
  } finally {
    await session.endSession();
  }
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
