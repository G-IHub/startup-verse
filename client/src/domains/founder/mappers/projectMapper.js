function toId(value) {
  if (!value || typeof value !== "object") return "";
  return String(value.id || value._id || "");
}

function projectCounts(project) {
  const live = project?.liveCounts;
  const totalTasks = Number(
    live?.totalTasks ?? project?.totalTasks ?? 0,
  );
  const completedTasks = Number(
    live?.completedTasks ?? project?.completedTasks ?? 0,
  );
  const totalMilestones = Number(
    live?.totalMilestones ?? project?.totalMilestones ?? 0,
  );
  const completedMilestones = Number(
    live?.completedMilestones ?? project?.completedMilestones ?? 0,
  );
  const taskProgressPct =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const milestoneProgressPct =
    totalMilestones > 0
      ? Math.round((completedMilestones / totalMilestones) * 100)
      : 0;

  return {
    totalTasks,
    completedTasks,
    totalMilestones,
    completedMilestones,
    taskProgressPct,
    milestoneProgressPct,
  };
}

export function mapProjectRow(project) {
  if (!project || typeof project !== "object") return null;
  const counts = projectCounts(project);
  const members = Array.isArray(project.members) ? project.members : [];

  return {
    id: toId(project),
    slug: String(project.slug || ""),
    name: String(project.name || "Untitled project"),
    description: String(project.description || ""),
    status: String(project.status || "active"),
    priority: String(project.priority || "medium"),
    color: String(project.color || "#1A56DB"),
    visibility: String(project.visibility || "team"),
    dueDate: project.dueDate || null,
    githubRepo: project.githubRepo || {},
    memberCount: members.length,
    ...counts,
    raw: project,
  };
}

export function mapProjectsList(projects = []) {
  const rows = Array.isArray(projects) ? projects : [];
  return {
    projects: rows.map(mapProjectRow).filter(Boolean),
    total: rows.length,
    activeCount: rows.filter((p) => String(p?.status) === "active").length,
    pausedCount: rows.filter((p) => String(p?.status) === "paused").length,
  };
}

export function mapProjectDetail(project) {
  const row = mapProjectRow(project);
  if (!row) return null;
  return {
    ...row,
    members: Array.isArray(project.members) ? project.members : [],
    liveCounts: project.liveCounts || {
      totalMilestones: row.totalMilestones,
      completedMilestones: row.completedMilestones,
      totalTasks: row.totalTasks,
      completedTasks: row.completedTasks,
    },
  };
}
