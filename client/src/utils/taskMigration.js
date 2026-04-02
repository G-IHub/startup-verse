/**
 * Task Migration Utility
 *
 * Syncs tasks from localStorage to Supabase backend
 * This is needed for users who have tasks created before backend integration
 */

import * as coreEngineApi from "./api/coreEngineApi";

/**
 * Migrate all localStorage tasks to backend for a founder
 */
export async function migrateTasksToBackend(founderId) {
  console.log(
    `🔄 [Task Migration] Starting migration for founder ${founderId}...`,
  );

  // Get tasks from localStorage
  const tasksKey = `tasks_${founderId}`;
  const cachedTasks = localStorage.getItem(tasksKey);

  if (!cachedTasks) {
    console.log(
      `ℹ️ [Task Migration] No localStorage tasks found for ${founderId}`,
    );
    return { success: true, migrated: 0, errors: 0 };
  }

  try {
    const tasks = JSON.parse(cachedTasks);
    console.log(
      `📦 [Task Migration] Found ${tasks.length} tasks in localStorage`,
    );

    let migrated = 0;
    let errors = 0;

    // Sync all tasks to backend
    for (const task of tasks) {
      try {
        await coreEngineApi.saveTask(founderId, task);
        migrated++;
        console.log(`✅ [Task Migration] Migrated task: ${task.id}`);
      } catch (error) {
        errors++;
        console.error(
          `❌ [Task Migration] Failed to migrate task ${task.id}:`,
          error,
        );
      }
    }

    console.log(
      `🎉 [Task Migration] Complete! Migrated: ${migrated}, Errors: ${errors}`,
    );

    return {
      success: errors === 0,
      migrated,
      errors,
    };
  } catch (error) {
    console.error(
      `❌ [Task Migration] Failed to parse or migrate tasks:`,
      error,
    );
    return { success: false, migrated: 0, errors: 1 };
  }
}

/**
 * Check if migration is needed
 */
export function checkMigrationNeeded(founderId) {
  const tasksKey = `tasks_${founderId}`;
  const cachedTasks = localStorage.getItem(tasksKey);
  return !!cachedTasks;
}
