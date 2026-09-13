/**
 * agentExecutors.js — maps an ActionType.actionKey to the real adapter call
 * that actually performs it. orchestrator.service.js is the only caller
 * (docs/ai-agent-roadmap.md Phase 1) — it looks up an executor by actionKey
 * and runs it instead of just logging a status, which is all Phase 0 did
 * (no real adapters existed yet). Keeping this as one small registry file
 * (per-integration adapters live in their own files, e.g. githubAdapter.js)
 * means orchestrator.service.js never needs to know which integration
 * backs a given action type.
 */
import { openPullRequest, mergePullRequest, mergeBranches, getFileContent, getPullRequestFiles } from "./githubAdapter.js";
import { draftText, deepseekConfigured } from "./deepseekClient.js";
import Startup from "../models/Startup.js";
import Milestone from "../models/Milestone.js";
import Task from "../models/Task.js";
import WeeklyOutcome from "../models/WeeklyOutcome.js";
import { validateTaskStatusTransition, validateBlockedTaskPayload } from "../domain/weeklyLoopRules.js";
import { syncMilestoneCounters } from "../utils/syncMilestoneCounters.js";
import { emitRealtime } from "./realtime.service.js";
import { SOCKET_EVENTS } from "../realtime/events.js";
import { startupRoom } from "../realtime/rooms.js";

const DEFAULT_STAGING_BRANCH = "staging";
const DEFAULT_PROD_BRANCH = "main";

/**
 * AI Developer's drafting instructions — a distilled, code-quality-relevant
 * subset of this repo's own Standing Operating Procedure (CLAUDE.md), applied
 * to what AI Developer writes into a FOUNDER's repo, not just to how Claude
 * works on this one. The parts that don't translate (compaction, session
 * logs) are left out; the parts that do (small additive changes, no silent
 * scope creep, no fabricated claims of correctness) apply just as much to an
 * agent writing real code as to a human-AI session writing this codebase.
 */
const AI_DEVELOPER_SYSTEM_PROMPT = `You are AI Developer, a StartupVerse agent writing real code into a founder's real repository. Follow real engineering discipline, not just "make something work":
- Output only the raw content of the ONE file you were asked to write — no commentary, no code fences unless the file itself is markdown.
- Stay scoped to exactly what was asked. Do not invent additional files, do not reference or assume changes elsewhere in the codebase you were not asked to touch, and do not expand the task's scope on your own judgment.
- Prefer small, focused, additive content over trying to do too much in one file — the same "new capability, new small file" discipline this platform holds itself to.
- Never write a comment, docstring, or claim asserting something is tested, complete, or working if you have no way to know that — do not fabricate confidence you don't have.
- If the task description is ambiguous or missing information you'd need, write the most reasonable, minimal, honest interpretation rather than guessing elaborately or padding with speculative features.`;

async function executeGithubOpenPr({ founderId, payload, targetId }) {
  const { owner, repo, filePath, taskDescription, baseBranch } = payload || {};
  if (!owner || !repo || !filePath || !taskDescription) {
    throw new Error("write_code requires owner, repo, filePath, and taskDescription in payload.");
  }
  const fileContent = deepseekConfigured()
    ? await draftText({
        systemPrompt: AI_DEVELOPER_SYSTEM_PROMPT,
        userPrompt: `File path: ${filePath}\n\nTask: ${taskDescription}`,
      })
    : `# ${taskDescription}\n\n(DeepSeek not configured — placeholder content, not real drafting.)\n`;

  const branchName = `ai-developer/${targetId || Date.now()}`;
  const result = await openPullRequest({
    founderId,
    owner,
    repo,
    branchName,
    baseBranch: baseBranch || DEFAULT_STAGING_BRANCH,
    filePath,
    fileContent,
    commitMessage: `AI Developer: ${taskDescription.slice(0, 72)}`,
    title: `AI Developer: ${taskDescription.slice(0, 72)}`,
    body: `Opened autonomously by AI Developer.\n\nTask: ${taskDescription}`,
  });
  return { ...result, fileContent };
}

async function executeGithubMergeStaging({ founderId, payload }) {
  const { owner, repo, prNumber } = payload || {};
  if (!owner || !repo || !prNumber) {
    throw new Error("deploy_staging requires owner, repo, and prNumber in payload.");
  }
  return mergePullRequest({ founderId, owner, repo, prNumber, commitMessage: "AI Developer: merge to staging" });
}

async function executeGithubMergeMain({ founderId, payload }) {
  const { owner, repo, baseBranch, prodBranch } = payload || {};
  if (!owner || !repo) {
    throw new Error("deploy_prod requires owner and repo in payload.");
  }
  return mergeBranches({
    founderId,
    owner,
    repo,
    base: prodBranch || DEFAULT_PROD_BRANCH,
    head: baseBranch || DEFAULT_STAGING_BRANCH,
    commitMessage: "AI Developer: promote staging to production (human-approved)",
  });
}

const README_CANDIDATES = ["README.md", "Readme.md", "readme.md", "README.MD"];
const CONTENT_CHAR_LIMIT = 4000;
const PATCH_CHAR_LIMIT = 1200;
const MAX_PR_FILES = 6;

/**
 * Real repo content for AI PM — read-only, no side effects, so it always
 * executes immediately (see coreAgentSeeds.js's riskCategory for this one).
 * Truncates aggressively: this result gets fed back into a second real
 * chatCompletion call (see agentChat.controller.js), and an untruncated
 * README or a PR with many large diffs could blow well past a reasonable
 * token budget for that follow-up call.
 */
async function executeReadRepoContent({ founderId, payload }) {
  const { owner, repo, target, prNumber, path } = payload || {};
  if (!owner || !repo || !target) {
    throw new Error("read_repo_content requires owner, repo, and target.");
  }
  if (target === "readme") {
    for (const candidate of README_CANDIDATES) {
      const file = await getFileContent({ founderId, owner, repo, path: candidate });
      if (file) {
        return { target, found: true, path: file.path, content: file.content.slice(0, CONTENT_CHAR_LIMIT), truncated: file.content.length > CONTENT_CHAR_LIMIT };
      }
    }
    return { target, found: false };
  }
  if (target === "file") {
    if (!path) throw new Error("read_repo_content with target \"file\" requires a path.");
    const file = await getFileContent({ founderId, owner, repo, path });
    if (!file) return { target, found: false, path };
    return { target, found: true, path: file.path, content: file.content.slice(0, CONTENT_CHAR_LIMIT), truncated: file.content.length > CONTENT_CHAR_LIMIT };
  }
  if (target === "pr") {
    if (!prNumber) throw new Error("read_repo_content with target \"pr\" requires prNumber.");
    const files = await getPullRequestFiles({ founderId, owner, repo, prNumber });
    return {
      target, found: files.length > 0, prNumber,
      files: files.slice(0, MAX_PR_FILES).map((f) => ({ ...f, patch: f.patch.slice(0, PATCH_CHAR_LIMIT) })),
      moreFiles: Math.max(0, files.length - MAX_PR_FILES),
    };
  }
  throw new Error(`read_repo_content: unknown target "${target}" (expected "readme", "file", or "pr").`);
}

/**
 * Turns an approved sprint plan into real Milestone/Task documents — the
 * same models and shape founders.controller.js's own createMilestone/
 * createTask use, so the result shows up in the real Execution Engine, not
 * a parallel system. `payload.milestones` is
 * `[{ title, description, tasks: [{ title, description }] }]`, produced by
 * AI Product Manager's chat (see agentChat.controller.js) once a plan is
 * concrete enough to propose — this executor only ever runs after a human
 * has approved it (propose_sprint_plan is ask_first, not autonomous).
 */
async function executeProposeSprintPlan({ founderId, payload }) {
  const milestones = Array.isArray(payload?.milestones) ? payload.milestones : [];
  if (milestones.length === 0) {
    throw new Error("propose_sprint_plan requires a non-empty milestones array.");
  }
  const startup = await Startup.findOne({ founderId });
  if (!startup) {
    throw new Error("No startup found for this founder — create a startup before proposing a sprint plan.");
  }

  let sequence = (await Milestone.countDocuments({ founderId, startupId: startup._id })) + 1;
  const created = [];

  for (const m of milestones) {
    const title = String(m?.title || "").trim().slice(0, 200);
    if (!title) continue;
    const milestone = await Milestone.create({
      founderId,
      startupId: startup._id,
      title,
      description: String(m?.description || "").slice(0, 5000),
      weeklyOutcomeId: payload?.weeklyOutcomeId || null,
      sequence: sequence++,
      status: "pending",
    });

    const tasks = [];
    for (const t of Array.isArray(m?.tasks) ? m.tasks : []) {
      const taskTitle = String(t?.title || "").trim().slice(0, 200);
      if (!taskTitle) continue;
      const task = await Task.create({
        founderId,
        startupId: startup._id,
        title: taskTitle,
        description: String(t?.description || "").slice(0, 5000),
        status: "pending",
        milestoneId: milestone._id,
        buildTask: Boolean(t?.buildTask),
        buildFilePath: String(t?.filePath || "").trim().slice(0, 500),
      });
      tasks.push({ id: String(task._id), title: task.title });
    }
    created.push({ id: String(milestone._id), title: milestone.title, tasks });
  }

  if (created.length === 0) {
    throw new Error("No valid milestones in the proposed plan (every milestone needs at least a title).");
  }
  return { milestones: created };
}

/**
 * Real task/milestone/goal management for AI PM — docs/ai-agent-roadmap.md
 * Phase 3. Before this, AI PM could only ever *create* things (a sprint
 * plan), never edit or remove anything that already existed — it said so
 * honestly when asked. These four executors reuse the exact same validation
 * `founders.controller.js`'s own human-facing endpoints already enforce
 * (`validateTaskStatusTransition`, `validateBlockedTaskPayload`,
 * `syncMilestoneCounters`, the model's own `ensureOutcomeMutable` guard),
 * not a parallel, looser implementation — a bad transition or an edit to a
 * finalized week fails the same real way here as it does from the UI.
 */
async function executeUpdateTask({ founderId, payload }) {
  const { taskId, updates } = payload || {};
  if (!taskId || !updates || typeof updates !== "object") {
    throw new Error("update_task requires taskId and an updates object.");
  }
  const existingTask = await Task.findOne({ _id: taskId, founderId });
  if (!existingTask) throw new Error("Task not found.");

  const blockedValidation = validateBlockedTaskPayload(updates);
  if (!blockedValidation.ok) throw new Error(blockedValidation.message);
  if (updates.status) {
    const transition = validateTaskStatusTransition(existingTask.status, updates.status);
    if (!transition.ok) throw new Error(transition.message);
  }

  // Same whitelist founders.controller.js's own updateTask enforces — never
  // a wider surface just because the caller here is an agent, not a human.
  const allowed = {};
  if (updates.title) allowed.title = String(updates.title).trim().slice(0, 200);
  if (Object.prototype.hasOwnProperty.call(updates, "description")) allowed.description = String(updates.description ?? "").slice(0, 5000);
  if (updates.status) allowed.status = updates.status;
  if (Object.prototype.hasOwnProperty.call(updates, "assignedTo")) allowed.assignedTo = updates.assignedTo || null;
  if (Object.prototype.hasOwnProperty.call(updates, "assignedToName")) allowed.assignedToName = String(updates.assignedToName ?? "").slice(0, 200);
  if (updates.priority) allowed.priority = String(updates.priority).toLowerCase();
  if (Object.prototype.hasOwnProperty.call(updates, "blockerReason")) allowed.blockerReason = String(updates.blockerReason ?? "").slice(0, 1000);
  if (Object.prototype.hasOwnProperty.call(updates, "blockerNote")) allowed.blockerNote = String(updates.blockerNote ?? "").slice(0, 1000);

  const updatedTask = await Task.findOneAndUpdate({ _id: taskId, founderId }, allowed, { new: true, runValidators: true });
  await syncMilestoneCounters(existingTask.milestoneId);
  if (updatedTask.startupId) {
    emitRealtime(SOCKET_EVENTS.TASK_UPDATED, updatedTask, [startupRoom(updatedTask.startupId)]);
  }
  return { taskId: String(updatedTask._id), title: updatedTask.title, status: updatedTask.status };
}

async function executeDeleteTask({ founderId, payload }) {
  const { taskId } = payload || {};
  if (!taskId) throw new Error("delete_task requires taskId.");
  const deleted = await Task.findOneAndDelete({ _id: taskId, founderId });
  if (!deleted) throw new Error("Task not found.");
  await syncMilestoneCounters(deleted.milestoneId);
  if (deleted.startupId) {
    emitRealtime(SOCKET_EVENTS.TASK_DELETED, { taskId: String(deleted._id), milestoneId: deleted.milestoneId ? String(deleted.milestoneId) : null, deleted: true }, [startupRoom(deleted.startupId)]);
  }
  return { taskId: String(deleted._id), title: deleted.title, deleted: true };
}

async function executeDeleteMilestone({ founderId, payload }) {
  const { milestoneId } = payload || {};
  if (!milestoneId) throw new Error("delete_milestone requires milestoneId.");
  const existing = await Milestone.findOne({ _id: milestoneId, founderId });
  if (!existing) throw new Error("Milestone not found.");
  if (existing.weeklyOutcomeId) {
    const outcome = await WeeklyOutcome.findOne({ _id: existing.weeklyOutcomeId, founderId });
    // Mirrors founders.controller.js's own deleteMilestone check exactly —
    // a milestone under a finalized week can't be removed retroactively.
    if (outcome && ["completed", "partial", "missed"].includes(outcome.status)) {
      throw new Error("This milestone's week is already finalized and can't be modified.");
    }
  }
  await Task.deleteMany({ milestoneId: existing._id, founderId });
  await Milestone.deleteOne({ _id: existing._id, founderId });
  return { milestoneId: String(existing._id), title: existing.title, deleted: true };
}

async function executeUpdateGoal({ founderId, payload }) {
  const { goal } = payload || {};
  const trimmedGoal = String(goal || "").trim();
  if (!trimmedGoal) throw new Error("update_goal requires a non-empty goal.");
  const active = await WeeklyOutcome.findOne({ founderId, status: "active" }).sort({ weekOf: -1 });
  if (!active) {
    throw new Error("No active weekly goal to edit yet — set one first from the Execution Engine.");
  }
  // WeeklyOutcome's own findOneAndUpdate pre-hook already rejects this if the
  // outcome was finalized between AI PM reading it and writing it — the same
  // real guard the model enforces for every caller, not re-implemented here.
  const updated = await WeeklyOutcome.findOneAndUpdate({ _id: active._id, founderId }, { goal: trimmedGoal.slice(0, 5000) }, { new: true, runValidators: true });
  return { weeklyOutcomeId: String(updated._id), goal: updated.goal };
}

const EXECUTORS = {
  github_open_pr: executeGithubOpenPr,
  github_merge_staging: executeGithubMergeStaging,
  github_merge_main: executeGithubMergeMain,
  propose_sprint_plan: executeProposeSprintPlan,
  update_task: executeUpdateTask,
  delete_task: executeDeleteTask,
  delete_milestone: executeDeleteMilestone,
  update_goal: executeUpdateGoal,
  read_repo_content: executeReadRepoContent,
};

export function hasExecutor(actionKey) {
  return Boolean(EXECUTORS[actionKey]);
}

export async function runExecutor(actionKey, event) {
  const fn = EXECUTORS[actionKey];
  if (!fn) throw new Error(`No executor registered for action key "${actionKey}".`);
  return fn(event);
}
