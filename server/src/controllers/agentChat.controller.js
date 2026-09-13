/**
 * agentChat.controller.js — real conversation with AI Product Manager
 * (docs/ai-agent-roadmap.md Phase 3). The founder's own day-to-day planning
 * partner: a real, persisted, multi-turn conversation (not a one-shot form
 * like AI Developer's workspace), grounded in the founder's actual startup
 * context, that can propose a real sprint plan — as a governed, approvable
 * AgentEvent, never executed automatically — once there's enough clarity.
 *
 * Scoped to the "pm" agent only for now. Other agents stay on the existing
 * mock Chat UI until they have real actions of their own to take.
 */
import Agent from "../models/Agent.js";
import ActionType from "../models/ActionType.js";
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
const PLAN_MARKER_RE = /```SPRINT_PLAN\s*([\s\S]*?)```/;

function founderGuard(req, founderId) {
  return req.user.isAdmin === true || req.user.id === String(founderId);
}

function buildSystemPrompt({ startupName, stage, goal, milestonesSummary }) {
  return `You are AI Product Manager, a StartupVerse agent and ${startupName ? `${startupName}'s` : "the founder's"} primary day-to-day planning partner.

Your job:
- Help the founder figure out what to focus on. Ask clarifying questions when there isn't enough clarity yet — don't force a plan out of a vague idea.
- Use only the real context given below. Never invent startup data you weren't given.
- When you and the founder reach real clarity on a concrete plan for the week, propose it by including a fenced block, exactly like this, with nothing else inside it:
\`\`\`SPRINT_PLAN
{"milestones":[{"title":"...","description":"...","tasks":[{"title":"...","description":"..."}]}]}
\`\`\`
  Only emit this block when you have a genuinely concrete, ready plan — never as a placeholder, example, or hypothetical, and never more than once per reply. It will be sent to the founder for real review and approval, not executed automatically. Keep it realistic for about one week: 2-4 milestones, a handful of tasks each.
- You can't yet take any other real action yourself — you can't send money, sign documents, or message customers on the founder's behalf. If asked, say so honestly instead of pretending you can.
- Write like a sharp, direct colleague, not a customer-support bot. No filler, no "I'd be happy to help."

Real context:
- Stage: ${stage || "not set"}
- Current weekly goal: ${goal || "none set yet — this might be exactly what you're helping the founder figure out"}
- Recent milestones: ${milestonesSummary || "none yet"}`;
}

async function loadContext(founderId) {
  const startup = await Startup.findOne({ founderId }).lean();
  const outcome = await WeeklyOutcome.findOne({ founderId, status: "active" }).sort({ weekOf: -1 }).lean();
  const milestones = await Milestone.find({ founderId }).sort({ createdAt: -1 }).limit(5).lean();
  const milestonesSummary = milestones
    .map((m) => `${m.title} (${m.status}, ${m.tasksCompleted || 0}/${m.totalTasks || 0} tasks)`)
    .join("; ");
  return {
    startupName: startup?.name || "",
    stage: startup?.stage || "",
    goal: outcome?.goal || "",
    weeklyOutcomeId: outcome?._id ? String(outcome._id) : null,
    milestonesSummary,
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
    // A reply that explains its reasoning AND includes a full sprint-plan
    // JSON block can genuinely run long — the default 1200-token budget
    // (draftText's, sized for AI Developer's one-file drafts) cut a real
    // plan off mid-JSON in testing, so the closing fence never arrived and
    // the marker regex silently never matched. 3000 gives real headroom.
    raw = await chatCompletion({ systemPrompt: buildSystemPrompt(ctx), messages, maxTokens: 3000 });
  } catch (err) {
    return apiError(res, err.message || "AI Product Manager could not respond.", err.statusCode || 502);
  }

  const match = raw.match(PLAN_MARKER_RE);
  let replyText = raw;
  let proposedEvent = null;

  if (!match && raw.includes("```SPRINT_PLAN")) {
    // Opened the fence but never closed it — almost certainly truncated
    // mid-JSON even with a generous token budget above. Never show a founder
    // a half-written JSON blob; drop everything from the open fence onward.
    replyText = `${raw.slice(0, raw.indexOf("```SPRINT_PLAN")).trim()}\n\n(I started drafting a sprint plan but ran out of room to finish it — mind asking me to try again?)`;
  } else if (match) {
    // DeepSeek can (and did, in testing) return *only* the marker block with
    // no surrounding prose — replyText would then be empty after stripping
    // it, which AgentMessage's schema correctly rejects. Every branch below
    // must leave replyText non-empty.
    replyText = raw.replace(PLAN_MARKER_RE, "").trim();
    let plan = null;
    let parseFailed = false;
    try {
      plan = JSON.parse(match[1]);
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
  });

  return apiSuccess(res, { message: savedReply, proposedEvent });
};
