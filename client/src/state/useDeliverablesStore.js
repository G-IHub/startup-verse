import { create } from "zustand";
import { apiGet, apiPost } from "../utils/apiClient.js";

/**
 * Deliverables store.
 *
 * Wraps the cohort deliverables surface a founder sees: list-by-founder and
 * submission. Safe when `founderId` is missing (no requests fired).
 */

function normalizeDeliverablesPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.deliverables)) return payload.deliverables;
    if (Array.isArray(payload.items)) return payload.items;
  }
  return [];
}

const initialState = {
  founderId: null,
  deliverables: [],
  loading: false,
  submitting: null,
  error: null,
  lastLoadedAt: null,
};

export const useDeliverablesStore = create((set, get) => ({
  ...initialState,

  async load(founderId) {
    const id = founderId || get().founderId;
    if (!id) return [];

    set({ loading: true, error: null, founderId: id });

    try {
      const data = await apiGet(`/deliverables/founder/${id}`);
      const deliverables = normalizeDeliverablesPayload(data);
      set({
        deliverables,
        loading: false,
        error: null,
        lastLoadedAt: new Date().toISOString(),
      });
      return deliverables;
    } catch (error) {
      set({ loading: false, error });
      return [];
    }
  },

  async refresh() {
    return get().load(get().founderId);
  },

  async submit(deliverableId, submission) {
    if (!deliverableId) return null;
    set({ submitting: deliverableId });
    try {
      await apiPost(`/deliverables/${deliverableId}/submit`, submission || {});
      await get().refresh();
      return { ok: true };
    } catch (error) {
      set({ error });
      return { ok: false, error };
    } finally {
      set({ submitting: null });
    }
  },

  reset() {
    set({ ...initialState });
  },
}));

export const selectDeliverables = (state) => state.deliverables;
export const selectDeliverableStats = (state) => {
  const list = state.deliverables || [];
  const submitted = list.filter((item) => item && item.mySubmission).length;
  return { submitted, total: list.length };
};
