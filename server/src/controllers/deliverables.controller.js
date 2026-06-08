import Deliverable from "../models/Deliverable.js";
import DeliverableSubmission from "../models/DeliverableSubmission.js";
import CohortMembership from "../models/CohortMembership.js";
import Cohort from "../models/Cohort.js";
import OrganizationAdmin from "../models/OrganizationAdmin.js";
import User from "../models/User.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import { createNotification, broadcastNotification } from "../services/notificationService.js";
import { officeDeepLink } from "../utils/deepLinks.js";
import {
  DELIVERABLE_TYPES,
  DELIVERABLE_SUBMISSION_STATUSES,
} from "../utils/enums.js";
import { emitRealtime } from "../services/realtime.service.js";
import { SOCKET_EVENTS } from "../realtime/events.js";
import { organizationRoom } from "../realtime/rooms.js";

function mapDeliverable(d) {
  const o = d.toObject ? d.toObject() : d;
  return {
    ...o,
    id: String(o._id),
    requirements: Array.isArray(o.requirements) ? o.requirements : [],
    archived: Boolean(o.archived),
  };
}

function normalizeRequirements(raw) {
  return Array.isArray(raw)
    ? raw.map((r) => String(r).trim()).filter(Boolean)
    : [];
}

function coerceDeliverablePayload(body, { isUpdate = false } = {}) {
  const out = {};
  const has = (k) =>
    Object.prototype.hasOwnProperty.call(body, k) && body[k] !== undefined;

  if (!isUpdate || has("title")) out.title = body.title || "Deliverable";
  if (!isUpdate || has("description")) out.description = body.description || "";
  if (!isUpdate || has("type")) {
    out.type = DELIVERABLE_TYPES.includes(body.type) ? body.type : "general";
  }
  if (!isUpdate || has("requirements")) {
    out.requirements = normalizeRequirements(body.requirements);
  }
  if (!isUpdate || has("dueDate")) out.dueDate = body.dueDate || null;
  if (isUpdate && has("archived")) out.archived = Boolean(body.archived);
  return out;
}

async function organizationIdForDeliverable(deliverable) {
  if (!deliverable) return null;
  if (deliverable.organizationId) return String(deliverable.organizationId);
  if (deliverable.cohortId) {
    const cohort = await Cohort.findOne({
      _id: deliverable.cohortId,
      deletedAt: null,
    })
      .select("organizationId")
      .lean();
    return cohort?.organizationId ? String(cohort.organizationId) : null;
  }
  return null;
}

function normalizeSubmissionStatus(status) {
  const s = String(status || "").toLowerCase();
  if (s === "needs-revision") return "revision_requested";
  return s;
}

function sanitizeAttachments(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((a) => a && typeof a.url === "string" && a.url.trim())
    .map((a) => ({
      url: String(a.url).trim(),
      name: a.name != null ? String(a.name).slice(0, 500) : "",
      mimeType: a.mimeType != null ? String(a.mimeType).slice(0, 200) : "",
      uploadedAt: a.uploadedAt ? new Date(a.uploadedAt) : new Date(),
    }));
}

async function notifyOrgAdminsOfSubmission(submission, deliverable) {
  if (!deliverable) return;
  const orgId =
    deliverable.organizationId ||
    (deliverable.cohortId
      ? (
          await Cohort.findOne({ _id: deliverable.cohortId, deletedAt: null })
            .select("organizationId")
            .lean()
        )?.organizationId
      : null);
  if (!orgId) return;
  const admins = await OrganizationAdmin.find({ organizationId: orgId }, { userId: 1 }).lean();
  const recipients = admins.map((a) => a.userId).filter(Boolean);
  if (!recipients.length) return;
  await broadcastNotification(recipients, {
    type: "deliverable-submitted",
    title: "Deliverable submitted",
    message: `A deliverable was submitted for "${deliverable.title}"`,
    actionUrl: `/?view=organizations&tab=deliverables&deliverableId=${deliverable._id}`,
    metadata: {
      deliverableId: String(deliverable._id),
      submissionId: String(submission._id),
      founderId: String(submission.founderId || ""),
    },
  });
}

export const getFounderDeliverables = async (req, res) => {
  const founderId = req.params.founderId;
  const memberships = await CohortMembership.find({ founderId });
  const cohortIds = memberships.map((m) => m.cohortId).filter(Boolean);

  // Archived deliverables are hidden by default; admins can opt in with ?includeArchived=1
  const includeArchived =
    req.query?.includeArchived === "1" || req.query?.includeArchived === "true";
  const filter = { cohortId: { $in: cohortIds } };
  if (!includeArchived) filter.archived = { $ne: true };

  const deliverables = await Deliverable.find(filter)
    .sort({ createdAt: -1 })
    .lean();

  const deliverableIds = deliverables.map((d) => d._id);
  const submissions = deliverableIds.length
    ? await DeliverableSubmission.find({
        deliverableId: { $in: deliverableIds },
        founderId,
      }).lean()
    : [];
  const submissionByDeliverable = new Map(
    submissions.map((s) => [String(s.deliverableId), s]),
  );

  const cohorts = cohortIds.length
    ? await Cohort.find({ _id: { $in: cohortIds } }).select("name").lean()
    : [];
  const cohortNameById = new Map(cohorts.map((c) => [String(c._id), c.name || ""]));

  const enriched = deliverables.map((d) => {
    const sub = submissionByDeliverable.get(String(d._id));
    let mySubmission = null;
    if (sub) {
      const firstLink = Array.isArray(sub.links) && sub.links[0] ? sub.links[0] : "";
      mySubmission = {
        status: sub.status,
        feedback: sub.feedback || sub.review?.feedback || "",
        submittedAt: sub.updatedAt || sub.createdAt,
        submissionUrl: firstLink,
        notes: sub.content || "",
        attachments: Array.isArray(sub.attachments) ? sub.attachments : [],
      };
    }
    return {
      ...d,
      requirements: Array.isArray(d.requirements) ? d.requirements : [],
      cohortName: cohortNameById.get(String(d.cohortId)) || "",
      mySubmission,
    };
  });

  return apiSuccess(res, enriched);
};

export const getCohortDeliverables = async (req, res) => {
  const includeArchived =
    req.query?.includeArchived === "1" || req.query?.includeArchived === "true";
  const filter = { cohortId: req.params.cohortId };
  if (!includeArchived) filter.archived = { $ne: true };

  const deliverables = await Deliverable.find(filter).sort({ createdAt: -1 });
  return apiSuccess(res, deliverables.map(mapDeliverable));
};

export const createDeliverable = async (req, res) => {
  const coerced = coerceDeliverablePayload(req.body || {}, { isUpdate: false });
  const deliverable = await Deliverable.create({
    cohortId: req.body?.cohortId,
    organizationId: req.body?.organizationId || null,
    ...coerced,
    createdBy: req.user.id,
  });
  return apiSuccess(res, mapDeliverable(deliverable), 201);
};

/** POST /cohorts/:cohortId/deliverables — cohortId from URL */
export const createCohortDeliverable = async (req, res) => {
  const coerced = coerceDeliverablePayload(req.body || {}, { isUpdate: false });
  const deliverable = await Deliverable.create({
    cohortId: req.params.cohortId,
    organizationId: req.body?.organizationId || null,
    ...coerced,
    createdBy: req.user.id,
  });
  return apiSuccess(res, mapDeliverable(deliverable), 201);
};

/** PUT /cohorts/:cohortId/deliverables/:deliverableId */
export const updateCohortDeliverable = async (req, res) => {
  const { cohortId, deliverableId } = req.params;
  const deliverable = await Deliverable.findById(deliverableId);
  if (!deliverable) {
    return apiError(res, "Deliverable not found.", 404);
  }
  if (String(deliverable.cohortId) !== String(cohortId)) {
    return apiError(res, "Deliverable does not belong to this cohort.", 403);
  }

  const patch = coerceDeliverablePayload(req.body || {}, { isUpdate: true });
  Object.assign(deliverable, patch);
  await deliverable.save();

  const dto = mapDeliverable(deliverable);
  const orgId = await organizationIdForDeliverable(deliverable);
  if (orgId) {
    emitRealtime(SOCKET_EVENTS.DELIVERABLE_UPDATED, dto, [organizationRoom(orgId)]);
  }
  return apiSuccess(res, dto);
};

/** PATCH /cohorts/:cohortId/deliverables/:deliverableId/archive - idempotent. */
export const archiveCohortDeliverable = async (req, res) => {
  const { cohortId, deliverableId } = req.params;
  const deliverable = await Deliverable.findById(deliverableId);
  if (!deliverable) {
    return apiError(res, "Deliverable not found.", 404);
  }
  if (String(deliverable.cohortId) !== String(cohortId)) {
    return apiError(res, "Deliverable does not belong to this cohort.", 403);
  }

  if (!deliverable.archived) {
    deliverable.archived = true;
    await deliverable.save();
  }

  const dto = mapDeliverable(deliverable);
  const orgId = await organizationIdForDeliverable(deliverable);
  if (orgId) {
    emitRealtime(SOCKET_EVENTS.DELIVERABLE_ARCHIVED, dto, [organizationRoom(orgId)]);
  }
  return apiSuccess(res, dto);
};

/** DELETE /cohorts/:cohortId/deliverables/:deliverableId - blocked if submissions exist. */
export const deleteCohortDeliverable = async (req, res) => {
  const { cohortId, deliverableId } = req.params;
  const deliverable = await Deliverable.findById(deliverableId);
  if (!deliverable) {
    return apiError(res, "Deliverable not found.", 404);
  }
  if (String(deliverable.cohortId) !== String(cohortId)) {
    return apiError(res, "Deliverable does not belong to this cohort.", 403);
  }

  const submissionCount = await DeliverableSubmission.countDocuments({
    deliverableId,
  });
  if (submissionCount > 0) {
    return apiError(
      res,
      "Cannot delete a deliverable that has submissions. Archive it instead.",
      409,
      [`Existing submissions: ${submissionCount}`],
    );
  }

  const id = String(deliverable._id);
  const orgId = await organizationIdForDeliverable(deliverable);
  await Deliverable.findByIdAndDelete(deliverableId);

  if (orgId) {
    emitRealtime(
      SOCKET_EVENTS.DELIVERABLE_DELETED,
      { id, cohortId: String(cohortId), organizationId: orgId },
      [organizationRoom(orgId)],
    );
  }
  return apiSuccess(res, { deleted: true, id });
};

export const submitDeliverable = async (req, res) => {
  const actor = await User.findById(req.user.id).select("role founderId startupId").lean();
  let effectiveFounderId = req.user.id;
  if (actor?.role === "team-member" && actor.founderId) {
    effectiveFounderId = String(actor.founderId);
  }

  const startupId = actor?.startupId || null;

  const requested = normalizeSubmissionStatus(req.body?.status);
  const status = DELIVERABLE_SUBMISSION_STATUSES.includes(requested)
    ? requested
    : "submitted";
  const attachments = sanitizeAttachments(req.body?.attachments);

  const submission = await DeliverableSubmission.findOneAndUpdate(
    { deliverableId: req.params.deliverableId, founderId: effectiveFounderId },
    {
      deliverableId: req.params.deliverableId,
      founderId: effectiveFounderId,
      startupId,
      content: req.body?.content || "",
      links: req.body?.links || [],
      attachments,
      status,
    },
    { upsert: true, new: true, runValidators: true },
  );

  // Notify organisation admins so they can review.
  try {
    const deliverable = await Deliverable.findById(req.params.deliverableId).lean();
    await notifyOrgAdminsOfSubmission(submission, deliverable);
  } catch (err) {
    console.error("[submitDeliverable] notify org admins failed:", err.message);
  }

  return apiSuccess(res, submission, 201);
};

export const getSubmissions = async (req, res) => {
  const submissions = await DeliverableSubmission.find({ deliverableId: req.params.deliverableId }).sort({ createdAt: -1 });
  return apiSuccess(res, submissions);
};

export const reviewSubmission = async (req, res) => {
  const requested = normalizeSubmissionStatus(req.body?.status || "reviewed");
  const nextStatus = DELIVERABLE_SUBMISSION_STATUSES.includes(requested)
    ? requested
    : "reviewed";
  const feedbackText = req.body?.feedback != null ? String(req.body.feedback) : "";

  const submission = await DeliverableSubmission.findByIdAndUpdate(
    req.params.submissionId,
    {
      status: nextStatus,
      feedback: feedbackText,
      review: {
        reviewerId: req.user.id,
        feedback: feedbackText,
        score: Number(req.body?.score || 0),
        reviewedAt: new Date().toISOString(),
      },
    },
    { new: true, runValidators: true },
  );

  if (!submission) {
    return apiError(res, "Submission not found.", 404);
  }

  // Notify the founder that their submission was reviewed.
  try {
    const deliverable = await Deliverable.findById(submission.deliverableId).lean();
    if (submission.founderId) {
      await createNotification({
        userId: submission.founderId,
        type: "deliverable-reviewed",
        title: "Deliverable reviewed",
        message: deliverable
          ? `Feedback received on "${deliverable.title}".`
          : "Feedback received on your submission.",
        actionUrl: officeDeepLink({ tab: "deliverables", deliverableId: submission.deliverableId }),
        metadata: {
          deliverableId: String(submission.deliverableId),
          submissionId: String(submission._id),
          status: submission.status,
        },
      });
    }
  } catch (err) {
    console.error("[reviewSubmission] notify founder failed:", err.message);
  }

  return apiSuccess(res, submission);
};
