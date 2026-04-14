/**
 * Agenda / calendar API — canonical reads use GET /calendar/:userId (envelope).
 */
import { get } from "../backendClient.js";
import {
  normalizeCalendarResponse,
  timelineToAgendaItems,
} from "./calendarMappers.js";

function toIsoParam(d) {
  if (d == null) return null;
  if (typeof d === "string") return d;
  if (d instanceof Date) return d.toISOString();
  return String(d);
}

/**
 * Primary read: unified calendar for the authenticated user (must match :userId or admin).
 * @param {string} userId
 * @param {{ start?: Date|string, end?: Date|string }} [options]
 */
export async function getUnifiedCalendar(userId, options = {}) {
  try {
    const params = new URLSearchParams();
    const start = toIsoParam(options.start);
    const end = toIsoParam(options.end);
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    const q = params.toString();
    const path = `/calendar/${encodeURIComponent(userId)}${q ? `?${q}` : ""}`;
    const payload = await get(path);
    const normalized = normalizeCalendarResponse(payload.data);
    return { success: true, ...normalized };
  } catch (error) {
    console.error("Error fetching unified calendar:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch calendar",
    };
  }
}

/**
 * Startup-scoped agenda (cohort events, deliverables, milestones). Envelope + normalized agenda.
 */
export async function getStartupAgenda(startupId, options) {
  try {
    const params = new URLSearchParams();
    if (options?.startDate) params.append("startDate", options.startDate);
    if (options?.endDate) params.append("endDate", options.endDate);
    if (options?.start) params.append("start", toIsoParam(options.start));
    if (options?.end) params.append("end", toIsoParam(options.end));
    if (options?.types) params.append("types", options.types.join(","));
    if (options?.includeCompleted) params.append("includeCompleted", "true");

    const q = params.toString();
    const path = `/agenda/${encodeURIComponent(startupId)}${q ? `?${q}` : ""}`;
    const payload = await get(path);
    const data = payload.data || {};
    const rawAgenda = Array.isArray(data.agenda)
      ? data.agenda
      : Array.isArray(data.timeline)
        ? data.timeline
        : [];
    const agenda = timelineToAgendaItems(rawAgenda);
    return { success: true, ...data, agenda };
  } catch (error) {
    console.error("Error fetching startup agenda:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch agenda",
    };
  }
}

export async function getUserAgenda(userId, options) {
  try {
    const params = new URLSearchParams();
    if (options?.startDate) params.append("startDate", options.startDate);
    if (options?.endDate) params.append("endDate", options.endDate);
    if (options?.types) params.append("types", options.types.join(","));
    if (options?.includeCompleted) params.append("includeCompleted", "true");

    const q = params.toString();
    const path = `/agenda/user/${encodeURIComponent(userId)}${q ? `?${q}` : ""}`;
    const payload = await get(path);
    return { success: true, ...(payload.data || {}) };
  } catch (error) {
    console.error("Error fetching user agenda:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch user agenda",
    };
  }
}

/**
 * @param {string} userId - authenticated user id (GET /calendar/:userId)
 */
export async function getUpcomingAgenda(userId, days = 7) {
  try {
    const start = new Date();
    const end = new Date(start.getTime() + days * 86400000);
    return await getUnifiedCalendar(userId, { start, end });
  } catch (error) {
    console.error("Error fetching upcoming agenda:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch upcoming agenda",
    };
  }
}

export async function getAgendaByDateRange(
  startupId,
  startDate,
  endDate,
  types,
) {
  const startDateStr = startDate.toISOString().split("T")[0];
  const endDateStr = endDate.toISOString().split("T")[0];

  return getStartupAgenda(startupId, {
    startDate: startDateStr,
    endDate: endDateStr,
    types,
  });
}

/**
 * @param {string} userId
 */
export async function getTodayAgenda(userId) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return getUnifiedCalendar(userId, { start, end });
}

/**
 * @param {string} userId
 */
export async function getWeekAgenda(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
  endOfWeek.setHours(23, 59, 59, 999);
  return getUnifiedCalendar(userId, { start: today, end: endOfWeek });
}

/**
 * @param {string} userId
 */
export async function getOverdueAgenda(userId) {
  try {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setFullYear(start.getFullYear() - 2);
    start.setHours(0, 0, 0, 0);
    const result = await getUnifiedCalendar(userId, { start, end });
    if (result.success && Array.isArray(result.agenda)) {
      return {
        success: true,
        agenda: result.agenda.filter((item) => item.isOverdue),
      };
    }
    return result;
  } catch (error) {
    console.error("Error fetching overdue agenda:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch overdue items",
    };
  }
}
