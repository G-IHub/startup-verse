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

const EXECUTORS = {
  github_open_pr: executeGithubOpenPr,
  github_merge_staging: executeGithubMergeStaging,
  github_merge_main: executeGithubMergeMain,
};

export function hasExecutor(actionKey) {
  return Boolean(EXECUTORS[actionKey]);
}

export async function runExecutor(actionKey, event) {
  const fn = EXECUTORS[actionKey];
  if (!fn) throw new Error(`No executor registered for action key "${actionKey}".`);
  return fn(event);
}
