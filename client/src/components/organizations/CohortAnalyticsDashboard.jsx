/**
 * COHORT ANALYTICS - Comprehensive metrics dashboard
 */
import React, { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../../config/apiBase.js";
import {
  BarChart3,
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
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { unwrapData } from "../../utils/apiEnvelope";
import { Button } from "../ui/button";
import {
  StatTile,
  SectionCard,
  SectionHeader,
  BrandProgress,
  EmptyStateBlock,
} from "./_primitives";
import { cn } from "../ui/utils";

const API_BASE = API_BASE_URL;
const CHART_PRIMARY = "#3A5AFE";
const CHART_SUCCESS = "#00c896";

const RANGE_OPTIONS = [
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
  { id: "all", label: "All time" },
];

const defaultOptions = {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
};

function ProgressRow({ label, value, max, tone = "info" }) {
  const numericValue = typeof value === "number" ? value : Number(value) || 0;
  const numericMax = typeof max === "number" ? max : Number(max) || 0;
  const pct =
    numericMax > 0 ? Math.min(100, Math.round((numericValue / numericMax) * 100)) : 0;
  const toneClass =
    tone === "success"
      ? "text-[#00c896]"
      : tone === "warning"
        ? "text-[#ffb300]"
        : tone === "danger"
          ? "text-[#ff4f6b]"
          : "text-primary";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="font-body text-[12px] text-text-muted">{label}</span>
        <span className="font-heading text-[14px] font-semibold text-text-heading">
          <span className={toneClass}>{numericValue}</span>
          <span className="text-text-muted font-normal"> / {numericMax}</span>
        </span>
      </div>
      <BrandProgress value={pct} className="h-1.5" />
    </div>
  );
}

function RangeChip({ active, onClick, children }) {
  return (
    <Button
      size="sm"
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 rounded-input font-body text-[12px] font-medium",
        active
          ? "bg-primary text-white hover:bg-primary-hover"
          : "border border-surface-border bg-white text-text-body hover:bg-primary-tint hover:text-primary",
      )}
    >
      {children}
    </Button>
  );
}

function ChartEmpty({ message }) {
  return (
    <p className="py-10 text-center font-body text-[13px] text-text-muted">{message}</p>
  );
}

function seriesHasData(rows, key) {
  return Array.isArray(rows) && rows.some((r) => Number(r[key]) > 0);
}

export default function CohortAnalyticsDashboard({ cohortId }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("90d");

  const loadAnalytics = useCallback(async () => {
    if (!cohortId) return;
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/cohorts/${cohortId}/analytics/overview?range=${encodeURIComponent(range)}`,
        { ...defaultOptions },
      );
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const inner = unwrapData(await response.json());
      setAnalytics(inner.analytics);
    } catch (error) {
      console.error("Error loading analytics:", error);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [cohortId, range]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading) {
    return (
      <SectionCard>
        <SectionCard.Body className="p-8 text-center">
          <div className="font-body text-[13px] text-text-muted animate-pulse">
            Loading analytics...
          </div>
        </SectionCard.Body>
      </SectionCard>
    );
  }

  if (!analytics) {
    return (
      <SectionCard>
        <SectionCard.Body className="p-0">
          <EmptyStateBlock
            variant="centered"
            icon={BarChart3}
            tone="danger"
            title="Failed to load analytics"
            description="We could not fetch cohort analytics. Try refreshing the page."
          />
        </SectionCard.Body>
      </SectionCard>
    );
  }

  const aggregate = analytics.aggregateMetrics || {};
  const program = analytics.programMetrics || {};
  const trends = analytics.trends || {};
  const engagement = [...(trends.engagementByWeek || [])].reverse();
  const velocity = [...(trends.milestoneVelocityByWeek || [])].reverse();
  const streakHist = trends.weeklyOutcomeStreakHistogram || [];

  const rangeNote =
    analytics.range === "all"
      ? "All time"
      : analytics.range === "30d"
        ? "Last 30 days"
        : "Last 90 days";

  return (
    <div className="space-y-4 font-body">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeader
          icon={BarChart3}
          title="Analytics &amp; Insights"
          description={
            typeof analytics.recentJoinsLast30Days === "number"
              ? `Key metrics across all ${analytics.cohortSize} active startups · ${analytics.recentJoinsLast30Days} joined in the last 30 days`
              : `Key metrics across all ${analytics.cohortSize} active startups`
          }
          className="flex-1"
        />
        <div className="flex flex-wrap gap-2 shrink-0">
          {RANGE_OPTIONS.map((opt) => (
            <RangeChip
              key={opt.id}
              active={range === opt.id}
              onClick={() => setRange(opt.id)}
            >
              {opt.label}
            </RangeChip>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
          note={rangeNote}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SectionCard>
          <SectionCard.Header
            title={
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#00c896]" />
                Task Completion
              </span>
            }
            description={`Total vs completed tasks · ${rangeNote.toLowerCase()}`}
          />
          <SectionCard.Body>
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
                  <div className="font-heading text-[20px] font-bold text-[#00c896]">
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
          </SectionCard.Body>
        </SectionCard>

        <SectionCard>
          <SectionCard.Header
            title={
              <span className="inline-flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Milestone Progress
              </span>
            }
            description={`Total vs completed milestones · ${rangeNote.toLowerCase()}`}
          />
          <SectionCard.Body>
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
          </SectionCard.Body>
        </SectionCard>
      </div>

      <SectionCard>
        <SectionCard.Header
          title={
            <span className="inline-flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Program Metrics
            </span>
          }
          description="Deliverables and program milestones tracking"
        />
        <SectionCard.Body>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
        </SectionCard.Body>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <SectionCard>
          <SectionCard.Header
            title={
              <span className="inline-flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Engagement trend
              </span>
            }
            description="Team activity events per week (last 8 weeks)"
          />
          <SectionCard.Body>
            {seriesHasData(engagement, "activityCount") ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={engagement}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf4" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="activityCount"
                    stroke={CHART_PRIMARY}
                    fill={CHART_PRIMARY}
                    fillOpacity={0.2}
                    name="Activities"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmpty message="No team activity in the last 8 weeks." />
            )}
          </SectionCard.Body>
        </SectionCard>

        <SectionCard>
          <SectionCard.Header
            title={
              <span className="inline-flex items-center gap-2">
                <Target className="h-4 w-4 text-[#00c896]" />
                Milestone velocity
              </span>
            }
            description="Milestones completed per week (last 8 weeks)"
          />
          <SectionCard.Body>
            {seriesHasData(velocity, "completedCount") ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={velocity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf4" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar
                    dataKey="completedCount"
                    fill={CHART_SUCCESS}
                    name="Completed"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmpty message="No milestone completions in the last 8 weeks." />
            )}
          </SectionCard.Body>
        </SectionCard>
      </div>

      <SectionCard>
        <SectionCard.Header
          title={
            <span className="inline-flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Execution streaks
            </span>
          }
          description="Founders by current weekly-outcome streak length"
        />
        <SectionCard.Body>
          {seriesHasData(streakHist, "founderCount") ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={streakHist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf4" />
                <XAxis
                  dataKey="streakWeeks"
                  tick={{ fontSize: 11 }}
                  label={{
                    value: "Streak (weeks)",
                    position: "insideBottom",
                    offset: -4,
                    fontSize: 11,
                  }}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value) => [value, "Founders"]}
                  labelFormatter={(w) => `${w} week${w === 1 ? "" : "s"}`}
                />
                <Bar
                  dataKey="founderCount"
                  fill={CHART_PRIMARY}
                  name="Founders"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmpty message="No qualifying weekly outcomes yet." />
          )}
        </SectionCard.Body>
      </SectionCard>
    </div>
  );
}
