import Task from "../models/Task.js";
import Milestone from "../models/Milestone.js";
import { computeMilestoneCounters } from "../domain/weeklyLoopRules.js";
import { syncProjectCounters } from "./syncProjectCounters.js";

export async function syncMilestoneCounters(milestoneId) {
  if (!milestoneId) return;
  const milestoneTasks = await Task.find({ milestoneId }, { status: 1 });
  const { totalTasks, tasksCompleted } = computeMilestoneCounters(milestoneTasks);
  const newStatus =
    totalTasks === 0
      ? "pending"
      : tasksCompleted >= totalTasks
        ? "completed"
        : tasksCompleted > 0
          ? "in-progress"
          : "pending";

  await Milestone.findByIdAndUpdate(milestoneId, {
    totalTasks,
    tasksCompleted,
    status: newStatus,
  });

  const milestone = await Milestone.findById(milestoneId);
  if (milestone?.projectId) {
    await syncProjectCounters(milestone.projectId);
  }
}
