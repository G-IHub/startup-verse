// Async API wrapper for Core Engine with backend-first approach
import { request } from "../backendClient";

async function apiRequest(endpoint, options = {}) {
  const payload = await request(endpoint, options);
  return payload.data;
}

function asList(value) {
  return Array.isArray(value) ? value : [];
}

// ==========================================
// TYPES
// ==========================================

// ==========================================
// WEEKLY OUTCOMES API
// ==========================================

/**
 * Get all weekly outcomes for a founder (REAL BACKEND DATA)
 */
export async function getWeeklyOutcomes(founderId) {
  try {
    const data = await apiRequest(`/founders/${founderId}/weekly-outcomes`, {
      method: "GET",
    });
    const outcomes = Array.isArray(data) ? data : asList(data?.outcomes);

    // ✅ BACKEND-FIRST: Cache in localStorage for offline access
    if (outcomes.length > 0) {
      localStorage.setItem(
        `weekly_outcomes_${founderId}`,
        JSON.stringify(outcomes),
      );
    }

    return outcomes;
  } catch (error) {
    // Silent fallback - don't spam console in production
    const errorMessage = error.message;

    // ⚠️ FALLBACK: Try to load from localStorage cache if backend unavailable
    const cached = localStorage.getItem(`weekly_outcomes_${founderId}`);
    if (cached) {
      // Only log warning once per session to avoid spam
      if (!sessionStorage.getItem("warned_backend_outcomes")) {
        console.warn("⚠️ Using cached weekly outcomes (backend unavailable)");
        sessionStorage.setItem("warned_backend_outcomes", "true");
      }
      return JSON.parse(cached);
    }

    // Return empty array instead of throwing - graceful degradation
    if (!sessionStorage.getItem("warned_backend_outcomes_empty")) {
      console.warn(
        "⚠️ Backend unavailable and no cache found - returning empty outcomes",
      );
      sessionStorage.setItem("warned_backend_outcomes_empty", "true");
    }
    return [];
  }
}

/**
 * Get current active weekly outcome for a founder
 */
export async function getCurrentWeeklyOutcome(founderId) {
  const outcomes = await getWeeklyOutcomes(founderId);
  return outcomes.find((o) => o.status === "active") || null;
}

/**
 * Save/create a weekly outcome (REAL BACKEND SAVE)
 */
export async function saveWeeklyOutcome(founderId, outcome) {
  try {
    await apiRequest(`/founders/${founderId}/weekly-outcomes`, {
      method: "POST",
      body: JSON.stringify({ outcome }),
    });

    console.log("✅ Weekly outcome saved to backend");

    // ✅ BACKEND-FIRST: Update cache after successful save
    const cached = localStorage.getItem(`weekly_outcomes_${founderId}`);
    const outcomes = cached ? JSON.parse(cached) : [];
    const existingIndex = outcomes.findIndex(
      (o) => o.id === outcome.id || o.weekId === outcome.weekId,
    );

    if (existingIndex >= 0) {
      outcomes[existingIndex] = outcome;
    } else {
      outcomes.push(outcome);
    }

    localStorage.setItem(
      `weekly_outcomes_${founderId}`,
      JSON.stringify(outcomes),
    );
    console.log("✅ Cache updated after backend save");
  } catch (error) {
    // 🔄 GRACEFUL FALLBACK: Save to cache if backend unavailable
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      console.warn(
        "⚠️ Backend unavailable - saving weekly outcome to cache only",
      );

      const cached = localStorage.getItem(`weekly_outcomes_${founderId}`);
      const outcomes = cached ? JSON.parse(cached) : [];
      const existingIndex = outcomes.findIndex(
        (o) => o.id === outcome.id || o.weekId === outcome.weekId,
      );

      if (existingIndex >= 0) {
        outcomes[existingIndex] = outcome;
      } else {
        outcomes.push(outcome);
      }

      localStorage.setItem(
        `weekly_outcomes_${founderId}`,
        JSON.stringify(outcomes),
      );
      console.log("✅ Weekly outcome saved to cache (offline mode)");
      // Don't throw - allow operation to succeed with cache
      return;
    }

    console.error("❌ Error saving weekly outcome to backend:", error);
    throw error;
  }
}

/**
 * Update an existing weekly outcome
 */
export async function updateWeeklyOutcome(founderId, outcomeId, updates) {
  try {
    // Get current outcome
    const outcomes = await getWeeklyOutcomes(founderId);
    const currentOutcome = outcomes.find(
      (o) => o.id === outcomeId || o.weekId === outcomeId,
    );

    if (!currentOutcome) {
      throw new Error("Outcome not found");
    }

    // Merge updates
    const updatedOutcome = {
      ...currentOutcome,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Save back
    await saveWeeklyOutcome(founderId, updatedOutcome);
  } catch (error) {
    console.error("Error updating weekly outcome:", error);
    throw error;
  }
}

// ==========================================
// TASKS API
// ==========================================

/**
 * Get all tasks for a founder (REAL BACKEND DATA)
 */
export async function getTasks(founderId) {
  try {
    const data = await apiRequest(`/founders/${founderId}/tasks`, {
      method: "GET",
    });
    const tasks = Array.isArray(data) ? data : asList(data?.tasks);

    // ✅ BACKEND-FIRST: Cache in localStorage for offline access
    if (tasks.length > 0) {
      localStorage.setItem(`tasks_${founderId}`, JSON.stringify(tasks));
    }

    return tasks;
  } catch (error) {
    // Silent fallback - don't spam console in production
    const errorMessage = error.message;

    // ⚠️ FALLBACK: Try to load from localStorage cache if backend unavailable
    const cached = localStorage.getItem(`tasks_${founderId}`);
    if (cached) {
      // Only log warning once per session to avoid spam
      if (!sessionStorage.getItem("warned_backend_tasks")) {
        console.warn("⚠️ Using cached tasks (backend unavailable)");
        sessionStorage.setItem("warned_backend_tasks", "true");
      }
      return JSON.parse(cached);
    }

    // Return empty array instead of throwing - graceful degradation
    if (!sessionStorage.getItem("warned_backend_tasks_empty")) {
      console.warn(
        "⚠️ Backend unavailable and no cache found - returning empty tasks",
      );
      sessionStorage.setItem("warned_backend_tasks_empty", "true");
    }
    return [];
  }
}

/**
 * Save a single task (REAL BACKEND SAVE)
 */
export async function saveTask(founderId, task) {
  try {
    await apiRequest(`/founders/${founderId}/tasks`, {
      method: "POST",
      body: JSON.stringify({ task }),
    });

    console.log(`✅ Task ${task.id} saved to backend`);

    // ✅ BACKEND-FIRST: Update cache after successful save
    const cached = localStorage.getItem(`tasks_${founderId}`);
    const tasks = cached ? JSON.parse(cached) : [];
    const existingIndex = tasks.findIndex((t) => t.id === task.id);

    if (existingIndex >= 0) {
      tasks[existingIndex] = task;
    } else {
      tasks.push(task);
    }

    localStorage.setItem(`tasks_${founderId}`, JSON.stringify(tasks));
    console.log("✅ Task cache updated after backend save");
  } catch (error) {
    // 🔄 GRACEFUL FALLBACK: Save to cache if backend unavailable
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      console.warn("⚠️ Backend unavailable - saving task to cache only");

      const cached = localStorage.getItem(`tasks_${founderId}`);
      const tasks = cached ? JSON.parse(cached) : [];
      const existingIndex = tasks.findIndex((t) => t.id === task.id);

      if (existingIndex >= 0) {
        tasks[existingIndex] = task;
      } else {
        tasks.push(task);
      }

      localStorage.setItem(`tasks_${founderId}`, JSON.stringify(tasks));
      console.log("✅ Task saved to cache (offline mode)");
      // Don't throw - allow operation to succeed with cache
      return;
    }

    console.error("❌ Error saving task to backend:", error);
    throw error;
  }
}

/**
 * Update task status (REAL BACKEND UPDATE)
 */
export async function updateTaskStatus(
  founderId,
  taskId,
  status,
  additionalData,
) {
  try {
    await apiRequest(`/founders/${founderId}/tasks/${taskId}/status`, {
      method: "PUT",
      body: JSON.stringify({
        status,
        ...additionalData,
        updatedAt: new Date().toISOString(),
      }),
    });

    console.log(`✅ Task ${taskId} status updated to ${status}`);
  } catch (error) {
    if (String(error?.message || "").toLowerCase().includes("blocked tasks require")) {
      throw new Error("Blocked tasks require both a blocker reason and blocker note.");
    }
    console.error("Error updating task status:", error);
    throw error;
  }
}

/**
 * Delete a task (REAL BACKEND DELETE)
 */
export async function deleteTask(founderId, taskId) {
  try {
    await apiRequest(`/founders/${founderId}/tasks/${taskId}`, {
      method: "DELETE",
    });

    console.log(`✅ Task ${taskId} deleted from backend`);
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
}

/**
 * Assign a task to a team member (async, updates backend)
 */
export async function assignTask(founderId, taskId, assigneeId, assigneeName) {
  try {
    // Call the backend's /assign endpoint which triggers notifications
    await apiRequest(`/founders/${founderId}/tasks/${taskId}/assign`, {
      method: "PUT",
      body: JSON.stringify({
        assigneeId,
        assigneeName,
        assignedTo: assigneeId,
        assignedToName: assigneeName,
      }),
    });

    console.log(
      `✅ Task ${taskId} assigned to ${assigneeName} (with notification)`,
    );

    // Return updated tasks
    return getTasks(founderId);
  } catch (error) {
    console.error("Error assigning task:", error);
    throw error;
  }
}

/**
 * Set task incentive (async, updates backend)
 */
export async function setTaskIncentive(founderId, taskId, incentive) {
  const tasks = await getTasks(founderId);
  const task = tasks.find((t) => t.id === taskId);

  if (!task) {
    throw new Error("Task not found");
  }

  const updatedTask = {
    ...task,
    incentive,
    incentiveSetAt: new Date().toISOString(),
  };

  await saveTask(founderId, updatedTask);

  return getTasks(founderId);
}

/**
 * Complete weekly review (async, updates backend)
 */
export async function completeWeeklyReview(
  founderId,
  outcomeId,
  completionData,
) {
  // Get current outcome
  const outcomes = await getWeeklyOutcomes(founderId);
  const currentOutcome = outcomes.find(
    (o) => o.id === outcomeId || o.weekId === outcomeId,
  );

  if (!currentOutcome) {
    throw new Error("Outcome not found");
  }

  // Update outcome status
  const status =
    completionData.achievement === "completed"
      ? "completed"
      : completionData.achievement === "partial"
        ? "partial"
        : "missed";

  const completedOutcome = {
    ...currentOutcome,
    status,
    completedAt: new Date().toISOString(),
    completionPercentage: Math.round(
      (completionData.milestonesCompleted / completionData.milestonesTotal) *
        100,
    ),
    completionData: {
      ...completionData,
      completedAt: new Date().toISOString(),
    },
  };

  // Save to backend
  await saveWeeklyOutcome(founderId, completedOutcome);

  // Return updated execution data
  return getExecutionData(founderId);
}

/**
 * Create and save tasks from milestones (async, saves to backend)
 */
export async function saveTasks(founderId, tasks) {
  // Save all tasks in parallel
  await Promise.all(tasks.map((task) => saveTask(founderId, task)));

  console.log(`✅ ${tasks.length} tasks saved to backend`);
}

/**
 * Sync tasks to milestones and update outcome progress (async)
 */
export async function syncTasksToMilestones(founderId) {
  const [tasks, executionData] = await Promise.all([
    getTasks(founderId),
    getExecutionData(founderId),
  ]);

  if (!executionData.currentOutcome) {
    return; // No active outcome
  }

  let outcome = executionData.currentOutcome;
  let hasChanges = false;

  // Update milestone progress based on tasks
  outcome.milestones = outcome.milestones.map((milestone) => {
    const milestoneTasks = tasks.filter((t) => t.milestoneId === milestone.id);
    const completedTasks = milestoneTasks.filter(
      (t) => t.status === "completed",
    );

    const tasksCompleted = completedTasks.length;
    const totalTasks = milestoneTasks.length;

    // Update milestone status
    let status = "pending";
    if (tasksCompleted === totalTasks && totalTasks > 0) {
      status = "completed";
    } else if (tasksCompleted > 0) {
      status = "in-progress";
    }

    if (
      milestone.tasksCompleted !== tasksCompleted ||
      milestone.status !== status
    ) {
      hasChanges = true;
    }

    return {
      ...milestone,
      tasksCompleted,
      totalTasks,
      status,
    };
  });

  // Calculate outcome completion percentage
  const completedMilestones = outcome.milestones.filter(
    (m) => m.status === "completed",
  ).length;
  const totalMilestones = outcome.milestones.length;
  const completionPercentage =
    totalMilestones > 0
      ? Math.round((completedMilestones / totalMilestones) * 100)
      : 0;

  if (outcome.completionPercentage !== completionPercentage) {
    hasChanges = true;
  }

  outcome.completionPercentage = completionPercentage;

  // Save if there are changes
  if (hasChanges) {
    await saveWeeklyOutcome(founderId, outcome);
    console.log("✅ Milestones and outcome progress synced to backend");
  }
}

/**
 * Get streak statistics
 */
export async function getStreakStats(founderId) {
  const executionData = await getExecutionData(founderId);
  const history = executionData.weekHistory;

  const totalWeeks = history.length;
  const completedWeeks = history.filter((w) => w.status === "completed").length;
  const partialWeeks = history.filter((w) => w.status === "partial").length;

  // Calculate longest streak
  let longestStreak = 0;
  let currentCount = 0;

  for (const week of history) {
    if (week.status === "completed") {
      currentCount++;
      longestStreak = Math.max(longestStreak, currentCount);
    } else {
      currentCount = 0;
    }
  }

  return {
    currentStreak: executionData.streak,
    longestStreak,
    totalWeeksCompleted: completedWeeks,
    totalWeeksPartial: partialWeeks,
    successRate:
      totalWeeks > 0 ? Math.round((completedWeeks / totalWeeks) * 100) : 0,
  };
}

// ==========================================
// MILESTONES API
// ==========================================

/**
 * Get all milestones for a founder (REAL BACKEND DATA)
 */
export async function getMilestones(founderId) {
  try {
    const data = await apiRequest(`/founders/${founderId}/milestones`, {
      method: "GET",
    });
    return Array.isArray(data) ? data : asList(data?.milestones);
  } catch (error) {
    console.error("Error fetching milestones:", error);
    throw error;
  }
}

/**
 * Save a milestone (REAL BACKEND SAVE)
 */
export async function saveMilestone(founderId, milestone) {
  try {
    await apiRequest(`/founders/${founderId}/milestones`, {
      method: "POST",
      body: JSON.stringify({ milestone }),
    });

    console.log(`✅ Milestone ${milestone.id} saved to backend`);
  } catch (error) {
    console.error("Error saving milestone:", error);
    throw error;
  }
}

// ==========================================
// EXECUTION DATA HELPER (with caching)
// ==========================================

/**
 * Get execution data with backend loading and localStorage caching
 */
export async function getExecutionData(founderId) {
  try {
    // 🎯 PRIORITY 1: Try to load execution data directly from backend
    // This includes currentOutcome set by organizations via auto-population
    try {
      const data = await apiRequest(`/founders/${founderId}/execution-data`, {
        method: "GET",
      });
      if (data.executionData) {
          console.log(
            "✅ Loaded execution data directly from backend (includes org milestones):",
            data.executionData,
          );

          // Cache to localStorage
          localStorage.setItem(
            `execution_data_${founderId}`,
            JSON.stringify(data.executionData),
          );

          return data.executionData;
      }
    } catch (directFetchError) {
      console.debug(
        "Direct execution data fetch failed, falling back to reconstruction:",
        directFetchError,
      );
    }

    // 🎯 FALLBACK: Reconstruct execution data from outcomes and tasks
    const [outcomes, tasks] = await Promise.all([
      getWeeklyOutcomes(founderId),
      getTasks(founderId),
    ]);

    const currentOutcome = outcomes.find((o) => o.status === "active") || null;
    const completedOutcomes = outcomes.filter(
      (o) =>
        o.status === "completed" ||
        o.status === "partial" ||
        o.status === "missed",
    );

    // Calculate streak from completed outcomes
    let streak = 0;
    const sortedOutcomes = [...completedOutcomes].sort(
      (a, b) =>
        new Date(b.weekEnding).getTime() - new Date(a.weekEnding).getTime(),
    );

    for (const outcome of sortedOutcomes) {
      if (outcome.status === "completed") {
        streak++;
      } else {
        break;
      }
    }

    const executionData = {
      userId: founderId,
      currentOutcome,
      streak,
      hasPartialWeeks: outcomes.some((o) => o.status === "partial"),
      weekHistory: completedOutcomes.map((o) => ({
        outcomeId: o.id,
        title: o.title,
        weekNumber: o.weekNumber,
        status: o.status,
        completedDate: o.completedAt || "",
        progressPercentage: o.completionPercentage || 0,
        completionData: o.completionData,
      })),
      lastUpdated: new Date().toISOString(),
    };

    // Cache in localStorage for faster subsequent loads
    localStorage.setItem(
      `execution_cache_${founderId}`,
      JSON.stringify({
        data: executionData,
        cachedAt: new Date().toISOString(),
      }),
    );

    return executionData;
  } catch (error) {
    console.error("Error loading execution data from backend:", error);

    // Fallback to cache if backend fails
    const cached = localStorage.getItem(`execution_cache_${founderId}`);
    if (cached) {
      const { data } = JSON.parse(cached);
      console.warn("Using cached execution data due to backend error");
      return data;
    }

    throw error;
  }
}

// ==========================================
// HIGH-LEVEL OPERATIONS (Async)
// ==========================================

/**
 * Toggle task completion (async, updates backend)
 */
export async function toggleTask(founderId, taskId) {
  const tasks = await getTasks(founderId);
  const task = tasks.find((t) => t.id === taskId);

  if (!task) {
    throw new Error("Task not found");
  }

  const newStatus = task.status === "completed" ? "pending" : "completed";

  // Update in backend
  await updateTaskStatus(founderId, taskId, newStatus, {
    completedAt: newStatus === "completed" ? new Date().toISOString() : null,
  });

  // Return updated tasks
  return getTasks(founderId);
}

/**
 * Block a task (async, updates backend)
 */
export async function blockTask(founderId, taskId, reason, note) {
  await updateTaskStatus(founderId, taskId, "blocked", {
    blockedReason: reason,
    blockedNote: note,
    blockedAt: new Date().toISOString(),
  });

  return getTasks(founderId);
}

/**
 * Unblock a task (async, updates backend)
 */
export async function unblockTask(founderId, taskId) {
  await updateTaskStatus(founderId, taskId, "pending", {
    blockedReason: null,
    blockedNote: null,
    blockedAt: null,
    unblockedAt: new Date().toISOString(),
  });

  return getTasks(founderId);
}
