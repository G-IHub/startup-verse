import { create } from "zustand";
import { apiGet } from "../utils/apiClient.js";

/**
 * Memberships store.
 *
 * Canonical endpoint: `GET /cohorts/founder/:founderId` (replaces the
 * nonexistent `/memberships/founder/:id`). Returns the founder's cohort
 * memberships so the Home UI can render the membership badge and pass
 * cohort ids to other stores (e.g. the team store).
 */

function normalizeMembershipsPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.memberships)) return payload.memberships;
    if (Array.isArray(payload.cohorts)) return payload.cohorts;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.cohortIds)) {
      return payload.cohortIds.map((cohortId) => ({ cohortId }));
    }
  }
  return [];
}

function readCohortId(row) {
  if (!row) return "";
  return String(row.cohortId || row.id || row._id || "");
}

const initialState = {
  founderId: null,
  memberships: [],
  loading: false,
  error: null,
  lastLoadedAt: null,
};

export const useMembershipsStore = create((set, get) => ({
  ...initialState,

  async load(founderId) {
    const id = founderId || get().founderId;
    if (!id) return [];

    set({ loading: true, error: null, founderId: id });

    try {
      const data = await apiGet(`/cohorts/founder/${id}`);
      const memberships = normalizeMembershipsPayload(data);
      set({
        memberships,
        loading: false,
        error: null,
        lastLoadedAt: new Date().toISOString(),
      });
      return memberships;
    } catch (error) {
      set({ loading: false, error, memberships: [] });
      return [];
    }
  },

  async refresh() {
    return get().load(get().founderId);
  },

  reset() {
    set({ ...initialState });
  },
}));

export const selectMemberships = (state) => state.memberships;
export const selectCohortIds = (state) =>
  state.memberships.map(readCohortId).filter(Boolean);
export const selectPrimaryCohortId = (state) => {
  const ids = selectCohortIds(state);
  return ids[0] || null;
};
