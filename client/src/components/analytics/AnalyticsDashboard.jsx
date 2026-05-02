import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/apiBase.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
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

📊 EXECUTIVE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Team Velocity: ${avgVelocity.toFixed(1)} tasks/week
Achievement Rate: ${outcomeMetrics.achievementRate.toFixed(0)}%
Current Streak: ${outcomeMetrics.currentStreak} weeks
Active Blockers: ${blockerPatterns.reduce((sum, bp) => sum + bp.count, 0)} tasks


⚡ TEAM VELOCITY ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Average Velocity: ${avgVelocity.toFixed(1)} tasks/week
${velocityTrend !== 0 ? `Trend vs Last Week: ${velocityTrend > 0 ? "+" : ""}${velocityTrend.toFixed(1)}%` : "No trend data available"}
Best Week: ${Math.max(...teamVelocity.map((v) => v.tasksCompleted), 0)} tasks
Average Completion Time: ${(teamVelocity.reduce((sum, v) => sum + v.averageCompletionTime, 0) / Math.max(teamVelocity.length, 1)).toFixed(1)} days/task

Weekly Breakdown:
${teamVelocity.map((v) => `  • ${v.weekLabel}: ${v.tasksCompleted} tasks (${v.completionRate.toFixed(0)}% completion rate)`).join("\n")}


🎯 OUTCOME METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Weekly Outcomes: ${outcomeMetrics.totalOutcomes}
Completed: ${outcomeMetrics.completedOutcomes} (${((outcomeMetrics.completedOutcomes / Math.max(outcomeMetrics.totalOutcomes, 1)) * 100).toFixed(0)}%)
Partial: ${outcomeMetrics.partialOutcomes} (${((outcomeMetrics.partialOutcomes / Math.max(outcomeMetrics.totalOutcomes, 1)) * 100).toFixed(0)}%)
Missed: ${outcomeMetrics.missedOutcomes} (${((outcomeMetrics.missedOutcomes / Math.max(outcomeMetrics.totalOutcomes, 1)) * 100).toFixed(0)}%)

Achievement Rate: ${outcomeMetrics.achievementRate.toFixed(0)}%
Current Streak: ${outcomeMetrics.currentStreak} weeks 🔥
Longest Streak: ${outcomeMetrics.longestStreak} weeks


🚧 BLOCKER ANALYSIS
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
    : "No active blockers! 🎉"
}


📈 STAGE PROGRESSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${stageInsights.map((stage) => `  • ${stage.stageName}: ${Math.round(stage.completionRate)}% (${stage.status})`).join("\n")}


👥 TEAM PERFORMANCE
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


📊 PRODUCTIVITY TRENDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${productivityTrends.map((pt) => `  • ${pt.period}: ${pt.tasksCompleted} tasks`).join("\n")}


💡 KEY INSIGHTS & RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${velocityTrend > 10 ? `✅ Velocity Improving: Your team's pace is up ${velocityTrend.toFixed(0)}% this week. Keep the momentum!\n` : ""}
${blockerPatterns.length > 2 ? `⚠️  Multiple Blockers: Focus on resolving "${blockerPatterns[0].reason}" affecting ${blockerPatterns[0].count} tasks\n` : ""}
${outcomeMetrics.achievementRate >= 80 ? `🏆 Outstanding Execution: ${outcomeMetrics.achievementRate.toFixed(0)}% achievement rate - you're crushing it!\n` : ""}
${teamPerformance.activeMembers < teamPerformance.totalMembers / 2 && teamPerformance.totalMembers > 1 ? `👥 Low Team Engagement: Only ${teamPerformance.activeMembers}/${teamPerformance.totalMembers} members active. Consider checking in!\n` : ""}
${outcomeMetrics.currentStreak >= 4 ? `🔥 Streak Momentum: ${outcomeMetrics.currentStreak} weeks strong! Don't break the chain!\n` : ""}
${outcomeMetrics.achievementRate < 50 && outcomeMetrics.totalOutcomes > 0 ? `📉 Achievement Rate Alert: ${outcomeMetrics.achievementRate.toFixed(0)}% rate suggests scope may be too ambitious. Consider breaking down outcomes.\n` : ""}
${blockerPatterns.length === 0 && teamVelocity.length > 0 ? `✨ Smooth Execution: No blockers detected - your team is operating efficiently!\n` : ""}


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
      <div className="min-h-full bg-surface-page p-8 text-center font-body">
        <Activity className="mx-auto mb-3 h-12 w-12 animate-pulse text-text-muted" />
        <p className="font-body text-text-muted">Loading analytics...</p>
      </div>
    );
  }
  if (error || !analytics) {
    return (
      <div className="min-h-full bg-surface-page p-8 text-center font-body">
        <AlertCircle className="mx-auto mb-3 h-12 w-12 text-status-error" />
        <p className="font-body text-status-error">{error || "Failed to load analytics"}</p>
      </div>
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
  return (
    <div className="min-h-full space-y-4 bg-surface-page p-3 font-body">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="mb-1 font-heading text-xl font-bold text-text-heading">
            📊 Analytics & Insights
          </h1>
          <p className="font-body text-sm text-text-body">
            Data-driven insights to optimize your team's performance
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadReport}
              className="h-8 rounded-input border border-surface-border bg-surface-card font-body font-semibold text-text-body shadow-none transition-colors duration-200 ease-in-out hover:border-primary hover:bg-surface-card hover:text-primary [&_svg]:text-text-body hover:[&_svg]:text-primary"
            >
              <Download className="mr-2 h-3 w-3" />
              Download Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="h-8 rounded-input border border-surface-border bg-surface-card font-body font-semibold text-text-body shadow-none transition-colors duration-200 ease-in-out hover:border-primary hover:bg-surface-card hover:text-primary [&_svg]:text-text-body hover:[&_svg]:text-primary"
            >
              <RefreshCw
                className={`mr-2 h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
          {lastUpdated && (
            <p className="font-body text-xs text-text-muted">
              {"Updated "}
              {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
      {isRefreshing && (
        <div className="flex items-center gap-2 rounded-input border border-surface-border bg-primary-tint p-2">
          <Activity className="h-4 w-4 animate-pulse text-primary" />
          <p className="font-body text-xs text-text-body">
            Syncing with live data from Core Engine...
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 bg-surface-card shadow-soft rounded-card">
          <CardHeader className="flex flex-row items-center justify-between px-3 pb-1 pt-3">
            <CardTitle className="font-body text-xs font-medium text-text-body">
              Team Velocity
            </CardTitle>
            <Zap className="h-3 w-3 text-primary" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="font-heading text-xl font-extrabold text-text-heading">
              {avgVelocity.toFixed(1)}
            </div>
            <p className="font-body text-xs text-text-muted">tasks/week avg</p>
            {velocityTrend !== 0 && (
              <div
                className={`mt-1 flex items-center gap-1 font-body text-xs ${velocityTrend > 0 ? "text-status-success" : "text-status-error"}`}
              >
                {velocityTrend > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{Math.abs(velocityTrend).toFixed(1)}% vs last week</span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-0 bg-surface-card shadow-soft rounded-card">
          <CardHeader className="flex flex-row items-center justify-between px-3 pb-1 pt-3">
            <CardTitle className="font-body text-xs font-medium text-text-body">
              Achievement Rate
            </CardTitle>
            <Target className="h-3 w-3 text-status-success" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="font-heading text-xl font-extrabold text-text-heading">
              {outcomeMetrics.achievementRate.toFixed(0)}%
            </div>
            <p className="font-body text-xs text-text-muted">
              outcomes fully completed
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="inline-flex items-center rounded-pill bg-primary-tint px-2.5 py-0.5 font-body text-xs font-semibold text-primary">
                {outcomeMetrics.completedOutcomes}
                {" completed"}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-surface-card shadow-soft rounded-card">
          <CardHeader className="flex flex-row items-center justify-between px-3 pb-1 pt-3">
            <CardTitle className="font-body text-xs font-medium text-text-body">
              Current Streak
            </CardTitle>
            <Flame className="h-3 w-3" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="font-heading text-xl font-extrabold text-text-heading">
              {outcomeMetrics.currentStreak}
            </div>
            <p className="font-body text-xs text-text-muted">weeks strong 🔥</p>
            <div className="mt-1 font-body text-xs text-text-muted">
              {"Best: "}
              {outcomeMetrics.longestStreak}
              {" weeks"}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-surface-card shadow-soft rounded-card">
          <CardHeader className="flex flex-row items-center justify-between px-3 pb-1 pt-3">
            <CardTitle className="font-body text-xs font-medium text-text-body">
              Active Blockers
            </CardTitle>
            <AlertCircle className="h-3 w-3 text-status-error" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="font-heading text-xl font-extrabold text-text-heading">
              {blockerPatterns.reduce((sum, bp) => sum + bp.count, 0)}
            </div>
            <p className="font-body text-xs text-text-muted">tasks blocked</p>
            {blockerPatterns.length > 0 && (
              <div className="mt-1 font-body text-xs text-text-muted">
                {"Top: "}
                {blockerPatterns[0].reason}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid h-auto min-h-10 w-full grid-cols-4 gap-0 rounded-none border-0 border-b border-surface-border bg-transparent p-0">
          <TabsTrigger
            value="overview"
            className="rounded-none border-0 border-b-2 border-transparent bg-transparent font-body font-medium text-text-body shadow-none transition-colors duration-200 ease-in-out hover:text-primary data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="velocity"
            className="rounded-none border-0 border-b-2 border-transparent bg-transparent font-body font-medium text-text-body shadow-none transition-colors duration-200 ease-in-out hover:text-primary data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            Velocity
          </TabsTrigger>
          <TabsTrigger
            value="blockers"
            className="rounded-none border-0 border-b-2 border-transparent bg-transparent font-body font-medium text-text-body shadow-none transition-colors duration-200 ease-in-out hover:text-primary data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            Blockers
          </TabsTrigger>
          <TabsTrigger
            value="team"
            className="rounded-none border-0 border-b-2 border-transparent bg-transparent font-body font-medium text-text-body shadow-none transition-colors duration-200 ease-in-out hover:text-primary data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            Team
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <Card className="border-0 bg-surface-card shadow-soft rounded-card">
              <CardHeader className="px-3 pb-2 pt-3">
                <CardTitle className="font-heading text-sm font-semibold text-text-heading">
                  Stage Progression
                </CardTitle>
                <CardDescription className="font-body text-xs text-text-body">
                  Your journey through startup stages
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="space-y-3">
                  {stageInsights.map((stage) => (
                    <div key={stage.stageId} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="font-body text-xs font-medium">
                            {stage.stageName}
                          </p>
                          <Badge
                            variant={
                              stage.status === "completed"
                                ? "default"
                                : stage.status === "current"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="px-1.5 py-0 text-xs"
                          >
                            {stage.status}
                          </Badge>
                        </div>
                        <p className="font-body text-xs font-semibold">
                          {Math.round(stage.completionRate)}%
                        </p>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-surface-page">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-200 ease-in-out ${stage.status === "completed" ? "bg-status-success" : stage.status === "current" ? "bg-primary" : "bg-text-muted/30"}`}
                          style={{
                            width: `${stage.completionRate}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 bg-surface-card shadow-soft rounded-card">
              <CardHeader className="px-3 pb-2 pt-3">
                <CardTitle className="font-heading text-sm font-semibold text-text-heading">
                  Outcome Distribution
                </CardTitle>
                <CardDescription className="font-body text-xs text-text-body">
                  {outcomeMetrics.totalOutcomes}
                  {" total weekly outcomes"}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 pb-3">
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
                        fill="#8884d8"
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
                  <div className="flex h-[200px] items-center justify-center">
                    <div className="text-center">
                      <Target className="mx-auto mb-2 h-8 w-8 text-surface-border" />
                      <p className="font-body text-xs text-text-muted">
                        No outcome data yet
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="border-0 bg-surface-card shadow-soft rounded-card">
              <CardHeader className="px-3 pb-2 pt-3">
                <CardTitle className="font-heading text-sm font-semibold text-text-heading">
                  Productivity Trends
                </CardTitle>
                <CardDescription className="font-body text-xs text-text-body">
                  Tasks completed over time
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={productivityTrends}>
                    <XAxis
                      dataKey="period"
                      tick={{
                        fontSize: 10,
                      }}
                    />
                    <YAxis
                      tick={{
                        fontSize: 10,
                      }}
                    />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="tasksCompleted"
                      stroke={COLORS.primary}
                      fill={COLORS.primary}
                      fillOpacity={0.6}
                      name="Tasks"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="velocity" className="space-y-4">
          <Card className="border-0 bg-surface-card shadow-soft rounded-card">
            <CardHeader>
              <CardTitle className="font-heading font-semibold text-text-heading">
                Team Velocity Over Time
              </CardTitle>
              <CardDescription className="font-body text-text-body">
                Tasks completed per week with completion rates
              </CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="border-0 bg-surface-card shadow-soft rounded-card">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-sm font-semibold text-text-heading">
                  Average Velocity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-heading text-3xl font-extrabold text-text-heading">
                  {avgVelocity.toFixed(1)}
                </div>
                <p className="mt-1 font-body text-xs text-text-muted">
                  tasks per week
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-surface-card shadow-soft rounded-card">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-sm font-semibold text-text-heading">
                  Best Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-heading text-3xl font-extrabold text-text-heading">
                  {Math.max(...teamVelocity.map((v) => v.tasksCompleted), 0)}
                </div>
                <p className="mt-1 font-body text-xs text-text-muted">
                  tasks completed
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-surface-card shadow-soft rounded-card">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-sm font-semibold text-text-heading">
                  Avg Completion Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-heading text-3xl font-extrabold text-text-heading">
                  {(
                    teamVelocity.reduce(
                      (sum, v) => sum + v.averageCompletionTime,
                      0,
                    ) / Math.max(teamVelocity.length, 1)
                  ).toFixed(1)}
                </div>
                <p className="mt-1 font-body text-xs text-text-muted">
                  days per task
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="blockers" className="space-y-4">
          <Card className="border-0 bg-surface-card shadow-soft rounded-card">
            <CardHeader>
              <CardTitle className="font-heading font-semibold text-text-heading">
                Blocker Patterns
              </CardTitle>
              <CardDescription className="font-body text-text-body">
                Understanding what's slowing your team down
              </CardDescription>
            </CardHeader>
            <CardContent>
              {blockerPatterns.length > 0 ? (
                <div className="space-y-4">
                  {blockerPatterns.map((pattern, index) => (
                    <div
                      key={pattern.reason}
                      className="rounded-input border-0 bg-surface-page p-4 transition-colors duration-200 ease-in-out hover:bg-surface-page/80"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${index === 0 ? "bg-red-100 dark:bg-red-950" : index === 1 ? "bg-orange-100 dark:bg-orange-950" : "bg-yellow-100 dark:bg-yellow-950"}`}
                          >
                            <AlertCircle
                              className={`w-5 h-5 ${index === 0 ? "text-red-600" : index === 1 ? "text-orange-600" : "text-yellow-600"}`}
                            />
                          </div>
                          <div>
                            <p className="font-semibold">{pattern.reason}</p>
                            <p className="text-sm text-muted-foreground">
                              {pattern.count}
                              {" task"}
                              {pattern.count !== 1 ? "s" : ""}
                              {" affected"}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={index === 0 ? "destructive" : "secondary"}
                        >
                          {index === 0
                            ? "Critical"
                            : index === 1
                              ? "High"
                              : "Medium"}
                        </Badge>
                      </div>
                      {pattern.averageDuration > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {"Avg duration: "}
                            {pattern.averageDuration.toFixed(1)}
                            {" days"}
                          </span>
                        </div>
                      )}
                      <div className="mt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Affected tasks:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {pattern.affectedTasks.slice(0, 3).map((task, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-xs"
                            >
                              {task}
                            </Badge>
                          ))}
                          {pattern.affectedTasks.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{pattern.affectedTasks.length - 3}
                              {" more"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-status-success" />
                  <p className="font-body font-medium text-text-heading">
                    No blockers! 🎉
                  </p>
                  <p className="mt-1 font-body text-sm text-text-muted">
                    Your team is executing smoothly
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="team" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="border-0 bg-surface-card shadow-soft rounded-card">
              <CardHeader>
                <CardTitle className="font-heading font-semibold text-text-heading">
                  Team Performance
                </CardTitle>
                <CardDescription className="font-body text-text-body">
                  {teamPerformance.activeMembers}
                  {" of "}
                  {teamPerformance.totalMembers}
                  {" members active"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamPerformance.topPerformers.map((member, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {index < 3 && (
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300" : index === 1 ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" : "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"}`}
                          >
                            {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                          </div>
                        )}
                        {index >= 3 && (
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="text-xs">
                              {member.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {member.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {member.tasksCompleted}
                          {" tasks completed"}
                        </p>
                      </div>
                      <div className="h-2 w-24 rounded-full bg-surface-page">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{
                            width: `${Math.min((member.tasksCompleted / Math.max(...teamPerformance.topPerformers.map((m) => m.tasksCompleted))) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {teamPerformance.topPerformers.length === 0 && (
                    <div className="py-8 text-center">
                      <Users className="mx-auto mb-3 h-12 w-12 text-surface-border" />
                      <p className="font-body text-text-muted">
                        No team activity yet
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 bg-surface-card shadow-soft rounded-card">
              <CardHeader>
                <CardTitle className="font-heading font-semibold text-text-heading">
                  Key Insights
                </CardTitle>
                <CardDescription className="font-body text-text-body">
                  Actionable recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                            {outcomeMetrics.achievementRate.toFixed(0)}%
                            achievement rate - you're crushing it!
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
                            {outcomeMetrics.currentStreak}
                            {" weeks strong! Don't break the chain 🔥"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
