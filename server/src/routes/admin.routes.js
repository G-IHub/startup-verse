import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import { success as apiSuccess } from "../utils/apiResponse.js";
import { notImplemented } from "../utils/compat.js";
import User from "../models/User.js";
import Startup from "../models/Startup.js";
import Organization from "../models/Organization.js";
import Task from "../models/Task.js";
import Message from "../models/Message.js";
import Activity from "../models/Activity.js";
import Notification from "../models/Notification.js";
import FounderTalentInvitation from "../models/FounderTalentInvitation.js";
import { getReminderDeliveryMetrics } from "../services/reminderDeliveryQueue.js";

const adminRouter = Router();

adminRouter.get(
  "/admin/reminder-delivery-metrics",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const metrics = await getReminderDeliveryMetrics();
    return apiSuccess(res, metrics);
  }),
);

adminRouter.get(
  "/admin/stats",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const [
      users,
      startups,
      organizations,
      talents,
      invites,
      tasks,
      messages,
      activities,
      notifications,
    ] = await Promise.all([
      User.countDocuments(),
      Startup.countDocuments(),
      Organization.countDocuments(),
      User.countDocuments({ role: "talent" }),
      FounderTalentInvitation.countDocuments(),
      Task.countDocuments(),
      Message.countDocuments(),
      Activity.countDocuments(),
      Notification.countDocuments(),
    ]);

    return apiSuccess(res, {
      stats: {
        users,
        startups,
        organizations,
        talents,
        invites,
        tasks,
        messages,
        activities,
        notifications,
      },
    });
  }),
);

adminRouter.post(
  "/admin/clear-all-data",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    return notImplemented(res, "admin.clear-all-data", ["Destructive endpoint intentionally disabled."]);
  }),
);

adminRouter.post(
  "/admin/nuclear-reset",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    return notImplemented(res, "admin.nuclear-reset", ["Destructive endpoint intentionally disabled."]);
  }),
);

adminRouter.post(
  "/admin/mega-nuclear-reset",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    return notImplemented(res, "admin.mega-nuclear-reset", ["Destructive endpoint intentionally disabled."]);
  }),
);

export default adminRouter;
