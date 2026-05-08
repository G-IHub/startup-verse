import { create } from "zustand";
import { apiGet } from "../utils/apiClient.js";
import { useWeeklyLoopStore } from "./useWeeklyLoopStore.js";
import { useExecutionScoreStore } from "./useExecutionScoreStore.js";
import { useTeamStore } from "./useTeamStore.js";
import { useDeliverablesStore } from "./useDeliverablesStore.js";
import { useMembershipsStore } from "./useMembershipsStore.js";
import { useJourneyStore } from "./useJourneyStore.js";
import { useNotificationsStore } from "./useNotificationsStore.js";

/**
 * Home orchestrator store.
 *
 * - Owns a single `loading` and `error` for the initial Home hydration.
 * - `loadAll({ userId, startupId })` fans out to each per-domain store.
 * - Skips work entirely without `userId` (eliminates `/founders/undefined/...`).
 * - Exposes `refresh()` for a manual re-hydration from the UI.
 */

const initialState = {
  userId: null,
  startupId: null,
  loading: false,
  refreshing: false,
  error: null,
  lastUpdatedAt: null,
  bootstrapped: false,
};

export const useHomeStore = create((set, get) => ({
  ...initialState,

  async loadAll({ userId, startupId } = {}) {
    if (!userId) return;

    const hadPrevious = get().bootstrapped;
    if (hadPrevious) {
      set({ refreshing: true, userId, startupId: startupId || userId });
    } else {
      set({ loading: true, error: null, userId, startupId: startupId || userId });
    }

    useJourneyStore.getState().hydrate(userId);

    try {
      const memberships = await useMembershipsStore.getState().load(userId);
      const cohortIds = Array.isArray(memberships)
        ? memberships
            .map((row) => String(row?.cohortId || row?.id || row?._id || ""))
            .filter(Boolean)
        : [];

      await Promise.allSettled([
        useWeeklyLoopStore.getState().load(userId),
        useExecutionScoreStore.getState().load(userId),
        useTeamStore.getState().load({
          founderId: userId,
          startupId: startupId || userId,
          cohortIds,
        }),
        useDeliverablesStore.getState().load(userId),
        useNotificationsStore.getState().load(userId),
      ]);

      try {
        const startup = await apiGet(`/founders/${userId}/startup`);
        if (startup?.data?.journey) {
          useJourneyStore.getState().mergeFromStartup(startup, userId);
        }
      } catch {
        // startup may not exist yet; journey stays local-only
      }

      const weeklyScore = useWeeklyLoopStore.getState().executionScore;
      if (weeklyScore) {
        useExecutionScoreStore.getState().hydrateFromExecutionScore(
          userId,
          weeklyScore,
        );
      }

      set({
        loading: false,
        refreshing: false,
        error: null,
        lastUpdatedAt: new Date().toISOString(),
        bootstrapped: true,
      });
    } catch (error) {
      set({ loading: false, refreshing: false, error });
    }
  },

  async refresh() {
    const { userId, startupId } = get();
    if (!userId) return;
    return get().loadAll({ userId, startupId });
  },

  reset() {
    set({ ...initialState });
  },
}));

export const selectHomeLoading = (state) => state.loading;
export const selectHomeRefreshing = (state) => state.refreshing;
export const selectHomeError = (state) => state.error;
export const selectHomeLastUpdatedAt = (state) => state.lastUpdatedAt;
