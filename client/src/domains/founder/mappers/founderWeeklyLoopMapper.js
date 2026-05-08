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

function normalizeTaskPriority(priority) {
  const raw = String(priority || "medium").toLowerCase();
  if (raw === "low" || raw === "high" || raw === "medium") return raw;
  return "medium";
}

function normalizeAssignedTo(value) {
  if (value == null || value === "") return null;
  if (typeof value === "object") {
    const s = String(value._id || value.id || "").trim();
    return s || null;
  }
  return String(value).trim() || null;
}

function normalizeTasks(tasks = []) {
  return tasks.map((item) => {
    const assignedToRaw = item.assignedTo;
    const assignedTo = normalizeAssignedTo(assignedToRaw);
    const fromPopulate =
      typeof assignedToRaw === "object" && assignedToRaw
        ? String(
            assignedToRaw.name ||
              assignedToRaw.displayName ||
              assignedToRaw.fullName ||
              "",
          ).trim()
        : "";
    return {
    id: toId(item),
    title: item.title || "Untitled task",
    status: normalizeTaskStatus(item.status),
    milestoneId: String(item.milestoneId || ""),
    assignedTo,
    assignedToName:
      String(item.assignedToName || "").trim() || fromPopulate || "",
    assignedToAvatar: String(item.assignedToAvatar || "").trim() || "",
    priority: normalizeTaskPriority(item.priority),
    blockerReason: item.blockerReason || item.blockedReason || "",
    blockerNote: item.blockerNote || item.blockedNote || "",
    createdAt: item.createdAt || null,
    raw: item,
  };
  });
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
  const activeOutcome = orderedOutcomes.find((row) => row.status === "active") || null;

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
        Number(executionScore?.streakCount) ||
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

