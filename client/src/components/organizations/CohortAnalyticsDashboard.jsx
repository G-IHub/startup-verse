/**
 * COHORT ANALYTICS - Comprehensive metrics dashboard
 */
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/apiBase.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  CheckCircle2,
  Activity,
  FileText,
} from "lucide-react";
import { unwrapData } from "../../utils/apiEnvelope";

const API_BASE = API_BASE_URL;

// Default fetch options for cookie-based auth

const defaultOptions = {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
};

export default function CohortAnalyticsDashboard({ cohortId }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadAnalytics();
  }, [cohortId]);
  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/cohorts/${cohortId}/analytics/overview`,
        {
          ...defaultOptions,
        },
      );
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const inner = unwrapData(await response.json());
      setAnalytics(inner.analytics);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-pulse text-[10px]">Loading analytics...</div>
        </CardContent>
      </Card>
    );
  }
  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-[10px] text-muted-foreground">
            Failed to load analytics
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-[11px]">Cohort Overview</CardTitle>
          <CardDescription className="text-[9px]">
            {"Key metrics across all "}
            {analytics.cohortSize}
            {" active startups"}
            {typeof analytics.recentJoinsLast30Days === "number" ? (
              <>
                {" · "}
                {analytics.recentJoinsLast30Days}
                {" joined in the last 30 days"}
              </>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-accent/50 rounded-lg">
              <Users className="w-5 h-5 text-primary mx-auto mb-1" />
              <div className="text-[18px] font-bold">
                {analytics.cohortSize}
              </div>
              <div className="text-[8px] text-muted-foreground">Startups</div>
            </div>
            <div className="text-center p-3 bg-accent/50 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <div className="text-[18px] font-bold">
                {analytics.aggregateMetrics.totalTeamMembers}
              </div>
              <div className="text-[8px] text-muted-foreground">
                Total Team Members
              </div>
            </div>
            <div className="text-center p-3 bg-accent/50 rounded-lg">
              <Users className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <div className="text-[18px] font-bold">
                {analytics.aggregateMetrics.avgTeamSize}
              </div>
              <div className="text-[8px] text-muted-foreground">
                Avg Team Size
              </div>
            </div>
            <div className="text-center p-3 bg-accent/50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600 mx-auto mb-1" />
              <div className="text-[18px] font-bold">
                {analytics.aggregateMetrics.totalWeeklyOutcomes}
              </div>
              <div className="text-[8px] text-muted-foreground">
                Weekly Outcomes
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Task Completion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">
                Total Tasks
              </span>
              <span className="text-[11px] font-bold">
                {analytics.aggregateMetrics.totalTasks}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">
                Completed
              </span>
              <span className="text-[11px] font-bold text-green-600">
                {analytics.aggregateMetrics.completedTasks}
              </span>
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[8px] text-muted-foreground">
                  Completion Rate
                </span>
                <span className="text-[10px] font-bold">
                  {analytics.aggregateMetrics.taskCompletionRate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${analytics.aggregateMetrics.taskCompletionRate}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] flex items-center gap-1.5">
              <Target className="w-4 h-4" />
              Milestone Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">
                Total Milestones
              </span>
              <span className="text-[11px] font-bold">
                {analytics.aggregateMetrics.totalMilestones}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">
                Completed
              </span>
              <span className="text-[11px] font-bold text-blue-600">
                {analytics.aggregateMetrics.completedMilestones}
              </span>
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[8px] text-muted-foreground">
                  Completion Rate
                </span>
                <span className="text-[10px] font-bold">
                  {analytics.aggregateMetrics.milestoneCompletionRate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{
                    width: `${analytics.aggregateMetrics.milestoneCompletionRate}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-[10px] flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            Program Metrics
          </CardTitle>
          <CardDescription className="text-[8px]">
            Deliverables and program milestones tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center">
              <div className="text-[16px] font-bold text-purple-600">
                {analytics.programMetrics.totalProgramMilestones}
              </div>
              <div className="text-[8px] text-muted-foreground">
                Program Milestones
              </div>
            </div>
            <div className="text-center">
              <div className="text-[16px] font-bold text-blue-600">
                {analytics.programMetrics.totalDeliverables}
              </div>
              <div className="text-[8px] text-muted-foreground">
                Deliverables
              </div>
            </div>
            <div className="text-center">
              <div className="text-[16px] font-bold text-green-600">
                {analytics.programMetrics.totalSubmissions}
              </div>
              <div className="text-[8px] text-muted-foreground">
                Submissions
              </div>
            </div>
            <div className="text-center">
              <div className="text-[16px] font-bold text-orange-600">
                {analytics.programMetrics.submissionRate}%
              </div>
              <div className="text-[8px] text-muted-foreground">
                Submission Rate
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-[10px] flex items-center gap-1.5">
            <Activity className="w-4 h-4" />
            Weekly Execution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[9px] text-muted-foreground mb-1">
                Total Weekly Outcomes
              </div>
              <div className="text-[20px] font-bold text-primary">
                {analytics.aggregateMetrics.totalWeeklyOutcomes}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-muted-foreground mb-1">
                Avg Per Startup
              </div>
              <div className="text-[20px] font-bold text-green-600">
                {analytics.aggregateMetrics.avgWeeklyOutcomesPerStartup}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
