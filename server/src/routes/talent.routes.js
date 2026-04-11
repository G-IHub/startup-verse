import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import requireSelfOrAdmin from "../middleware/requireSelfOrAdmin.js";
import * as talentController from "../controllers/talent.controller.js";

const talentRouter = Router();

talentRouter.post("/talent/profile", requireAuth, asyncHandler(talentController.createOrUpdateProfile));
talentRouter.get("/talent/profile/:userId", requireAuth, requireSelfOrAdmin("userId"), asyncHandler(talentController.getProfile));
talentRouter.get("/talent/profiles", requireAuth, asyncHandler(talentController.getProfiles));
talentRouter.get("/talent/browse", requireAuth, asyncHandler(talentController.browseTalent));
talentRouter.get("/talent/opportunities", requireAuth, asyncHandler(talentController.getOpportunities));

talentRouter.post("/talent/:talentId/applications", requireAuth, requireSelfOrAdmin("talentId"), asyncHandler(talentController.applyForPosition));
talentRouter.get("/talent/:talentId/applications", requireAuth, requireSelfOrAdmin("talentId"), asyncHandler(talentController.getApplications));

talentRouter.post("/talent/:talentId/saved", requireAuth, requireSelfOrAdmin("talentId"), asyncHandler(talentController.saveItem));
talentRouter.get("/talent/:talentId/saved", requireAuth, requireSelfOrAdmin("talentId"), asyncHandler(talentController.getSavedItems));
talentRouter.delete("/talent/:talentId/saved/:itemType/:itemId", requireAuth, requireSelfOrAdmin("talentId"), asyncHandler(talentController.unsaveItem));

talentRouter.get("/talent/:talentId/matches", requireAuth, requireSelfOrAdmin("talentId"), asyncHandler(talentController.getMatches));

export default talentRouter;