import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowRight,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  MessageSquare,
  PlayCircle,
  ShieldAlert,
  Users,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Progress } from "../ui/progress";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useTeamMemberHomeData } from "../../domains/team-member/hooks/useTeamMemberHomeData";

const BLOCKER_REASONS = [
  { value: "waiting-on-others", label: "Waiting on others" },
  { value: "missing-info", label: "Missing information" },
  { value: "technical-issue", label: "Technical issue" },
  { value: "resource-constraint", label: "Resource constraint" },
];

function statusTone(status) {
  if (status === "completed") return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
  if (status === "in-progress") return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
  if (status === "blocked") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

function formatWhen(value) {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No due date";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function TeamMemberDashboard({ user, onNavigate }) {
  const {
    loading,
    error,
    updatingTaskId,
    savingCheckIn,
    viewModel,
    saveCheckIn,
    updateTaskStatus,
    refresh,
  } = useTeamMemberHomeData({ user });

  const [checkInStatus, setCheckInStatus] = useState("available");
  const [checkInNote, setCheckInNote] = useState("");

  const [blockerTask, setBlockerTask] = useState(null);
  const [blockerReason, setBlockerReason] = useState(BLOCKER_REASONS[0].value);
  const [blockerNote, setBlockerNote] = useState("");
  const [blocking, setBlocking] = useState(false);

  useEffect(() => {
    setCheckInStatus(viewModel.checkIn.status || "available");
    setCheckInNote(viewModel.checkIn.note || "");
  }, [viewModel.checkIn.note, viewModel.checkIn.status]);

  const founderName = viewModel.founderName || "your founder";

  const quickActions = useMemo(
    () => [
      {
        id: "office",
        label: "Open Virtual Office",
        onClick: () => onNavigate?.("startup-office"),
      },
      {
        id: "inbox",
        label: "Open Inbox",
        onClick: () => onNavigate?.("inbox"),
      },
      {
        id: "performance",
        label: "View Performance",
        onClick: () => onNavigate?.("my-performance"),
      },
    ],
    [onNavigate],
  );

  const handleTaskChange = async (task, status, extra = {}) => {
    const result = await updateTaskStatus(task, { status, ...extra });
    if (result.success) {
      const label = status.replace("-", " ");
      toast.success(`Task moved to ${label}`);
      return;
    }

    toast.error(result.error || "Could not update task");
  };

  const submitBlocker = async () => {
    if (!blockerTask) return;
    if (!blockerReason || !blockerNote.trim()) {
      toast.error("Add a blocker reason and note before saving.");
      return;
    }

    setBlocking(true);
    const result = await updateTaskStatus(blockerTask, {
      status: "blocked",
      blockerReason,
      blockerNote: blockerNote.trim(),
    });
    setBlocking(false);

    if (result.success) {
      toast.info("Blocker submitted. Founder will see this update.");
      setBlockerTask(null);
      setBlockerNote("");
      setBlockerReason(BLOCKER_REASONS[0].value);
      return;
    }

    toast.error(result.error || "Could not save blocker");
  };

  const handleCheckInSave = async () => {
    const result = await saveCheckIn({
      status: checkInStatus,
      note: checkInNote.trim(),
    });

    if (result.success) {
      toast.success("Check-in updated");
      return;
    }

    toast.error(result.error || "Could not save check-in");
  };

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading My Work Today
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4 pb-20">
      <section className="rounded-2xl border border-blue-700/20 bg-blue-600 p-5 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <p className="text-sm text-blue-100">My work today</p>
            <h2 className="text-2xl font-semibold text-white">
              {viewModel.activeTasks.length > 0
                ? `${viewModel.activeTasks.length} active task${viewModel.activeTasks.length === 1 ? "" : "s"}`
                : "You are fully caught up"}
            </h2>
            <p className="text-sm text-blue-100">{viewModel.todayLabel}</p>
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

      {error ? (
        <Card className="border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="flex items-center justify-between gap-3 py-3">
            <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
            <Button variant="outline" size="sm" onClick={() => refresh()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completion</CardDescription>
            <CardTitle className="text-3xl">{viewModel.metrics.completionRate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={viewModel.metrics.completionRate} className="h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-3xl">{viewModel.metrics.inProgress}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Tasks currently moving</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Blocked</CardDescription>
            <CardTitle className="text-3xl">{viewModel.metrics.blocked}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Needs founder support</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl">{viewModel.metrics.completed}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Done this cycle</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Assigned Tasks</CardTitle>
                <CardDescription>
                  Move tasks through pending, in progress, blocked, and completed states.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => onNavigate?.("startup-office")}> 
                <Building className="mr-1.5 h-4 w-4" />
                Open Workspace
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {viewModel.tasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <p className="text-sm font-medium">No tasks assigned yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  New assignments will appear here automatically.
                </p>
              </div>
            ) : (
              viewModel.tasks.map((task) => (
                <div key={task.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">{task.title}</p>
                      <p className="text-sm text-muted-foreground">{task.description || "No description provided"}</p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Badge className={statusTone(task.status)}>{task.status}</Badge>
                        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatWhen(task.dueDate)}
                        </span>
                      </div>
                      {task.status === "blocked" && (task.blockerReason || task.blockerNote) ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                          <p className="font-medium">{task.blockerReason || "Blocked"}</p>
                          {task.blockerNote ? <p>{task.blockerNote}</p> : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {task.status === "pending" ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleTaskChange(task, "in-progress")}
                            disabled={updatingTaskId === task.id}
                          >
                            <PlayCircle className="mr-1.5 h-4 w-4" />
                            Start
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setBlockerTask(task)}
                            disabled={updatingTaskId === task.id}
                          >
                            <ShieldAlert className="mr-1.5 h-4 w-4" />
                            Block
                          </Button>
                        </>
                      ) : null}

                      {task.status === "in-progress" ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleTaskChange(task, "completed")}
                            disabled={updatingTaskId === task.id}
                          >
                            <CheckCircle2 className="mr-1.5 h-4 w-4" />
                            Complete
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setBlockerTask(task)}
                            disabled={updatingTaskId === task.id}
                          >
                            <ShieldAlert className="mr-1.5 h-4 w-4" />
                            Block
                          </Button>
                        </>
                      ) : null}

                      {task.status === "blocked" ? (
                        <Button
                          size="sm"
                          onClick={() => handleTaskChange(task, "in-progress")}
                          disabled={updatingTaskId === task.id}
                        >
                          <ArrowRight className="mr-1.5 h-4 w-4" />
                          Resume
                        </Button>
                      ) : null}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onNavigate?.("startup-office", { taskId: task.id })}
                      >
                        Open
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Check-In</CardTitle>
              <CardDescription>Share your current focus and availability with the team.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Status</label>
                <Select value={checkInStatus} onValueChange={setCheckInStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {viewModel.statusOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Check-in note</label>
                <Textarea
                  value={checkInNote}
                  onChange={(event) => setCheckInNote(event.target.value)}
                  placeholder="What are you working on right now?"
                  rows={4}
                />
              </div>

              <Button className="w-full" onClick={handleCheckInSave} disabled={savingCheckIn}>
                {savingCheckIn ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                Save Check-In
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Blockers Needing Help</CardTitle>
              <CardDescription>Escalated items that need support.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {viewModel.blockedTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active blockers right now.</p>
              ) : (
                viewModel.blockedTasks.map((task) => (
                  <div key={`blocked-${task.id}`} className="rounded-lg border border-border p-2.5">
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {task.blockerReason || "Missing reason"}
                    </p>
                    {task.blockerNote ? (
                      <p className="mt-1 text-sm text-muted-foreground">{task.blockerNote}</p>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Live Team Context</CardTitle>
              <CardDescription>
                {viewModel.hasLivePresence
                  ? "Live presence stream"
                  : "Fallback roster (presence unavailable)"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {viewModel.teamContext.length === 0 ? (
                <p className="text-sm text-muted-foreground">No team context available.</p>
              ) : (
                viewModel.teamContext.slice(0, 6).map((member) => (
                  <div key={`member-${member.id}`} className="flex items-start justify-between rounded-lg border border-border p-2.5">
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                      {member.statusText ? (
                        <p className="text-sm text-muted-foreground">{member.statusText}</p>
                      ) : null}
                    </div>
                    <Badge variant={member.isOnline ? "default" : "outline"}>
                      {member.isOnline ? "Online" : "Away"}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming</CardTitle>
              <CardDescription>From your calendar timeline.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {viewModel.upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming items in the next 2 weeks.</p>
              ) : (
                viewModel.upcoming.slice(0, 5).map((item) => (
                  <div key={`agenda-${item.id}`} className="rounded-lg border border-border p-2.5">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{formatWhen(item.at)}</p>
                    <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {item.type}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <Dialog open={Boolean(blockerTask)} onOpenChange={(open) => (!open ? setBlockerTask(null) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Blocker</DialogTitle>
            <DialogDescription>
              Add blocker details so {founderName || "your founder"} can help unblock this task quickly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-sm font-medium">{blockerTask?.title || "Task"}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Reason</label>
              <Select value={blockerReason} onValueChange={setBlockerReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select blocker reason" />
                </SelectTrigger>
                <SelectContent>
                  {BLOCKER_REASONS.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Details</label>
              <Textarea
                value={blockerNote}
                onChange={(event) => setBlockerNote(event.target.value)}
                placeholder="What is blocking progress and what do you need?"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockerTask(null)}>
              Cancel
            </Button>
            <Button onClick={submitBlocker} disabled={blocking}>
              {blocking ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-1.5 h-4 w-4" />}
              Save Blocker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
