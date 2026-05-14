/**
 * COHORT ANALYTICS - Comprehensive metrics dashboard
 */
import React, { useState, useEffect } from "react";
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
import { unwrapData } from "../../utils/apiEnvelope";
import {
  StatTile,
  SectionCard,
  SectionHeader,
  BrandProgress,
  EmptyStateBlock,
} from "./_primitives";

const API_BASE = API_BASE_URL;

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
        { ...defaultOptions },
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

  return (
    <div className="space-y-4 font-body">
      <SectionHeader
        icon={BarChart3}
        title="Analytics &amp; Insights"
        description={
          typeof analytics.recentJoinsLast30Days === "number"
            ? `Key metrics across all ${analytics.cohortSize} active startups · ${analytics.recentJoinsLast30Days} joined in the last 30 days`
            : `Key metrics across all ${analytics.cohortSize} active startups`
        }
      />

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
          note="Logged this cycle"
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
            description="Total vs completed tasks across the cohort"
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
            description="Total vs completed milestones across the cohort"
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

      <SectionCard>
        <SectionCard.Header
          title={
            <span className="inline-flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Weekly Execution
            </span>
          }
          description="Outcome logging across the cohort"
        />
        <SectionCard.Body>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              <div className="font-heading text-[20px] font-bold text-[#00c896]">
                {aggregate.avgWeeklyOutcomesPerStartup}
              </div>
            </div>
          </div>
        </SectionCard.Body>
      </SectionCard>
    </div>
  );
}
