import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/apiBase.js";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  TrendingUp,
  AlertCircle,
  Target,
  Zap,
  Users,
  Activity,
  Clock,
  CheckCircle2,
  Flame,
  Trophy,
  RefreshCw,
  Download,
} from "lucide-react";
import { unwrapData } from "../../utils/apiEnvelope";
import {
  StatTile,
  SectionCard,
  BrandProgress,
  EmptyStateBlock,
  StatusBadge,
} from "../organizations/_primitives";
import { cn } from "../ui/utils";

const OUTLINE_BTN =
  "h-8 rounded-input border border-surface-border bg-white font-body text-[13px] font-medium text-text-body shadow-none hover:bg-primary-tint hover:text-primary";

const TAB_LIST =
  "mb-1 grid h-auto min-h-10 w-full grid-cols-4 gap-0 rounded-none border-0 border-b border-surface-border bg-transparent p-0";

const TAB_TRIGGER =
  "rounded-none border-0 border-b-2 border-transparent bg-transparent font-body font-medium text-text-body shadow-none transition-all duration-200 ease hover:text-primary data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-primary data-[state=active]:shadow-none";

const API_BASE = API_BASE_URL;

const defaultOptions = {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
};

/** Recharts fills — aligned to StartupVerse tokens (no purple series). */
const COLORS = {
  primary: "#3a5afe",
  success: "#00c896",
  warning: "#ffb300",
  danger: "#ff4f6b",
};

function SkeletonBlock({ className }) {
  return <div className={cn("rounded bg-surface-border/50", className)} />;
}

function AnalyticsSkeleton() {
  return (
    <div
      className="min-h-full space-y-4 font-body"
      aria-busy="true"
      aria-label="Loading analytics"
    >
      <div className="flex flex-wrap items-center justify-end gap-2">
        <SkeletonBlock className="h-8 w-36" />
        <SkeletonBlock className="h-8 w-24" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-card border border-surface-border bg-surface-card p-4 shadow-soft"
          >
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-10 w-10 shrink-0 rounded-input" />
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonBlock className="h-7 w-16" />
                <SkeletonBlock className="h-3 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="animate-pulse space-y-3">
        <div className="grid h-10 grid-cols-4 gap-0 border-b border-surface-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-center px-2">
              <SkeletonBlock className="h-3 w-16" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-card border border-surface-border bg-surface-card p-4 shadow-soft sm:p-5"
            >
              <SkeletonBlock className="mb-2 h-4 w-32" />
              <SkeletonBlock className="mb-4 h-3 w-48" />
              <SkeletonBlock className="h-40 w-full rounded-input" />
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

export default function AnalyticsDashboard({ founderId, founderName }) {
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAnalytics = async (isManualRefresh = false) => {
    if (!founderId) {
      console.error("[Analytics] No founderId provided");
      setError("User ID not available");
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
      const response = await fetch(`${API_BASE}/founders/${founderId}/analytics`, {
        ...defaultOptions,
        method: "GET",
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Analytics] API error:", response.status, errorText);
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }
      const data = unwrapData(await response.json());
      setAnalytics(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("[Analytics] Error fetching analytics:", {
        error: err.message,
        founderId,
        timestamp: new Date().toISOString(),
      });
      setError(`Failed to load analytics data: ${err.message}`);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when founder changes
  }, [founderId]);

  const handleManualRefresh = () => {
    fetchAnalytics(true);
  };

  // Cold load only — keep last good data visible during refresh.
  if (loading && !analytics) {
    return <AnalyticsSkeleton />;
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
            description={error || "Something went wrong. Try refreshing."}
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

  const {
    teamVelocity,
    blockerPatterns,
    outcomeMetrics,
    stageInsights,
    productivityTrends,
    teamPerformance,
  } = analytics;

  const velocityTrend =
    teamVelocity.length >= 2
      ? ((teamVelocity[teamVelocity.length - 1].completionRate -
          teamVelocity[teamVelocity.length - 2].completionRate) /
          teamVelocity[teamVelocity.length - 2].completionRate) *
        100
      : 0;
  const avgVelocity =
    teamVelocity.length > 0
      ? teamVelocity.reduce((sum, v) => sum + v.tasksCompleted, 0) /
        teamVelocity.length
      : 0;

  const outcomesPieData = [
    {
      name: "Completed",
      value: outcomeMetrics.completedOutcomes,
      color: COLORS.success,
    },
    {
      name: "Partial",
      value: outcomeMetrics.partialOutcomes,
      color: COLORS.warning,
    },
    {
      name: "Missed",
      value: outcomeMetrics.missedOutcomes,
      color: COLORS.danger,
    },
  ].filter((d) => d.value > 0);
  const blockerTotal = blockerPatterns.reduce((sum, bp) => sum + bp.count, 0);
  const velocityNote =
    velocityTrend !== 0
      ? `${velocityTrend > 0 ? "+" : ""}${velocityTrend.toFixed(1)}% vs last week`
      : undefined;

  const handleDownloadReport = () => {
    if (!analytics) return;

    const reportDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const report = `
STARTUPVERSE ANALYTICS REPORT
Generated: ${reportDate}
Founder: ${founderName}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXECUTIVE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Team Velocity: ${avgVelocity.toFixed(1)} tasks/week
Achievement Rate: ${outcomeMetrics.achievementRate.toFixed(0)}%
Current Streak: ${outcomeMetrics.currentStreak} weeks
Active Blockers: ${blockerPatterns.reduce((sum, bp) => sum + bp.count, 0)} tasks


TEAM VELOCITY ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Average Velocity: ${avgVelocity.toFixed(1)} tasks/week
${velocityTrend !== 0 ? `Trend vs Last Week: ${velocityTrend > 0 ? "+" : ""}${velocityTrend.toFixed(1)}%` : "No trend data available"}
Best Week: ${Math.max(...teamVelocity.map((v) => v.tasksCompleted), 0)} tasks
Average Completion Time: ${(teamVelocity.reduce((sum, v) => sum + v.averageCompletionTime, 0) / Math.max(teamVelocity.length, 1)).toFixed(1)} days/task

Weekly Breakdown:
${teamVelocity.map((v) => `  • ${v.weekLabel}: ${v.tasksCompleted} tasks (${v.completionRate.toFixed(0)}% completion rate)`).join("\n")}


OUTCOME METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Weekly Outcomes: ${outcomeMetrics.totalOutcomes}
Completed: ${outcomeMetrics.completedOutcomes} (${((outcomeMetrics.completedOutcomes / Math.max(outcomeMetrics.totalOutcomes, 1)) * 100).toFixed(0)}%)
Partial: ${outcomeMetrics.partialOutcomes} (${((outcomeMetrics.partialOutcomes / Math.max(outcomeMetrics.totalOutcomes, 1)) * 100).toFixed(0)}%)
Missed: ${outcomeMetrics.missedOutcomes} (${((outcomeMetrics.missedOutcomes / Math.max(outcomeMetrics.totalOutcomes, 1)) * 100).toFixed(0)}%)

Achievement Rate: ${outcomeMetrics.achievementRate.toFixed(0)}%
Current Streak: ${outcomeMetrics.currentStreak} weeks
Longest Streak: ${outcomeMetrics.longestStreak} weeks


BLOCKER ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${
  blockerPatterns.length > 0
    ? blockerPatterns
        .map(
          (bp, index) => `
${index + 1}. ${bp.reason}
   • Affected Tasks: ${bp.count}
   • Average Duration: ${bp.averageDuration.toFixed(1)} days
   • Tasks: ${bp.affectedTasks.slice(0, 5).join(", ")}${bp.affectedTasks.length > 5 ? ` +${bp.affectedTasks.length - 5} more` : ""}
`,
        )
        .join("\n")
    : "No active blockers."
}


STAGE PROGRESSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${stageInsights.map((stage) => `  • ${stage.stageName}: ${Math.round(stage.completionRate)}% (${stage.status})`).join("\n")}


TEAM PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Members: ${teamPerformance.totalMembers}
Active Members: ${teamPerformance.activeMembers}
Engagement Rate: ${((teamPerformance.activeMembers / Math.max(teamPerformance.totalMembers, 1)) * 100).toFixed(0)}%

${
  teamPerformance.topPerformers.length > 0
    ? `Top Performers:
${teamPerformance.topPerformers
  .slice(0, 5)
  .map(
    (member, index) =>
      `  ${index + 1}. ${member.name}: ${member.tasksCompleted} tasks completed, ${member.tasksInProgress} in progress`,
  )
  .join("\n")}`
    : "No team activity yet"
}


PRODUCTIVITY TRENDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${productivityTrends.map((pt) => `  • ${pt.period}: ${pt.tasksCompleted} tasks`).join("\n")}


KEY INSIGHTS AND RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${velocityTrend > 10 ? `- Velocity improving: pace is up ${velocityTrend.toFixed(0)}% this week.\n` : ""}
${blockerPatterns.length > 2 ? `- Multiple blockers: focus on "${blockerPatterns[0].reason}" (${blockerPatterns[0].count} tasks).\n` : ""}
${outcomeMetrics.achievementRate >= 80 ? `- Strong execution: ${outcomeMetrics.achievementRate.toFixed(0)}% achievement rate.\n` : ""}
${teamPerformance.activeMembers < teamPerformance.totalMembers / 2 && teamPerformance.totalMembers > 1 ? `- Low team engagement: ${teamPerformance.activeMembers}/${teamPerformance.totalMembers} members active.\n` : ""}
${outcomeMetrics.currentStreak >= 4 ? `- Streak momentum: ${outcomeMetrics.currentStreak} consecutive weeks.\n` : ""}
${outcomeMetrics.achievementRate < 50 && outcomeMetrics.totalOutcomes > 0 ? `- Achievement rate alert: ${outcomeMetrics.achievementRate.toFixed(0)}% — consider smaller weekly outcomes.\n` : ""}
${blockerPatterns.length === 0 && teamVelocity.length > 0 ? `- Smooth execution: no blockers detected.\n` : ""}


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Report generated by StartupVerse Analytics Engine
${new Date().toISOString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `StartupVerse_Analytics_Report_${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-full space-y-4 font-body">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadReport}
          className={OUTLINE_BTN}
        >
          <Download className="mr-2 h-3.5 w-3.5" />
          Download report
        </Button>
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={Zap}
          label="Team velocity"
          value={avgVelocity.toFixed(1)}
          unit="/wk"
          note={velocityNote || "tasks per week average"}
          tone="info"
        />
        <StatTile
          icon={Target}
          label="Achievement rate"
          value={`${outcomeMetrics.achievementRate.toFixed(0)}%`}
          note={`${outcomeMetrics.completedOutcomes} outcomes completed`}
          tone="success"
        />
        <StatTile
          icon={Flame}
          label="Current streak"
          value={outcomeMetrics.currentStreak}
          unit="wks"
          note={`Best: ${outcomeMetrics.longestStreak} weeks`}
          tone="warning"
        />
        <StatTile
          icon={AlertCircle}
          label="Active blockers"
          value={blockerTotal}
          note={
            blockerPatterns.length > 0
              ? `Top: ${blockerPatterns[0].reason}`
              : "No tasks blocked"
          }
          tone={blockerTotal > 0 ? "danger" : "success"}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={TAB_LIST}>
          <TabsTrigger value="overview" className={TAB_TRIGGER}>
            Overview
          </TabsTrigger>
          <TabsTrigger value="velocity" className={TAB_TRIGGER}>
            Velocity
          </TabsTrigger>
          <TabsTrigger value="blockers" className={TAB_TRIGGER}>
            Blockers
          </TabsTrigger>
          <TabsTrigger value="team" className={TAB_TRIGGER}>
            Team
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-3">
          <SectionCard>
            <SectionCard.Body className="pt-4">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
                <PanelSection
                  title="Stage progression"
                  description="Your journey through startup stages"
                >
                  {stageInsights.length > 0 ? (
                    <div className="space-y-4">
                      {stageInsights.map((stage) => (
                        <div key={stage.stageId} className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <p className="truncate font-body text-[13px] font-medium text-text-heading">
                                {stage.stageName}
                              </p>
                              <StatusBadge
                                status={
                                  stage.status === "completed"
                                    ? "completed"
                                    : stage.status === "current"
                                      ? "in-progress"
                                      : "pending"
                                }
                                label={stage.status}
                              />
                            </div>
                            <p className="font-heading text-[13px] font-semibold text-text-heading">
                              {Math.round(stage.completionRate)}%
                            </p>
                          </div>
                          <BrandProgress
                            value={stage.completionRate}
                            className="h-1.5"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyStateBlock
                      variant="compact"
                      icon={Target}
                      title="No stage data yet"
                      description="Complete milestones to see progression."
                    />
                  )}
                </PanelSection>

                <PanelSection
                  title="Outcome distribution"
                  description={`${outcomeMetrics.totalOutcomes} total weekly outcomes`}
                >
                  {outcomesPieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={outcomesPieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={60}
                          fill={COLORS.primary}
                          dataKey="value"
                        >
                          {outcomesPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyStateBlock
                      variant="compact"
                      icon={Target}
                      title="No outcome data yet"
                      description="Set weekly outcomes to see distribution."
                    />
                  )}
                </PanelSection>

                <PanelSection
                  title="Productivity trends"
                  description="Tasks completed over time"
                >
                  {productivityTrends.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={productivityTrends}>
                        <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="tasksCompleted"
                          stroke={COLORS.primary}
                          fill={COLORS.primary}
                          fillOpacity={0.15}
                          name="Tasks"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyStateBlock
                      variant="compact"
                      icon={Activity}
                      title="No productivity data yet"
                      description="Complete tasks to build trends."
                    />
                  )}
                </PanelSection>
              </div>
            </SectionCard.Body>
          </SectionCard>
        </TabsContent>

        <TabsContent value="velocity" className="mt-3 space-y-4">
          <SectionCard>
            <SectionCard.Header
              title="Team velocity over time"
              description="Tasks completed per week with completion rates"
            />
            <SectionCard.Body>
              {teamVelocity.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={teamVelocity}>
                    <XAxis dataKey="weekLabel" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="tasksCompleted"
                      fill={COLORS.primary}
                      name="Tasks Completed"
                    />
                    <Bar
                      dataKey="completionRate"
                      fill={COLORS.success}
                      name="Completion Rate %"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyStateBlock
                  variant="compact"
                  icon={Zap}
                  title="No velocity data yet"
                  description="Complete tasks to build weekly velocity."
                />
              )}
            </SectionCard.Body>
          </SectionCard>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <StatTile
              icon={Zap}
              label="Average velocity"
              value={avgVelocity.toFixed(1)}
              note="tasks per week"
              tone="info"
            />
            <StatTile
              icon={TrendingUp}
              label="Best week"
              value={Math.max(...teamVelocity.map((v) => v.tasksCompleted), 0)}
              note="tasks completed"
              tone="success"
            />
            <StatTile
              icon={Clock}
              label="Avg completion time"
              value={(
                teamVelocity.reduce((sum, v) => sum + v.averageCompletionTime, 0) /
                Math.max(teamVelocity.length, 1)
              ).toFixed(1)}
              unit="d"
              note="days per task"
              tone="info"
            />
          </div>
        </TabsContent>

        <TabsContent value="blockers" className="mt-3">
          <SectionCard>
            <SectionCard.Header
              title="Blocker patterns"
              description="What is slowing your team down"
            />
            <SectionCard.Body>
              {blockerPatterns.length > 0 ? (
                <div className="space-y-3">
                  {blockerPatterns.map((pattern, index) => (
                    <div
                      key={pattern.reason}
                      className="rounded-input border border-surface-border/60 bg-surface-page p-4"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-input",
                              index === 0
                                ? "bg-status-error/10 text-status-error"
                                : index === 1
                                  ? "bg-status-warning/15 text-status-warning"
                                  : "bg-primary-tint text-primary",
                            )}
                          >
                            <AlertCircle className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-heading text-[14px] font-semibold text-text-heading">
                              {pattern.reason}
                            </p>
                            <p className="font-body text-[12px] text-text-muted">
                              {pattern.count} task{pattern.count !== 1 ? "s" : ""}{" "}
                              affected
                            </p>
                          </div>
                        </div>
                        <StatusBadge
                          status={
                            index === 0 ? "urgent" : index === 1 ? "high" : "normal"
                          }
                          label={
                            index === 0 ? "Critical" : index === 1 ? "High" : "Medium"
                          }
                        />
                      </div>
                      {pattern.averageDuration > 0 && (
                        <div className="mt-2 flex items-center gap-2 font-body text-[12px] text-text-muted">
                          <Clock className="h-4 w-4" />
                          <span>
                            Avg duration: {pattern.averageDuration.toFixed(1)} days
                          </span>
                        </div>
                      )}
                      {pattern.affectedTasks.length > 0 && (
                        <div className="mt-3">
                          <p className="mb-1 font-body text-[11px] font-medium uppercase tracking-wide text-text-muted">
                            Affected tasks
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {pattern.affectedTasks.slice(0, 3).map((task, i) => (
                              <span
                                key={i}
                                className="rounded-pill border border-surface-border bg-white px-2 py-0.5 font-body text-[11px] text-text-body"
                              >
                                {task}
                              </span>
                            ))}
                            {pattern.affectedTasks.length > 3 && (
                              <span className="rounded-pill border border-surface-border bg-white px-2 py-0.5 font-body text-[11px] text-text-muted">
                                +{pattern.affectedTasks.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyStateBlock
                  variant="centered"
                  icon={CheckCircle2}
                  tone="success"
                  title="No blockers"
                  description="Your team is executing smoothly."
                />
              )}
            </SectionCard.Body>
          </SectionCard>
        </TabsContent>

        <TabsContent value="team" className="mt-3">
          <SectionCard>
            <SectionCard.Body className="pt-4">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
                <PanelSection
                  title="Team performance"
                  description={`${teamPerformance.activeMembers} of ${teamPerformance.totalMembers} members active`}
                >
                  {teamPerformance.topPerformers.length > 0 ? (
                    <div className="space-y-4">
                      {teamPerformance.topPerformers.map((member, index) => {
                        const maxTasks = Math.max(
                          ...teamPerformance.topPerformers.map((m) => m.tasksCompleted),
                          1,
                        );
                        const rankTone =
                          index === 0
                            ? "bg-status-warning/15 text-status-warning"
                            : index === 1
                              ? "bg-primary-tint text-primary"
                              : index === 2
                                ? "bg-status-success/15 text-status-success"
                                : "bg-primary-tint text-primary";
                        return (
                          <div key={index} className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              {index < 3 ? (
                                <div
                                  className={`flex h-8 w-8 items-center justify-center rounded-input font-heading text-[12px] font-bold ${rankTone}`}
                                >
                                  {index + 1}
                                </div>
                              ) : (
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={member.avatar} />
                                  <AvatarFallback className="rounded-input bg-primary-tint text-[11px] font-semibold text-primary">
                                    {member.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-body text-[13px] font-medium text-text-heading">
                                {member.name}
                              </p>
                              <p className="font-body text-[12px] text-text-muted">
                                {member.tasksCompleted} tasks completed
                              </p>
                            </div>
                            <BrandProgress
                              value={(member.tasksCompleted / maxTasks) * 100}
                              className="h-1.5 w-24"
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyStateBlock
                      variant="compact"
                      icon={Users}
                      title="No team activity yet"
                    />
                  )}
                </PanelSection>

                <PanelSection
                  title="Key insights"
                  description="Actionable recommendations"
                >
                  <div className="space-y-3">
                    {velocityTrend > 10 && (
                      <div className="rounded-input bg-primary-tint/60 p-3">
                        <div className="flex items-start gap-2">
                          <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-status-success" />
                          <div>
                            <p className="font-body text-sm font-medium text-text-heading">
                              Velocity improving
                            </p>
                            <p className="mt-1 font-body text-xs text-text-body">
                              {"Your team's pace is up "}
                              {velocityTrend.toFixed(0)}% this week. Keep the
                              momentum.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {blockerPatterns.length > 2 && (
                      <div className="rounded-input bg-status-warning/15 p-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-status-warning" />
                          <div>
                            <p className="font-body text-sm font-medium text-text-heading">
                              Multiple blockers detected
                            </p>
                            <p className="mt-1 font-body text-xs text-text-body">
                              Focus on resolving "{blockerPatterns[0].reason}
                              {'" affecting '}
                              {blockerPatterns[0].count}
                              {" tasks"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {outcomeMetrics.achievementRate >= 80 && (
                      <div className="rounded-input bg-primary-tint p-3">
                        <div className="flex items-start gap-2">
                          <Trophy className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                          <div>
                            <p className="font-body text-sm font-medium text-text-heading">
                              Strong execution
                            </p>
                            <p className="mt-1 font-body text-xs text-text-body">
                              {outcomeMetrics.achievementRate.toFixed(0)}% achievement
                              rate — strong weekly execution.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {teamPerformance.activeMembers <
                      teamPerformance.totalMembers / 2 &&
                      teamPerformance.totalMembers > 1 && (
                        <div className="rounded-input bg-status-warning/15 p-3">
                          <div className="flex items-start gap-2">
                            <Users className="mt-0.5 h-5 w-5 shrink-0 text-status-warning" />
                            <div>
                              <p className="font-body text-sm font-medium text-text-heading">
                                Low team engagement
                              </p>
                              <p className="mt-1 font-body text-xs text-text-body">
                                {"Only "}
                                {teamPerformance.activeMembers}/
                                {teamPerformance.totalMembers}
                                {" members active. Consider checking in."}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    {outcomeMetrics.currentStreak >= 4 && (
                      <div className="rounded-input bg-accent-tint/80 p-3">
                        <div className="flex items-start gap-2">
                          <Flame className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                          <div>
                            <p className="font-body text-sm font-medium text-text-heading">
                              Streak momentum
                            </p>
                            <p className="mt-1 font-body text-xs text-text-body">
                              {outcomeMetrics.currentStreak} consecutive weeks — keep
                              the momentum.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {velocityTrend <= 10 &&
                      blockerPatterns.length <= 2 &&
                      outcomeMetrics.achievementRate < 80 &&
                      !(
                        teamPerformance.activeMembers <
                          teamPerformance.totalMembers / 2 &&
                        teamPerformance.totalMembers > 1
                      ) &&
                      outcomeMetrics.currentStreak < 4 && (
                        <EmptyStateBlock
                          variant="compact"
                          icon={Target}
                          title="Insights will appear here"
                          description="Keep executing — recommendations show as patterns emerge."
                        />
                      )}
                  </div>
                </PanelSection>
              </div>
            </SectionCard.Body>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
