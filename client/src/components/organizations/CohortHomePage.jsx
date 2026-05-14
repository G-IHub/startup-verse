/**
 * COHORT HOME PAGE
 * Overview dashboard showing key metrics and quick actions.
 *
 * Visual language matches Talent / Founder / Team-mate dashboards via the
 * shared primitives in ./_primitives (GradientHero, StatTile, SectionCard,
 * StatusBadge, BrandProgress).
 */
import React from "react";
import {
  GradientHero,
  StatTile,
  SectionCard,
  StatusBadge,
  BrandProgress,
} from "./_primitives";
import { Button } from "../ui/button";
import { getFirstName } from "../../utils/nameHelpers";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  Target,
  Calendar,
  ArrowRight,
  CheckCircle2,
  UserPlus,
  Plus,
} from "lucide-react";

const HEALTH_STATUS = {
  excellent: { key: "excellent", label: "Excellent", tone: "success" },
  good: { key: "good", label: "Good", tone: "info" },
  "needs-attention": {
    key: "needs-attention",
    label: "Needs Attention",
    tone: "warning",
  },
  critical: { key: "critical", label: "Critical", tone: "danger" },
};

function resolveHealthStatus(healthPercentage) {
  if (healthPercentage >= 80) return HEALTH_STATUS.excellent;
  if (healthPercentage >= 60) return HEALTH_STATUS.good;
  if (healthPercentage >= 40) return HEALTH_STATUS["needs-attention"];
  return HEALTH_STATUS.critical;
}

const ACTION_TONE_CLASSES = {
  info: "bg-[#e8ebff] text-[#3a5afe]",
  success: "bg-[#d1fae5] text-[#00c896]",
  warning: "bg-[#fef3c7] text-[#ffb300]",
  danger: "bg-[#fff1f2] text-[#ff4f6b]",
  accent: "bg-accent-tint text-accent",
};

function ActionPanel({
  icon: Icon,
  tone = "info",
  title,
  description,
  cta,
  ctaIcon: CtaIcon = ArrowRight,
  emphasis = "ghost",
  onClick,
}) {
  const discClasses = ACTION_TONE_CLASSES[tone] || ACTION_TONE_CLASSES.info;
  return (
    <SectionCard
      interactive={true}
      onClick={onClick}
      className="group"
    >
      <div className="flex items-center gap-3 p-3 sm:p-4">
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-input ${discClasses}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-[14px] font-semibold text-text-heading">
            {title}
          </h3>
          <p className="mt-0.5 font-body text-[12px] text-text-muted">
            {description}
          </p>
        </div>
        {emphasis === "primary" ? (
          <Button
            size="sm"
            className="h-9 flex-shrink-0 rounded-input bg-primary px-3 font-body text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.20)] hover:bg-primary-hover"
            onClick={(event) => {
              event.stopPropagation();
              if (onClick) onClick();
            }}
          >
            {cta}
            <CtaIcon className="ml-1.5 h-4 w-4" />
          </Button>
        ) : (
          <span
            aria-hidden="true"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-surface-page text-primary transition-colors duration-150 ease-in-out group-hover:bg-primary-tint"
          >
            <CtaIcon className="h-4 w-4" />
          </span>
        )}
      </div>
    </SectionCard>
  );
}

function QuickStatRow({ label, value, tone }) {
  const toneClasses = {
    success: "text-[#00c896]",
    warning: "text-[#ffb300]",
    danger: "text-[#ff4f6b]",
    primary: "text-primary",
    info: "text-text-heading",
  };
  return (
    <div className="flex items-center justify-between gap-3 font-body text-[13px]">
      <span className="font-medium text-text-body">{label}</span>
      <span
        className={`font-body font-bold ${
          toneClasses[tone] || toneClasses.info
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function CohortHomePage({
  cohort,
  onNavigate,
  onInviteClick,
  isAdmin,
  organizationName,
  organizationType,
  userName,
  onBack,
}) {
  const stats = cohort.stats || {
    totalStartups: 0,
    activeStartups: 0,
    slowingStartups: 0,
    stalledStartups: 0,
  };

  const healthPercentage =
    stats.totalStartups > 0
      ? Math.round((stats.activeStartups / stats.totalStartups) * 100)
      : 0;

  const healthStatus = resolveHealthStatus(healthPercentage);

  const greetingName = userName ? getFirstName(userName) : null;
  const heroTitle = greetingName
    ? `Welcome back, ${greetingName}`
    : "Cohort overview";

  const heroSubtitle =
    stats.totalStartups > 0
      ? `${stats.totalStartups} startup${
          stats.totalStartups === 1 ? "" : "s"
        } in ${cohort.name} — ${stats.activeStartups} on pace`
      : `${cohort.name} is ready for its first startups`;

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const heroActions = [];
  if (isAdmin && onInviteClick) {
    heroActions.push({
      label: "Invite Startup",
      icon: Plus,
      variant: "glass",
      onClick: onInviteClick,
    });
  }
  heroActions.push({
    label: "View Portfolio",
    icon: ArrowRight,
    variant: "glass",
    onClick: () => onNavigate("portfolio"),
  });

  const activeRate =
    stats.totalStartups > 0
      ? Math.round((stats.activeStartups / stats.totalStartups) * 100)
      : 0;

  const needsAttentionCount =
    (stats.slowingStartups || 0) + (stats.stalledStartups || 0);

  return (
    <div className="space-y-4 font-body">
      <GradientHero
        eyebrow={todayLabel}
        title={heroTitle}
        subtitle={heroSubtitle}
        icon={Activity}
        actions={heroActions}
      />

      <SectionCard>
        <SectionCard.Header
          title="Cohort Health Score"
          description="Overall portfolio performance"
          action={
            <span className="font-body text-[13px] font-medium text-text-muted">
              {stats.activeStartups}
              {" of "}
              {stats.totalStartups}
              {" active"}
            </span>
          }
        />
        <SectionCard.Body>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="font-heading text-[32px] font-extrabold leading-none text-text-heading">
                {healthPercentage}
                <span>%</span>
              </div>
              <StatusBadge
                status={healthStatus.key}
                label={healthStatus.label}
              />
            </div>
            <BrandProgress
              value={healthPercentage}
              tone={
                healthStatus.tone === "danger"
                  ? "danger"
                  : healthStatus.tone === "warning"
                    ? "warning"
                    : healthStatus.tone === "success"
                      ? "success"
                      : "brand"
              }
              className="h-1.5 w-full"
            />
            {(stats.slowingStartups > 0 || stats.stalledStartups > 0) && (
              <div className="flex flex-wrap items-center gap-3">
                {stats.slowingStartups > 0 && (
                  <span className="inline-flex items-center gap-1 font-body text-[12px] text-[#ffb300]">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {stats.slowingStartups}
                    {" slowing"}
                  </span>
                )}
                {stats.stalledStartups > 0 && (
                  <span className="inline-flex items-center gap-1 font-body text-[12px] text-[#ff4f6b]">
                    <TrendingDown className="h-3.5 w-3.5" />
                    {stats.stalledStartups}
                    {" stalled"}
                  </span>
                )}
              </div>
            )}
          </div>
        </SectionCard.Body>
      </SectionCard>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          tone="info"
          icon={Activity}
          label="Total Startups"
          value={stats.totalStartups}
          note="In this cohort"
          onClick={() => onNavigate("portfolio")}
        />
        <StatTile
          tone="success"
          icon={TrendingUp}
          label="Active"
          value={stats.activeStartups}
          note="Hitting cadence"
          onClick={() => onNavigate("portfolio")}
        />
        <StatTile
          tone="warning"
          icon={AlertTriangle}
          label="Slowing"
          value={stats.slowingStartups}
          note="Needs check-in"
          onClick={() => onNavigate("portfolio")}
        />
        <StatTile
          tone="danger"
          icon={TrendingDown}
          label="Stalled"
          value={stats.stalledStartups}
          note="Intervene now"
          onClick={() => onNavigate("portfolio")}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <ActionPanel
          icon={Activity}
          tone="info"
          title="View Portfolio"
          description="See all startups and their execution health"
          cta="Open Portfolio"
          onClick={() => onNavigate("portfolio")}
        />
        <ActionPanel
          icon={Target}
          tone="accent"
          title="Analytics Dashboard"
          description="Deep insights and performance metrics"
          cta="View Analytics"
          onClick={() => onNavigate("analytics")}
        />
        <ActionPanel
          icon={CheckCircle2}
          tone="success"
          title="Program Milestones"
          description="Track cohort-wide milestones and goals"
          cta="Manage Milestones"
          onClick={() => onNavigate("milestones")}
        />
        <ActionPanel
          icon={Calendar}
          tone="info"
          title="Upcoming Events"
          description="Schedule workshops, demo days, and more"
          cta="View Calendar"
          onClick={() => onNavigate("events")}
        />
        {isAdmin && onInviteClick && (
          <ActionPanel
            icon={UserPlus}
            tone="info"
            title="Invite Startup"
            description="Add new startups to this cohort"
            cta="Send Invitation"
            emphasis="primary"
            onClick={onInviteClick}
          />
        )}
      </div>

      <SectionCard>
        <SectionCard.Header title="Quick Stats" />
        <SectionCard.Body>
          <div className="divide-y divide-surface-border">
            <div className="py-2 first:pt-0 last:pb-0">
              <QuickStatRow
                label="Avg Health Score"
                value={`${healthPercentage}%`}
              />
            </div>
            <div className="py-2 first:pt-0 last:pb-0">
              <QuickStatRow
                label="Active Rate"
                value={`${activeRate}%`}
                tone="primary"
              />
            </div>
            {needsAttentionCount > 0 && (
              <div className="py-2 first:pt-0 last:pb-0">
                <QuickStatRow
                  label="Needs Attention"
                  value={`${needsAttentionCount} startups`}
                  tone="warning"
                />
              </div>
            )}
          </div>
        </SectionCard.Body>
      </SectionCard>
    </div>
  );
}
