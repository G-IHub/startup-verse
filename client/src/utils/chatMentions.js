const MENTION_TOKEN_RE = /@([^\s@][^\n@]*)/g;

export function detectMentionQuery(text, caretIndex) {
  const value = String(text || "");
  const caret = Math.max(0, Math.min(Number(caretIndex) || value.length, value.length));
  const beforeCaret = value.slice(0, caret);
  const atIndex = beforeCaret.lastIndexOf("@");
  if (atIndex < 0) return null;

  const query = beforeCaret.slice(atIndex + 1);
  if (/\s/.test(query)) return null;

  return { atIndex, query, caret };
}

export function buildMentionToken(label) {
  const trimmed = String(label || "").trim();
  if (!trimmed) return "@";
  return `@${trimmed}`;
}

export function mentionTokenInBody(body, label) {
  const token = buildMentionToken(label);
  return String(body || "").includes(token);
}

export function buildMilestoneSnapshot(milestone) {
  return {
    title: String(milestone?.title || "Milestone"),
    status: String(milestone?.status || "pending"),
    totalTasks: Number(milestone?.totalTasks || 0),
    tasksCompleted: Number(milestone?.tasksCompleted || 0),
  };
}

export function buildTaskSnapshot(task) {
  return {
    title: String(task?.title || "Untitled task"),
    status: String(task?.status || "pending"),
    priority: String(task?.priority || "medium"),
    assignedToName: String(task?.assignedToName || "Unassigned"),
    milestoneName: String(task?.milestoneName || ""),
  };
}

export function createMentionFromMilestone(milestone) {
  return {
    type: "milestone",
    id: String(milestone.id),
    label: String(milestone.title || "Milestone"),
    snapshot: buildMilestoneSnapshot(milestone),
  };
}

export function createMentionFromTask(task) {
  return {
    type: "task",
    id: String(task.id),
    label: String(task.title || "Untitled task"),
    snapshot: buildTaskSnapshot(task),
  };
}

export function insertMentionIntoText(text, caretIndex, label) {
  const detection = detectMentionQuery(text, caretIndex);
  if (!detection) {
    const token = buildMentionToken(label);
    const next = `${text || ""}${text && !text.endsWith(" ") ? " " : ""}${token} `;
    return { text: next, caret: next.length };
  }

  const token = buildMentionToken(label);
  const before = String(text || "").slice(0, detection.atIndex);
  const after = String(text || "").slice(detection.caret);
  const next = `${before}${token} ${after}`;
  const caret = before.length + token.length + 1;
  return { text: next, caret };
}

export function reconcileMentionsWithBody(body, mentions = []) {
  return (Array.isArray(mentions) ? mentions : []).filter((mention) =>
    mentionTokenInBody(body, mention?.label),
  );
}

export function buildMessageMentionMetadata(body, mentions = []) {
  const activeMentions = reconcileMentionsWithBody(body, mentions);
  if (activeMentions.length === 0) return {};
  return { mentions: activeMentions };
}

function filterRows(rows, query, fields) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) =>
    fields.some((field) => String(row[field] || "").toLowerCase().includes(q)),
  );
}

export function getFilteredMentionables(mentionables = {}, query = "") {
  const milestones = filterRows(mentionables.milestones || [], query, ["title", "status"]);
  const tasks = filterRows(mentionables.tasks || [], query, [
    "title",
    "status",
    "priority",
    "assignedToName",
    "milestoneName",
  ]);
  const flat = [
    ...milestones.map((row) => ({ kind: "milestone", row })),
    ...tasks.map((row) => ({ kind: "task", row })),
  ];
  return { milestones, tasks, flat };
}

export function parseMentionTokens(body) {
  const tokens = [];
  const value = String(body || "");
  let match = MENTION_TOKEN_RE.exec(value);
  while (match) {
    tokens.push(match[1].trim());
    match = MENTION_TOKEN_RE.exec(value);
  }
  MENTION_TOKEN_RE.lastIndex = 0;
  return tokens;
}
