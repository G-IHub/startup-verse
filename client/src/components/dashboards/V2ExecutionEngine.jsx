/**
 * V2ExecutionEngine
 * ─────────────────────────────────────────────────────────────────────────────
 * Weekly execution hub. Founders set their weekly goal, manage milestones and
 * tasks, and track progress all in one place.
 *
 * Data: useWeeklyLoopStore (reused from V1 — no new API calls)
 *   load(founderId)            — initial fetch
 *   saveWeeklyOutcome(outcome) — set/update weekly goal
 *   updateTaskStatus(id,stat)  — move task between statuses
 *   toggleTask(id)             — pending ↔ completed shortcut
 *   updateMilestone(id, patch) — update milestone fields
 */

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { cn } from "../ui/utils";

import V2AppLayout from "../layout/V2AppLayout";
import {
  V2Card,
  V2SectionHead,
  V2Chip,
  V2ScoreRing,
  V2Btn,
  V2Avatar,
  V2Badge,
} from "../shared/v2-primitives";

import { useWeeklyLoopStore } from "../../state/useWeeklyLoopStore";
import { useExecutionScoreStore } from "../../state/useExecutionScoreStore";

import {
  Target,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  Plus,
  Zap,
  Flame,
  AlertTriangle,
  RefreshCw,
  Edit2,
  Check,
  X,
  BarChart2,
  ListChecks,
  Flag,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────

const TASK_STATUSES = ["pending", "in-progress", "completed", "blocked"];

const STATUS_LABEL = {
  pending:     "Pending",
  "in-progress": "In Progress",
  completed:   "Done",
  blocked:     "Blocked",
};

const STATUS_CHIP = {
  pending:     "grey",
  "in-progress": "blue",
  completed:   "green",
  blocked:     "red",
};

const FILTER_TABS = [
  { key: "all",         label: "All" },
  { key: "in-progress", label: "Active" },
  { key: "blocked",    label: "Blocked" },
  { key: "completed",  label: "Done" },
];

// ─────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────

function milePct(m) {
  const t = m.totalTasks || 0;
  const d = m.tasksCompleted || 0;
  return t > 0 ? Math.round((d / t) * 100) : 0;
}

function mileStatus(m) {
  if (m.isCompleted || m.status === "completed") return "completed";
  const pct = milePct(m);
  if (pct > 0) return "in-progress";
  return "pending";
}

function mileIcon(m) {
  const s = mileStatus(m);
  if (s === "completed")
    return <CheckCircle2 className="h-4 w-4 shrink-0 text-v2-green" />;
  if (s === "in-progress")
    return (
      <div className="h-4 w-4 shrink-0 rounded-full border-2 border-v2-blue bg-v2-blue/20" />
    );
  return <Circle className="h-4 w-4 shrink-0 text-v2-border" />;
}

// ─────────────────────────────────────────────────────────────────────────
// WEEKLY GOAL CARD
// ─────────────────────────────────────────────────────────────────────────

function WeeklyGoalCard({ outcome, milestoneProgress, onSave, saving }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const handleEdit = () => {
    setDraft(outcome?.goal ?? "");
    setEditing(true);
  };

  const handleSave = async () => {
    const text = draft.trim();
    if (!text) return;
    await onSave(text);
    setEditing(false);
  };

  const handleCancel = () => {
    setEditing(false);
    setDraft("");
  };

  if (editing) {
    return (
      <V2Card className="border-v2-purple">
        <V2SectionHead title="This Week's Goal" />
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="What is the one thing you need to achieve this week?"
          className={cn(
            "w-full resize-none rounded-[10px] border border-v2-border bg-v2-page",
            "p-3 font-body text-[13px] text-v2-heading outline-none",
            "focus:border-v2-purple placeholder:text-v2-subtle",
          )}
          rows={3}
          autoFocus
        />
        <div className="mt-3 flex justify-end gap-2">
          <V2Btn variant="ghost" size="sm" onClick={handleCancel}>
            <X className="h-3.5 w-3.5" />
            Cancel
          </V2Btn>
          <V2Btn variant="purple" size="sm" onClick={handleSave} disabled={saving || !draft.trim()}>
            {saving ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Save Goal
          </V2Btn>
        </div>
      </V2Card>
    );
  }

  if (!outcome) {
    return (
      <V2Card className="border-dashed border-v2-purple">
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-v2-purple-tint">
            <Target className="h-6 w-6 text-v2-purple" />
          </div>
          <div>
            <p className="font-heading text-[14px] font-semibold text-v2-heading">
              No goal set for this week
            </p>
            <p className="mt-1 font-body text-[12px] text-v2-muted">
              A clear weekly outcome keeps your execution focused.
            </p>
          </div>
          <V2Btn variant="purple" onClick={handleEdit}>
            <Plus className="h-3.5 w-3.5" />
            Set This Week's Goal
          </V2Btn>
        </div>
      </V2Card>
    );
  }

  return (
    <V2Card>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-v2-purple-tint">
            <Target className="h-3.5 w-3.5 text-v2-purple" />
          </div>
          <span className="font-body text-[12px] font-semibold text-v2-heading">
            This Week's Goal
          </span>
        </div>
        <button
          type="button"
          onClick={handleEdit}
          className="flex items-center gap-1 font-body text-[10px] text-v2-muted hover:text-v2-blue"
        >
          <Edit2 className="h-3 w-3" />
          Edit
        </button>
      </div>

      <div className="mb-4 rounded-[10px] bg-v2-purple-tint px-4 py-3">
        <p className="font-body text-[13px] font-medium leading-snug text-v2-purple-dark">
          {outcome.goal}
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-v2-border">
          <div
            className="h-full rounded-full bg-v2-purple transition-all duration-500"
            style={{ width: `${milestoneProgress}%` }}
          />
        </div>
        <span className="w-10 shrink-0 text-right font-body text-[11px] font-medium text-v2-muted">
          {milestoneProgress}%
        </span>
      </div>
      <p className="mt-1 font-body text-[10px] text-v2-muted">
        Milestone completion
      </p>
    </V2Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// MILESTONE ROW (expandable)
// ─────────────────────────────────────────────────────────────────────────

function MilestoneRow({ milestone, tasks, onToggleTask, onUpdateMilestone }) {
  const [open, setOpen] = useState(false);
  const milestoneTasks = useMemo(
    () => tasks.filter((t) => t.milestoneId === (milestone._id ?? milestone.id)),
    [tasks, milestone._id, milestone.id],
  );
  const pct = milePct(milestone);
  const status = mileStatus(milestone);

  return (
    <div className="rounded-[10px] border border-v2-border bg-v2-surface">
      {/* Header row */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        {mileIcon(milestone)}
        <div className="min-w-0 flex-1">
          <p className="truncate font-body text-[12px] font-medium text-v2-heading">
            {milestone.title}
          </p>
          {milestone.totalTasks > 0 && (
            <p className="font-body text-[10px] text-v2-muted">
              {milestone.tasksCompleted}/{milestone.totalTasks} tasks
            </p>
          )}
        </div>
        {/* Progress pill */}
        {milestone.totalTasks > 0 && (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 rounded-full bg-v2-border">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  status === "completed" ? "bg-v2-green" :
                  status === "in-progress" ? "bg-v2-blue" : "bg-v2-border",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-6 text-right font-body text-[10px] text-v2-muted">
              {pct}%
            </span>
          </div>
        )}
        <V2Chip variant={STATUS_CHIP[status] ?? "grey"}>
          {STATUS_LABEL[status] ?? status}
        </V2Chip>
        {open
          ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-v2-muted" />
          : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-v2-muted" />}
      </button>

      {/* Task list (expanded) */}
      {open && (
        <div className="border-t border-v2-border px-4 py-2">
          {milestoneTasks.length > 0 ? (
            <div className="flex flex-col gap-0.5">
              {milestoneTasks.map((task) => (
                <TaskRow
                  key={task._id ?? task.id}
                  task={task}
                  compact
                  onToggle={() => onToggleTask(task._id ?? task.id)}
                />
              ))}
            </div>
          ) : (
            <p className="py-2 font-body text-[11px] text-v2-muted">
              No tasks linked to this milestone yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// TASK ROW
// ─────────────────────────────────────────────────────────────────────────

function TaskRow({ task, compact = false, onToggle, onStatusChange }) {
  const isDone = task.status === "completed";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[8px] transition-colors hover:bg-v2-page",
        compact ? "px-1 py-1.5" : "px-3 py-2.5",
      )}
    >
      {/* Toggle checkbox */}
      <button
        type="button"
        onClick={onToggle}
        className="shrink-0 focus-visible:outline-none"
        aria-label={isDone ? "Mark incomplete" : "Mark complete"}
      >
        {isDone ? (
          <CheckCircle2 className="h-4 w-4 text-v2-green" />
        ) : (
          <Circle className="h-4 w-4 text-v2-border hover:text-v2-blue" />
        )}
      </button>

      {/* Title */}
      <p
        className={cn(
          "min-w-0 flex-1 font-body text-[12px]",
          isDone ? "text-v2-muted line-through" : "text-v2-heading",
        )}
      >
        {task.title}
      </p>

      {/* Assignee */}
      {task.assigneeName && !compact && (
        <V2Avatar name={task.assigneeName} size={20} />
      )}

      {/* Status chip — only in full row mode */}
      {!compact && (
        <V2Chip variant={STATUS_CHIP[task.status] ?? "grey"} dot>
          {STATUS_LABEL[task.status] ?? task.status}
        </V2Chip>
      )}

      {/* Blocked indicator in compact mode */}
      {compact && task.status === "blocked" && (
        <AlertTriangle className="h-3 w-3 shrink-0 text-red-500" />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// RIGHT PANEL
// ─────────────────────────────────────────────────────────────────────────

function ExecutionRightPanel({ scoreData, outcomes, milestoneProgress, onPageChange }) {
  const score = scoreData?.score ?? 0;
  const pastOutcomes = useMemo(
    () => (outcomes ?? []).filter((o) => o.status !== "active").slice(0, 4),
    [outcomes],
  );

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* Score snapshot */}
      <V2Card className="flex items-center gap-3">
        <V2ScoreRing score={score} size={60} strokeWidth={5} />
        <div>
          <p className="font-body text-[10px] font-semibold uppercase tracking-wide text-v2-muted">
            Execution Score
          </p>
          <p className="font-heading text-[20px] font-bold text-v2-heading">
            {score}<span className="text-[12px] text-v2-muted">/100</span>
          </p>
          {milestoneProgress > 0 && (
            <p className="font-body text-[10px] text-v2-muted">
              {milestoneProgress}% milestones done
            </p>
          )}
        </div>
      </V2Card>

      {/* Past outcomes */}
      {pastOutcomes.length > 0 && (
        <V2Card>
          <V2SectionHead title="Past Outcomes" />
          <div className="flex flex-col gap-2">
            {pastOutcomes.map((o, i) => (
              <div key={o._id ?? i} className="flex items-start gap-2">
                {o.status === "completed"
                  ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-v2-green" />
                  : <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-v2-muted" />}
                <p className="font-body text-[11px] leading-snug text-v2-body line-clamp-2">
                  {o.goal}
                </p>
              </div>
            ))}
          </div>
        </V2Card>
      )}

      {/* Streak & tips */}
      <V2Card>
        <V2SectionHead title="Tips" />
        <div className="flex flex-col gap-2.5">
          <div className="flex items-start gap-2">
            <Flame className="mt-0.5 h-3.5 w-3.5 shrink-0 text-v2-amber" />
            <p className="font-body text-[11px] text-v2-muted leading-snug">
              Complete tasks daily to build your streak and grow your score.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Flag className="mt-0.5 h-3.5 w-3.5 shrink-0 text-v2-blue" />
            <p className="font-body text-[11px] text-v2-muted leading-snug">
              Set one clear weekly outcome — not three. Focus wins.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-v2-purple" />
            <p className="font-body text-[11px] text-v2-muted leading-snug">
              Ask your AI PM to break down blockers into smaller tasks.
            </p>
          </div>
        </div>
      </V2Card>

      {/* CTA */}
      <V2Btn
        variant="purple"
        className="w-full justify-center"
        onClick={() => onPageChange("ai-staff")}
      >
        <Zap className="h-3.5 w-3.5" />
        Ask AI PM for help
      </V2Btn>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────

export default function V2ExecutionEngine({ user, onPageChange }) {
  const userId    = String(user?._id ?? user?.id ?? "");
  const firstName = user?.name?.split(" ")[0] ?? "Founder";

  // ── Store wiring ──────────────────────────────────────────────────────
  const loadLoop      = useWeeklyLoopStore((s) => s.load);
  const loopLoading   = useWeeklyLoopStore((s) => s.loading);
  const loopRefreshing= useWeeklyLoopStore((s) => s.refreshing);
  const milestones    = useWeeklyLoopStore((s) => s.milestones ?? []);
  const tasks         = useWeeklyLoopStore((s) => s.tasks      ?? []);
  const outcomes      = useWeeklyLoopStore((s) => s.outcomes   ?? []);
  const viewModel     = useWeeklyLoopStore((s) => s.viewModel);
  const saveOutcome   = useWeeklyLoopStore((s) => s.saveWeeklyOutcome);
  const toggleTask    = useWeeklyLoopStore((s) => s.toggleTask);
  const updateMilestone = useWeeklyLoopStore((s) => s.updateMilestone);

  const scoreData     = useExecutionScoreStore((s) => s.score);

  const activeOutcome     = viewModel?.activeOutcome ?? null;
  const milestoneProgress = viewModel?.metrics?.milestoneProgress ?? 0;

  // ── Local UI state ────────────────────────────────────────────────────
  const [taskFilter, setTaskFilter]   = useState("all");
  const [goalSaving, setGoalSaving]   = useState(false);
  const [togglingId, setTogglingId]   = useState(null);

  // ── Load data ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (userId) loadLoop(userId);
  }, [userId, loadLoop]);

  // ── Derived data ──────────────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    if (taskFilter === "all") return tasks;
    return tasks.filter((t) => t.status === taskFilter);
  }, [tasks, taskFilter]);

  const taskCounts = useMemo(() => {
    const c = { all: tasks.length, "in-progress": 0, blocked: 0, completed: 0, pending: 0 };
    for (const t of tasks) {
      if (c[t.status] !== undefined) c[t.status]++;
    }
    return c;
  }, [tasks]);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleSaveGoal = useCallback(async (goalText) => {
    setGoalSaving(true);
    try {
      await saveOutcome({ goal: goalText, status: "active" });
    } catch (err) {
      console.error("[V2ExecutionEngine] saveOutcome failed:", err);
    } finally {
      setGoalSaving(false);
    }
  }, [saveOutcome]);

  const handleToggleTask = useCallback(async (taskId) => {
    if (togglingId) return;
    setTogglingId(taskId);
    try {
      await toggleTask(taskId);
    } catch (err) {
      console.error("[V2ExecutionEngine] toggleTask failed:", err);
    } finally {
      setTogglingId(null);
    }
  }, [toggleTask, togglingId]);

  // ── Right panel ───────────────────────────────────────────────────────
  const rightPanel = (
    <ExecutionRightPanel
      scoreData={scoreData}
      outcomes={outcomes}
      milestoneProgress={milestoneProgress}
      onPageChange={onPageChange}
    />
  );

  // ── Loading state ─────────────────────────────────────────────────────
  if (loopLoading && milestones.length === 0 && tasks.length === 0) {
    return (
      <V2AppLayout user={user} currentPage="execution-engine" onPageChange={onPageChange}>
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-v2-border border-t-v2-purple" />
            <p className="font-body text-[12px] text-v2-muted">Loading your execution data…</p>
          </div>
        </div>
      </V2AppLayout>
    );
  }

  return (
    <V2AppLayout
      user={user}
      currentPage="execution-engine"
      onPageChange={onPageChange}
      rightPanel={rightPanel}
      topbarTitle="Execution Engine"
      topbarSubtitle={`${firstName}'s weekly execution hub`}
      topbarActions={
        loopRefreshing
          ? <RefreshCw className="h-4 w-4 animate-spin text-v2-muted" />
          : null
      }
    >
      <div className="flex flex-col gap-5 p-5">

        {/* ── Weekly Goal ──────────────────────────────────────────────── */}
        <WeeklyGoalCard
          outcome={activeOutcome}
          milestoneProgress={milestoneProgress}
          onSave={handleSaveGoal}
          saving={goalSaving}
        />

        {/* ── Milestones ───────────────────────────────────────────────── */}
        <V2Card>
          <V2SectionHead
            title="Milestones"
            action={
              <div className="flex items-center gap-2">
                <V2Badge variant="blue">{milestones.length}</V2Badge>
              </div>
            }
          />
          {milestones.length > 0 ? (
            <div className="flex flex-col gap-2">
              {milestones.map((m) => (
                <MilestoneRow
                  key={m._id ?? m.id}
                  milestone={m}
                  tasks={tasks}
                  onToggleTask={handleToggleTask}
                  onUpdateMilestone={updateMilestone}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-v2-blue-tint">
                <ListChecks className="h-5 w-5 text-v2-blue" />
              </div>
              <div>
                <p className="font-body text-[13px] font-medium text-v2-heading">
                  No milestones yet
                </p>
                <p className="mt-0.5 font-body text-[11px] text-v2-muted">
                  Set a weekly goal first, then break it into milestones.
                </p>
              </div>
            </div>
          )}
        </V2Card>

        {/* ── Tasks ────────────────────────────────────────────────────── */}
        <V2Card>
          <div className="mb-3 flex items-center justify-between">
            <V2SectionHead title="Tasks" className="mb-0" />
            <div className="flex items-center gap-1">
              <V2Badge variant="blue">{tasks.length}</V2Badge>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="mb-3 flex items-center gap-1 overflow-x-auto">
            {FILTER_TABS.map((tab) => {
              const count = taskCounts[tab.key] ?? 0;
              const active = taskFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setTaskFilter(tab.key)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 font-body text-[11px] font-medium transition-colors",
                    active
                      ? "bg-v2-purple text-white"
                      : "bg-v2-page text-v2-muted hover:text-v2-heading",
                  )}
                >
                  {tab.label}
                  {count > 0 && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
                        active ? "bg-white/20 text-white" : "bg-v2-border text-v2-muted",
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Task list */}
          {filteredTasks.length > 0 ? (
            <div className="flex flex-col divide-y divide-v2-border">
              {filteredTasks.map((task) => (
                <TaskRow
                  key={task._id ?? task.id}
                  task={task}
                  onToggle={() => handleToggleTask(task._id ?? task.id)}
                />
              ))}
            </div>
          ) : (
            <div className="py-4 text-center">
              {tasks.length === 0 ? (
                <p className="font-body text-[12px] text-v2-muted">
                  No tasks yet. Add milestones and tasks to track your progress.
                </p>
              ) : (
                <p className="font-body text-[12px] text-v2-muted">
                  No {taskFilter === "all" ? "" : STATUS_LABEL[taskFilter]?.toLowerCase()} tasks.
                </p>
              )}
            </div>
          )}
        </V2Card>

        {/* ── Stats row ────────────────────────────────────────────────── */}
        {tasks.length > 0 && (
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Pending",     key: "pending",      color: "text-v2-muted",   bg: "bg-gray-100" },
              { label: "In Progress", key: "in-progress",  color: "text-v2-blue",    bg: "bg-v2-blue-tint" },
              { label: "Blocked",     key: "blocked",      color: "text-red-500",    bg: "bg-red-50" },
              { label: "Done",        key: "completed",    color: "text-v2-green",   bg: "bg-v2-green-tint" },
            ].map(({ label, key, color, bg }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTaskFilter(key)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-[10px] p-3 transition-all",
                  taskFilter === key ? "ring-2 ring-v2-purple" : "",
                  bg,
                )}
              >
                <span className={cn("font-heading text-[20px] font-bold", color)}>
                  {taskCounts[key] ?? 0}
                </span>
                <span className="font-body text-[10px] text-v2-muted">{label}</span>
              </button>
            ))}
          </div>
        )}

      </div>
    </V2AppLayout>
  );
}
