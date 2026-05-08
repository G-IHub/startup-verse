import { create } from "zustand";
import { apiGet, apiPost } from "../utils/apiClient.js";

/**
 * Learning Store
 *
 * Fetches stage learning resources (videos) from the backend and tracks
 * which ones a founder has watched.
 *
 * Endpoints:
 *   GET  /founders/:id/learning-resources?stageId=:stageId
 *   GET  /founders/:id/learning-progress
 *   POST /founders/:id/learning-progress  { resourceId, watchDurationSeconds?, completed? }
 */

const initialState = {
  founderId: null,
  resources: [],
  watchedIds: new Set(),
  loadingResources: false,
  loadingProgress: false,
  error: null,
  lastLoadedAt: null,
};

export const useLearningStore = create((set, get) => ({
  ...initialState,

  async loadResources(founderId, stageId) {
    const id = founderId || get().founderId;
    if (!id) return [];
    set({ loadingResources: true, error: null, founderId: id });
    try {
      const params = stageId != null ? `?stageId=${stageId}` : "";
      const data = await apiGet(`/founders/${id}/learning-resources${params}`);
      const resources = Array.isArray(data?.resources) ? data.resources : [];
      set({ resources, loadingResources: false, lastLoadedAt: new Date().toISOString() });
      return resources;
    } catch (error) {
      set({ loadingResources: false, error });
      return [];
    }
  },

  async loadProgress(founderId) {
    const id = founderId || get().founderId;
    if (!id) return;
    set({ loadingProgress: true, founderId: id });
    try {
      const data = await apiGet(`/founders/${id}/learning-progress`);
      const progress = Array.isArray(data?.progress) ? data.progress : [];
      const watchedIds = new Set(
        progress.map((p) => String(p.resourceId?._id || p.resourceId || "")),
      );
      set({ watchedIds, loadingProgress: false });
    } catch (error) {
      set({ loadingProgress: false });
    }
  },

  isWatched(resourceId) {
    return get().watchedIds.has(String(resourceId));
  },

  async trackWatch(founderId, resourceId, opts = {}) {
    const id = founderId || get().founderId;
    if (!id || !resourceId) return;

    set((state) => ({ watchedIds: new Set([...state.watchedIds, String(resourceId)]) }));

    try {
      await apiPost(`/founders/${id}/learning-progress`, {
        resourceId,
        watchDurationSeconds: opts.watchDurationSeconds ?? 0,
        completed: opts.completed ?? false,
      });
    } catch (err) {
      console.warn("Learning watch track failed:", err?.message || err);
    }
  },

  reset() {
    set({ ...initialState, watchedIds: new Set() });
  },
}));
