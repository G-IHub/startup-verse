/**
 * COHORT ANALYTICS - Comprehensive metrics dashboard
 * Loading / empty / token patterns mirror founder AnalyticsDashboard (Stream A).
 */
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/apiBase.js";
import { Button } from "../ui/button";
import {
  TrendingUp,
  Users,
  Target,
  CheckCircle2,
  Activity,
  FileText,
  ListChecks,
  Send,
  Inbox,
  Award,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { unwrapData } from "../../utils/apiEnvelope";
import {
  StatTile,
  SectionCard,
  BrandProgress,
  EmptyStateBlock,
} from "./_primitives";
import { cn } from "../ui/utils";

const API_BASE = API_BASE_URL;

const OUTLINE_BTN =
  "h-8 rounded-input border border-surface-border bg-white font-body text-[13px] font-medium text-text-body shadow-none hover:bg-primary-tint hover:text-primary";

const defaultOptions = {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
};

function SkeletonBlock({ className }) {
  return <div className={cn("rounded bg-surface-border/50", className)} />;
}

function CohortAnalyticsSkeleton() {
  return (
    <div
      className="min-h-full space-y-4 font-body"
      aria-busy="true"
      aria-label="Loading cohort analytics"
    >
      <div className="flex flex-wrap items-center justify-end gap-2">
        <SkeletonBlock className="h-8 w-24" />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-card border border-surface-border bg-surface-card p-4 shadow-soft"
          >
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-10 w-10 shrink-0 rounded-input" />
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonBlock className="h-7 w-12" />
                <SkeletonBlock className="h-3 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid animate-pulse grid-cols-1 gap-3 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-card border border-surface-border bg-surface-card p-4 shadow-soft sm:p-5"
          >
            <SkeletonBlock className="mb-2 h-4 w-36" />
            <SkeletonBlock className="mb-4 h-3 w-48" />
            <div className="mb-3 grid grid-cols-2 gap-3">
              <SkeletonBlock className="h-16 w-full rounded-input" />
              <SkeletonBlock className="h-16 w-full rounded-input" />
            </div>
            <SkeletonBlock className="h-1.5 w-full" />
          </div>
        ))}
      </div>

      <div className="animate-pulse space-y-3">
        <SkeletonBlock className="h-4 w-40" />
        <SkeletonBlock className="h-3 w-56" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-card border border-surface-border bg-surface-card p-4 shadow-soft"
            >
              <SkeletonBlock className="mb-2 h-8 w-10" />
              <SkeletonBlock className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PanelSection({ title, description, children, className }) {
  return (
    <div className={cn("min-w-0", className)}>
      {(title || description) && (
        <header className="mb-3">
          {title && (
            <h3 className="font-heading text-[15px] font-semibold text-text-heading">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-0.5 font-body text-[12px] text-text-muted">
              {description}
            </p>
          )}
        </header>
      )}
      {children}
    </div>
  );
}

function ProgressRow({ label, value, max, tone = "info" }) {
  const numericValue = typeof value === "number" ? value : Number(value) || 0;
  const numericMax = typeof max === "number" ? max : Number(max) || 0;
  const pct =
    numericMax > 0
      ? Math.min(100, Math.round((numericValue / numericMax) * 100))
      : 0;
  const toneClass =
    tone === "success"
      ? "text-status-success"
      : tone === "warning"
        ? "text-status-warning"
        : tone === "danger"
          ? "text-status-error"
          : "text-primary";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="font-body text-[12px] text-text-muted">{label}</span>
        <span className="font-heading text-[14px] font-semibold text-text-heading">
          <span className={toneClass}>{numericValue}</span>
          <span className="font-normal text-text-muted"> / {numericMax}</span>
        </span>
      </div>
      <BrandProgress value={pct} className="h-1.5" />
    </div>
  );
}

export default function CohortAnalyticsDashboard({ cohortId }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadAnalytics = async (isManualRefresh = false) => {
    if (!cohortId) {
      setError("Cohort ID not available");
      setLoading(false);
      return;
    }
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const response = await fetch(
        `${API_BASE}/cohorts/${cohortId}/analytics/overview`,
        { ...defaultOptions },
      );
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const inner = unwrapData(await response.json());
      setAnalytics(inner.analytics);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error loading analytics:", err);
      setError(err?.message || "Failed to load analytics");
      if (!isManualRefresh) {
        setAnalytics(null);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when cohort changes
  }, [cohortId]);

  const handleManualRefresh = () => {
    loadAnalytics(true);
  };

  // Cold load only — keep last good data visible during refresh.
  if (loading && !analytics) {
    return <CohortAnalyticsSkeleton />;
  }

  if (!loading && !analytics) {
    return (
      <SectionCard className="font-body">
        <SectionCard.Body className="p-0">
          <EmptyStateBlock
            variant="centered"
            icon={AlertCircle}
            tone="danger"
            title="Failed to load analytics"
            description={error || "We could not fetch cohort analytics."}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className={OUTLINE_BTN}
              >
                <RefreshCw
                  className={`mr-2 h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Retry
              </Button>
            }
          />
        </SectionCard.Body>
      </SectionCard>
    );
  }

  const aggregate = analytics.aggregateMetrics || {};
  const program = analytics.programMetrics || {};
  const hasTaskData =
    Number(aggregate.totalTasks) > 0 || Number(aggregate.completedTasks) > 0;
  const hasMilestoneData =
    Number(aggregate.totalMilestones) > 0 ||
    Number(aggregate.completedMilestones) > 0;
  const hasProgramData =
    Number(program.totalProgramMilestones) > 0 ||
    Number(program.totalDeliverables) > 0 ||
    Number(program.totalSubmissions) > 0;
  const hasWeeklyData =
    Number(aggregate.totalWeeklyOutcomes) > 0 ||
    Number(aggregate.avgWeeklyOutcomesPerStartup) > 0;

  return (
    <div className="min-h-full space-y-4 font-body">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className={OUTLINE_BTN}
        >
          <RefreshCw
            className={`mr-2 h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
          />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
        {lastUpdated && (
          <span className="w-full text-right font-body text-[11px] text-text-muted sm:w-auto">
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      <p className="font-body text-[12px] text-text-muted">
        {typeof analytics.recentJoinsLast30Days === "number"
          ? `Key metrics across ${analytics.cohortSize} active startups · ${analytics.recentJoinsLast30Days} joined in the last 30 days`
          : `Key metrics across ${analytics.cohortSize} active startups`}
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          tone="info"
          icon={Users}
          label="Startups"
          value={analytics.cohortSize}
          note="In this cohort"
        />
        <StatTile
          tone="info"
          icon={Users}
          label="Team Members"
          value={aggregate.totalTeamMembers}
          note="Across all startups"
        />
        <StatTile
          tone="success"
          icon={Award}
          label="Avg Team Size"
          value={aggregate.avgTeamSize}
          note="Per startup"
        />
        <StatTile
          tone="info"
          icon={TrendingUp}
          label="Weekly Outcomes"
          value={aggregate.totalWeeklyOutcomes}
          note="Logged this cycle"
        />
      </div>

      <SectionCard>
        <SectionCard.Body className="pt-4">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
            <PanelSection
              title="Task completion"
              description="Total vs completed tasks across the cohort"
            >
              {hasTaskData ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-input bg-surface-page p-3">
                      <div className="font-body text-[12px] text-text-muted">
                        Total Tasks
                      </div>
                      <div className="font-heading text-[20px] font-bold text-text-heading">
                        {aggregate.totalTasks}
                      </div>
                    </div>
                    <div className="rounded-input bg-surface-page p-3">
                      <div className="font-body text-[12px] text-text-muted">
                        Completed
                      </div>
                      <div className="font-heading text-[20px] font-bold text-status-success">
                        {aggregate.completedTasks}
                      </div>
                    </div>
                  </div>
                  <ProgressRow
                    label="Completion Rate"
                    value={aggregate.completedTasks}
                    max={aggregate.totalTasks}
                    tone="success"
                  />
                </div>
              ) : (
                <EmptyStateBlock
                  variant="compact"
                  icon={CheckCircle2}
                  title="No task data yet"
                  description="Task activity will appear as startups execute."
                />
              )}
            </PanelSection>

            <PanelSection
              title="Milestone progress"
              description="Total vs completed milestones across the cohort"
            >
              {hasMilestoneData ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-input bg-surface-page p-3">
                      <div className="font-body text-[12px] text-text-muted">
                        Total Milestones
                      </div>
                      <div className="font-heading text-[20px] font-bold text-text-heading">
                        {aggregate.totalMilestones}
                      </div>
                    </div>
                    <div className="rounded-input bg-surface-page p-3">
                      <div className="font-body text-[12px] text-text-muted">
                        Completed
                      </div>
                      <div className="font-heading text-[20px] font-bold text-primary">
                        {aggregate.completedMilestones}
                      </div>
                    </div>
                  </div>
                  <ProgressRow
                    label="Completion Rate"
                    value={aggregate.completedMilestones}
                    max={aggregate.totalMilestones}
                    tone="info"
                  />
                </div>
              ) : (
                <EmptyStateBlock
                  variant="compact"
                  icon={Target}
                  title="No milestone data yet"
                  description="Milestones appear as startups progress."
                />
              )}
            </PanelSection>
          </div>
        </SectionCard.Body>
      </SectionCard>

      <PanelSection
        title="Program metrics"
        description="Deliverables and program milestones tracking"
      >
        {hasProgramData ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile
              tone="info"
              icon={Target}
              label="Program Milestones"
              value={program.totalProgramMilestones}
              note="Configured"
            />
            <StatTile
              tone="info"
              icon={ListChecks}
              label="Deliverables"
              value={program.totalDeliverables}
              note="Configured"
            />
            <StatTile
              tone="success"
              icon={Inbox}
              label="Submissions"
              value={program.totalSubmissions}
              note="Received"
            />
            <StatTile
              tone="warning"
              icon={Send}
              label="Submission Rate"
              value={`${program.submissionRate ?? 0}%`}
              note="Of expected"
              progress={Number(program.submissionRate) || 0}
            />
          </div>
        ) : (
          <EmptyStateBlock
            variant="compact"
            icon={FileText}
            title="No program metrics yet"
            description="Configure milestones and deliverables to track submissions."
          />
        )}
      </PanelSection>

      <SectionCard>
        <SectionCard.Header
          title="Weekly execution"
          description="Outcome logging across the cohort"
        />
        <SectionCard.Body>
          {hasWeeklyData ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-input bg-surface-page p-4">
                <div className="font-body text-[12px] text-text-muted">
                  Total Weekly Outcomes
                </div>
                <div className="font-heading text-[20px] font-bold text-primary">
                  {aggregate.totalWeeklyOutcomes}
                </div>
              </div>
              <div className="rounded-input bg-surface-page p-4">
                <div className="font-body text-[12px] text-text-muted">
                  Avg Per Startup
                </div>
                <div className="font-heading text-[20px] font-bold text-status-success">
                  {aggregate.avgWeeklyOutcomesPerStartup}
                </div>
              </div>
            </div>
          ) : (
            <EmptyStateBlock
              variant="compact"
              icon={Activity}
              title="No weekly outcomes yet"
              description="Outcome logging will show up as startups execute."
            />
          )}
        </SectionCard.Body>
      </SectionCard>
    </div>
  );
}
