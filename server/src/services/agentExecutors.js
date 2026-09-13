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
import { openPullRequest, mergePullRequest, mergeBranches } from "./githubAdapter.js";
import { draftText, deepseekConfigured } from "./deepseekClient.js";
import Startup from "../models/Startup.js";
import Milestone from "../models/Milestone.js";
import Task from "../models/Task.js";

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

const EXECUTORS = {
  github_open_pr: executeGithubOpenPr,
  github_merge_staging: executeGithubMergeStaging,
  github_merge_main: executeGithubMergeMain,
  propose_sprint_plan: executeProposeSprintPlan,
};

export function hasExecutor(actionKey) {
  return Boolean(EXECUTORS[actionKey]);
}

export async function runExecutor(actionKey, event) {
  const fn = EXECUTORS[actionKey];
  if (!fn) throw new Error(`No executor registered for action key "${actionKey}".`);
  return fn(event);
}
