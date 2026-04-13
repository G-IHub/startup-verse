import Startup from "../models/Startup.js";
import Task from "../models/Task.js";
import CohortMembership from "../models/CohortMembership.js";
import { success as apiSuccess } from "../utils/apiResponse.js";

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
