import mongoose from "mongoose";
import Cohort from "../models/Cohort.js";
import CohortMembership from "../models/CohortMembership.js";
import Message from "../models/Message.js";
import OrganizationAdmin from "../models/OrganizationAdmin.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import { userHasOrganizationScope } from "../utils/orgParticipantAccess.js";
import { emitRealtime } from "../services/realtime.service.js";
import { SOCKET_EVENTS } from "../realtime/events.js";
import { organizationRoom, userRoom } from "../realtime/rooms.js";

function buildMessageBody(subject, message) {
  const s = String(subject || "").trim();
  const m = String(message || "").trim();
  if (s && m) return `${s}\n\n${m}`;
  return s || m || "(no content)";
}

async function assertCohortBelongsToOrg(cohortId, organizationId) {
  if (!cohortId || !mongoose.Types.ObjectId.isValid(String(cohortId))) {
    return { ok: false, status: 400, message: "Invalid cohortId." };
  }
  if (!organizationId || !mongoose.Types.ObjectId.isValid(String(organizationId))) {
    return { ok: false, status: 400, message: "Invalid organizationId." };
  }
  const cohort = await Cohort.findById(cohortId).select("organizationId").lean();
  if (!cohort) {
    return { ok: false, status: 404, message: "Cohort not found." };
  }
  if (String(cohort.organizationId) !== String(organizationId)) {
    return { ok: false, status: 403, message: "Cohort does not belong to this organization." };
  }
  return { ok: true };
}

async function assertFoundersInCohort(cohortId, founderIds) {
  const unique = [...new Set((founderIds || []).map((id) => String(id)).filter(Boolean))];
  if (!unique.length) {
    return { ok: false, status: 400, message: "At least one recipient is required." };
  }
  const cohortObjectId = new mongoose.Types.ObjectId(cohortId);
  for (const fid of unique) {
    if (!mongoose.Types.ObjectId.isValid(fid)) {
      return { ok: false, status: 400, message: "Invalid recipient id." };
    }
    const inCohort = await CohortMembership.exists({
      cohortId: cohortObjectId,
      founderId: fid,
    });
    if (!inCohort) {
      return { ok: false, status: 400, message: "All recipients must be founders in this cohort." };
    }
  }
  return { ok: true, recipientIds: unique };
}

async function emitOrgMessage(message) {
  const rooms = [];
  if (message.organizationId) {
    rooms.push(organizationRoom(message.organizationId));
  }
  rooms.push(userRoom(message.toUserId));
  emitRealtime(SOCKET_EVENTS.MESSAGE_CREATED, message, rooms);
}

/**
 * Org admins (and platform admins) see all org-scoped messages.
 * Founders, team members in org cohorts, and org-linked mentors see only threads they sent or received.
 */
export const listOrganizationMessages = async (req, res) => {
  const organizationId = req.params.organizationId;
  if (!mongoose.Types.ObjectId.isValid(String(organizationId))) {
    return apiError(res, "Invalid organization identifier.", 400);
  }

  const userRole = String(req.user.role || "").toLowerCase();
  const isPlatformAdmin = req.user.isAdmin === true || userRole === "admin";

  const baseQuery = () => Message.find({ organizationId }).sort({ createdAt: -1 }).limit(500);

  if (isPlatformAdmin) {
    return apiSuccess(res, await baseQuery());
  }

  const isOrgAdmin = await OrganizationAdmin.exists({
    organizationId,
    userId: req.user.id,
  });
  if (isOrgAdmin) {
    return apiSuccess(res, await baseQuery());
  }

  const inScope = await userHasOrganizationScope(req.user.id, organizationId);
  if (!inScope) {
    return apiError(
      res,
      "Forbidden. You do not have access to this organization's message history.",
      403,
    );
  }

  const messages = await Message.find({
    organizationId,
    $or: [{ toUserId: req.user.id }, { fromUserId: req.user.id }],
  })
    .sort({ createdAt: -1 })
    .limit(500);

  return apiSuccess(res, messages);
};

export const bulkSendOrgMessages = async (req, res) => {
  const body = req.body || {};
  const organizationId = body.organizationId;
  const cohortId = body.cohortId;
  const recipientIds = body.recipientIds;

  const cohortCheck = await assertCohortBelongsToOrg(cohortId, organizationId);
  if (!cohortCheck.ok) {
    return apiError(res, cohortCheck.message, cohortCheck.status);
  }

  const recipients = await assertFoundersInCohort(cohortId, recipientIds);
  if (!recipients.ok) {
    return apiError(res, recipients.message, recipients.status);
  }

  const text = buildMessageBody(body.subject, body.message);
  const created = [];

  for (const toUserId of recipients.recipientIds) {
    const message = await Message.create({
      organizationId,
      fromUserId: req.user.id,
      toUserId,
      body: text,
      attachments: [],
    });
    created.push(message);
    await emitOrgMessage(message);
  }

  return apiSuccess(res, {
    recipientCount: created.length,
    recipients: created.map((m) => String(m.toUserId)),
    messageIds: created.map((m) => String(m._id)),
  });
};

export const sendIndividualOrgMessage = async (req, res) => {
  const body = req.body || {};
  const organizationId = body.organizationId;
  const cohortId = body.cohortId;
  const recipientId = String(body.recipientId || "").trim();

  if (!recipientId) {
    return apiError(res, "recipientId is required.", 400);
  }

  const cohortCheck = await assertCohortBelongsToOrg(cohortId, organizationId);
  if (!cohortCheck.ok) {
    return apiError(res, cohortCheck.message, cohortCheck.status);
  }

  const recipients = await assertFoundersInCohort(cohortId, [recipientId]);
  if (!recipients.ok) {
    return apiError(res, recipients.message, recipients.status);
  }

  const text = buildMessageBody(body.subject, body.message);
  const message = await Message.create({
    organizationId,
    fromUserId: req.user.id,
    toUserId: recipientId,
    body: text,
    attachments: [],
  });
  await emitOrgMessage(message);

  return apiSuccess(res, {
    recipientCount: 1,
    recipients: [String(recipientId)],
    messageIds: [String(message._id)],
  });
};
