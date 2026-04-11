import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import * as mentorsController from "../controllers/mentors.controller.js";

const mentorsRouter = Router();

mentorsRouter.get("/mentors/public/verify/:token", asyncHandler(mentorsController.verifyMentorToken));
mentorsRouter.post("/mentors/public/request-link", asyncHandler(mentorsController.requestMentorLink));

mentorsRouter.get(
  "/mentors/:mentorId/assigned-founders",
  requireAuth,
  asyncHandler(mentorsController.getMentorAssignedFounders),
);
mentorsRouter.post(
  "/mentors/:mentorId/assign-founder",
  requireAuth,
  asyncHandler(mentorsController.assignFounderToMentor),
);
mentorsRouter.delete(
  "/mentors/:mentorId/unassign-founder/:founderId",
  requireAuth,
  asyncHandler(mentorsController.unassignFounderFromMentor),
);
mentorsRouter.get("/mentors/:mentorId", requireAuth, asyncHandler(mentorsController.getMentorById));
mentorsRouter.delete("/mentors/:mentorId", requireAuth, asyncHandler(mentorsController.deleteMentorById));

export default mentorsRouter;
