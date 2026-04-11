import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import * as foundersController from "../controllers/founders.controller.js";

const foundersRouter = Router();

foundersRouter.post("/founders/profile", requireAuth, asyncHandler(foundersController.createOrUpdateProfile));
foundersRouter.get("/founders/profile/:userId", requireAuth, asyncHandler(foundersController.getProfileByUserId));

foundersRouter.post("/founders/startup", requireAuth, asyncHandler(foundersController.createOrUpdateStartup));
foundersRouter.get("/founders/:founderId/startup", requireAuth, asyncHandler(foundersController.getStartupByFounderId));
foundersRouter.get("/founders/startup/:startupId", requireAuth, asyncHandler(foundersController.getStartupById));

foundersRouter.get("/founders/:founderId/milestones", requireAuth, asyncHandler(foundersController.getMilestones));
foundersRouter.post("/founders/:founderId/milestones", requireAuth, asyncHandler(foundersController.createMilestone));
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

foundersRouter.get("/founders/:founderId/posts", requireAuth, asyncHandler(foundersController.getPosts));
foundersRouter.post("/founders/:founderId/posts", requireAuth, asyncHandler(foundersController.createPost));
foundersRouter.delete("/founders/:founderId/posts/:postId", requireAuth, asyncHandler(foundersController.deletePost));

foundersRouter.get("/founders/:founderId/invitations", requireAuth, asyncHandler(foundersController.getInvitations));
foundersRouter.post("/founders/invitations", requireAuth, asyncHandler(foundersController.createInvitation));

foundersRouter.get("/founder/:founderId/events", requireAuth, asyncHandler(foundersController.getEvents));
foundersRouter.get("/founder/:founderId/announcements", requireAuth, asyncHandler(foundersController.getAnnouncements));

foundersRouter.get("/founders/:founderId/resources", requireAuth, asyncHandler(foundersController.getFounderResources));
foundersRouter.get("/founders/:founderId/analytics", requireAuth, asyncHandler(foundersController.getFounderAnalyticsDashboard));

export default foundersRouter;