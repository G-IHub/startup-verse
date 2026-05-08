import { get, post } from "./backendClient.js";

const DEFAULT_ICON = "\uD83D\uDCCB";

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
    const path = `/startups/${encodeURIComponent(params.startupId)}/activities`;
    const payload = await post(path, {
      userId: params.userId,
      userName: params.userName,
      type: params.type,
      message: params.message,
      icon: params.icon || DEFAULT_ICON,
      metadata: params.metadata || {},
    });
    const activity = toActivity(payload?.data);
    if (!activity) {
      return { success: false, error: "Invalid activity response" };
    }
    return { success: true, activity };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

export async function getStartupActivities(startupId, options) {
  try {
    const limit = Number(options?.pageSize || options?.limit || 50);
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (options?.type) {
      params.set("type", String(options.type));
    }
    const path = `/startups/${encodeURIComponent(startupId)}/activities?${params.toString()}`;
    const payload = await get(path);
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
    return { success: false, error: error instanceof Error ? error.message : "Network error" };
  }
}

export async function getStartupWins(startupId, options) {
  try {
    const limit = Number(options?.pageSize || options?.limit || 50);
    const path = `/startups/${encodeURIComponent(startupId)}/wins?limit=${encodeURIComponent(limit)}`;
    const payload = await get(path);
    const wins = (Array.isArray(payload?.data) ? payload.data : [])
      .map((row) => toActivity(row))
      .filter(Boolean);
    return { success: true, wins };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Network error" };
  }
}

export async function postWin(params) {
  try {
    const path = `/startups/${encodeURIComponent(params.startupId)}/wins`;
    const payload = await post(path, {
      userId: params.userId,
      message: params.message,
    });
    const win = toActivity(payload?.data);
    if (!win) {
      return { success: false, error: "Invalid win response" };
    }
    return { success: true, win };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}
