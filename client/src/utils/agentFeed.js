/**
 * Shared real-data helpers for AI Staff's Workroom and Manage Staff pages.
 * Built generically off whatever real Agent docs/ActionTypes actually exist
 * for a founder (via agentOrchestrationApi) rather than hardcoded to today's
 * "pm"/"dev" — coreAgentSeeds.js's own doc comment says new real agents get
 * added to the same registry over time, and this way every consumer of these
 * helpers picks new ones up automatically, with no further changes needed.
 *
 * Extracted here (rather than duplicated) once the exact same real-feed logic
 * was needed in a second place (Manage Staff's activity feed) — see
 * docs/ai-agent-roadmap.md / CLAUDE.md Session Log for the two features that
 * first needed this.
 */
import { formatEventTime, paletteForAgent, initialsForAgent } from "./agentDisplay";

export const PM_ACTOR = { initials: "PM", bg: "#EEEDFE", color: "#534AB7", isAgent: true };
export const DEV_ACTOR = { initials: "DEV", bg: "#f3f4f6", color: "#6b7280", isAgent: true };
export const YOU_ACTOR = { initials: "You", bg: "#EFB0AF", color: "#791F1F", isAgent: false };

function describeDevEvent(e) {
  const targetId = e.targetId || "";
  const actionKey = e.actionTypeId?.actionKey;
  const repoLabel = e.payload?.owner && e.payload?.repo ? `${e.payload.owner}/${e.payload.repo}` : "";

  if (actionKey === "github_open_pr") {
    // targetId's own prefix tells us who actually initiated this, since the
    // three real callers (agentChat.controller.js's BUILD_TASK hand-off, the
    // auto-build queue, and the AI Developer workspace's manual form) each
    // use a distinct prefix — a real structural signal, not a guess.
    const fromActor = targetId.startsWith("handoff-") || targetId.startsWith("sprint-task-") ? "pm" : "you";
    const text = fromActor === "pm"
      ? `Handed AI Developer a task: ${e.payload?.taskDescription || "a build task"}`
      : `You asked AI Developer to build: ${e.payload?.taskDescription || "a task"}`;
    const tag = e.status === "failed"
      ? { label: `Failed — ${e.result?.error || "error"}`, bg: "#FCEBEB", color: "#791F1F" }
      : { label: `PR opened${repoLabel ? " · " + repoLabel : ""}`, bg: "#f3f4f6", color: "#6b7280" };
    return { from: fromActor === "pm" ? PM_ACTOR : YOU_ACTOR, to: DEV_ACTOR, text, tag, link: e.result?.prUrl };
  }
  if (actionKey === "github_merge_staging") {
    return {
      from: DEV_ACTOR, to: null,
      text: `Merged to staging${repoLabel ? " on " + repoLabel : ""}.`,
      tag: e.status === "failed" ? { label: "Failed", bg: "#FCEBEB", color: "#791F1F" } : { label: "Autonomous", bg: "#f3f4f6", color: "#6b7280" },
    };
  }
  if (actionKey === "github_merge_main") {
    if (e.status === "pending_approval") {
      return { from: DEV_ACTOR, to: YOU_ACTOR, text: `Requested a production deploy${repoLabel ? " on " + repoLabel : ""} — needs your approval.`, tag: { label: "Escalated · needs approval", bg: "#FCEBEB", color: "#791F1F" } };
    }
    if (e.status === "human_completed" || e.status === "autonomous_completed") {
      return {
        from: DEV_ACTOR, to: null, text: `Deployed to production${repoLabel ? " on " + repoLabel : ""}.`,
        tag: { label: "Live in production", bg: "#EAF3DE", color: "#27500A" },
        // Real link to the actual deployed page — hostedUrl (our own
        // guaranteed hosting, 2026-09-15) preferred over pagesUrl (GitHub
        // Pages, best-effort and known to fail on some repo/token setups).
        link: e.result?.hostedUrl || e.result?.pagesUrl, linkLabel: "View live site →",
      };
    }
    if (e.status === "declined") {
      return { from: DEV_ACTOR, to: null, text: `Production deploy declined${repoLabel ? " on " + repoLabel : ""}.`, tag: { label: "Declined", bg: "#FCEBEB", color: "#791F1F" } };
    }
  }
  if (actionKey === "revise_file") {
    // Real design-review loop (2026-09-14): AI Developer revising its own
    // work after AI PM's real review flagged something — not a founder or
    // AI PM request, so no "from" actor beyond AI Developer itself.
    return {
      from: DEV_ACTOR, to: null,
      text: `Revised ${e.payload?.filePath || "a file"} per AI PM's review${repoLabel ? " on " + repoLabel : ""}.`,
      tag: e.status === "failed" ? { label: "Failed", bg: "#FCEBEB", color: "#791F1F" } : { label: "Autonomous", bg: "#f3f4f6", color: "#6b7280" },
    };
  }
  return null;
}

function describePmEvent(e) {
  if (e.actionTypeId?.actionKey === "review_dev_work") {
    // Real design/quality review loop (2026-09-14): AI PM critiquing AI
    // Developer's actual real output before it reaches staging — not
    // waiting for a founder to ask. Purely internal (agent-to-agent), so no
    // "to" actor — the founder sees the outcome, not a request routed to them.
    const verdict = e.result?.verdict;
    const filePath = e.payload?.filePath || "a file";
    return verdict === "revise"
      ? { from: PM_ACTOR, to: null, text: `Reviewed AI Developer's ${filePath} — sent it back with real feedback.`, tag: { label: "Requested changes", bg: "#FCF7EC", color: "#633806" } }
      : { from: PM_ACTOR, to: null, text: `Reviewed AI Developer's ${filePath} — approved.`, tag: { label: "Approved", bg: "#EAF3DE", color: "#27500A" } };
  }
  if (e.actionTypeId?.actionKey !== "propose_sprint_plan") return null;
  const milestones = e.payload?.milestones || [];
  const taskCount = milestones.reduce((n, m) => n + (m.tasks?.length || 0), 0);
  const text = `Proposed a sprint plan — ${milestones.length} milestone${milestones.length === 1 ? "" : "s"}, ${taskCount} task${taskCount === 1 ? "" : "s"}.`;
  const tag = e.status === "pending_approval" ? { label: "Escalated · needs approval", bg: "#FCEBEB", color: "#791F1F" }
    : e.status === "declined" ? { label: "Declined", bg: "#FCEBEB", color: "#791F1F" }
    : { label: "Approved", bg: "#EAF3DE", color: "#27500A" };
  return { from: PM_ACTOR, to: YOU_ACTOR, text, tag };
}

export function buildRealFeed(events, limit = 8) {
  return events
    .map((e) => {
      const agentKey = e.actionTypeId?.agentId?.agentKey;
      const desc = agentKey === "dev" ? describeDevEvent(e) : agentKey === "pm" ? describePmEvent(e) : null;
      if (!desc) return null;
      return { id: e.id, time: formatEventTime(e.createdAt), ...desc };
    })
    .filter(Boolean)
    .slice(0, limit); // events already sorted newest-first by getAgentEvents
}

export function buildRealApprovals(events) {
  return events
    .filter((e) => e.status === "pending_approval" && ["pm", "dev"].includes(e.actionTypeId?.agentId?.agentKey))
    .map((e) => {
      const isDev = e.actionTypeId?.agentId?.agentKey === "dev";
      const repoLabel = e.payload?.owner && e.payload?.repo ? `${e.payload.owner}/${e.payload.repo}` : "";
      const milestones = e.payload?.milestones;
      const totalTasks = Array.isArray(milestones) ? milestones.reduce((n, m) => n + (m.tasks?.length || 0), 0) : 0;
      const planDesc = Array.isArray(milestones)
        ? `${milestones.length} milestone${milestones.length === 1 ? "" : "s"}, ${totalTasks} task${totalTasks === 1 ? "" : "s"}.`
        : null;
      return {
        id: e.id,
        agent: isDev ? DEV_ACTOR : PM_ACTOR,
        title: e.actionTypeId?.label || "Pending action",
        risk: e.actionTypeId?.riskCategory === "sensitive_locked" ? "Sensitive" : "Low risk",
        riskBg: e.actionTypeId?.riskCategory === "sensitive_locked" ? "#FCEBEB" : "#f3f4f6",
        riskColor: e.actionTypeId?.riskCategory === "sensitive_locked" ? "#791F1F" : "#6b7280",
        desc: e.payload?.taskDescription || planDesc || (repoLabel ? `On ${repoLabel}.` : "Real action awaiting your review."),
        waitingOn: "you",
        isFyi: false,
        primaryLabel: "Approve →",
      };
    });
}

export function summarizeAgentStatus(agentKey, events) {
  const latest = events.find((e) => e.actionTypeId?.agentId?.agentKey === agentKey);
  if (!latest) return { status: "idle", statusLabel: "Not started yet" };
  if (latest.status === "pending_approval") return { status: "blocked", statusLabel: "Waiting on your approval" };
  if (latest.status === "failed") return { status: "blocked", statusLabel: "Last action failed" };
  return { status: "working", statusLabel: "Active — real work on file" };
}

const KNOWN_INITIALS = { pm: "PM", dev: "DEV" };
function styleForAgent(agent) {
  const palette = paletteForAgent(agent.id || agent.agentKey);
  return { initials: KNOWN_INITIALS[agent.agentKey] || initialsForAgent(agent.name), bg: palette.bg, color: palette.color };
}

function summarizeAgentActivity(agent, events) {
  const agentEvents = events.filter((e) => e.actionTypeId?.agentId?.agentKey === agent.agentKey);
  if (agentEvents.length === 0) {
    return { state: "idle", stateLabel: "Not started yet", task: "No real task given yet." };
  }
  const latest = agentEvents[0]; // events already sorted newest-first
  if (latest.status === "pending_approval") {
    return { state: "waiting", stateLabel: "Needs your approval", task: latest.actionTypeId?.label || "Pending action" };
  }
  if (latest.status === "failed") {
    return { state: "blocked", stateLabel: "Last action failed", task: latest.actionTypeId?.label || "Action failed" };
  }
  return { state: "active", stateLabel: "Active", task: latest.actionTypeId?.label || "Real work in progress" };
}

export function buildRealDepMap(agents, events, approvalsCount) {
  const nodes = agents.map((agent) => {
    const style = styleForAgent(agent);
    const activity = summarizeAgentActivity(agent, events);
    const stateMeta = {
      active:  { stateBg: "#EAF3DE", stateColor: "#27500A", cardState: "active" },
      waiting: { stateBg: "#FCF7EC", stateColor: "#633806", cardState: "waiting" },
      blocked: { stateBg: "#FCEBEB", stateColor: "#791F1F", cardState: "blocked" },
      idle:    { stateBg: "#f3f4f6", stateColor: "#6b7280", cardState: "waiting" },
    }[activity.state];
    return { ...style, name: agent.name, task: activity.task, state: stateMeta.cardState, stateLabel: activity.stateLabel, stateBg: stateMeta.stateBg, stateColor: stateMeta.stateColor };
  });
  nodes.push({
    initials: "You", bg: "#EFB0AF", color: "#791F1F", name: "You · Founder",
    task: approvalsCount > 0 ? `${approvalsCount} real approval${approvalsCount === 1 ? "" : "s"} waiting` : "All caught up",
    state: approvalsCount > 0 ? "waiting" : "active",
    stateLabel: approvalsCount > 0 ? "Needs decision" : "All clear",
    stateBg: approvalsCount > 0 ? "#FCF7EC" : "#EAF3DE",
    stateColor: approvalsCount > 0 ? "#633806" : "#27500A",
  });
  return nodes;
}

export function buildHeroStats(agents, events, approvalsCount) {
  const total = events.length;
  const autonomous = events.filter((e) => ["autonomous_completed", "human_completed"].includes(e.status)).length;
  return { total, agentCount: agents.length, autonomous, waiting: approvalsCount };
}

/**
 * Real "runs autonomous vs. always escalates" summary — from each real
 * founder's own ActionType rows (riskCategory/defaultMode), not invented
 * category labels. sensitive_locked types can never be autonomous
 * (enforced server-side in orchestrator.service.js, not just described
 * here); everything else reflects whatever the founder's current Autonomy
 * Settings actually say.
 */
export function buildAutonomySummary(actionTypes, heroStats) {
  const locked = actionTypes.filter((t) => t.riskCategory === "sensitive_locked").map((t) => t.label);
  const autonomous = actionTypes.filter((t) => t.riskCategory !== "sensitive_locked" && t.defaultMode === "autonomous").map((t) => t.label);
  return {
    autonomousLabel: autonomous.length ? autonomous.join(", ") : "None yet",
    escalatesLabel: locked.length ? locked.join(", ") : "None yet",
    soFarLabel: `${heroStats.autonomous} auto · ${heroStats.waiting} waiting`,
  };
}

/**
 * Real "humans in the loop" — the founder always counts (they're a real
 * human, and the real pending-approval count already reflects exactly what's
 * waiting on them), plus any real hired team members. Deliberately doesn't
 * fabricate a per-teammate pending count: orchestrator.service.js's
 * resolveApprover has a documented gap where role-based routing always
 * falls back to the founder, so no real mechanism ever attributes a
 * decision to a specific team member today — showing one would be exactly
 * the kind of invented number this whole cleanup exists to remove.
 */
export function buildHumansInLoop(founderName, teamMembers, approvalsCount) {
  const founderCard = {
    id: "founder",
    initials: "You",
    name: founderName ? `${founderName} · Founder` : "You · Founder",
    role: "Founder",
    status: approvalsCount > 0 ? "pending" : "clear",
    statusLabel: approvalsCount > 0 ? `${approvalsCount} real approval${approvalsCount === 1 ? "" : "s"} waiting` : "All caught up",
  };
  const teamCards = (teamMembers || []).map((m) => ({
    id: m.id,
    initials: initialsForAgent(m.name),
    name: `${m.name}${m.title ? ` · ${m.title}` : ""}`,
    role: m.title || "Team member",
    status: "idle",
    statusLabel: "On the team — not yet receiving agent hand-offs",
  }));
  return [founderCard, ...teamCards];
}
