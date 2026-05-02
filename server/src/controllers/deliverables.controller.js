import Deliverable from "../models/Deliverable.js";
import DeliverableSubmission from "../models/DeliverableSubmission.js";
import CohortMembership from "../models/CohortMembership.js";
import Cohort from "../models/Cohort.js";
import OrganizationAdmin from "../models/OrganizationAdmin.js";
import User from "../models/User.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import { createNotification, broadcastNotification } from "../services/notificationService.js";
import {
  DELIVERABLE_TYPES,
  DELIVERABLE_SUBMISSION_STATUSES,
} from "../utils/enums.js";

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
      ? (await Cohort.findById(deliverable.cohortId).select("organizationId").lean())?.organizationId
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
  const deliverables = await Deliverable.find({ cohortId: { $in: cohortIds } })
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
  const deliverables = await Deliverable.find({ cohortId: req.params.cohortId }).sort({ createdAt: -1 });
  return apiSuccess(res, deliverables);
};

export const createDeliverable = async (req, res) => {
  const type =
    req.body?.type && DELIVERABLE_TYPES.includes(req.body.type)
      ? req.body.type
      : "general";
  const requirements = Array.isArray(req.body?.requirements)
    ? req.body.requirements.map((r) => String(r).trim()).filter(Boolean)
    : [];

  const deliverable = await Deliverable.create({
    cohortId: req.body?.cohortId,
    organizationId: req.body?.organizationId || null,
    title: req.body?.title || "Deliverable",
    description: req.body?.description || "",
    type,
    requirements,
    dueDate: req.body?.dueDate || null,
    createdBy: req.user.id,
  });

  return apiSuccess(res, deliverable, 201);
};

/** POST /cohorts/:cohortId/deliverables — cohortId from URL */
export const createCohortDeliverable = async (req, res) => {
  const type =
    req.body?.type && DELIVERABLE_TYPES.includes(req.body.type)
      ? req.body.type
      : "general";
  const requirements = Array.isArray(req.body?.requirements)
    ? req.body.requirements.map((r) => String(r).trim()).filter(Boolean)
    : [];

  const deliverable = await Deliverable.create({
    cohortId: req.params.cohortId,
    organizationId: req.body?.organizationId || null,
    title: req.body?.title || "Deliverable",
    description: req.body?.description || "",
    type,
    requirements,
    dueDate: req.body?.dueDate || null,
    createdBy: req.user.id,
  });

  return apiSuccess(res, deliverable, 201);
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
        actionUrl: `/?view=virtual-office&tab=deliverables&deliverableId=${submission.deliverableId}`,
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
