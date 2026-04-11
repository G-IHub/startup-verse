import Deliverable from "../models/Deliverable.js";
import DeliverableSubmission from "../models/DeliverableSubmission.js";
import CohortMembership from "../models/CohortMembership.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";

export const getFounderDeliverables = async (req, res) => {
  const memberships = await CohortMembership.find({ founderId: req.params.founderId });
  const cohortIds = memberships.map((m) => m.cohortId).filter(Boolean);
  const deliverables = await Deliverable.find({ cohortId: { $in: cohortIds } }).sort({ createdAt: -1 });

  return apiSuccess(res, deliverables);
};

export const getCohortDeliverables = async (req, res) => {
  const deliverables = await Deliverable.find({ cohortId: req.params.cohortId }).sort({ createdAt: -1 });
  return apiSuccess(res, deliverables);
};

export const createDeliverable = async (req, res) => {
  const deliverable = await Deliverable.create({
    cohortId: req.body?.cohortId,
    organizationId: req.body?.organizationId || null,
    title: req.body?.title || "Deliverable",
    description: req.body?.description || "",
    dueDate: req.body?.dueDate || null,
    createdBy: req.user.id,
  });

  return apiSuccess(res, deliverable, 201);
};

export const submitDeliverable = async (req, res) => {
  const submission = await DeliverableSubmission.findOneAndUpdate(
    { deliverableId: req.params.deliverableId, founderId: req.body?.founderId || req.user.id },
    {
      deliverableId: req.params.deliverableId,
      founderId: req.body?.founderId || req.user.id,
      startupId: req.body?.startupId || null,
      content: req.body?.content || "",
      links: req.body?.links || [],
      status: req.body?.status || "submitted",
    },
    { upsert: true, new: true, runValidators: true },
  );

  return apiSuccess(res, submission, 201);
};

export const getSubmissions = async (req, res) => {
  const submissions = await DeliverableSubmission.find({ deliverableId: req.params.deliverableId }).sort({ createdAt: -1 });
  return apiSuccess(res, submissions);
};

export const reviewSubmission = async (req, res) => {
  const submission = await DeliverableSubmission.findByIdAndUpdate(
    req.params.submissionId,
    {
      status: req.body?.status || "reviewed",
      review: {
        reviewerId: req.user.id,
        feedback: req.body?.feedback || "",
        score: Number(req.body?.score || 0),
        reviewedAt: new Date().toISOString(),
      },
    },
    { new: true, runValidators: true },
  );

  if (!submission) {
    return apiError(res, "Submission not found.", 404);
  }

  return apiSuccess(res, submission);
};
