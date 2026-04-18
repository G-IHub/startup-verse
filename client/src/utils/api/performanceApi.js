// Performance API wrapper for backend-first team member metrics
import { request } from "../backendClient";
import { offlineStorage } from "../offlineStorage";

function getOnlineState(defaultValue = true) {
  if (typeof navigator === "undefined") return defaultValue;
  return navigator.onLine;
}

function normalizePerformance(data) {
  if (!data || typeof data !== "object") return null;
  const completionRaw = Number(data.completionRate || 0);
  const completionPercent = completionRaw <= 1 ? completionRaw * 100 : completionRaw;

  return {
    ...data,
    completionRate: Number.isFinite(completionPercent)
      ? Math.max(0, Math.min(100, Number(completionPercent.toFixed(1))))
      : 0,
    totalTasks: Number(data.totalTasks || 0),
    completedTasks: Number(data.completedTasks || 0),
  };
}

/**
 * Get performance metrics for a team member.
 * Uses canonical envelope endpoint: GET /team-members/:teamMemberId/performance
 */
export async function getPerformanceMetrics(
  teamMemberId,
  isOnline = getOnlineState(true),
) {
  if (isOnline) {
    try {
      const payload = await request(`/team-members/${teamMemberId}/performance`, {
        method: "GET",
      });

      const metrics = normalizePerformance(payload.data);

      if (metrics) {
        await offlineStorage.savePerformance(teamMemberId, metrics);
      }

      return metrics;
    } catch (error) {
      console.error("Failed to fetch performance metrics:", error);
      return await offlineStorage.getPerformance(teamMemberId);
    }
  }

  return await offlineStorage.getPerformance(teamMemberId);
}

/**
 * Legacy compatibility hook. Server-side invalidation endpoint does not exist.
 */
export async function invalidatePerformanceCache() {
  return { success: true, skipped: true };
}
