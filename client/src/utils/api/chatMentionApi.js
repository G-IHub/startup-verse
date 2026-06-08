import { request } from "../backendClient";

function normalizeMilestone(row) {
  if (!row) return null;
  return {
    id: String(row.id || row._id || ""),
    title: String(row.title || "Milestone"),
    status: String(row.status || "pending"),
    totalTasks: Number(row.totalTasks || 0),
    tasksCompleted: Number(row.tasksCompleted || 0),
  };
}

function normalizeTask(row) {
  if (!row) return null;
  return {
    id: String(row.id || row._id || ""),
    title: String(row.title || "Untitled task"),
    status: String(row.status || "pending"),
    priority: String(row.priority || "medium"),
    assignedTo: String(row.assignedTo || ""),
    assignedToName: String(row.assignedToName || ""),
    milestoneId: String(row.milestoneId || ""),
    milestoneName: String(row.milestoneName || ""),
  };
}

export async function getChatMentionables(startupId) {
  if (!startupId) {
    return { milestones: [], tasks: [] };
  }
  const payload = await request(`/startups/${startupId}/chat-mentionables`, {
    method: "GET",
  });
  const data = payload?.data || payload || {};
  const milestones = Array.isArray(data.milestones) ? data.milestones : [];
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  return {
    milestones: milestones.map(normalizeMilestone).filter(Boolean),
    tasks: tasks.map(normalizeTask).filter(Boolean),
  };
}
