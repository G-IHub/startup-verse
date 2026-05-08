/**
 * PORTFOLIO OVERVIEW - Visual health dashboard for all startups in cohort
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
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  TrendingDown,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import { unwrapData } from "../../utils/apiEnvelope";

const API_BASE = API_BASE_URL;

// Default fetch options for cookie-based auth

const defaultOptions = {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
};

export default function PortfolioOverview({ cohortId, onViewStartup }) {
  const [portfolio, setPortfolio] = useState([]);
  const [cohortStats, setCohortStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [filterStatus, setFilterStatus] = useState("all");
  useEffect(() => {
    // Only load if cohortId exists
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
        {
          ...defaultOptions,
        },
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch portfolio health: ${response.status}`);
      }
      const inner = unwrapData(await response.json());
      setPortfolio(inner.portfolio || []);
      setCohortStats(inner.cohortStats || null);
    } catch (error) {
      console.error("Error loading portfolio health:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load portfolio",
      );
      // Set empty data instead of leaving it undefined
      setPortfolio([]);
      setCohortStats(null);
    } finally {
      setLoading(false);
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "healthy":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
      case "warning":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
      case "critical":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
    }
  };
  const getStatusIcon = (status) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="w-4 h-4" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4" />;
      case "critical":
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };
  const filteredPortfolio =
    filterStatus === "all"
      ? portfolio
      : portfolio.filter((s) => s.health.status === filterStatus);
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-pulse">Loading portfolio...</div>
        </CardContent>
      </Card>
    );
  }
  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-red-500">
            {"Error: "}
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      {cohortStats && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[11px]">Portfolio Health</CardTitle>
            <CardDescription className="text-[9px]">
              {"Overall health metrics for "}
              {cohortStats.total}
              {" startups"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="text-center">
                <div className="text-[20px] font-bold text-primary">
                  {cohortStats.avgScore}
                </div>
                <div className="text-[9px] text-muted-foreground">
                  Avg Score
                </div>
              </div>
              <div className="text-center">
                <div className="text-[20px] font-bold text-green-600">
                  {cohortStats.healthy}
                </div>
                <div className="text-[9px] text-muted-foreground">Healthy</div>
              </div>
              <div className="text-center">
                <div className="text-[20px] font-bold text-yellow-600">
                  {cohortStats.warning}
                </div>
                <div className="text-[9px] text-muted-foreground">Warning</div>
              </div>
              <div className="text-center">
                <div className="text-[20px] font-bold text-red-600">
                  {cohortStats.critical}
                </div>
                <div className="text-[9px] text-muted-foreground">Critical</div>
              </div>
              <div className="text-center">
                <div className="text-[20px] font-bold text-gray-600">
                  {cohortStats.total}
                </div>
                <div className="text-[9px] text-muted-foreground">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("all")}
            className="h-6 text-[9px]"
          >
            All ({portfolio.length})
          </Button>
          <Button
            variant={filterStatus === "healthy" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("healthy")}
            className="h-6 text-[9px]"
          >
            Healthy ({cohortStats?.healthy || 0})
          </Button>
          <Button
            variant={filterStatus === "warning" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("warning")}
            className="h-6 text-[9px]"
          >
            Warning ({cohortStats?.warning || 0})
          </Button>
          <Button
            variant={filterStatus === "critical" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("critical")}
            className="h-6 text-[9px]"
          >
            Critical ({cohortStats?.critical || 0})
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="h-6 text-[9px]"
          >
            Grid
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="h-6 text-[9px]"
          >
            List
          </Button>
        </div>
      </div>
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredPortfolio.map((startup) => (
            <Card
              key={startup.founderId}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onViewStartup(startup.founderId)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-[10px] truncate">
                      {startup.startupName || "Unnamed Startup"}
                    </CardTitle>
                    <CardDescription className="text-[8px] truncate">
                      {startup.founderName}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[7px] ml-2 ${getStatusColor(startup.health.status)}`}
                  >
                    {getStatusIcon(startup.health.status)}
                    <span className="ml-1">{startup.health.status}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-muted-foreground">
                    Health Score
                  </span>
                  <span className="text-[14px] font-bold">
                    {startup.health.score}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${startup.health.status === "healthy" ? "bg-green-500" : startup.health.status === "warning" ? "bg-yellow-500" : "bg-red-500"}`}
                    style={{
                      width: `${startup.health.score}%`,
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[8px]">
                  <div>
                    <div className="text-muted-foreground">Execution</div>
                    <div className="font-medium">
                      {startup.health.factors.weeklyExecution}/30
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Tasks</div>
                    <div className="font-medium">
                      {startup.health.factors.taskCompletion}/25
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Team</div>
                    <div className="font-medium">
                      {startup.health.factors.teamActivity}/25
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Milestones</div>
                    <div className="font-medium">
                      {startup.health.factors.milestoneProgress}/20
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-6 text-[9px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewStartup(startup.founderId);
                  }}
                >
                  {"View Details "}
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filteredPortfolio.map((startup) => (
                <div
                  key={startup.founderId}
                  className="p-3 hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => onViewStartup(startup.founderId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium truncate">
                          {startup.startupName || "Unnamed Startup"}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[7px] ${getStatusColor(startup.health.status)}`}
                        >
                          {startup.health.status}
                        </Badge>
                      </div>
                      <div className="text-[8px] text-muted-foreground truncate">
                        {startup.founderName}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-[8px]">
                      <div className="text-center">
                        <div className="font-bold text-[12px]">
                          {startup.health.score}
                        </div>
                        <div className="text-muted-foreground">Score</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">
                          {startup.health.factors.weeklyExecution}/30
                        </div>
                        <div className="text-muted-foreground">Exec</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">
                          {startup.health.factors.taskCompletion}/25
                        </div>
                        <div className="text-muted-foreground">Tasks</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">
                          {startup.health.factors.teamActivity}/25
                        </div>
                        <div className="text-muted-foreground">Team</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">
                          {startup.health.factors.milestoneProgress}/20
                        </div>
                        <div className="text-muted-foreground">Miles</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[9px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewStartup(startup.founderId);
                        }}
                      >
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {filteredPortfolio.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-[10px] text-muted-foreground">
              {"No startups found with "}
              {filterStatus}
              {" status"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
