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

/** Purely a derived label for the real score — same buckets as scoreColor. */
function scoreLabel(score) {
  if (score >= 80) return "Strong Executor";
  if (score >= 60) return "Solid Progress";
  if (score >= 40) return "Building Momentum";
  return "Just Getting Started";
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

function MetricTile({ icon: Icon, label, value, sub, iconBg = "bg-v2-blue-tint", iconColor = "text-v2-blue" }) {
  return (
    <V2Card className="flex items-center gap-3">
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]", iconBg)}>
        <Icon className={cn("h-4 w-4", iconColor)} />
      </div>
      <div className="min-w-0">
        <p className="font-body text-[10px] font-semibold uppercase tracking-wide text-v2-muted">
          {label}
        </p>
        <p className="font-heading text-[22px] font-bold leading-none text-v2-heading">
          {value}
        </p>
        {sub ? (
          <p className="mt-0.5 font-body text-[11px] text-v2-muted">{sub}</p>
        ) : null}
      </div>
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
        <span className="font-body text-[11px] text-v2-muted">{label}</span>
        <span className="font-body text-[11px] font-medium text-v2-heading">{value}</span>
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
            className="font-body text-[10px] text-v2-blue hover:underline"
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
        {task.assigneeName ? (
          <p className="font-body text-[10px] text-v2-muted">→ {task.assigneeName}</p>
        ) : null}
      </div>
      <V2Chip variant={chip.variant} dot>{chip.label}</V2Chip>
    </div>
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
    <div className="flex flex-col gap-4 p-4">

      {/* Score card */}
      <V2Card className="flex flex-col items-center gap-3 py-5">
        <V2ScoreRing score={score} size={88} />
        <div className="text-center">
          <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-v2-muted">
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
                className="font-body text-[10px] text-v2-blue hover:underline"
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
                  <p className="truncate font-body text-[11px] font-medium text-v2-heading">
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
      <div className="flex flex-col gap-5 p-5">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <V2Card className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            {/* Eyebrow — real cohort name + week, when the founder is in a cohort */}
            {cohortLabel ? (
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-v2-blue-tint px-2.5 py-1">
                <span className="h-[5px] w-[5px] rounded-full bg-v2-blue" />
                <span className="font-body text-[10px] font-semibold text-v2-blue-dark">
                  {cohortLabel}
                </span>
              </div>
            ) : null}

            <h2 className="font-heading text-[20px] font-bold text-v2-heading leading-tight">
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
              <p className="font-body text-[10px] font-semibold uppercase tracking-wide text-v2-subtle">
                This Week's Goal
              </p>
              <p className="mt-1 font-body text-[13px] font-medium text-v2-heading leading-snug">
                {outcome?.goal ?? "No goal set this week — tap to set one."}
              </p>
            </button>
          </div>

          {/* Score ring — the one big ring for the whole page */}
          <div className="flex flex-col items-center gap-2 md:pl-2">
            <V2ScoreRing score={score} size={96} strokeWidth={7} />
            <span className="rounded-full bg-v2-blue-tint px-2.5 py-1 font-body text-[11px] font-medium text-v2-blue-dark">
              {scoreLabel(score)}
              {scoreData?.weeklyChange ? ` · ${scoreData.weeklyChange > 0 ? "+" : ""}${scoreData.weeklyChange} this week` : ""}
            </span>
          </div>
        </V2Card>

        {/* ── Metric tiles ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <MetricTile
            icon={Zap}
            label="Score"
            value={score}
            sub={scoreData?.weeklyChange ? `${scoreData.weeklyChange > 0 ? "+" : ""}${scoreData.weeklyChange} this week` : "No change yet"}
            iconBg="bg-v2-blue-tint"
            iconColor={scoreColor(score)}
          />

          <MetricTile
            icon={Target}
            label="This Week"
            value={`${weekPct}%`}
            sub={outcome?.goal ? `"${outcome.goal.slice(0, 28)}…"` : "No goal set yet"}
            iconBg="bg-v2-blue-tint"
            iconColor="text-v2-blue"
          />

          <MetricTile
            icon={Flame}
            label="Streak"
            value={streak}
            sub={streak === 1 ? "week running" : streak === 0 ? "Start this week" : "weeks running"}
            iconBg="bg-v2-amber-tint"
            iconColor="text-v2-amber"
          />

          <MetricTile
            icon={CheckCircle2}
            label="Tasks Done"
            value={completedCount}
            sub={`${tasks.length} total tasks`}
            iconBg="bg-v2-green-tint"
            iconColor="text-v2-green"
          />
        </div>

        {/* ── Founder journey stage tracker ───────────────────────────────── */}
        <FounderJourneyTracker
          stageId={stageId}
          completedStages={completedStages}
          completionPercentage={stageCompletionPct}
          onViewCriteria={() => onPageChange("journey")}
        />

        {/* ── Weekly goal + milestones ─────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">

          {/* Weekly goal card */}
          <V2Card>
            <V2SectionHead
              title="This Week's Goal"
              action={
                <button
                  type="button"
                  onClick={() => onPageChange("execution-engine")}
                  className="font-body text-[10px] text-v2-blue hover:underline"
                >
                  Manage →
                </button>
              }
            />
            {outcome ? (
              <div>
                <div className="mb-3 rounded-[10px] bg-v2-purple-tint px-4 py-3">
                  <p className="font-body text-[13px] font-medium text-v2-purple-dark leading-snug">
                    {outcome.goal}
                  </p>
                </div>
                {/* Progress bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-v2-border">
                    <div
                      className="h-full rounded-full bg-v2-purple transition-all duration-500"
                      style={{ width: `${weekPct}%` }}
                    />
                  </div>
                  <span className="font-body text-[11px] font-medium text-v2-muted w-8 text-right">
                    {weekPct}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-v2-blue-tint">
                  <Target className="h-5 w-5 text-v2-blue" />
                </div>
                <div>
                  <p className="font-body text-[13px] font-medium text-v2-heading">No goal set this week</p>
                  <p className="font-body text-[11px] text-v2-muted mt-0.5">Set a clear outcome to drive execution</p>
                </div>
                <V2Btn variant="primary" size="sm" onClick={() => onPageChange("execution-engine")}>
                  <Plus className="h-3.5 w-3.5" />
                  Set This Week's Goal
                </V2Btn>
              </div>
            )}
          </V2Card>

          {/* Milestones card */}
          <V2Card>
            <V2SectionHead
              title="Milestones"
              action={
                <button
                  type="button"
                  onClick={() => onPageChange("execution-engine")}
                  className="font-body text-[10px] text-v2-blue hover:underline"
                >
                  View all →
                </button>
              }
            />
            {milestones.length > 0 ? (
              <div className="flex flex-col divide-y divide-v2-border">
                {milestones.slice(0, 4).map((m) => (
                  <MilestoneRow
                    key={m._id ?? m.id}
                    milestone={m}
                    onOpen={() => onPageChange("execution-engine")}
                  />
                ))}
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="font-body text-[12px] text-v2-muted">No milestones yet.</p>
                <V2Btn variant="secondary" size="sm" className="mt-3" onClick={() => onPageChange("execution-engine")}>
                  <Plus className="h-3.5 w-3.5" />
                  Add Milestone
                </V2Btn>
              </div>
            )}
          </V2Card>
        </div>

        {/* ── Active tasks ─────────────────────────────────────────────── */}
        <V2Card>
          <V2SectionHead
            title="Active Tasks"
            action={
              <button
                type="button"
                onClick={() => onPageChange("execution-engine")}
                className="font-body text-[10px] text-v2-blue hover:underline"
              >
                View all tasks →
              </button>
            }
          />
          {activeTasks.length > 0 ? (
            <div className="flex flex-col divide-y divide-v2-border">
              {activeTasks.map((t) => (
                <TaskRow key={t._id ?? t.id} task={t} />
              ))}
            </div>
          ) : (
            <div className="py-4 text-center">
              {tasks.length > 0 ? (
                <p className="font-body text-[12px] text-v2-green">
                  ✅ All tasks completed this week!
                </p>
              ) : (
                <p className="font-body text-[12px] text-v2-muted">
                  No tasks yet. Set a goal and create milestones to generate tasks.
                </p>
              )}
            </div>
          )}
        </V2Card>

        {/* ── AI Staff nudge (if not hired) ────────────────────────────── */}
        <V2Card className="border-v2-purple-tint bg-gradient-to-r from-v2-purple-tint to-v2-blue-tint">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-v2-purple text-white">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="font-body text-[13px] font-semibold text-v2-purple-dark">
                  Your AI Staff is ready to work
                </p>
                <p className="font-body text-[11px] text-v2-muted">
                  AI PM · AI Marketing · AI Growth — context-aware, working 24/7
                </p>
              </div>
            </div>
            <V2Btn variant="purple" size="sm" onClick={() => onPageChange("ai-staff")}>
              <TrendingUp className="h-3.5 w-3.5" />
              Hire AI Staff
            </V2Btn>
          </div>
        </V2Card>

      </div>
    </V2AppLayout>
  );
}
