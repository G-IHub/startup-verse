import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Flame,
  Loader2,
  Plus,
  Rocket,
  Target,
  TrendingUp,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Progress } from "../ui/progress";
import { request } from "../../utils/backendClient";
import * as coreEngineApi from "../../utils/api/coreEngineApi";
import { mapFounderWeeklyLoop } from "../../domains/founder/mappers/founderWeeklyLoopMapper";

const EMPTY_VIEW_MODEL = mapFounderWeeklyLoop({
  outcomes: [],
  milestones: [],
  tasks: [],
  executionScore: null,
});

function formatWeekLabel(weekOf) {
  if (!weekOf) return "Current week";
  const date = new Date(weekOf);
  if (Number.isNaN(date.getTime())) return "Current week";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDefaultWeekIsoDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

function getStatusTone(status) {
  if (status === "completed") return "text-green-600 dark:text-green-400";
  if (status === "partial") return "text-amber-600 dark:text-amber-400";
  if (status === "missed") return "text-destructive";
  return "text-primary";
}

export default function FounderHomeV2({
  user,
  onNavigate,
  onVirtualOfficeViewChange,
}) {
  const [loading, setLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState(0);
  const [submittingGoal, setSubmittingGoal] = useState(false);
  const [submittingMilestone, setSubmittingMilestone] = useState(false);
  const [submittingTask, setSubmittingTask] = useState(false);
  const [submittingOutcome, setSubmittingOutcome] = useState(false);
  const [viewModel, setViewModel] = useState(EMPTY_VIEW_MODEL);

  const [goalForm, setGoalForm] = useState({ goal: "", summary: "" });
  const [milestoneForm, setMilestoneForm] = useState({
    title: "",
    description: "",
    dueDate: "",
  });
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    milestoneId: "",
  });
  const [outcomeStatus, setOutcomeStatus] = useState("completed");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [outcomes, milestones, tasks, scorePayload] = await Promise.all([
        coreEngineApi.getWeeklyOutcomes(user.id).catch(() => []),
        coreEngineApi.getMilestones(user.id).catch(() => []),
        coreEngineApi.getTasks(user.id).catch(() => []),
        request(`/execution-score/${user.id}`, { method: "GET" }).catch(() => null),
      ]);

      setViewModel(
        mapFounderWeeklyLoop({
          outcomes,
          milestones,
          tasks,
          executionScore: scorePayload?.data || null,
        }),
      );
    } catch {
      toast.error("Failed to load founder home data");
      setViewModel(EMPTY_VIEW_MODEL);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshToken]);

  useEffect(() => {
    if (viewModel.activeOutcome) {
      setGoalForm({
        goal: viewModel.activeOutcome.goal || "",
        summary: viewModel.activeOutcome.summary || "",
      });
    }
  }, [viewModel.activeOutcome?.id]);

  useEffect(() => {
    if (!taskForm.milestoneId && viewModel.milestones.length > 0) {
      setTaskForm((current) => ({
        ...current,
        milestoneId: viewModel.milestones[0].id,
      }));
    }
  }, [taskForm.milestoneId, viewModel.milestones]);

  const refresh = () => setRefreshToken((value) => value + 1);

  const quickActions = useMemo(
    () => [
      {
        id: "office",
        label: "Open Virtual Office",
        onClick: () => {
          onVirtualOfficeViewChange?.("workspace");
          onNavigate("startup-office");
        },
      },
      {
        id: "inbox",
        label: "Open Inbox",
        onClick: () => onNavigate("inbox"),
      },
      {
        id: "analytics",
        label: "View Analytics",
        onClick: () => onNavigate("analytics"),
      },
    ],
    [onNavigate, onVirtualOfficeViewChange],
  );

  const handleSaveGoal = async () => {
    if (!goalForm.goal.trim()) {
      toast.error("Weekly goal is required");
      return;
    }

    setSubmittingGoal(true);
    try {
      await coreEngineApi.saveWeeklyOutcome(user.id, {
        ...(viewModel.activeOutcome?.raw || {}),
        goal: goalForm.goal.trim(),
        summary: goalForm.summary.trim(),
        status: "active",
        weekOf: viewModel.activeOutcome?.weekOf || getDefaultWeekIsoDate(),
      });
      toast.success("Weekly goal saved");
      refresh();
    } catch (error) {
      toast.error(error?.message || "Failed to save weekly goal");
    } finally {
      setSubmittingGoal(false);
    }
  };

  const handleCreateMilestone = async () => {
    if (!milestoneForm.title.trim()) {
      toast.error("Milestone title is required");
      return;
    }

    setSubmittingMilestone(true);
    try {
      await coreEngineApi.saveMilestone(user.id, {
        title: milestoneForm.title.trim(),
        description: milestoneForm.description.trim(),
        dueDate: milestoneForm.dueDate || null,
        sequence: viewModel.milestones.length + 1,
        status: "pending",
      });
      setMilestoneForm({ title: "", description: "", dueDate: "" });
      toast.success("Milestone created");
      refresh();
    } catch (error) {
      toast.error(error?.message || "Failed to create milestone");
    } finally {
      setSubmittingMilestone(false);
    }
  };

  const handleCreateTask = async () => {
    if (!taskForm.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    setSubmittingTask(true);
    try {
      await coreEngineApi.saveTask(user.id, {
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        status: "pending",
        milestoneId: taskForm.milestoneId || null,
      });
      setTaskForm({
        title: "",
        description: "",
        milestoneId: viewModel.milestones[0]?.id || "",
      });
      toast.success("Task created");
      refresh();
    } catch (error) {
      toast.error(error?.message || "Failed to create task");
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleSubmitOutcome = async () => {
    if (!viewModel.activeOutcome && !goalForm.goal.trim()) {
      toast.error("Set a weekly goal before submitting this week");
      return;
    }

    setSubmittingOutcome(true);
    try {
      await coreEngineApi.saveWeeklyOutcome(user.id, {
        ...(viewModel.activeOutcome?.raw || {}),
        goal: viewModel.activeOutcome?.goal || goalForm.goal.trim(),
        summary: viewModel.activeOutcome?.summary || goalForm.summary.trim(),
        status: outcomeStatus,
        weekOf: viewModel.activeOutcome?.weekOf || getDefaultWeekIsoDate(),
      });
      toast.success("Weekly outcome submitted");
      refresh();
    } catch (error) {
      toast.error(error?.message || "Failed to submit weekly outcome");
    } finally {
      setSubmittingOutcome(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading founder home
        </div>
      </div>
    );
  }

  const { metrics, activeOutcome, blockers, milestones, tasks, outcomes } = viewModel;

  return (
    <div className="space-y-6 py-4 pb-20">
      <section className="rounded-2xl border border-blue-700/20 bg-blue-600 p-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <p className="text-sm text-blue-100">Weekly execution loop</p>
            <h2 className="text-2xl font-semibold text-white">
              {activeOutcome?.goal || "No active weekly goal yet"}
            </h2>
            <p className="text-sm text-blue-100">
              {activeOutcome
                ? `${formatWeekLabel(activeOutcome.weekOf)} • Status: ${activeOutcome.status}`
                : "Set this week’s goal, milestones, and tasks to unlock momentum."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="secondary"
                className="bg-white/15 text-white hover:bg-white/25"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Execution Score</CardDescription>
            <CardTitle className="text-3xl">
              {metrics.executionScore || "--"}
              {metrics.executionScore ? <span className="text-base">/100</span> : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {metrics.executionPercentile > 0
                ? `Top ${Math.max(1, 100 - metrics.executionPercentile)}% of founders`
                : "No percentile yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current Streak</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <Flame className="h-6 w-6 text-amber-500" />
              {metrics.streak}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Consecutive completed weekly outcomes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Milestone Progress</CardDescription>
            <CardTitle className="text-3xl">{metrics.milestoneProgress}%</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress value={metrics.milestoneProgress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {metrics.completedMilestones}/{metrics.totalMilestones} milestones complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Task Mix</CardDescription>
            <CardTitle className="text-3xl">{metrics.taskMix.total}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant="outline">Pending {metrics.taskMix.pending}</Badge>
            <Badge variant="outline">In Progress {metrics.taskMix["in-progress"]}</Badge>
            <Badge variant="outline">Blocked {metrics.taskMix.blocked}</Badge>
            <Badge variant="outline">Done {metrics.taskMix.completed}</Badge>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-title-large">
              <Target className="h-4 w-4 text-primary" />
              Set Weekly Goal
            </CardTitle>
            <CardDescription>
              Goal and summary drive your weekly execution and scoring.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={goalForm.goal}
              onChange={(event) =>
                setGoalForm((current) => ({ ...current, goal: event.target.value }))
              }
              placeholder="This week’s goal"
            />
            <Textarea
              value={goalForm.summary}
              onChange={(event) =>
                setGoalForm((current) => ({ ...current, summary: event.target.value }))
              }
              placeholder="Outcome summary"
              rows={3}
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSaveGoal} disabled={submittingGoal}>
                {submittingGoal ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Goal
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onVirtualOfficeViewChange?.("workspace");
                  onNavigate("startup-office");
                }}
              >
                <Rocket className="mr-2 h-4 w-4" />
                Continue in Virtual Office
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-title-large">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Blockers
            </CardTitle>
            <CardDescription>Unblock these tasks first.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {blockers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No blocked tasks right now.
              </p>
            ) : (
              blockers.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  className="rounded-lg border border-amber-300/40 bg-amber-50/60 p-2 text-sm dark:bg-amber-950/20"
                >
                  <p className="font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {task.blockerReason || "No reason provided"}
                  </p>
                </div>
              ))
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                onVirtualOfficeViewChange?.("workspace");
                onNavigate("startup-office");
              }}
            >
              Resolve in Workspace
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-title-large">
              <Plus className="h-4 w-4 text-primary" />
              Add Milestone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={milestoneForm.title}
              onChange={(event) =>
                setMilestoneForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="Milestone title"
            />
            <Input
              type="date"
              value={milestoneForm.dueDate}
              onChange={(event) =>
                setMilestoneForm((current) => ({
                  ...current,
                  dueDate: event.target.value,
                }))
              }
            />
            <Textarea
              rows={2}
              value={milestoneForm.description}
              onChange={(event) =>
                setMilestoneForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Description"
            />
            <Button
              className="w-full"
              onClick={handleCreateMilestone}
              disabled={submittingMilestone}
            >
              {submittingMilestone ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Create Milestone
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-title-large">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Create Task
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={taskForm.title}
              onChange={(event) =>
                setTaskForm((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Task title"
            />
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={taskForm.milestoneId}
              onChange={(event) =>
                setTaskForm((current) => ({
                  ...current,
                  milestoneId: event.target.value,
                }))
              }
            >
              <option value="">No milestone</option>
              {milestones.map((milestone) => (
                <option key={milestone.id} value={milestone.id}>
                  {milestone.title}
                </option>
              ))}
            </select>
            <Textarea
              rows={2}
              value={taskForm.description}
              onChange={(event) =>
                setTaskForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Task description"
            />
            <Button className="w-full" onClick={handleCreateTask} disabled={submittingTask}>
              {submittingTask ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Task
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-title-large">
              <TrendingUp className="h-4 w-4 text-primary" />
              Submit Weekly Outcome
            </CardTitle>
            <CardDescription>
              End this week with an explicit outcome status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={outcomeStatus}
              onChange={(event) => setOutcomeStatus(event.target.value)}
            >
              <option value="completed">Completed</option>
              <option value="partial">Partial</option>
              <option value="missed">Missed</option>
            </select>
            <Button
              className="w-full"
              onClick={handleSubmitOutcome}
              disabled={submittingOutcome}
            >
              {submittingOutcome ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Submit Outcome
            </Button>
            {activeOutcome ? (
              <p className={`text-sm font-medium ${getStatusTone(activeOutcome.status)}`}>
                Current status: {activeOutcome.status}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Set your weekly goal first.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-title-large">
              <Activity className="h-4 w-4 text-primary" />
              Milestones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {milestones.length === 0 ? (
              <p className="text-sm text-muted-foreground">No milestones yet.</p>
            ) : (
              milestones.slice(0, 6).map((milestone) => {
                const progress =
                  milestone.totalTasks > 0
                    ? Math.round((milestone.tasksCompleted / milestone.totalTasks) * 100)
                    : 0;
                return (
                  <div key={milestone.id} className="space-y-1 rounded-lg border p-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{milestone.title}</p>
                      <Badge variant={milestone.isCompleted ? "default" : "outline"}>
                        {milestone.isCompleted ? "Done" : "Active"}
                      </Badge>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      {milestone.tasksCompleted}/{milestone.totalTasks} tasks complete
                    </p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-title-large">Recent Weekly Outcomes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {outcomes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No outcomes logged yet.</p>
            ) : (
              outcomes.slice(0, 6).map((outcome) => (
                <div
                  key={outcome.id || `${outcome.weekOf}-${outcome.status}`}
                  className="rounded-lg border p-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{outcome.goal || "Untitled goal"}</p>
                    <Badge variant="outline">{outcome.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatWeekLabel(outcome.weekOf)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-4">
        <p className="text-sm text-muted-foreground">
          Assignment and status transitions remain server-enforced. Use Virtual Office for
          live team collaboration and Inbox for role-based communication flows.
        </p>
      </section>
    </div>
  );
}
