import { create } from "zustand";
import { apiGet, apiPut, apiPost } from "../utils/apiClient.js";
import {
  configureJourneyUser,
  applyServerJourneySnapshot,
  getJourneyProgress,
  completeCurrentStage,
  updateStageProgress,
  getOverallProgress,
  getTimeInCurrentStage,
  JOURNEY_STAGES,
  createDefaultJourneyProgress,
} from "../utils/journeyProgress.js";

/**
 * Journey store: in-memory + GET/PUT /founders/:id/journey (no localStorage).
 */

const initialState = {
  userId: null,
  progress: null,
  homeUi: {},
  overallProgress: 0,
  timeInStage: "",
  learningStageId: null,
  isLearningOpen: false,
};

const persistTimers = new Map();

function deriveProgress() {
  const progress = getJourneyProgress();
  return {
    progress,
    overallProgress: getOverallProgress(),
    timeInStage: getTimeInCurrentStage(),
  };
}

function scheduleJourneyPersist(userId) {
  if (!userId) return;
  const prev = persistTimers.get(userId);
  if (prev) clearTimeout(prev);
  persistTimers.set(
    userId,
    setTimeout(async () => {
      persistTimers.delete(userId);
      try {
        configureJourneyUser(userId);
        const journey = getJourneyProgress();
        await apiPut(`/founders/${userId}/journey`, { journey });
      } catch (e) {
        console.warn("Journey server sync skipped:", e?.message || e);
      }
    }, 450),
  );
}

export const useJourneyStore = create((set, get) => ({
  ...initialState,

  async hydrate(userId) {
    configureJourneyUser(userId);
    if (!userId) {
      set({ ...initialState });
      return null;
    }
    try {
      const data = await apiGet(`/founders/${userId}/journey`);
      if (data?.journey && typeof data.journey === "object") {
        applyServerJourneySnapshot(data.journey);
      } else {
        applyServerJourneySnapshot(createDefaultJourneyProgress());
      }
      const homeUi = data?.homeUi && typeof data.homeUi === "object" ? data.homeUi : {};
      set({
        userId,
        homeUi,
        ...deriveProgress(),
      });
    } catch {
      applyServerJourneySnapshot(createDefaultJourneyProgress());
      set({
        userId,
        homeUi: {},
        ...deriveProgress(),
      });
    }
    return get().progress;
  },

  /**
   * Merge journey from startup payload (secondary to GET /journey).
   */
  mergeFromStartup(startup, userId) {
    const journey = startup?.data?.journey;
    if (!journey || typeof journey !== "object" || !journey.currentStage) return;
    const uid = userId || get().userId;
    if (!uid) return;
    configureJourneyUser(uid);
    applyServerJourneySnapshot(journey);
    const homeUi =
      startup?.data?.homeUi && typeof startup.data.homeUi === "object"
        ? { ...startup.data.homeUi }
        : get().homeUi;
    set({ userId: uid, homeUi, ...deriveProgress() });
  },

  mergeHomeUiFromServer(homeUi) {
    if (!homeUi || typeof homeUi !== "object") return;
    set({ homeUi: { ...get().homeUi, ...homeUi } });
  },

  refresh() {
    set(deriveProgress());
    return get().progress;
  },

  setStageCompletion(stageId, percentage) {
    updateStageProgress(stageId, percentage);
    set(deriveProgress());
    scheduleJourneyPersist(get().userId);
    return get().progress;
  },

  completeStage(payload = {}) {
    const prevProgress = get().progress;
    const stageId = prevProgress?.currentStage || 1;
    const stageInfo = JOURNEY_STAGES.find((s) => s.id === stageId);

    completeCurrentStage();
    set(deriveProgress());
    scheduleJourneyPersist(get().userId);

    const userId = get().userId;
    if (userId) {
      apiPost(`/founders/${userId}/stage-completions`, {
        stageId,
        stageName: stageInfo?.name || "",
        method: payload.method || "completed",
        tasksCompletedCount: payload.tasksCompletedCount ?? 0,
        tasksTotal: payload.tasksTotal ?? 0,
        durationDays: payload.durationDays ?? 0,
        completedAt: new Date().toISOString(),
        metadata: payload.metadata || {},
      }).catch((err) => {
        console.warn("Stage completion event failed:", err?.message || err);
      });
    }

    return get().progress;
  },

  scheduleHomeUiPersist(patch) {
    const userId = get().userId;
    if (!userId || !patch || typeof patch !== "object") return;
    const merged = { ...get().homeUi, ...patch };
    set({ homeUi: merged });
    const prev = persistTimers.get(`${userId}_homeUi`);
    if (prev) clearTimeout(prev);
    persistTimers.set(
      `${userId}_homeUi`,
      setTimeout(async () => {
        persistTimers.delete(`${userId}_homeUi`);
        try {
          await apiPut(`/founders/${userId}/journey`, { homeUi: get().homeUi });
        } catch (e) {
          console.warn("homeUi sync skipped:", e?.message || e);
        }
      }, 400),
    );
  },

  openStageLearning(stageId) {
    const current = get().progress?.currentStage || 1;
    set({ learningStageId: stageId || current, isLearningOpen: true });
  },

  closeStageLearning() {
    set({ isLearningOpen: false });
  },

  reset() {
    const uid = get().userId;
    if (uid) {
      if (persistTimers.has(uid)) {
        clearTimeout(persistTimers.get(uid));
        persistTimers.delete(uid);
      }
      const hk = `${uid}_homeUi`;
      if (persistTimers.has(hk)) {
        clearTimeout(persistTimers.get(hk));
        persistTimers.delete(hk);
      }
    }
    configureJourneyUser(null);
    set({ ...initialState });
  },
}));

export const selectCurrentStageId = (state) => state.progress?.currentStage || 1;
export const selectCurrentStage = (state) => {
  const id = selectCurrentStageId(state);
  return JOURNEY_STAGES.find((s) => s.id === id) || JOURNEY_STAGES[0];
};
export const selectJourneyStages = () => JOURNEY_STAGES;
