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
const MARKERS = [
  { name: "SPRINT_PLAN", re: /```SPRINT_PLAN\s*([\s\S]*?)```/ },
  { name: "BUILD_TASK", re: /```BUILD_TASK\s*([\s\S]*?)```/ },
  { name: "SET_DEFAULT_REPO", re: /```SET_DEFAULT_REPO\s*([\s\S]*?)```/ },
  { name: "UPDATE_TASK", re: /```UPDATE_TASK\s*([\s\S]*?)```/ },
  { name: "DELETE_TASK", re: /```DELETE_TASK\s*([\s\S]*?)```/ },
  { name: "DELETE_MILESTONE", re: /```DELETE_MILESTONE\s*([\s\S]*?)```/ },
  { name: "UPDATE_GOAL", re: /```UPDATE_GOAL\s*([\s\S]*?)```/ },
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
  return `${label}${pr}${repo ? ` on ${repo}` : ""} — ${statusText}`;
}

function buildSystemPrompt({ startupName, stage, goal, milestonesSummary, devActivitySummary, openTasksSummary, defaultRepo }) {
  return `You are AI Product Manager, a StartupVerse agent and ${startupName ? `${startupName}'s` : "the founder's"} primary day-to-day planning partner.

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
{"taskId":"...","updates":{"status":"...","title":"...","description":"...","priority":"...","assignedToName":"...","blockerReason":"...","blockerNote":"..."}}
\`\`\`
  Only include the fields actually changing in "updates" — leave the rest out entirely, don't send empty strings for things you're not touching. Status must be a real one (pending, in-progress, blocked, completed) and a legal transition (e.g. you can't jump pending straight to completed — move it to in-progress first). Marking something "blocked" requires both blockerReason and blockerNote.
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
- Besides those real actions, you still can't do anything else for real — you can't send money, sign documents, or message customers on the founder's behalf. If asked, say so honestly instead of pretending you can.
- Write like a sharp, direct colleague, not a customer-support bot. No filler, no "I'd be happy to help."

Real context:
- Stage: ${stage || "not set"}
- Current weekly goal: ${goal || "none set yet — this might be exactly what you're helping the founder figure out"}
- Default GitHub repo: ${defaultRepo || "none set yet"}
- Milestones (id — title, status): ${milestonesSummary || "none yet"}
- Tasks (id — title, status): ${openTasksSummary || "none yet"}
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
    devActivitySummary,
    defaultRepo,
  };
}

export const listMessages = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) return apiError(res, "Forbidden.", 403);
  await ensureCoreAgentsSeeded(founderId);
  const agent = await Agent.findOne({ founderId, agentKey: "pm" }).lean();
  if (!agent) return apiSuccess(res, { messages: [], agentId: null });
  const messages = await AgentMessage.find({ founderId, agentId: agent._id }).sort({ createdAt: 1 }).lean();
  return apiSuccess(res, { messages, agentId: String(agent._id) });
};

export const sendMessage = async (req, res) => {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) return apiError(res, "Forbidden.", 403);
  const content = String(req.body?.content || "").trim();
  if (!content) return apiError(res, "content is required.", 422);

  await ensureCoreAgentsSeeded(founderId);
  const agent = await Agent.findOne({ founderId, agentKey: "pm" });
  if (!agent) return apiError(res, "AI Product Manager isn't available for this founder.", 404);

  await AgentMessage.create({ founderId, agentId: agent._id, role: "founder", content });

  if (!deepseekConfigured()) {
    const reply = await AgentMessage.create({
      founderId,
      agentId: agent._id,
      role: "agent",
      content: "DeepSeek isn't configured on this server yet, so I can't respond for real right now.",
    });
    return apiSuccess(res, { message: reply, proposedEvent: null });
  }

  const ctx = await loadContext(founderId);
  const history = await AgentMessage.find({ founderId, agentId: agent._id })
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

  let replyText = raw;
  let proposedEvent = null;
  let proposedEventKind = null;

  const allClosed = findAllClosedMarkers(raw);
  const closed = allClosed.length === 1 ? allClosed[0] : null;
  const openName = closed ? null : findOpenMarkerName(raw);

  if (allClosed.length > 1) {
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
    } catch {
      parseFailed = true;
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
          const result = await proposeAction({
            founderId, actorType: "agent", actorId: String(agent._id), actionTypeId: actionType._id,
            targetType: "task", targetId: String(existingTask._id),
            payload: { taskId: String(existingTask._id), updates: body.updates || {} },
          });
          proposedEvent = result.event;
          proposedEventKind = "sprint_plan"; // reuses the Approval Queue link, not the AI Developer one
          if (result.event.status === "failed") {
            replyText += `\n\n(I tried to update "${existingTask.title}" but hit an error: ${result.event.result?.error || "unknown error"})`;
          } else if (result.event.status === "pending_approval") {
            replyText += `\n\n📋 I've proposed an update to "${existingTask.title}" — check your Approval Queue to review and approve it.`;
          } else {
            replyText += `\n\n✅ Updated "${existingTask.title}".`;
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
  }

  if (!replyText.trim()) {
    replyText = "(I didn't get a response back — try sending that again.)";
  }

  const savedReply = await AgentMessage.create({
    founderId,
    agentId: agent._id,
    role: "agent",
    content: replyText,
    proposedEventId: proposedEvent?.id || null,
    proposedEventKind,
  });

  return apiSuccess(res, { message: savedReply, proposedEvent });
};
