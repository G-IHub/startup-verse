import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import { success as apiSuccess } from "../utils/apiResponse.js";
import {
  runDeliverableDueSoonJob,
  runEventReminderJob,
  runCohortInvitationExpiryJob,
  runWeeklyReviewReminderJob,
  runWeeklyOutcomeReminderJob,
} from "../services/schedulerJobs.js";

const cronRouter = Router();

cronRouter.post(
  "/cron/check-deadlines",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const [deliverables, events, invites] = await Promise.all([
      runDeliverableDueSoonJob(),
      runEventReminderJob(),
      runCohortInvitationExpiryJob(),
    ]);
    return apiSuccess(res, {
      type: "check-deadlines",
      at: new Date().toISOString(),
      deliverableDueSoon: deliverables.notified,
      eventReminders: events.reminded,
      invitationExpiry: invites.reminded,
      payload: req.body || {},
    });
  }),
);

cronRouter.post(
  "/cron/check-weekly-reviews",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const [reviews, outcomes] = await Promise.all([
      runWeeklyReviewReminderJob(),
      runWeeklyOutcomeReminderJob(),
    ]);
    return apiSuccess(res, {
      type: "check-weekly-reviews",
      at: new Date().toISOString(),
      weeklyReviewReminders: reviews.reminded,
      weeklyOutcomeReminders: outcomes.reminded,
      payload: req.body || {},
    });
  }),
);

export default cronRouter;