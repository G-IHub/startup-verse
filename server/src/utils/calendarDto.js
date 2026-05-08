/**
 * Canonical calendar / agenda DTOs for GET /calendar/:userId and aligned /agenda responses.
 */

function startOfUtcDay(d) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function toIso(d) {
  if (!d) return null;
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? null : t.toISOString();
}

function toDateKey(isoOrDate) {
  if (!isoOrDate) return "";
  const t = new Date(isoOrDate);
  if (Number.isNaN(t.getTime())) return "";
  return t.toISOString().slice(0, 10);
}

/**
 * @param {object} row - Mongoose lean doc
 * @param {"event"|"deliverable"|"programMilestone"} kind
 * @param {Date} now
 */
export function mapToTimelineItem(row, kind, now) {
  const id = row?._id != null ? String(row._id) : String(row?.id || "");
  const todayStart = startOfUtcDay(now).getTime();

  if (kind === "event") {
    const at = row.startsAt || null;
    const endAt = row.endsAt || null;
    const atMs = at ? new Date(at).getTime() : NaN;
    const isOverdue = Boolean(
      at && !Number.isNaN(atMs) && atMs < todayStart,
    );
    return {
      kind: "event",
      id,
      title: String(row.title || "Event"),
      at: toIso(at),
      endAt: toIso(endAt),
      cohortId: row.cohortId != null ? String(row.cohortId) : null,
      startupId: null,
      status: null,
      isOverdue,
      agendaType: "company-event",
      date: toDateKey(at),
      dueDate: toDateKey(at),
      metadata: {
        description: String(row.description || ""),
        location: String(row.location || ""),
      },
    };
  }

  if (kind === "deliverable") {
    const at = row.dueDate || null;
    const atMs = at ? new Date(at).getTime() : NaN;
    const isOverdue = Boolean(
      at &&
        !Number.isNaN(atMs) &&
        atMs < todayStart,
    );
    return {
      kind: "deliverable",
      id,
      title: String(row.title || "Deliverable"),
      at: toIso(at),
      endAt: null,
      cohortId: row.cohortId != null ? String(row.cohortId) : null,
      startupId: null,
      status: null,
      isOverdue,
      agendaType: "organization-deadline",
      date: toDateKey(at),
      dueDate: toDateKey(at),
      metadata: {
        description: String(row.description || ""),
      },
    };
  }

  const at = row.dueDate || null;
  const atMs = at ? new Date(at).getTime() : NaN;
  const isOverdue = Boolean(
    at &&
      !Number.isNaN(atMs) &&
      atMs < todayStart,
  );
  return {
    kind: "programMilestone",
    id,
    title: String(row.title || "Milestone"),
    at: toIso(at),
    endAt: null,
    cohortId: row.cohortId != null ? String(row.cohortId) : null,
    startupId: null,
    status: null,
    isOverdue,
    agendaType: "milestone",
    date: toDateKey(at),
    dueDate: toDateKey(at),
    metadata: {
      description: String(row.description || ""),
    },
  };
}

export function buildSortedTimeline(items) {
  return [...items].sort((a, b) => {
    const ta = a.at ? new Date(a.at).getTime() : Number.MAX_SAFE_INTEGER;
    const tb = b.at ? new Date(b.at).getTime() : Number.MAX_SAFE_INTEGER;
    return ta - tb;
  });
}

export function filterTimelineByWindow(timeline, windowStart, windowEnd) {
  const ws = windowStart.getTime();
  const we = windowEnd.getTime();
  return timeline.filter((row) => {
    if (!row.at) return false;
    const t = new Date(row.at).getTime();
    return t >= ws && t <= we;
  });
}
