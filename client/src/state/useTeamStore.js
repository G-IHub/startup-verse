import { create } from "zustand";
import { apiGet } from "../utils/apiClient.js";
import { getStartupTeamMembers } from "../utils/api/teamMemberApi.js";

/**
 * Team store.
 *
 * Preferred source: union of cohort members across the founder's cohorts
 * (`GET /cohorts/:cohortId/members`). Fallback: `presence/:startupId` or
 * `/startups/:startupId/team-members` via the shared teamMemberApi helper.
 *
 * Deliberately does NOT call `/founders/:id/team-members` (non-existent).
 */

function uniqueBy(items, key) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const k = String(item?.[key] ?? "");
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

function mapMember(raw, fallbackStartupId) {
  if (!raw || typeof raw !== "object") return null;
  const id = String(raw.id || raw._id || raw.userId || "");
  if (!id) return null;

  return {
    id,
    userId: id,
    name: raw.name || raw.talentName || raw.userName || "Team member",
    role: raw.role || raw.talentArea || "team-member",
    email: raw.email || "",
    avatar:
      raw.avatarUrl ||
      raw.avatar ||
      raw.profileImage ||
      raw.profilePicture ||
      raw.photoURL ||
      raw.image ||
      null,
    title: raw.title || raw.talentArea || raw.professionalTitle || "",
    skills: Array.isArray(raw.skills)
      ? raw.skills
      : Array.isArray(raw.talentSkills)
        ? raw.talentSkills
        : [],
    startupId: String(raw.startupId || fallbackStartupId || ""),
    founderId: String(raw.founderId || ""),
    isOnline: Boolean(raw.isOnline),
    status: raw.status || (raw.isOnline ? "online" : "offline"),
    lastSeenAt: raw.lastSeenAt || raw.updatedAt || null,
  };
}

const initialState = {
  startupId: null,
  cohortIds: [],
  members: [],
  loading: false,
  error: null,
  lastLoadedAt: null,
};

export const useTeamStore = create((set, get) => ({
  ...initialState,

  /**
   * Load cohort members for all provided cohort ids, falling back to the
   * canonical presence/team-members source when no cohort ids are available.
   */
  async load({ founderId, startupId, cohortIds = [] } = {}) {
    if (!founderId && !startupId) return [];

    set({ loading: true, error: null, startupId: startupId || null, cohortIds });

    try {
      let members = [];

      if (Array.isArray(cohortIds) && cohortIds.length > 0) {
        const results = await Promise.allSettled(
          cohortIds.map((cohortId) =>
            apiGet(`/cohorts/${cohortId}/members`).then((data) => {
              if (Array.isArray(data)) return data;
              if (data && Array.isArray(data.members)) return data.members;
              if (data && Array.isArray(data.items)) return data.items;
              return [];
            }),
          ),
        );
        members = results
          .filter((r) => r.status === "fulfilled")
          .flatMap((r) => r.value);
      }

      if (members.length === 0 && (startupId || founderId)) {
        try {
          const fallback = await getStartupTeamMembers(startupId || founderId);
          members = Array.isArray(fallback) ? fallback : [];
        } catch {
          members = [];
        }
      }

      const mapped = members
        .map((row) => mapMember(row, startupId || founderId))
        .filter(Boolean);
      const deduped = uniqueBy(mapped, "id").filter(
        (member) => member.id !== String(founderId || ""),
      );

      set({
        members: deduped,
        loading: false,
        error: null,
        lastLoadedAt: new Date().toISOString(),
      });

      return deduped;
    } catch (error) {
      set({ loading: false, error });
      return [];
    }
  },

  async refresh() {
    const { startupId, cohortIds } = get();
    return get().load({ startupId, cohortIds });
  },

  reset() {
    set({ ...initialState });
  },
}));

export const selectTeamMembers = (state) => state.members;
export const selectOnlineTeamCount = (state) =>
  state.members.filter((m) => m.isOnline).length;
