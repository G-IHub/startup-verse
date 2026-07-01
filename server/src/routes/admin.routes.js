import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import { success as apiSuccess } from "../utils/apiResponse.js";
import User from "../models/User.js";
import Startup from "../models/Startup.js";
import Task from "../models/Task.js";
import WeeklyOutcome from "../models/WeeklyOutcome.js";
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
  "/admin/analytics/snapshot",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const users = await User.find()
      .select("name email role createdAt updatedAt profile isAdmin")
      .lean();
    const startups = await Startup.find().select("name founderId stage industry profile").lean();

    const [
      usersTotal,
      foundersCount,
      teamCount,
      talentCount,
      tasksTotal,
      tasksCompleted,
      outcomesTotal,
      outcomesCompleted,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "founder" }),
      User.countDocuments({ role: "team-member" }),
      User.countDocuments({ role: "talent" }),
      Task.countDocuments(),
      Task.countDocuments({ status: "completed" }),
      WeeklyOutcome.countDocuments(),
      WeeklyOutcome.countDocuments({ status: "completed" }),
    ]);

    const byStage = {};
    const byIndustry = {};
    for (const s of startups) {
      const st = s.stage || s.profile?.stage || "Unknown";
      const ind = s.industry || s.profile?.industry || "Unknown";
      byStage[st] = (byStage[st] || 0) + 1;
      byIndustry[ind] = (byIndustry[ind] || 0) + 1;
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const signupsByDayMap = new Map();
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo.getTime() + i * 86400000);
      signupsByDayMap.set(d.toISOString().slice(0, 10), 0);
    }
    for (const u of users) {
      if (!u.createdAt || new Date(u.createdAt) < thirtyDaysAgo) continue;
      const key = new Date(u.createdAt).toISOString().slice(0, 10);
      if (signupsByDayMap.has(key)) {
        signupsByDayMap.set(key, (signupsByDayMap.get(key) || 0) + 1);
      }
    }
    let cumulative = await User.countDocuments({ createdAt: { $lt: thirtyDaysAgo } });
    const growthData = [];
    const sortedDays = [...signupsByDayMap.keys()].sort();
    for (const day of sortedDays) {
      cumulative += signupsByDayMap.get(day) || 0;
      growthData.push({ date: day, users: cumulative });
    }

    const taskLeaderboard = await Task.aggregate([
      { $match: { status: "completed", founderId: { $exists: true, $ne: null } } },
      { $group: { _id: "$founderId", completedTasks: { $sum: 1 } } },
      { $sort: { completedTasks: -1 } },
      { $limit: 10 },
    ]);
    const leaderIds = taskLeaderboard.map((t) => t._id).filter(Boolean);
    const leaderUsers = leaderIds.length
      ? await User.find({ _id: { $in: leaderIds } }).select("name email role").lean()
      : [];
    const byId = new Map(leaderUsers.map((u) => [String(u._id), u]));
    const topPerformers = taskLeaderboard.map((row) => {
      const u = byId.get(String(row._id));
      return {
        id: String(row._id),
        name: u?.name || "User",
        email: u?.email || "",
        role: u?.role || "founder",
        completedOutcomes: 0,
        completedTasks: row.completedTasks,
      };
    });

    const globalOutcomeRate =
      outcomesTotal === 0 ? 0 : Math.round((outcomesCompleted / outcomesTotal) * 100);
    const outcomeTrend = [];
    for (let i = 7; i >= 0; i--) {
      outcomeTrend.push({ week: `Week ${8 - i}`, rate: globalOutcomeRate });
    }

    const userRows = users.map((u) => ({
      id: String(u._id),
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      lastActive: u.updatedAt,
      startupName: u.profile?.startupName || "",
      location: u.profile?.location || "",
      completedOutcomes: 0,
      completedTasks: 0,
      totalOutcomes: 0,
      totalTasks: 0,
    }));

    return apiSuccess(res, {
      stats: {
        usersTotal,
        foundersCount,
        teamCount,
        talentCount,
        startupsTotal: startups.length,
        tasksTotal,
        tasksCompleted,
        outcomesTotal,
        outcomesCompleted,
      },
      startups: { byStage, byIndustry, total: startups.length },
      growthData,
      outcomeTrend,
      topPerformers,
      users: userRows,
    });
  }),
);

export default adminRouter;
