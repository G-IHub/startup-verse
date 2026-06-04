/**
 * EXECUTION SCORE WIDGET
 * Shows founder's execution score (0-100) with percentile ranking
 */
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config/apiBase.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Info,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Progress } from "./ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

// Default fetch options for cookie-based auth

const defaultOptions = {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
};

export default function ExecutionScore({
  userId,
  variant = "full",
  showDetails = true,
}) {
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  useEffect(() => {
    loadExecutionScore();
  }, [userId]);
  const loadExecutionScore = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${API_BASE_URL}/execution-score/${userId}`,
        {
          ...defaultOptions,
        },
      );
      if (!response.ok) {
        throw new Error("Failed to fetch execution score");
      }
      const data = await response.json();
      setScoreData(data);
    } catch (err) {
      console.error("Error loading execution score:", err);
      setError(err instanceof Error ? err.message : "Failed to load score");
    } finally {
      setLoading(false);
    }
  };
  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-primary";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };
  const getScoreBgColor = (score) => {
    if (score >= 80) return "bg-green-500/10";
    if (score >= 60) return "bg-primary/10";
    if (score >= 40) return "bg-yellow-500/10";
    return "bg-red-500/10";
  };
  const getPercentileMessage = (percentile) => {
    if (percentile >= 90) return "Top 10% • Elite Executor";
    if (percentile >= 75) return "Top 25% • Strong Executor";
    if (percentile >= 50) return "Top 50% • Above Average";
    if (percentile >= 25) return "Top 75% • Building Momentum";
    return "Bottom 25% • Room to Grow";
  };
  if (loading) {
    return (
      <Card className={variant === "compact" ? "" : "border-2"}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }
  if (error || !scoreData) {
    return (
      <Card className={variant === "compact" ? "" : "border-2"}>
        <CardContent className="p-6 text-center">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Complete your first week to see your Execution Score
          </p>
        </CardContent>
      </Card>
    );
  }

  // Compact variant for sidebar/dashboard widget
  if (variant === "compact") {
    return (
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Execution Score
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">
                    Measures your weekly execution consistency, outcome quality,
                    and progress
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex items-end gap-3 mb-2">
            <div
              className={`text-4xl font-bold ${getScoreColor(scoreData.score)}`}
            >
              {scoreData.score}
              <span className="text-lg text-muted-foreground">/100</span>
            </div>
            {scoreData.weeklyChange !== 0 && (
              <div
                className={`flex items-center gap-1 text-sm ${scoreData.weeklyChange > 0 ? "text-green-600" : "text-red-600"}`}
              >
                {scoreData.weeklyChange > 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>
                  {scoreData.weeklyChange > 0 ? "+" : ""}
                  {scoreData.weeklyChange}
                </span>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            {getPercentileMessage(scoreData.percentile)}
          </p>
          {showBreakdown && (
            <div className="space-y-3 mt-4 pt-4 border-t border-border">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">
                    Weekly Completion
                  </span>
                  <span className="text-xs font-medium">
                    {scoreData.breakdown.weeklyCompletion}/100
                  </span>
                </div>
                <Progress
                  value={scoreData.breakdown.weeklyCompletion}
                  className="h-1.5"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">
                    Outcome Quality
                  </span>
                  <span className="text-xs font-medium">
                    {scoreData.breakdown.outcomeQuality}/100
                  </span>
                </div>
                <Progress
                  value={scoreData.breakdown.outcomeQuality}
                  className="h-1.5"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">
                    Consistency
                  </span>
                  <span className="text-xs font-medium">
                    {scoreData.breakdown.consistency}/100
                  </span>
                </div>
                <Progress
                  value={scoreData.breakdown.consistency}
                  className="h-1.5"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">
                    Progression
                  </span>
                  <span className="text-xs font-medium">
                    {scoreData.breakdown.progression}/100
                  </span>
                </div>
                <Progress
                  value={scoreData.breakdown.progression}
                  className="h-1.5"
                />
              </div>
            </div>
          )}
          {showDetails && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs mt-2"
              onClick={() => setShowBreakdown(!showBreakdown)}
            >
              {showBreakdown ? "Hide" : "View"}
              {" Breakdown"}
              <ChevronRight
                className={`w-3 h-3 ml-1 transition-transform ${showBreakdown ? "rotate-90" : ""}`}
              />
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full variant with detailed breakdown
  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-primary" />
              Your Execution Score
            </CardTitle>
            <CardDescription>
              {scoreData.cohort
                ? `12-Week Challenge • ${scoreData.cohort}`
                : "Benchmarked against founders at your stage"}
            </CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Your Execution Score measures how consistently and effectively
                  you execute weekly. It's calculated from completion rates,
                  outcome quality, consistency, and stage progression.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className={`p-6 rounded-lg ${getScoreBgColor(scoreData.score)}`}>
          <div className="flex items-end gap-4 mb-2">
            <div
              className={`text-6xl font-bold ${getScoreColor(scoreData.score)}`}
            >
              {scoreData.score}
              <span className="text-2xl text-muted-foreground">/100</span>
            </div>
            {scoreData.weeklyChange !== 0 && (
              <div
                className={`flex items-center gap-1 mb-2 ${scoreData.weeklyChange > 0 ? "text-green-600" : "text-red-600"}`}
              >
                {scoreData.weeklyChange > 0 ? (
                  <TrendingUp className="w-5 h-5" />
                ) : (
                  <TrendingDown className="w-5 h-5" />
                )}
                <span className="text-lg font-semibold">
                  {scoreData.weeklyChange > 0 ? "+" : ""}
                  {scoreData.weeklyChange}
                </span>
                <span className="text-sm">this week</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={scoreData.percentile >= 75 ? "default" : "secondary"}
              className="text-xs"
            >
              {getPercentileMessage(scoreData.percentile)}
            </Badge>
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Score Breakdown</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">
                  Weekly Completion (40%)
                </span>
                <span className="text-sm font-medium">
                  {scoreData.breakdown.weeklyCompletion}/100
                </span>
              </div>
              <Progress
                value={scoreData.breakdown.weeklyCompletion}
                className="h-2"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">
                  Outcome Quality (30%)
                </span>
                <span className="text-sm font-medium">
                  {scoreData.breakdown.outcomeQuality}/100
                </span>
              </div>
              <Progress
                value={scoreData.breakdown.outcomeQuality}
                className="h-2"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">
                  Consistency (20%)
                </span>
                <span className="text-sm font-medium">
                  {scoreData.breakdown.consistency}/100
                </span>
              </div>
              <Progress
                value={scoreData.breakdown.consistency}
                className="h-2"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">
                  Stage Progression (10%)
                </span>
                <span className="text-sm font-medium">
                  {scoreData.breakdown.progression}/100
                </span>
              </div>
              <Progress
                value={scoreData.breakdown.progression}
                className="h-2"
              />
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {scoreData.strengths.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-green-600">
                <Award className="w-4 h-4" />
                Strengths
              </h4>
              <ul className="space-y-1">
                {scoreData.strengths.map((strength, index) => (
                  <li
                    key={index}
                    className="text-xs text-muted-foreground flex items-start gap-2"
                  >
                    <span className="text-green-600 mt-0.5">
                      ✓
                    </span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {scoreData.improvements.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-yellow-600">
                <TrendingUp className="w-4 h-4" />
                Areas to Improve
              </h4>
              <ul className="space-y-1">
                {scoreData.improvements.map((improvement, index) => (
                  <li
                    key={index}
                    className="text-xs text-muted-foreground flex items-start gap-2"
                  >
                    <span className="text-yellow-600 mt-0.5">
                      →
                    </span>
                    {improvement}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {scoreData.percentile >= 90 && (
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-start gap-3">
              <Award className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold mb-1">
                  You're in the Top 10%!
                </h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Keep this up through Week 12 to qualify for featured placement
                  and investor intros.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
