import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
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
import ExtraWorkTodayPanel from "../team-member/ExtraWorkTodayPanel";
import ExtraWorkLogDialog from "../team-member/ExtraWorkLogDialog";

const BLOCKER_REASONS = [
  { value: "waiting-on-others", label: "Waiting on others" },
  { value: "missing-info", label: "Missing information" },
  { value: "technical-issue", label: "Technical issue" },
  { value: "resource-constraint", label: "Resource constraint" },
];

const PANEL =
  "rounded-card border border-surface-border bg-surface-card shadow-soft";

function statusTone(status) {
  if (status === "completed") {
    return "bg-status-success/10 text-status-success";
  }
  if (status === "in-progress") {
    return "bg-primary-tint text-primary";
  }
  if (status === "blocked") {
    return "bg-status-error/10 text-status-error";
  }
  return "bg-primary-tint text-primary";
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

/** Layout-shaped cold-load skeleton for Team Member home (My Work). */
function TeamMemberHomeSkeleton() {
  return (
    <div
      className="space-y-4 bg-surface-page py-3 pb-20 font-body"
      role="status"
      aria-live="polite"
      aria-label="Loading My Work"
    >
      <div className="animate-pulse space-y-4">
        <div className={`${PANEL} px-4 py-4 md:px-5`}>
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 shrink-0 rounded-input bg-surface-border/80" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-28 rounded bg-surface-border/70" />
              <div className="h-4 w-48 rounded bg-surface-border" />
              <div className="h-3 w-72 max-w-full rounded bg-surface-border/60" />
            </div>
            <div className="hidden h-9 w-28 shrink-0 rounded-input bg-surface-border/70 sm:block" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className={`${PANEL} p-4`}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-input bg-surface-border/80" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3 w-16 rounded bg-surface-border/70" />
                  <div className="h-7 w-12 rounded bg-surface-border" />
                  <div className="h-3 w-24 rounded bg-surface-border/50" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <div className={`${PANEL} p-4 sm:p-5 lg:col-span-2`}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="h-5 w-36 rounded bg-surface-border" />
                <div className="h-3 w-56 max-w-full rounded bg-surface-border/70" />
              </div>
              <div className="h-8 w-28 shrink-0 rounded-input bg-surface-border/70" />
            </div>
            <div className="space-y-3">
              <div className="h-20 rounded-input bg-surface-border/50" />
              <div className="h-20 rounded-input bg-surface-border/40" />
              <div className="h-20 rounded-input bg-surface-border/35" />
            </div>
          </div>

          <div className={`${PANEL} p-4 sm:p-5`}>
            <div className="mb-4 space-y-2">
              <div className="h-5 w-32 rounded bg-surface-border" />
              <div className="h-3 w-40 rounded bg-surface-border/70" />
            </div>
            <div className="space-y-3">
              <div className="h-10 w-full rounded-input bg-surface-border/50" />
              <div className="h-24 w-full rounded-input bg-surface-border/40" />
              <div className="h-10 w-full rounded-input bg-surface-border/60" />
              <div className="mt-4 h-px bg-surface-border" />
              <div className="h-4 w-40 rounded bg-surface-border/70" />
              <div className="h-14 rounded-input bg-surface-border/40" />
              <div className="h-14 rounded-input bg-surface-border/35" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ title, description, action }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="font-heading text-[16px] font-semibold text-text-heading md:text-[18px]">
          {title}
        </h3>
        {description ? (
          <p className="mt-1 font-body text-[13px] text-text-body">{description}</p>
        ) : null}
      </div>
      {action || null}
    </div>
  );
}

export default function TeamMemberDashboard({ user, onNavigate }) {
  const {
    loading,
    error,
    updatingTaskId,
    savingCheckIn,
    viewModel,
    saveCheckIn,
    persistWorkLog,
    deleteWorkLog,
    savingWorkLog,
    updateTaskStatus,
    refresh,
  } = useTeamMemberHomeData({ user });

  const [checkInStatus, setCheckInStatus] = useState("available");
  const [checkInNote, setCheckInNote] = useState("");

  const [blockerTask, setBlockerTask] = useState(null);
  const [blockerReason, setBlockerReason] = useState(BLOCKER_REASONS[0].value);
  const [blockerNote, setBlockerNote] = useState("");
  const [blocking, setBlocking] = useState(false);
  const [workLogOpen, setWorkLogOpen] = useState(false);
  const [workLogMode, setWorkLogMode] = useState("create");
  const [activeWorkLog, setActiveWorkLog] = useState(null);

  useEffect(() => {
    setCheckInStatus(viewModel.checkIn.status || "available");
    setCheckInNote(viewModel.checkIn.note || "");
  }, [viewModel.checkIn.note, viewModel.checkIn.status]);

  const founderName = viewModel.founderName || "your founder";
  const firstName = String(user?.name || "there").trim().split(" ")[0] || "there";

  const metricCards = [
    {
      id: "total",
      label: "Total",
      value: viewModel.tasks.length,
      note: "Assigned this cycle",
      icon: Calendar,
      iconClassName: "bg-primary-tint text-primary",
    },
    {
      id: "progress",
      label: "In Progress",
      value: viewModel.metrics.inProgress,
      note: "Tasks currently moving",
      icon: Clock,
      iconClassName: "bg-primary-tint text-primary",
    },
    {
      id: "completed",
      label: "Completed",
      value: viewModel.metrics.completed,
      note: "Done this cycle",
      icon: CheckCircle2,
      iconClassName: "bg-status-success/10 text-status-success",
    },
    {
      id: "blocked",
      label: "Blocked",
      value: viewModel.metrics.blocked,
      note: "Needs founder support",
      icon: ShieldAlert,
      iconClassName: "bg-status-error/10 text-status-error",
    },
  ];

  const quickActions = useMemo(
    () => [
      {
        id: "office",
        label: "Open Virtual Office",
        onClick: () => onNavigate?.("startup-office"),
        primary: true,
      },
      {
        id: "chat",
        label: "Open Chat",
        onClick: () => onNavigate?.("founder-chat"),
        primary: false,
      },
      {
        id: "performance",
        label: "View Performance",
        onClick: () => onNavigate?.("my-performance"),
        primary: false,
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

  const handleWorkLogSubmit = async (payload) => {
    const result = await persistWorkLog(
      payload,
      workLogMode === "edit" ? activeWorkLog?.id : null,
    );
    if (result.success) {
      toast.success(workLogMode === "edit" ? "Extra work updated." : "Extra work logged.");
      setWorkLogOpen(false);
      setActiveWorkLog(null);
      return;
    }
    toast.error(result.error || "Could not save extra work.");
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
    return <TeamMemberHomeSkeleton />;
  }

  const subtitle =
    viewModel.activeTasks.length > 0
      ? `You have ${viewModel.activeTasks.length} active task${viewModel.activeTasks.length === 1 ? "" : "s"} in motion today. Keep progress visible and flag blockers early.`
      : "You are fully caught up for now. Stay aligned with the team through quick check-ins and upcoming updates.";

  return (
    <div className="space-y-4 bg-surface-page py-3 pb-20 font-body">
      {/* Compact greeting — AppLayout owns the page title */}
      <section className={`${PANEL} px-4 py-4 md:px-5`}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-input bg-primary-tint text-primary">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="font-body text-[12px] font-medium uppercase tracking-[0.06em] text-text-muted">
                {viewModel.todayLabel}
              </p>
              <p className="font-heading text-[16px] font-semibold leading-tight text-text-heading md:text-[17px]">
                Hi, {firstName}
              </p>
              <p className="max-w-2xl font-body text-[13px] text-text-body">
                {subtitle}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {quickActions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={action.onClick}
                className={`inline-flex h-9 items-center rounded-input px-3 font-body text-[13px] font-semibold transition-colors duration-200 ease-in-out ${
                  action.primary
                    ? "bg-primary text-white hover:bg-primary-hover"
                    : "border border-surface-border bg-surface-card text-primary hover:bg-primary-tint"
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error ? (
        <div className={`${PANEL} border-status-warning/40 bg-status-warning/10`}>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <p className="font-body text-sm text-text-heading">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="rounded-input border-surface-border bg-surface-card text-text-body hover:bg-primary-tint hover:text-primary"
              onClick={() => refresh()}
            >
              Retry
            </Button>
          </div>
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.id} className={`${PANEL} p-4`}>
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-input ${metric.iconClassName}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-body text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
                    {metric.label}
                  </p>
                  <div className="mt-1 flex items-end gap-2">
                    <span className="font-heading text-[28px] font-extrabold leading-none text-text-heading">
                      {metric.value}
                    </span>
                    {metric.id === "total" ? (
                      <span className="pb-1 font-body text-[12px] font-normal text-text-muted">
                        tasks
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1.5 font-body text-[12px] text-text-muted">
                    {metric.note}
                  </p>
                  {metric.id === "total" ? (
                    <div className="mt-3">
                      <Progress
                        value={viewModel.metrics.completionRate}
                        className="h-1 border-0 bg-surface-border [&_[data-slot=progress-indicator]]:bg-primary"
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
        {/* Active tasks — primary work panel */}
        <div className={PANEL}>
          <div className="space-y-3 px-4 py-4 sm:px-5">
            <SectionHeading
              title="Active Tasks"
              description="Move tasks through pending, in progress, blocked, and completed states."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-input border-surface-border bg-surface-page px-3 text-[13px] font-semibold text-primary hover:border-primary hover:bg-primary-tint"
                  onClick={() => onNavigate?.("startup-office")}
                >
                  <Building className="mr-1.5 h-4 w-4" />
                  Open Workspace
                </Button>
              }
            />

            {viewModel.tasks.length === 0 ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-input bg-surface-page px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-status-success/10 text-status-success">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <p className="mt-4 font-heading text-[18px] font-bold text-text-heading">
                  All caught up
                </p>
                <p className="mt-2 max-w-md font-body text-[13px] text-text-muted">
                  New assignments will appear here automatically.
                </p>
              </div>
            ) : (
              viewModel.tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-input border border-surface-border/80 bg-surface-page p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-heading text-[14px] font-semibold text-text-heading">
                        {task.title}
                      </p>
                      <p className="font-body text-[12px] text-text-muted">
                        {task.description || "No description provided"}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Badge
                          className={`${statusTone(task.status)} rounded-pill border-0 px-[10px] py-[2px] font-body text-[11px] font-semibold capitalize`}
                        >
                          {task.status}
                        </Badge>
                        <span className="inline-flex items-center gap-1 font-body text-[12px] text-text-muted">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatWhen(task.dueDate)}
                        </span>
                      </div>
                      {task.status === "blocked" &&
                      (task.blockerReason || task.blockerNote) ? (
                        <div className="mt-2 rounded-input bg-status-error/10 p-3 font-body text-[12px] text-status-error">
                          <p className="font-semibold">
                            {task.blockerReason || "Blocked"}
                          </p>
                          {task.blockerNote ? <p>{task.blockerNote}</p> : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {task.status === "pending" ? (
                        <>
                          <Button
                            size="sm"
                            className="rounded-pill bg-surface-page text-[12px] font-semibold text-text-body ring-1 ring-surface-border hover:text-primary hover:ring-primary"
                            onClick={() => handleTaskChange(task, "in-progress")}
                            disabled={updatingTaskId === task.id}
                          >
                            <PlayCircle className="mr-1.5 h-4 w-4" />
                            Start
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-pill border-0 bg-status-error/10 text-[12px] font-semibold text-status-error hover:bg-status-error hover:text-white"
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
                            className="rounded-pill border-0 bg-status-success/10 text-[12px] font-semibold text-status-success hover:bg-status-success hover:text-white"
                            onClick={() => handleTaskChange(task, "completed")}
                            disabled={updatingTaskId === task.id}
                          >
                            <CheckCircle2 className="mr-1.5 h-4 w-4" />
                            Complete
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-pill border-0 bg-status-error/10 text-[12px] font-semibold text-status-error hover:bg-status-error hover:text-white"
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
                          className="rounded-pill bg-surface-page text-[12px] font-semibold text-text-body ring-1 ring-surface-border hover:text-primary hover:ring-primary"
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
                        className="rounded-pill border border-surface-border bg-surface-page text-[12px] font-semibold text-text-body hover:border-primary hover:text-primary"
                        onClick={() =>
                          onNavigate?.("startup-office", { taskId: task.id })
                        }
                      >
                        Open
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <ExtraWorkTodayPanel
          logs={viewModel.workLogs || []}
          onLog={() => {
            setActiveWorkLog(null);
            setWorkLogMode("create");
            setWorkLogOpen(true);
          }}
          onOpen={(log) => {
            setActiveWorkLog(log);
            setWorkLogMode("view");
            setWorkLogOpen(true);
          }}
          onEdit={(log) => {
            setActiveWorkLog(log);
            setWorkLogMode("edit");
            setWorkLogOpen(true);
          }}
          onDelete={async (log) => {
            const result = await deleteWorkLog(log.id);
            if (result.success) {
              toast.success("Extra work removed.");
            } else {
              toast.error(result.error || "Could not delete extra work.");
            }
          }}
        />
        </div>

        {/* Sidebar: check-in + blockers + team + coming up in one panel */}
        <div className={PANEL}>
          <div className="divide-y divide-surface-border">
            <div className="space-y-3 px-4 py-4 sm:px-5">
              <SectionHeading
                title="Daily Check-In"
                description="Share your current focus and availability with the team."
              />
              <div className="space-y-1.5">
                <label className="font-body text-[13px] font-medium text-text-heading">
                  Status
                </label>
                <Select value={checkInStatus} onValueChange={setCheckInStatus}>
                  <SelectTrigger className="h-10 rounded-input border-[1.5px] border-surface-border bg-surface-card font-body text-[13px] text-text-heading focus:ring-0 focus:ring-offset-0 focus-visible:border-primary focus-visible:shadow-focus [&_svg]:text-text-body">
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
                <label className="font-body text-[13px] font-medium text-text-heading">
                  Check-in note
                </label>
                <Textarea
                  value={checkInNote}
                  onChange={(event) => setCheckInNote(event.target.value)}
                  placeholder="What are you working on right now?"
                  rows={4}
                  className="min-h-[112px] rounded-input border-[1.5px] border-surface-border bg-surface-card font-body text-[13px] text-text-heading placeholder:text-text-muted focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/10"
                />
              </div>

              <Button
                className="h-10 w-full rounded-input bg-primary font-body text-[14px] font-semibold text-white shadow-soft hover:bg-primary-hover"
                onClick={handleCheckInSave}
                disabled={savingCheckIn}
              >
                {savingCheckIn ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : null}
                Save Check-In
              </Button>
            </div>

            <div className="space-y-3 px-4 py-4 sm:px-5">
              <SectionHeading
                title="Blockers Needing Help"
                description="Escalated items that need support."
                action={
                  <span className="rounded-pill bg-status-error/10 px-[10px] py-[2px] font-body text-[11px] font-semibold text-status-error">
                    {viewModel.blockedTasks.length} active
                  </span>
                }
              />
              {viewModel.blockedTasks.length === 0 ? (
                <p className="rounded-input bg-surface-page px-4 py-6 text-center font-body text-[13px] text-text-muted">
                  No active blockers right now.
                </p>
              ) : (
                viewModel.blockedTasks.map((task) => (
                  <div
                    key={`blocked-${task.id}`}
                    className="rounded-input bg-surface-page p-3"
                  >
                    <p className="font-heading text-[14px] font-semibold text-text-heading">
                      {task.title}
                    </p>
                    <p className="mt-1 font-body text-[12px] text-status-error">
                      {task.blockerReason || "Missing reason"}
                    </p>
                    {task.blockerNote ? (
                      <p className="mt-1 font-body text-[12px] text-text-muted">
                        {task.blockerNote}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3 px-4 py-4 sm:px-5">
              <SectionHeading
                title="Your Team"
                description={
                  viewModel.hasLivePresence
                    ? "Live presence stream"
                    : "Fallback roster (presence unavailable)"
                }
                action={
                  <span className="rounded-pill bg-primary-tint px-[10px] py-[2px] font-body text-[11px] font-semibold text-primary">
                    {viewModel.teamContext.length} members
                  </span>
                }
              />
              {viewModel.teamContext.length === 0 ? (
                <div className="rounded-input bg-surface-page px-4 py-6 text-center">
                  <Users className="mx-auto h-8 w-8 text-surface-border" />
                  <p className="mt-2 font-body text-[13px] text-text-muted">
                    No team context available.
                  </p>
                </div>
              ) : (
                viewModel.teamContext.slice(0, 6).map((member) => (
                  <div
                    key={`member-${member.id}`}
                    className="flex items-start justify-between gap-3 rounded-input bg-surface-page p-3"
                  >
                    <div>
                      <p className="font-body text-[13px] font-semibold text-text-heading">
                        {member.name}
                      </p>
                      <p className="font-body text-[12px] text-text-muted">
                        {member.role}
                      </p>
                      {member.statusText ? (
                        <p className="font-body text-[12px] text-text-muted">
                          {member.statusText}
                        </p>
                      ) : null}
                    </div>
                    <Badge
                      className={`${
                        member.isOnline
                          ? "bg-status-success/10 text-status-success"
                          : "bg-surface-page text-text-muted ring-1 ring-surface-border"
                      } rounded-pill border-0 px-[10px] py-[2px] font-body text-[11px] font-semibold`}
                    >
                      {member.isOnline ? "Online" : "Away"}
                    </Badge>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3 px-4 py-4 sm:px-5">
              <SectionHeading
                title="Coming Up"
                description="From your calendar timeline."
                action={
                  <span className="rounded-pill bg-primary-tint px-[10px] py-[2px] font-body text-[11px] font-semibold text-primary">
                    {viewModel.upcoming.length} events
                  </span>
                }
              />
              {viewModel.upcoming.length === 0 ? (
                <div className="rounded-input bg-surface-page px-4 py-6 text-center">
                  <Calendar className="mx-auto h-8 w-8 text-surface-border" />
                  <p className="mt-2 font-body text-[13px] text-text-muted">
                    No upcoming items in the next 2 weeks.
                  </p>
                </div>
              ) : (
                viewModel.upcoming.slice(0, 5).map((item) => (
                  <div
                    key={`agenda-${item.id}`}
                    className="rounded-input bg-surface-page p-3"
                  >
                    <p className="font-heading text-[14px] font-semibold text-text-heading">
                      {item.title}
                    </p>
                    <p className="mt-1 font-body text-[12px] text-text-body">
                      {formatWhen(item.at)}
                    </p>
                    <div className="mt-1 flex items-center gap-1 font-body text-[12px] text-text-muted">
                      <Clock className="h-4 w-4" />
                      {item.type}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <Dialog
        open={Boolean(blockerTask)}
        onOpenChange={(open) => (!open ? setBlockerTask(null) : null)}
      >
        <DialogContent className="rounded-card border border-surface-border bg-surface-card shadow-modal">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-bold text-text-heading">
              Report Blocker
            </DialogTitle>
            <DialogDescription className="font-body text-sm text-text-body">
              Add blocker details so {founderName} can help unblock this task
              quickly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-input border border-surface-border bg-surface-page p-4">
              <p className="font-heading text-base font-semibold text-text-heading">
                {blockerTask?.title || "Task"}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-body text-sm font-semibold text-text-heading">
                Reason
              </label>
              <Select value={blockerReason} onValueChange={setBlockerReason}>
                <SelectTrigger className="h-11 rounded-input border border-surface-border bg-surface-page font-body text-text-heading">
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
              <label className="font-body text-sm font-semibold text-text-heading">
                Details
              </label>
              <Textarea
                value={blockerNote}
                onChange={(event) => setBlockerNote(event.target.value)}
                placeholder="What is blocking progress and what do you need?"
                rows={4}
                className="min-h-[124px] rounded-input border border-surface-border bg-surface-page font-body text-text-heading placeholder:text-text-muted focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-pill border-surface-border bg-surface-page text-text-body hover:bg-primary-tint hover:text-primary"
              onClick={() => setBlockerTask(null)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-pill bg-primary text-white shadow-soft hover:bg-primary-hover"
              onClick={submitBlocker}
              disabled={blocking}
            >
              {blocking ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <MessageSquare className="mr-1.5 h-4 w-4" />
              )}
              Save Blocker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ExtraWorkLogDialog
        open={workLogOpen}
        mode={workLogMode}
        initialLog={activeWorkLog}
        saving={savingWorkLog}
        onOpenChange={(open) => {
          setWorkLogOpen(open);
          if (!open) setActiveWorkLog(null);
        }}
        onSubmit={handleWorkLogSubmit}
      />
    </div>
  );
}
