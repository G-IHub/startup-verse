import Startup from "../models/Startup.js";
import Task from "../models/Task.js";
import CohortMembership from "../models/CohortMembership.js";
import User from "../models/User.js";
import TeamMemberProfile from "../models/TeamMemberProfile.js";
import Interest from "../models/Interest.js";
import Activity from "../models/Activity.js";
import mongoose from "mongoose";
import { success as apiSuccess, error as apiError } from "../utils/apiResponse.js";

export const leaveStartupDebug = async (req, res) => {
  const { userId } = req.params;
  const session = await mongoose.startSession();
  try {
    let result = null;
    await session.withTransaction(async () => {
      const user = await User.findById(userId).session(session);
      if (!user) { const e = new Error("User not found"); e.statusCode = 404; throw e; }
      if (user.role !== "team-member") { const e = new Error(`User role is '${user.role}', not team-member`); e.statusCode = 422; throw e; }

      const departingStartupId = String(user.startupId || user.founderId || "");
      user.role = "talent";
      user.startupId = null;
      user.founderId = null;
      user.onboardingComplete = false;
      await user.save({ session });

      await TeamMemberProfile.findOneAndUpdate(
        { userId: user._id },
        { $unset: { startupId: "", founderId: "" } },
        { session },
      );

      await Interest.updateMany(
        { talentId: user._id, onboarded: true },
        { $set: { status: "left" } },
        { session },
      );

      if (departingStartupId) {
        await Activity.create(
          [{ startupId: departingStartupId, userId: user._id, type: "leave",
             text: `[DEBUG] ${user.name} has left the startup.`,
             metadata: { userId: String(user._id), userName: user.name, icon: "👋" } }],
          { session },
        );
      }

      result = { left: true, userId: String(user._id), name: user.name,
                  role: "talent", startupId: null, founderId: null };
    });
    return apiSuccess(res, result);
  } catch (error) {
    if (error.statusCode === 404) return apiError(res, error.message, 404);
    if (error.statusCode === 422) return apiError(res, error.message, 422);
    return apiError(res, "Debug leave failed.", 500, [error.message]);
  } finally {
    await session.endSession();
  }
};

export const getStartupDebug = async (req, res) => {
  const startupId = req.params.startupId;
  const [startup, taskCount, membershipCount] = await Promise.all([
    Startup.findById(startupId),
    Task.countDocuments({ startupId }),
    CohortMembership.countDocuments({ startupId }),
  ]);

  return apiSuccess(res, {
    startup,
    taskCount,
    membershipCount,
  });
};
