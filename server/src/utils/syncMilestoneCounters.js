import Task from "../models/Task.js";
import Milestone from "../models/Milestone.js";
import { computeMilestoneCounters } from "../domain/weeklyLoopRules.js";

export async function syncMilestoneCounters(milestoneId) {
  if (!milestoneId) return;
  const milestoneTasks = await Task.find({ milestoneId }, { status: 1 });
  const counters = computeMilestoneCounters(milestoneTasks);
  await Milestone.findByIdAndUpdate(milestoneId, counters, { new: false });
}
