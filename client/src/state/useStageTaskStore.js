import { create } from "zustand";
import { apiGet, apiPut } from "../utils/apiClient.js";

/**
 * Stage Task Store
 *
 * Persists stage-task form responses and completion state to the backend
 * (PUT /founders/:id/stage-tasks). Debounces saves to avoid hammering
 * the server on every keystroke.
 *
 * Shape of `responses`:
 *   { [stageId]: { [taskId]: { text, completedAt, updatedAt } } }
 */

const DEBOUNCE_MS = 800;
const pendingTimers = new Map();

function scheduleDebounced(key, fn) {
  if (pendingTimers.has(key)) clearTimeout(pendingTimers.get(key));
  pendingTimers.set(key, setTimeout(() => { pendingTimers.delete(key); fn(); }, DEBOUNCE_MS));
}

const initialState = {
  founderId: null,
  responses: {},
  loading: false,
  saving: false,
  error: null,
  lastLoadedAt: null,
};

export const useStageTaskStore = create((set, get) => ({
  ...initialState,

  async load(founderId) {
    const id = founderId || get().founderId;
    if (!id) return;
    set({ loading: true, error: null, founderId: id });
    try {
      const data = await apiGet(`/founders/${id}/stage-tasks`);
      const responses =
        data?.stageTaskResponses && typeof data.stageTaskResponses === "object"
          ? data.stageTaskResponses
          : {};
      set({ responses, loading: false, lastLoadedAt: new Date().toISOString() });
    } catch (error) {
      set({ loading: false, error });
    }
  },

  getResponse(stageId, taskId) {
    const stageKey = String(stageId);
    const stage = get().responses[stageKey];
    return stage?.[taskId] ?? null;
  },

  isCompleted(stageId, taskId) {
    return Boolean(get().getResponse(stageId, taskId)?.completedAt);
  },

  getCompletedTaskIds(stageId) {
    const stageKey = String(stageId);
    const stage = get().responses[stageKey] || {};
    return Object.keys(stage).filter((tid) => Boolean(stage[tid]?.completedAt));
  },

  saveResponse(founderId, stageId, taskId, text) {
    const id = founderId || get().founderId;
    if (!id || !stageId || !taskId) return;

    const stageKey = String(stageId);
    const prev = get().responses;
    const prevStage = prev[stageKey] || {};
    set({
      responses: {
        ...prev,
        [stageKey]: {
          ...prevStage,
          [taskId]: { ...(prevStage[taskId] || {}), text, updatedAt: new Date().toISOString() },
        },
      },
    });

    scheduleDebounced(`${id}_${stageKey}_${taskId}`, async () => {
      set({ saving: true });
      try {
        await apiPut(`/founders/${id}/stage-tasks`, { stageId: stageKey, taskId, text });
      } catch (err) {
        console.warn("Stage task save failed:", err?.message || err);
      } finally {
        set({ saving: false });
      }
    });
  },

  async markComplete(founderId, stageId, taskId, text) {
    const id = founderId || get().founderId;
    if (!id || !stageId || !taskId) return;

    const stageKey = String(stageId);
    const completedAt = new Date().toISOString();
    const prev = get().responses;
    const prevStage = prev[stageKey] || {};
    set({
      responses: {
        ...prev,
        [stageKey]: {
          ...prevStage,
          [taskId]: { ...(prevStage[taskId] || {}), text: text || prevStage[taskId]?.text || "", completedAt, updatedAt: completedAt },
        },
      },
    });

    set({ saving: true });
    try {
      const textToSave = text || get().responses[stageKey]?.[taskId]?.text || "";
      await apiPut(`/founders/${id}/stage-tasks`, { stageId: stageKey, taskId, text: textToSave, completedAt });
    } catch (err) {
      console.warn("Stage task complete save failed:", err?.message || err);
    } finally {
      set({ saving: false });
    }
  },

  reset() {
    pendingTimers.forEach((t) => clearTimeout(t));
    pendingTimers.clear();
    set({ ...initialState });
  },
}));
