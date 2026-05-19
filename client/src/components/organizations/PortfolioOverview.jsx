/**
 * PORTFOLIO OVERVIEW - Visual health dashboard for all startups in cohort
 */
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/apiBase.js";
import { Button } from "../ui/button";
import {
  TrendingDown,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  Target,
  ListChecks,
  Users,
  Award,
} from "lucide-react";
import { unwrapData } from "../../utils/apiEnvelope";
import {
  StatTile,
  SectionCard,
  StatusBadge,
  ListRow,
  EmptyStateBlock,
  SectionHeader,
  BrandProgress,
} from "./_primitives";
import { cn } from "../ui/utils";

const API_BASE = API_BASE_URL;

const defaultOptions = {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
};

const STATUS_ICON = {
  healthy: CheckCircle2,
  warning: AlertTriangle,
  critical: TrendingDown,
};

const FACTOR_LABELS = {
  weeklyExecution: { label: "Execution", icon: Activity, max: 20 },
  taskCompletion: { label: "Tasks", icon: ListChecks, max: 25 },
  teamActivity: { label: "Team", icon: Users, max: 25 },
  milestoneProgress: { label: "Milestones", icon: Target, max: 30 },
};

function FilterButton({ active, onClick, children }) {
  return (
    <Button
      size="sm"
      onClick={onClick}
      className={cn(
        "h-9 rounded-input font-body text-[13px] font-medium transition-colors",
        active
          ? "bg-primary text-white shadow-[0_4px_16px_rgba(58,90,254,0.25)] hover:bg-primary-hover"
          : "border border-surface-border bg-white text-text-body hover:bg-primary-tint hover:text-primary",
      )}
    >
      {children}
    </Button>
  );
}

export default function PortfolioOverview({ cohortId, onViewStartup }) {
  const [portfolio, setPortfolio] = useState([]);
  const [cohortStats, setCohortStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    if (cohortId) {
      loadPortfolioHealth();
    }
  }, [cohortId]);

  const loadPortfolioHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${API_BASE}/cohorts/${cohortId}/portfolio-health`,
        { ...defaultOptions },
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch portfolio health: ${response.status}`);
      }
      const inner = unwrapData(await response.json());
      setPortfolio(inner.portfolio || []);
      setCohortStats(inner.cohortStats || null);
    } catch (err) {
      console.error("Error loading portfolio health:", err);
      setError(err instanceof Error ? err.message : "Failed to load portfolio");
      setPortfolio([]);
      setCohortStats(null);
    } finally {
      setLoading(false);
    }
  };

  const filteredPortfolio =
    filterStatus === "all"
      ? portfolio
      : portfolio.filter((s) => s.health.status === filterStatus);

  if (loading) {
    return (
      <SectionCard>
        <SectionCard.Body className="p-8 text-center">
          <div className="font-body text-[13px] text-text-muted animate-pulse">
            Loading portfolio...
          </div>
        </SectionCard.Body>
      </SectionCard>
    );
  }

  if (error) {
    return (
      <SectionCard>
        <SectionCard.Body className="p-8 text-center">
          <div className="font-body text-[13px] text-[#ff4f6b]">
            {"Error: "}
            {error}
          </div>
        </SectionCard.Body>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-4 font-body">
      <SectionHeader
        icon={BarChart3}
        title="Portfolio Health"
        description={
          cohortStats
            ? `Overall health metrics for ${cohortStats.total} startup${cohortStats.total === 1 ? "" : "s"}`
            : "Overall health metrics"
        }
      />

      {cohortStats && (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
          <StatTile
            tone="info"
            icon={Award}
            label="Avg Score"
            value={cohortStats.avgScore}
            note="Across cohort"
          />
          <StatTile
            tone="success"
            icon={CheckCircle2}
            label="Healthy"
            value={cohortStats.healthy}
            note="On track"
            onClick={() => setFilterStatus("healthy")}
          />
          <StatTile
            tone="warning"
            icon={AlertTriangle}
            label="Warning"
            value={cohortStats.warning}
            note="Needs check-in"
            onClick={() => setFilterStatus("warning")}
          />
          <StatTile
            tone="danger"
            icon={TrendingDown}
            label="Critical"
            value={cohortStats.critical}
            note="Intervene now"
            onClick={() => setFilterStatus("critical")}
          />
          <StatTile
            tone="info"
            icon={Activity}
            label="Total"
            value={cohortStats.total}
            note="In this cohort"
            onClick={() => setFilterStatus("all")}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <FilterButton
            active={filterStatus === "all"}
            onClick={() => setFilterStatus("all")}
          >
            All ({portfolio.length})
          </FilterButton>
          <FilterButton
            active={filterStatus === "healthy"}
            onClick={() => setFilterStatus("healthy")}
          >
            Healthy ({cohortStats?.healthy || 0})
          </FilterButton>
          <FilterButton
            active={filterStatus === "warning"}
            onClick={() => setFilterStatus("warning")}
          >
            Warning ({cohortStats?.warning || 0})
          </FilterButton>
          <FilterButton
            active={filterStatus === "critical"}
            onClick={() => setFilterStatus("critical")}
          >
            Critical ({cohortStats?.critical || 0})
          </FilterButton>
        </div>
        <div className="flex items-center gap-2">
          <FilterButton
            active={viewMode === "grid"}
            onClick={() => setViewMode("grid")}
          >
            Grid
          </FilterButton>
          <FilterButton
            active={viewMode === "list"}
            onClick={() => setViewMode("list")}
          >
            List
          </FilterButton>
        </div>
      </div>

      {filteredPortfolio.length === 0 ? (
        <SectionCard>
          <SectionCard.Body className="p-0">
            <EmptyStateBlock
              variant="centered"
              icon={BarChart3}
              tone="info"
              title="No startups found"
              description={
                filterStatus === "all"
                  ? "This cohort has no startups yet"
                  : `No startups with ${filterStatus} status`
              }
            />
          </SectionCard.Body>
        </SectionCard>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredPortfolio.map((startup) => (
            <SectionCard
              key={startup.founderId}
              interactive={true}
              onClick={() => onViewStartup(startup.founderId)}
            >
              <SectionCard.Header
                title={startup.startupName || "Unnamed Startup"}
                description={startup.founderName}
                action={
                  <StatusBadge
                    status={startup.health.status}
                    icon={STATUS_ICON[startup.health.status]}
                  />
                }
              />
              <SectionCard.Body>
                <div className="flex items-center justify-between">
                  <span className="font-body text-[12px] text-text-muted">
                    Health Score
                  </span>
                  <span className="font-heading text-[18px] font-bold text-text-heading">
                    {startup.health.score}
                  </span>
                </div>
                <BrandProgress
                  value={startup.health.score}
                  className="h-1.5 w-full"
                />
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {Object.entries(FACTOR_LABELS).map(([key, meta]) => {
                    const Icon = meta.icon;
                    return (
                      <div
                        key={key}
                        className="flex items-center gap-2 rounded-input bg-surface-page px-2.5 py-2"
                      >
                        <Icon className="h-3.5 w-3.5 text-text-muted" />
                        <div className="min-w-0">
                          <div className="font-body text-[12px] text-text-muted leading-tight">
                            {meta.label}
                          </div>
                          <div className="font-heading text-[13px] font-semibold text-text-heading leading-tight">
                            {startup.health.factors[key]}
                            <span className="text-text-muted font-normal">
                              /{meta.max}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-full rounded-input font-body text-[13px] font-medium text-primary hover:bg-primary-tint"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewStartup(startup.founderId);
                  }}
                >
                  View Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </SectionCard.Body>
            </SectionCard>
          ))}
        </div>
      ) : (
        <SectionCard>
          <SectionCard.Body className="p-3">
            <div className="space-y-2">
              {filteredPortfolio.map((startup) => (
                <ListRow
                  key={startup.founderId}
                  onClick={() => onViewStartup(startup.founderId)}
                  title={startup.startupName || "Unnamed Startup"}
                  description={startup.founderName}
                  meta={
                    <>
                      <StatusBadge
                        status={startup.health.status}
                        icon={STATUS_ICON[startup.health.status]}
                      />
                      <span className="inline-flex items-center gap-1 font-body text-[12px] text-text-muted">
                        <Award className="h-3.5 w-3.5" />
                        Score {startup.health.score}
                      </span>
                    </>
                  }
                  trailing={
                    <>
                      <div className="hidden md:flex items-center gap-3 font-body text-[12px] text-text-muted">
                        {Object.entries(FACTOR_LABELS).map(([key, meta]) => (
                          <div key={key} className="text-center">
                            <div className="font-heading text-[13px] font-semibold text-text-heading leading-tight">
                              {startup.health.factors[key]}
                              <span className="text-text-muted font-normal">
                                /{meta.max}
                              </span>
                            </div>
                            <div className="leading-tight">{meta.label}</div>
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 rounded-input p-0 text-primary hover:bg-primary-tint"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewStartup(startup.founderId);
                        }}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </>
                  }
                />
              ))}
            </div>
          </SectionCard.Body>
        </SectionCard>
      )}
    </div>
  );
}
