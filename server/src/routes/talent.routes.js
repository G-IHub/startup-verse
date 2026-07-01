import { Router } from "express";
import multer from "multer";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import requireSelfOrAdmin from "../middleware/requireSelfOrAdmin.js";
import * as talentController from "../controllers/talent.controller.js";
import { getResumeMaxBytes } from "../utils/resumeAttachments.js";

const talentRouter = Router();

const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: getResumeMaxBytes() },
});

function handleResumeMulter(req, res, next) {
  resumeUpload.single("file")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          success: false,
          message: "Resume must be 5MB or smaller.",
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || "Upload failed.",
      });
    }
    return next();
  });
}

talentRouter.post("/talent/profile", requireAuth, asyncHandler(talentController.createOrUpdateProfile));
talentRouter.get("/talent/profile/:userId", requireAuth, requireSelfOrAdmin("userId"), asyncHandler(talentController.getProfile));
talentRouter.get("/talent/resume/status", requireAuth, asyncHandler(talentController.getResumeParseStatus));
talentRouter.post(
  "/talent/resume/parse",
  requireAuth,
  handleResumeMulter,
  asyncHandler(talentController.parseResume),
);
talentRouter.get("/talent/profiles", requireAuth, asyncHandler(talentController.getProfiles));
talentRouter.get("/talent/browse", requireAuth, asyncHandler(talentController.browseTalent));
talentRouter.get("/talent/opportunities", requireAuth, asyncHandler(talentController.getOpportunities));
talentRouter.get("/talent/startup-posts", requireAuth, asyncHandler(talentController.getStartupPostsFeed));

talentRouter.post("/talent/:talentId/applications", requireAuth, requireSelfOrAdmin("talentId"), asyncHandler(talentController.applyForPosition));
talentRouter.get("/talent/:talentId/applications", requireAuth, requireSelfOrAdmin("talentId"), asyncHandler(talentController.getApplications));

talentRouter.post("/talent/:talentId/saved", requireAuth, requireSelfOrAdmin("talentId"), asyncHandler(talentController.saveItem));
talentRouter.get("/talent/:talentId/saved", requireAuth, requireSelfOrAdmin("talentId"), asyncHandler(talentController.getSavedItems));
talentRouter.delete("/talent/:talentId/saved/:itemType/:itemId", requireAuth, requireSelfOrAdmin("talentId"), asyncHandler(talentController.unsaveItem));

talentRouter.get("/talent/:talentId/matches", requireAuth, requireSelfOrAdmin("talentId"), asyncHandler(talentController.getMatches));

export default talentRouter;
