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
import Notification from "../models/Notification.js";
import Message from "../models/Message.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import { sendTokenResponse } from "../utils/sendToken.js";
import { emitRealtime } from "../services/realtime.service.js";
import { createNotification, broadcastNotification } from "../services/notificationService.js";
import { chatDeepLink, officeDeepLink, inboxDeepLink } from "../utils/deepLinks.js";
import { SOCKET_EVENTS } from "../realtime/events.js";
import { startupRoom, userRoom } from "../realtime/rooms.js";
import { mapActivityToDto } from "../utils/activityDto.js";
import {
  getAppBaseUrl,
  sendCohortInvitationEmail,
} from "../services/emailService.js";
import { logger } from "../config/logger.js";
import {
  normalizeAttachments,
  messageHasContent,
} from "../utils/messageAttachments.js";

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
const isFounderTalentKind = (invitation) =>
  String(invitation?.kind || "founder-talent") === "founder-talent";
const COMPENSATION_TYPES = new Set([
  "equity",
  "fixed",
  "hourly",
  "equity-fixed",
  "unpaid",
]);

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(value, allowedKeys) {
  return isRecord(value) &&
    Object.keys(value).every((key) => allowedKeys.has(key));
}

function isNumberInRange(value, minimum, maximum) {
  const number = Number(value);
  return Number.isFinite(number) && number >= minimum && number <= maximum;
}

function isIntegerInRange(value, minimum, maximum) {
  const number = Number(value);
  return Number.isInteger(number) && number >= minimum && number <= maximum;
}

function isValidScale(scale, percentageKey) {
  if (!Array.isArray(scale) || scale.length > 20) return false;
  return scale.every((entry) =>
    hasOnlyKeys(
      entry,
      new Set(["minCompletion", "maxCompletion", percentageKey]),
    ) &&
    isNumberInRange(entry.minCompletion, 0, 100) &&
    isNumberInRange(entry.maxCompletion, 0, 100) &&
    Number(entry.minCompletion) <= Number(entry.maxCompletion) &&
    isNumberInRange(entry[percentageKey], 0, 100),
  );
}

function isValidEquityConfig(equity) {
  const allowedKeys = new Set([
    "totalEquity",
    "vestingPeriod",
    "cliffEnabled",
    "cliffPeriod",
    "vestingFrequency",
    "performanceGated",
    "threshold",
    "partialVesting",
    "partialScale",
  ]);
  if (!hasOnlyKeys(equity, allowedKeys)) return false;
  if (!isNumberInRange(equity.totalEquity, 0.01, 100)) return false;
  if (!isIntegerInRange(equity.vestingPeriod, 1, 120)) return false;
  if (typeof equity.cliffEnabled !== "boolean") return false;
  if (!isIntegerInRange(equity.cliffPeriod, 0, 120)) return false;
  if (
    equity.cliffEnabled &&
    Number(equity.cliffPeriod) > Number(equity.vestingPeriod)
  ) {
    return false;
  }
  if (!["weekly", "monthly", "quarterly"].includes(equity.vestingFrequency)) {
    return false;
  }
  if (typeof equity.performanceGated !== "boolean") return false;
  if (!isNumberInRange(equity.threshold, 0, 100)) return false;
  if (typeof equity.partialVesting !== "boolean") return false;
  if (
    equity.partialVesting &&
    !isValidScale(equity.partialScale, "vestingPercentage")
  ) {
    return false;
  }
  return equity.partialVesting || equity.partialScale === null;
}

function isValidFixedConfig(fixed) {
  const allowedKeys = new Set([
    "paymentType",
    "amount",
    "performanceGated",
    "threshold",
    "partialPayments",
    "partialScale",
    "paymentDay",
  ]);
  if (!hasOnlyKeys(fixed, allowedKeys)) return false;
  if (!["monthly", "one-time"].includes(fixed.paymentType)) return false;
  if (!isNumberInRange(fixed.amount, 0.01, 1_000_000_000)) return false;
  if (typeof fixed.performanceGated !== "boolean") return false;
  if (!isNumberInRange(fixed.threshold, 0, 100)) return false;
  if (typeof fixed.partialPayments !== "boolean") return false;
  if (
    fixed.partialPayments &&
    !isValidScale(fixed.partialScale, "paymentPercentage")
  ) {
    return false;
  }
  if (!["last", "first", "15th"].includes(fixed.paymentDay)) return false;
  return fixed.partialPayments || fixed.partialScale === null;
}

function isValidHourlyConfig(hourly) {
  const allowedKeys = new Set([
    "rate",
    "tracking",
    "performanceGated",
    "threshold",
    "hourCap",
    "maxHoursPerWeek",
    "paymentFrequency",
  ]);
  if (!hasOnlyKeys(hourly, allowedKeys)) return false;
  if (!isNumberInRange(hourly.rate, 0.01, 1_000_000)) return false;
  if (!["self-report", "manual-approval"].includes(hourly.tracking)) return false;
  if (typeof hourly.performanceGated !== "boolean") return false;
  if (!isNumberInRange(hourly.threshold, 0, 100)) return false;
  if (typeof hourly.hourCap !== "boolean") return false;
  if (!isNumberInRange(hourly.maxHoursPerWeek, 0.01, 168)) {
    return false;
  }
  return ["weekly", "bi-weekly", "monthly"].includes(
    hourly.paymentFrequency,
  );
}

function isValidCompensationConfig(value) {
  if (!isRecord(value) || !COMPENSATION_TYPES.has(value.type)) return false;
  if (value.type === "equity") {
    return hasOnlyKeys(value, new Set(["type", "equity"])) &&
      isValidEquityConfig(value.equity);
  }
  if (value.type === "fixed") {
    return hasOnlyKeys(value, new Set(["type", "fixed"])) &&
      isValidFixedConfig(value.fixed);
  }
  if (value.type === "hourly") {
    return hasOnlyKeys(value, new Set(["type", "hourly"])) &&
      isValidHourlyConfig(value.hourly);
  }
  if (value.type === "equity-fixed") {
    return hasOnlyKeys(value, new Set(["type", "equity", "fixed"])) &&
      isValidEquityConfig(value.equity) &&
      isValidFixedConfig(value.fixed);
  }
  return hasOnlyKeys(value, new Set(["type", "unpaid"])) &&
    value.unpaid === true;
}

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
    const attachments = Array.isArray(message.attachments) ? message.attachments : [];
    return {
      senderId,
      sender: message.sender || sender?.name || "Unknown",
      text: message.text || message.body || "",
      attachments,
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
  if (founderId && !mongoose.Types.ObjectId.isValid(String(founderId))) {
    return apiError(res, "founderId must be a valid id when provided.", 400);
  }
  if (founderId) {
    const founderUser = await User.findById(founderId, { role: 1, email: 1 }).lean();
    if (!founderUser) {
      return apiError(res, "Founder user not found.", 404);
    }
    if (!["founder", "mentor"].includes(String(founderUser.role || ""))) {
      return apiError(
        res,
        "Cohort invitations can only target founders or mentors.",
        422,
      );
    }
  }
  if (!founderId) {
    const byEmailUser = await User.findOne(
      { email: normalizedEmail },
      { role: 1, email: 1 },
    ).lean();
    if (
      byEmailUser &&
      !["founder", "mentor"].includes(String(byEmailUser.role || ""))
    ) {
      return apiError(
        res,
        "Cohort invitations can only target founders or mentors.",
        422,
      );
    }
  }
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
  });

  const organization = cohort.organizationId
    ? await Organization.findById(cohort.organizationId, { name: 1 }).lean()
    : null;
  const organizationName = organization?.name || "";
  const cohortName = cohort.name || "a cohort";
  const founderName =
    metadata.founderName ||
    (typeof req.body?.founderName === "string" ? req.body.founderName.trim() : "");

  const inviteUrl = `${getAppBaseUrl()}/?invitation=${invitation.token}`;
  sendCohortInvitationEmail({
    to: normalizedEmail,
    founderName,
    cohortName,
    organizationName,
    message: invitation.message,
    inviteUrl,
  }).catch((err) => {
    logger.warn("cohort-invite-email failed", {
      invitationId: String(invitation._id),
      to: normalizedEmail,
      message: err?.message,
    });
  });

  // If the invitee is an existing user, drop a notification immediately.
  if (invitation.founderId) {
    await createNotification({
      userId: invitation.founderId,
      type: "cohort-invitation",
      title: "You've been invited to a cohort",
      message: `Join "${cohortName}" via the invitation link.`,
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

async function enrichCohortInvitationsForList(invites) {
  if (!invites?.length) return [];

  const cohortIds = [
    ...new Set(invites.map((inv) => String(inv.cohortId || "")).filter(Boolean)),
  ];
  const orgIds = [
    ...new Set(
      invites.map((inv) => String(inv.organizationId || "")).filter(Boolean),
    ),
  ];

  const [cohorts, organizations] = await Promise.all([
    cohortIds.length
      ? Cohort.find({ _id: { $in: cohortIds } }).select("name").lean()
      : [],
    orgIds.length
      ? Organization.find({ _id: { $in: orgIds } }).select("name").lean()
      : [],
  ]);

  const cohortNameById = new Map(
    cohorts.map((cohort) => [String(cohort._id), cohort.name || ""]),
  );
  const orgNameById = new Map(
    organizations.map((org) => [String(org._id), org.name || ""]),
  );

  return invites.map((inv) => {
    const cohortId = inv.cohortId ? String(inv.cohortId) : "";
    const organizationId = inv.organizationId ? String(inv.organizationId) : "";
    return {
      ...inv,
      id: String(inv._id),
      cohortName:
        cohortNameById.get(cohortId) ||
        inv.metadata?.cohortName ||
        "Cohort",
      organizationName:
        orgNameById.get(organizationId) ||
        inv.metadata?.organizationName ||
        "Organization",
    };
  });
}

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

  const enrichedCohort = await enrichCohortInvitationsForList(cohortInvites);
  const enrichedLegacy = legacyOrgInvites.map((inv) => ({
    ...inv,
    id: String(inv._id),
    cohortName: inv.metadata?.cohortName || "Cohort",
    organizationName: inv.metadata?.organizationName || "Organization",
  }));

  return apiSuccess(res, [...enrichedCohort, ...enrichedLegacy]);
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
  if (!isFounderTalentKind(invitation)) {
    return apiError(
      res,
      "This token is not valid for team-member onboarding.",
      409,
    );
  }

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
      actionUrl: inboxDeepLink({ invitationId: String(invitation._id) }),
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
  if (!isFounderTalentKind(invitation)) {
    return apiError(res, "Only founder-talent invitations are supported here.", 422);
  }
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

    if (!invitation.onboarded && invitation.founderId) {
      const invitationIdStr = String(invitation._id);
      const existing = await Notification.findOne({
        userId: invitation.founderId,
        type: "invitation-accepted",
        readAt: null,
        "metadata.invitationId": invitationIdStr,
      }).lean();

      if (!existing) {
        const talent = invitation.talentId
          ? await User.findById(invitation.talentId).select("name").lean()
          : null;
        const talentName =
          invitation.metadata?.talentName || talent?.name || "A talent";

        await createNotification({
          userId: invitation.founderId,
          type: "invitation-accepted",
          title: `${talentName} accepted your invitation`,
          message: "Ready to onboard — set compensation to add them to your team.",
          actionUrl: inboxDeepLink({ invitationId: invitationIdStr }),
          metadata: {
            invitationId: invitationIdStr,
            talentId: String(invitation.talentId || ""),
            founderId: String(invitation.founderId),
          },
        }).catch(() => null);
      }
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
  if (!isFounderTalentKind(invitation)) {
    return apiError(res, "Only founder-talent invitations are supported here.", 422);
  }
  if (!canAccessInvitation(req, invitation)) {
    return apiError(res, "Forbidden.", 403);
  }

  const rawMessage = req.body?.message;
  const text =
    typeof rawMessage === "string"
      ? rawMessage
      : typeof rawMessage?.text === "string"
        ? rawMessage.text
        : String(req.body?.body || "").trim();
  const attachments = normalizeAttachments(
    req.body?.attachments || (typeof rawMessage === "object" ? rawMessage?.attachments : []) || [],
  );
  if (!messageHasContent(text, attachments)) {
    return apiError(res, "Message body or at least one attachment is required.", 400);
  }

  const existing = Array.isArray(invitation.metadata?.messages) ? invitation.metadata.messages : [];
  invitation.metadata = {
    ...(invitation.metadata || {}),
    messages: [
      ...existing,
      {
        senderId: req.user.id,
        body: text,
        text,
        attachments,
        sentAt: new Date().toISOString(),
      },
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

  const talentUser = await User.findById(talentId, { name: 1 }).lean();
  const talentName = talentUser?.name || "A talent";

  // Auto-send DM to founder so the interest appears in the Virtual Office chat
  try {
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

  await createNotification({
    userId: body.founderId,
    type: "interest-received",
    title: "New talent interest",
    message: `${talentName} expressed interest in your startup.`,
    actionUrl: inboxDeepLink({ interestId: String(interest._id) }),
    metadata: {
      talentId: String(talentId),
      interestId: String(interest._id),
      founderId: String(body.founderId),
    },
  }).catch(() => null);

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

  const rawMessage = req.body?.message;
  const text =
    typeof rawMessage === "string"
      ? rawMessage
      : typeof rawMessage?.text === "string"
        ? rawMessage.text
        : String(req.body?.body || "").trim();
  const attachments = normalizeAttachments(
    req.body?.attachments || (typeof rawMessage === "object" ? rawMessage?.attachments : []) || [],
  );
  if (!messageHasContent(text, attachments)) {
    return apiError(res, "Message body or at least one attachment is required.", 400);
  }

  interest.messages = [
    ...(interest.messages || []),
    {
      senderId: req.user.id,
      body: text,
      text,
      attachments,
      sentAt: new Date().toISOString(),
    },
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

export const deleteInterest = async (req, res) => {
  const interest = await Interest.findById(req.params.interestId);
  if (!interest) return apiError(res, "Interest not found.", 404);
  if (!canAccessInterest(req, interest)) {
    return apiError(res, "Forbidden.", 403);
  }
  if (interest.status === "accepted") {
    return apiError(
      res,
      "Cannot remove an accepted interest. Manage the team member from your roster instead.",
      409,
    );
  }

  const payload = {
    interest: {
      id: String(interest._id),
      talentId: String(interest.talentId),
      founderId: String(interest.founderId),
      deleted: true,
    },
  };

  await Interest.findByIdAndDelete(req.params.interestId);

  emitRealtime(SOCKET_EVENTS.INTEREST_UPDATED, payload, [
    userRoom(interest.founderId),
    userRoom(interest.talentId),
  ]);

  return apiSuccess(res, { deleted: true, id: String(interest._id) });
};

export const deleteFounderTalentInvitation = async (req, res) => {
  const invitation = await FounderTalentInvitation.findById(req.params.invitationId);
  if (!invitation) return apiError(res, "Invitation not found.", 404);
  if (!isFounderTalentKind(invitation)) {
    return apiError(res, "Only founder-talent invitations are supported here.", 422);
  }
  if (!canAccessInvitation(req, invitation)) {
    return apiError(res, "Forbidden.", 403);
  }
  if (invitation.status === "accepted") {
    return apiError(
      res,
      "Cannot remove an accepted invitation. Manage the team member from your roster instead.",
      409,
    );
  }

  const eventPayload = {
    invitation: {
      id: String(invitation._id),
      founderId: String(invitation.founderId),
      talentId: String(invitation.talentId || ""),
      deleted: true,
    },
  };

  await FounderTalentInvitation.findByIdAndDelete(req.params.invitationId);

  emitRealtime(SOCKET_EVENTS.INVITATION_UPDATED, eventPayload, [
    userRoom(invitation.founderId),
    ...(invitation.talentId ? [userRoom(invitation.talentId)] : []),
  ]);

  return apiSuccess(res, { deleted: true, id: String(invitation._id) });
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
      if (!isFounderTalentKind(invitation)) {
        const unprocessable = new Error("Only founder-talent invitations can onboard team members.");
        unprocessable.statusCode = 422;
        throw unprocessable;
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
            actionUrl: chatDeepLink(onboardedInvitation.talentId),
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
            actionUrl: officeDeepLink({ tab: "team" }),
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
    const compensationConfig = req.body?.compensationConfig ?? null;
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
      const callerIsFounder =
        String(req.user?.id || "") === String(interest.founderId || "");
      const callerIsTalent =
        String(req.user?.id || "") === String(interest.talentId || "");
      if (
        !callerIsFounder &&
        !isAdmin(req) &&
        (!callerIsTalent || interest.status !== "proposed-by-founder")
      ) {
        const forbidden = new Error(
          "Only the founder can onboard this interest unless the talent is accepting a founder proposal.",
        );
        forbidden.statusCode = 403;
        throw forbidden;
      }
      if (compensationConfig && !callerIsFounder && !isAdmin(req)) {
        const forbidden = new Error("Only the founder can set compensation.");
        forbidden.statusCode = 403;
        throw forbidden;
      }
      if (compensationConfig && !isValidCompensationConfig(compensationConfig)) {
        const invalid = new Error("The compensation configuration is invalid.");
        invalid.statusCode = 422;
        throw invalid;
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
            actionUrl: chatDeepLink(onboardedInterest.talentId),
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
            actionUrl: officeDeepLink({ tab: "team" }),
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
