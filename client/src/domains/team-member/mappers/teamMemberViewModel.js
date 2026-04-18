const STATUS_OPTIONS = ["available", "focus-mode", "in-meeting", "on-break"];
const TASK_STATUS_OPTIONS = ["pending", "in-progress", "blocked", "completed"];

function toId(value, fallback = "") {
  return String(value || fallback || "").trim();
}

function toDate(value) {
  const parsed = new Date(value || Date.now());
  if (Number.isNaN(parsed.getTime())) return new Date();
  return parsed;
}

function normalizeTaskStatus(status) {
  const raw = String(status || "pending").trim().toLowerCase().replace(/_/g, "-");
  if (raw === "inprogress") return "in-progress";
  return TASK_STATUS_OPTIONS.includes(raw) ? raw : "pending";
}

function normalizeTask(row) {
  if (!row || typeof row !== "object") return null;
  const id = toId(row.id || row._id);
  if (!id) return null;

  return {
    id,
    title: String(row.title || "Untitled task"),
    description: String(row.description || ""),
    status: normalizeTaskStatus(row.status),
    dueDate: row.dueDate ? toDate(row.dueDate) : null,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt || row.createdAt),
    priority: String(row.priority || "medium"),
    founderId: toId(row.founderId || row.ownerId),
    assignedTo: toId(row.assignedTo || row.userId),
    blockerReason: String(row.blockerReason || row.blockedReason || ""),
    blockerNote: String(row.blockerNote || row.blockedNote || ""),
    raw: row,
  };
}

function normalizePresence(row) {
  if (!row || typeof row !== "object") return null;
  const id = toId(row.userId || row.id);
  if (!id) return null;

  const status = String(row.status || (row.isOnline ? "available" : "away"));
  return {
    id,
    name: String(row.name || row.userName || "Team member"),
    role: String(row.role || "team-member"),
    isOnline: Boolean(row.isOnline),
    status,
    statusText: String(row.statusText || ""),
    mood: String(row.mood || ""),
    lastSeenAt: toDate(row.lastSeenAt || row.updatedAt),
  };
}

function normalizeAgendaRow(row) {
  if (!row || typeof row !== "object") return null;
  const id = toId(row.id || row._id, `agenda-${Math.random().toString(36).slice(2, 8)}`);
  const atValue = row.at || row.date || row.dueDate || row.start || row.startsAt;

  return {
    id,
    title: String(row.title || "Untitled"),
    at: atValue ? toDate(atValue) : null,
    type: String(row.kind || row.agendaType || row.type || "event"),
    description: String(row.description || row.metadata?.description || ""),
    isOverdue: Boolean(row.isOverdue),
  };
}

function dedupeById(rows) {
  const byId = new Map();
  for (const row of rows || []) {
    if (!row?.id) continue;
    byId.set(String(row.id), { ...(byId.get(String(row.id)) || {}), ...row });
  }
  return Array.from(byId.values());
}

function computeStreak(tasks) {
  const completedDates = dedupeById(
    tasks
      .filter((task) => task.status === "completed")
      .map((task) => {
        const date = task.updatedAt || task.createdAt;
        const key = date.toISOString().slice(0, 10);
        return { id: key, date };
      }),
  )
    .map((row) => row.date)
    .sort((a, b) => b.getTime() - a.getTime());

  if (completedDates.length === 0) return 0;

  let streak = 1;
  for (let index = 1; index < completedDates.length; index += 1) {
    const prev = new Date(completedDates[index - 1]);
    const next = new Date(completedDates[index]);
    prev.setHours(0, 0, 0, 0);
    next.setHours(0, 0, 0, 0);

    const diffDays = Math.round((prev.getTime() - next.getTime()) / 86400000);
    if (diffDays === 1) {
      streak += 1;
      continue;
    }
    break;
  }

  return streak;
}

function deriveMomentum(completionRate, blockerRate) {
  if (completionRate >= 80 && blockerRate <= 10) {
    return { tone: "strong", label: "Strong momentum" };
  }
  if (completionRate >= 60 && blockerRate <= 20) {
    return { tone: "steady", label: "Steady pace" };
  }
  return { tone: "attention", label: "Needs focus" };
}

function pickFounderName(user, fallbackUsers) {
  const startupId = toId(user?.startupId || user?.founderId);
  const allUsers = Array.isArray(fallbackUsers) ? fallbackUsers : [];

  const directFounder = allUsers.find(
    (member) => toId(member.id) === startupId && String(member.role) === "founder",
  );
  if (directFounder) return String(directFounder.name || "");

  const byStartup = allUsers.find(
    (member) =>
      String(member.role) === "founder" &&
      (toId(member.startupId) === startupId || toId(member.founderId) === startupId),
  );
  return String(byStartup?.name || "");
}

export function mapTeamMemberHomeViewModel({
  user,
  taskRows = [],
  statusRow = null,
  presenceRows = [],
  agendaRows = [],
  fallbackUsers = [],
  fallbackTaskRows = [],
}) {
  const backendTasks = (Array.isArray(taskRows) ? taskRows : []).map(normalizeTask).filter(Boolean);
  const fallbackTasks = (Array.isArray(fallbackTaskRows) ? fallbackTaskRows : [])
    .map(normalizeTask)
    .filter(Boolean)
    .filter((task) => toId(task.assignedTo) === toId(user?.id));

  const tasks = backendTasks.length > 0 ? backendTasks : fallbackTasks;
  const sortedTasks = [...tasks].sort((a, b) => {
    const order = {
      blocked: 0,
      "in-progress": 1,
      pending: 2,
      completed: 3,
    };
    const statusDelta = (order[a.status] ?? 99) - (order[b.status] ?? 99);
    if (statusDelta !== 0) return statusDelta;

    const dueA = a.dueDate ? a.dueDate.getTime() : Number.MAX_SAFE_INTEGER;
    const dueB = b.dueDate ? b.dueDate.getTime() : Number.MAX_SAFE_INTEGER;
    return dueA - dueB;
  });

  const blockedTasks = sortedTasks.filter((task) => task.status === "blocked");
  const activeTasks = sortedTasks.filter((task) => task.status !== "completed");
  const completedTasks = sortedTasks.filter((task) => task.status === "completed");

  const completionRate = sortedTasks.length
    ? Math.round((completedTasks.length / sortedTasks.length) * 100)
    : 0;

  const presence = dedupeById(
    (Array.isArray(presenceRows) ? presenceRows : []).map(normalizePresence).filter(Boolean),
  );

  const fallbackTeam = dedupeById(
    (Array.isArray(fallbackUsers) ? fallbackUsers : [])
      .filter((member) => {
        if (!member || typeof member !== "object") return false;
        const founderIdToMatch = toId(user?.startupId || user?.founderId);
        const memberId = toId(member.id || member.userId);
        return (
          memberId &&
          memberId !== toId(user?.id) &&
          (memberId === founderIdToMatch ||
            toId(member.startupId) === founderIdToMatch ||
            toId(member.founderId) === founderIdToMatch)
        );
      })
      .map((member) => ({
        id: toId(member.id || member.userId),
        name: String(member.name || member.userName || "Team member"),
        role: String(member.role || "team-member"),
        isOnline: false,
        status: "away",
        statusText: "",
        mood: "",
        lastSeenAt: new Date(0),
      })),
  );

  const teamContext = dedupeById([...presence, ...fallbackTeam]).sort((a, b) => {
    if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const agenda = (Array.isArray(agendaRows) ? agendaRows : [])
    .map(normalizeAgendaRow)
    .filter(Boolean)
    .filter((item) => item.at)
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, 8);

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const checkIn = {
    status: String(statusRow?.status || "available"),
    note: String(statusRow?.note || statusRow?.statusText || ""),
  };

  return {
    todayLabel,
    founderName: pickFounderName(user, fallbackUsers),
    tasks: sortedTasks,
    activeTasks,
    blockedTasks,
    completedTasks,
    upcoming: agenda,
    teamContext,
    hasLivePresence: presence.length > 0,
    checkIn,
    statusOptions: STATUS_OPTIONS,
    metrics: {
      total: sortedTasks.length,
      pending: sortedTasks.filter((task) => task.status === "pending").length,
      inProgress: sortedTasks.filter((task) => task.status === "in-progress").length,
      blocked: blockedTasks.length,
      completed: completedTasks.length,
      completionRate,
    },
  };
}

export function mapTeamMemberPerformanceViewModel({
  taskRows = [],
  performanceRow = null,
}) {
  const tasks = (Array.isArray(taskRows) ? taskRows : []).map(normalizeTask).filter(Boolean);
  const totalTasks = Number(performanceRow?.totalTasks || tasks.length || 0);
  const completedTasks = Number(
    performanceRow?.completedTasks || tasks.filter((task) => task.status === "completed").length || 0,
  );

  const completionFromApi = Number(performanceRow?.completionRate || 0);
  const completionRate = completionFromApi
    ? completionFromApi <= 1
      ? Math.round(completionFromApi * 100)
      : Math.round(completionFromApi)
    : totalTasks
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

  const blockedCount = tasks.filter((task) => task.status === "blocked").length;
  const inProgressCount = tasks.filter((task) => task.status === "in-progress").length;
  const blockerRate = totalTasks > 0 ? Math.round((blockedCount / totalTasks) * 100) : 0;
  const streak = computeStreak(tasks);
  const weeklyCompleted = tasks.filter((task) => {
    if (task.status !== "completed") return false;
    const taskDate = task.updatedAt || task.createdAt;
    return Date.now() - taskDate.getTime() <= 7 * 86400000;
  }).length;

  const momentum = deriveMomentum(completionRate, blockerRate);
  const payoutThreshold = Number(performanceRow?.payoutThreshold || 80);
  const isOnTrack =
    typeof performanceRow?.isOnTrack === "boolean"
      ? performanceRow.isOnTrack
      : completionRate >= payoutThreshold;

  return {
    tasks,
    completionRate,
    blockerRate,
    totalTasks,
    completedTasks,
    blockedCount,
    inProgressCount,
    streak,
    weeklyCompleted,
    payoutThreshold,
    isOnTrack,
    momentum,
  };
}
