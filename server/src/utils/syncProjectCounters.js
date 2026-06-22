import Milestone from "../models/Milestone.js";
import Task from "../models/Task.js";
import Project from "../models/Project.js";

export async function syncProjectCounters(projectId) {
  if (!projectId) return;
  const [milestones, tasks] = await Promise.all([
    Milestone.find({ projectId }),
    Task.find({ projectId }),
  ]);
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter(
    (m) => m.status === "completed",
  ).length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  await Project.findByIdAndUpdate(projectId, {
    totalMilestones,
    completedMilestones,
    totalTasks,
    completedTasks,
  });
}
