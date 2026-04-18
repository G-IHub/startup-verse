import { create } from "zustand";
import { apiGet } from "../utils/apiClient.js";

/**
 * Execution score store.
 *
 * Unifies data powering the inline ExecutionScoreInlineCard (and any future
 * score-aware UI). Values come from `GET /execution-score/:userId` and are
 * also mirrored by the weekly loop store; this store provides a focused
 * selector surface and its own refresh for places that don't need the full
 * weekly loop view model.
 */

function normalizeScore(raw) {
  if (!raw || typeof raw !== "object") return null;
  const score = Number(
    raw.score ??
      raw.executionScore ??
      raw.overallScore ??
      0,
  );
  const weeklyChange = Number(
    raw.weeklyChange ?? raw.deltaFromLastWeek ?? 0,
  );
  const percentile = Number(
    raw.percentile ?? raw.percentileRank ?? 0,
  );
  const weeklyCompletion = Number(
    raw.breakdown?.weeklyCompletion ??
      raw.taskCompletionScore ??
      0,
  );
  const outcomeQuality = Number(
    raw.breakdown?.outcomeQuality ?? raw.outcomeHistoryScore ?? 0,
  );
  const consistency = Number(
    raw.breakdown?.consistency ?? raw.streakBonusScore ?? 0,
  );
  const progression = Number(
    raw.breakdown?.progression ?? raw.progressionScore ?? 0,
  );
  const currentStreak = Number(
    raw.currentStreak ?? raw.streak ?? raw.streakCount ?? 0,
  );

  return {
    ...raw,
    score: Number.isFinite(score) ? Math.round(score) : 0,
    weeklyChange: Number.isFinite(weeklyChange) ? weeklyChange : 0,
    percentile: Number.isFinite(percentile) ? percentile : 0,
    currentStreak,
    streak: currentStreak,
    breakdown: {
      weeklyCompletion: Number.isFinite(weeklyCompletion)
        ? Math.round(weeklyCompletion)
        : 0,
      outcomeQuality: Number.isFinite(outcomeQuality)
        ? Math.round(outcomeQuality)
        : 0,
      consistency: Number.isFinite(consistency)
        ? Math.round(consistency)
        : 0,
      progression: Number.isFinite(progression)
        ? Math.round(progression)
        : 0,
    },
  };
}

const initialState = {
  userId: null,
  score: null,
  loading: false,
  error: null,
  lastLoadedAt: null,
};

export const useExecutionScoreStore = create((set, get) => ({
  ...initialState,

  hydrateFromExecutionScore(userId, score) {
    set({
      userId: userId || get().userId,
      score: normalizeScore(score),
      loading: false,
      error: null,
      lastLoadedAt: new Date().toISOString(),
    });
  },

  async load(userId) {
    const id = userId || get().userId;
    if (!id) return null;

    set({ loading: true, error: null, userId: id });
    try {
      const data = await apiGet(`/execution-score/${id}`);
      const normalized = normalizeScore(data);
      set({
        score: normalized,
        loading: false,
        error: null,
        lastLoadedAt: new Date().toISOString(),
      });
      return normalized;
    } catch (error) {
      set({ loading: false, error });
      return null;
    }
  },

  async refresh() {
    return get().load(get().userId);
  },

  reset() {
    set({ ...initialState });
  },
}));

export const selectScore = (state) => state.score;
export const selectScoreValue = (state) =>
  Number(state.score?.score) || 0;
export const selectScoreWeeklyChange = (state) =>
  Number(state.score?.weeklyChange) || 0;
