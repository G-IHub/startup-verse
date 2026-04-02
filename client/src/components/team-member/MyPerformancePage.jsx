import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import ExecutionHistoryCard from "../talent/ExecutionHistoryCard";
import CompensationStatusCard from "../compensation/CompensationStatusCard";
import {
  Award,
  TrendingUp,
  Target,
  Flame,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Zap,
  Calendar,
} from "lucide-react";
import * as compensationApi from "../../utils/api/compensationApi";
import * as performanceApi from "../../utils/api/performanceApi";
import { useOfflineDetection } from "../../hooks/useOfflineDetection";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
export default function MyPerformancePage({ user }) {
  const [compensationStatus, setCompensationStatus] = useState(null);
  const [compensationContract, setCompensationContract] = useState(null);
  const [isLoadingCompensation, setIsLoadingCompensation] = useState(true);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(true);
  const { isOnline, isOffline } = useOfflineDetection();
  const loadCompensationData = async () => {
    if (!user.id) return;
    setIsLoadingCompensation(true);
    try {
      const result = await compensationApi.getCompensationStatus(user.id);
      if (result.success && result.status) {
        setCompensationStatus(result.status);
        setCompensationContract(result.contract);
        console.log("✅ Compensation status loaded:", result.status);
      } else {
        console.log("ℹ️ No compensation contract found for user");
        setCompensationStatus(null);
        setCompensationContract(null);
      }
    } catch (error) {
      console.error("❌ Failed to load compensation status:", error);
    } finally {
      setIsLoadingCompensation(false);
    }
  };
  const loadPerformanceMetrics = async () => {
    if (!user.id) return;
    setIsLoadingPerformance(true);
    try {
      const metrics = await performanceApi.getPerformanceMetrics(user.id);
      setPerformanceMetrics(metrics);
      console.log("✅ Performance metrics loaded from backend (cached)");
    } catch (error) {
      console.error("❌ Failed to load performance metrics:", error);
      // Fallback to empty state
      setPerformanceMetrics(null);
    } finally {
      setIsLoadingPerformance(false);
    }
  };
  useEffect(() => {
    loadCompensationData();
    loadPerformanceMetrics();
  }, [user.id, isOnline]); // Reload when connection status changes

  // Block page if no compensation
  if (isLoadingCompensation) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }
  if (!compensationContract) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-500" />
            </div>
            <CardTitle className="text-center text-amber-900 dark:text-amber-100">
              Performance Dashboard Locked
            </CardTitle>
            <CardDescription className="text-center text-amber-700 dark:text-amber-300">
              Your founder needs to set up your compensation package before you
              can access performance tracking.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-amber-100/50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>What's happening:</strong>
                {
                  " Your founder is currently setting up your compensation details. Once complete, you'll get full access to:"
                }
              </p>
              <ul className="mt-2 ml-4 list-disc text-sm text-amber-700 dark:text-amber-300 space-y-1">
                <li>Performance metrics and tracking</li>
                <li>Task completion rates</li>
                <li>Compensation progress (equity vesting, payments)</li>
                <li>Core Engine execution history</li>
              </ul>
            </div>
            <p className="text-xs text-center text-amber-600 dark:text-amber-400">
              You'll be notified once your compensation is set up.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="p-2 md:p-3 space-y-2 md:space-y-2.5">
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">My Performance</h1>
              <p className="text-sm text-muted-foreground">
                Track your execution history, score, and reputation across all
                startups
              </p>
            </div>
          </div>
          <Dialog>
            <DialogTrigger asChild={true}>
              <Button variant="outline" size="sm" className="gap-2">
                <HelpCircle className="w-4 h-4" />
                Performance Guide
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Performance Guide
                </DialogTitle>
                <DialogDescription>
                  Learn how to improve your score and understand tier levels
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 mt-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    How to Improve Your Score
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 border rounded-lg bg-card">
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1 text-sm">
                            Complete Tasks Consistently
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {"Accounts for "}
                            <strong>40%</strong>
                            {
                              " of your score. Finish assigned tasks to maximize this."
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg bg-card">
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1 text-sm">
                            Minimize Blockers
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {"Low blocker rate = "}
                            <strong>20%</strong>
                            {" of score. Only block when truly necessary."}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg bg-card">
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Flame className="w-4 h-4 text-orange-500" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1 text-sm">
                            Maintain Your Streak
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {"Worth "}
                            <strong>20%</strong>. Complete tasks every week to
                            keep streak alive.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg bg-card">
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Target className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1 text-sm">
                            Build Task Volume
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {"Adds "}
                            <strong>20%</strong>
                            {
                              " to score. Take on more tasks to increase volume."
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2 text-sm">
                      Score Calculation Formula
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Completion Rate
                        </span>
                        <span className="font-mono font-semibold">× 40%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          (100 - Blocker Rate)
                        </span>
                        <span className="font-mono font-semibold">× 20%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Log(Task Volume)
                        </span>
                        <span className="font-mono font-semibold">× 20%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Current Streak
                        </span>
                        <span className="font-mono font-semibold">× 20%</span>
                      </div>
                      <div className="border-t pt-1.5 mt-1.5 flex items-center justify-between font-semibold">
                        <span>Your Execution Score</span>
                        <span className="font-mono text-base text-primary">
                          0-100
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Score Tiers</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    What your Execution Score means
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2.5 border rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
                      <div className="text-xl">🏆</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            Exceptional Contributor
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            85-100
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Top-tier execution. Highly reliable and consistent.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 border rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
                      <div className="text-xl">⭐</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            Strong Contributor
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            70-84
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Reliable execution with solid track record.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 border rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                      <div className="text-xl">✨</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            Active Contributor
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            50-69
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Regular participation and growing consistency.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 border rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-200 dark:border-yellow-800">
                      <div className="text-xl">🌱</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            Emerging Contributor
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            25-49
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Building momentum and track record.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 border rounded-lg bg-muted/50">
                      <div className="text-xl">🎯</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            New to Platform
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            0-24
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Just getting started. Complete tasks to increase your
                          score!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <ExecutionHistoryCard
        userId={user.id}
        userName={user.name}
        founderId={undefined}
        compact={false}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-2.5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Performance Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Completion Rate
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {compensationStatus?.performance?.completionRate || 0}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Blocker Rate
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {compensationStatus?.performance?.blockerRate || 0}%
                </p>
                {compensationStatus?.performance?.blockerRate >= 25 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    High blocker rate - may need support
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t">
              <div className="p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                <p className="text-xs text-muted-foreground mb-1">
                  Avg. Completion Time
                </p>
                <p className="text-lg font-bold">34h</p>
              </div>
              <div className="p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                <p className="text-xs text-muted-foreground mb-1">
                  Total Tasks
                </p>
                <p className="text-lg font-bold">
                  {compensationStatus?.performance?.totalTasks || 0}
                </p>
              </div>
              <div className="p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                <p className="text-xs text-muted-foreground mb-1">
                  Longest Streak
                </p>
                <p className="text-lg font-bold">1 week</p>
              </div>
              <div className="p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                <p className="text-xs text-muted-foreground mb-1">
                  Last Activity
                </p>
                <p className="text-lg font-bold">
                  {new Date().toLocaleDateString("en-GB")}
                </p>
              </div>
            </div>
            {performanceMetrics?.contributionGraph.length > 0 &&
              (() => {
                // Calculate maxTasks once outside the map
                const maxTasks = Math.max(
                  ...performanceMetrics.contributionGraph.map(
                    (w) => w.tasksCompleted,
                  ),
                );
                return (
                  <div className="pt-3 border-t">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        Activity Last 12 Weeks
                      </p>
                    </div>
                    <div className="flex items-end gap-1 h-24">
                      {performanceMetrics.contributionGraph.map((week) => {
                        const height =
                          maxTasks > 0
                            ? (week.tasksCompleted / maxTasks) * 100
                            : 0;
                        return (
                          <div
                            key={week.weekId}
                            className="flex-1 group relative"
                          >
                            <div
                              className={`w-full rounded-t transition-all ${week.tasksCompleted > 0 ? "bg-green-500 hover:bg-green-600" : "bg-gray-200 dark:bg-gray-700"}`}
                              style={{
                                height: `${height}%`,
                              }}
                            />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                              <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                                <p className="font-medium">{week.weekLabel}</p>
                                <p>
                                  {week.tasksCompleted}
                                  {" completed"}
                                </p>
                                <p className="text-gray-400">
                                  {week.tasksAssigned}
                                  {" assigned"}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>12 weeks ago</span>
                      <span>Today</span>
                    </div>
                  </div>
                );
              })()}
          </CardContent>
        </Card>
        <CompensationStatusCard
          status={compensationStatus}
          contract={compensationContract}
        />
      </div>
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                Build Your Portable Reputation
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Your Execution Score and history follow you across startups.
                Complete tasks consistently to build a strong track record that
                founders can see when you apply to new opportunities.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
