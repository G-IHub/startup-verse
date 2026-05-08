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
  if (status === "completed") return "bg-[#d1fae5] text-[#00c896]";
  if (status === "in-progress") return "bg-[#e8ebff] text-[#3a5afe]";
  if (status === "blocked") return "bg-[#fff1f2] text-[#ff4f6b]";
  return "bg-[#e8ebff] text-[#3a5afe]";
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
  const firstName = String(user?.name || "there").trim().split(" ")[0] || "there";
  const panelClassName =
    "rounded-[14px] border-0 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]";
  const metricCards = [
    {
      id: "total",
      label: "Total",
      value: viewModel.tasks.length,
      note: "Assigned this cycle",
      icon: Calendar,
      iconClassName: "bg-[#e8ebff] text-[#3a5afe]",
    },
    {
      id: "progress",
      label: "In Progress",
      value: viewModel.metrics.inProgress,
      note: "Tasks currently moving",
      icon: Clock,
      iconClassName: "bg-[#e8ebff] text-[#3a5afe]",
    },
    {
      id: "completed",
      label: "Completed",
      value: viewModel.metrics.completed,
      note: "Done this cycle",
      icon: CheckCircle2,
      iconClassName: "bg-[#d1fae5] text-[#00c896]",
    },
    {
      id: "blocked",
      label: "Blocked",
      value: viewModel.metrics.blocked,
      note: "Needs founder support",
      icon: ShieldAlert,
      iconClassName: "bg-[#fff1f2] text-[#ff4f6b]",
    },
  ];

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
    <div className="space-y-4 bg-[#f4f5ff] py-3 pb-20">
      <section className="rounded-[14px] bg-[linear-gradient(135deg,#3a5afe_0%,#7c4dff_100%)] px-4 py-5 shadow-[0_4px_24px_rgba(58,90,254,0.18)] md:px-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-1.5">
            <p className="font-body text-[13px] font-normal text-[rgba(255,255,255,0.70)]">
              {viewModel.todayLabel}
            </p>
            <div className="space-y-1">
              <h2 className="font-heading text-[22px] font-bold leading-tight text-white">
                Welcome back, {firstName}
              </h2>
              <p className="max-w-2xl font-body text-[13px] text-[rgba(255,255,255,0.80)]">
                {viewModel.activeTasks.length > 0
                  ? `You have ${viewModel.activeTasks.length} active task${viewModel.activeTasks.length === 1 ? "" : "s"} in motion today. Keep progress visible and flag blockers early.`
                  : "You are fully caught up for now. Stay aligned with the team through quick check-ins and upcoming updates."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, index) => (
              <Button
                key={action.id}
                variant="outline"
                className={`${index === 0 ? "border-white bg-white text-[#3a5afe] hover:bg-[#e8ebff]" : "border-[1.5px] border-[rgba(255,255,255,0.40)] bg-transparent text-white hover:bg-[rgba(255,255,255,0.12)]"} rounded-[10px] px-3 text-[13px] font-semibold shadow-none [transition:all_0.2s_ease]`}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {error ? (
        <Card className="border-0 bg-[#fff7e8] shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <CardContent className="flex items-center justify-between gap-3 py-3">
            <p className="font-body text-sm text-[#9a5b00]">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-0 bg-white text-[#9a5b00] shadow-sm hover:bg-[#fffaf0]"
              onClick={() => refresh()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.id} className={panelClassName}>
              <CardContent className="flex items-center gap-3 p-4 sm:px-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${metric.iconClassName}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-body text-[11px] font-medium uppercase tracking-[0.08em] text-[#a0a0b0]">
                    {metric.label}
                  </p>
                  <div className="mt-1 flex items-end gap-2">
                    <span className="font-heading text-[28px] font-extrabold leading-none text-[#0d0d0d]">
                      {metric.value}
                    </span>
                    {metric.id === "total" ? (
                      <span className="pb-1 font-body text-[12px] font-normal text-[#a0a0b0]">
                        tasks
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1.5 font-body text-[12px] text-[#a0a0b0]">
                    {metric.note}
                  </p>
                  {metric.id === "total" ? (
                    <div className="mt-3">
                      <Progress
                        value={viewModel.metrics.completionRate}
                        className="h-1 border-0 bg-[#e2e4f0] [&_[data-slot=progress-indicator]]:bg-[linear-gradient(90deg,#3a5afe_0%,#7c4dff_100%)]"
                      />
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <Card className={`${panelClassName} lg:col-span-2`}>
          <CardHeader className="px-4 pt-4 sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="font-heading text-[18px] font-semibold text-[#0d0d0d]">
                  Active Tasks
                </CardTitle>
                <CardDescription className="mt-1 font-body text-[13px] font-normal text-[#4a4a5a]">
                  Move tasks through pending, in progress, blocked, and completed states.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-[10px] border border-[#e2e4f0] bg-[#f4f5ff] px-3 text-[13px] font-semibold text-[#3a5afe] hover:border-[#3a5afe] hover:bg-[#e8ebff] [transition:all_0.2s_ease]"
                onClick={() => onNavigate?.("startup-office")}
              >
                <Building className="mr-1.5 h-4 w-4" />
                Open Workspace
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4 pt-0 sm:px-5">
            {viewModel.tasks.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[10px] bg-[#f4f5ff] px-6 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#dcfce9] text-[#12a150]">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <p className="mt-4 font-heading text-[22px] font-bold text-[#0d0d0d]">
                  All caught up
                </p>
                <p className="mt-2 max-w-md font-body text-[13px] text-[#a0a0b0]">
                  New assignments will appear here automatically.
                </p>
              </div>
            ) : (
              viewModel.tasks.map((task) => (
                <div key={task.id} className="rounded-[12px] bg-[#f4f5ff] p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-heading text-[14px] font-semibold text-[#0d0d0d]">{task.title}</p>
                      <p className="font-body text-[12px] text-[#a0a0b0]">{task.description || "No description provided"}</p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Badge className={`${statusTone(task.status)} rounded-full border-0 px-[10px] py-[2px] font-body text-[11px] font-semibold capitalize`}>
                          {task.status}
                        </Badge>
                        <span className="inline-flex items-center gap-1 font-body text-[12px] text-[#a0a0b0]">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatWhen(task.dueDate)}
                        </span>
                      </div>
                      {task.status === "blocked" && (task.blockerReason || task.blockerNote) ? (
                        <div className="mt-2 rounded-[10px] bg-[#fff1f2] p-3 font-body text-[12px] text-[#ff4f6b]">
                          <p className="font-semibold">{task.blockerReason || "Blocked"}</p>
                          {task.blockerNote ? <p>{task.blockerNote}</p> : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {task.status === "pending" ? (
                        <>
                          <Button
                            size="sm"
                            className="rounded-full bg-[#f4f5ff] text-[12px] font-semibold text-[#4a4a5a] ring-1 ring-[#e2e4f0] hover:text-[#3a5afe] hover:ring-[#3a5afe] [transition:all_0.2s_ease]"
                            onClick={() => handleTaskChange(task, "in-progress")}
                            disabled={updatingTaskId === task.id}
                          >
                            <PlayCircle className="mr-1.5 h-4 w-4" />
                            Start
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full border-0 bg-[#fff1f2] text-[12px] font-semibold text-[#ff4f6b] hover:bg-[#ff4f6b] hover:text-white [transition:all_0.2s_ease]"
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
                            className="rounded-full border-0 bg-[#d1fae5] text-[12px] font-semibold text-[#00c896] hover:bg-[#00c896] hover:text-white [transition:all_0.2s_ease]"
                            onClick={() => handleTaskChange(task, "completed")}
                            disabled={updatingTaskId === task.id}
                          >
                            <CheckCircle2 className="mr-1.5 h-4 w-4" />
                            Complete
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full border-0 bg-[#fff1f2] text-[12px] font-semibold text-[#ff4f6b] hover:bg-[#ff4f6b] hover:text-white [transition:all_0.2s_ease]"
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
                          className="rounded-full bg-[#f4f5ff] text-[12px] font-semibold text-[#4a4a5a] ring-1 ring-[#e2e4f0] hover:text-[#3a5afe] hover:ring-[#3a5afe] [transition:all_0.2s_ease]"
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
                        className="rounded-full border border-[#e2e4f0] bg-[#f4f5ff] text-[12px] font-semibold text-[#4a4a5a] hover:border-[#3a5afe] hover:text-[#3a5afe] [transition:all_0.2s_ease]"
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
          <Card className={panelClassName}>
            <CardHeader className="px-4 pt-4 sm:px-5">
              <CardTitle className="font-heading text-[18px] font-semibold text-[#0d0d0d]">Daily Check-In</CardTitle>
              <CardDescription className="font-body text-[13px] text-[#4a4a5a]">Share your current focus and availability with the team.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4 pt-0 sm:px-5">
              <div className="space-y-1.5">
                <label className="font-body text-[13px] font-medium text-[#0d0d0d]">Status</label>
                <Select value={checkInStatus} onValueChange={setCheckInStatus}>
                  <SelectTrigger className="h-10 rounded-[10px] border-[1.5px] border-[#e2e4f0] bg-white font-body text-[13px] text-[#0d0d0d] [&_svg]:text-[#4a4a5a] focus:ring-0 focus:ring-offset-0 focus-visible:border-[#3a5afe] focus-visible:shadow-[0_0_0_3px_rgba(58,90,254,0.10)] [transition:all_0.2s_ease]">
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
                <label className="font-body text-[13px] font-medium text-[#0d0d0d]">Check-in note</label>
                <Textarea
                  value={checkInNote}
                  onChange={(event) => setCheckInNote(event.target.value)}
                  placeholder="What are you working on right now?"
                  rows={4}
                  className="min-h-[112px] rounded-[10px] border-[1.5px] border-[#e2e4f0] bg-white font-body text-[13px] text-[#0d0d0d] placeholder:text-[#a0a0b0] focus-visible:border-[#3a5afe] focus-visible:ring-[3px] focus-visible:ring-[rgba(58,90,254,0.10)] [transition:all_0.2s_ease]"
                />
              </div>

              <Button
                className="h-10 w-full rounded-[10px] bg-[linear-gradient(135deg,#3a5afe_0%,#7c4dff_100%)] font-body text-[14px] font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.22)] hover:opacity-90 [transition:all_0.2s_ease]"
                onClick={handleCheckInSave}
                disabled={savingCheckIn}
              >
                {savingCheckIn ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                Save Check-In
              </Button>
            </CardContent>
          </Card>

          <Card className={panelClassName}>
            <CardHeader className="px-4 pt-4 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="font-heading text-[16px] font-semibold text-[#0d0d0d]">Blockers Needing Help</CardTitle>
                  <CardDescription className="font-body text-[13px] text-[#4a4a5a]">Escalated items that need support.</CardDescription>
                </div>
                <span className="rounded-full bg-[#fff1f2] px-[10px] py-[2px] font-body text-[11px] font-semibold text-[#ff4f6b]">
                  {viewModel.blockedTasks.length} active
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4 pt-0 sm:px-5">
              {viewModel.blockedTasks.length === 0 ? (
                <div className="rounded-[10px] bg-[#f4f5ff] px-4 py-7 text-center">
                  <p className="font-body text-[13px] text-[#a0a0b0]">No active blockers right now.</p>
                </div>
              ) : (
                viewModel.blockedTasks.map((task) => (
                  <div key={`blocked-${task.id}`} className="rounded-[10px] bg-[#f4f5ff] p-3">
                    <p className="font-heading text-[14px] font-semibold text-[#0d0d0d]">{task.title}</p>
                    <p className="mt-1 font-body text-[12px] text-[#ff4f6b]">
                      {task.blockerReason || "Missing reason"}
                    </p>
                    {task.blockerNote ? (
                      <p className="mt-1 font-body text-[12px] text-[#a0a0b0]">{task.blockerNote}</p>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className={panelClassName}>
            <CardHeader className="px-4 pt-4 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="font-heading text-[16px] font-semibold text-[#0d0d0d]">Your Team</CardTitle>
                  <CardDescription className="font-body text-[13px] text-[#4a4a5a]">
                {viewModel.hasLivePresence
                  ? "Live presence stream"
                  : "Fallback roster (presence unavailable)"}
                  </CardDescription>
                </div>
                <span className="rounded-full bg-[#e8ebff] px-[10px] py-[2px] font-body text-[11px] font-semibold text-[#3a5afe]">
                  {viewModel.teamContext.length} members
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4 pt-0 sm:px-5">
              {viewModel.teamContext.length === 0 ? (
                <div className="rounded-[10px] bg-[#f4f5ff] px-4 py-7 text-center">
                  <Users className="mx-auto h-10 w-10 text-[#c4cada]" />
                  <p className="mt-3 font-body text-[13px] text-[#a0a0b0]">No team context available.</p>
                </div>
              ) : (
                viewModel.teamContext.slice(0, 6).map((member) => (
                  <div key={`member-${member.id}`} className="flex items-start justify-between gap-3 rounded-[10px] bg-[#f4f5ff] p-3">
                    <div>
                      <p className="font-body text-[13px] font-semibold text-[#0d0d0d]">{member.name}</p>
                      <p className="font-body text-[12px] text-[#a0a0b0]">{member.role}</p>
                      {member.statusText ? (
                        <p className="font-body text-[12px] text-[#a0a0b0]">{member.statusText}</p>
                      ) : null}
                    </div>
                    <Badge
                      className={`${member.isOnline ? "bg-[#d1fae5] text-[#00c896]" : "bg-[#eef2ff] text-[#6d7690]"} rounded-full border-0 px-[10px] py-[2px] font-body text-[11px] font-semibold`}
                    >
                      {member.isOnline ? "Online" : "Away"}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className={panelClassName}>
            <CardHeader className="px-4 pt-4 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="font-heading text-[16px] font-semibold text-[#0d0d0d]">Coming Up</CardTitle>
                  <CardDescription className="font-body text-[13px] text-[#4a4a5a]">From your calendar timeline.</CardDescription>
                </div>
                <span className="rounded-full bg-[#e8ebff] px-[10px] py-[2px] font-body text-[11px] font-semibold text-[#3a5afe]">
                  {viewModel.upcoming.length} events
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4 pt-0 sm:px-5">
              {viewModel.upcoming.length === 0 ? (
                <div className="rounded-[10px] bg-[#f4f5ff] px-4 py-7 text-center">
                  <Calendar className="mx-auto h-9 w-9 text-[#e2e4f0]" />
                  <p className="mt-3 font-body text-[13px] text-[#a0a0b0]">No upcoming items in the next 2 weeks.</p>
                </div>
              ) : (
                viewModel.upcoming.slice(0, 5).map((item) => (
                  <div key={`agenda-${item.id}`} className="rounded-[10px] bg-[#f4f5ff] p-3">
                    <p className="font-heading text-[14px] font-semibold text-[#0d0d0d]">{item.title}</p>
                    <p className="mt-1 font-body text-[12px] text-[#4a4a5a]">{formatWhen(item.at)}</p>
                    <div className="mt-1 flex items-center gap-1 font-body text-[12px] text-[#a0a0b0]">
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
        <DialogContent className="rounded-[28px] border-0 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl font-bold text-[#0d0d0d]">Report Blocker</DialogTitle>
            <DialogDescription className="font-body text-sm text-[#4a4a5a]">
              Add blocker details so {founderName || "your founder"} can help unblock this task quickly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-2xl bg-[#f6f8ff] p-4 ring-1 ring-[#e7ebf5]">
              <p className="font-heading text-base font-semibold text-[#0d0d0d]">{blockerTask?.title || "Task"}</p>
            </div>

            <div className="space-y-1.5">
              <label className="font-body text-sm font-semibold text-[#23304a]">Reason</label>
              <Select value={blockerReason} onValueChange={setBlockerReason}>
                <SelectTrigger className="h-12 rounded-2xl border-0 bg-[#f6f8ff] font-body text-[#0d0d0d] ring-1 ring-[#e5e9f5]">
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
              <label className="font-body text-sm font-semibold text-[#23304a]">Details</label>
              <Textarea
                value={blockerNote}
                onChange={(event) => setBlockerNote(event.target.value)}
                placeholder="What is blocking progress and what do you need?"
                rows={4}
                className="min-h-[124px] rounded-2xl border-0 bg-[#f6f8ff] font-body text-[#0d0d0d] placeholder:text-[#98a1b5] ring-1 ring-[#e5e9f5] focus-visible:ring-2 focus-visible:ring-[#d9e2ff]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-full border-0 bg-[#eef2ff] text-[#4a4a5a] hover:bg-[#e3e9ff]"
              onClick={() => setBlockerTask(null)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-full bg-[#3a5afe] text-white shadow-[0_12px_24px_rgba(58,90,254,0.18)] hover:bg-[#2f4cf0]"
              onClick={submitBlocker}
              disabled={blocking}
            >
              {blocking ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-1.5 h-4 w-4" />}
              Save Blocker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
