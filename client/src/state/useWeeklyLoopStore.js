import { create } from "zustand";
import { apiGet, apiPost, apiPut, apiDelete } from "../utils/apiClient.js";
import { mapFounderWeeklyLoop } from "../domains/founder/mappers/founderWeeklyLoopMapper.js";
import { validateWeeklyPlanMilestones } from "../domains/founder/mappers/weeklyPlanPayload.js";

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

/** Avoid stale GET responses after POST (browser / proxy caches). */
function noStoreGetConfig(bustCache) {
  if (!bustCache) return {};
  return {
    params: { _: Date.now() },
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
  };
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
   * When `options.bustCache === true`, add no-store headers + cache-bust query
   * so the UI updates immediately after mutations (e.g. weekly plan create).
   */
  async load(founderId, options = {}) {
    const id = founderId || get().founderId;
    if (!id) return null;

    const silent = options.silent === true;
    const bustCache = options.bustCache === true;
    if (silent) {
      set({ refreshing: true });
    } else {
      set({ loading: true, error: null });
    }

    try {
      const getCfg = noStoreGetConfig(bustCache);
      const [outcomes, milestones, tasks, executionScore] = await Promise.all([
        apiGet(`/founders/${id}/weekly-outcomes`, getCfg)
          .then((data) => normalizeListPayload(data, "outcomes"))
          .catch(() => []),
        apiGet(`/founders/${id}/milestones`, getCfg)
          .then((data) => normalizeListPayload(data, "milestones"))
          .catch(() => []),
        apiGet(`/founders/${id}/tasks`, getCfg)
          .then((data) => normalizeListPayload(data, "tasks"))
          .catch(() => []),
        apiGet(`/execution-score/${id}`, getCfg).catch(() => null),
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

  async refresh(founderIdOverride) {
    const id = founderIdOverride || get().founderId;
    if (!id) return null;
    return get().load(id, { silent: true, bustCache: true });
  },

  async saveWeeklyOutcome(outcome) {
    const id = get().founderId;
    if (!id || !outcome) return null;
    await apiPost(`/founders/${id}/weekly-outcomes`, { outcome });
    return get().refresh();
  },

  /**
   * Atomically create weekly outcome + milestones + tasks (server orchestration).
   * @param {object} plan
   * @param {string} [founderIdOverride] Logged-in founder id when store has not hydrated yet.
   */
  async saveWeeklyPlan(plan, founderIdOverride) {
    const id = founderIdOverride || get().founderId;
    if (!id || !plan) {
      throw new Error("Missing founder or plan.");
    }
    const milestoneCheck = validateWeeklyPlanMilestones(plan.milestones);
    if (!milestoneCheck.ok) {
      throw new Error(milestoneCheck.message);
    }
    const data = await apiPost(`/founders/${id}/weekly-plan`, { plan });
    set({ founderId: id });

    const outcome = data?.outcome;
    const createdMilestones = asList(data?.milestones);
    if (outcome) {
      const prevOutcomes = asList(get().outcomes);
      const oid = String(outcome._id || outcome.id);
      const nextOutcomes = [
        outcome,
        ...prevOutcomes.filter((o) => String(o._id || o.id) !== oid),
      ];
      let nextMilestones = asList(get().milestones);
      if (createdMilestones.length) {
        const newIds = new Set(
          createdMilestones.map((m) => String(m._id || m.id)),
        );
        nextMilestones = [
          ...createdMilestones,
          ...nextMilestones.filter((m) => !newIds.has(String(m._id || m.id))),
        ];
      }
      const nextTasks = asList(get().tasks);
      const viewModel = mapFounderWeeklyLoop({
        outcomes: nextOutcomes,
        milestones: nextMilestones,
        tasks: nextTasks,
        executionScore: get().executionScore,
      });
      set({
        outcomes: nextOutcomes,
        milestones: nextMilestones,
        viewModel,
        lastLoadedAt: new Date().toISOString(),
      });
    }

    return get().refresh(id);
  },

  async saveMilestone(milestone, options = {}) {
    const id = get().founderId;
    if (!id || !milestone) return null;
    const created = await apiPost(`/founders/${id}/milestones`, { milestone });
    if (!options.skipRefresh) await get().refresh();
    return created;
  },

  async updateMilestone(milestoneId, patch, options = {}) {
    const id = get().founderId;
    if (!id || !milestoneId) return null;
    const updated = await apiPut(`/founders/${id}/milestones/${milestoneId}`, {
      milestone: patch || {},
    });
    if (!options.skipRefresh) await get().refresh();
    return updated;
  },

  async saveTask(task, options = {}) {
    const id = get().founderId;
    if (!id || !task) return null;
    const created = await apiPost(`/founders/${id}/tasks`, { task });
    if (!options.skipRefresh) await get().refresh();
    return created;
  },

  async saveTasks(tasks = [], options = {}) {
    const id = get().founderId;
    if (!id || !tasks.length) return null;
    await Promise.all(
      tasks.map((task) => apiPost(`/founders/${id}/tasks`, { task })),
    );
    if (!options.skipRefresh) return get().refresh();
    return null;
  },

  /** Partial task update (e.g. title/description) without touching status transitions. */
  async updateTaskPatch(taskId, patch, options = {}) {
    const id = get().founderId;
    if (!id || !taskId || !patch || typeof patch !== "object") return null;
    const allowed = {};
    if (patch.title != null) allowed.title = String(patch.title).trim().slice(0, 500);
    if (patch.description != null) {
      allowed.description = String(patch.description).trim().slice(0, 5000);
    }
    if (!Object.keys(allowed).length) return null;
    await apiPut(`/founders/${id}/tasks/${taskId}`, { task: allowed });
    if (!options.skipRefresh) return get().refresh();
    return null;
  },

  async updateTaskStatus(taskId, status, extra = {}, options = {}) {
    const id = get().founderId;
    if (!id || !taskId) return null;
    await apiPut(`/founders/${id}/tasks/${taskId}/status`, {
      status,
      ...extra,
      updatedAt: new Date().toISOString(),
    });
    if (options.skipRefresh) return null;
    return get().refresh();
  },

  /**
   * Apply a target status from a known current status using server rules
   * (see server/src/domain/weeklyLoopRules.js — e.g. pending cannot jump to completed).
   */
  async applyTaskStatusTransition(taskId, fromStatus, toStatus, options = {}) {
    const id = get().founderId;
    if (!id || !taskId) return null;
    const skipOpt = options.skipRefresh === true ? { skipRefresh: true } : {};
    let cur = String(fromStatus || "pending").toLowerCase();
    const target = String(toStatus || "pending").toLowerCase();

    const put = async (st, extra = {}) => {
      await get().updateTaskStatus(taskId, st, extra, skipOpt);
      cur = st;
    };

    if (cur === target) return null;

    if (target === "completed") {
      if (cur === "pending") {
        await put("in-progress");
        await put("completed", { completedAt: new Date().toISOString() });
        return null;
      }
      if (cur === "blocked") {
        await put("in-progress");
        await put("completed", { completedAt: new Date().toISOString() });
        return null;
      }
      if (cur === "in-progress") {
        await put("completed", { completedAt: new Date().toISOString() });
        return null;
      }
    }

    if (target === "in-progress") {
      if (cur === "pending") {
        await put("in-progress");
        return null;
      }
      if (cur === "blocked") {
        await put("in-progress");
        return null;
      }
    }

    if (target === "pending") {
      if (cur === "completed") {
        await put("pending", { completedAt: null });
        return null;
      }
      if (cur === "in-progress") {
        await put("pending", { completedAt: null });
        return null;
      }
      if (cur === "blocked") {
        await get().unblockTask(taskId, skipOpt);
        return null;
      }
    }

    await put(
      target,
      target === "completed"
        ? { completedAt: new Date().toISOString() }
        : { completedAt: null },
    );
    return null;
  },

  async toggleTask(taskId) {
    const id = get().founderId;
    if (!id || !taskId) return null;
    const tasks = asList(get().tasks);
    const idx = tasks.findIndex(
      (task) => String(task.id || task._id) === String(taskId),
    );
    if (idx === -1) return null;
    const current = tasks[idx];
    const nextStatus =
      current && (current.status === "completed" || current.completed)
        ? "pending"
        : "completed";
    const prevSnapshot = tasks.map((t) => ({ ...t }));
    const nextTasks = tasks.map((task, i) =>
      i === idx
        ? {
            ...task,
            status: nextStatus,
            completedAt:
              nextStatus === "completed" ? new Date().toISOString() : null,
            completed: nextStatus === "completed",
          }
        : task,
    );
    const vmNext = mapFounderWeeklyLoop({
      outcomes: asList(get().outcomes),
      milestones: asList(get().milestones),
      tasks: nextTasks,
      executionScore: get().executionScore,
    });
    set({ tasks: nextTasks, viewModel: vmNext });
    try {
      const from = String(current?.status || "pending").toLowerCase();
      await get().applyTaskStatusTransition(taskId, from, nextStatus, {
        skipRefresh: true,
      });
      return get().refresh();
    } catch (error) {
      const vmPrev = mapFounderWeeklyLoop({
        outcomes: asList(get().outcomes),
        milestones: asList(get().milestones),
        tasks: prevSnapshot,
        executionScore: get().executionScore,
      });
      set({ tasks: prevSnapshot, viewModel: vmPrev });
      throw error;
    }
  },

  async setTaskPriority(taskId, priority, options = {}) {
    const id = get().founderId;
    if (!id || !taskId || priority == null || priority === "") return null;
    const p = String(priority).toLowerCase();
    if (!["low", "medium", "high"].includes(p)) return null;
    const tasks = asList(get().tasks);
    const idx = tasks.findIndex(
      (task) => String(task.id || task._id) === String(taskId),
    );
    if (idx === -1) return null;
    const prevSnapshot = tasks.map((t) => ({ ...t }));
    const nextTasks = tasks.map((task, i) =>
      i === idx ? { ...task, priority: p } : task,
    );
    const vmNext = mapFounderWeeklyLoop({
      outcomes: asList(get().outcomes),
      milestones: asList(get().milestones),
      tasks: nextTasks,
      executionScore: get().executionScore,
    });
    if (!options.skipRefresh) {
      set({ tasks: nextTasks, viewModel: vmNext });
    }
    try {
      await apiPut(`/founders/${id}/tasks/${taskId}`, { task: { priority: p } });
      if (options.skipRefresh) return null;
      return get().refresh();
    } catch (error) {
      if (!options.skipRefresh) {
        const vmPrev = mapFounderWeeklyLoop({
          outcomes: asList(get().outcomes),
          milestones: asList(get().milestones),
          tasks: prevSnapshot,
          executionScore: get().executionScore,
        });
        set({ tasks: prevSnapshot, viewModel: vmPrev });
      }
      throw error;
    }
  },

  async blockTask(taskId, reason, note, options = {}) {
    return get().updateTaskStatus(
      taskId,
      "blocked",
      {
        blockedReason: reason,
        blockerReason: reason,
        blockedNote: note,
        blockerNote: note,
        blockedAt: new Date().toISOString(),
      },
      options,
    );
  },

  async unblockTask(taskId, options = {}) {
    return get().updateTaskStatus(
      taskId,
      "pending",
      {
        blockedReason: null,
        blockerReason: null,
        blockedNote: null,
        blockerNote: null,
        unblockedAt: new Date().toISOString(),
      },
      options,
    );
  },

  async assignTask(
    taskId,
    assigneeId,
    assigneeName,
    assigneeAvatar = "",
    options = {},
  ) {
    const id = get().founderId;
    if (!id || !taskId) return null;
    await apiPut(`/founders/${id}/tasks/${taskId}/assign`, {
      assigneeId,
      assigneeName,
      assignedTo: assigneeId,
      assignedToName: assigneeName,
      assignedToAvatar: assigneeAvatar || "",
    });
    if (options.skipRefresh) return null;
    return get().refresh();
  },

  async setTaskIncentive(taskId, incentive) {
    const id = get().founderId;
    if (!id || !taskId) return null;
    await apiPut(`/founders/${id}/tasks/${taskId}`, {
      task: {
        incentive,
        incentiveSetAt: new Date().toISOString(),
      },
    });
    return get().refresh();
  },

  async deleteTask(taskId, options = {}) {
    const id = get().founderId;
    if (!id || !taskId) return null;
    await apiDelete(`/founders/${id}/tasks/${taskId}`);
    if (!options.skipRefresh) return get().refresh();
    return null;
  },

  async deleteMilestone(milestoneId, options = {}) {
    const fid = get().founderId;
    if (!fid || !milestoneId) return null;
    await apiDelete(`/founders/${fid}/milestones/${milestoneId}`);
    if (!options.skipRefresh) return get().refresh();
    return null;
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
