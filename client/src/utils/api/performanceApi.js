// Performance API wrapper for backend-first performance metrics
import { offlineStorage } from "../offlineStorage";
import { getAccessToken } from "../../app/session";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

/**
 * Get performance metrics for a team member (with contribution graph)
 * This endpoint is cached on the server for 5 minutes
 * Also supports offline mode with IndexedDB cache
 */
export async function getPerformanceMetrics(
  teamMemberId,
  isOnline = navigator.onLine,
) {
  if (isOnline) {
    // Online - fetch from backend
    try {
      console.log(
        `📥 Fetching performance metrics for team member: ${teamMemberId}`,
      );

      const response = await fetch(
        `${API_BASE}/team-members/${teamMemberId}/performance`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Failed to fetch performance metrics:", errorData);
        throw new Error(
          `Failed to fetch performance metrics: ${response.statusText}`,
        );
      }

      const data = await response.json();
      const metrics = data.performance || null;

      // Cache in IndexedDB for offline access
      if (metrics) {
        await offlineStorage.savePerformance(teamMemberId, metrics);
        console.log(`✅ Performance metrics cached for offline access`);
      }

      console.log(`✅ Loaded performance metrics from backend (cached)`);

      return metrics;
    } catch (error) {
      console.error("❌ Error fetching performance metrics:", error);
      // Fallback to offline cache
      console.log("📴 Falling back to offline cache...");
      return await offlineStorage.getPerformance(teamMemberId);
    }
  } else {
    // Offline - load from IndexedDB
    console.log("📴 Offline mode - loading performance from cache");
    return await offlineStorage.getPerformance(teamMemberId);
  }
}

/**
 * Invalidate performance cache (call after task updates)
 */
export async function invalidatePerformanceCache(teamMemberId) {
  try {
    await fetch(`${API_BASE}/performance/invalidate/${teamMemberId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`♻️ Performance cache invalidated for: ${teamMemberId}`);
  } catch (error) {
    console.error("❌ Error invalidating performance cache:", error);
    // Don't throw - cache invalidation failure shouldn't break the app
  }
}
