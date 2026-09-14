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
import { openPullRequest, mergePullRequest, mergeBranches, getFileContent, getPullRequestFiles, ensureGithubPagesEnabled, updateFileContent } from "./githubAdapter.js";
import { draftText, deepseekConfigured } from "./deepseekClient.js";
import Startup from "../models/Startup.js";
import Milestone from "../models/Milestone.js";
import Task from "../models/Task.js";
import WeeklyOutcome from "../models/WeeklyOutcome.js";
import AgentEvent from "../models/AgentEvent.js";
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
- If the task description is ambiguous or missing information you'd need, write the most reasonable, minimal, honest interpretation rather than guessing elaborately or padding with speculative features.

When the file is a web page (HTML/CSS), design it like a real modern product, not a plain document — a founder found a real past output "too plain" and that's a real bar to clear, not a style preference:
- **Typography carries most of the design.** Use a real type scale, not one size everywhere: a hero headline should be dramatically larger (2.5–4rem) and bolder than body text (1rem, comfortable 1.6 line-height). Vary weight (700+ for headings, 400 for body) and color depth (near-black for headings, a mid-gray for supporting text) to create real hierarchy at a glance.
- **Color needs real depth, not just black on white.** Pick one real accent color (a specific hex, not "blue") used deliberately — a headline word, a button, an icon accent — plus one or two neutral tones for backgrounds/sections (e.g. a very light gray or tinted section behind part of the page, not pure white end to end). Real contrast, but never flat.
- **Real spacing rhythm**, not cramped or arbitrary: pick a consistent scale (e.g. multiples of 8px — 8/16/24/32/48/64/96) and stick to it for padding, gaps, and section breaks. Generous whitespace around a hero section reads as premium; cramped, inconsistent spacing reads as a first draft.
- **Break the single-centered-column look.** Not every section should be centered text in one narrow column — use real layout: a two-column hero (text + a visual element), a grid of cards for features, alternating alignment between sections. Visual variety across sections is what separates a real product page from a plain document.
- **No stock photography** — you have no way to source a real, relevant photo, and a wrong or generic stock image looks worse than none. Build visual interest instead with color, gradients (e.g. a subtle radial or linear gradient behind a hero section), simple geometric shapes, or icons — all achievable in pure CSS with no external files.
- **Real icons via inline SVG**, not images or icon-font CDNs (which need a network request this self-contained file shouldn't depend on). Write simple, clean inline \`<svg>\` elements with \`viewBox="0 0 24 24"\` and \`stroke="currentColor"\` \`fill="none"\` \`stroke-width="2"\` (matching common line-icon sets like Feather/Lucide) for concepts like a checkmark, arrow, envelope, or shield — reuse this exact style consistently across every icon on the page rather than inventing a different visual style each time.
- **Real responsive behavior**, not just "it happens to fit": use relative units and \`clamp()\` for fluid type sizing (e.g. \`clamp(2rem, 5vw, 3.5rem)\` for a hero headline), and at least one real \`@media\` breakpoint (~640px) that meaningfully changes layout for mobile (stacking a two-column section, reducing padding) — don't just rely on things naturally reflowing.
- The failure mode to actively avoid: a single centered column of plain black-on-white text with no color accent, no icons, no visual texture, and identical spacing everywhere. If what you're about to write matches that description, revise it before finishing.`;

/**
 * Real contamination confirmed live, 2026-09-14: despite
 * AI_DEVELOPER_SYSTEM_PROMPT explicitly saying "no commentary, no code
 * fences," DeepSeek can still preface real HTML output with a narration
 * sentence ("Here's the complete self-contained HTML file you asked
 * for...") and a markdown code fence before the real `<!DOCTYPE html>` —
 * confirmed by reading two real past PRs where exactly this shipped
 * straight into a founder's real index.html and broke the page. A prompt
 * instruction alone isn't sufficient here — the model doesn't reliably
 * follow it — so this is a real structural guard: find the real document
 * boundaries and discard anything outside them, for HTML files where those
 * boundaries are unambiguous; strip a leading fence for anything else.
 */
function sanitizeDraftedFileContent(raw, filePath) {
  let content = raw;
  const isHtml = /\.html?$/i.test(filePath || "");

  if (isHtml) {
    const docStart = content.search(/<!doctype\s+html/i);
    const htmlStart = content.search(/<html[\s>]/i);
    const realStart = docStart >= 0 ? docStart : htmlStart;
    if (realStart > 0) content = content.slice(realStart);

    const docEnd = content.search(/<\/html\s*>/i);
    if (docEnd >= 0) content = content.slice(0, docEnd + "</html>".length);
  } else {
    // Generic safety net for any other file type: a leading fence (with or
    // without a language tag), preceded only by narration, within roughly
    // the first 400 characters — never legitimate content that early in a
    // real file.
    const leadingFence = content.match(/^[\s\S]{0,400}?```[a-zA-Z]*\r?\n/);
    if (leadingFence) content = content.slice(leadingFence[0].length);
    content = content.replace(/\r?\n```\s*$/, "");
  }

  return content.trim();
}

async function executeGithubOpenPr({ founderId, payload, targetId }) {
  const { owner, repo, filePath, taskDescription, baseBranch } = payload || {};
  if (!owner || !repo || !filePath || !taskDescription) {
    throw new Error("write_code requires owner, repo, filePath, and taskDescription in payload.");
  }
  // Real finding from live testing: draftText's own default (1200, sized
  // long before this executor existed) was too small for an actual file a
  // founder would want — a real landing page hit the length limit even
  // after the empty-content retry escalated 1200 -> 2400. Real code/markup
  // needs more headroom than a short chat reply; 4000 gives real room for
  // a genuine file, with retry escalation (see deepseekClient.js) still
  // able to go to 8000 if a single generation is unusually large.
  const rawDraft = deepseekConfigured()
    ? await draftText({
        systemPrompt: AI_DEVELOPER_SYSTEM_PROMPT,
        userPrompt: `File path: ${filePath}\n\nTask: ${taskDescription}`,
        maxTokens: 4000,
      })
    : `# ${taskDescription}\n\n(DeepSeek not configured — placeholder content, not real drafting.)\n`;

  // Real bug found live: draftText can come back empty (see deepseekClient.js's
  // retry-with-escalated-budget fix) even after that retry — and this code
  // used to open a real PR anyway, silently shipping an empty file all the
  // way to production with no error, no warning, nothing for the founder to
  // notice except an actually-blank live page. Never write real code from an
  // empty draft — fail loudly here instead, so the founder sees a real
  // "failed" status and a clear reason, and can just ask AI Developer to
  // retry, instead of an invisible empty file quietly going live.
  if (!rawDraft.trim()) {
    throw new Error(`AI Developer's drafting call for "${filePath}" came back empty — nothing was written, so no PR was opened. Try asking again.`);
  }

  const fileContent = sanitizeDraftedFileContent(rawDraft, filePath);

  // Real bug found live: a genuinely truncated generation (cut off mid-CSS
  // rule, no closing tags at all) previously shipped as a real "success" —
  // the file merely had to be non-empty, not actually complete. Confirmed
  // live twice: real files that ended mid `h1 { font-size: ...` declaration
  // reached production with status autonomous_completed. For HTML, "real
  // and complete" is checkable: it must have a real document start and a
  // real `</html>` close after sanitizing (which only trims contamination
  // outside those boundaries — a genuinely truncated file has no closing
  // tag to trim to at all, so this still fails loudly for that case).
  if (/\.html?$/i.test(filePath) && !/<\/html\s*>\s*$/i.test(fileContent)) {
    throw new Error(`AI Developer's drafting call for "${filePath}" came back incomplete (no closing </html> found) — nothing was written, so no PR was opened. Try asking again.`);
  }

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

/**
 * AI PM's real design-review pass (2026-09-14) — a genuine second AI
 * opinion reading AI Developer's actual written code, looking specifically
 * for the "plain, template-y" failure mode a real founder flagged, plus
 * obvious structural issues. Honest about what this is and isn't: a real
 * AI reading real source text, not code that was ever executed or
 * rendered — it can judge whether the markup/CSS *describes* good design,
 * not confirm how it actually looks rendered (no screenshot pipeline
 * exists for that; visual-render review stays a future build).
 * Read-only — no side effects of its own, always executes immediately.
 */
const AI_PM_REVIEW_SYSTEM_PROMPT = `You are AI Product Manager, reviewing real code AI Developer just wrote before it ships toward production. Be a real critic — vague praise or vague criticism helps no one.

Judge two things:
1. Design quality: real typographic hierarchy (varied size/weight, not one size everywhere), real color depth (not just black text on white), a real spacing rhythm, genuine layout variety (not one centered column top to bottom), real icons if the content calls for them. The failure mode to catch: a plain, template-y page with no visual texture.
2. Structural correctness: obviously broken or incomplete markup, missing required content from the task, real accessibility basics (alt text, form labels, real color contrast).

Respond with ONLY a JSON object, nothing else, no markdown fence:
{"verdict":"approve","feedback":""}
or
{"verdict":"revise","feedback":"..."}

Use "revise" only for a real, specific, fixable problem — put the exact, concrete change needed in "feedback" ("the hero heading needs a real size jump — make it at least 2.5rem and bold, currently it's the same size as body text" — not "make it look nicer"). Don't revise minor taste preferences with no real impact. This is a real quality bar a founder would be embarrassed to ship below, not your personal aesthetic.`;

async function executeReviewDevWork({ payload }) {
  const { fileContent, taskDescription, filePath } = payload || {};
  if (!fileContent || !taskDescription) {
    throw new Error("review_dev_work requires fileContent and taskDescription.");
  }
  if (!deepseekConfigured()) {
    return { verdict: "approve", feedback: "", note: "DeepSeek not configured — review skipped." };
  }
  const raw = await draftText({
    systemPrompt: AI_PM_REVIEW_SYSTEM_PROMPT,
    userPrompt: `File: ${filePath}\n\nTask it was meant to accomplish: ${taskDescription}\n\nReal file content to review:\n\n${fileContent}`,
    maxTokens: 800,
  });
  let parsed = null;
  try {
    parsed = JSON.parse(raw.trim().replace(/^```(json)?\s*/i, "").replace(/```\s*$/, ""));
  } catch {
    parsed = null;
  }
  // A malformed or unparseable review response fails open (approve) rather
  // than blocking the whole pipeline on a formatting hiccup — this is a
  // real quality gate, not a security one, so availability wins the tie.
  if (!parsed || !["approve", "revise"].includes(parsed.verdict)) {
    return { verdict: "approve", feedback: "", note: "Review response could not be parsed as real JSON; proceeding without blocking." };
  }
  return { verdict: parsed.verdict, feedback: String(parsed.feedback || "").slice(0, 2000) };
}

/**
 * AI Developer revising its own real file on the SAME already-open PR/
 * branch, in response to AI PM's real review feedback — the piece that
 * makes the review above actually matter instead of being commentary
 * nobody acts on. Reuses the exact same drafting system prompt/instincts
 * as the original write, plus the real previous draft and the real
 * feedback, so it improves rather than starts over blind.
 */
async function executeReviseFile({ founderId, payload }) {
  const { owner, repo, branch, filePath, taskDescription, feedback, currentContent } = payload || {};
  if (!owner || !repo || !branch || !filePath || !taskDescription || !feedback || !currentContent) {
    throw new Error("revise_file requires owner, repo, branch, filePath, taskDescription, feedback, and currentContent.");
  }
  const rawRevision = await draftText({
    systemPrompt: AI_DEVELOPER_SYSTEM_PROMPT,
    userPrompt: `File path: ${filePath}\n\nOriginal task: ${taskDescription}\n\nYour previous draft of this file:\n\n${currentContent}\n\nReal review feedback from AI Product Manager — revise the file to address this specifically, keeping everything that already works:\n\n${feedback}`,
    maxTokens: 4000,
  });
  if (!rawRevision.trim()) {
    throw new Error(`AI Developer's revision call for "${filePath}" came back empty — leaving the previous draft in place.`);
  }
  // Same real contamination/completeness guards as the original draft —
  // a revision is just as capable of shipping narration+fence junk or a
  // truncated document as the first draft was.
  const revisedContent = sanitizeDraftedFileContent(rawRevision, filePath);
  if (/\.html?$/i.test(filePath) && !/<\/html\s*>\s*$/i.test(revisedContent)) {
    throw new Error(`AI Developer's revision call for "${filePath}" came back incomplete (no closing </html> found) — leaving the previous draft in place.`);
  }
  const result = await updateFileContent({
    founderId, owner, repo, branch, filePath, fileContent: revisedContent,
    commitMessage: `AI Developer: revise ${filePath} per AI PM review`,
  });
  return { ...result, fileContent: revisedContent };
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
  const base = prodBranch || DEFAULT_PROD_BRANCH;
  const result = await mergeBranches({
    founderId,
    owner,
    repo,
    base,
    head: baseBranch || DEFAULT_STAGING_BRANCH,
    commitMessage: "AI Developer: promote staging to production (human-approved)",
  });

  // Real gap closed: until now, "deployed to production" only ever meant a
  // git branch got updated — there was no actual hosting anywhere, so a
  // founder had no real way to click through and see what was built.
  // Best-effort: a Pages hiccup (e.g. a private repo on a plan that doesn't
  // support it) must never fail the real deploy that already succeeded.
  try {
    const pages = await ensureGithubPagesEnabled({ founderId, owner, repo, branch: base });
    result.pagesUrl = pages.url;
  } catch (err) {
    result.pagesError = err.message;
  }

  return result;
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
 * Surfaces AI Developer's own real record of a specific past action — zero
 * GitHub calls needed, unlike read_repo_content above: the real file
 * content it wrote is already sitting in that github_open_pr event's own
 * `result.fileContent` (has been since Phase 1), just never exposed to AI
 * PM's context before. Read-only, no side effects.
 */
async function executeExplainDevWork({ founderId, payload }) {
  const { eventId } = payload || {};
  if (!eventId) throw new Error("explain_dev_work requires eventId.");
  const event = await AgentEvent.findById(eventId).populate({ path: "actionTypeId", select: "actionKey label agentId", populate: { path: "agentId", select: "agentKey" } }).lean();
  if (!event || String(event.founderId) !== String(founderId) || event.actionTypeId?.agentId?.agentKey !== "dev") {
    return { found: false };
  }
  return {
    found: true,
    actionLabel: event.actionTypeId?.label || event.targetType,
    taskDescription: event.payload?.taskDescription || null,
    filePath: event.payload?.filePath || null,
    fileContent: event.result?.fileContent || null,
    prUrl: event.result?.prUrl || null,
    prNumber: event.result?.prNumber || null,
    // Real gap found live: asked about a specific production-deploy event,
    // this had no way to say whether a real live URL exists — pagesUrl/
    // pagesError were sitting in the event's own result the whole time.
    pagesUrl: event.result?.pagesUrl || null,
    pagesError: event.result?.pagesError || null,
    status: event.status,
    error: event.status === "failed" ? (event.result?.error || null) : null,
  };
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
 * Adds real tasks to an *already-existing* milestone — the lighter-weight
 * sibling of executeProposeSprintPlan above, added 2026-09-14 for AI PM's
 * continuous-planning check-in: once AI Developer's build queue is empty,
 * there's often more real work to add under the current week's plan
 * without inventing a whole new milestone/goal. Reuses the exact same
 * Task-creation shape; the one real difference is the milestone must
 * already exist and belong to this founder — never created here.
 */
async function executeAddTasks({ founderId, payload }) {
  const { milestoneId, tasks } = payload || {};
  if (!milestoneId) throw new Error("add_tasks requires a milestoneId.");
  const milestone = await Milestone.findOne({ _id: milestoneId, founderId });
  if (!milestone) throw new Error("No real milestone found with that id for this founder.");

  const list = Array.isArray(tasks) ? tasks : [];
  const created = [];
  for (const t of list) {
    const title = String(t?.title || "").trim().slice(0, 200);
    if (!title) continue;
    const task = await Task.create({
      founderId,
      startupId: milestone.startupId,
      title,
      description: String(t?.description || "").slice(0, 5000),
      status: "pending",
      milestoneId: milestone._id,
      buildTask: Boolean(t?.buildTask),
      buildFilePath: String(t?.filePath || "").trim().slice(0, 500),
    });
    created.push({ id: String(task._id), title: task.title });
  }
  if (created.length === 0) {
    throw new Error("No valid tasks in the add_tasks payload (every task needs at least a title).");
  }
  await syncMilestoneCounters(milestone._id);
  return { milestoneId: String(milestone._id), milestoneTitle: milestone.title, tasks: created };
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
  explain_dev_work: executeExplainDevWork,
  add_tasks: executeAddTasks,
  review_dev_work: executeReviewDevWork,
  revise_file: executeReviseFile,
};

export function hasExecutor(actionKey) {
  return Boolean(EXECUTORS[actionKey]);
}

export async function runExecutor(actionKey, event) {
  const fn = EXECUTORS[actionKey];
  if (!fn) throw new Error(`No executor registered for action key "${actionKey}".`);
  return fn(event);
}
