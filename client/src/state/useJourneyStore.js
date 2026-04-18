import { create } from "zustand";
import { apiGet, apiPost } from "../utils/apiClient.js";
import {
  configureJourneyUser,
  applyServerJourneySnapshot,
  getJourneyProgress,
  completeCurrentStage,
  updateStageProgress,
  autoDetectStageProgression,
  getOverallProgress,
  getTimeInCurrentStage,
  JOURNEY_STAGES,
} from "../utils/journeyProgress.js";

/**
 * Journey store.
 *
 * Clean UI-facing wrapper over `utils/journeyProgress` so Home components
 * never touch localStorage directly. Exposes stage-learning modal state used
 * by the "Learn About This Stage" CTA.
 */

const initialState = {
  userId: null,
  progress: null,
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
        const progress = getJourneyProgress();
        const startup = await apiGet(`/founders/${userId}/startup`);
        if (!startup?.name) return;
        await apiPost("/founders/startup", {
          founderId: userId,
          name: startup.name,
          description: startup.description ?? "",
          industry: startup.industry ?? "",
          stage: startup.stage ?? "",
          website: startup.website ?? "",
          logo: startup.logo ?? "",
          data: { ...(startup.data || {}), journey: progress },
        });
      } catch (e) {
        console.warn("Journey server sync skipped:", e?.message || e);
      }
    }, 450),
  );
}

export const useJourneyStore = create((set, get) => ({
  ...initialState,

  hydrate(userId) {
    configureJourneyUser(userId);
    const snapshot = deriveProgress();
    set({ ...snapshot, userId: userId || null });
    if (userId) {
      try {
        autoDetectStageProgression(userId);
        set(deriveProgress());
      } catch {
        // non-fatal; we still have the hydrated progress
      }
    }
    return get().progress;
  },

  /**
   * Merge journey from GET /founders/:id/startup (Startup.data.journey).
   */
  mergeFromStartup(startup, userId) {
    const journey = startup?.data?.journey;
    if (!journey || typeof journey !== "object" || !journey.currentStage) return;
    const uid = userId || get().userId;
    if (!uid) return;
    configureJourneyUser(uid);
    applyServerJourneySnapshot(journey);
    set({ userId: uid, ...deriveProgress() });
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

  completeStage() {
    completeCurrentStage();
    set(deriveProgress());
    scheduleJourneyPersist(get().userId);
    return get().progress;
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
    if (uid && persistTimers.has(uid)) {
      clearTimeout(persistTimers.get(uid));
      persistTimers.delete(uid);
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
