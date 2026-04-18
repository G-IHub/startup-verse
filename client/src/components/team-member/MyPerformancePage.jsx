import React from "react";
import {
  Activity,
  AlertCircle,
  Award,
  CheckCircle2,
  Flame,
  Loader2,
  ShieldAlert,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { useTeamMemberPerformanceData } from "../../domains/team-member/hooks/useTeamMemberPerformanceData";

function momentumTone(tone) {
  if (tone === "strong") {
    return "border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/20 dark:text-green-200";
  }
  if (tone === "steady") {
    return "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/20 dark:text-blue-200";
  }
  return "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-200";
}

function formatDate(value) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function MyPerformancePage({ user }) {
  const {
    loadingMetrics,
    error,
    hasPerformanceContract,
    usedFallback,
    viewModel,
  } = useTeamMemberPerformanceData({ user });

  return (
    <div className="space-y-4 py-4 pb-20">
      <section className="rounded-2xl border border-blue-700/20 bg-blue-600 p-5 text-white">
        <div className="space-y-1">
          <p className="text-sm text-blue-100">Team member performance</p>
          <h2 className="text-2xl font-semibold text-white">Execution quality and delivery momentum</h2>
          <p className="text-sm text-blue-100">
            Track completion, blocker pressure, streak health, and compensation readiness.
          </p>
        </div>
      </section>

      {error ? (
        <Card className="border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="flex items-start gap-2 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
            <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
          </CardContent>
        </Card>
      ) : null}

      {!loadingMetrics && !hasPerformanceContract ? (
        <Card className="border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="flex items-start gap-2 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Live performance contract data is unavailable right now. The page is using task-driven fallback metrics.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {loadingMetrics ? (
        <Card>
          <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading performance metrics
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completion Rate</CardDescription>
            <CardTitle className="text-3xl">{viewModel.completionRate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={viewModel.completionRate} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Blocker Pressure</CardDescription>
            <CardTitle className="text-3xl">{viewModel.blockerRate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {viewModel.blockedCount} blocked of {viewModel.totalTasks} total tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Execution Streak</CardDescription>
            <CardTitle className="text-3xl">{viewModel.streak}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Consecutive active completion days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed This Week</CardDescription>
            <CardTitle className="text-3xl">{viewModel.weeklyCompleted}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Weekly delivery signal</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Performance Breakdown
            </CardTitle>
            <CardDescription>Key indicators that influence your contribution quality.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-3">
                <div className="mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-semibold">Completed Tasks</p>
                </div>
                <p className="text-2xl font-semibold text-foreground">{viewModel.completedTasks}</p>
                <p className="text-sm text-muted-foreground">Across {viewModel.totalTasks} assigned tasks</p>
              </div>

              <div className="rounded-xl border border-border bg-card p-3">
                <div className="mb-2 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-red-600" />
                  <p className="text-sm font-semibold">Blocked Tasks</p>
                </div>
                <p className="text-2xl font-semibold text-foreground">{viewModel.blockedCount}</p>
                <p className="text-sm text-muted-foreground">Keep blockers low for stronger consistency</p>
              </div>

              <div className="rounded-xl border border-border bg-card p-3">
                <div className="mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-semibold">In Progress</p>
                </div>
                <p className="text-2xl font-semibold text-foreground">{viewModel.inProgressCount}</p>
                <p className="text-sm text-muted-foreground">Tasks currently in active execution</p>
              </div>

              <div className="rounded-xl border border-border bg-card p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4 text-orange-600" />
                  <p className="text-sm font-semibold">Payout Threshold</p>
                </div>
                <p className="text-2xl font-semibold text-foreground">{viewModel.payoutThreshold}%</p>
                <p className="text-sm text-muted-foreground">
                  {viewModel.isOnTrack ? "You are currently on track." : "You are below payout threshold."}
                </p>
              </div>
            </div>

            <div className={`rounded-xl border p-3 ${momentumTone(viewModel.momentum.tone)}`}>
              <div className="mb-1 flex items-center gap-2">
                <Flame className="h-4 w-4" />
                <p className="text-sm font-semibold">Momentum Signal: {viewModel.momentum.label}</p>
              </div>
              <p className="text-sm">
                Completion rate and blocker pressure combine into your execution momentum.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Contract-Safe Snapshot
            </CardTitle>
            <CardDescription>Eligibility signals from performance and task delivery.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border border-border p-3">
              <p className="text-sm font-medium">Current Eligibility</p>
              <Badge className="mt-2" variant={viewModel.isOnTrack ? "default" : "secondary"}>
                {viewModel.isOnTrack ? "On track" : "Needs improvement"}
              </Badge>
            </div>

            <div className="rounded-xl border border-border p-3">
              <p className="text-sm font-medium">Data Source</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {hasPerformanceContract ? "Performance endpoint" : "Task fallback"}
              </p>
            </div>

            <div className="rounded-xl border border-border p-3">
              <p className="text-sm font-medium">Sync Status</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {usedFallback ? "Partial fallback active" : "Fully synced"}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Recent Task Activity</CardTitle>
            <CardDescription>Latest tasks contributing to your performance profile.</CardDescription>
          </CardHeader>
          <CardContent>
            {viewModel.tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No task history available yet.</p>
            ) : (
              <div className="space-y-2">
                {viewModel.tasks.slice(0, 8).map((task) => (
                  <div key={`task-history-${task.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">Updated {formatDate(task.updatedAt || task.createdAt)}</p>
                    </div>
                    <Badge>{task.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
