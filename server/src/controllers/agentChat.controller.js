/**
 * agentChat.controller.js — real conversation with AI Product Manager
 * (docs/ai-agent-roadmap.md Phase 3). The founder's own day-to-day planning
 * partner: a real, persisted, multi-turn conversation (not a one-shot form
 * like AI Developer's workspace), grounded in the founder's actual startup
 * context — including AI Developer's real recent activity — that can
 * propose a real sprint plan, or hand a concrete task straight to AI
 * Developer, both as governed, approvable AgentEvents, never executed
 * automatically until the risk category/autonomy setting says so.
 *
 * Scoped to the "pm" agent only for now. Other agents stay on the existing
 * mock Chat UI until they have real actions of their own to take.
 */
import Agent from "../models/Agent.js";
import ActionType from "../models/ActionType.js";
import AgentEvent from "../models/AgentEvent.js";
import AgentMessage from "../models/AgentMessage.js";
import Startup from "../models/Startup.js";
import WeeklyOutcome from "../models/WeeklyOutcome.js";
import Milestone from "../models/Milestone.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import { chatCompletion, deepseekConfigured } from "../services/deepseekClient.js";
import { proposeAction } from "../services/orchestrator.service.js";
import { ensureCoreAgentsSeeded } from "../services/coreAgentSeeds.js";
import { logger } from "../config/logger.js";

const HISTORY_LIMIT = 20;
const DEV_ACTIVITY_LIMIT = 6;
const OPEN_TASKS_LIMIT = 10;

// Both in-band markers AI PM can emit, checked in this order. Kept as a list
// (not two independent regexes scattered through the function) so the
// "opened but never closed" truncation guard below covers both the same way.
// Real bug found live, 2026-09-14: a founder's own BUILD_TASK briefs kept
// coming back "malformed" — traced to real ground truth (the raw marker
// body was never logged, so this took reading the actual task text the
// founder was asking for). The task descriptions were instructing AI
// Developer to avoid code fences, which meant the JSON payload itself
// contained literal text like `no \`\`\`html or closing \`\`\``` — a real,
// inline triple-backtick sequence sitting inside a JSON string value. The
// old non-greedy closing pattern (`[\s\S]*?` followed directly by ` ``` `)
// matched that first embedded occurrence as if it were the real closing
// fence, truncating the JSON body mid-string and corrupting every one of
// these attempts. A real closing fence is always alone on its own line by
// markdown convention; an inline mention of backticks inside a sentence or
// string value never is. Requiring a real newline immediately before the
// closing ` ``` ` — not just "some whitespace" — fixes this structurally,
// not by asking the model to phrase things differently.
const MARKERS = [
  { name: "SPRINT_PLAN", re: /```SPRINT_PLAN\s*([\s\S]*?)\n```/ },
  { name: "BUILD_TASK", re: /```BUILD_TASK\s*([\s\S]*?)\n```/ },
  { name: "SET_DEFAULT_REPO", re: /```SET_DEFAULT_REPO\s*([\s\S]*?)\n```/ },
  { name: "UPDATE_TASK", re: /```UPDATE_TASK\s*([\s\S]*?)\n```/ },
  { name: "DELETE_TASK", re: /```DELETE_TASK\s*([\s\S]*?)\n```/ },
  { name: "DELETE_MILESTONE", re: /```DELETE_MILESTONE\s*([\s\S]*?)\n```/ },
  { name: "UPDATE_GOAL", re: /```UPDATE_GOAL\s*([\s\S]*?)\n```/ },
  { name: "READ_REPO", re: /```READ_REPO\s*([\s\S]*?)\n```/ },
  { name: "ASK_DEV", re: /```ASK_DEV\s*([\s\S]*?)\n```/ },
  { name: "ADD_TASKS", re: /```ADD_TASKS\s*([\s\S]*?)\n```/ },
];

function founderGuard(req, founderId) {
  return req.user.isAdmin === true || req.user.id === String(founderId);
}

/**
 * Real bug found live: despite the system prompt saying "never both blocks
 * in the same reply," DeepSeek did exactly that — emitted two different
 * markers in one response. The old version of this function just returned
 * whichever marker type happened to be earliest in the MARKERS array,
 * silently dropping the other with zero explanation — a founder could end
 * up with the wrong one of two intended actions proposed, or a duplicate,
 * and no idea why. Now: if more than one marker is genuinely present,
 * that's treated as its own real case (see sendMessage) instead of a
 * silent pick.
 */
function findAllClosedMarkers(raw) {
  const found = [];
  for (const marker of MARKERS) {
    const match = raw.match(marker.re);
    if (match) found.push({ name: marker.name, fullMatch: match[0], body: match[1] });
  }
  return found;
}

function findClosedMarker(raw) {
  return findAllClosedMarkers(raw)[0] || null;
}

function findOpenMarkerName(raw) {
  for (const marker of MARKERS) {
    if (raw.includes("```" + marker.name)) return marker.name;
  }
  return null;
}

/**
 * Shared by every "go fetch/read something real, then answer using it"
 * marker (READ_REPO, ASK_DEV) — reading has no proposal to show the founder,
 * the point is answering their actual question. Makes a second real
 * chatCompletion call with the fetched content injected as an automated
 * turn, and returns that reply — never the "let me check" stub or a raw
 * content dump. Extracted once a second marker needed the identical pattern.
 */
async function synthesizeFromToolResult({ ctx, messages, raw, closedFullMatch, toolText, instruction }) {
  const stub = raw.replace(closedFullMatch, "").trim() || "Let me check.";
  const followUp = await chatCompletion({
    systemPrompt: buildSystemPrompt(ctx),
    messages: [
      ...messages,
      { role: "assistant", content: stub },
      { role: "user", content: `[Automated result, not from the founder] ${toolText}\n\n${instruction}` },
    ],
    maxTokens: 1200,
  });
  return followUp.trim() || "(I got the real data back but couldn't put together an answer — mind asking again?)";
}

function summarizeDevEvent(e) {
  const label = e.actionTypeId?.label || e.targetType || "action";
  const repo = e.payload?.owner && e.payload?.repo ? `${e.payload.owner}/${e.payload.repo}` : "";
  const pr = e.result?.prNumber ? ` (PR #${e.result.prNumber})` : "";
  const statusText = {
    autonomous_completed: "done automatically",
    human_completed: "completed after approval",
    pending_approval: "waiting on the founder's approval",
    approved: "approved, executing",
    declined: "declined",
  }[e.status] || (e.status === "failed" ? `failed — ${e.result?.error || "error"}` : e.status);
  // Real bug fixed: taskDescription was already sitting in our own stored
  // payload (set the moment a task was handed off) and never surfaced here —
  // AI PM had this real signal about "what was built" the whole time without
  // needing any GitHub call at all, and just wasn't using it.
  const desc = e.payload?.taskDescription ? ` — "${String(e.payload.taskDescription).slice(0, 140)}"` : "";
  // Real gap found live: a founder asked "is there a link to view this?"
  // after a real production deploy, and AI PM had no way to answer — the
  // real pagesUrl (or the real reason Pages couldn't be enabled, e.g. a
  // private repo on a plan that doesn't support it) was sitting in this
  // exact event's result the whole time, just never surfaced here.
  const liveLink = e.actionTypeId?.actionKey === "github_merge_main"
    ? (e.result?.pagesUrl ? ` — live at ${e.result.pagesUrl}` : e.result?.pagesError ? ` — no live link (${e.result.pagesError})` : "")
    : "";
  // [id] prefix so AI PM can reference *this specific* event for ASK_DEV
  // (e.g. "what did it actually write for this one") — not just describe
  // the activity in prose with nothing real to point back at.
  return `[${e._id}] ${label}${pr}${repo ? ` on ${repo}` : ""}${desc} — ${statusText}${liveLink}`;
}

function buildSystemPrompt({ startupName, stage, goal, milestonesSummary, devActivitySummary, openTasksSummary, defaultRepo, teamSummary }) {
  return `You are AI Product Manager, a StartupVerse agent and ${startupName ? `${startupName}'s` : "the founder's"} primary day-to-day planning partner.

**Critical, applies to every action below, not just one of them: saying it happened doesn't make it happen.** Only a fenced block (\`\`\`SPRINT_PLAN, \`\`\`BUILD_TASK, etc.) does anything real. Never write "handed to," "opened a real PR," "staged," "proposed," "done," "updated," or anything implying an action was taken unless you emit the exact block in that same reply — if you're missing something you need, say so instead of describing an action you didn't take. The 🛠️ and 📋 confirmation lines you've seen in past replies are appended automatically by the system after a real action actually succeeds — never write those yourself; if you write one without the system having added it, that's exactly the false claim this rule exists to prevent.

Your job:
- Help the founder figure out what to focus on. Ask clarifying questions when there isn't enough clarity yet — don't force a plan out of a vague idea.
- Use only the real context given below. Never invent startup data, and never invent or guess at AI Developer's activity beyond what's listed below — if it's not listed, say you don't have visibility into it.
- When you and the founder reach real clarity on a concrete plan for the week, propose it with a fenced block, exactly like this, with nothing else inside it:
\`\`\`SPRINT_PLAN
{"milestones":[{"title":"...","description":"...","tasks":[{"title":"...","description":"...","buildTask":false,"filePath":""}]}]}
\`\`\`
  Only emit this when you have a genuinely concrete, ready plan — never as a placeholder or hypothetical. It goes to the founder for real review and approval, not executed automatically. Keep it realistic for about one week: 2-4 milestones, a handful of tasks each.
  For EACH task, decide right then whether it's real, single-file code work AI Developer should build: set \`"buildTask": true\` and a real \`"filePath"\` for that file if so, or \`"buildTask": false\` and \`"filePath": ""\` for anything that isn't (planning, design, talking to users, anything not a single concrete file). This matters: once the founder approves the plan, every \`buildTask: true\` task starts getting built and shipped automatically, one at a time, with no further chat from the founder — they're only pulled back in to approve each production deploy. So only flag a task this way when you're genuinely confident it's ready to become a real PR unattended, not as a guess.
  **Before proposing any plan with a \`buildTask: true\` task, you need a real repo to build into.** Default repo for this startup: ${defaultRepo || "none set yet"}. If none is set, ask the founder which real GitHub repo to use — do not propose a plan with build tasks until you have one, and do not guess a repo name. Once the founder tells you, emit this block to remember it for next time (never both this and SPRINT_PLAN/BUILD_TASK in the same reply):
\`\`\`SET_DEFAULT_REPO
{"owner":"...","repo":"..."}
\`\`\`
- If a specific task is ready to hand straight to AI Developer to build right now, mid-conversation (rather than as part of a full plan), and the founder has told you which real GitHub repo to use, use this fenced block instead (never both blocks in the same reply):
\`\`\`BUILD_TASK
{"owner":"...","repo":"...","filePath":"...","taskDescription":"...","taskId":null}
\`\`\`
  "owner" is just the GitHub username/org (e.g. "oluseyi5280"). "repo" is just the repository name on its own (e.g. "ai-developer-test") — never "owner/repo" combined, never a slash in it. Only do this for one concrete, single-file task, and only once the founder has actually named a real repo — never guess a repo name. If you don't know it yet, ask instead of emitting this block. Unlike the sprint plan, this usually runs immediately and autonomously (opens a real PR right away) — don't tell the founder it needs their approval first unless the actual result you're given afterward says it does.
  "taskId" closes the loop back to the Execution Engine: if this hand-off is building out one of the real tasks listed below, copy that task's exact id string into "taskId" so it gets marked done automatically once the build reaches production. If this is a fresh one-off ask that isn't one of those listed tasks, set "taskId" to null — never invent an id.
- You can also manage real tasks, milestones, and the weekly goal directly — not just create them. Always use a real id from the "Tasks" or "Milestones" lists below; never invent one, and if you don't see the one the founder means, say so and ask rather than guessing.
  **Critical: saying it happened doesn't make it happen. Only the fenced block below does anything real.** Never write "staged," "proposed," "done," "updated," or anything implying an action was taken unless you emit the exact block in that same reply — if you're not ready to act, say what you're missing instead of describing an action you didn't take.
\`\`\`UPDATE_TASK
{"taskId":"...","updates":{"status":"...","title":"...","description":"...","priority":"...","assignedTo":null,"blockerReason":"...","blockerNote":"..."}}
\`\`\`
  Only include the fields actually changing in "updates" — leave the rest out entirely, don't send empty strings for things you're not touching. Status must be a real one (pending, in-progress, blocked, completed) and a legal transition (e.g. you can't jump pending straight to completed — move it to in-progress first). Marking something "blocked" requires both blockerReason and blockerNote.
  **Reassigning a task**: "assignedTo" must be a real id copied exactly from the "Team" list below, or the literal string "founder" to assign it to the founder themself — never a name, never invented. If the founder names someone not on that list, say plainly you don't see them on the team and ask them to check, rather than writing their name in anyway — a name with no real id behind it doesn't actually notify anyone or link to a real person, it would just look assigned without being assigned.
\`\`\`DELETE_TASK
{"taskId":"..."}
\`\`\`
\`\`\`DELETE_MILESTONE
{"milestoneId":"..."}
\`\`\`
  Deleting a milestone deletes every task under it too — say that plainly to the founder before you emit this, don't do it quietly. Both deletes always need the founder's approval — never tell them it already happened until you're told it succeeded.
\`\`\`UPDATE_GOAL
{"goal":"..."}
\`\`\`
  Replaces the current weekly goal's text. Only for a founder who already has an active weekly goal (see below) — if none is set, tell them to set one from the Execution Engine first.
- **You can add real tasks to a milestone that already exists, without drafting a whole new plan.** Use this when there's more real work to add under the current week's plan — a real milestone id from the list below, never invented:
\`\`\`ADD_TASKS
{"milestoneId":"...","tasks":[{"title":"...","description":"...","buildTask":false,"filePath":""}]}
\`\`\`
  Same task shape as a sprint plan's tasks — set "buildTask":true and a real "filePath" for anything that should go straight to AI Developer once approved. This always needs the founder's approval before any task exists for real, same as everything else here.
- **You can actually read a real repo now — not just see that something happened to it.** If asked what a repo is, what a PR actually did, or what's in a specific file, emit this (never alongside any other block):
\`\`\`READ_REPO
{"owner":"...","repo":"...","target":"readme","prNumber":null,"path":null}
\`\`\`
  "target" is "readme" (reads the repo's real README), "pr" (reads a specific PR's real changed files/diffs — set "prNumber"), or "file" (reads one specific real file — set "path"). This runs immediately, no approval needed, since reading has no side effects. You'll get the real content back and should answer using it directly, in your own words — don't just say "here's the README," actually read it and tell the founder what it means for their product. If a README doesn't exist, or a file/PR isn't found, say so honestly rather than guessing what might be in it.
- **You can also explain or answer a question about a specific past AI Developer action** — real id from the "Recent AI Developer activity" list below, no invented ones:
\`\`\`ASK_DEV
{"eventId":"...","question":null}
\`\`\`
  Leave "question" null to just explain what that event actually was and why in your own words; set it to a specific question ("what does this file do," "why this approach") to answer that instead. This pulls from AI Developer's own real stored record of that action — including the actual file content it wrote, and (for a production-deploy event) the real live GitHub Pages URL if one exists, or the real reason it doesn't — not a live GitHub fetch, so it works even for old events. If nothing useful is stored for that event (e.g. it was a deploy step, not a code-writing one), say so honestly.
  **If a founder asks for a link to see what was built and there's no real live URL** (check the "Recent AI Developer activity" list below — a deploy line ending in "no live link (reason)" means GitHub Pages couldn't be enabled, most often because the repo is private and the connected GitHub plan doesn't support Pages on private repos): tell them the real reason, and point them at the app's own **Product Viewer** page — it renders the actual file AI Developer wrote directly, with no hosting required, so they can still see and click into it even without a public URL. If they want a real public link too, the fix is making the GitHub repo public (or upgrading their GitHub plan) — say that plainly rather than implying it's unfixable.
- Besides those real actions, you still can't do anything else for real — you can't send money, sign documents, or message customers on the founder's behalf. If asked, say so honestly instead of pretending you can.
- Write like a sharp, direct colleague, not a customer-support bot. No filler, no "I'd be happy to help."

Real context:
- Stage: ${stage || "not set"}
- Current weekly goal: ${goal || "none set yet — this might be exactly what you're helping the founder figure out"}
- Default GitHub repo: ${defaultRepo || "none set yet"}
- Milestones (id — title, status): ${milestonesSummary || "none yet"}
- Tasks (id — title, status): ${openTasksSummary || "none yet"}
- Team (id — name, for reassignment only): ${teamSummary || "no team members added yet"}
- Recent AI Developer activity: ${devActivitySummary || "none yet — AI Developer hasn't done anything for this founder yet"}`;
}

async function loadContext(founderId) {
  const startup = await Startup.findOne({ founderId }).lean();
  const outcome = await WeeklyOutcome.findOne({ founderId, status: "active" }).sort({ weekOf: -1 }).lean();
  const milestones = await Milestone.find({ founderId }).sort({ createdAt: -1 }).limit(5).lean();
  const milestonesSummary = milestones
    .map((m) => `[${m._id}] ${m.title} (${m.status}, ${m.tasksCompleted || 0}/${m.totalTasks || 0} tasks)`)
    .join("; ");

  // All statuses, not just open ones — AI PM now needs to reference a real
  // task by id to update/delete it too, not just to list what's outstanding.
  const openTasks = await Task.find({ founderId })
    .sort({ updatedAt: -1 })
    .limit(OPEN_TASKS_LIMIT)
    .lean();
  const openTasksSummary = openTasks.map((t) => `[${t._id}] ${t.title} (${t.status})`).join("; ");

  // Real team roster — so a reassignment can link to a real person's real
  // id instead of a free-text name with nothing behind it. Deliberately a
  // simpler query than teamMembers.controller.js's full lookup (which also
  // merges in TeamMemberProfile-only rows for cross-startup edge cases) —
  // this is just enough for AI PM to reference a real id in chat, not the
  // full membership resolution logic.
  const teamMembers = await User.find({ founderId, role: { $in: ["team-member", "team"] } }, { name: 1 }).lean();
  const teamSummary = teamMembers.map((u) => `[${u._id}] ${u.name}`).join("; ");

  const devAgent = await Agent.findOne({ founderId, agentKey: "dev" }).lean();
  let devActivitySummary = "";
  if (devAgent) {
    const devActionTypes = await ActionType.find({ agentId: devAgent._id }, { _id: 1 }).lean();
    const devEvents = await AgentEvent.find({ founderId, actionTypeId: { $in: devActionTypes.map((a) => a._id) } })
      .populate({ path: "actionTypeId", select: "label" })
      .sort({ createdAt: -1 })
      .limit(DEV_ACTIVITY_LIMIT)
      .lean();
    devActivitySummary = devEvents.map(summarizeDevEvent).join("; ");
  }

  const defaultRepo = startup?.defaultGithubRepo?.owner && startup?.defaultGithubRepo?.repo
    ? `${startup.defaultGithubRepo.owner}/${startup.defaultGithubRepo.repo}`
    : "";

  return {
    startupName: startup?.name || "",
    stage: startup?.stage || "",
    goal: outcome?.goal || "",
    weeklyOutcomeId: outcome?._id ? String(outcome._id) : null,
    milestonesSummary,
    openTasksSummary,
    teamSummary,
    devActivitySummary,
    defaultRepo,
  };
}

/**
 * Resolves which conversation a request means: the one explicitly named in
 * the query/body, or — when the founder hasn't picked one (the normal case
 * of just opening the Chat page) — whichever conversation most recently had
 * a message, so opening the page still shows your latest chat by default.
 * Returns null only when this founder+agent has no messages at all yet.
 */
async function resolveConversationId(founderId, agentId, requested) {
  if (requested && mongoose.isValidObjectId(requested)) return requested;
  const latest = await AgentMessage.findOne({ founderId, agentId }).sort({ createdAt: -1 }).select("conversationId").lean();
  return latest?.conversationId ? String(latest.conversationId) : null;
}

export const listMessages = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) return apiError(res, "Forbidden.", 403);
  await ensureCoreAgentsSeeded(founderId);
  const agent = await Agent.findOne({ founderId, agentKey: "pm" }).lean();
  if (!agent) return apiSuccess(res, { messages: [], agentId: null, conversationId: null });

  const conversationId = await resolveConversationId(founderId, agent._id, req.query?.conversationId);
  if (!conversationId) return apiSuccess(res, { messages: [], agentId: String(agent._id), conversationId: null });

  const messages = await AgentMessage.find({ founderId, agentId: agent._id, conversationId }).sort({ createdAt: 1 }).lean();
  return apiSuccess(res, { messages, agentId: String(agent._id), conversationId: String(conversationId) });
};

const CONVERSATION_TITLE_LENGTH = 60;

/**
 * Real, distinct past conversations for the History dropdown — derived
 * entirely from AgentMessage itself (no separate model just to hold a
 * title/timestamp that's already implicit in the messages). Title is the
 * first founder message in that conversation, truncated — the same
 * "title from the opening message" convention chat products already use,
 * so a founder never has to name anything.
 */
export const listConversations = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) return apiError(res, "Forbidden.", 403);
  const agent = await Agent.findOne({ founderId, agentKey: "pm" }).lean();
  if (!agent) return apiSuccess(res, { conversations: [] });

  const rows = await AgentMessage.aggregate([
    { $match: { founderId: new mongoose.Types.ObjectId(founderId), agentId: agent._id } },
    { $sort: { createdAt: 1 } },
    {
      $group: {
        _id: "$conversationId",
        updatedAt: { $last: "$createdAt" },
        firstFounderMessage: {
          $first: { $cond: [{ $eq: ["$role", "founder"] }, "$content", null] },
        },
        messageCount: { $sum: 1 },
      },
    },
    { $sort: { updatedAt: -1 } },
  ]);

  const conversations = rows.map((r) => ({
    conversationId: String(r._id),
    title: (r.firstFounderMessage || "New chat").slice(0, CONVERSATION_TITLE_LENGTH),
    updatedAt: r.updatedAt,
    messageCount: r.messageCount,
  }));
  return apiSuccess(res, { conversations });
};

/**
 * The reusable core of an AI PM "turn": given a raw completion, parse
 * whichever real marker it emitted (if any), execute the corresponding real
 * action, and return the final reply text plus whatever got proposed.
 * Extracted 2026-09-14 so both a founder's own chat message (sendMessage
 * below) and AI PM's autonomous continuous-planning check-in
 * (runAutonomousPmCheckIn) go through the exact same real logic — no
 * separate, drifting copy of the marker-handling rules for the autonomous
 * path.
 *
 * `allowedMarkerNames`, when given, is a real structural gate (not just a
 * prompt instruction) restricting which marker this specific turn is
 * allowed to act on — used by the autonomous check-in to permit ADD_TASKS
 * but withhold a brand-new SPRINT_PLAN until the current week has actually
 * run its course, even if the model tries to emit one anyway.
 */
async function processAiPmReply({ raw, ctx, messages, founderId, agent, allowedMarkerNames = null }) {
  let replyText = raw;
  let proposedEvent = null;
  let proposedEventKind = null;

  const allClosed = findAllClosedMarkers(raw);
  const closed = allClosed.length === 1 ? allClosed[0] : null;
  const openName = closed ? null : findOpenMarkerName(raw);

  if (closed && allowedMarkerNames && !allowedMarkerNames.includes(closed.name)) {
    replyText = raw.replace(closed.fullMatch, "").trim();
    replyText += "\n\n(That's not something I can propose from this kind of check-in right now — ask me directly in chat if you want it.)";
  } else if (allClosed.length > 1) {
    // Real bug caught live: the model emitted two different markers in one
    // reply despite being told not to. Silently picking one (the old
    // behavior) meant a founder could get the wrong one of two intended
    // actions, or a confusing duplicate, with no explanation. Take neither —
    // strip every fenced block from what's shown and say plainly that only
    // one action per message is supported, rather than guess which mattered.
    replyText = allClosed.reduce((text, m) => text.replace(m.fullMatch, ""), raw).trim();
    replyText += `\n\n(I tried to do more than one thing in that reply (${allClosed.map((m) => m.name).join(" and ")}) — I can only act on one at a time. Nothing was proposed from this message; ask me for one of them again.)`;
  } else if (openName) {
    // Opened a fence but never closed it — almost certainly truncated even
    // with the generous budget above. Never show a founder a half-written
    // JSON blob; drop everything from the open fence onward.
    const label = {
      BUILD_TASK: "task hand-off", SET_DEFAULT_REPO: "repo setting", UPDATE_TASK: "task update",
      DELETE_TASK: "task deletion", DELETE_MILESTONE: "milestone deletion", UPDATE_GOAL: "goal update",
      READ_REPO: "repo read request", ASK_DEV: "question for AI Developer", ADD_TASKS: "task addition",
    }[openName] || "sprint plan";
    replyText = `${raw.slice(0, raw.indexOf("```" + openName)).trim()}\n\n(I started drafting a ${label} but ran out of room to finish it — mind asking me to try again?)`;
  } else if (closed?.name === "SPRINT_PLAN") {
    // DeepSeek can (and did, in testing) return *only* the marker block with
    // no surrounding prose — replyText would then be empty after stripping
    // it, which AgentMessage's schema correctly rejects. Every branch below
    // must leave replyText non-empty.
    replyText = raw.replace(closed.fullMatch, "").trim();
    let plan = null;
    let parseFailed = false;
    try {
      plan = JSON.parse(closed.body);
    } catch {
      parseFailed = true;
    }
    if (plan?.milestones?.length) {
      try {
        const actionType = await ActionType.findOne({ agentId: agent._id, actionKey: "propose_sprint_plan" });
        if (!actionType) throw new Error("propose_sprint_plan action type is not seeded for this agent.");
        const result = await proposeAction({
          founderId,
          actorType: "agent",
          actorId: String(agent._id),
          actionTypeId: actionType._id,
          targetType: "sprint_plan",
          targetId: `sprint-${Date.now()}`,
          payload: { milestones: plan.milestones, weeklyOutcomeId: ctx.weeklyOutcomeId },
        });
        proposedEvent = result.event;
        proposedEventKind = "sprint_plan";
        replyText += "\n\n📋 I've proposed this as a real sprint plan — check your Approval Queue to review and approve it.";
      } catch (err) {
        logger.error("[agentChat] failed to propose sprint plan", { message: err.message });
        replyText += `\n\n(I tried to propose this as a real sprint plan but hit an error: ${err.message})`;
      }
    } else if (parseFailed) {
      replyText += "\n\n(I tried to draft a sprint plan there but it came out malformed — mind asking me to try again?)";
    } else {
      replyText += "\n\n(I started drafting a sprint plan but it had no milestones in it — mind asking me to try again?)";
    }
  } else if (closed?.name === "BUILD_TASK") {
    replyText = raw.replace(closed.fullMatch, "").trim();
    let task = null;
    let parseFailed = false;
    try {
      task = JSON.parse(closed.body);
    } catch (err) {
      parseFailed = true;
      // Real gap found live: a "came out malformed" failure previously left
      // zero trace of what the actual malformed body was — every future
      // occurrence had to be re-diagnosed blind. Log a real, truncated
      // preview so a recurrence (or a different malformed shape) is
      // debuggable from the logs alone.
      logger.error("[agentChat] BUILD_TASK body failed to parse as JSON", { message: err.message, bodyPreview: closed.body.slice(0, 500) });
    }
    const hasFields = Boolean(task?.owner && task?.repo && task?.filePath && task?.taskDescription);
    if (hasFields) {
      try {
        // Defensive normalization, not just a prompt instruction: DeepSeek put
        // "owner/repo" into the repo field once in testing despite the system
        // prompt explicitly saying not to, causing a real "Not Found" GitHub
        // API failure. Split it here so a recurrence doesn't fail the handoff.
        let owner = String(task.owner).trim();
        let repo = String(task.repo).trim();
        if (repo.includes("/")) {
          const parts = repo.split("/").filter(Boolean);
          repo = parts[parts.length - 1];
          if (parts.length > 1) owner = parts[0];
        }

        // Defensive validation, not just a prompt instruction (same principle
        // as the owner/repo normalization above): only trust a model-supplied
        // taskId if it's a real Task belonging to this founder and still
        // open. A hallucinated, stale, or cross-founder id is silently
        // dropped rather than linked, so the hand-off still succeeds — it
        // just doesn't close the loop back to a Task.
        let linkedTask = null;
        if (task.taskId && mongoose.isValidObjectId(task.taskId)) {
          linkedTask = await Task.findOne({ _id: task.taskId, founderId, status: { $in: ["pending", "in-progress"] } });
        }

        const devAgent = await Agent.findOne({ founderId, agentKey: "dev" });
        if (!devAgent) throw new Error("AI Developer isn't set up for this founder yet.");
        const openPrType = await ActionType.findOne({ agentId: devAgent._id, actionKey: "github_open_pr" });
        if (!openPrType) throw new Error("AI Developer's github_open_pr action type isn't seeded.");
        const result = await proposeAction({
          founderId,
          actorType: "agent",
          actorId: String(devAgent._id),
          actionTypeId: openPrType._id,
          targetType: "pr",
          targetId: `handoff-${Date.now()}`,
          payload: { owner, repo, filePath: task.filePath, taskDescription: task.taskDescription },
          taskId: linkedTask?._id || null,
        });
        proposedEvent = result.event;
        proposedEventKind = "build_task";
        const linkedNote = linkedTask ? ` (linked to task "${linkedTask.title}" — it'll be marked done once this reaches production)` : "";
        if (result.event.result?.prUrl) {
          replyText += `\n\n🛠️ Handed to AI Developer — it opened a real PR: ${result.event.result.prUrl}${linkedNote}`;
        } else if (result.event.status === "failed") {
          replyText += `\n\n(I handed this to AI Developer, but it hit an error: ${result.event.result?.error || "unknown error"})`;
        } else if (result.event.status === "pending_approval") {
          replyText += "\n\n🛠️ I've handed this to AI Developer — it's waiting on your approval before it starts.";
        } else {
          replyText += "\n\n🛠️ I've handed this to AI Developer.";
        }
      } catch (err) {
        logger.error("[agentChat] failed to hand off task to AI Developer", { message: err.message });
        replyText += `\n\n(I tried to hand this to AI Developer but hit an error: ${err.message})`;
      }
    } else if (parseFailed) {
      replyText += "\n\n(I tried to hand a task to AI Developer but it came out malformed — mind asking me to try again?)";
    } else {
      replyText += "\n\n(I started to hand a task to AI Developer but was missing some details — mind asking me to try again?)";
    }
  } else if (closed?.name === "SET_DEFAULT_REPO") {
    replyText = raw.replace(closed.fullMatch, "").trim();
    let repoInfo = null;
    let parseFailed = false;
    try {
      repoInfo = JSON.parse(closed.body);
    } catch {
      parseFailed = true;
    }
    let owner = String(repoInfo?.owner || "").trim();
    let repo = String(repoInfo?.repo || "").trim();
    // Same normalization guard as BUILD_TASK's owner/repo handling above —
    // don't trust the model to never combine them.
    if (repo.includes("/")) {
      const parts = repo.split("/").filter(Boolean);
      repo = parts[parts.length - 1];
      if (parts.length > 1) owner = parts[0];
    }
    if (owner && repo) {
      try {
        await Startup.findOneAndUpdate({ founderId }, { defaultGithubRepo: { owner, repo } });
        replyText += `\n\n✅ Got it — I'll build into ${owner}/${repo} by default from now on.`;
      } catch (err) {
        logger.error("[agentChat] failed to save default repo", { message: err.message });
        replyText += `\n\n(I tried to remember that repo but hit an error: ${err.message})`;
      }
    } else if (parseFailed) {
      replyText += "\n\n(I tried to save that repo but it came out malformed — mind telling me again?)";
    } else {
      replyText += "\n\n(I need both the owner and repo name to remember this — mind telling me again?)";
    }
  } else if (closed?.name === "UPDATE_TASK") {
    replyText = raw.replace(closed.fullMatch, "").trim();
    let body = null;
    try {
      body = JSON.parse(closed.body);
    } catch {
      replyText += "\n\n(I tried to update that task but the request came out malformed — mind asking me to try again?)";
    }
    if (body) {
      const taskId = body.taskId && mongoose.isValidObjectId(body.taskId) ? body.taskId : null;
      const existingTask = taskId ? await Task.findOne({ _id: taskId, founderId }) : null;
      if (!existingTask) {
        replyText += "\n\n(I don't see a real task with that id — mind pointing me at one from the list, or telling me again which one you mean?)";
      } else {
        try {
          const actionType = await ActionType.findOne({ agentId: agent._id, actionKey: "update_task" });
          if (!actionType) throw new Error("update_task action type is not seeded for this agent.");
          const updates = { ...(body.updates || {}) };
          let assignmentNote = "";
          // Real bug fixed: a model-supplied name with no real id behind it
          // would previously get written as assignedToName alone — looks
          // assigned, notifies no one, links to no real person. Only trust
          // "assignedTo" here, resolved against a real User, never free text.
          if (Object.prototype.hasOwnProperty.call(updates, "assignedTo")) {
            if (updates.assignedTo === null) {
              updates.assignedToName = "";
            } else if (String(updates.assignedTo) === "founder") {
              updates.assignedTo = founderId;
              updates.assignedToName = "";
            } else if (mongoose.isValidObjectId(updates.assignedTo)) {
              const realMember = await User.findOne({ _id: updates.assignedTo, founderId, role: { $in: ["team-member", "team"] } }, { name: 1 });
              if (realMember) {
                updates.assignedToName = realMember.name;
              } else {
                delete updates.assignedTo;
                delete updates.assignedToName;
                assignmentNote = " (I couldn't find that team member for real, so I left the assignment as it was)";
              }
            } else {
              delete updates.assignedTo;
              delete updates.assignedToName;
              assignmentNote = " (that wasn't a real team member id, so I left the assignment as it was)";
            }
          }
          const result = await proposeAction({
            founderId, actorType: "agent", actorId: String(agent._id), actionTypeId: actionType._id,
            targetType: "task", targetId: String(existingTask._id),
            payload: { taskId: String(existingTask._id), updates },
          });
          proposedEvent = result.event;
          proposedEventKind = "sprint_plan"; // reuses the Approval Queue link, not the AI Developer one
          if (result.event.status === "failed") {
            replyText += `\n\n(I tried to update "${existingTask.title}" but hit an error: ${result.event.result?.error || "unknown error"})`;
          } else if (result.event.status === "pending_approval") {
            replyText += `\n\n📋 I've proposed an update to "${existingTask.title}"${assignmentNote} — check your Approval Queue to review and approve it.`;
          } else {
            replyText += `\n\n✅ Updated "${existingTask.title}"${assignmentNote}.`;
          }
        } catch (err) {
          logger.error("[agentChat] failed to propose task update", { message: err.message });
          replyText += `\n\n(I tried to update that task but hit an error: ${err.message})`;
        }
      }
    }
  } else if (closed?.name === "DELETE_TASK") {
    replyText = raw.replace(closed.fullMatch, "").trim();
    let body = null;
    try {
      body = JSON.parse(closed.body);
    } catch {
      replyText += "\n\n(I tried to delete that task but the request came out malformed — mind asking me to try again?)";
    }
    if (body) {
      const taskId = body.taskId && mongoose.isValidObjectId(body.taskId) ? body.taskId : null;
      const existingTask = taskId ? await Task.findOne({ _id: taskId, founderId }) : null;
      if (!existingTask) {
        replyText += "\n\n(I don't see a real task with that id — mind pointing me at one from the list?)";
      } else {
        try {
          const actionType = await ActionType.findOne({ agentId: agent._id, actionKey: "delete_task" });
          if (!actionType) throw new Error("delete_task action type is not seeded for this agent.");
          const result = await proposeAction({
            founderId, actorType: "agent", actorId: String(agent._id), actionTypeId: actionType._id,
            targetType: "task", targetId: String(existingTask._id),
            payload: { taskId: String(existingTask._id) },
          });
          proposedEvent = result.event;
          proposedEventKind = "sprint_plan";
          replyText += result.event.status === "pending_approval"
            ? `\n\n📋 I've proposed deleting "${existingTask.title}" — this always needs your approval, check your Approval Queue.`
            : `\n\n(Something unexpected happened proposing that deletion — status: ${result.event.status})`;
        } catch (err) {
          logger.error("[agentChat] failed to propose task deletion", { message: err.message });
          replyText += `\n\n(I tried to propose deleting that task but hit an error: ${err.message})`;
        }
      }
    }
  } else if (closed?.name === "DELETE_MILESTONE") {
    replyText = raw.replace(closed.fullMatch, "").trim();
    let body = null;
    try {
      body = JSON.parse(closed.body);
    } catch {
      replyText += "\n\n(I tried to delete that milestone but the request came out malformed — mind asking me to try again?)";
    }
    if (body) {
      const milestoneId = body.milestoneId && mongoose.isValidObjectId(body.milestoneId) ? body.milestoneId : null;
      const existingMilestone = milestoneId ? await Milestone.findOne({ _id: milestoneId, founderId }) : null;
      if (!existingMilestone) {
        replyText += "\n\n(I don't see a real milestone with that id — mind pointing me at one from the list?)";
      } else {
        try {
          const actionType = await ActionType.findOne({ agentId: agent._id, actionKey: "delete_milestone" });
          if (!actionType) throw new Error("delete_milestone action type is not seeded for this agent.");
          const result = await proposeAction({
            founderId, actorType: "agent", actorId: String(agent._id), actionTypeId: actionType._id,
            targetType: "milestone", targetId: String(existingMilestone._id),
            payload: { milestoneId: String(existingMilestone._id) },
          });
          proposedEvent = result.event;
          proposedEventKind = "sprint_plan";
          replyText += result.event.status === "pending_approval"
            ? `\n\n📋 I've proposed deleting "${existingMilestone.title}" and every task under it — this always needs your approval, check your Approval Queue.`
            : `\n\n(Something unexpected happened proposing that deletion — status: ${result.event.status})`;
        } catch (err) {
          logger.error("[agentChat] failed to propose milestone deletion", { message: err.message });
          replyText += `\n\n(I tried to propose deleting that milestone but hit an error: ${err.message})`;
        }
      }
    }
  } else if (closed?.name === "UPDATE_GOAL") {
    replyText = raw.replace(closed.fullMatch, "").trim();
    let body = null;
    try {
      body = JSON.parse(closed.body);
    } catch {
      replyText += "\n\n(I tried to update the goal but the request came out malformed — mind asking me to try again?)";
    }
    const newGoal = String(body?.goal || "").trim();
    if (body && !newGoal) {
      replyText += "\n\n(I need real goal text to update it to — mind telling me again?)";
    } else if (newGoal) {
      try {
        const actionType = await ActionType.findOne({ agentId: agent._id, actionKey: "update_goal" });
        if (!actionType) throw new Error("update_goal action type is not seeded for this agent.");
        const result = await proposeAction({
          founderId, actorType: "agent", actorId: String(agent._id), actionTypeId: actionType._id,
          targetType: "weekly_outcome", targetId: ctx.weeklyOutcomeId || `goal-${Date.now()}`,
          payload: { goal: newGoal },
        });
        proposedEvent = result.event;
        proposedEventKind = "sprint_plan";
        if (result.event.status === "failed") {
          replyText += `\n\n(I tried to update the goal but hit an error: ${result.event.result?.error || "unknown error"})`;
        } else if (result.event.status === "pending_approval") {
          replyText += "\n\n📋 I've proposed updating the weekly goal — check your Approval Queue to review and approve it.";
        } else {
          replyText += "\n\n✅ Updated the weekly goal.";
        }
      } catch (err) {
        logger.error("[agentChat] failed to propose goal update", { message: err.message });
        replyText += `\n\n(I tried to update the goal but hit an error: ${err.message})`;
      }
    }
  } else if (closed?.name === "READ_REPO") {
    // Unlike every other marker, reading has no proposal to show — the
    // point is to actually answer the founder's question with real content.
    // So: fetch for real, then make a second real chatCompletion call
    // feeding that content back in, and use *that* reply — never show the
    // founder the "let me check" stub or the raw fetched blob directly.
    let body = null;
    try {
      body = JSON.parse(closed.body);
    } catch {
      replyText = "(I tried to read that repo but the request came out malformed — mind asking me to try again?)";
    }
    if (body) {
      // ctx.defaultRepo is already the real "owner/repo" combined string
      // loadContext built from Startup.defaultGithubRepo — split it back
      // apart as the fallback rather than re-querying Startup here.
      const [defaultOwner, defaultRepoName] = String(ctx.defaultRepo || "").split("/");
      const owner = String(body.owner || "").trim() || defaultOwner || "";
      const repo = String(body.repo || "").trim() || defaultRepoName || "";
      const target = String(body.target || "").trim();
      if (!owner || !repo || !["readme", "file", "pr"].includes(target)) {
        replyText = "(I tried to read a repo but was missing the owner, repo, or a valid target — mind asking me again?)";
      } else {
        try {
          const devAgent = await Agent.findOne({ founderId, agentKey: "dev" });
          if (!devAgent) throw new Error("AI Developer isn't set up for this founder yet.");
          const readType = await ActionType.findOne({ agentId: devAgent._id, actionKey: "read_repo_content" });
          if (!readType) throw new Error("read_repo_content action type is not seeded for this agent.");
          const result = await proposeAction({
            founderId, actorType: "agent", actorId: String(devAgent._id), actionTypeId: readType._id,
            targetType: "repo_content", targetId: `read-${Date.now()}`,
            payload: { owner, repo, target, prNumber: body.prNumber || null, path: body.path || null },
          });
          if (result.event.status === "failed") {
            replyText = `(I tried to read that, but hit a real error: ${result.event.result?.error || "unknown error"})`;
          } else {
            const fetched = result.event.result || {};
            let toolText;
            if (!fetched.found) {
              toolText = target === "pr"
                ? `PR #${body.prNumber} on ${owner}/${repo} has no files, or wasn't found.`
                : `No "${target === "readme" ? "README" : fetched.path}" found in ${owner}/${repo}.`;
            } else if (target === "pr") {
              const fileBlocks = (fetched.files || []).map((f) => `--- ${f.filename} (${f.status}, +${f.additions}/-${f.deletions}) ---\n${f.patch || "(no diff available)"}`).join("\n\n");
              toolText = `Real diff for PR #${fetched.prNumber} on ${owner}/${repo}${fetched.moreFiles ? ` (showing ${fetched.files.length} of ${fetched.files.length + fetched.moreFiles} changed files)` : ""}:\n\n${fileBlocks}`;
            } else {
              toolText = `Real content of ${fetched.path} in ${owner}/${repo}${fetched.truncated ? " (truncated)" : ""}:\n\n${fetched.content}`;
            }
            try {
              replyText = await synthesizeFromToolResult({
                ctx, messages, raw, closedFullMatch: closed.fullMatch, toolText,
                instruction: "Answer my actual question now using this real content, in your own words.",
              });
            } catch (err) {
              logger.error("[agentChat] failed to synthesize read_repo_content result", { message: err.message });
              replyText = `I read it for real, but couldn't finish summarizing it: ${err.message}`;
            }
          }
        } catch (err) {
          logger.error("[agentChat] failed to read repo content", { message: err.message });
          replyText = `(I tried to read that repo but hit an error: ${err.message})`;
        }
      }
    }
  } else if (closed?.name === "ASK_DEV") {
    // Same "no proposal, just answer for real" shape as READ_REPO — but zero
    // GitHub calls: the real data (what AI Developer actually wrote, and
    // why) is already sitting in our own stored AgentEvent, from the moment
    // the task was handed off. This is capability A ("what did it write")
    // and C ("ask it something") merged into one: no "question" means "just
    // explain it," a real question gets answered from the same real data.
    let body = null;
    try {
      body = JSON.parse(closed.body);
    } catch {
      replyText = "(I tried to look that up but the request came out malformed — mind asking me to try again?)";
    }
    const eventId = body?.eventId && mongoose.isValidObjectId(body.eventId) ? body.eventId : null;
    if (body && !eventId) {
      replyText = "(I need a real event id from the activity list to look that up — mind pointing me at one from the list?)";
    } else if (eventId) {
      try {
        const devAgent = await Agent.findOne({ founderId, agentKey: "dev" });
        if (!devAgent) throw new Error("AI Developer isn't set up for this founder yet.");
        const explainType = await ActionType.findOne({ agentId: devAgent._id, actionKey: "explain_dev_work" });
        if (!explainType) throw new Error("explain_dev_work action type is not seeded for this agent.");
        const result = await proposeAction({
          founderId, actorType: "agent", actorId: String(devAgent._id), actionTypeId: explainType._id,
          targetType: "dev_event", targetId: `explain-${Date.now()}`,
          payload: { eventId },
        });
        if (result.event.status === "failed") {
          replyText = `(I tried to look that up, but hit a real error: ${result.event.result?.error || "unknown error"})`;
        } else {
          const found = result.event.result || {};
          if (!found.found) {
            replyText = "(I don't see a real AI Developer event with that id — mind pointing me at one from the activity list?)";
          } else {
            const question = String(body.question || "").trim();
            const toolText = [
              `Real record of ${found.actionLabel}${found.filePath ? ` (${found.filePath})` : ""}, status: ${found.status}${found.error ? `, error: ${found.error}` : ""}.`,
              found.taskDescription ? `The real task it was given: "${found.taskDescription}"` : null,
              found.fileContent ? `The real file content it actually wrote:\n\n${found.fileContent}` : "No file content is stored for this event (it wasn't a code-writing action, or it failed before writing anything).",
              found.prUrl ? `Real PR: ${found.prUrl}` : null,
              found.pagesUrl ? `Real live URL (GitHub Pages): ${found.pagesUrl}` : found.pagesError ? `No live URL — GitHub Pages could not be enabled: ${found.pagesError}` : null,
            ].filter(Boolean).join("\n\n");
            try {
              replyText = await synthesizeFromToolResult({
                ctx, messages, raw, closedFullMatch: closed.fullMatch, toolText,
                instruction: question
                  ? `Answer this specific question using this real data: "${question}"`
                  : "Explain in your own words what AI Developer actually did here and why, using this real data — don't just repeat the raw content verbatim, interpret it for the founder.",
              });
            } catch (err) {
              logger.error("[agentChat] failed to synthesize explain_dev_work result", { message: err.message });
              replyText = `I found the real record, but couldn't finish summarizing it: ${err.message}`;
            }
          }
        }
      } catch (err) {
        logger.error("[agentChat] failed to explain dev work", { message: err.message });
        replyText = `(I tried to look that up but hit an error: ${err.message})`;
      }
    }
  } else if (closed?.name === "ADD_TASKS") {
    // Lighter-weight sibling of SPRINT_PLAN, added 2026-09-14 for
    // continuous-planning: adds real tasks to an *already-existing*
    // milestone without inventing a whole new one. Used both when a
    // founder asks for it directly in chat and by AI PM's autonomous
    // check-in once AI Developer's build queue empties.
    replyText = raw.replace(closed.fullMatch, "").trim();
    let body = null;
    try {
      body = JSON.parse(closed.body);
    } catch {
      replyText += "\n\n(I tried to add those tasks but the request came out malformed — mind asking me to try again?)";
    }
    if (body) {
      const milestoneId = body.milestoneId && mongoose.isValidObjectId(body.milestoneId) ? body.milestoneId : null;
      const existingMilestone = milestoneId ? await Milestone.findOne({ _id: milestoneId, founderId }) : null;
      if (!existingMilestone) {
        replyText += "\n\n(I don't see a real milestone with that id — mind pointing me at one from the list?)";
      } else {
        try {
          const actionType = await ActionType.findOne({ agentId: agent._id, actionKey: "add_tasks" });
          if (!actionType) throw new Error("add_tasks action type is not seeded for this agent.");
          const taskList = Array.isArray(body.tasks) ? body.tasks : [];
          const result = await proposeAction({
            founderId, actorType: "agent", actorId: String(agent._id), actionTypeId: actionType._id,
            targetType: "milestone", targetId: String(existingMilestone._id),
            payload: { milestoneId: String(existingMilestone._id), tasks: taskList },
          });
          proposedEvent = result.event;
          proposedEventKind = "sprint_plan";
          if (result.event.status === "failed") {
            replyText += `\n\n(I tried to add tasks to "${existingMilestone.title}" but hit an error: ${result.event.result?.error || "unknown error"})`;
          } else if (result.event.status === "pending_approval") {
            replyText += `\n\n📋 I've proposed adding ${taskList.length} task${taskList.length === 1 ? "" : "s"} to "${existingMilestone.title}" — check your Approval Queue to review and approve.`;
          } else {
            replyText += `\n\n✅ Added tasks to "${existingMilestone.title}".`;
          }
        } catch (err) {
          logger.error("[agentChat] failed to propose add_tasks", { message: err.message });
          replyText += `\n\n(I tried to add those tasks but hit an error: ${err.message})`;
        }
      }
    }
  }

  // Real bug found live: the multi-marker guard above only catches two or
  // more *fully closed* markers. It missed the case of one legitimate closed
  // marker (e.g. UPDATE_GOAL) followed, later in the same reply, by a
  // *second*, merely-started marker (e.g. a SPRINT_PLAN the model attempted
  // against instructions) that got cut off by the token budget before its
  // closing fence arrived. That leftover raw, truncated JSON was never
  // stripped — only the one matched closed.fullMatch is ever removed — so it
  // sat untouched in replyText and got shown to the founder verbatim, with
  // the real confirmation line appended after it. Same "never show raw
  // half-written JSON" principle as the openName branch above, just applied
  // as a final safety net regardless of which branch built replyText.
  const strayOpenName = findOpenMarkerName(replyText);
  if (strayOpenName) {
    replyText = replyText.slice(0, replyText.indexOf("```" + strayOpenName)).trim();
    replyText += "\n\n(I also started a second action in that reply but ran out of room to finish it — ask me again once this one's done.)";
  }

  // Real bug found live: the model can also just write confident prose
  // claiming a real action happened — using this system's own 🛠️/📋
  // confirmation style — with no fenced block at all. Confirmed via direct
  // DB query: a reply read "🛠️ Handed to AI Developer — it opened a real
  // PR..." and nothing was ever created. The prompt rule above is necessary
  // but not sufficient — a rule the model can still choose not to follow —
  // so this is the same "escalate to a structural guard" principle already
  // used for the multi-marker and owner/repo cases. If no real marker
  // closed this turn and nothing was actually proposed, those two glyphs
  // are reserved (per the system prompt) for real, server-appended
  // confirmations only — their presence here means a fabricated one.
  if (!closed && !proposedEvent) {
    const glyphIndexes = ["🛠️", "📋"].map((g) => replyText.indexOf(g)).filter((i) => i >= 0);
    if (glyphIndexes.length) {
      replyText = replyText.slice(0, Math.min(...glyphIndexes)).trim();
      replyText += "\n\n(That last line described an action as if it happened, but nothing was actually sent — ask me again and I'll either do it for real or tell you what's missing.)";
    }
  }

  if (!replyText.trim()) {
    // If we get here, chatCompletion's own escalated-budget retry (see
    // deepseekClient.js) already failed twice for this exact request — so
    // "try sending that again" would just hit the same wall a third time.
    // Real cause, confirmed live: a single message asking for several
    // substantial things at once (e.g. a goal update plus a detailed
    // multi-task plan) can exhaust the model's token budget before it
    // emits any visible content. Point the founder at what actually helps.
    replyText = "(That was a lot to ask in one message and I ran out of room before I could answer — try splitting it into smaller messages, one thing at a time.)";
  }

  return { replyText, proposedEvent, proposedEventKind };
}

export const sendMessage = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) return apiError(res, "Forbidden.", 403);
  const content = String(req.body?.content || "").trim();
  if (!content) return apiError(res, "content is required.", 422);

  await ensureCoreAgentsSeeded(founderId);
  const agent = await Agent.findOne({ founderId, agentKey: "pm" });
  if (!agent) return apiError(res, "AI Product Manager isn't available for this founder.", 404);

  // "New chat" (client clears its remembered conversationId) or this
  // founder's very first ever message both arrive with no conversationId —
  // start a real new one rather than requiring a separate "create
  // conversation" round trip first.
  const requestedConversationId = req.body?.conversationId;
  const conversationId = requestedConversationId && mongoose.isValidObjectId(requestedConversationId)
    ? requestedConversationId
    : new mongoose.Types.ObjectId();

  await AgentMessage.create({ founderId, agentId: agent._id, conversationId, role: "founder", content });

  if (!deepseekConfigured()) {
    const reply = await AgentMessage.create({
      founderId,
      agentId: agent._id,
      conversationId,
      role: "agent",
      content: "DeepSeek isn't configured on this server yet, so I can't respond for real right now.",
    });
    return apiSuccess(res, { message: reply, proposedEvent: null, conversationId: String(conversationId) });
  }

  const ctx = await loadContext(founderId);
  const history = await AgentMessage.find({ founderId, agentId: agent._id, conversationId })
    .sort({ createdAt: -1 })
    .limit(HISTORY_LIMIT)
    .lean();
  const messages = history.reverse().map((m) => ({ role: m.role === "founder" ? "user" : "assistant", content: m.content }));

  let raw;
  try {
    // A reply that explains its reasoning AND includes a full plan/task JSON
    // block can genuinely run long — the default 1200-token budget
    // (draftText's, sized for AI Developer's one-file drafts) cut a real
    // plan off mid-JSON in testing, so the closing fence never arrived and
    // the marker regex silently never matched. 3000 gives real headroom.
    raw = await chatCompletion({ systemPrompt: buildSystemPrompt(ctx), messages, maxTokens: 3000 });
  } catch (err) {
    return apiError(res, err.message || "AI Product Manager could not respond.", err.statusCode || 502);
  }

  const { replyText, proposedEvent, proposedEventKind } = await processAiPmReply({ raw, ctx, messages, founderId, agent });

  const savedReply = await AgentMessage.create({
    founderId,
    agentId: agent._id,
    conversationId,
    role: "agent",
    content: replyText,
    proposedEventId: proposedEvent?.id || null,
    proposedEventKind,
  });

  return apiSuccess(res, { message: savedReply, proposedEvent, conversationId: String(conversationId) });
};

/**
 * AI PM's autonomous continuous-planning check-in (2026-09-14) — the first
 * place anywhere in this app where AI PM acts without a founder message
 * triggering it. Called by orchestrator.service.js's
 * maybeTriggerAutonomousPlanning, itself only invoked for founders who
 * opted in (Startup.autonomousPlanningEnabled) once AI Developer's build
 * queue is genuinely empty, or by the weekly cron backstop.
 *
 * Reuses processAiPmReply — the exact same real marker-handling logic a
 * founder's own chat message goes through — so this can never do anything
 * a real chat message couldn't also do. The one real difference: instead of
 * a founder's own words, a synthetic, clearly-labeled instruction is
 * appended to real conversation history (same "[Automated ...] " labeling
 * convention already used for tool-result follow-ups), so the model never
 * mistakes this for the founder actually having said something.
 *
 * Stays silent — posts no message at all — when AI PM decides there's
 * genuinely nothing to propose right now. Speaking up only when it
 * actually did something real is the whole point; a "nothing to report"
 * message would just be noise the founder has to read past.
 */
export async function runAutonomousPmCheckIn(founderId, { instruction, allowedMarkerNames }) {
  if (!deepseekConfigured()) return null;
  await ensureCoreAgentsSeeded(founderId);
  const agent = await Agent.findOne({ founderId, agentKey: "pm" });
  if (!agent) return null;

  const ctx = await loadContext(founderId);
  const existingConversationId = await resolveConversationId(founderId, agent._id, null);
  const history = existingConversationId
    ? await AgentMessage.find({ founderId, agentId: agent._id, conversationId: existingConversationId })
        .sort({ createdAt: -1 })
        .limit(HISTORY_LIMIT)
        .lean()
    : [];
  const messages = history.reverse().map((m) => ({ role: m.role === "founder" ? "user" : "assistant", content: m.content }));
  messages.push({ role: "user", content: `[Automated check-in, not from the founder] ${instruction}` });

  let raw;
  try {
    raw = await chatCompletion({ systemPrompt: buildSystemPrompt(ctx), messages, maxTokens: 3000 });
  } catch (err) {
    logger.error("[agentChat] autonomous check-in completion failed", { founderId: String(founderId), message: err.message });
    return null;
  }

  const { replyText, proposedEvent, proposedEventKind } = await processAiPmReply({ raw, ctx, messages, founderId, agent, allowedMarkerNames });
  if (!proposedEvent) return null; // nothing real proposed — stay silent rather than posting a "nothing to report" message

  const conversationId = existingConversationId || new mongoose.Types.ObjectId();
  const savedReply = await AgentMessage.create({
    founderId,
    agentId: agent._id,
    conversationId,
    role: "agent",
    content: replyText,
    proposedEventId: proposedEvent?.id || null,
    proposedEventKind,
  });
  return { message: savedReply, proposedEvent };
}
