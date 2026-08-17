import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import requireOrgAdmin from "../middleware/requireOrgAdmin.js";
import * as programsController from "../controllers/programs.controller.js";

const programsRouter = Router();

programsRouter.get("/programs", requireAuth, asyncHandler(programsController.listListedPrograms));
programsRouter.post(
  "/programs/:cohortId/join-requests",
  requireAuth,
  asyncHandler(programsController.createJoinRequest),
);
programsRouter.get(
  "/organizations/:orgId/cohorts/:cohortId/join-requests",
  requireAuth,
  requireOrgAdmin,
  asyncHandler(programsController.listJoinRequests),
);
programsRouter.patch(
  "/organizations/:orgId/cohorts/:cohortId/join-requests/:id",
  requireAuth,
  requireOrgAdmin,
  asyncHandler(programsController.reviewJoinRequest),
);
programsRouter.get(
  "/programs/:cohortId/notes",
  requireAuth,
  asyncHandler(programsController.listNotes),
);
programsRouter.post(
  "/programs/:cohortId/notes",
  requireAuth,
  asyncHandler(programsController.createNote),
);

export default programsRouter;
