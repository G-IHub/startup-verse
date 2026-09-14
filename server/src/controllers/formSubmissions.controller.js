/**
 * formSubmissions.controller.js — real, founder-scoped read access to the
 * data captured by hostedSitePublic.js's public submit endpoint. Unlike
 * that endpoint, this one is fully authenticated — a founder's real form
 * submissions (subscriber emails, names, etc.) are private to them.
 */
import FormSubmission from "../models/FormSubmission.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";

const LIST_LIMIT = 200;

function founderGuard(req, founderId) {
  return req.user.isAdmin === true || req.user.id === String(founderId);
}

export const listFormSubmissions = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) return apiError(res, "Forbidden.", 403);

  const submissions = await FormSubmission.find({ founderId })
    .sort({ createdAt: -1 })
    .limit(LIST_LIMIT)
    .lean();

  return apiSuccess(res, { submissions, total: submissions.length });
};
