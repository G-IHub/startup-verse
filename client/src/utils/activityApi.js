/**
 * Activity feed via presence endpoints (startup-scoped).
 */

import { getAccessToken } from "../app/session";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

/**
 * Post a new activity using the DEPLOYED presence/update endpoint
 * This endpoint stores activity in both presence and activity feed
 */
export async function postActivity(params) {
  try {
    const url = `${BASE_URL}/presence/update`;

    // Debug logging
    console.log("🔍 [Activity API] Posting activity to:", url);
    console.log("🔍 [Activity API] Activity data:", {
      userId: params.userId,
      startupId: params.startupId,
      type: params.type,
      message: params.message,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify({
        userId: params.userId,
        startupId: params.startupId,
        status: "active",
        cameraEnabled: false,
        // Activity data that will be stored in feed
        activity: {
          type: params.type,
          message: params.message,
          icon: params.icon || "📋",
          userName: params.userName,
          timestamp: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      // Silently handle server errors (rate limiting, Cloudflare issues, etc.)
      // Frontend has localStorage fallback, so these errors are expected and recoverable
      const statusText = response.statusText || "Server error";

      // Only log warning for rate limit errors (500), not full error
      if (response.status === 500) {
        console.warn(
          `⚠️ [Activity API] Server temporarily unavailable (${response.status}) - using localStorage fallback`,
        );
      } else {
        const errorText = await response.text();
        console.error("❌ [Activity API] Failed to post activity:", {
          status: response.status,
          statusText,
          url: url,
          error: errorText.substring(0, 200), // Truncate long HTML errors
        });
      }

      return {
        success: false,
        error: `HTTP ${response.status}: ${statusText}`,
      };
    }

    const data = await response.json();
    console.log("✅ Activity posted successfully via presence update");

    // Return activity in expected format
    return {
      success: true,
      activity: {
        id: `${params.userId}-${Date.now()}`,
        userId: params.userId,
        userName: params.userName,
        startupId: params.startupId,
        type: params.type,
        message: params.message,
        icon: params.icon || "📋",
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    // Show detailed error for debugging
    console.error("❌ [Activity API] Exception posting activity:", {
      error: error.message,
      stack: error.stack,
      type: error.name,
      url: `${BASE_URL}/presence/update`,
    });

    // Silently fall back when backend isn't deployed yet
    // This is expected in development/local mode
    if (import.meta.env.DEV) {
      // Only log once in development
      if (!window.__activityPostWarningShown) {
        console.warn(
          "⚠️ Activity backend not available - using local mode only",
        );
        window.__activityPostWarningShown = true;
      }
    }
    return { success: false, error: error.message || "Network error" };
  }
}

/**
 * Get all activities for a startup using the DEPLOYED presence/:startupId endpoint
 * The backend now returns both presence and activities in the response
 */
export async function getStartupActivities(startupId, options) {
  try {
    const url = `${BASE_URL}/presence/${startupId}`;

    // Debug logging
    console.log("🔍 [Activity API] Fetching activities from:", url);
    console.log("🔍 [Activity API] BASE_URL:", BASE_URL);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    });

    if (!response.ok) {
      // Show detailed error for debugging
      const errorText = await response.text();
      console.error("❌ [Activity API] Failed to fetch activities:", {
        status: response.status,
        statusText: response.statusText,
        url: url,
        error: errorText,
      });
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const payload = await response.json();
    const raw = payload?.data;
    const rows = Array.isArray(raw) ? raw : [];
    // Presence rows may carry last office activity in metadata.lastFeedActivity
    const activities = rows
      .map((row) => {
        const a = row?.metadata?.lastFeedActivity;
        if (!a || typeof a !== "object") return null;
        return {
          id: `${row.userId}-${a.timestamp || row.updatedAt || ""}`,
          userId: row.userId,
          userName: a.userName || row.userName || "",
          type: a.type || "update",
          message: a.message || "",
          icon: typeof a.icon === "string" ? a.icon : "📋",
          timestamp: new Date(a.timestamp || row.updatedAt || Date.now()),
          startupId: String(startupId),
        };
      })
      .filter(Boolean);

    console.log(`✅ Derived ${activities.length} feed hints from presence rows`);

    return {
      success: true,
      activities,
      pagination: { page: 1, pageSize: 50, totalPages: 1 },
    };
  } catch (error) {
    // Show detailed error for debugging
    console.error("❌ [Activity API] Exception fetching activities:", {
      error: error.message,
      stack: error.stack,
      type: error.name,
      url: `${BASE_URL}/presence/${startupId}`,
    });

    // Silently fall back when backend isn't deployed yet
    // This is expected in development/local mode
    if (import.meta.env.DEV) {
      // Only log once in development
      if (!window.__activityFetchWarningShown) {
        console.warn(
          "⚠️ Activity sync not available - using local activities only",
        );
        window.__activityFetchWarningShown = true;
      }
    }

    return { success: false, error: error.message || "Network error" };
  }
}
