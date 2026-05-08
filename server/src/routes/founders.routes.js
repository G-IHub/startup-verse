import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import * as foundersController from "../controllers/founders.controller.js";
import * as teamMembersController from "../controllers/teamMembers.controller.js";

const foundersRouter = Router();

// Blueprint §14: GET /api/v1/founders/ — list founders
foundersRouter.get("/founders", requireAuth, asyncHandler(foundersController.listFounders));

foundersRouter.post("/founders/profile", requireAuth, asyncHandler(foundersController.createOrUpdateProfile));
foundersRouter.get("/founders/profile/:userId", requireAuth, asyncHandler(foundersController.getProfileByUserId));

foundersRouter.post("/founders/startup", requireAuth, asyncHandler(foundersController.createOrUpdateStartup));
foundersRouter.get("/founders/:founderId/startup", requireAuth, asyncHandler(foundersController.getStartupByFounderId));
foundersRouter.get("/founders/startup/:startupId", requireAuth, asyncHandler(foundersController.getStartupById));

foundersRouter.get("/founders/:founderId/milestones", requireAuth, asyncHandler(foundersController.getMilestones));
foundersRouter.post("/founders/:founderId/milestones", requireAuth, asyncHandler(foundersController.createMilestone));
foundersRouter.put("/founders/:founderId/milestones/:milestoneId", requireAuth, asyncHandler(foundersController.updateMilestone));
foundersRouter.delete("/founders/:founderId/milestones/:milestoneId", requireAuth, asyncHandler(foundersController.deleteMilestone));

foundersRouter.get("/founders/:founderId/tasks", requireAuth, asyncHandler(foundersController.getTasks));
foundersRouter.post("/founders/:founderId/tasks", requireAuth, asyncHandler(foundersController.createTask));
foundersRouter.put("/founders/:founderId/tasks/:taskId", requireAuth, asyncHandler(foundersController.updateTask));
foundersRouter.put("/founders/:founderId/tasks/:taskId/status", requireAuth, asyncHandler(foundersController.updateTaskStatus));
foundersRouter.patch("/founders/:founderId/tasks/:taskId/status", requireAuth, asyncHandler(foundersController.updateTaskStatus));
foundersRouter.put("/founders/:founderId/tasks/:taskId/assign", requireAuth, asyncHandler(foundersController.assignTask));
foundersRouter.patch("/founders/:founderId/tasks/:taskId/assign", requireAuth, asyncHandler(foundersController.assignTask));
foundersRouter.delete("/founders/:founderId/tasks/:taskId", requireAuth, asyncHandler(foundersController.deleteTask));

foundersRouter.get("/founders/:founderId/weekly-outcomes", requireAuth, asyncHandler(foundersController.getWeeklyOutcomes));
foundersRouter.post("/founders/:founderId/weekly-outcomes", requireAuth, asyncHandler(foundersController.createWeeklyOutcome));

// Blueprint §14: GET /api/v1/founders/:founderId/execution-data
foundersRouter.get("/founders/:founderId/execution-data", requireAuth, asyncHandler(foundersController.getExecutionData));

// Blueprint §14: GET /api/v1/startups/:founderId/snapshot
foundersRouter.get("/startups/:founderId/snapshot", requireAuth, asyncHandler(foundersController.getStartupSnapshot));
foundersRouter.post("/founders/:founderId/weekly-plan", requireAuth, asyncHandler(foundersController.createWeeklyPlan));
foundersRouter.post("/founders/:founderId/intent-parse", requireAuth, asyncHandler(foundersController.parseFounderIntent));

foundersRouter.get("/founders/:founderId/journey", requireAuth, asyncHandler(foundersController.getFounderJourney));
foundersRouter.put("/founders/:founderId/journey", requireAuth, asyncHandler(foundersController.putFounderJourney));
foundersRouter.get(
  "/founders/:founderId/execution-state",
  requireAuth,
  asyncHandler(foundersController.getFounderExecutionState),
);

foundersRouter.get("/founders/:founderId/posts", requireAuth, asyncHandler(foundersController.getPosts));
foundersRouter.post("/founders/:founderId/posts", requireAuth, asyncHandler(foundersController.createPost));
foundersRouter.delete("/founders/:founderId/posts/:postId", requireAuth, asyncHandler(foundersController.deletePost));

foundersRouter.get("/founders/:founderId/invitations", requireAuth, asyncHandler(foundersController.getInvitations));
foundersRouter.post("/founders/invitations", requireAuth, asyncHandler(foundersController.createInvitation));

foundersRouter.get("/founder/:founderId/events", requireAuth, asyncHandler(foundersController.getEvents));
foundersRouter.get("/founder/:founderId/announcements", requireAuth, asyncHandler(foundersController.getAnnouncements));

foundersRouter.get("/founders/:founderId/resources", requireAuth, asyncHandler(foundersController.getFounderResources));
foundersRouter.get("/founders/:founderId/analytics", requireAuth, asyncHandler(foundersController.getFounderAnalyticsDashboard));

foundersRouter.get("/founders/:founderId/stage-tasks", requireAuth, asyncHandler(foundersController.getStageTaskResponses));
foundersRouter.put("/founders/:founderId/stage-tasks", requireAuth, asyncHandler(foundersController.putStageTaskResponses));

foundersRouter.get("/founders/:founderId/stage-completions", requireAuth, asyncHandler(foundersController.getStageCompletions));
foundersRouter.post("/founders/:founderId/stage-completions", requireAuth, asyncHandler(foundersController.createStageCompletion));

foundersRouter.get("/founders/:founderId/learning-resources", requireAuth, asyncHandler(foundersController.getLearningResources));
foundersRouter.get("/founders/:founderId/learning-progress", requireAuth, asyncHandler(foundersController.getLearningProgress));
foundersRouter.post("/founders/:founderId/learning-progress", requireAuth, asyncHandler(foundersController.trackLearningWatch));

foundersRouter.get("/founders/:founderId/team-members", requireAuth, asyncHandler(teamMembersController.getFounderTeamMembers));

export default foundersRouter;