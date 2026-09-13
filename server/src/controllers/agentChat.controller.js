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
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import { chatCompletion, deepseekConfigured } from "../services/deepseekClient.js";
import { proposeAction } from "../services/orchestrator.service.js";
import { ensureCoreAgentsSeeded } from "../services/coreAgentSeeds.js";
import { logger } from "../config/logger.js";

const HISTORY_LIMIT = 20;
const DEV_ACTIVITY_LIMIT = 6;

// Both in-band markers AI PM can emit, checked in this order. Kept as a list
// (not two independent regexes scattered through the function) so the
// "opened but never closed" truncation guard below covers both the same way.
const MARKERS = [
  { name: "SPRINT_PLAN", re: /```SPRINT_PLAN\s*([\s\S]*?)```/ },
  { name: "BUILD_TASK", re: /```BUILD_TASK\s*([\s\S]*?)```/ },
];

function founderGuard(req, founderId) {
  return req.user.isAdmin === true || req.user.id === String(founderId);
}

function findClosedMarker(raw) {
  for (const marker of MARKERS) {
    const match = raw.match(marker.re);
    if (match) return { name: marker.name, fullMatch: match[0], body: match[1] };
  }
  return null;
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

function buildSystemPrompt({ startupName, stage, goal, milestonesSummary, devActivitySummary }) {
  return `You are AI Product Manager, a StartupVerse agent and ${startupName ? `${startupName}'s` : "the founder's"} primary day-to-day planning partner.

Your job:
- Help the founder figure out what to focus on. Ask clarifying questions when there isn't enough clarity yet — don't force a plan out of a vague idea.
- Use only the real context given below. Never invent startup data, and never invent or guess at AI Developer's activity beyond what's listed below — if it's not listed, say you don't have visibility into it.
- When you and the founder reach real clarity on a concrete plan for the week, propose it with a fenced block, exactly like this, with nothing else inside it:
\`\`\`SPRINT_PLAN
{"milestones":[{"title":"...","description":"...","tasks":[{"title":"...","description":"..."}]}]}
\`\`\`
  Only emit this when you have a genuinely concrete, ready plan — never as a placeholder or hypothetical. It goes to the founder for real review and approval, not executed automatically. Keep it realistic for about one week: 2-4 milestones, a handful of tasks each.
- If a specific task is ready to hand straight to AI Developer to build, and the founder has told you which real GitHub repo to use, use this fenced block instead (never both blocks in the same reply):
\`\`\`BUILD_TASK
{"owner":"...","repo":"...","filePath":"...","taskDescription":"..."}
\`\`\`
  "owner" is just the GitHub username/org (e.g. "oluseyi5280"). "repo" is just the repository name on its own (e.g. "ai-developer-test") — never "owner/repo" combined, never a slash in it. Only do this for one concrete, single-file task, and only once the founder has actually named a real repo — never guess a repo name. If you don't know it yet, ask instead of emitting this block. Unlike the sprint plan, this usually runs immediately and autonomously (opens a real PR right away) — don't tell the founder it needs their approval first unless the actual result you're given afterward says it does.
- Besides those two real actions, you can't yet do anything else for real — you can't send money, sign documents, or message customers on the founder's behalf. If asked, say so honestly instead of pretending you can.
- Write like a sharp, direct colleague, not a customer-support bot. No filler, no "I'd be happy to help."

Real context:
- Stage: ${stage || "not set"}
- Current weekly goal: ${goal || "none set yet — this might be exactly what you're helping the founder figure out"}
- Recent milestones: ${milestonesSummary || "none yet"}
- Recent AI Developer activity: ${devActivitySummary || "none yet — AI Developer hasn't done anything for this founder yet"}`;
}

async function loadContext(founderId) {
  const startup = await Startup.findOne({ founderId }).lean();
  const outcome = await WeeklyOutcome.findOne({ founderId, status: "active" }).sort({ weekOf: -1 }).lean();
  const milestones = await Milestone.find({ founderId }).sort({ createdAt: -1 }).limit(5).lean();
  const milestonesSummary = milestones
    .map((m) => `${m.title} (${m.status}, ${m.tasksCompleted || 0}/${m.totalTasks || 0} tasks)`)
    .join("; ");

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

  return {
    startupName: startup?.name || "",
    stage: startup?.stage || "",
    goal: outcome?.goal || "",
    weeklyOutcomeId: outcome?._id ? String(outcome._id) : null,
    milestonesSummary,
    devActivitySummary,
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

  const closed = findClosedMarker(raw);
  const openName = closed ? null : findOpenMarkerName(raw);

  if (openName) {
    // Opened a fence but never closed it — almost certainly truncated even
    // with the generous budget above. Never show a founder a half-written
    // JSON blob; drop everything from the open fence onward.
    const label = openName === "BUILD_TASK" ? "task hand-off" : "sprint plan";
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
        });
        proposedEvent = result.event;
        proposedEventKind = "build_task";
        if (result.event.result?.prUrl) {
          replyText += `\n\n🛠️ Handed to AI Developer — it opened a real PR: ${result.event.result.prUrl}`;
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
