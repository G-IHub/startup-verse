/**
 * V2FounderDashboard
 * ─────────────────────────────────────────────────────────────────────────────
 * The V2 redesign of the Founder Dashboard. Uses the 3-column V2AppLayout and
 * V2 design primitives while reusing ALL existing state stores and data hooks.
 *
 * Data sources (unchanged from V1):
 *   useHomeStore          – orchestrates initial load
 *   useExecutionScoreStore – score, breakdown, streak
 *   useWeeklyLoopStore    – weekly goal, milestones, tasks, outcomes
 *   useTeamStore          – team members + presence
 *   useJourneyStore       – current stage
 *   useDeliverablesStore  – cohort deliverables
 */

import React, { useEffect, useMemo } from "react";
import { cn } from "../ui/utils";

// ── V2 layout + primitives ────────────────────────────────────────────────
import V2AppLayout from "../layout/V2AppLayout";
import {
  V2Card,
  V2SectionHead,
  V2Chip,
  V2ScoreRing,
  V2Btn,
  V2Avatar,
  V2Dot,
} from "../shared/v2-primitives";

// ── Top bar helpers ──────────────────────────────────────────────────────
function currentDayName() {
  return new Date().toLocaleDateString("en-US", { weekday: "long" });
}

// ── Existing state stores (reused as-is) ─────────────────────────────────
import { useHomeStore } from "../../state/useHomeStore";
import { useExecutionScoreStore } from "../../state/useExecutionScoreStore";
import { useWeeklyLoopStore } from "../../state/useWeeklyLoopStore";
import { useTeamStore } from "../../state/useTeamStore";
import { useJourneyStore } from "../../state/useJourneyStore";
import { useStageTaskStore } from "../../state/useStageTaskStore";
import { useMembershipsStore } from "../../state/useMembershipsStore";
import { JOURNEY_STAGES } from "../../utils/journeyProgress";
import { STAGE_TASKS } from "../../domains/founder/stageTasks";

// ── Icons ─────────────────────────────────────────────────────────────────
import {
  Flame,
  Target,
  Zap,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  ChevronRight,
  Plus,
  Bot,
  TrendingUp,
  Users,
  Map,
  ArrowUp,
  ArrowDown,
  Check,
  Lock,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────

function scoreColor(score) {
  if (score >= 80) return "text-v2-green";
  if (score >= 60) return "text-v2-purple";
  if (score >= 40) return "text-v2-amber";
  return "text-red-500";
}

/** Real week number within a real cohort's real date range — no invented data. */
function cohortWeekInfo(cohort) {
  if (!cohort?.startDate) return null;
  const start = new Date(cohort.startDate);
  if (Number.isNaN(start.getTime())) return null;
  const now = new Date();
  const weekNumber = Math.max(1, Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000)) + 1);
  if (cohort.endDate) {
    const end = new Date(cohort.endDate);
    if (!Number.isNaN(end.getTime())) {
      const totalWeeks = Math.max(1, Math.ceil((end - start) / (7 * 24 * 60 * 60 * 1000)));
      return `${cohort.name} · Week ${Math.min(weekNumber, totalWeeks)} of ${totalWeeks}`;
    }
  }
  return `${cohort.name} · Week ${weekNumber}`;
}

function taskStatusChip(status) {
  const map = {
    completed:   { label: "Done",        variant: "green"  },
    "in-progress":{ label: "In Progress", variant: "blue"   },
    blocked:     { label: "Blocked",     variant: "red"    },
    pending:     { label: "Pending",     variant: "grey"   },
  };
  return map[status] ?? map.pending;
}

function milestoneIcon(status) {
  if (status === "completed") return <CheckCircle2 className="h-4 w-4 text-v2-green" />;
  if (status === "in-progress") return <Circle className="h-4 w-4 fill-v2-blue text-v2-blue" />;
  return <Circle className="h-4 w-4 text-v2-border" />;
}

// ─────────────────────────────────────────────────────────────────────────
// METRIC TILE
// ─────────────────────────────────────────────────────────────────────────

function MetricTile({
  icon: Icon,
  label,
  value,
  delta,
  iconBg = "bg-v2-blue-tint",
  iconColor = "text-v2-blue",
  valueColor = "text-v2-heading",
  deltaBg = "bg-v2-blue-tint",
  deltaTextColor = "text-v2-blue-dark",
}) {
  return (
    <V2Card className="rounded-[12px] p-[14px]">
      {/* Icon square — 32×32, rounded-8, coloured bg */}
      <div className={cn("mb-2.5 flex h-8 w-8 items-center justify-center rounded-[8px]", iconBg)}>
        <Icon className={cn("h-4 w-4", iconColor)} />
      </div>
      {/* Big value */}
      <p className={cn("font-heading text-[24px] font-medium leading-none", valueColor)}>
        {value}
      </p>
      {/* Label */}
      <p className="mt-1 font-body text-[11px] text-v2-muted">
        {label}
      </p>
      {/* Delta pill */}
      {delta ? (
        <div className={cn(
          "mt-1 inline-flex items-center gap-1 rounded-[10px] px-1.5 py-0.5",
          "font-body text-[10px]",
          deltaBg,
          deltaTextColor,
        )}>
          {delta}
        </div>
      ) : null}
    </V2Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SCORE BREAKDOWN ROW
// ─────────────────────────────────────────────────────────────────────────

function BreakdownRow({ label, value, max = 100 }) {
  return (
    <div>
      <div className="mb-1 flex justify-between">
        <span className="font-body text-[10px] text-v2-muted">{label}</span>
        <span className="font-body text-[10px] font-medium text-v2-heading">{value}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-v2-border">
        <div
          className="h-full rounded-full bg-v2-purple transition-all duration-500"
          style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// MILESTONE ROW
// ─────────────────────────────────────────────────────────────────────────

function MilestoneRow({ milestone, onOpen }) {
  const total = milestone.totalTasks || 0;
  const done = milestone.tasksCompleted || 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-[10px] p-3 text-left transition-colors hover:bg-v2-page"
    >
      <span className="shrink-0">{milestoneIcon(milestone.status)}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-body text-[12px] font-medium text-v2-heading">
          {milestone.title}
        </p>
        {total > 0 ? (
          <p className="font-body text-[10px] text-v2-muted">
            {done}/{total} tasks · {pct}%
          </p>
        ) : null}
      </div>
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-v2-muted" />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// FOUNDER JOURNEY STAGE TRACKER
// ─────────────────────────────────────────────────────────────────────────

/** Splits a stage's checklist into complete / in-progress / remaining using
 *  the founder's real saved responses (useStageTaskStore) — no fabricated
 *  numbers. "In progress" = has saved text but not marked complete. */
function useStageCriteriaCounts(stageId) {
  const responses = useStageTaskStore((s) => s.responses);
  return useMemo(() => {
    const tasks = STAGE_TASKS[stageId] || [];
    const stageResponses = responses[String(stageId)] || {};
    let complete = 0;
    let inProgress = 0;
    for (const task of tasks) {
      const r = stageResponses[task.id];
      if (r?.completedAt) complete += 1;
      else if (r?.text?.trim()) inProgress += 1;
    }
    return {
      total: tasks.length,
      complete,
      inProgress,
      remaining: Math.max(0, tasks.length - complete - inProgress),
    };
  }, [responses, stageId]);
}

function FounderJourneyTracker({ stageId, completedStages, completionPercentage, onViewCriteria }) {
  const criteria = useStageCriteriaCounts(stageId);

  return (
    <V2Card>
      <V2SectionHead
        title={`Founder Journey — Stage ${stageId} of ${JOURNEY_STAGES.length}`}
        action={
          <button
            type="button"
            onClick={onViewCriteria}
            className="font-body text-[11px] text-v2-blue hover:underline"
          >
            View stage criteria →
          </button>
        }
      />

      {/* Step circles + connectors */}
      <div className="flex items-start">
        {JOURNEY_STAGES.map((stage, idx) => {
          const isDone = completedStages.includes(stage.id) || stage.id < stageId;
          const isActive = stage.id === stageId;
          const isLocked = !isDone && !isActive;

          return (
            <React.Fragment key={stage.id}>
              <div className="flex flex-1 flex-col items-center gap-1.5 px-1">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[1.5px]",
                    "font-body text-[12px] font-medium",
                    isDone && "border-v2-blue bg-v2-blue text-white",
                    isActive && "border-v2-blue bg-v2-blue-tint text-v2-blue-dark",
                    isLocked && "border-v2-border bg-v2-page text-v2-subtle",
                  )}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : isLocked ? <Lock className="h-3 w-3" /> : stage.id}
                </div>
                <span
                  className={cn(
                    "text-center font-body text-[9px] leading-tight",
                    isActive ? "font-medium text-v2-blue-dark" : "text-v2-subtle",
                  )}
                >
                  {stage.name}
                </span>
              </div>
              {idx < JOURNEY_STAGES.length - 1 ? (
                <div
                  className={cn(
                    "mt-4 h-[1.5px] w-4 shrink-0",
                    stage.id < stageId || completedStages.includes(stage.id)
                      ? "bg-v2-blue"
                      : "bg-v2-border",
                  )}
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </div>

      {/* Stage completion progress */}
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="font-body text-[11px] text-v2-muted">
            Stage {stageId} completion progress
          </span>
          <span className="font-body text-[11px] font-medium text-v2-blue-dark">
            {completionPercentage}%
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-v2-border">
          <div
            className="h-full rounded-full bg-v2-blue transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        {criteria.total > 0 ? (
          <div className="mt-2 flex gap-4">
            <span className="font-body text-[10px] text-v2-subtle">
              <span className="font-medium text-v2-green">{criteria.complete}</span> criteria complete
            </span>
            <span className="font-body text-[10px] text-v2-subtle">
              <span className="font-medium text-v2-heading">{criteria.inProgress}</span> in progress
            </span>
            <span className="font-body text-[10px] text-v2-subtle">
              <span className="font-medium text-v2-subtle">{criteria.remaining}</span> remaining
            </span>
          </div>
        ) : null}
      </div>
    </V2Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// TASK ROW
// ─────────────────────────────────────────────────────────────────────────

function TaskRow({ task }) {
  const chip = taskStatusChip(task.status);
  return (
    <div className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 transition-colors hover:bg-v2-page">
      <div className="min-w-0 flex-1">
        <p className="truncate font-body text-[12px] font-medium text-v2-heading">
          {task.title}
        </p>
        {task.assignedToName ? (
          <p className="font-body text-[11px] text-v2-muted">→ {task.assignedToName}</p>
        ) : null}
      </div>
      <V2Chip variant={chip.variant} dot>{chip.label}</V2Chip>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// TASK CHECK (checkbox for execution loop)
// ─────────────────────────────────────────────────────────────────────────

function TaskCheck({ status }) {
  if (status === "completed") {
    return (
      <div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] border-v2-blue bg-v2-blue">
        <Check className="h-2.5 w-2.5 text-white" />
      </div>
    );
  }
  if (status === "in-progress") {
    return <div className="h-[18px] w-[18px] shrink-0 rounded-[5px] border-[1.5px] border-v2-blue" />;
  }
  if (status === "blocked") {
    return <div className="h-[18px] w-[18px] shrink-0 rounded-[5px] border-[1.5px] border-red-400 bg-red-50" />;
  }
  return <div className="h-[18px] w-[18px] shrink-0 rounded-[5px] border-[1.5px] border-v2-border" />;
}

function loopBadge(status) {
  const map = {
    completed:    { label: "Done",    bg: "bg-v2-green-tint",  color: "text-v2-green-dark"  },
    "in-progress":{ label: "Active",  bg: "bg-v2-blue-tint",   color: "text-v2-blue-dark"   },
    blocked:      { label: "Blocked", bg: "bg-red-50",         color: "text-red-600"         },
    pending:      { label: "Pending", bg: "bg-gray-100",       color: "text-gray-500"        },
  };
  return map[status] ?? map.pending;
}

// ─────────────────────────────────────────────────────────────────────────
// WEEKLY EXECUTION LOOP CARD
// ─────────────────────────────────────────────────────────────────────────

function WeeklyExecutionLoopCard({ tasks, onGoToEngine }) {
  const loopTasks = tasks.slice(0, 5);
  return (
    <V2Card>
      <V2SectionHead
        title="Weekly execution loop"
        action={
          <button type="button" onClick={onGoToEngine} className="font-body text-[11px] text-v2-blue hover:underline">
            Full view →
          </button>
        }
      />
      {loopTasks.length > 0 ? (
        <div className="flex flex-col">
          {loopTasks.map((task) => {
            const badge = loopBadge(task.status);
            const done = task.status === "completed";
            return (
              <div key={task._id ?? task.id} className="flex items-center gap-2 border-b border-v2-border py-2 last:border-0">
                <TaskCheck status={task.status} />
                <span className={cn("flex-1 font-body text-[12px]", done ? "text-v2-muted line-through" : "text-v2-heading")}>
                  {task.title}
                </span>
                <span className={cn("inline-flex items-center rounded-[10px] px-2 py-0.5 font-body text-[10px] font-medium", badge.bg, badge.color)}>
                  {badge.label}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="py-4 text-center font-body text-[12px] text-v2-muted">No tasks this week yet.</p>
      )}
      <button
        type="button"
        onClick={onGoToEngine}
        className="mt-2 flex w-full items-center justify-between rounded-[8px] border border-v2-border bg-v2-page px-3 py-2 font-body text-[12px] text-v2-muted transition-colors hover:bg-v2-border/30"
      >
        <span>Log weekly outcome</span>
        <span>→</span>
      </button>
    </V2Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STREAK CALENDAR CARD
// ─────────────────────────────────────────────────────────────────────────

function StreakCalendarCard({ streak, currentWeekNum, tasks, milestoneProgress }) {
  const taskPct = tasks.length > 0
    ? Math.round(tasks.filter((t) => t.status === "completed").length / tasks.length * 100)
    : 0;
  // Same canonical value the Execution Engine's right panel uses
  // (viewModel.metrics.milestoneProgress) — milestone.status is never
  // actually set to "completed" by anything, so deriving it locally from
  // that field always reads 0% regardless of real progress.
  const milestonePct = milestoneProgress ?? 0;

  return (
    <V2Card>
      <V2SectionHead title="Streak calendar" />
      <p className="mb-2 text-center font-body text-[10px] text-v2-muted">12-week execution history</p>
      <div className="grid grid-cols-6 gap-[3px]">
        {Array.from({ length: 12 }, (_, i) => {
          const w = i + 1;
          const isDone = streak > 0 && w < currentWeekNum && w >= currentWeekNum - streak;
          const isToday = w === currentWeekNum;
          return (
            <div
              key={w}
              className={cn(
                "flex aspect-square items-center justify-center rounded font-body text-[9px] font-medium",
                isDone  ? "bg-v2-blue text-white" :
                isToday ? "border border-v2-blue bg-v2-blue-tint text-v2-blue-dark" :
                          "bg-gray-100 text-v2-muted",
              )}
            >
              W{w}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-col gap-2 border-t border-v2-border pt-3">
        {[
          { label: "Tasks",      pct: taskPct,      color: "bg-v2-blue"  },
          { label: "Milestones", pct: milestonePct, color: "bg-v2-green" },
          { label: "Deliverable",pct: 0,            color: "bg-v2-amber" },
        ].map(({ label, pct, color }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-16 shrink-0 font-body text-[10px] text-v2-muted">{label}</span>
            <div className="h-1.5 flex-1 rounded-full bg-v2-border">
              <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${pct}%` }} />
            </div>
            <span className="w-7 text-right font-body text-[10px] text-v2-muted">{pct}%</span>
          </div>
        ))}
      </div>
    </V2Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// TASK BOARD CARD
// ─────────────────────────────────────────────────────────────────────────

function TaskBoardRow({ task, strikethrough }) {
  const dotBg =
    task.status === "in-progress" ? "bg-v2-blue"  :
    task.status === "blocked"     ? "bg-red-500"  :
    task.status === "completed"   ? "bg-v2-green" : "bg-gray-300";

  return (
    <div className="flex items-center gap-2 border-b border-v2-border py-1.5 last:border-0">
      <div className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotBg)} />
      <span className={cn("flex-1 font-body text-[11px]", strikethrough ? "text-v2-muted line-through" : "text-v2-heading")}>
        {task.title}
      </span>
      {task.assignedToName ? (
        <V2Avatar name={task.assignedToName} size={20} />
      ) : null}
    </div>
  );
}

function TaskBoardCard({ tasks, onManage }) {
  const inProgress = tasks.filter((t) => ["in-progress", "blocked"].includes(t.status)).slice(0, 4);
  const done       = tasks.filter((t) => t.status === "completed").slice(0, 4);

  return (
    <V2Card>
      <V2SectionHead
        title="Task board"
        action={
          <button type="button" onClick={onManage} className="font-body text-[11px] text-v2-blue hover:underline">
            Manage tasks →
          </button>
        }
      />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-1.5 font-body text-[10px] font-medium uppercase tracking-wide text-v2-muted">In progress</p>
          {inProgress.length > 0
            ? inProgress.map((t) => <TaskBoardRow key={t._id ?? t.id} task={t} />)
            : <p className="font-body text-[11px] text-v2-muted">None active</p>}
        </div>
        <div>
          <p className="mb-1.5 font-body text-[10px] font-medium uppercase tracking-wide text-v2-muted">Done this week</p>
          {done.length > 0
            ? done.map((t) => <TaskBoardRow key={t._id ?? t.id} task={t} strikethrough />)
            : <p className="font-body text-[11px] text-v2-muted">None yet</p>}
        </div>
      </div>
    </V2Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// MY TEAM CARD (main content)
// ─────────────────────────────────────────────────────────────────────────

function TeamMainCard({ teamMembers, onFindTalent }) {
  return (
    <V2Card>
      <V2SectionHead
        title="My team"
        action={
          <button type="button" onClick={onFindTalent} className="font-body text-[11px] text-v2-blue hover:underline">
            Find talent →
          </button>
        }
      />
      {teamMembers.length > 0 ? (
        <div className="flex flex-col">
          {teamMembers.slice(0, 5).map((m) => (
            <div key={m._id ?? m.id} className="flex items-center gap-2 py-1.5">
              <div className="relative shrink-0">
                <V2Avatar name={m.name} size={30} />
                <span className={cn(
                  "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-[1.5px] border-white",
                  m.isOnline ? "bg-v2-green" : "bg-gray-400",
                )} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-body text-[12px] font-medium text-v2-heading">{m.name}</p>
                <p className="font-body text-[10px] text-v2-muted capitalize">{m.role ?? "Team Member"}</p>
              </div>
              <span className={cn(
                "inline-flex items-center rounded-[10px] px-2 py-0.5 font-body text-[10px] font-medium",
                m.isOnline ? "bg-v2-green-tint text-v2-green-dark" : "bg-gray-100 text-gray-500",
              )}>
                {m.isOnline ? "Online" : "Offline"}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-2 font-body text-[12px] text-v2-muted">No team members yet.</p>
      )}
    </V2Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// AI STAFF CARD
// ─────────────────────────────────────────────────────────────────────────

const AI_STAFF_LIST = [
  { id: "pm", initials: "PM", name: "AI Product Manager", task: "Building sprint plan",       active: true,  bg: "bg-v2-blue-tint",   color: "text-v2-blue-dark"   },
  { id: "mk", initials: "MK", name: "AI Marketing Agent", task: "Launch copy draft ready",    active: true,  bg: "bg-v2-green-tint",  color: "text-v2-green-dark"  },
  { id: "ga", initials: "GA", name: "AI Growth Analyst",  task: "Awaiting traction data",     active: false, bg: "bg-gray-100",       color: "text-gray-500"       },
];

function AIStaffCard({ onHire }) {
  return (
    <V2Card>
      <V2SectionHead
        title="AI staff"
        action={
          <button type="button" onClick={onHire} className="font-body text-[11px] text-v2-blue hover:underline">
            Hire staff →
          </button>
        }
      />
      <div className="flex flex-col">
        {AI_STAFF_LIST.map((agent) => (
          <div key={agent.id} className="flex items-center gap-2 border-b border-v2-border py-2 last:border-0">
            <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] font-body text-[9px] font-medium", agent.bg, agent.color)}>
              {agent.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-body text-[12px] font-medium text-v2-heading">{agent.name}</p>
              <p className="font-body text-[10px] text-v2-muted">{agent.task}</p>
            </div>
            <div className={cn("h-1.5 w-1.5 shrink-0 rounded-full", agent.active ? "bg-v2-green" : "bg-gray-300")} />
          </div>
        ))}
      </div>
      <div className="mt-2 rounded-[8px] border border-dashed border-v2-border px-3 py-2 text-center cursor-pointer hover:bg-v2-page" onClick={onHire}>
        <span className="font-body text-[11px] text-v2-muted">+ Hire AI Finance Officer</span>
      </div>
    </V2Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// RIGHT PANEL
// ─────────────────────────────────────────────────────────────────────────

function DashboardRightPanel({ scoreData, teamMembers, onPageChange }) {
  const breakdown = scoreData?.breakdown ?? {};
  const score = scoreData?.score ?? 0;
  const change = scoreData?.weeklyChange ?? 0;

  return (
    <div className="flex flex-col gap-3 p-3">

      {/* Score card */}
      <V2Card className="flex flex-col items-center gap-3 py-4">
        <V2ScoreRing score={score} size={88} />
        <div className="text-center">
          <p className="font-body text-[11px] font-medium uppercase tracking-wide text-v2-muted">
            Execution Score
          </p>
          {change !== 0 ? (
            <div className={cn("mt-1 flex items-center justify-center gap-1 font-body text-[11px] font-medium",
              change > 0 ? "text-v2-green" : "text-red-500")}>
              {change > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(change)} pts this week
            </div>
          ) : null}
        </div>
      </V2Card>

      {/* Score breakdown */}
      <V2Card>
        <V2SectionHead title="Score Breakdown" />
        <div className="flex flex-col gap-3">
          <BreakdownRow label="Task Completion" value={breakdown.weeklyCompletion ?? 0} />
          <BreakdownRow label="Outcome Quality"  value={breakdown.outcomeQuality   ?? 0} />
          <BreakdownRow label="Consistency"      value={breakdown.consistency      ?? 0} />
          <BreakdownRow label="Progression"      value={breakdown.progression      ?? 0} />
        </div>
      </V2Card>

      {/* Team presence */}
      {teamMembers?.length > 0 ? (
        <V2Card>
          <V2SectionHead
            title="Team"
            action={
              <button
                type="button"
                onClick={() => onPageChange("startup-office")}
                className="font-body text-[11px] text-v2-blue hover:underline"
              >
                View office →
              </button>
            }
          />
          <div className="flex flex-col gap-2">
            {teamMembers.slice(0, 5).map((m) => (
              <div key={m._id ?? m.id} className="flex items-center gap-2">
                <V2Avatar name={m.name} size={28} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-[12px] font-medium text-v2-heading">
                    {m.name}
                  </p>
                  <p className="font-body text-[10px] text-v2-muted capitalize">
                    {m.role ?? "Team Member"}
                  </p>
                </div>
                <V2Dot variant={m.isOnline ? "green" : "grey"} />
              </div>
            ))}
          </div>
        </V2Card>
      ) : null}

      {/* Quick actions */}
      <V2Card>
        <V2SectionHead title="Quick Actions" />
        <div className="flex flex-col gap-2">
          <V2Btn
            variant="primary"
            className="w-full justify-start gap-2"
            onClick={() => onPageChange("ai-staff")}
          >
            <Bot className="h-3.5 w-3.5" />
            Chat with AI PM
          </V2Btn>
          <V2Btn
            variant="secondary"
            className="w-full justify-start gap-2"
            onClick={() => onPageChange("blueprints")}
          >
            <Map className="h-3.5 w-3.5" />
            Browse Blueprints
          </V2Btn>
          <V2Btn
            variant="secondary"
            className="w-full justify-start gap-2"
            onClick={() => onPageChange("mentors")}
          >
            <Users className="h-3.5 w-3.5" />
            Find a Mentor
          </V2Btn>
        </div>
      </V2Card>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────

export default function V2FounderDashboard({ user, onPageChange }) {
  const userId = String(user?._id ?? user?.id ?? "");
  const firstName = user?.name?.split(" ")[0] ?? "Founder";

  // ── Load all data (same as V1) ─────────────────────────────────────────
  const loadAll     = useHomeStore((s) => s.loadAll);
  const homeLoading = useHomeStore((s) => s.loading);

  const scoreData   = useExecutionScoreStore((s) => s.score);
  const score       = scoreData?.score ?? 0;
  const streak      = scoreData?.streak ?? scoreData?.currentStreak ?? 0;

  // Weekly loop store keeps milestones + tasks at top level;
  // derived view model lives in s.viewModel (built by mapFounderWeeklyLoop).
  const milestones  = useWeeklyLoopStore((s) => s.milestones ?? []);
  const tasks       = useWeeklyLoopStore((s) => s.tasks       ?? []);
  const viewModel   = useWeeklyLoopStore((s) => s.viewModel);
  const outcome     = viewModel?.activeOutcome ?? null;
  const weekPct     = viewModel?.metrics?.milestoneProgress ?? 0;

  const teamMembers = useTeamStore((s) => s.members ?? []);

  // Journey store keeps progress at s.progress (not s.journey)
  const journeyProgress = useJourneyStore((s) => s.progress);
  const stageId     = journeyProgress?.currentStage ?? 1;
  const stageName   = `Stage ${stageId}`;
  const completedStages = journeyProgress?.completedStages ?? [];
  const stageCompletionPct = journeyProgress?.stageData?.[stageId]?.completionPercentage ?? 0;

  const startup     = user?.startup ?? null;
  const startupName = startup?.name ?? "Your Startup";

  const primaryCohort = useMembershipsStore((s) => s.primaryCohort);
  const cohortLabel = cohortWeekInfo(primaryCohort);

  useEffect(() => {
    if (userId) loadAll({ userId });
  }, [userId, loadAll]);

  // ── Split tasks into in-progress + blocked for quick view ─────────────
  const activeTasks = useMemo(
    () => tasks.filter((t) => ["in-progress", "blocked"].includes(t.status)).slice(0, 5),
    [tasks],
  );
  const completedCount = useMemo(
    () => tasks.filter((t) => t.status === "completed").length,
    [tasks],
  );

  // ─────────────────────────────────────────────────────────────────────
  // SKELETON LOADING
  // ─────────────────────────────────────────────────────────────────────
  if (homeLoading && !scoreData) {
    return (
      <V2AppLayout
        user={user}
        currentPage="dashboard"
        onPageChange={onPageChange}
        topbarTitle="Founder Dashboard"
      >
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-v2-border border-t-v2-blue" />
            <p className="font-body text-[12px] text-v2-muted">Loading your dashboard…</p>
          </div>
        </div>
      </V2AppLayout>
    );
  }

  // ── Top bar ─────────────────────────────────────────────────────────────
  const topbarChips = [
    <V2Chip key="stage" variant="blue" dot>
      {startupName} · Stage {stageId}
    </V2Chip>,
  ];
  const topbarActions = (
    <>
      <V2Chip variant="grey">Week {outcome?.weekNumber ?? 1} · {currentDayName()}</V2Chip>
      <V2Btn variant="secondary" size="sm" onClick={() => onPageChange("startup-office")}>
        Open Virtual Office
      </V2Btn>
      <V2Btn variant="primary" size="sm" onClick={() => onPageChange("execution-engine")}>
        Set weekly goal
      </V2Btn>
    </>
  );

  // ─────────────────────────────────────────────────────────────────────
  // RIGHT PANEL
  // ─────────────────────────────────────────────────────────────────────
  const rightPanel = (
    <DashboardRightPanel
      scoreData={scoreData}
      teamMembers={teamMembers}
      onPageChange={onPageChange}
    />
  );

  // ─────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────
  return (
    <V2AppLayout
      user={user}
      currentPage="dashboard"
      onPageChange={onPageChange}
      rightPanel={rightPanel}
      topbarTitle="Founder Dashboard"
      topbarChips={topbarChips}
      topbarActions={topbarActions}
    >
      <div className="flex flex-col gap-4 p-4">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <V2Card>
          {/* Eyebrow — real cohort name + week, when the founder is in a cohort */}
          {cohortLabel ? (
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-v2-blue-tint px-2.5 py-1">
              <span className="h-[5px] w-[5px] rounded-full bg-v2-blue" />
              <span className="font-body text-[11px] font-medium text-v2-blue-dark">
                {cohortLabel}
              </span>
            </div>
          ) : null}

          <h2 className="font-heading text-[22px] font-medium text-v2-heading leading-tight">
            Good morning, {firstName}
          </h2>
          <p className="mt-1 font-body text-[13px] text-v2-muted leading-relaxed">
            {startupName} is executing.{" "}
            {streak > 0
              ? `You have a ${streak}-week streak. Keep this week's momentum going.`
              : "Complete this week's goal to start your streak."}
          </p>

          {/* Embedded weekly goal — click through to the execution engine */}
          <button
            type="button"
            onClick={() => onPageChange("execution-engine")}
            className="mt-4 w-full rounded-[10px] border border-v2-border bg-v2-page px-3.5 py-3 text-left transition-colors hover:border-v2-purple-tint hover:bg-v2-purple-tint/30"
          >
            <p className="font-body text-[10px] font-medium uppercase tracking-wide text-v2-subtle">
              This Week's Goal
            </p>
            <p className="mt-1 font-body text-[13px] font-medium text-v2-heading leading-snug">
              {outcome?.goal ?? "No goal set this week — tap to set one."}
            </p>
          </button>
        </V2Card>

        {/* ── Metric tiles ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {/* Execution score */}
          <MetricTile
            icon={TrendingUp}
            label="Execution score"
            value={score}
            delta={scoreData?.weeklyChange
              ? `${scoreData.weeklyChange > 0 ? "+" : ""}${scoreData.weeklyChange} from last week`
              : "No change yet"}
            iconBg="bg-v2-blue-tint"
            iconColor="text-v2-blue"
            valueColor="text-v2-blue"
            deltaBg="bg-v2-blue-tint"
            deltaTextColor="text-v2-blue-dark"
          />

          {/* Execution streak */}
          <MetricTile
            icon={Clock}
            label="Execution streak"
            value={streak > 0 ? `${streak} wk${streak !== 1 ? "s" : ""}` : "0 wks"}
            delta={streak > 0 ? "Keep the streak going" : "Start this week"}
            iconBg="bg-v2-green-tint"
            iconColor="text-v2-green"
            valueColor="text-v2-green"
            deltaBg="bg-v2-green-tint"
            deltaTextColor="text-v2-green-dark"
          />

          {/* Tasks this week */}
          <MetricTile
            icon={CheckCircle2}
            label="Tasks this week"
            value={`${completedCount} / ${tasks.length}`}
            delta={`${Math.max(0, tasks.length - completedCount)} remaining`}
            iconBg="bg-v2-purple-tint"
            iconColor="text-v2-purple"
            valueColor="text-v2-heading"
            deltaBg="bg-v2-purple-tint"
            deltaTextColor="text-v2-purple-dark"
          />

          {/* Week progress */}
          <MetricTile
            icon={Target}
            label="Week progress"
            value={`${weekPct}%`}
            delta={outcome?.goal ? `"${outcome.goal.slice(0, 22)}…"` : "No goal set yet"}
            iconBg="bg-v2-amber-tint"
            iconColor="text-v2-amber"
            valueColor="text-v2-amber"
            deltaBg="bg-v2-amber-tint"
            deltaTextColor="text-v2-amber-dark"
          />
        </div>

        {/* ── Founder journey stage tracker ───────────────────────────────── */}
        <FounderJourneyTracker
          stageId={stageId}
          completedStages={completedStages}
          completionPercentage={stageCompletionPct}
          onViewCriteria={() => onPageChange("journey")}
        />

        {/* ── Bottom: 2fr left | 1fr right ───────────────────────────── */}
        <div className="grid gap-3" style={{ gridTemplateColumns: "2fr 1fr" }}>

          {/* Left 2fr: execution loop + streak calendar, then task board */}
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <WeeklyExecutionLoopCard
                tasks={tasks}
                onGoToEngine={() => onPageChange("execution-engine")}
              />
              <StreakCalendarCard
                streak={streak}
                currentWeekNum={outcome?.weekNumber ?? 1}
                tasks={tasks}
                milestoneProgress={weekPct}
              />
            </div>
            <TaskBoardCard
              tasks={tasks}
              onManage={() => onPageChange("execution-engine")}
            />
          </div>

          {/* Right 1fr: team + AI staff */}
          <div className="flex flex-col gap-3">
            <TeamMainCard
              teamMembers={teamMembers}
              onFindTalent={() => onPageChange("startup-office")}
            />
            <AIStaffCard onHire={() => onPageChange("ai-staff")} />
          </div>

        </div>

      </div>
    </V2AppLayout>
  );
}
