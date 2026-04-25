import {
  createOutcomeFromTemplate,
  OUTCOME_TEMPLATES,
  getActionButtonForTask,
} from "../../../utils/executionEngine.js";
import { createOutcomeFromIntent } from "../../../utils/intentParser.js";

export function weekOfStartIso(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

const FINAL_OUTCOME = new Set(["completed", "partial", "missed"]);

/**
 * `weekOf` for POST /weekly-plan: reuse the latest outcome's week when it is still
 * **active** (update path). If the latest outcome is **final**, use the first week
 * bucket after it (>= today) so we do not POST the same key as a locked row (422).
 */
export function nextPlanWeekOfIso(existingOutcomes = []) {
  const list = Array.isArray(existingOutcomes) ? existingOutcomes : [];
  if (list.length === 0) return weekOfStartIso();

  const sorted = [...list].sort(
    (a, b) =>
      new Date(b?.weekOf || b?.createdAt || 0) -
      new Date(a?.weekOf || a?.createdAt || 0),
  );
  const latest = sorted[0];
  const raw = latest?.weekOf || latest?.createdAt;
  if (!raw) return weekOfStartIso();

  const latestDay = new Date(raw);
  if (Number.isNaN(latestDay.getTime())) return weekOfStartIso();
  latestDay.setHours(0, 0, 0, 0);

  const status = String(latest?.status || "").toLowerCase();
  if (!FINAL_OUTCOME.has(status)) {
    return weekOfStartIso(latestDay);
  }

  const next = new Date(latestDay);
  next.setDate(next.getDate() + 7);
  next.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  while (next < today) {
    next.setDate(next.getDate() + 7);
  }
  return next.toISOString();
}

function ensureTaskTitle(title) {
  const t = String(title || "").trim();
  if (t.length >= 2) return t.slice(0, 200);
  return `${t || "Task"} …`.slice(0, 200);
}

function taskPayloadFromTitle(taskTitle) {
  const title = ensureTaskTitle(taskTitle);
  const action = getActionButtonForTask(taskTitle);
  if (action && typeof action === "object") {
    return { title, actionButton: action };
  }
  if (typeof action === "string" && action) {
    return { title, actionButton: action };
  }
  return { title };
}

/**
 * Builds the API body for POST /founders/:id/weekly-plan (wrapped as { plan }).
 */
export function buildWeeklyPlanFromTemplate(
  templateId,
  stageId,
  weekNumber,
  { customTitle, customDescription } = {},
  existingOutcomes = [],
) {
  const outcome = createOutcomeFromTemplate(templateId, stageId, weekNumber);
  if (!outcome) return null;

  const templates = OUTCOME_TEMPLATES[stageId] || [];
  const template = templates.find((t) => t.id === templateId);
  if (!template) return null;

  const goal = String(customTitle || outcome.title || "").trim();
  const summary = String(customDescription || outcome.description || "").trim();

  const milestones = template.defaultMilestones.map((m) => ({
    title: m.title,
    description: "",
    tasks: m.defaultTasks.map((taskTitle) => taskPayloadFromTitle(taskTitle)),
  }));

  return {
    goal,
    summary,
    weekOf: nextPlanWeekOfIso(existingOutcomes),
    status: "active",
    milestones,
  };
}

/**
 * Free-form weekly plan (Outcome modal "Create Custom Outcome" uses templateId "custom").
 */
export function buildWeeklyPlanCustom(
  customTitle,
  customDescription,
  _stageId,
  _weekNumber,
  existingOutcomes = [],
) {
  const goal = String(customTitle || "").trim();
  const summary = String(customDescription || "").trim();
  if (!goal) return null;

  const lines = summary
    .split(/\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2)
    .slice(0, 12)
    .map((s) => ({ title: ensureTaskTitle(s) }));

  const tasks =
    lines.length >= 2
      ? lines
      : [
          {
            title: ensureTaskTitle(
              "Define scope and success criteria for this outcome",
            ),
          },
          {
            title: ensureTaskTitle(
              summary
                ? summary.slice(0, 180)
                : "Execute the planned work toward this weekly goal",
            ),
          },
          { title: ensureTaskTitle("Review results and document learnings") },
        ];

  return {
    goal,
    summary,
    weekOf: nextPlanWeekOfIso(existingOutcomes),
    status: "active",
    milestones: [
      {
        title: goal.slice(0, 200),
        description: summary,
        tasks,
      },
    ],
  };
}

export function buildWeeklyPlanFromIntent(
  parsedIntent,
  weekNumber,
  { customTitle, customDescription } = {},
  existingOutcomes = [],
) {
  const outcome = createOutcomeFromIntent(parsedIntent, weekNumber);
  if (!outcome) return null;

  const goal = String(customTitle || outcome.title || "").trim();
  const summary = String(customDescription || outcome.description || "").trim();

  const milestones = parsedIntent.suggestedMilestones.map((m) => ({
    title: m.title,
    description: "",
    tasks: (m.tasks || [])
      .map((taskTitle) =>
        typeof taskTitle === "string"
          ? { title: ensureTaskTitle(taskTitle) }
          : { title: ensureTaskTitle(taskTitle?.title || "") },
      )
      .filter((row) => row.title && String(row.title).trim()),
  }));

  return {
    goal,
    summary,
    weekOf: nextPlanWeekOfIso(existingOutcomes),
    status: "active",
    milestones,
  };
}
