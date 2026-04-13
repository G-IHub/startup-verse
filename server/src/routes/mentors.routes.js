import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import requireMentorProfileAccess from "../middleware/requireMentorProfileAccess.js";
import requireMentorProfileOrgAdmin from "../middleware/requireMentorProfileOrgAdmin.js";
import * as mentorsController from "../controllers/mentors.controller.js";

const mentorsRouter = Router();

mentorsRouter.get("/mentors/public/verify/:token", asyncHandler(mentorsController.verifyMentorToken));
mentorsRouter.post("/mentors/public/request-link", asyncHandler(mentorsController.requestMentorLink));

mentorsRouter.get(
  "/mentors/:mentorId/assigned-founders",
  requireAuth,
  requireMentorProfileAccess,
  asyncHandler(mentorsController.getMentorAssignedFounders),
);
mentorsRouter.post(
  "/mentors/:mentorId/assign-founder",
  requireAuth,
  requireMentorProfileAccess,
  asyncHandler(mentorsController.assignFounderToMentor),
);
mentorsRouter.delete(
  "/mentors/:mentorId/unassign-founder/:founderId",
  requireAuth,
  requireMentorProfileAccess,
  asyncHandler(mentorsController.unassignFounderFromMentor),
);
mentorsRouter.get(
  "/mentors/:mentorId",
  requireAuth,
  requireMentorProfileAccess,
  asyncHandler(mentorsController.getMentorById),
);
mentorsRouter.delete(
  "/mentors/:mentorId",
  requireAuth,
  requireMentorProfileOrgAdmin,
  asyncHandler(mentorsController.deleteMentorById),
);

export default mentorsRouter;
