import { getAccessToken } from "../app/session";
import { API_BASE_URL } from "../config/apiBase.js";

const BASE_URL = API_BASE_URL;
const DEFAULT_ICON = "📋";

function toActivity(raw) {
  if (!raw || typeof raw !== "object") return null;
  const timestamp = raw.timestamp ? new Date(raw.timestamp) : new Date();
  return {
    id: String(raw.id || ""),
    startupId: String(raw.startupId || ""),
    userId: String(raw.userId || ""),
    userName: String(raw.userName || ""),
    type: String(raw.type || "update"),
    message: String(raw.message || ""),
    icon: typeof raw.icon === "string" ? raw.icon : DEFAULT_ICON,
    timestamp,
    metadata: raw.metadata && typeof raw.metadata === "object" ? raw.metadata : {},
  };
}

export async function postActivity(params) {
  try {
    const url = `${BASE_URL}/startups/${params.startupId}/activities`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify({
        userId: params.userId,
        userName: params.userName,
        type: params.type,
        message: params.message,
        icon: params.icon || DEFAULT_ICON,
        metadata: params.metadata || {},
      }),
    });

    if (!response.ok) {
      const statusText = response.statusText || "Server error";
      const errorText = await response.text();
      return {
        success: false,
        error: `HTTP ${response.status}: ${statusText || errorText}`,
      };
    }

    const payload = await response.json();
    const activity = toActivity(payload?.data);
    if (!activity) {
      return { success: false, error: "Invalid activity response" };
    }

    return {
      success: true,
      activity,
    };
  } catch (error) {
    return { success: false, error: error.message || "Network error" };
  }
}

export async function getStartupActivities(startupId, options) {
  try {
    const limit = Number(options?.pageSize || options?.limit || 50);
    const url = `${BASE_URL}/startups/${startupId}/activities?limit=${encodeURIComponent(limit)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const payload = await response.json();
    const activities = (Array.isArray(payload?.data) ? payload.data : [])
      .map((row) => toActivity(row))
      .filter(Boolean);

    return {
      success: true,
      activities,
      pagination: {
        page: 1,
        pageSize: limit,
        totalPages: 1,
      },
    };
  } catch (error) {
    return { success: false, error: error.message || "Network error" };
  }
}

export async function getStartupWins(startupId, options) {
  try {
    const limit = Number(options?.pageSize || options?.limit || 50);
    const url = `${BASE_URL}/startups/${startupId}/wins?limit=${encodeURIComponent(limit)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
    const payload = await response.json();
    const wins = (Array.isArray(payload?.data) ? payload.data : [])
      .map((row) => toActivity(row))
      .filter(Boolean);
    return { success: true, wins };
  } catch (error) {
    return { success: false, error: error.message || "Network error" };
  }
}

export async function postWin(params) {
  try {
    const url = `${BASE_URL}/startups/${params.startupId}/wins`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify({
        userId: params.userId,
        message: params.message,
      }),
    });
    if (!response.ok) {
      const statusText = response.statusText || "Server error";
      const errorText = await response.text();
      return {
        success: false,
        error: `HTTP ${response.status}: ${statusText || errorText}`,
      };
    }
    const payload = await response.json();
    const win = toActivity(payload?.data);
    if (!win) {
      return { success: false, error: "Invalid win response" };
    }
    return { success: true, win };
  } catch (error) {
    return { success: false, error: error.message || "Network error" };
  }
}
