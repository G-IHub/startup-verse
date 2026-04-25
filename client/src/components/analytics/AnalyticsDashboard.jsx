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
  CartesianGrid,
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
import { getAccessToken } from "../../app/session";
import { unwrapData } from "../../utils/apiEnvelope";

const API_BASE = API_BASE_URL;

const COLORS = {
  primary: "#3A5AFE",
  success: "#2ECC71",
  warning: "#F39C12",
  danger: "#E74C3C",
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
      setError(null);
      const token = getAccessToken();
      console.log("🔍 [Analytics] Fetching for founderId:", founderId);
      const response = await fetch(`${API_BASE}/founders/${founderId}/analytics`, {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Content-Type": "application/json",
        },
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
      <div className="p-8 text-center">
        <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3 animate-pulse" />
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }
  if (error || !analytics) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <p className="text-red-500">{error || "Failed to load analytics"}</p>
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
    <div className="p-3 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="mb-1 text-xl">📊 Analytics & Insights</h1>
          <p className="text-sm text-muted-foreground">
            Data-driven insights to optimize your team's performance
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadReport}
              className="h-8"
            >
              <Download className="w-3 h-3 mr-2" />
              Download Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="h-8"
            >
              <RefreshCw
                className={`w-3 h-3 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              {"Updated "}
              {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
      {isRefreshing && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-2 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600 animate-pulse" />
          <p className="text-xs text-blue-900 dark:text-blue-100">
            Syncing with live data from Core Engine...
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
            <CardTitle className="text-xs font-medium">Team Velocity</CardTitle>
            <Zap className="w-3 h-3 text-primary" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-xl font-bold">{avgVelocity.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">tasks/week avg</p>
            {velocityTrend !== 0 && (
              <div
                className={`flex items-center gap-1 mt-1 text-xs ${velocityTrend > 0 ? "text-green-600" : "text-red-600"}`}
              >
                {velocityTrend > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{Math.abs(velocityTrend).toFixed(1)}% vs last week</span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
            <CardTitle className="text-xs font-medium">
              Achievement Rate
            </CardTitle>
            <Target className="w-3 h-3 text-green-600" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-xl font-bold">
              {outcomeMetrics.achievementRate.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              outcomes fully completed
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {outcomeMetrics.completedOutcomes}
                {" completed"}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
            <CardTitle className="text-xs font-medium">
              Current Streak
            </CardTitle>
            <Flame className="w-3 h-3 text-orange-600" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-xl font-bold">
              {outcomeMetrics.currentStreak}
            </div>
            <p className="text-xs text-muted-foreground">weeks strong 🔥</p>
            <div className="text-xs text-muted-foreground mt-1">
              {"Best: "}
              {outcomeMetrics.longestStreak}
              {" weeks"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
            <CardTitle className="text-xs font-medium">
              Active Blockers
            </CardTitle>
            <AlertCircle className="w-3 h-3 text-red-600" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-xl font-bold">
              {blockerPatterns.reduce((sum, bp) => sum + bp.count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">tasks blocked</p>
            {blockerPatterns.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                {"Top: "}
                {blockerPatterns[0].reason}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="velocity">Velocity</TabsTrigger>
          <TabsTrigger value="blockers">Blockers</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <Card>
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-sm">Stage Progression</CardTitle>
                <CardDescription className="text-xs">
                  Your journey through startup stages
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="space-y-3">
                  {stageInsights.map((stage) => (
                    <div key={stage.stageId} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium">
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
                            className="text-xs px-1.5 py-0"
                          >
                            {stage.status}
                          </Badge>
                        </div>
                        <p className="text-xs font-semibold">
                          {Math.round(stage.completionRate)}%
                        </p>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${stage.status === "completed" ? "bg-green-600" : stage.status === "current" ? "bg-primary" : "bg-muted-foreground/30"}`}
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
            <Card>
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-sm">Outcome Distribution</CardTitle>
                <CardDescription className="text-xs">
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
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">No outcome data yet</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-sm">Productivity Trends</CardTitle>
                <CardDescription className="text-xs">
                  Tasks completed over time
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={productivityTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
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
          <Card>
            <CardHeader>
              <CardTitle>Team Velocity Over Time</CardTitle>
              <CardDescription>
                Tasks completed per week with completion rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={teamVelocity}>
                  <CartesianGrid strokeDasharray="3 3" />
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Average Velocity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {avgVelocity.toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  tasks per week
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Best Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {Math.max(...teamVelocity.map((v) => v.tasksCompleted), 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  tasks completed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Avg Completion Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {(
                    teamVelocity.reduce(
                      (sum, v) => sum + v.averageCompletionTime,
                      0,
                    ) / Math.max(teamVelocity.length, 1)
                  ).toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  days per task
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="blockers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Blocker Patterns</CardTitle>
              <CardDescription>
                Understanding what's slowing your team down
              </CardDescription>
            </CardHeader>
            <CardContent>
              {blockerPatterns.length > 0 ? (
                <div className="space-y-4">
                  {blockerPatterns.map((pattern, index) => (
                    <div
                      key={pattern.reason}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
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
                <div className="text-center py-12">
                  <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <p className="font-medium">No blockers! 🎉</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your team is executing smoothly
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="team" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Performance</CardTitle>
                <CardDescription>
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
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{
                            width: `${Math.min((member.tasksCompleted / Math.max(...teamPerformance.topPerformers.map((m) => m.tasksCompleted))) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {teamPerformance.topPerformers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No team activity yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>Actionable recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {velocityTrend > 10 && (
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                      <div className="flex items-start gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm text-green-900 dark:text-green-100">
                            Velocity Improving!
                          </p>
                          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                            {"Your team's pace is up "}
                            {velocityTrend.toFixed(0)}% this week. Keep the
                            momentum!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {blockerPatterns.length > 2 && (
                    <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm text-orange-900 dark:text-orange-100">
                            Multiple Blockers Detected
                          </p>
                          <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
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
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Trophy className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm text-blue-900 dark:text-blue-100">
                            Outstanding Execution!
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
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
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Users className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-sm text-yellow-900 dark:text-yellow-100">
                              Low Team Engagement
                            </p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
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
                    <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Flame className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm text-purple-900 dark:text-purple-100">
                            Streak Momentum!
                          </p>
                          <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
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
