import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import * as announcementsController from "../controllers/announcements.controller.js";

const announcementsRouter = Router();

announcementsRouter.post(
  "/announcements/:announcementId/mark-read",
  requireAuth,
  asyncHandler(announcementsController.markAnnouncementRead),
);

export default announcementsRouter;
