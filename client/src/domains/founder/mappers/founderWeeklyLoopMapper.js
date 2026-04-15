function toId(value) {
  if (!value || typeof value !== "object") return "";
  return String(value.id || value._id || "");
}

function normalizeTaskStatus(status) {
  const raw = String(status || "pending").toLowerCase().replace(/_/g, "-");
  if (raw === "inprogress") return "in-progress";
  if (["pending", "in-progress", "blocked", "completed"].includes(raw)) {
    return raw;
  }
  return "pending";
}

function normalizeOutcomeStatus(status) {
  const raw = String(status || "active").toLowerCase().replace(/_/g, "-");
  if (["active", "completed", "partial", "missed"].includes(raw)) return raw;
  return "active";
}

function sortByDateDesc(items, getDate) {
  return [...items].sort((left, right) => {
    const leftDate = new Date(getDate(left) || 0).getTime();
    const rightDate = new Date(getDate(right) || 0).getTime();
    return rightDate - leftDate;
  });
}

function normalizeOutcomes(outcomes = []) {
  return outcomes.map((item) => ({
    id: toId(item),
    goal: item.goal || item.title || "",
    summary: item.summary || item.notes || "",
    status: normalizeOutcomeStatus(item.status),
    weekOf: item.weekOf || item.weekEnding || item.createdAt || null,
    raw: item,
  }));
}

function normalizeMilestones(milestones = []) {
  return milestones.map((item) => {
    const totalTasks = Number(item.totalTasks || 0);
    const tasksCompleted = Number(item.tasksCompleted || 0);
    const fallbackCompleted =
      Number.isFinite(totalTasks) &&
      totalTasks > 0 &&
      tasksCompleted >= totalTasks;
    const status = String(item.status || "").toLowerCase();

    return {
      id: toId(item),
      title: item.title || "Untitled milestone",
      description: item.description || "",
      dueDate: item.dueDate || null,
      totalTasks,
      tasksCompleted,
      isCompleted: status === "completed" || fallbackCompleted,
      raw: item,
    };
  });
}

function normalizeTasks(tasks = []) {
  return tasks.map((item) => ({
    id: toId(item),
    title: item.title || "Untitled task",
    status: normalizeTaskStatus(item.status),
    milestoneId: String(item.milestoneId || ""),
    assignedTo: item.assignedTo || null,
    blockerReason: item.blockerReason || item.blockedReason || "",
    blockerNote: item.blockerNote || item.blockedNote || "",
    createdAt: item.createdAt || null,
    raw: item,
  }));
}

function computeStreak(outcomes = []) {
  const ordered = sortByDateDesc(outcomes, (row) => row.weekOf);
  let streak = 0;
  for (const outcome of ordered) {
    if (outcome.status === "completed") {
      streak += 1;
      continue;
    }
    break;
  }
  return streak;
}

export function mapFounderWeeklyLoop({
  outcomes = [],
  milestones = [],
  tasks = [],
  executionScore = null,
}) {
  const normalizedOutcomes = normalizeOutcomes(outcomes);
  const normalizedMilestones = normalizeMilestones(milestones);
  const normalizedTasks = normalizeTasks(tasks);

  const orderedOutcomes = sortByDateDesc(normalizedOutcomes, (row) => row.weekOf);
  const activeOutcome =
    orderedOutcomes.find((row) => row.status === "active") || orderedOutcomes[0] || null;

  const taskMix = normalizedTasks.reduce(
    (accumulator, task) => {
      accumulator.total += 1;
      accumulator[task.status] += 1;
      return accumulator;
    },
    {
      total: 0,
      pending: 0,
      "in-progress": 0,
      blocked: 0,
      completed: 0,
    },
  );

  const completedMilestones = normalizedMilestones.filter(
    (milestone) => milestone.isCompleted,
  ).length;

  const totalMilestones = normalizedMilestones.length;
  const milestoneProgress =
    totalMilestones > 0
      ? Math.round((completedMilestones / totalMilestones) * 100)
      : 0;

  const blockers = normalizedTasks.filter((task) => task.status === "blocked");

  return {
    activeOutcome,
    outcomes: orderedOutcomes,
    milestones: normalizedMilestones,
    tasks: normalizedTasks,
    blockers,
    metrics: {
      streak:
        Number(executionScore?.currentStreak) ||
        Number(executionScore?.streak) ||
        computeStreak(orderedOutcomes),
      executionScore: Number(executionScore?.score) || 0,
      executionPercentile: Number(executionScore?.percentile) || 0,
      milestoneProgress,
      completedMilestones,
      totalMilestones,
      taskMix,
    },
  };
}

