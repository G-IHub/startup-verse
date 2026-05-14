import mongoose from "mongoose";
import Cohort from "../models/Cohort.js";
import CohortMembership from "../models/CohortMembership.js";
import Message from "../models/Message.js";
import OrganizationAdmin from "../models/OrganizationAdmin.js";
import Startup from "../models/Startup.js";
import User from "../models/User.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import { userHasOrganizationScope } from "../utils/orgParticipantAccess.js";
import { emitRealtime } from "../services/realtime.service.js";
import { SOCKET_EVENTS } from "../realtime/events.js";
import { organizationRoom, userRoom } from "../realtime/rooms.js";
import { mapMessageDto } from "../utils/messageDto.js";

async function assertCohortBelongsToOrg(cohortId, organizationId) {
  if (!cohortId || !mongoose.Types.ObjectId.isValid(String(cohortId))) {
    return { ok: false, status: 400, message: "Invalid cohortId." };
  }
  if (!organizationId || !mongoose.Types.ObjectId.isValid(String(organizationId))) {
    return { ok: false, status: 400, message: "Invalid organizationId." };
  }
  const cohort = await Cohort.findOne({ _id: cohortId, deletedAt: null })
    .select("organizationId")
    .lean();
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
  rooms.push(userRoom(message.fromUserId));
  const uniqueRooms = [...new Set(rooms.filter(Boolean))];
  emitRealtime(SOCKET_EVENTS.MESSAGE_CREATED, mapMessageDto(message), uniqueRooms);
}

/**
 * Build a per-user enrichment map: { userId -> { id, name, email, avatarUrl, startupName? } }.
 * Single batched User lookup + single batched Startup lookup (keyed by founderId) so
 * an inbox page is O(1) round-trips regardless of conversation count.
 */
async function buildUserEnrichmentMap(userIdStrings) {
  const result = new Map();
  const ids = (userIdStrings || [])
    .map((id) => String(id || "").trim())
    .filter((id) => id && mongoose.Types.ObjectId.isValid(id));
  if (ids.length === 0) return result;

  const [users, startups] = await Promise.all([
    User.find({ _id: { $in: ids } }, { name: 1, email: 1, avatarUrl: 1 }).lean(),
    Startup.find({ founderId: { $in: ids } }, { founderId: 1, name: 1 }).lean(),
  ]);

  const startupByFounder = new Map(
    startups.map((s) => [String(s.founderId), s.name || ""]),
  );

  for (const user of users) {
    const idStr = String(user._id);
    const startupName = startupByFounder.get(idStr) || "";
    result.set(idStr, {
      id: idStr,
      name: user.name || "",
      email: user.email || "",
      avatarUrl: user.avatarUrl || "",
      ...(startupName ? { startupName } : {}),
    });
  }

  return result;
}

function enrichedMessageDto(row, userMap) {
  const fromId = row.fromUserId ? String(row.fromUserId) : "";
  const toId = row.toUserId ? String(row.toUserId) : "";
  return {
    id: String(row._id),
    subject: typeof row.subject === "string" ? row.subject : "",
    body: row.body || "",
    fromUserId: fromId,
    toUserId: toId,
    organizationId: row.organizationId ? String(row.organizationId) : "",
    cohortId: row.cohortId ? String(row.cohortId) : "",
    startupId: row.startupId ? String(row.startupId) : "",
    messageType:
      typeof row.messageType === "string" && row.messageType
        ? row.messageType
        : "dm",
    attachments: Array.isArray(row.attachments) ? row.attachments : [],
    readAt: row.readAt || null,
    createdAt: row.createdAt || null,
    updatedAt: row.updatedAt || null,
    from: userMap.get(fromId) || (fromId ? { id: fromId, name: "", email: "" } : null),
    to: userMap.get(toId) || (toId ? { id: toId, name: "", email: "" } : null),
  };
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

  const fetchAll = () =>
    Message.find({ organizationId })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

  let rows;
  if (isPlatformAdmin) {
    rows = await fetchAll();
  } else {
    const isOrgAdmin = await OrganizationAdmin.exists({
      organizationId,
      userId: req.user.id,
    });
    if (isOrgAdmin) {
      rows = await fetchAll();
    } else {
      const inScope = await userHasOrganizationScope(
        req.user.id,
        organizationId,
      );
      if (!inScope) {
        return apiError(
          res,
          "Forbidden. You do not have access to this organization's message history.",
          403,
        );
      }
      rows = await Message.find({
        organizationId,
        $or: [{ toUserId: req.user.id }, { fromUserId: req.user.id }],
      })
        .sort({ createdAt: -1 })
        .limit(500)
        .lean();
    }
  }

  const userIds = new Set();
  for (const row of rows) {
    if (row.fromUserId) userIds.add(String(row.fromUserId));
    if (row.toUserId) userIds.add(String(row.toUserId));
  }
  const userMap = await buildUserEnrichmentMap([...userIds]);

  return apiSuccess(res, rows.map((row) => enrichedMessageDto(row, userMap)));
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

  const subject = String(body.subject || "").trim();
  const messageBody = String(body.message || "").trim();
  if (!messageBody && !subject) {
    return apiError(res, "Message subject or body is required.", 400);
  }

  const created = [];
  for (const toUserId of recipients.recipientIds) {
    const message = await Message.create({
      organizationId,
      cohortId,
      fromUserId: req.user.id,
      toUserId,
      subject,
      body: messageBody || subject,
      messageType: "bulk",
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

  const subject = String(body.subject || "").trim();
  const messageBody = String(body.message || "").trim();
  if (!messageBody && !subject) {
    return apiError(res, "Message subject or body is required.", 400);
  }

  const message = await Message.create({
    organizationId,
    cohortId,
    fromUserId: req.user.id,
    toUserId: recipientId,
    subject,
    body: messageBody || subject,
    messageType: "individual",
    attachments: [],
  });
  await emitOrgMessage(message);

  return apiSuccess(res, {
    recipientCount: 1,
    recipients: [String(recipientId)],
    messageIds: [String(message._id)],
  });
};
