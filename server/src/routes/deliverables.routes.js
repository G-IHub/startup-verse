import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import * as deliverablesController from "../controllers/deliverables.controller.js";

const deliverablesRouter = Router();

deliverablesRouter.get("/deliverables/founder/:founderId", requireAuth, asyncHandler(deliverablesController.getFounderDeliverables));
deliverablesRouter.get("/deliverables/:cohortId", requireAuth, asyncHandler(deliverablesController.getCohortDeliverables));
deliverablesRouter.post("/deliverables/create", requireAuth, asyncHandler(deliverablesController.createDeliverable));
deliverablesRouter.post("/deliverables/:deliverableId/submit", requireAuth, asyncHandler(deliverablesController.submitDeliverable));
deliverablesRouter.get("/deliverables/:deliverableId/submissions", requireAuth, asyncHandler(deliverablesController.getSubmissions));
deliverablesRouter.post("/deliverables/submissions/:submissionId/review", requireAuth, asyncHandler(deliverablesController.reviewSubmission));

export default deliverablesRouter;