import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Progress } from "../ui/progress";
import { Checkbox } from "../ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Flag,
  UserPlus,
  ExternalLink,
  Users,
  UserCircle,
  Search,
  DollarSign,
  TrendingUp,
  Pencil,
  Plus,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import TaskAssignmentModal from "./TaskAssignmentModal";
import TaskIncentiveModal from "./TaskIncentiveModal";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

function taskPriority(task) {
  const p = String(task?.priority || "medium").toLowerCase();
  return PRIORITY_OPTIONS.some((o) => o.value === p) ? p : "medium";
}

function priorityFlagClass(p) {
  if (p === "high")
    return "text-primary-dark hover:bg-primary-tint hover:text-primary";
  if (p === "low")
    return "text-text-muted hover:bg-surface-page hover:text-text-heading";
  return "text-primary hover:bg-primary-tint hover:text-primary-dark";
}

/** Surfaces only — label color forced in CSS (see `.sv-priority-chip` in globals) so modal/theme tokens can’t turn it white */
function priorityBadgeClass(p) {
  if (p === "high")
    return "border-primary/30 bg-primary/10 font-semibold";
  if (p === "low")
    return "border-surface-border bg-surface-page font-medium";
  return "border-primary/30 bg-primary-tint font-semibold";
}

function priorityLabelFor(p) {
  const hit = PRIORITY_OPTIONS.find((o) => o.value === p);
  return hit?.label ?? "Medium";
}

/** Background tint per task status — avoids heavy per-row borders inside grouped lists */
function taskRowSurfaceClass(task) {
  if (task.status === "completed") return "bg-status-success/5";
  if (task.status === "blocked") return "bg-status-warning/10";
  if (task.status === "in-progress") return "bg-primary-tint/60";
  return "bg-surface-card";
}

function taskIdStr(t) {
  return String(t?.id ?? t?._id ?? "");
}

function cloneTaskList(list) {
  try {
    return structuredClone(list ?? []);
  } catch {
    return JSON.parse(JSON.stringify(list ?? []));
  }
}

function taskSignature(t) {
  return [
    taskIdStr(t),
    String(t.title || "").trim(),
    String(t.description || "").trim(),
    t.status,
    taskPriority(t),
    String(t.assignedTo ?? ""),
    t.assignedToName ?? "",
    t.assignedToAvatar ?? "",
    t.blockerReason ?? "",
    t.blockerNote ?? "",
  ].join("\u0001");
}

function cloneMilestoneRows(outcome) {
  const ms = Array.isArray(outcome?.milestones) ? outcome.milestones : [];
  return ms.map((m) => ({
    id: String(m.id ?? m._id ?? ""),
    title: String(m.title || ""),
    description: String(m.description || ""),
    sequence: m.sequence != null ? Number(m.sequence) : null,
  }));
}

function milestoneSignature(m) {
  return [
    String(m.id),
    String(m.title || "").trim(),
    String(m.description || "").trim(),
    String(m.sequence ?? ""),
  ].join("\u0001");
}

function initialsFromName(name) {
  const s = String(name || "?").trim();
  if (!s) return "?";
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function primaryAssigneeId(task) {
  const raw = task?.raw || {};
  const a = task?.assignedTo ?? raw.assignedTo;
  if (a == null || a === "") return "";
  if (typeof a === "object")
    return String(a._id || a.id || "").trim();
  return String(a).trim();
}

/** One or many assignees (primary fields + optional assignees[] on task/raw). */
function taskAssignees(task, roster = []) {
  const raw = task?.raw || {};
  const fromArray =
    task?.assignees || raw.assignees || raw.collaborators || raw.coAssignees;
  if (Array.isArray(fromArray) && fromArray.length > 0) {
    return fromArray.map((a, i) => ({
      id: String(a.id || a.userId || a._id || `co-${i}`),
      name: String(a.name || a.displayName || a.fullName || "").trim(),
      avatar: String(a.avatar || a.avatarUrl || a.image || "").trim(),
    }));
  }
  let id = primaryAssigneeId(task);
  let name = String(task?.assignedToName ?? raw.assignedToName ?? "").trim();
  let avatar = String(
    task?.assignedToAvatar ?? raw.assignedToAvatar ?? "",
  ).trim();
  const pop = task?.assignedTo ?? raw.assignedTo;
  if (typeof pop === "object" && pop && !name)
    name = String(pop.name || pop.displayName || "").trim();
  if (id && Array.isArray(roster)) {
    const hit = roster.find((m) => String(m.id) === String(id));
    if (hit) {
      if (!avatar) avatar = String(hit.avatar || "").trim();
      if (!name) name = String(hit.name || "").trim();
    }
  }
  if (!id && !name) return [];
  return [{ id: id || name, name: name || "Assignee", avatar }];
}

const ASSIGNEE_STACK_MAX = 4;

export default function MilestoneDetailView({
  isOpen,
  onClose,
  outcome,
  tasks,
  onCommitTaskDraft,
  onSetTaskIncentive,
  teamMembers,
  founderId,
  founderName,
  founderAvatar,
  onNavigate,
  onVirtualOfficeViewChange,
}) {
  const [expandedMilestones, setExpandedMilestones] = useState(new Set());
  const [blockingTaskId, setBlockingTaskId] = useState(null);
  const [blockReason, setBlockReason] = useState("");
  const [blockNote, setBlockNote] = useState("");
  const [assigningTaskId, setAssigningTaskId] = useState(null);
  const [incentiveTask, setIncentiveTask] = useState(null);
  const [baselineTasks, setBaselineTasks] = useState([]);
  const [draftTasks, setDraftTasks] = useState([]);
  const [baselineMilestones, setBaselineMilestones] = useState([]);
  const [draftMilestones, setDraftMilestones] = useState([]);
  const [editingMilestoneId, setEditingMilestoneId] = useState(null);
  const [newTaskTitleByMilestone, setNewTaskTitleByMilestone] = useState({});
  const [committing, setCommitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const prevIsOpen = useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      const snap = cloneTaskList(tasks);
      setBaselineTasks(snap);
      setDraftTasks(snap);
      const ms = cloneMilestoneRows(outcome);
      setBaselineMilestones(ms);
      setDraftMilestones(ms.map((m) => ({ ...m })));
      setEditingMilestoneId(null);
      setNewTaskTitleByMilestone({});
    }
    prevIsOpen.current = isOpen;
  }, [isOpen, tasks, outcome]);

  useEffect(() => {
    if (!isOpen) setDeleteConfirm(null);
  }, [isOpen]);

  const isDirty = useMemo(() => {
    if (draftMilestones.length !== baselineMilestones.length) return true;
    const baseM = new Map(
      baselineMilestones.map((m) => [String(m.id), milestoneSignature(m)]),
    );
    for (const m of draftMilestones) {
      if (baseM.get(String(m.id)) !== milestoneSignature(m)) return true;
    }
    if (baselineTasks.length !== draftTasks.length) return true;
    const baseSig = new Map(
      baselineTasks.map((t) => [taskIdStr(t), taskSignature(t)]),
    );
    for (const t of draftTasks) {
      if (baseSig.get(taskIdStr(t)) !== taskSignature(t)) return true;
    }
    return false;
  }, [baselineTasks, draftTasks, baselineMilestones, draftMilestones]);

  const assigneeRoster = useMemo(
    () => [
      {
        id: String(founderId || ""),
        name: String(founderName || ""),
        avatar: String(founderAvatar || "").trim(),
      },
      ...(Array.isArray(teamMembers) ? teamMembers : []).map((m) => ({
        id: String(m.id || ""),
        name: String(m.name || ""),
        avatar: String(
          m.avatar || m.profileImage || m.profilePicture || "",
        ).trim(),
      })),
    ],
    [founderId, founderName, founderAvatar, teamMembers],
  );

  const handleConfirm = async () => {
    if (!onCommitTaskDraft || !isDirty) return;
    try {
      setCommitting(true);
      await onCommitTaskDraft({
        baselineTasks,
        draftTasks,
        baselineMilestones,
        draftMilestones,
      });
      onClose();
    } catch {
      /* parent already toasts */
    } finally {
      setCommitting(false);
    }
  };

  const assigningTask = assigningTaskId
    ? draftTasks.find((t) => taskIdStr(t) === String(assigningTaskId))
    : null;

  const totalTasks = draftTasks.length;
  const completedTaskCount = draftTasks.filter(
    (t) => t.status === "completed",
  ).length;
  const overallProgressPct =
    totalTasks > 0 ? (completedTaskCount / totalTasks) * 100 : 0;

  const toggleMilestone = (milestoneId) => {
    const newExpanded = new Set(expandedMilestones);
    if (newExpanded.has(milestoneId)) {
      newExpanded.delete(milestoneId);
    } else {
      newExpanded.add(milestoneId);
    }
    setExpandedMilestones(newExpanded);
  };

  const getTasksForMilestone = (milestoneId) =>
    draftTasks.filter(
      (t) => String(t.milestoneId ?? "") === String(milestoneId ?? ""),
    );

  const deriveMilestoneStatus = (milestone, milestoneTasks) => {
    const n = milestoneTasks.length;
    const done = milestoneTasks.filter((t) => t.status === "completed").length;
    if (n === 0) return String(milestone.status || "pending").toLowerCase();
    if (done >= n) return "completed";
    if (done > 0) return "in-progress";
    return "pending";
  };

  const getMilestoneIcon = (rowStatus) => {
    if (rowStatus === "completed")
      return <CheckCircle2 className="h-4 w-4 shrink-0 text-status-success" />;
    if (rowStatus === "in-progress")
      return (
        <Circle className="h-4 w-4 shrink-0 fill-primary/20 text-primary" />
      );
    return <Circle className="h-4 w-4 shrink-0 text-text-muted" />;
  };

  const handleTaskCheckboxChange = (task, checked) => {
    if (checked === "indeterminate") return;
    const nextDone = Boolean(checked);
    setDraftTasks((prev) =>
      prev.map((row) =>
        taskIdStr(row) === taskIdStr(task)
          ? {
              ...row,
              status: nextDone ? "completed" : "pending",
              completedAt: nextDone ? new Date().toISOString() : null,
            }
          : row,
      ),
    );
  };

  const handleBlockTask = () => {
    if (blockingTaskId && blockReason) {
      setDraftTasks((prev) =>
        prev.map((row) =>
          taskIdStr(row) === String(blockingTaskId)
            ? {
                ...row,
                status: "blocked",
                blockerReason: blockReason,
                blockerNote: blockNote || "",
              }
            : row,
        ),
      );
      setBlockingTaskId(null);
      setBlockReason("");
      setBlockNote("");
    }
  };

  const blockerReasons = [
    {
      value: "scope",
      label: "Scope too large",
      description: "This task needs to be broken down",
    },
    {
      value: "unclear",
      label: "Unclear requirements",
      description: "I need more clarity on what to do",
    },
    {
      value: "dependency",
      label: "Blocked by dependency",
      description: "Waiting on another task or person",
    },
    {
      value: "skill-gap",
      label: "Skill gap",
      description: "I need help or training for this",
    },
  ];

  const addDraftTask = (milestone) => {
    const title = String(newTaskTitleByMilestone[milestone.id] ?? "").trim();
    if (!title) return;
    const id = `temp-task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setDraftTasks((prev) => [
      ...prev,
      {
        id,
        title,
        description: "",
        status: "pending",
        priority: "medium",
        milestoneId: String(milestone.id),
        milestoneName: String(milestone.title || "").trim(),
      },
    ]);
    setNewTaskTitleByMilestone((prev) => ({ ...prev, [milestone.id]: "" }));
  };

  const confirmPendingDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.kind === "milestone") {
      const mid = String(deleteConfirm.milestoneId);
      setDraftMilestones((prev) => prev.filter((m) => String(m.id) !== mid));
      setDraftTasks((prev) =>
        prev.filter((t) => String(t.milestoneId ?? "") !== mid),
      );
      setExpandedMilestones((prev) => {
        const next = new Set(prev);
        next.delete(mid);
        return next;
      });
      setNewTaskTitleByMilestone((prev) => {
        const next = { ...prev };
        delete next[mid];
        return next;
      });
      setEditingMilestoneId((cur) => (cur === mid ? null : cur));
    } else {
      const task = deleteConfirm.task;
      const tid = taskIdStr(task);
      setDraftTasks((prev) => prev.filter((row) => taskIdStr(row) !== tid));
      if (blockingTaskId === tid) {
        setBlockingTaskId(null);
        setBlockReason("");
        setBlockNote("");
      }
      if (assigningTaskId === tid) setAssigningTaskId(null);
    }
    setDeleteConfirm(null);
  };

  const milestoneCount = draftMilestones.length;

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open && !committing) onClose();
        }}
      >
        <DialogContent
          hideClose={committing}
          className="sv-modal-panel flex max-h-[min(90vh,880px)] w-[calc(100%-1.5rem)] max-w-none flex-col gap-0 overflow-hidden rounded-card border border-surface-border bg-surface-card p-0 shadow-modal sm:w-[60vw] sm:max-w-[56rem]"
        >
          <DialogHeader className="shrink-0 space-y-1 border-b border-surface-border bg-surface-page/60 px-5 py-4 pr-12 text-left sm:px-6">
            <DialogTitle className="font-heading text-[17px] font-semibold leading-snug tracking-tight text-text-heading sm:text-lg">
              {outcome?.title || "Weekly outcome"}
            </DialogTitle>
            <DialogDescription className="font-body text-[13px] text-text-muted">
              Week {outcome?.weekNumber ?? "—"} · {milestoneCount} milestones ·{" "}
              {draftTasks.length} tasks
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 scrollbar-thin scrollbar-thumb-surface-border scrollbar-track-transparent sm:px-6 sm:py-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="font-body text-[13px] font-medium text-text-heading">
                  Overall progress
                </span>
                <span className="font-body text-[13px] tabular-nums text-text-muted">
                  {completedTaskCount} / {totalTasks} tasks
                </span>
              </div>
              <Progress value={overallProgressPct} className="h-2" />
            </div>

            <div className="space-y-3">
              {draftMilestones.map((milestone) => {
                const milestoneTasks = getTasksForMilestone(milestone.id);
                const isExpanded = expandedMilestones.has(milestone.id);
                const completedTasks = milestoneTasks.filter(
                  (t) => t.status === "completed",
                ).length;
                const blockedTasks = milestoneTasks.filter(
                  (t) => t.status === "blocked",
                ).length;
                const rowStatus = deriveMilestoneStatus(
                  milestone,
                  milestoneTasks,
                );
                const nTasks = milestoneTasks.length;

                return (
                  <div
                    key={milestone.id}
                    className="overflow-hidden rounded-card border border-surface-border bg-surface-card shadow-soft"
                  >
                    <div
                      className={`px-3 py-3 sm:px-4 ${
                        rowStatus === "completed"
                          ? "bg-status-success/5"
                          : rowStatus === "in-progress"
                            ? "bg-primary-tint/40"
                            : "bg-surface-card"
                      }`}
                    >
                      <div className="flex min-w-0 items-start gap-2">
                        <button
                          type="button"
                          className="mt-0.5 shrink-0 rounded-input p-1 text-text-muted transition-colors hover:bg-primary-tint hover:text-primary"
                          onClick={() => toggleMilestone(milestone.id)}
                          aria-expanded={isExpanded}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          className="mt-0.5 shrink-0 text-left"
                          onClick={() => toggleMilestone(milestone.id)}
                        >
                          {getMilestoneIcon(rowStatus)}
                        </button>
                        <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                          <div
                            className="min-w-0 flex-1 cursor-pointer"
                            onClick={() => toggleMilestone(milestone.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                toggleMilestone(milestone.id);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                          >
                            {editingMilestoneId === milestone.id ? (
                              <Input
                                value={milestone.title}
                                onChange={(e) =>
                                  setDraftMilestones((prev) =>
                                    prev.map((m) =>
                                      String(m.id) === String(milestone.id)
                                        ? { ...m, title: e.target.value }
                                        : m,
                                    ),
                                  )
                                }
                                onBlur={() => setEditingMilestoneId(null)}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                  e.stopPropagation();
                                  if (e.key === "Enter")
                                    setEditingMilestoneId(null);
                                }}
                                className="h-9 font-heading text-sm font-semibold"
                                autoFocus
                              />
                            ) : (
                              <h4
                                className={`font-heading text-left text-[15px] font-semibold leading-snug ${
                                  rowStatus === "completed"
                                    ? "text-text-muted line-through"
                                    : "text-text-heading"
                                }`}
                              >
                                {milestone.title || "Untitled milestone"}
                              </h4>
                            )}
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-xs text-text-muted">
                              <span>
                                {completedTasks}/{nTasks} tasks
                              </span>
                              {blockedTasks > 0 && (
                                <span className="flex items-center gap-1 text-status-warning">
                                  <AlertCircle className="h-3.5 w-3.5" />
                                  {blockedTasks} blocked
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-0.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 text-text-muted hover:bg-primary-tint hover:text-text-heading"
                              disabled={committing}
                              aria-label="Edit milestone title"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingMilestoneId(milestone.id);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 text-text-muted hover:bg-destructive/10 hover:text-destructive"
                              disabled={committing}
                              aria-label="Delete milestone"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirm({
                                  kind: "milestone",
                                  milestoneId: String(milestone.id),
                                });
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-surface-border bg-surface-page/40 px-3 pb-3 pt-2 sm:px-4 sm:pb-4">
                        {milestoneTasks.length === 0 ? (
                          <p className="px-1 py-6 text-center font-body text-[13px] text-text-muted">
                            No tasks in this milestone yet. Add one below.
                          </p>
                        ) : (
                          <ul className="divide-y divide-surface-border overflow-hidden rounded-input border border-surface-border bg-surface-card">
                            {milestoneTasks.map((task) => {
                              const assignees = taskAssignees(
                                task,
                                assigneeRoster,
                              );
                              const p = taskPriority(task);
                              const pLabel = priorityLabelFor(p);
                              return (
                                <li
                                  key={taskIdStr(task)}
                                  role="presentation"
                                  onClick={(e) => e.stopPropagation()}
                                  className={`px-3 py-3 transition-colors sm:px-3.5 ${taskRowSurfaceClass(task)}`}
                                >
                                  <div className="flex min-w-0 items-start gap-3">
                                    <div className="flex shrink-0 items-center pt-0.5">
                                      <Checkbox
                                        checked={task.status === "completed"}
                                        onCheckedChange={(c) =>
                                          handleTaskCheckboxChange(task, c)
                                        }
                                        disabled={
                                          task.status === "blocked" ||
                                          committing
                                        }
                                      />
                                    </div>
                                    <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                                      <div className="min-w-0 flex-1">
                                        <div className="flex min-h-[22px] flex-wrap items-center gap-2">
                                          <span
                                            className={`font-body text-[14px] leading-snug text-text-heading ${
                                              task.status === "completed"
                                                ? "text-text-muted line-through"
                                                : ""
                                            }`}
                                          >
                                            {task.title}
                                          </span>
                                          <span
                                            data-priority={p}
                                            className={`sv-priority-chip inline-flex h-5 max-w-full shrink-0 items-center rounded-pill border px-2 font-body text-[11px] font-medium leading-none tracking-tight ${priorityBadgeClass(p)}`}
                                          >
                                            {pLabel}
                                          </span>
                                        </div>
                                        {task.description && (
                                          <p className="mt-1 font-body text-[13px] leading-relaxed text-text-muted">
                                            {task.description}
                                          </p>
                                        )}
                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                          {task.status === "blocked" &&
                                            task.blockerReason && (
                                              <Badge
                                                variant="outline"
                                                className="border-status-warning/40 bg-status-warning/10 font-body text-xs text-status-warning"
                                              >
                                                <AlertCircle className="mr-1 h-3 w-3" />
                                                {
                                                  blockerReasons.find(
                                                    (r) =>
                                                      r.value ===
                                                      task.blockerReason,
                                                  )?.label
                                                }
                                              </Badge>
                                            )}
                                          {task.status === "in-progress" && (
                                            <Badge
                                              variant="outline"
                                              className="border-primary/25 bg-primary-tint font-body text-xs text-primary-dark"
                                            >
                                              In Progress
                                            </Badge>
                                          )}
                                          {task.incentive &&
                                            task.incentive.type !==
                                              "unpaid" && (
                                              <Badge
                                                variant="outline"
                                                className="border-status-success/35 bg-status-success/10 font-body text-xs text-status-success"
                                              >
                                                {task.incentive.type ===
                                                  "equity" && (
                                                  <>
                                                    <TrendingUp className="mr-1 h-3 w-3" />
                                                    {task.incentive.equity}
                                                  </>
                                                )}
                                                {task.incentive.type ===
                                                  "paid" && (
                                                  <>
                                                    <DollarSign className="mr-1 h-3 w-3" />
                                                    {task.incentive.pay}
                                                  </>
                                                )}
                                                {task.incentive.type ===
                                                  "hourly" && (
                                                  <>
                                                    <Clock className="mr-1 h-3 w-3" />
                                                    {
                                                      task.incentive
                                                        .hourlyRate
                                                    }
                                                  </>
                                                )}
                                              </Badge>
                                            )}
                                        </div>
                                        {task.status === "blocked" &&
                                          task.blockerNote && (
                                            <div className="mt-2 rounded-input border border-status-warning/25 bg-status-warning/10 px-3 py-2">
                                              <p className="font-body text-[13px] text-text-heading">
                                                {task.blockerNote}
                                              </p>
                                            </div>
                                          )}
                                        {task.actionButton &&
                                          task.status !== "completed" && (
                                            <div className="mt-3">
                                              <Button
                                                size="sm"
                                                variant="default"
                                                className="w-full bg-primary font-body hover:bg-primary-hover sm:w-auto"
                                                onClick={() => {
                                                  if (
                                                    task.actionButton?.route
                                                  ) {
                                                    if (
                                                      task.actionButton
                                                        .route ===
                                                      "startup-office"
                                                    ) {
                                                      if (onNavigate)
                                                        onNavigate(
                                                          "startup-office",
                                                        );
                                                      if (
                                                        onVirtualOfficeViewChange
                                                      )
                                                        onVirtualOfficeViewChange(
                                                          "matching",
                                                        );
                                                    } else if (
                                                      task.actionButton
                                                        .route === "team"
                                                    ) {
                                                      if (onNavigate)
                                                        onNavigate(
                                                          "startup-office",
                                                        );
                                                      if (
                                                        onVirtualOfficeViewChange
                                                      )
                                                        onVirtualOfficeViewChange(
                                                          "workspace",
                                                        );
                                                    } else if (onNavigate) {
                                                      onNavigate(
                                                        task.actionButton
                                                          .route,
                                                      );
                                                    } else {
                                                      window.location.href =
                                                        task.actionButton.route;
                                                    }
                                                    onClose();
                                                  }
                                                }}
                                              >
                                                {task.actionButton.icon ===
                                                  "search" && (
                                                  <Search className="mr-2 h-4 w-4" />
                                                )}
                                                {task.actionButton.icon ===
                                                  "users" && (
                                                  <Users className="mr-2 h-4 w-4" />
                                                )}
                                                {task.actionButton.icon ===
                                                  "user" && (
                                                  <UserCircle className="mr-2 h-4 w-4" />
                                                )}
                                                {!task.actionButton.icon && (
                                                  <ExternalLink className="mr-2 h-4 w-4" />
                                                )}
                                                {task.actionButton.label}
                                              </Button>
                                            </div>
                                          )}
                                      </div>
                                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-0.5">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className={`h-8 w-8 shrink-0 p-0 ${priorityFlagClass(p)}`}
                                              aria-label="Set priority"
                                              disabled={committing}
                                            >
                                              <Flag className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            {PRIORITY_OPTIONS.map((opt) => (
                                              <DropdownMenuItem
                                                key={opt.value}
                                                onClick={() =>
                                                  setDraftTasks((prev) =>
                                                    prev.map((row) =>
                                                      taskIdStr(row) ===
                                                      taskIdStr(task)
                                                        ? {
                                                            ...row,
                                                            priority:
                                                              opt.value,
                                                          }
                                                        : row,
                                                    ),
                                                  )
                                                }
                                              >
                                                {opt.label}
                                                {p === opt.value
                                                  ? " (current)"
                                                  : ""}
                                              </DropdownMenuItem>
                                            ))}
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                        {task.status !== "completed" &&
                                          (task.status === "blocked" ? (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-8 border-surface-border font-body text-xs"
                                              disabled={committing}
                                              onClick={() =>
                                                setDraftTasks((prev) =>
                                                  prev.map((row) =>
                                                    taskIdStr(row) ===
                                                    taskIdStr(task)
                                                      ? {
                                                          ...row,
                                                          status: "pending",
                                                          blockerReason: null,
                                                          blockerNote: null,
                                                        }
                                                      : row,
                                                  ),
                                                )
                                              }
                                            >
                                              Unblock
                                            </Button>
                                          ) : (
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-8 w-8 p-0 text-status-warning hover:bg-status-warning/10"
                                              aria-label="Report blocker"
                                              disabled={committing}
                                              onClick={() =>
                                                setBlockingTaskId(
                                                  taskIdStr(task),
                                                )
                                              }
                                            >
                                              <AlertCircle className="h-4 w-4" />
                                            </Button>
                                          ))}
                                        {assignees.length > 0 && (
                                          <div
                                            className="flex shrink-0 flex-row items-center -space-x-2 pr-0.5"
                                            aria-label={`Assigned: ${assignees
                                              .map((a) => a.name)
                                              .filter(Boolean)
                                              .join(", ")}`}
                                          >
                                            {assignees
                                              .slice(0, ASSIGNEE_STACK_MAX)
                                              .map((person, idx) => (
                                                <span
                                                  key={person.id}
                                                  className="inline-flex"
                                                  style={{ zIndex: idx + 1 }}
                                                  title={
                                                    person.name || undefined
                                                  }
                                                >
                                                  <Avatar className="h-7 w-7 border-2 border-surface-card bg-surface-page shadow-soft">
                                                    {person.avatar ? (
                                                      <AvatarImage
                                                        src={person.avatar}
                                                        alt=""
                                                      />
                                                    ) : null}
                                                    <AvatarFallback className="font-body text-[10px] font-medium text-text-body">
                                                      {initialsFromName(
                                                        person.name,
                                                      )}
                                                    </AvatarFallback>
                                                  </Avatar>
                                                </span>
                                              ))}
                                            {assignees.length >
                                              ASSIGNEE_STACK_MAX && (
                                              <span
                                                className="inline-flex"
                                                style={{
                                                  zIndex:
                                                    ASSIGNEE_STACK_MAX + 2,
                                                }}
                                                title={`${assignees.length - ASSIGNEE_STACK_MAX} more`}
                                              >
                                                <Avatar className="h-7 w-7 border-2 border-surface-card bg-surface-page text-text-heading shadow-soft">
                                                  <AvatarFallback className="px-0 font-body text-[10px] font-semibold tabular-nums">
                                                    +
                                                    {assignees.length -
                                                      ASSIGNEE_STACK_MAX}
                                                  </AvatarFallback>
                                                </Avatar>
                                              </span>
                                            )}
                                          </div>
                                        )}
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                          disabled={committing}
                                          aria-label="Delete task"
                                          onClick={() =>
                                            setDeleteConfirm({
                                              kind: "task",
                                              task,
                                            })
                                          }
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                        {task.status !== "completed" && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0 text-text-muted hover:bg-primary-tint hover:text-primary"
                                            disabled={committing}
                                            onClick={() =>
                                              setAssigningTaskId(
                                                taskIdStr(task),
                                              )
                                            }
                                            aria-label="Assign task"
                                          >
                                            <UserPlus className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                        <div
                          role="presentation"
                          onClick={(e) => e.stopPropagation()}
                          className="mt-3 flex flex-col gap-2 sm:flex-row"
                        >
                          <Input
                            placeholder="Add a task…"
                            value={newTaskTitleByMilestone[milestone.id] ?? ""}
                            onChange={(e) =>
                              setNewTaskTitleByMilestone((prev) => ({
                                ...prev,
                                [milestone.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addDraftTask(milestone);
                              }
                            }}
                            className="h-9 flex-1 font-body text-sm"
                            disabled={committing}
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-9 shrink-0 border border-surface-border bg-surface-card font-body text-[13px] hover:bg-primary-tint sm:w-auto"
                            disabled={
                              committing ||
                              !String(
                                newTaskTitleByMilestone[milestone.id] ?? "",
                              ).trim()
                            }
                            onClick={() => addDraftTask(milestone)}
                          >
                            <Plus className="h-4 w-4 sm:mr-1.5" />
                            <span className="hidden sm:inline">Add task</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 w-full rounded-input border-dashed border-surface-border font-body text-[13px] text-primary hover:border-primary/40 hover:bg-primary-tint"
                disabled={committing}
                onClick={() => {
                  const newId = `temp-ms-${Date.now()}`;
                  setDraftMilestones((prev) => [
                    ...prev,
                    {
                      id: newId,
                      title: "New milestone",
                      description: "",
                      sequence: prev.length + 1,
                    },
                  ]);
                  setExpandedMilestones((prev) => {
                    const next = new Set(prev);
                    next.add(newId);
                    return next;
                  });
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add milestone
              </Button>
            </div>
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-surface-border bg-surface-page/50 px-5 py-3.5 sm:flex-row sm:justify-end sm:px-6">
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-input border-surface-border font-body text-[13px] font-semibold hover:bg-primary-tint"
              onClick={onClose}
              disabled={committing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="h-9 rounded-input bg-primary font-body text-[13px] font-semibold shadow-soft hover:bg-primary-hover"
              onClick={handleConfirm}
              disabled={
                !isDirty ||
                committing ||
                typeof onCommitTaskDraft !== "function"
              }
            >
              {committing ? "Saving..." : "Confirm changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isOpen && blockingTaskId && (
        <div className="sv-modal-backdrop fixed inset-0 z-[60] flex items-center justify-center p-4">
          <Card className="sv-modal-panel w-full rounded-card border border-surface-border shadow-modal sm:max-w-lg">
            <CardHeader className="border-b border-surface-border pb-3 pt-4">
              <CardTitle className="flex items-center gap-2 font-heading text-base text-text-heading">
                <AlertCircle className="h-5 w-5 text-status-warning" />
                Report Task Blocker
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                {blockerReasons.map((reason) => (
                  <button
                    key={reason.value}
                    type="button"
                    className={`w-full cursor-pointer rounded-input border p-3 text-left transition-colors ${
                      blockReason === reason.value
                        ? "border-primary bg-primary-tint"
                        : "border-surface-border hover:border-primary/40 hover:bg-surface-page"
                    }`}
                    onClick={() => setBlockReason(reason.value)}
                  >
                    <p className="font-body text-sm font-medium text-text-heading">
                      {reason.label}
                    </p>
                    <p className="mt-0.5 font-body text-xs text-text-muted">
                      {reason.description}
                    </p>
                  </button>
                ))}
              </div>
              <div>
                <label className="mb-2 block font-body text-sm font-medium text-text-heading">
                  Additional details (optional)
                </label>
                <textarea
                  value={blockNote}
                  onChange={(e) => setBlockNote(e.target.value)}
                  placeholder="Provide more context..."
                  className="min-h-[72px] w-full rounded-input border border-surface-border bg-surface-card p-3 font-body text-sm text-text-body outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setBlockingTaskId(null);
                    setBlockReason("");
                    setBlockNote("");
                  }}
                  className="flex-1 border-surface-border font-body"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBlockTask}
                  disabled={!blockReason}
                  className="flex-1 bg-primary font-body hover:bg-primary-hover"
                >
                  Report Blocker
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isOpen && assigningTask && (
        <TaskAssignmentModal
          isOpen={!!assigningTask}
          onClose={() => setAssigningTaskId(null)}
          task={assigningTask}
          teamMembers={teamMembers}
          founderId={founderId}
          founderName={founderName}
          founderAvatar={founderAvatar}
          onAssign={(taskId, assignedTo, assignedToName, assignedToAvatar) => {
            const tid = String(taskId ?? "").trim();
            setDraftTasks((prev) =>
              prev.map((row) =>
                taskIdStr(row) === tid
                  ? {
                      ...row,
                      assignedTo,
                      assignedToName,
                      assignedToAvatar,
                    }
                  : row,
              ),
            );
          }}
        />
      )}

      {isOpen && incentiveTask && (
        <TaskIncentiveModal
          isOpen={!!incentiveTask}
          onClose={() => setIncentiveTask(null)}
          task={incentiveTask}
          onIncentiveSet={(incentive) => {
            if (incentiveTask && onSetTaskIncentive) {
              onSetTaskIncentive(taskIdStr(incentiveTask), incentive);
            }
          }}
        />
      )}

      {isOpen && deleteConfirm && (
        <div
          className="sv-modal-backdrop fixed inset-0 z-[70] flex items-center justify-center p-3"
          role="presentation"
          onClick={() => !committing && setDeleteConfirm(null)}
        >
          <Card
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-confirm-title"
            aria-describedby="delete-confirm-desc"
            className="sv-modal-panel w-full max-w-[min(100%,22rem)] overflow-hidden rounded-card border border-surface-border shadow-modal sm:max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 pb-1 pt-4">
              <div className="flex gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive"
                  aria-hidden
                >
                  <AlertTriangle className="h-5 w-5" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <h3
                    id="delete-confirm-title"
                    className="font-heading text-[15px] font-semibold leading-snug text-text-heading"
                  >
                    {deleteConfirm.kind === "milestone"
                      ? "Delete milestone?"
                      : "Remove this task?"}
                  </h3>
                  <p
                    id="delete-confirm-desc"
                    className="font-body text-[13px] leading-relaxed text-text-body"
                  >
                    {deleteConfirm.kind === "milestone"
                      ? "This removes the milestone and every task under it. You can’t undo this after you save your week plan."
                      : "This removes the task from your draft only. Nothing is sent to the server until you tap Confirm changes."}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 border-t border-surface-border px-4 py-3 sm:flex-row sm:justify-end sm:gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={committing}
                className="order-2 w-full border-surface-border bg-surface-card font-body font-semibold hover:bg-primary-tint sm:order-1 sm:w-auto"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={committing}
                className="order-1 w-full font-body font-semibold sm:order-2 sm:w-auto"
                onClick={confirmPendingDelete}
              >
                {deleteConfirm.kind === "milestone"
                  ? "Delete milestone"
                  : "Remove task"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
