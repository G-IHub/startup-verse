import { create } from "zustand";
import { apiGet, apiPost, apiPut, apiDelete } from "../utils/apiClient.js";
import { mapFounderWeeklyLoop } from "../domains/founder/mappers/founderWeeklyLoopMapper.js";

/**
 * Weekly execution loop store.
 *
 * Responsibilities:
 * - Fetch outcomes, milestones, tasks, and execution score for a founder in parallel.
 * - Derive a view model via `mapFounderWeeklyLoop` (streak, score, milestone progress, task mix).
 * - Mutations for weekly outcome, tasks, weekly review, task status, assignment, and incentive.
 *
 * All loaders are id-guarded: without a valid `founderId` no request is sent.
 */

function asList(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeListPayload(payload, key) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload[key])) return payload[key];
    if (Array.isArray(payload.items)) return payload.items;
  }
  return [];
}

const initialState = {
  founderId: null,
  outcomes: [],
  milestones: [],
  tasks: [],
  executionScore: null,
  viewModel: null,
  loading: false,
  refreshing: false,
  error: null,
  lastLoadedAt: null,
};

export const useWeeklyLoopStore = create((set, get) => ({
  ...initialState,

  setFounderId(founderId) {
    set({ founderId: founderId || null });
  },

  /**
   * Load outcomes, milestones, tasks, and execution score in parallel.
   * Skips when no founderId is provided. When `options.silent === true`
   * only `refreshing` is toggled (used for background refreshes).
   */
  async load(founderId, options = {}) {
    const id = founderId || get().founderId;
    if (!id) return null;

    const silent = options.silent === true;
    if (silent) {
      set({ refreshing: true });
    } else {
      set({ loading: true, error: null });
    }

    try {
      const [outcomes, milestones, tasks, executionScore] = await Promise.all([
        apiGet(`/founders/${id}/weekly-outcomes`)
          .then((data) => normalizeListPayload(data, "outcomes"))
          .catch(() => []),
        apiGet(`/founders/${id}/milestones`)
          .then((data) => normalizeListPayload(data, "milestones"))
          .catch(() => []),
        apiGet(`/founders/${id}/tasks`)
          .then((data) => normalizeListPayload(data, "tasks"))
          .catch(() => []),
        apiGet(`/execution-score/${id}`).catch(() => null),
      ]);

      const viewModel = mapFounderWeeklyLoop({
        outcomes,
        milestones,
        tasks,
        executionScore,
      });

      set({
        founderId: id,
        outcomes,
        milestones,
        tasks,
        executionScore,
        viewModel,
        loading: false,
        refreshing: false,
        error: null,
        lastLoadedAt: new Date().toISOString(),
      });

      return viewModel;
    } catch (error) {
      set({ loading: false, refreshing: false, error });
      throw error;
    }
  },

  async refresh() {
    return get().load(get().founderId, { silent: true });
  },

  async saveWeeklyOutcome(outcome) {
    const id = get().founderId;
    if (!id || !outcome) return null;
    await apiPost(`/founders/${id}/weekly-outcomes`, { outcome });
    return get().refresh();
  },

  /**
   * Atomically create weekly outcome + milestones + tasks (server orchestration).
   */
  async saveWeeklyPlan(plan) {
    const id = get().founderId;
    if (!id || !plan) return null;
    await apiPost(`/founders/${id}/weekly-plan`, { plan });
    return get().refresh();
  },

  async saveMilestone(milestone) {
    const id = get().founderId;
    if (!id || !milestone) return null;
    await apiPost(`/founders/${id}/milestones`, { milestone });
    return get().refresh();
  },

  async saveTask(task) {
    const id = get().founderId;
    if (!id || !task) return null;
    await apiPost(`/founders/${id}/tasks`, { task });
    return get().refresh();
  },

  async saveTasks(tasks = []) {
    const id = get().founderId;
    if (!id || !tasks.length) return null;
    await Promise.all(
      tasks.map((task) => apiPost(`/founders/${id}/tasks`, { task })),
    );
    return get().refresh();
  },

  async updateTaskStatus(taskId, status, extra = {}) {
    const id = get().founderId;
    if (!id || !taskId) return null;
    await apiPut(`/founders/${id}/tasks/${taskId}/status`, {
      status,
      ...extra,
      updatedAt: new Date().toISOString(),
    });
    return get().refresh();
  },

  async toggleTask(taskId) {
    const id = get().founderId;
    if (!id || !taskId) return null;
    const current = asList(get().tasks).find(
      (task) => String(task.id || task._id) === String(taskId),
    );
    const nextStatus =
      current && (current.status === "completed" || current.completed)
        ? "pending"
        : "completed";
    return get().updateTaskStatus(taskId, nextStatus, {
      completedAt: nextStatus === "completed" ? new Date().toISOString() : null,
    });
  },

  async blockTask(taskId, reason, note) {
    return get().updateTaskStatus(taskId, "blocked", {
      blockedReason: reason,
      blockerReason: reason,
      blockedNote: note,
      blockerNote: note,
      blockedAt: new Date().toISOString(),
    });
  },

  async unblockTask(taskId) {
    return get().updateTaskStatus(taskId, "pending", {
      blockedReason: null,
      blockerReason: null,
      blockedNote: null,
      blockerNote: null,
      unblockedAt: new Date().toISOString(),
    });
  },

  async assignTask(taskId, assigneeId, assigneeName) {
    const id = get().founderId;
    if (!id || !taskId) return null;
    await apiPut(`/founders/${id}/tasks/${taskId}/assign`, {
      assigneeId,
      assigneeName,
      assignedTo: assigneeId,
      assignedToName: assigneeName,
    });
    return get().refresh();
  },

  async setTaskIncentive(taskId, incentive) {
    const id = get().founderId;
    if (!id || !taskId) return null;
    const current = asList(get().tasks).find(
      (task) => String(task.id || task._id) === String(taskId),
    );
    if (!current) return null;
    const updated = {
      ...current,
      incentive,
      incentiveSetAt: new Date().toISOString(),
    };
    await apiPost(`/founders/${id}/tasks`, { task: updated });
    return get().refresh();
  },

  async deleteTask(taskId) {
    const id = get().founderId;
    if (!id || !taskId) return null;
    await apiDelete(`/founders/${id}/tasks/${taskId}`);
    return get().refresh();
  },

  /**
   * Complete the weekly review, marking the current outcome as completed/partial/missed.
   * `completionData = { achievement, milestonesCompleted, milestonesTotal, reflection?, ... }`.
   */
  async completeWeeklyReview(outcomeId, completionData = {}) {
    const id = get().founderId;
    if (!id || !outcomeId) return null;

    const outcome = asList(get().outcomes).find(
      (row) => String(row.id || row._id) === String(outcomeId),
    );
    if (!outcome) return null;

    const status =
      completionData.achievement === "completed"
        ? "completed"
        : completionData.achievement === "partial"
          ? "partial"
          : "missed";

    const milestonesTotal = Number(completionData.milestonesTotal || 0);
    const milestonesCompleted = Number(completionData.milestonesCompleted || 0);
    const completionPercentage =
      milestonesTotal > 0
        ? Math.round((milestonesCompleted / milestonesTotal) * 100)
        : outcome.completionPercentage || 0;

    const goalText = String(outcome.goal || outcome.title || "").trim();
    if (!goalText) {
      throw new Error("Weekly outcome is missing goal text.");
    }

    const completedOutcome = {
      ...outcome,
      goal: goalText,
      summary: String(outcome.summary || outcome.notes || "").trim(),
      status,
      completedAt: new Date().toISOString(),
      completionPercentage,
      completionData: {
        ...completionData,
        completedAt: new Date().toISOString(),
      },
    };

    await apiPost(`/founders/${id}/weekly-outcomes`, {
      outcome: completedOutcome,
    });
    return get().refresh();
  },

  reset() {
    set({ ...initialState });
  },
}));

export const selectWeeklyLoopViewModel = (state) => state.viewModel;
export const selectActiveOutcome = (state) => state.viewModel?.activeOutcome ?? null;
export const selectWeeklyMetrics = (state) => state.viewModel?.metrics ?? null;
export const selectTasks = (state) => state.tasks;
export const selectMilestones = (state) => state.milestones;
