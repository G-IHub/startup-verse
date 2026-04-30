function toId(row) {
  if (!row || typeof row !== "object") return "";
  return String(row.id || row._id || row.userId || "");
}

function toDate(value) {
  if (value instanceof Date) return value;
  const parsed = new Date(value || Date.now());
  if (Number.isNaN(parsed.getTime())) return new Date();
  return parsed;
}

function normalizeStatus(status) {
  const raw = String(status || "pending").toLowerCase().replace(/_/g, "-");
  if (raw === "inprogress") return "in-progress";
  if (["pending", "in-progress", "blocked", "completed"].includes(raw)) return raw;
  return "pending";
}

function normalizeActivity(row) {
  if (!row) return null;
  return {
    id: toId(row),
    userId: String(row.userId || ""),
    userName: String(row.userName || row.actorName || "Team member"),
    type: String(row.type || "update"),
    message: String(row.message || row.body || ""),
    icon: typeof row.icon === "string" ? row.icon : "📌",
    timestamp: toDate(row.timestamp || row.createdAt),
    metadata: row.metadata && typeof row.metadata === "object" ? row.metadata : {},
  };
}

function normalizePresence(row) {
  if (!row) return null;
  const id = String(row.userId || row.id || "");
  const isOnline =
    typeof row.isOnline === "boolean" ? row.isOnline : String(row.status || "") !== "away";
  return {
    id,
    userId: id,
    userName: String(row.userName || row.name || "Team member"),
    role: String(row.role || "team-member"),
    status: String(row.status || (isOnline ? "available" : "away")),
    statusText: String(row.statusText || ""),
    mood: String(row.mood || ""),
    activity: String(row.activity?.type || row.activity || "working"),
    cameraEnabled: Boolean(row.cameraEnabled),
    isOnline,
    lastSeenAt: toDate(row.lastSeenAt || row.updatedAt),
    avatar: row.avatar || "",
  };
}

function normalizeAnnouncement(row) {
  if (!row) return null;
  return {
    id: toId(row),
    message: String(row.message || row.body || ""),
    title: String(row.title || "Announcement"),
    category: String(row.category || "general"),
    priority: String(row.priority || "normal"),
    createdAt: toDate(row.createdAt || row.timestamp),
    createdByName: String(row.createdByName || row.userName || "Team"),
    emoji: typeof row.emoji === "string" ? row.emoji : "",
  };
}

function normalizeTask(row) {
  if (!row) return null;
  const id = toId(row);
  return {
    id,
    title: String(row.title || "Untitled task"),
    status: normalizeStatus(row.status),
    priority: String(row.priority || "medium"),
    dueDate: row.dueDate ? toDate(row.dueDate) : null,
    createdAt: toDate(row.createdAt),
    assignedTo: String(row.assignedTo || row.assigneeId || ""),
    assignedToName: String(row.assignedToName || row.assigneeName || ""),
    blockerReason: String(row.blockerReason || row.blockedReason || ""),
    blockerNote: String(row.blockerNote || row.blockedNote || ""),
    raw: row,
  };
}

function normalizeAgendaItem(row) {
  if (!row) return null;
  const id = toId(row) || `${row.type || "item"}-${row.date || row.dueDate || Date.now()}`;
  const when = toDate(row.date || row.dueDate || row.start || row.startsAt || row.createdAt);
  return {
    id,
    type: String(row.type || "event"),
    title: String(row.title || row.name || "Untitled"),
    status: String(row.status || ""),
    date: when,
    isOverdue: Boolean(row.isOverdue),
    metadata: row.metadata && typeof row.metadata === "object" ? row.metadata : {},
  };
}

function compareByDateDesc(left, right, getDate) {
  return getDate(right).getTime() - getDate(left).getTime();
}

function mergeByIdInternal(list, getId) {
  const byId = new Map();
  for (const item of list) {
    const id = String(getId(item) || "");
    if (!id) continue;
    byId.set(id, { ...(byId.get(id) || {}), ...item });
  }
  return Array.from(byId.values());
}

export function mergeRowsById(previousRows, incomingRows, getId = (row) => row.id) {
  return mergeByIdInternal([...(previousRows || []), ...(incomingRows || [])], getId);
}

export function mapOfficeWorkspaceModel({
  user,
  teamMembers = [],
  pendingTalents = [],
  presenceRows = [],
  activityRows = [],
  winRows = [],
  announcementRows = [],
  taskRows = [],
  agendaRows = [],
}) {
  const normalizedTeamMembers = (Array.isArray(teamMembers) ? teamMembers : [])
    .map((row) => ({
      id: String(row.id || row.userId || ""),
      name: String(row.name || row.userName || "Team member"),
      role: String(row.role || "team-member"),
      title: String(row.title || row.professionalTitle || ""),
      avatar: row.avatar || "",
    }))
    .filter((row) => Boolean(row.id));

  const presence = mergeByIdInternal(
    (Array.isArray(presenceRows) ? presenceRows : []).map(normalizePresence).filter(Boolean),
    (row) => row.id,
  );

  const memberById = new Map(normalizedTeamMembers.map((member) => [member.id, member]));
  const presenceById = new Map(presence.map((member) => [member.id, member]));

  const userId = String(user?._id ?? user?.id ?? "");
  const ensureCurrentUser = userId
    ? {
        id: userId,
        name: String(user?.name || "You"),
        role: String(user?.role || "team-member"),
        title: String(user?.title || ""),
        avatar: user?.avatar || "",
      }
    : null;

  const teamRoster = mergeByIdInternal(
    [
      ...normalizedTeamMembers,
      ...(ensureCurrentUser ? [ensureCurrentUser] : []),
      ...presence.map((row) => ({
        id: row.id,
        name: row.userName,
        role: row.role,
        title: memberById.get(row.id)?.title || "",
        avatar: memberById.get(row.id)?.avatar || row.avatar || "",
      })),
    ],
    (row) => row.id,
  ).map((member) => {
    const presenceRow = presenceById.get(member.id);
    return {
      ...member,
      status: presenceRow?.status || "away",
      isOnline: Boolean(presenceRow?.isOnline),
      activity: presenceRow?.activity || "working",
      statusText: presenceRow?.statusText || "",
      mood: presenceRow?.mood || "",
      lastSeenAt: presenceRow?.lastSeenAt || new Date(0),
      cameraEnabled: Boolean(presenceRow?.cameraEnabled),
    };
  });

  const activities = mergeByIdInternal(
    [...(activityRows || []), ...(winRows || [])].map(normalizeActivity).filter(Boolean),
    (row) => row.id,
  ).sort((left, right) => compareByDateDesc(left, right, (row) => row.timestamp));

  const announcements = mergeByIdInternal(
    (announcementRows || []).map(normalizeAnnouncement).filter(Boolean),
    (row) => row.id,
  ).sort((left, right) => compareByDateDesc(left, right, (row) => row.createdAt));

  const tasks = mergeByIdInternal((taskRows || []).map(normalizeTask).filter(Boolean), (row) => row.id)
    .sort((left, right) => compareByDateDesc(left, right, (row) => row.createdAt));

  const myTasks = tasks.filter((task) => {
    if (user?.role === "founder") {
      if (!task.assignedTo) return true;
      return task.assignedTo === userId;
    }
    return task.assignedTo === userId;
  });

  const teamTasks = user?.role === "founder"
    ? tasks.filter((task) => task.assignedTo && task.assignedTo !== userId)
    : [];

  const agenda = mergeByIdInternal(
    (agendaRows || []).map(normalizeAgendaItem).filter(Boolean),
    (row) => row.id,
  ).sort((left, right) => left.date.getTime() - right.date.getTime());

  const onlineCount = teamRoster.filter((row) => row.isOnline).length;
  const inCallCount = teamRoster.filter((row) => row.activity === "in-call").length;
  const workingCount = teamRoster.filter((row) => row.activity === "working").length;

  // chatRoster extends teamRoster with pending talents (interests not yet accepted)
  // so founders can chat with interested talents before they become team members
  const teamRosterIds = new Set(teamRoster.map((m) => m.id));
  const pendingForChat = (Array.isArray(pendingTalents) ? pendingTalents : [])
    .filter((t) => Boolean(t.id) && !teamRosterIds.has(t.id))
    .map((t) => ({
      id: t.id,
      name: String(t.name || "Interested Talent"),
      role: "talent",
      title: String(t.title || ""),
      avatar: t.avatar || "",
      status: "away",
      isOnline: false,
      activity: "working",
      statusText: "",
      mood: "",
      lastSeenAt: new Date(0),
      cameraEnabled: false,
      isPendingTalent: true,
    }));
  const chatRoster = [...teamRoster, ...pendingForChat];

  return {
    teamRoster,
    chatRoster,
    presence,
    activities,
    announcements,
    tasks,
    myTasks,
    teamTasks,
    agenda,
    teamEnergy: {
      onlineCount,
      inCallCount,
      workingCount,
      totalCount: teamRoster.length,
      percentage:
        teamRoster.length > 0 ? Math.round((onlineCount / teamRoster.length) * 100) : 0,
    },
  };
}
