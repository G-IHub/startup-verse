import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import requireCohortReadAccess from "../middleware/requireCohortReadAccess.js";
import requireDeliverableReviewAccess from "../middleware/requireDeliverableReviewAccess.js";
import requireDeliverableSubmitAccess from "../middleware/requireDeliverableSubmitAccess.js";
import requireOrgAdmin from "../middleware/requireOrgAdmin.js";
import * as deliverablesController from "../controllers/deliverables.controller.js";

const deliverablesRouter = Router();

deliverablesRouter.get(
  "/cohorts/:cohortId/deliverables",
  requireAuth,
  requireCohortReadAccess,
  asyncHandler(deliverablesController.getCohortDeliverables),
);
deliverablesRouter.post(
  "/cohorts/:cohortId/deliverables",
  requireAuth,
  requireOrgAdmin,
  asyncHandler(deliverablesController.createCohortDeliverable),
);
deliverablesRouter.put(
  "/cohorts/:cohortId/deliverables/:deliverableId",
  requireAuth,
  requireOrgAdmin,
  asyncHandler(deliverablesController.updateCohortDeliverable),
);
deliverablesRouter.patch(
  "/cohorts/:cohortId/deliverables/:deliverableId/archive",
  requireAuth,
  requireOrgAdmin,
  asyncHandler(deliverablesController.archiveCohortDeliverable),
);
deliverablesRouter.delete(
  "/cohorts/:cohortId/deliverables/:deliverableId",
  requireAuth,
  requireOrgAdmin,
  asyncHandler(deliverablesController.deleteCohortDeliverable),
);

deliverablesRouter.get("/deliverables/founder/:founderId", requireAuth, asyncHandler(deliverablesController.getFounderDeliverables));
deliverablesRouter.get(
  "/deliverables/:deliverableId/submissions",
  requireAuth,
  requireCohortReadAccess,
  asyncHandler(deliverablesController.getSubmissions),
);
deliverablesRouter.get(
  "/deliverables/:cohortId",
  requireAuth,
  requireCohortReadAccess,
  asyncHandler(deliverablesController.getCohortDeliverables),
);
deliverablesRouter.post(
  "/deliverables/create",
  requireAuth,
  requireOrgAdmin,
  asyncHandler(deliverablesController.createDeliverable),
);
deliverablesRouter.post(
  "/deliverables/:deliverableId/submit",
  requireAuth,
  requireDeliverableSubmitAccess,
  asyncHandler(deliverablesController.submitDeliverable),
);
deliverablesRouter.post(
  "/deliverables/submissions/:submissionId/review",
  requireAuth,
  requireDeliverableReviewAccess,
  asyncHandler(deliverablesController.reviewSubmission),
);

export default deliverablesRouter;