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

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
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
import { useJourneyStore } from "../../state/useJourneyStore";

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
  ArrowRight,
  CheckSquare,
  AlignJustify,
  Clock,
  TrendingUp,
  Star,
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

function milePct(m, milestoneTasks) {
  const t = m.totalTasks || milestoneTasks?.length || 0;
  const d = m.tasksCompleted ?? milestoneTasks?.filter((t) => t.status === "completed").length ?? 0;
  return t > 0 ? Math.round((d / t) * 100) : 0;
}

function mileFullStatus(m, milestoneTasks) {
  if (m.isCompleted || m.status === "completed") return "completed";
  const hasBlocked = milestoneTasks?.some((t) => t.status === "blocked");
  if (hasBlocked) return "at-risk";
  const pct = milePct(m, milestoneTasks);
  if (pct > 0) return "in-progress";
  return "not-started";
}

const MILE_STYLE = {
  completed:    { label: "Complete",     bg: "bg-v2-green-tint",  text: "text-v2-green-dark",  bar: "bg-v2-green"  },
  "in-progress":{ label: "In progress",  bg: "bg-v2-blue-tint",   text: "text-v2-blue-dark",   bar: "bg-v2-blue"   },
  "at-risk":    { label: "At risk",      bg: "bg-v2-amber-tint",  text: "text-v2-amber-dark",  bar: "bg-v2-amber"  },
  "not-started":{ label: "Not started",  bg: "bg-gray-100",       text: "text-gray-500",        bar: "bg-gray-300"  },
};

function taskDayLabel(task) {
  if (task.status === "blocked")   return { label: "Blocked",  color: "text-red-500"     };
  if (task.status === "completed") {
    const raw = task.completedAt ?? task.updatedAt;
    const day = raw ? new Date(raw).toLocaleDateString("en-US", { weekday: "short" }) : null;
    return { label: day ? `Done ${day}` : "Done", color: "text-v2-green" };
  }
  if (task.status === "in-progress") return { label: "Today",    color: "text-v2-blue"      };
  if (task.dueDate) {
    return { label: new Date(task.dueDate).toLocaleDateString("en-US", { weekday: "long" }), color: "text-v2-muted" };
  }
  return { label: "pending", color: "text-v2-subtle" };
}

// ─────────────────────────────────────────────────────────────────────────
// WEEK TABS
// ─────────────────────────────────────────────────────────────────────────

function WeekTabsRow({ weekNumber, selectedWeek, onSelectWeek }) {
  const total = Math.max(weekNumber + 2, 7);
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
      {Array.from({ length: total }, (_, i) => {
        const w = i + 1;
        const isActive  = w === weekNumber;
        const isFuture  = w > weekNumber;
        return (
          <button
            key={w}
            type="button"
            onClick={() => !isFuture && onSelectWeek(w)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 font-body text-[12px] font-medium whitespace-nowrap transition-colors",
              isActive
                ? "border-v2-blue bg-v2-blue text-white"
                : isFuture
                ? "cursor-default border-v2-border bg-v2-surface text-v2-subtle opacity-50"
                : "border-v2-border bg-v2-surface text-v2-muted hover:border-v2-blue/50 hover:text-v2-heading",
            )}
          >
            {isActive ? `Week ${w} · Active` : `Week ${w}`}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 7-STEP EXECUTION LOOP CARD
// ─────────────────────────────────────────────────────────────────────────

const LOOP_STEPS = [
  { step: 1, icon: ArrowRight,   label: "Set weekly goal"   },
  { step: 2, icon: CheckSquare,  label: "Create milestones" },
  { step: 3, icon: AlignJustify, label: "Assign tasks"      },
  { step: 4, icon: Clock,        label: "Team executes"     },
  { step: 5, icon: TrendingUp,   label: "Track progress"    },
  { step: 6, icon: Star,         label: "Log outcome"       },
  { step: 7, icon: RefreshCw,    label: "New cycle begins"  },
];

function deriveCurrentStep(activeOutcome, milestones, tasks) {
  if (!activeOutcome?.goal)        return 1;
  if (milestones.length === 0)     return 2;
  if (tasks.length === 0)          return 3;
  const done    = tasks.filter((t) => t.status === "completed").length;
  const blocked = tasks.filter((t) => t.status === "blocked").length;
  if (done === tasks.length)       return 6;
  if (done >= Math.ceil(tasks.length * 0.5) || blocked > 0) return 5;
  return 4;
}

function SevenStepLoopCard({ currentStep, daysRemaining, taskCounts }) {
  const stepData = LOOP_STEPS.find((s) => s.step === currentStep);
  return (
    <V2Card>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-body text-[12px] font-medium text-v2-heading">
          Weekly execution loop — 7 steps
        </span>
        <button type="button" className="font-body text-[11px] text-v2-blue hover:underline">
          Learn more →
        </button>
      </div>

      {/* Steps row */}
      <div className="flex items-stretch gap-1.5">
        {LOOP_STEPS.map(({ step, icon: Icon, label }, idx) => {
          const done     = step < currentStep;
          const current  = step === currentStep;
          const upcoming = step > currentStep;
          const isLast   = idx === LOOP_STEPS.length - 1;
          return (
            <React.Fragment key={step}>
              <div className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-[10px] border px-1.5 py-2.5 text-center",
                done    ? "border-v2-green bg-v2-green-tint" :
                current ? "border-v2-blue bg-v2-blue-tint"  :
                          "border-v2-border bg-v2-page",
              )}>
                <span className={cn(
                  "font-body text-[10px] font-medium",
                  done    ? "text-v2-green-dark" :
                  current ? "text-v2-blue-dark"  :
                            "text-v2-subtle",
                )}>
                  Step {step}
                </span>
                <Icon className={cn(
                  "h-3.5 w-3.5",
                  done    ? "text-v2-green" :
                  current ? "text-v2-blue"  :
                            "text-v2-subtle",
                )} />
                <span className={cn(
                  "font-body text-[10px] leading-tight",
                  done    ? "font-medium text-v2-green-dark" :
                  current ? "font-medium text-v2-blue-dark"  :
                            "text-v2-subtle",
                )}>
                  {label}
                </span>
              </div>
              {!isLast && (
                <div className="flex shrink-0 items-center">
                  <div className="h-[1px] w-2 bg-v2-border" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Status bar */}
      <div className="mt-3 flex items-center justify-between rounded-[8px] bg-v2-page px-3 py-2">
        <p className="font-body text-[12px] text-v2-muted">
          Currently at{" "}
          <span className="font-medium text-v2-heading">
            Step {currentStep} — {stepData?.label}
          </span>
          {daysRemaining > 0
            ? ` · ${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining`
            : ""}
        </p>
        <div className="flex items-center gap-1.5">
          {taskCounts.completed > 0 && (
            <span className="inline-flex items-center rounded-full bg-v2-green-tint px-2.5 py-0.5 font-body text-[10px] font-medium text-v2-green-dark">
              {taskCounts.completed} tasks done
            </span>
          )}
          {taskCounts["in-progress"] > 0 && (
            <span className="inline-flex items-center rounded-full bg-v2-blue-tint px-2.5 py-0.5 font-body text-[10px] font-medium text-v2-blue-dark">
              {taskCounts["in-progress"]} in progress
            </span>
          )}
          {taskCounts.blocked > 0 && (
            <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 font-body text-[10px] font-medium text-red-600">
              {taskCounts.blocked} blocked
            </span>
          )}
        </div>
      </div>
    </V2Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// WEEKLY GOAL BLOCK (left-bordered, inline — not a V2Card)
// ─────────────────────────────────────────────────────────────────────────

// WeeklyGoalBlock — matches .goal-box from the HTML mockup.
// Renders as a plain div (no own card) inside the combined card.
function WeeklyGoalBlock({ outcome, weekNumber, weekPct, stageLabel, onEdit, saving, editTrigger }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState("");

  const handleEdit   = () => { setDraft(outcome?.goal ?? ""); setEditing(true); };
  const handleCancel = () => { setEditing(false); setDraft(""); };
  const handleSave   = async () => {
    const text = draft.trim();
    if (!text) return;
    await onEdit(text);
    setEditing(false);
  };

  const lastTrigger = useRef(editTrigger);
  useEffect(() => {
    if (editTrigger !== lastTrigger.current) { lastTrigger.current = editTrigger; handleEdit(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editTrigger]);

  if (editing) {
    return (
      <div className="mb-3.5 rounded-r-[10px] border-l-[3px] border-v2-blue bg-v2-page px-4 py-3.5">
        <p className="mb-2 font-body text-[9px] font-medium uppercase tracking-[0.7px] text-v2-blue">
          WEEKLY GOAL — WEEK {weekNumber}
        </p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="What is the one outcome you need this week?"
          className="w-full resize-none rounded-[8px] border border-v2-border bg-white p-3 font-body text-[13px] text-v2-heading outline-none focus:border-v2-blue placeholder:text-v2-subtle"
          rows={3}
          autoFocus
        />
        <div className="mt-3 flex justify-end gap-2">
          <V2Btn variant="ghost" size="sm" onClick={handleCancel}><X className="h-3.5 w-3.5" />Cancel</V2Btn>
          <V2Btn variant="primary" size="sm" onClick={handleSave} disabled={saving || !draft.trim()}>
            {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Save Goal
          </V2Btn>
        </div>
      </div>
    );
  }

  if (!outcome) {
    return (
      <div className="mb-3.5 flex flex-col items-center gap-3 rounded-[10px] border border-dashed border-v2-blue/40 py-5 text-center">
        <p className="font-body text-[12px] text-v2-muted">No goal set for Week {weekNumber} yet.</p>
        <V2Btn variant="primary" size="sm" onClick={handleEdit}>
          <Plus className="h-3.5 w-3.5" />Set weekly goal
        </V2Btn>
      </div>
    );
  }

  // Matches .goal-box: bg-#f9fafb, border-left 3px solid blue, rounded-r, padding 14px 16px
  return (
    <div className="mb-3.5 rounded-r-[10px] border-l-[3px] border-v2-blue bg-v2-page px-4 py-3.5">
      <p className="mb-1 font-body text-[9px] font-medium uppercase tracking-[0.7px] text-v2-blue">
        WEEKLY GOAL — WEEK {weekNumber}
      </p>
      <p className="font-body text-[14px] font-medium leading-[1.4] text-v2-heading">
        {outcome.goal}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2.5">
        {stageLabel && (
          <span className="inline-flex items-center rounded-full bg-v2-blue-tint px-2 py-0.5 font-body text-[10px] font-medium text-v2-blue-dark">
            Stage 1 aligned
          </span>
        )}
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 font-body text-[10px] font-medium text-gray-600">
          Due Sunday
        </span>
        <span className="font-body text-[11px] text-v2-muted">Week progress: {weekPct}% complete</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// BLOCKER BANNER
// ─────────────────────────────────────────────────────────────────────────

function BlockerBanner({ task }) {
  return (
    <div className="mt-[4px] flex items-start rounded-[6px] px-[8px] py-[6px]" style={{ background: "#FCEBEB", gap: 6 }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mt-[1px] shrink-0">
        <circle cx="7" cy="7" r="5.5" stroke="#A32D2D" strokeWidth="1.2"/>
        <path d="M7 4v3M7 9.5v.5" stroke="#A32D2D" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
      <div className="min-w-0 flex-1">
        <p className="font-body text-[10px] font-medium" style={{ color: "#791F1F" }}>
          Blocker — {task.assignedToName ?? "Team"}
        </p>
        <p className="mt-[1px] font-body text-[10px] leading-snug" style={{ color: "#A32D2D" }}>
          {task.blockerNote ?? task.notes ?? "Waiting on external dependency"}
        </p>
      </div>
      <button
        type="button"
        className="shrink-0 rounded-[6px] border border-red-200 bg-white font-body font-medium transition-colors hover:bg-red-50"
        style={{ fontSize: 10, padding: "3px 8px", color: "#791F1F" }}
      >
        Resolve
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// TASK LINE (inline task under a milestone)
// ─────────────────────────────────────────────────────────────────────────

function TaskLine({ task, onToggle }) {
  const isDone    = task.status === "completed";
  const isBlocked = task.status === "blocked";
  const isActive  = task.status === "in-progress";
  const day       = taskDayLabel(task);

  // Day chip colors matching HTML mockup colored chips
  const dayChipStyle = isBlocked
    ? "bg-red-50 text-red-500"
    : isDone
    ? "bg-v2-green-tint text-v2-green-dark"
    : isActive
    ? "bg-v2-blue-tint text-v2-blue-dark"
    : "bg-gray-100 text-gray-500";

  return (
    <div className="flex items-center gap-2 border-b py-[7px] last:border-0" style={{ borderBottomColor: "#f3f4f6", borderBottomWidth: "0.5px" }}>
      <button
        type="button"
        onClick={onToggle}
        className="shrink-0 focus-visible:outline-none"
        aria-label={isDone ? "Mark incomplete" : "Mark complete"}
      >
        {isDone ? (
          /* .tck.done — filled blue with checkmark */
          <div className="flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border-[1.5px] border-v2-blue bg-v2-blue">
            <Check className="h-2.5 w-2.5 text-white" />
          </div>
        ) : isBlocked ? (
          /* .tck.blocked — #FCEBEB bg, red border, horizontal bar inside */
          <div className="relative flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border-[1.5px] border-red-400 bg-[#FCEBEB]">
            <div className="h-[2px] w-[8px] rounded-full bg-red-400" />
          </div>
        ) : isActive ? (
          /* .tck.doing — blue outline only */
          <div className="h-[18px] w-[18px] rounded-[5px] border-[1.5px] border-v2-blue transition-colors" />
        ) : (
          /* pending — gray outline */
          <div className="h-[18px] w-[18px] rounded-[5px] border-[1.5px] border-gray-300 transition-colors hover:border-v2-blue" />
        )}
      </button>
      <span className={cn("flex-1 font-body text-[12px]", isDone ? "text-v2-muted line-through" : "text-v2-heading")}>
        {task.title}
      </span>
      {task.assignedToName ? <V2Avatar name={task.assignedToName} size={20} /> : null}
      {/* Day label as small colored chip */}
      <span className={cn("shrink-0 rounded-[5px] px-1.5 py-0.5 font-body text-[10px] font-medium", dayChipStyle)}>
        {day.label}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// MILESTONE SECTION (always-expanded)
// ─────────────────────────────────────────────────────────────────────────

// Status-based circle colors, matching HTML mockup exactly
const MILE_CIRCLE = {
  completed:    { bg: "bg-[#EAF3DE]", text: "text-[#27500A]" },
  "in-progress":{ bg: "bg-[#E6F1FB]", text: "text-[#0C447C]" },
  "at-risk":    { bg: "bg-v2-amber-tint", text: "text-v2-amber-dark" },
  "not-started":{ bg: "bg-gray-100",   text: "text-gray-400" },
};

function MilestoneSection({ milestone, tasks, index, onToggleTask, onAddTask }) {
  const [addingTask, setAddingTask] = useState(false);
  const [taskDraft,  setTaskDraft]  = useState("");
  const [savingTask, setSavingTask] = useState(false);

  const milestoneId = milestone._id ?? milestone.id;

  const handleSaveTask = async () => {
    const text = taskDraft.trim();
    if (!text) return;
    setSavingTask(true);
    try {
      await onAddTask(milestoneId, text);
      setTaskDraft("");
      setAddingTask(false);
    } finally {
      setSavingTask(false);
    }
  };

  const milestoneTasks = useMemo(
    () => tasks.filter((t) => t.milestoneId === milestoneId),
    [tasks, milestoneId],
  );
  const pct    = milePct(milestone, milestoneTasks);
  const status = mileFullStatus(milestone, milestoneTasks);
  const style  = MILE_STYLE[status] ?? MILE_STYLE["not-started"];
  const circle = MILE_CIRCLE[status] ?? MILE_CIRCLE["not-started"];
  const total  = milestone.totalTasks ?? milestoneTasks.length;
  const done   = milestone.tasksCompleted ?? milestoneTasks.filter((t) => t.status === "completed").length;

  return (
    <div className="border-b border-v2-border pb-3 last:border-0 last:pb-0">
      {/* Single header row: M circle | title | task count | progress bar | status badge */}
      <div className="mb-2 flex items-center gap-2">
        {/* 22×22 circle matching .ms-num in HTML */}
        <span className={cn(
          "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full font-body text-[10px] font-medium",
          circle.bg, circle.text,
        )}>
          M{index + 1}
        </span>
        <span className="min-w-0 flex-[2] truncate font-body text-[13px] font-medium text-v2-heading">
          {milestone.title}
        </span>
        <span className="shrink-0 font-body text-[11px] text-gray-400">{done} / {total} tasks</span>
        {/* flex-1 min-w-[40px] matching .ms-bar-bg */}
        <div className="ml-2 min-w-[40px] flex-1 overflow-hidden rounded-[3px] bg-gray-100" style={{ height: 4 }}>
          <div
            className={cn("h-full rounded-[3px] transition-all duration-500", style.bar)}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={cn("shrink-0 inline-flex items-center rounded-full px-2 py-0.5 font-body text-[10px] font-medium", style.bg, style.text)}>
          {style.label}
        </span>
      </div>

      {/* Tasks — ml-[30px] = 22px circle + 8px gap, matching .task-row margin-left:30px */}
      <div className="ml-[30px]">
        {milestoneTasks.map((task) => (
          <React.Fragment key={task._id ?? task.id}>
            <TaskLine task={task} onToggle={() => onToggleTask(task._id ?? task.id)} />
            {task.status === "blocked" && <BlockerBanner task={task} />}
          </React.Fragment>
        ))}

        {/* Inline add-task form */}
        {addingTask ? (
          <div className="mt-2 flex items-center gap-2">
            <div className="h-[18px] w-[18px] shrink-0 rounded-[5px] border-[1.5px] border-dashed border-gray-300" />
            <input
              autoFocus
              type="text"
              value={taskDraft}
              onChange={(e) => setTaskDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveTask();
                if (e.key === "Escape") { setAddingTask(false); setTaskDraft(""); }
              }}
              placeholder="Task title…"
              className="flex-1 rounded-[6px] border border-v2-blue bg-white px-2 py-1 font-body text-[12px] text-v2-heading outline-none placeholder:text-v2-subtle"
            />
            <button
              type="button"
              onClick={handleSaveTask}
              disabled={savingTask || !taskDraft.trim()}
              className="shrink-0 rounded-[6px] bg-v2-blue px-2.5 py-1 font-body text-[11px] font-medium text-white disabled:opacity-50"
            >
              {savingTask ? "…" : "Add"}
            </button>
            <button
              type="button"
              onClick={() => { setAddingTask(false); setTaskDraft(""); }}
              className="shrink-0 font-body text-[11px] text-v2-subtle hover:text-v2-muted"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => { setAddingTask(true); setTaskDraft(""); }}
            className="mt-1 flex items-center gap-1.5 font-body text-[11px] text-v2-subtle hover:text-v2-blue"
          >
            <div className="flex h-[14px] w-[14px] items-center justify-center rounded-[3px] border-[1.5px] border-dashed border-gray-300">
              <Plus className="h-2 w-2" />
            </div>
            Add task to this milestone
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// LOG OUTCOME SECTION
// ─────────────────────────────────────────────────────────────────────────

const OUTCOME_OPTIONS = [
  { key: "completed", icon: Check,          label: "Completed", desc: "Goal fully achieved",    iconBg: "bg-v2-green-tint",  iconColor: "text-v2-green",  border: "border-v2-green/30"  },
  { key: "partial",   icon: AlertTriangle,  label: "Partial",   desc: "Mostly achieved",        iconBg: "bg-v2-amber-tint",  iconColor: "text-v2-amber",  border: "border-v2-amber/30"  },
  { key: "missed",    icon: X,              label: "Missed",    desc: "Did not achieve goal",   iconBg: "bg-red-50",         iconColor: "text-red-500",   border: "border-red-200"       },
];

// LogOutcomeSection renders as a plain div so it can live inside the big card
// (matching .outcome-section in the HTML: bg:#f9fafb, border-radius:12px)
// LogOutcomeSection — exact values from .outcome-section, .os-*, .score-bump
function LogOutcomeSection({ isAvailable }) {
  return (
    <div className="rounded-[12px] bg-[#f9fafb] px-4 py-[14px]">
      {/* .os-title: font-size:12px; font-weight:500; color:#111; margin-bottom:10px */}
      <p className="font-body text-[12px] font-medium text-[#111]" style={{ marginBottom: 10 }}>
        {isAvailable
          ? "Log weekly outcome"
          : "Log weekly outcome — available Sunday after all tasks are reviewed"}
      </p>
      {/* .os-options: gap:8px; margin-bottom:10px */}
      <div className="grid grid-cols-3" style={{ gap: 8, marginBottom: 10 }}>
        {OUTCOME_OPTIONS.map(({ key, icon: Icon, label, desc, iconBg, iconColor }) => (
          <button
            key={key}
            type="button"
            disabled={!isAvailable}
            className={cn(
              "rounded-[10px] text-center transition-colors",
              isAvailable ? "cursor-pointer hover:border-gray-300" : "cursor-default opacity-60",
            )}
            style={{ border: "1.5px solid #e5e7eb", padding: 10 }}
          >
            {/* .os-icon: width:28px; height:28px; border-radius:8px; margin:0 auto 6px */}
            <div className={cn("mx-auto flex items-center justify-center rounded-[8px]", iconBg)}
              style={{ width: 28, height: 28, marginBottom: 6 }}>
              <Icon className={cn("h-4 w-4", iconColor)} />
            </div>
            {/* .os-label: font-size:11px; font-weight:500 */}
            <p className="font-body text-[11px] font-medium text-[#111]">{label}</p>
            {/* .os-sub: font-size:10px; color:#9ca3af; margin-top:2px */}
            <p className="font-body text-[10px] text-gray-400" style={{ marginTop: 2 }}>{desc}</p>
          </button>
        ))}
      </div>
      {/* .score-bump: display:flex; align-items:center; gap:6px; font-size:11px; color:#6b7280 */}
      <div className="flex items-center font-body text-[11px] text-gray-500" style={{ gap: 6 }}>
        <Star className="h-3.5 w-3.5 shrink-0 text-v2-blue" />
        <span>
          Completed = <strong className="text-v2-blue">+15 pts</strong> · Streak continues ·{" "}
          Partial = <strong style={{ color: "#BA7517" }}>+7 pts</strong> · Missed = streak resets
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// RIGHT PANEL — matches .rp from StartupVerse_Execution_Engine(1).html
// ─────────────────────────────────────────────────────────────────────────

function scoreTitle(score) {
  if (score >= 90) return "Elite Executor";
  if (score >= 80) return "Top Executor";
  if (score >= 70) return "Strong Executor";
  if (score >= 60) return "Active Executor";
  return "Building Momentum";
}

// SVG score ring — matches .score-ring in HTML (r=24, cx/cy=30, sw=6, dasharray=150.8)
function ScoreRingSVG({ score }) {
  const circumference = 150.8;
  const offset = circumference * (1 - Math.min(score, 100) / 100);
  return (
    <div className="relative h-[60px] w-[60px] shrink-0">
      <svg width="60" height="60" viewBox="0 0 60 60" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="30" cy="30" r="24" fill="none" stroke="#f3f4f6" strokeWidth="6" />
        <circle
          cx="30" cy="30" r="24" fill="none"
          stroke="#1B4FD8" strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-body text-[18px] font-medium leading-none text-v2-heading">{score}</span>
        <span className="font-body text-[9px] text-gray-400">/ 100</span>
      </div>
    </div>
  );
}

function ExecutionRightPanel({ scoreData, outcomes, tasks, milestones, milestoneProgress, onPageChange }) {
  const score  = scoreData?.score ?? 0;
  const streak = scoreData?.streak ?? scoreData?.currentStreak ?? 0;

  // Streak dots — W1–W8: blue=past complete, green=current week, gray=upcoming
  const TOTAL_DOTS = 8;
  const streakDots = Array.from({ length: TOTAL_DOTS }, (_, i) => {
    const w = i + 1;
    if (w < streak)  return "past";
    if (w === streak) return "current";
    return "empty";
  });

  // Stat minis
  const tasksDone   = tasks.filter((t) => t.status === "completed").length;
  const taskTotal   = tasks.length;
  const taskPct     = taskTotal > 0 ? Math.round((tasksDone / taskTotal) * 100) : 0;
  const milesDone   = milestones.filter((m) => m.isCompleted || m.status === "completed").length;
  const milesTotal  = milestones.length;
  const outcomesDone = (outcomes ?? []).filter((o) => o.status === "completed").length;
  const outcomesTotal = (outcomes ?? []).length;
  const overallPct  = Math.round((taskPct + milestoneProgress) / 2);

  // Past outcomes for history
  const histOutcomes = useMemo(() => {
    const all = (outcomes ?? []).slice().reverse();
    return all.slice(0, 4);
  }, [outcomes]);

  const histStyle = {
    completed:    { bar: "#1D9E75", label: "Complete",  labelColor: "#27500A"  },
    partial:      { bar: "#BA7517", label: "Partial",   labelColor: "#633806"  },
    missed:       { bar: "#E24B4A", label: "Missed",    labelColor: "#791F1F"  },
    active:       { bar: "#1B4FD8", label: "Active",    labelColor: "#185FA5"  },
    "not-started":{ bar: "#d1d5db", label: "Pending",   labelColor: "#9ca3af"  },
  };

  // AI PM nudge — derive from blocked tasks
  const blockedTasks = tasks.filter((t) => t.status === "blocked");
  const aiNudge = blockedTasks.length > 0
    ? `${blockedTasks[0].assignedToName ?? "A team member"} is blocked on "${blockedTasks[0].title}". Resolve this blocker before it delays the rest of the milestone.`
    : "You're on track this week! Stay focused on your top milestone to hit your weekly goal.";

  // Team task load — group by assignee
  const teamLoad = useMemo(() => {
    const map = {};
    for (const t of tasks) {
      if (!t.assignedToName) continue;
      if (!map[t.assignedToName]) map[t.assignedToName] = { done: 0, active: 0, blocked: 0, pending: 0 };
      if (t.status === "completed")   map[t.assignedToName].done++;
      else if (t.status === "in-progress") map[t.assignedToName].active++;
      else if (t.status === "blocked") map[t.assignedToName].blocked++;
      else map[t.assignedToName].pending++;
    }
    return Object.entries(map).map(([name, c]) => ({
      name,
      initials: name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
      total: c.done + c.active + c.blocked + c.pending,
      done: c.done, active: c.active, blocked: c.blocked, pending: c.pending,
      isBlocked: c.blocked > 0,
    }));
  }, [tasks]);

  // Avatar bg colors cycling
  const AVATAR_COLORS = [
    { bg: "#E6F1FB", color: "#0C447C" },
    { bg: "#EAF3DE", color: "#27500A" },
    { bg: "#FAEEDA", color: "#633806" },
    { bg: "#FCEBEB", color: "#791F1F" },
    { bg: "#EEEDFE", color: "#3C3489" },
  ];

  return (
    <div className="flex flex-col gap-3.5 p-4">

      {/* ── Execution score card ─────────────────────────────────────── */}
      <div className="rounded-[12px] bg-[#f9fafb] p-3">
        <p className="mb-2 font-body text-[12px] font-medium text-v2-heading">Execution score</p>
        {/* .score-ring-wrap: gap:12px; margin-bottom:10px */}
        <div className="flex items-center" style={{ gap: 12, marginBottom: 10 }}>
          <ScoreRingSVG score={score} />
          <div>
            {/* .sc-title: font-size:12px; font-weight:500; color:#111; margin-bottom:2px */}
            <p className="font-body text-[12px] font-medium text-[#111]" style={{ marginBottom: 2 }}>{scoreTitle(score)}</p>
            {/* .sc-desc: font-size:10px; color:#6b7280; line-height:1.4 */}
            <p className="font-body text-[9px] leading-[1.4]" style={{ color: "#6b7280" }}>
              Complete this week's outcome to reach {Math.min(score + 15, 100)} and build your streak.
            </p>
          </div>
        </div>
        {/* "4-week streak" label: font-size:10px; color:#9ca3af; margin-bottom:4px */}
        <p className="font-body text-[8px]" style={{ color: "#9ca3af", marginBottom: 4 }}>{streak}-week streak</p>
        {/* .streak-dots: gap:3px; margin-top:8px */}
        <div className="flex" style={{ gap: 3, marginTop: 8 }}>
          {streakDots.map((type, i) => (
            <div
              key={i}
              className="flex items-center justify-center font-body font-medium"
              style={{
                width: 18, height: 18, borderRadius: 4, fontSize: 8,
                background: type === "past" ? "#1B4FD8" : type === "current" ? "#1D9E75" : "#f3f4f6",
                color:      type === "past" ? "#fff"    : type === "current" ? "#fff"    : "#9ca3af",
              }}
            >
              W{i + 1}
            </div>
          ))}
        </div>
        {/* .stat-mini: gap:6px; margin-top:8px */}
        <div className="flex" style={{ gap: 6, marginTop: 8 }}>
          {/* .sm-box: flex:1; background:#fff; border-radius:8px; padding:7px 8px; text-align:center */}
          <div className="flex-1 rounded-[8px] bg-white text-center" style={{ padding: "7px 8px" }}>
            {/* .sm-v: font-size:14px; font-weight:500 */}
            <p className="font-body text-[14px] font-medium" style={{ color: "#1D9E75" }}>{taskPct}%</p>
            {/* .sm-l: font-size:9px; color:#9ca3af */}
            <p className="font-body text-[9px]" style={{ color: "#9ca3af" }}>Completion</p>
          </div>
          <div className="flex-1 rounded-[8px] bg-white text-center" style={{ padding: "7px 8px" }}>
            <p className="font-body text-[14px] font-medium" style={{ color: "#1B4FD8" }}>{outcomesDone}/{Math.max(outcomesTotal, 1)}</p>
            <p className="font-body text-[9px]" style={{ color: "#9ca3af" }}>Outcomes</p>
          </div>
          <div className="flex-1 rounded-[8px] bg-white text-center" style={{ padding: "7px 8px" }}>
            <p className="font-body text-[14px] font-medium" style={{ color: "#BA7517" }}>{tasksDone}</p>
            <p className="font-body text-[9px]" style={{ color: "#9ca3af" }}>Tasks done</p>
          </div>
        </div>
      </div>

      {/* ── This week's progress ─────────────────────────────────────── */}
      <div className="rounded-[12px] bg-[#f9fafb] p-3">
        <p className="mb-2 font-body text-[12px] font-medium text-v2-heading">This week's progress</p>
        {/* .prog-row: gap:7px; margin-bottom:6px | .pr-label: 10px #6b7280 w:60px | .pr-bg: h:5px #e5e7eb | .pr-val: 10px #6b7280 w:28px */}
        {[
          { label: "Tasks",       pct: taskPct,           bar: "#1B4FD8" },
          { label: "Milestones",  pct: milestoneProgress, bar: "#1D9E75" },
          { label: "Deliverable", pct: 0,                 bar: "#BA7517" },
          { label: "Overall",     pct: overallPct,        bar: "#534AB7" },
        ].map(({ label, pct, bar }, i, arr) => (
          <div key={label} className="flex items-center" style={{ gap: 7, marginBottom: i < arr.length - 1 ? 6 : 0 }}>
            <span className="shrink-0 font-body text-[10px]" style={{ color: "#6b7280", width: 60 }}>{label}</span>
            <div className="flex-1 overflow-hidden rounded-[3px]" style={{ height: 5, background: "#e5e7eb" }}>
              <div className="h-full rounded-[3px] transition-all duration-500" style={{ width: `${pct}%`, background: bar }} />
            </div>
            <span className="shrink-0 text-right font-body text-[10px]" style={{ color: "#6b7280", width: 28 }}>{pct}%</span>
          </div>
        ))}
      </div>

      {/* ── Execution history ────────────────────────────────────────── */}
      {histOutcomes.length > 0 && (
        <div className="rounded-[12px] bg-[#f9fafb] p-3">
          <p className="mb-2 font-body text-[12px] font-medium text-v2-heading">Execution history</p>
          {/* .hist-row: gap:8px; padding:6px 0; border-bottom:0.5px solid #e5e7eb
               .hist-week: 11px 500 #111 w:36px | .hist-bar-bg: h:6px #f3f4f6 | .hist-outcome: 10px w:48px */}
          {histOutcomes.map((o, i) => {
            const s = histStyle[o.status ?? "not-started"] ?? histStyle["not-started"];
            const pct = o.status === "completed" ? 88 : o.status === "partial" ? 65 : o.status === "active" ? 40 : 20;
            return (
              <div key={o._id ?? i} className="flex items-center last:border-0"
                style={{ gap: 8, padding: "6px 0", borderBottom: "0.5px solid #e5e7eb" }}>
                <span className="shrink-0 font-body text-[11px] font-medium text-[#111]" style={{ width: 36 }}>
                  Wk {o.weekNumber ?? i + 1}
                </span>
                <div className="flex-1 overflow-hidden rounded-[3px]" style={{ height: 6, background: "#f3f4f6" }}>
                  <div className="h-full rounded-[3px]" style={{ width: `${pct}%`, background: s.bar }} />
                </div>
                <span className="shrink-0 text-right font-body text-[10px] font-medium" style={{ color: s.labelColor, width: 48 }}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── AI PM nudge box — .ai-box (purple left border) ──────────── */}
      <div className="rounded-r-[10px] border-l-[3px] bg-[#f9fafb] px-3 py-2.5" style={{ borderLeftColor: "#534AB7" }}>
        <p className="mb-1 font-body text-[9px] font-medium uppercase tracking-[0.6px]" style={{ color: "#3C3489" }}>
          AI Product Manager
        </p>
        <p className="font-body text-[11px] leading-[1.5] text-gray-500">{aiNudge}</p>
        <button type="button" className="mt-1.5 font-body text-[11px] font-medium" style={{ color: "#534AB7" }}>
          Ask AI PM →
        </button>
      </div>

      {/* ── Team task load ───────────────────────────────────────────── */}
      {teamLoad.length > 0 && (
        <div className="rounded-[12px] bg-[#f9fafb] p-3">
          <p className="mb-2 font-body text-[12px] font-medium text-v2-heading">Team task load</p>
          <div className="flex flex-col gap-2">
            {teamLoad.map((m, idx) => {
              const { bg, color } = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              const total = m.total || 1;
              return (
                <div key={m.name} className="flex items-center gap-2">
                  {/* .tav w:22px h:22px font-size:8px */}
                  <div
                    className="flex shrink-0 items-center justify-center rounded-full font-body font-medium"
                    style={{ width: 22, height: 22, fontSize: 8, background: bg, color }}
                  >
                    {m.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    {/* name: font-size:11px; color:#111 */}
                    <p className="font-body text-[11px] text-[#111]">{m.name}</p>
                    {/* .task-load-bar: gap:2px; margin-top:3px */}
                    <div className="flex" style={{ gap: 2, marginTop: 3 }}>
                      {m.done   > 0 && <div className="h-[4px] rounded-[2px] bg-v2-green"  style={{ flex: m.done }}   />}
                      {m.active > 0 && <div className="h-[4px] rounded-[2px] bg-v2-blue"   style={{ flex: m.active }} />}
                      {m.blocked> 0 && <div className="h-[4px] rounded-[2px]"              style={{ flex: m.blocked, background: "#E24B4A" }} />}
                      {m.pending> 0 && <div className="h-[4px] rounded-[2px] bg-gray-200"  style={{ flex: m.pending }} />}
                    </div>
                  </div>
                  {/* count: font-size:10px color:#9ca3af | if blocked: color:#791F1F font-weight:500 */}
                  <span
                    className="shrink-0 font-body text-[10px]"
                    style={{ color: m.isBlocked ? "#791F1F" : "#9ca3af", fontWeight: m.isBlocked ? 500 : 400, whiteSpace: "nowrap" }}
                  >
                    {m.isBlocked ? "Blocked" : `${m.total} task${m.total !== 1 ? "s" : ""}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Log weekly outcome button: .btn-g width:100% border-radius:10px padding:10px ── */}
      <button
        type="button"
        className="w-full rounded-[10px] font-body text-[12px] font-medium text-white transition-colors hover:opacity-90"
        style={{ background: "#1D9E75", padding: 10 }}
      >
        Log weekly outcome →
      </button>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────

export default function V2ExecutionEngine({ user, onPageChange }) {
  // Try every field the user object could carry the founder ID under
  const userId = String(
    user?._id ?? user?.id ?? user?.userId ?? user?.founderId ?? user?.founder_id ?? ""
  );

  // ── Store wiring ──────────────────────────────────────────────────────
  const loadLoop      = useWeeklyLoopStore((s) => s.load);
  const setFounderId  = useWeeklyLoopStore((s) => s.setFounderId);
  const loopLoading   = useWeeklyLoopStore((s) => s.loading);
  const loopRefreshing= useWeeklyLoopStore((s) => s.refreshing);
  const milestones    = useWeeklyLoopStore((s) => s.milestones ?? []);
  const tasks         = useWeeklyLoopStore((s) => s.tasks      ?? []);
  const outcomes      = useWeeklyLoopStore((s) => s.outcomes   ?? []);
  const viewModel     = useWeeklyLoopStore((s) => s.viewModel);
  const saveOutcome   = useWeeklyLoopStore((s) => s.saveWeeklyOutcome);
  const toggleTask    = useWeeklyLoopStore((s) => s.toggleTask);
  const updateMilestone  = useWeeklyLoopStore((s) => s.updateMilestone);
  const saveMilestone    = useWeeklyLoopStore((s) => s.saveMilestone);
  const saveTask         = useWeeklyLoopStore((s) => s.saveTask);

  const scoreData     = useExecutionScoreStore((s) => s.score);
  const journeyProgress = useJourneyStore((s) => s.progress);

  // Prefer viewModel's normalized activeOutcome; fall back to raw outcomes
  const activeOutcome = viewModel?.activeOutcome
    ?? outcomes.find((o) => o.status === "active")
    ?? outcomes[0]
    ?? null;
  const milestoneProgress = viewModel?.metrics?.milestoneProgress ?? 0;

  // ── Top bar data ──────────────────────────────────────────────────────
  const stageId     = journeyProgress?.currentStage ?? 1;
  const startupName = user?.startup?.name ?? "Your Startup";
  const streak      = scoreData?.streak ?? scoreData?.currentStreak ?? 0;
  const weekNumber  = activeOutcome?.weekNumber ?? 1;
  const dayOfWeek   = new Date().getDay(); // 0 = Sunday
  const daysToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;

  // ── Local UI state ────────────────────────────────────────────────────
  const [taskFilter, setTaskFilter]   = useState("all");
  const [goalSaving, setGoalSaving]   = useState(false);
  const [togglingId, setTogglingId]   = useState(null);
  const [goalEditTrigger, setGoalEditTrigger] = useState(0);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [milestoneDraft, setMilestoneDraft]   = useState("");
  const [milestoneSaving, setMilestoneSaving] = useState(false);

  // ── Load data ─────────────────────────────────────────────────────────
  // Always sync founderId into the store so all save functions can use it
  useEffect(() => {
    if (userId) {
      setFounderId(userId);
      loadLoop(userId);
    }
  }, [userId, loadLoop, setFounderId]);

  // Keep selectedWeek in sync when weekNumber loads
  useEffect(() => {
    setSelectedWeek((prev) => prev ?? weekNumber);
  }, [weekNumber]);

  // ── Derived data ──────────────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    if (taskFilter === "all") return tasks;
    return tasks.filter((t) => t.status === taskFilter);
  }, [tasks, taskFilter]);

  // Prefer viewModel taskMix (normalized statuses) over raw task objects
  const taskCounts = useMemo(() => {
    const mix = viewModel?.metrics?.taskMix;
    if (mix) return { all: mix.total, ...mix };
    const c = { all: tasks.length, "in-progress": 0, blocked: 0, completed: 0, pending: 0 };
    for (const t of tasks) {
      const s = String(t.status || "").toLowerCase().replace(/_/g, "-");
      if (c[s] !== undefined) c[s]++;
    }
    return c;
  }, [tasks, viewModel]);

  const currentStep = useMemo(
    () => deriveCurrentStep(activeOutcome, milestones, tasks),
    [activeOutcome, milestones, tasks],
  );

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

  const handleAddTask = useCallback(async (milestoneId, title) => {
    const text = title?.trim();
    if (!text) return;
    await saveTask({ title: text, milestoneId, status: "pending" });
  }, [saveTask]);

  const handleSaveMilestone = useCallback(async () => {
    const title = milestoneDraft.trim();
    if (!title) return;
    setMilestoneSaving(true);
    try {
      await saveMilestone({ title, status: "not-started" });
      setMilestoneDraft("");
      setAddingMilestone(false);
    } catch (err) {
      console.error("[V2ExecutionEngine] saveMilestone failed:", err);
    } finally {
      setMilestoneSaving(false);
    }
  }, [saveMilestone, milestoneDraft]);

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
      tasks={tasks}
      milestones={milestones}
      milestoneProgress={milestoneProgress}
      onPageChange={onPageChange}
    />
  );

  // ── Loading state ─────────────────────────────────────────────────────
  if (loopLoading && milestones.length === 0 && tasks.length === 0) {
    return (
      <V2AppLayout
        user={user}
        currentPage="execution-engine"
        onPageChange={onPageChange}
        topbarTitle="Execution Engine"
      >
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-v2-border border-t-v2-purple" />
            <p className="font-body text-[12px] text-v2-muted">Loading your execution data…</p>
          </div>
        </div>
      </V2AppLayout>
    );
  }

  // ── Top bar ─────────────────────────────────────────────────────────────
  const stageLabel = `Stage ${stageId}: ${["Idea & Validation","Building MVP","Launch","Growth","Scale"][stageId - 1] ?? "Execution"}`;
  const topbarChips = [
    <V2Chip key="stage" variant="grey">{stageLabel}</V2Chip>,
    streak > 0 ? (
      <V2Chip key="streak" variant="amber">
        <Flame className="h-3 w-3" /> {streak} week streak
      </V2Chip>
    ) : null,
  ].filter(Boolean);
  const topbarActions = (
    <>
      {loopRefreshing ? <RefreshCw className="h-4 w-4 animate-spin text-v2-muted" /> : null}
      <V2Btn variant="secondary" size="sm">
        View history
      </V2Btn>
      <V2Btn variant="primary" size="sm" onClick={() => setGoalEditTrigger((n) => n + 1)}>
        New week goal
      </V2Btn>
    </>
  );

  const isSunday   = new Date().getDay() === 0;
  const allDone    = tasks.length > 0 && taskCounts.completed === tasks.length;

  return (
    <V2AppLayout
      user={user}
      currentPage="execution-engine"
      onPageChange={onPageChange}
      rightPanel={rightPanel}
      topbarTitle="Execution Engine"
      topbarBreadcrumb={`${startupName} · ${stageLabel}`}
      topbarChips={topbarChips}
      topbarActions={topbarActions}
    >
      <div className="flex flex-col gap-4 p-4">

        {/* ── Week tabs ────────────────────────────────────────────────── */}
        <WeekTabsRow
          weekNumber={weekNumber}
          selectedWeek={selectedWeek ?? weekNumber}
          onSelectWeek={setSelectedWeek}
        />

        {/* ── 7-step execution loop ─────────────────────────────────────── */}
        <SevenStepLoopCard
          currentStep={currentStep}
          daysRemaining={daysToSunday}
          taskCounts={taskCounts}
        />

        {/* ── Goal + Milestones + Log Outcome — all in ONE card (.card in HTML) ── */}
        <V2Card className="overflow-hidden p-0">

          {/* .ch2 card header — "Week N goal & milestones" + Edit/Add buttons */}
          <div className="flex items-start justify-between border-b border-v2-border px-4 py-3.5">
            <div>
              <p className="font-body text-[14px] font-semibold text-v2-heading">
                Week {weekNumber} goal &amp; milestones
              </p>
              <p className="mt-0.5 font-body text-[11px] text-v2-muted">
                {daysToSunday > 0 ? `${daysToSunday} days remaining this week` : "Wrap up today — it's Sunday!"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 pl-4">
              <V2Btn variant="secondary" size="sm" onClick={() => setGoalEditTrigger((n) => n + 1)}>
                <Edit2 className="h-3.5 w-3.5" />Edit goal
              </V2Btn>
              <V2Btn variant="primary" size="sm" onClick={() => { setAddingMilestone(true); setMilestoneDraft(""); }}>
                <Plus className="h-3.5 w-3.5" />Add milestone
              </V2Btn>
            </div>
          </div>

          {/* .goal-box — goal block */}
          <div className="px-4 pt-4">
            <WeeklyGoalBlock
              outcome={activeOutcome}
              weekNumber={weekNumber}
              weekPct={milestoneProgress}
              stageLabel={stageLabel}
              onEdit={handleSaveGoal}
              saving={goalSaving}
              editTrigger={goalEditTrigger}
            />
          </div>

          {/* .ms-section rows — milestones + tasks */}
          <div className="px-4 pb-4">
            {milestones.length > 0 ? (
              <div className="flex flex-col gap-3">
                {milestones.map((m, i) => (
                  <MilestoneSection
                    key={m._id ?? m.id}
                    milestone={m}
                    tasks={tasks}
                    index={i}
                    onToggleTask={handleToggleTask}
                    onAddTask={handleAddTask}
                  />
                ))}
              </div>
            ) : !addingMilestone ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-v2-blue-tint">
                  <ListChecks className="h-5 w-5 text-v2-blue" />
                </div>
                <p className="font-body text-[12px] text-v2-muted">
                  No milestones yet. Set a weekly goal first, then break it into milestones.
                </p>
              </div>
            ) : null}

            {/* Inline add-milestone form — appears when "Add milestone" is clicked */}
            {addingMilestone && (
              <div className="mt-3 rounded-[10px] border border-v2-blue/30 bg-v2-page p-3">
                <p className="mb-2 font-body text-[10px] font-medium uppercase tracking-wide text-v2-blue">
                  New Milestone
                </p>
                <input
                  autoFocus
                  type="text"
                  value={milestoneDraft}
                  onChange={(e) => setMilestoneDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveMilestone();
                    if (e.key === "Escape") { setAddingMilestone(false); setMilestoneDraft(""); }
                  }}
                  placeholder="e.g. Ship onboarding flow"
                  className="w-full rounded-[8px] border border-v2-border bg-white px-3 py-2 font-body text-[12px] text-v2-heading outline-none focus:border-v2-blue placeholder:text-v2-subtle"
                />
                <div className="mt-2 flex justify-end gap-2">
                  <V2Btn
                    variant="ghost" size="sm"
                    onClick={() => { setAddingMilestone(false); setMilestoneDraft(""); }}
                  >
                    <X className="h-3.5 w-3.5" />Cancel
                  </V2Btn>
                  <V2Btn
                    variant="primary" size="sm"
                    onClick={handleSaveMilestone}
                    disabled={milestoneSaving || !milestoneDraft.trim()}
                  >
                    {milestoneSaving
                      ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      : <Check className="h-3.5 w-3.5" />}
                    Save milestone
                  </V2Btn>
                </div>
              </div>
            )}
          </div>

          {/* .outcome-section — log outcome inside same card */}
          <div className="border-t border-v2-border px-4 pb-4 pt-4">
            <LogOutcomeSection isAvailable={isSunday && allDone} />
          </div>

        </V2Card>

      </div>
    </V2AppLayout>
  );
}
