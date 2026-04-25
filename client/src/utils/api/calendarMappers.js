/**
 * Maps canonical server timeline rows (see server/src/utils/calendarDto.js)
 * into AgendaPanel / calendar UI shapes.
 */

function formatHm(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function colorForAgendaType(type) {
  switch (type) {
    case "meeting":
      return "#7c3aed";
    case "company-event":
      return "#8b5cf6";
    case "organization-deadline":
      return "#ef4444";
    case "milestone":
      return "#f59e0b";
    default:
      return "#64748b";
  }
}

/**
 * @param {object} row - server timeline item
 */
export function timelineItemToAgendaPanel(row) {
  if (!row || typeof row !== "object") return null;
  const type = row.agendaType || row.type || "company-event";
  const description = row.metadata?.description || "";
  const startTime = formatHm(row.at);
  const endTime = formatHm(row.endAt);
  return {
    ...row,
    type,
    description,
    startTime,
    endTime,
    color: row.color || colorForAgendaType(type),
  };
}

/**
 * @param {object[]} timeline
 * @returns {object[]}
 */
export function timelineToAgendaItems(timeline) {
  if (!Array.isArray(timeline)) return [];
  return timeline
    .map((row) => timelineItemToAgendaPanel(row))
    .filter(Boolean);
}

/**
 * @param {object} data - GET /calendar/:userId envelope `data`
 */
export function normalizeCalendarResponse(data) {
  if (!data || typeof data !== "object") {
    return {
      events: [],
      deliverables: [],
      programMilestones: [],
      meetings: [],
      timeline: [],
      agenda: [],
      window: null,
    };
  }
  const timeline = Array.isArray(data.timeline) ? data.timeline : [];
  const agenda = timelineToAgendaItems(
    Array.isArray(data.agenda) ? data.agenda : timeline,
  );
  return {
    ...data,
    timeline,
    agenda,
  };
}

const calDedupeKey = (item) =>
  `${item.kind || "row"}:${item.id != null ? String(item.id) : ""}`;

/**
 * Merge server calendar rows into local calendar `events` (tasks/meetings) without duplicate keys.
 * @param {object[]} localEvents - items with `id`, `date` Date
 * @param {object[]} agendaItems - normalized agenda rows (with `at`, `kind`, `id`)
 */
export function mergeCalendarAgendaIntoEvents(localEvents, agendaItems) {
  const keys = new Set(
    (localEvents || []).map((e) => `local:${String(e.id)}`),
  );
  const extra = [];
  for (const item of agendaItems || []) {
    const key = calDedupeKey(item);
    if (keys.has(key)) continue;
    keys.add(key);
    const at = item.at ? new Date(item.at) : null;
    if (!at || Number.isNaN(at.getTime())) continue;
    const isEvent = item.kind === "event" || item.agendaType === "company-event";
    extra.push({
      id: key,
      title: item.title,
      type: isEvent ? "calendar-event" : item.type || item.agendaType,
      date: at,
      startTime: item.startTime,
      endTime: item.endTime,
      description: item.description,
      color:
        item.agendaType === "milestone"
          ? "bg-amber-500"
          : item.agendaType === "organization-deadline"
            ? "bg-red-500"
            : "bg-violet-500",
      calendarSource: true,
    });
  }
  return [...(localEvents || []), ...extra];
}
