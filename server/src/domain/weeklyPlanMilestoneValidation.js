/** Keep in sync with client `weeklyPlanPayload.js` validation rules. */

export const MIN_WEEKLY_MILESTONE_TITLE_LEN = 2;
export const MIN_WEEKLY_TASK_TITLE_LEN = 2;

/**
 * @param {unknown} milestones
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
export function validateWeeklyPlanMilestonesInput(milestones) {
  const ms = Array.isArray(milestones) ? milestones : [];
  if (ms.length === 0) {
    return {
      ok: false,
      message:
        "Add at least one milestone. Each milestone needs a title and at least one task.",
    };
  }
  for (let i = 0; i < ms.length; i++) {
    const m = ms[i];
    const title = String(m?.title ?? "").trim();
    if (title.length < MIN_WEEKLY_MILESTONE_TITLE_LEN) {
      return {
        ok: false,
        message: `Milestone ${i + 1}: title must be at least ${MIN_WEEKLY_MILESTONE_TITLE_LEN} characters.`,
      };
    }
    const tasks = Array.isArray(m?.tasks) ? m.tasks : [];
    let validTasks = 0;
    for (const t of tasks) {
      const raw = typeof t === "string" ? t : t?.title;
      const tt = String(raw ?? "").trim();
      if (tt.length >= MIN_WEEKLY_TASK_TITLE_LEN) validTasks += 1;
    }
    if (validTasks === 0) {
      const short =
        title.length > 48 ? `${title.slice(0, 48)}…` : title;
      return {
        ok: false,
        message: `“${short}” needs at least one task with a title (at least ${MIN_WEEKLY_TASK_TITLE_LEN} characters).`,
      };
    }
  }
  return { ok: true };
}
