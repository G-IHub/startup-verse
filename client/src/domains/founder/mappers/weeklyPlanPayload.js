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

function taskPayloadFromTitle(taskTitle) {
  const action = getActionButtonForTask(taskTitle);
  if (action && typeof action === "object") {
    return { title: taskTitle, actionButton: action };
  }
  if (typeof action === "string" && action) {
    return { title: taskTitle, actionButton: action };
  }
  return { title: taskTitle };
}

/**
 * Builds the API body for POST /founders/:id/weekly-plan (wrapped as { plan }).
 */
export function buildWeeklyPlanFromTemplate(
  templateId,
  stageId,
  weekNumber,
  { customTitle, customDescription } = {},
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
    weekOf: weekOfStartIso(),
    status: "active",
    milestones,
  };
}

export function buildWeeklyPlanFromIntent(
  parsedIntent,
  weekNumber,
  { customTitle, customDescription } = {},
) {
  const outcome = createOutcomeFromIntent(parsedIntent, weekNumber);
  if (!outcome) return null;

  const goal = String(customTitle || outcome.title || "").trim();
  const summary = String(customDescription || outcome.description || "").trim();

  const milestones = parsedIntent.suggestedMilestones.map((m) => ({
    title: m.title,
    description: "",
    tasks: (m.tasks || []).map((taskTitle) =>
      typeof taskTitle === "string"
        ? { title: taskTitle }
        : { title: taskTitle?.title || "" },
    ),
  }));

  return {
    goal,
    summary,
    weekOf: weekOfStartIso(),
    status: "active",
    milestones,
  };
}
