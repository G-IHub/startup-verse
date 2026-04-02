/**
 * Agenda API - Frontend client for unified calendar/agenda system
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

/**
 * Get all agenda items for a startup
 */
export async function getStartupAgenda(startupId, options) {
  try {
    const params = new URLSearchParams();
    if (options?.startDate) params.append("startDate", options.startDate);
    if (options?.endDate) params.append("endDate", options.endDate);
    if (options?.types) params.append("types", options.types.join(","));
    if (options?.includeCompleted) params.append("includeCompleted", "true");

    const url = `${API_URL}/agenda/${startupId}?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching startup agenda:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch agenda",
    };
  }
}

/**
 * Get agenda items for a specific user
 */
export async function getUserAgenda(userId, options) {
  try {
    const params = new URLSearchParams();
    if (options?.startDate) params.append("startDate", options.startDate);
    if (options?.endDate) params.append("endDate", options.endDate);
    if (options?.types) params.append("types", options.types.join(","));
    if (options?.includeCompleted) params.append("includeCompleted", "true");

    const url = `${API_URL}/agenda/user/${userId}?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
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
 * Get upcoming agenda items (next N days)
 */
export async function getUpcomingAgenda(startupId, days = 7) {
  try {
    const url = `${API_URL}/agenda/${startupId}/upcoming?days=${days}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
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

/**
 * Get agenda items for a specific date range
 */
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
 * Get today's agenda items
 */
export async function getTodayAgenda(startupId) {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  return getStartupAgenda(startupId, {
    startDate: todayStr,
    endDate: todayStr,
  });
}

/**
 * Get this week's agenda items
 */
export async function getWeekAgenda(startupId) {
  const today = new Date();
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (6 - today.getDay()));

  return getAgendaByDateRange(startupId, today, endOfWeek);
}

/**
 * Get overdue items
 */
export async function getOverdueAgenda(startupId) {
  try {
    const result = await getStartupAgenda(startupId, {
      includeCompleted: false,
    });

    if (result.success && result.agenda) {
      const overdueItems = result.agenda.filter((item) => item.isOverdue);
      return {
        success: true,
        agenda: overdueItems,
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
