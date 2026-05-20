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
  TrendingDown,
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

const OUTLINE_BTN =
  "h-8 rounded-input border border-surface-border bg-white font-body text-[13px] font-medium text-text-body shadow-none hover:bg-primary-tint hover:text-primary";

const API_BASE = API_BASE_URL;

// Default fetch options for cookie-based auth

const defaultOptions = {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
};

const COLORS = {
  primary: "#3a5afe",
  success: "#00c896",
  warning: "#F39C12",
  danger: "#ff4f6b",
  info: "#3498DB",
  purple: "#9B59B6",
};
export default function AnalyticsDashboard({ founderId, founderName }) {
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const fetchAnalytics = async (isManualRefresh = false) => {
    if (!founderId) {
      console.error("❌ [Analytics] No founderId provided");
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
      setError(null);      console.log("🔍 [Analytics] Fetching for founderId:", founderId);
      const response = await fetch(`${API_BASE}/founders/${founderId}/analytics`, {
        ...defaultOptions,
        method: "GET",
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ [Analytics] API error:", response.status, errorText);
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }
      const data = unwrapData(await response.json());
      setAnalytics(data);
      setLastUpdated(new Date());
      console.log("✅ Analytics data loaded from backend:", data);
    } catch (err) {
      console.error("❌ [Analytics] Error fetching analytics:", {
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

  // Initial load
  useEffect(() => {
    fetchAnalytics(false);
  }, [founderId]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAnalytics(true);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [founderId]);

  // Manual refresh handler
  const handleManualRefresh = () => {
    fetchAnalytics(true);
  };

  // Download report handler
  const handleDownloadReport = () => {
    if (!analytics) return;

    // Generate comprehensive report text
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

    // Create blob and download
    const blob = new Blob([report], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `StartupVerse_Analytics_Report_${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  if (loading) {
    return (
      <SectionCard className="font-body">
        <SectionCard.Body className="flex flex-col items-center justify-center py-16">
          <Activity className="mb-3 h-10 w-10 animate-pulse text-text-muted" />
          <p className="font-body text-[13px] text-text-muted">Loading analytics...</p>
        </SectionCard.Body>
      </SectionCard>
    );
  }
  if (error || !analytics) {
    return (
      <SectionCard className="font-body">
        <SectionCard.Body className="p-0">
          <EmptyStateBlock
            variant="centered"
            icon={AlertCircle}
            tone="danger"
            title="Failed to load analytics"
            description={error || "Something went wrong. Try refreshing."}
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

  // Calculate trends
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

  // Prepare pie chart data for outcomes
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
      {isRefreshing && (
        <div className="flex items-center gap-2 rounded-input border border-primary/20 bg-primary-tint px-3 py-2">
          <Activity className="h-4 w-4 animate-pulse text-primary" />
          <p className="font-body text-[12px] text-text-body">
            Syncing live execution data...
          </p>
        </div>
      )}
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
        <TabsList className="mb-1 grid h-auto min-h-10 w-full grid-cols-4 gap-0 rounded-none border-0 border-b border-[#e2e4f0] bg-transparent p-0">
          <TabsTrigger
            value="overview"
            className="rounded-none border-0 border-b-2 border-transparent bg-transparent font-body font-medium text-[#4a4a5a] shadow-none transition-all duration-200 ease hover:text-[#3a5afe] data-[state=active]:border-[#3a5afe] data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-[#3a5afe] data-[state=active]:shadow-none"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="velocity"
            className="rounded-none border-0 border-b-2 border-transparent bg-transparent font-body font-medium text-[#4a4a5a] shadow-none transition-all duration-200 ease hover:text-[#3a5afe] data-[state=active]:border-[#3a5afe] data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-[#3a5afe] data-[state=active]:shadow-none"
          >
            Velocity
          </TabsTrigger>
          <TabsTrigger
            value="blockers"
            className="rounded-none border-0 border-b-2 border-transparent bg-transparent font-body font-medium text-[#4a4a5a] shadow-none transition-all duration-200 ease hover:text-[#3a5afe] data-[state=active]:border-[#3a5afe] data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-[#3a5afe] data-[state=active]:shadow-none"
          >
            Blockers
          </TabsTrigger>
          <TabsTrigger
            value="team"
            className="rounded-none border-0 border-b-2 border-transparent bg-transparent font-body font-medium text-[#4a4a5a] shadow-none transition-all duration-200 ease hover:text-[#3a5afe] data-[state=active]:border-[#3a5afe] data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-[#3a5afe] data-[state=active]:shadow-none"
          >
            Team
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <SectionCard>
              <SectionCard.Header
                title="Stage progression"
                description="Your journey through startup stages"
              />
              <SectionCard.Body>
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
                        <BrandProgress value={stage.completionRate} className="h-1.5" />
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
              </SectionCard.Body>
            </SectionCard>
            <SectionCard>
              <SectionCard.Header
                title="Outcome distribution"
                description={`${outcomeMetrics.totalOutcomes} total weekly outcomes`}
              />
              <SectionCard.Body>
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
              </SectionCard.Body>
            </SectionCard>
            <SectionCard>
              <SectionCard.Header
                title="Productivity trends"
                description="Tasks completed over time"
              />
              <SectionCard.Body>
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
              </SectionCard.Body>
            </SectionCard>
          </div>
        </TabsContent>
        <TabsContent value="velocity" className="space-y-4">
          <SectionCard>
            <SectionCard.Header
              title="Team velocity over time"
              description="Tasks completed per week with completion rates"
            />
            <SectionCard.Body>
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
        <TabsContent value="blockers" className="space-y-4">
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
                      className="rounded-[12px] bg-surface-page p-4"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-input ${
                              index === 0
                                ? "bg-[#fff1f2] text-[#ff4f6b]"
                                : index === 1
                                  ? "bg-[#fef3c7] text-[#ffb300]"
                                  : "bg-[#e8ebff] text-[#3a5afe]"
                            }`}
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
        <TabsContent value="team" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SectionCard>
              <SectionCard.Header
                title="Team performance"
                description={`${teamPerformance.activeMembers} of ${teamPerformance.totalMembers} members active`}
              />
              <SectionCard.Body>
                {teamPerformance.topPerformers.length > 0 ? (
                  <div className="space-y-4">
                    {teamPerformance.topPerformers.map((member, index) => {
                      const maxTasks = Math.max(
                        ...teamPerformance.topPerformers.map((m) => m.tasksCompleted),
                        1,
                      );
                      const rankTone =
                        index === 0
                          ? "bg-[#fef3c7] text-[#ffb300]"
                          : index === 1
                            ? "bg-[#e8ebff] text-[#3a5afe]"
                            : index === 2
                              ? "bg-[#d1fae5] text-[#00c896]"
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
              </SectionCard.Body>
            </SectionCard>
            <SectionCard>
              <SectionCard.Header
                title="Key insights"
                description="Actionable recommendations"
              />
              <SectionCard.Body>
                <div className="space-y-3">
                  {velocityTrend > 10 && (
                    <div className="rounded-input border-0 bg-primary-tint/60 p-3 transition-colors duration-200 ease-in-out">
                      <div className="flex items-start gap-2">
                        <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-status-success" />
                        <div>
                          <p className="font-body text-sm font-medium text-text-heading">
                            Velocity Improving!
                          </p>
                          <p className="mt-1 font-body text-xs text-text-body">
                            {"Your team's pace is up "}
                            {velocityTrend.toFixed(0)}% this week. Keep the
                            momentum!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {blockerPatterns.length > 2 && (
                    <div className="rounded-input border-0 bg-status-warning/15 p-3 transition-colors duration-200 ease-in-out">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-status-warning" />
                        <div>
                          <p className="font-body text-sm font-medium text-text-heading">
                            Multiple Blockers Detected
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
                    <div className="rounded-input border-0 bg-primary-tint p-3 transition-colors duration-200 ease-in-out">
                      <div className="flex items-start gap-2">
                        <Trophy className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <div>
                          <p className="font-body text-sm font-medium text-text-heading">
                            Outstanding Execution!
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
                      <div className="rounded-input border-0 bg-status-warning/15 p-3 transition-colors duration-200 ease-in-out">
                        <div className="flex items-start gap-2">
                          <Users className="mt-0.5 h-5 w-5 shrink-0 text-status-warning" />
                          <div>
                            <p className="font-body text-sm font-medium text-text-heading">
                              Low Team Engagement
                            </p>
                            <p className="mt-1 font-body text-xs text-text-body">
                              {"Only "}
                              {teamPerformance.activeMembers}/
                              {teamPerformance.totalMembers}
                              {" members active. Consider checking in!"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  {outcomeMetrics.currentStreak >= 4 && (
                    <div className="rounded-input border-0 bg-accent-tint/80 p-3 transition-colors duration-200 ease-in-out">
                      <div className="flex items-start gap-2">
                        <Flame className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                        <div>
                          <p className="font-body text-sm font-medium text-text-heading">
                            Streak Momentum!
                          </p>
                          <p className="mt-1 font-body text-xs text-text-body">
                            {outcomeMetrics.currentStreak} consecutive weeks — keep
                            the momentum.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard.Body>
            </SectionCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
