import crypto from "crypto";
import mongoose from "mongoose";
import Message from "../models/Message.js";
import Cohort from "../models/Cohort.js";
import CohortMembership from "../models/CohortMembership.js";
import OrganizationAdmin from "../models/OrganizationAdmin.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import { emitMessageRealtime } from "../services/messageDelivery.js";
import { broadcastNotification } from "../services/notificationService.js";
import { logger } from "../config/logger.js";

/**
 * Step 2.14 — POST /messages/founder-to-org
 *
 * Accepts `{ organizationId, cohortId?, subject?, body, attachments? }`.
 * Validates the caller is an active cohort member of the target org, then
 * fans out one Message row per OrganizationAdmin (each admin owns their own
 * read state). All rows share `metadata.broadcastId` so the org-side UI can
 * collapse the fanout into a single thread per founder. Fire-and-forget
 * bell notification (type `founder-message`) per admin via
 * `broadcastNotification`.
 */
export const sendFounderToOrg = async (req, res) => {
  const body = req.body || {};
  const organizationId = body.organizationId;
  const cohortId = body.cohortId || null;

  if (!organizationId || !mongoose.Types.ObjectId.isValid(String(organizationId))) {
    return apiError(res, "organizationId is required.", 400);
  }

  const bodyText = String(body.body || body.message || body.content || "").trim();
  const attachments = Array.isArray(body.attachments) ? body.attachments : [];
  if (!bodyText && attachments.length === 0) {
    return apiError(
      res,
      "Message body or attachments are required.",
      400,
      undefined,
      "MESSAGE_BODY_REQUIRED",
    );
  }

  // Authorization: caller must be an active cohort member of *some* cohort
  // under organizationId. When cohortId is provided we scope to that cohort.
  const membershipQuery = {
    founderId: req.user.id,
    status: "active",
  };
  if (cohortId && mongoose.Types.ObjectId.isValid(String(cohortId))) {
    membershipQuery.cohortId = cohortId;
  }
  const memberships = await CohortMembership.find(membershipQuery)
    .select("cohortId")
    .lean();
  if (memberships.length === 0) {
    return apiError(
      res,
      "Forbidden. You must be a cohort member of this organisation.",
      403,
      undefined,
      "NOT_A_COHORT_MEMBER",
    );
  }
  const cohortIds = memberships.map((m) => m.cohortId).filter(Boolean);
  const cohorts = await Cohort.find(
    { _id: { $in: cohortIds }, organizationId },
    { _id: 1, organizationId: 1 },
  ).lean();
  if (cohorts.length === 0) {
    return apiError(
      res,
      "Forbidden. You must be a cohort member of this organisation.",
      403,
      undefined,
      "NOT_A_COHORT_MEMBER",
    );
  }
  const resolvedCohortId = cohortId
    ? cohorts.find((c) => String(c._id) === String(cohortId))?._id || null
    : cohorts[0]._id;

  const admins = await OrganizationAdmin.find(
    { organizationId },
    { userId: 1 },
  ).lean();
  const adminUserIds = admins
    .map((a) => a.userId)
    .filter(Boolean)
    .map(String);
  if (adminUserIds.length === 0) {
    return apiError(
      res,
      "This organisation has no admins set up to receive messages.",
      422,
      undefined,
      "ORG_HAS_NO_ADMINS",
    );
  }

  const broadcastId = crypto.randomUUID();
  const subject = String(body.subject || "").slice(0, 250);
  const docs = adminUserIds.map((adminUserId) => ({
    organizationId,
    cohortId: resolvedCohortId || null,
    fromUserId: req.user.id,
    toUserId: adminUserId,
    subject,
    body: bodyText,
    messageType: "dm",
    attachments,
    metadata: {
      broadcastId,
      kind: "founder-to-org",
      founderName: req.user?.name || "",
    },
  }));
  const created = await Message.insertMany(docs);
  for (const msg of created) {
    try {
      emitMessageRealtime(msg);
    } catch (err) {
      logger.warn("founder_to_org.emit_failed", {
        error: String(err?.message || err),
      });
    }
  }

  Promise.resolve()
    .then(() =>
      broadcastNotification(adminUserIds, {
        type: "founder-message",
        title: `New message from ${req.user?.name || "a founder"}`,
        message: subject || bodyText.slice(0, 140),
        actionUrl: "/?view=organizations&tab=communication",
        metadata: {
          organizationId: String(organizationId),
          cohortId: resolvedCohortId ? String(resolvedCohortId) : "",
          fromUserId: String(req.user.id),
          broadcastId,
        },
      }),
    )
    .catch((err) =>
      logger.warn("founder_to_org.notify_failed", {
        error: String(err?.message || err),
      }),
    );

  return apiSuccess(res, { broadcastId, count: created.length }, 201);
};
