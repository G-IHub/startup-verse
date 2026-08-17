import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import requireSelfOrAdmin from "../middleware/requireSelfOrAdmin.js";
import * as teamMembersController from "../controllers/teamMembers.controller.js";
import * as workLogsController from "../controllers/workLogs.controller.js";

const teamMembersRouter = Router();

teamMembersRouter.post("/team-members/profile", requireAuth, asyncHandler(teamMembersController.createOrUpdateProfile));
teamMembersRouter.get("/team-members/profile/:userId", requireAuth, requireSelfOrAdmin("userId"), asyncHandler(teamMembersController.getProfile));
teamMembersRouter.get("/team-members/:teamMemberId/tasks", requireAuth, requireSelfOrAdmin("teamMemberId"), asyncHandler(teamMembersController.getTasks));
teamMembersRouter.put("/team-members/:teamMemberId/tasks/:taskId", requireAuth, requireSelfOrAdmin("teamMemberId"), asyncHandler(teamMembersController.updateTask));
teamMembersRouter.post("/team-members/:teamMemberId/tasks/:taskId/comments", requireAuth, requireSelfOrAdmin("teamMemberId"), asyncHandler(teamMembersController.commentOnTask));
teamMembersRouter.post("/team-members/:teamMemberId/work-logs", requireAuth, requireSelfOrAdmin("teamMemberId"), asyncHandler(workLogsController.createWorkLog));
teamMembersRouter.get("/team-members/:teamMemberId/work-logs", requireAuth, requireSelfOrAdmin("teamMemberId"), asyncHandler(workLogsController.listMemberWorkLogs));
teamMembersRouter.patch("/team-members/:teamMemberId/work-logs/:workLogId", requireAuth, requireSelfOrAdmin("teamMemberId"), asyncHandler(workLogsController.updateWorkLog));
teamMembersRouter.delete("/team-members/:teamMemberId/work-logs/:workLogId", requireAuth, requireSelfOrAdmin("teamMemberId"), asyncHandler(workLogsController.deleteWorkLog));
teamMembersRouter.get("/team-members/:teamMemberId/activity", requireAuth, requireSelfOrAdmin("teamMemberId"), asyncHandler(teamMembersController.getActivity));
teamMembersRouter.get("/team-members/:teamMemberId/status", requireAuth, requireSelfOrAdmin("teamMemberId"), asyncHandler(teamMembersController.getStatus));
teamMembersRouter.post("/team-members/:teamMemberId/status", requireAuth, requireSelfOrAdmin("teamMemberId"), asyncHandler(teamMembersController.updateStatus));
teamMembersRouter.get("/team-members/:teamMemberId/performance", requireAuth, requireSelfOrAdmin("teamMemberId"), asyncHandler(teamMembersController.getPerformance));
teamMembersRouter.post("/team-members/:userId/leave", requireAuth, asyncHandler(teamMembersController.leaveStartup));

export default teamMembersRouter;