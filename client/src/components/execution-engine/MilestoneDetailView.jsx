import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
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
  X,
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
    return "text-[color:var(--primary-dark)] hover:bg-primary/10 hover:text-primary";
  if (p === "low")
    return "text-muted-foreground hover:bg-muted/70 hover:text-foreground";
  return "text-primary hover:bg-primary/10 hover:text-[color:var(--primary-dark)]";
}

/** Surfaces only — label color forced in CSS (see `.sv-priority-chip` in globals) so modal/theme tokens can’t turn it white */
function priorityBadgeClass(p) {
  if (p === "high")
    return "border-primary/35 bg-primary/12 font-semibold dark:border-primary/45 dark:bg-primary/22";
  if (p === "low")
    return "border-border/90 bg-muted/50 font-medium dark:bg-muted/40";
  return "border-primary/35 bg-[#e8ebff] font-semibold dark:border-primary/40 dark:bg-primary/18";
}

function priorityLabelFor(p) {
  const hit = PRIORITY_OPTIONS.find((o) => o.value === p);
  return hit?.label ?? "Medium";
}

/** Background tint per task status — avoids heavy per-row borders inside grouped lists */
function taskRowSurfaceClass(task) {
  if (task.status === "completed")
    return "bg-emerald-50/50 dark:bg-emerald-950/25";
  if (task.status === "blocked")
    return "bg-orange-50/35 dark:bg-orange-950/15";
  if (task.status === "in-progress")
    return "bg-primary/[0.06] dark:bg-primary/[0.09]";
  return "";
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

  if (!isOpen) return null;

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
      return <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />;
    if (rowStatus === "in-progress")
      return (
        <Circle className="h-4 w-4 shrink-0 fill-primary/20 text-primary" />
      );
    return <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sv-modal-backdrop">
      <Card className="sv-modal-panel max-h-[82vh] w-full max-w-[min(100%,26rem)] overflow-y-auto rounded-[14px] border-0 shadow-modal sm:max-w-[28rem]">
        <CardHeader className="flex-shrink-0 border-b border-primary/12 pb-2 pt-3 dark:border-primary/18">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold leading-snug md:text-[15px]">
                {outcome.title}
              </CardTitle>
              <CardDescription className="mt-0.5 text-[11px] text-text-muted md:text-xs">
                {"Week "}
                {outcome.weekNumber}
                {" • "}
                {milestoneCount}
                {" milestones • "}
                {draftTasks.length}
                {" tasks"}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={onClose}
              disabled={committing}
              className="h-8 w-8 shrink-0 rounded-md text-muted-foreground hover:bg-transparent hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3 py-2.5 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent dark:scrollbar-thumb-gray-700 md:space-y-3 md:px-4 md:py-3">
          <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-2.5 dark:border-primary/20 dark:bg-primary/[0.07]">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-card-foreground">
                Overall progress
              </span>
              <span className="text-[11px] text-text-muted tabular-nums md:text-xs">
                {completedTaskCount}
                {" / "}
                {totalTasks}
                {" tasks"}
              </span>
            </div>
            <Progress value={overallProgressPct} className="h-1.5" />
          </div>
          <div className="space-y-2 md:space-y-2.5">
            {draftMilestones.map((milestone) => {
              const milestoneTasks = getTasksForMilestone(milestone.id);
              const isExpanded = expandedMilestones.has(milestone.id);
              const completedTasks = milestoneTasks.filter(
                (t) => t.status === "completed",
              ).length;
              const blockedTasks = milestoneTasks.filter(
                (t) => t.status === "blocked",
              ).length;
              const rowStatus = deriveMilestoneStatus(milestone, milestoneTasks);
              const nTasks = milestoneTasks.length;

              return (
                <div
                  key={milestone.id}
                  className="overflow-x-clip overflow-y-visible rounded-lg border border-primary/15 dark:border-primary/22"
                >
                  <div
                    className={`transition-colors ${rowStatus === "completed" ? "bg-emerald-50/85 dark:bg-emerald-950/20" : rowStatus === "in-progress" ? "bg-primary/[0.04]" : "bg-card"} px-3 py-2`}
                  >
                    <div className="flex min-w-0 items-start gap-1.5 md:gap-2">
                      <button
                        type="button"
                        className="mt-0.5 shrink-0 rounded p-0.5 text-muted-foreground hover:bg-primary/10"
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
                      <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                        <div
                          className="min-w-0 cursor-pointer"
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
                              className="h-7 text-xs font-semibold md:text-sm"
                              autoFocus
                            />
                          ) : (
                            <h4
                              className={`text-left text-sm font-semibold leading-snug md:text-[15px] ${rowStatus === "completed" ? "text-muted-foreground line-through" : "text-card-foreground"}`}
                            >
                              {milestone.title || "Untitled milestone"}
                            </h4>
                          )}
                          <div className="mt-0.5 flex items-center gap-3 text-[11px] text-text-muted md:text-xs">
                            <span>
                              {completedTasks}/{nTasks}
                              {" tasks"}
                            </span>
                            {blockedTasks > 0 && (
                              <span className="flex items-center gap-1 text-orange-600">
                                <AlertCircle className="w-3 h-3" />
                                {blockedTasks}
                                {" blocked"}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 text-muted-foreground hover:bg-primary/10 hover:text-foreground"
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
                            className="h-7 w-7 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
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
                    <div className="border-t border-primary/10 bg-muted/25 px-2 pb-2 pt-1.5 dark:border-primary/15 dark:bg-muted/10 md:px-2.5 md:pb-2.5 md:pt-2">
                      <div className="overflow-hidden rounded-lg border border-primary/12 bg-card dark:border-primary/18">
                      {milestoneTasks.length === 0 ? (
                        <p className="px-3 py-5 text-center text-[11px] text-muted-foreground md:text-xs">
                          No tasks in this milestone yet. Add one below.
                        </p>
                      ) : (
                      milestoneTasks.map((task) => {
                        const assignees = taskAssignees(task, assigneeRoster);
                        const p = taskPriority(task);
                        const pLabel = priorityLabelFor(p);
                        return (
                          <div
                            key={taskIdStr(task)}
                            role="presentation"
                            onClick={(e) => e.stopPropagation()}
                            className={`border-b border-primary/[0.09] px-2 py-1.5 transition-colors last:border-b-0 md:px-2.5 md:py-2 ${taskRowSurfaceClass(task)}`}
                          >
                            <div className="flex min-w-0 items-start gap-2">
                              <div className="flex shrink-0 items-center pt-0.5">
                                <Checkbox
                                  checked={task.status === "completed"}
                                  onCheckedChange={(c) =>
                                    handleTaskCheckboxChange(task, c)
                                  }
                                  disabled={
                                    task.status === "blocked" || committing
                                  }
                                />
                              </div>
                              <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 min-h-[20px] flex-wrap">
                                  <span
                                    className={`text-xs ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}
                                  >
                                    {task.title}
                                  </span>
                                  <span
                                    data-priority={p}
                                    className={`sv-priority-chip inline-flex h-5 max-w-full shrink-0 items-center rounded-full border px-2 text-[10px] leading-none tracking-tight ${priorityBadgeClass(p)}`}
                                  >
                                    {pLabel}
                                  </span>
                                </div>
                                {task.description && (
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {task.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 mt-1.5 text-xs flex-wrap">
                                  {task.status === "blocked" &&
                                    task.blockerReason && (
                                      <Badge
                                        variant="outline"
                                        className="text-orange-600 border-orange-300"
                                      >
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        {
                                          blockerReasons.find(
                                            (r) =>
                                              r.value === task.blockerReason,
                                          )?.label
                                        }
                                      </Badge>
                                    )}
                                  {task.status === "in-progress" && (
                                    <Badge
                                      variant="outline"
                                      className="border-primary/28 bg-primary/[0.06] text-primary-dark dark:text-primary-tint"
                                    >
                                      In Progress
                                    </Badge>
                                  )}
                                  {task.incentive &&
                                    task.incentive.type !== "unpaid" && (
                                      <Badge
                                        variant="outline"
                                        className="text-green-600 border-green-300"
                                      >
                                        {task.incentive.type === "equity" && (
                                          <>
                                            <TrendingUp className="w-3 h-3 mr-1" />
                                            {task.incentive.equity}
                                          </>
                                        )}
                                        {task.incentive.type === "paid" && (
                                          <>
                                            <DollarSign className="w-3 h-3 mr-1" />
                                            {task.incentive.pay}
                                          </>
                                        )}
                                        {task.incentive.type === "hourly" && (
                                          <>
                                            <Clock className="w-3 h-3 mr-1" />
                                            {task.incentive.hourlyRate}
                                          </>
                                        )}
                                      </Badge>
                                    )}
                                </div>
                                {task.status === "blocked" &&
                                  task.blockerNote && (
                                    <div className="mt-2 p-2 bg-orange-100 dark:bg-orange-950/30 rounded text-xs">
                                      <p className="text-orange-900 dark:text-orange-100">
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
                                        className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                                        onClick={() => {
                                          if (task.actionButton?.route) {
                                            if (
                                              task.actionButton.route ===
                                              "startup-office"
                                            ) {
                                              if (onNavigate)
                                                onNavigate("startup-office");
                                              if (onVirtualOfficeViewChange)
                                                onVirtualOfficeViewChange(
                                                  "matching",
                                                );
                                            } else if (
                                              task.actionButton.route ===
                                              "team"
                                            ) {
                                              if (onNavigate)
                                                onNavigate("startup-office");
                                              if (onVirtualOfficeViewChange)
                                                onVirtualOfficeViewChange(
                                                  "workspace",
                                                );
                                            } else {
                                              if (onNavigate) {
                                                onNavigate(
                                                  task.actionButton.route,
                                                );
                                              } else {
                                                window.location.href =
                                                  task.actionButton.route;
                                              }
                                            }
                                            onClose();
                                          }
                                        }}
                                      >
                                        {task.actionButton.icon ===
                                          "search" && (
                                          <Search className="w-4 h-4 mr-2" />
                                        )}
                                        {task.actionButton.icon ===
                                          "users" && (
                                          <Users className="w-4 h-4 mr-2" />
                                        )}
                                        {task.actionButton.icon ===
                                          "user" && (
                                          <UserCircle className="w-4 h-4 mr-2" />
                                        )}
                                        {!task.actionButton.icon && (
                                          <ExternalLink className="w-4 h-4 mr-2" />
                                        )}
                                        {task.actionButton.label}
                                      </Button>
                                    </div>
                                  )}
                              </div>
                              <div className="flex shrink-0 flex-wrap items-center justify-end gap-0.5 overflow-visible">
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
                                              taskIdStr(row) === taskIdStr(task)
                                                ? { ...row, priority: opt.value }
                                                : row,
                                            ),
                                          )
                                        }
                                      >
                                        {opt.label}
                                        {p === opt.value ? " (current)" : ""}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                {task.status !== "completed" &&
                                  (task.status === "blocked" ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={committing}
                                      onClick={() =>
                                        setDraftTasks((prev) =>
                                          prev.map((row) =>
                                            taskIdStr(row) === taskIdStr(task)
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
                                      className="text-orange-600"
                                      aria-label="Report blocker"
                                      disabled={committing}
                                      onClick={() =>
                                        setBlockingTaskId(taskIdStr(task))
                                      }
                                    >
                                      <AlertCircle className="w-4 h-4" />
                                    </Button>
                                  ))}
                                {assignees.length > 0 && (
                                  <div
                                    className="flex flex-row items-center -space-x-2 shrink-0 pr-0.5"
                                    aria-label={`Assigned: ${assignees.map((a) => a.name).filter(Boolean).join(", ")}`}
                                  >
                                    {assignees
                                      .slice(0, ASSIGNEE_STACK_MAX)
                                      .map((person, idx) => (
                                        <span
                                          key={person.id}
                                          className="inline-flex"
                                          style={{ zIndex: idx + 1 }}
                                          title={person.name || undefined}
                                        >
                                          <Avatar className="h-7 w-7 border-2 border-background bg-muted shadow-sm dark:border-border">
                                            {person.avatar ? (
                                              <AvatarImage
                                                src={person.avatar}
                                                alt=""
                                              />
                                            ) : null}
                                            <AvatarFallback className="text-[8px] font-medium">
                                              {initialsFromName(person.name)}
                                            </AvatarFallback>
                                          </Avatar>
                                        </span>
                                      ))}
                                    {assignees.length > ASSIGNEE_STACK_MAX && (
                                      <span
                                        className="inline-flex"
                                        style={{
                                          zIndex: ASSIGNEE_STACK_MAX + 2,
                                        }}
                                        title={`${assignees.length - ASSIGNEE_STACK_MAX} more`}
                                      >
                                      <Avatar
                                        className="h-7 w-7 border-2 border-background bg-muted-foreground/20 text-foreground shadow-sm dark:border-border"
                                      >
                                        <AvatarFallback className="px-0 text-[9px] font-semibold tabular-nums">
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
                                  className="text-destructive hover:text-destructive"
                                  disabled={committing}
                                  aria-label="Delete task"
                                  onClick={() =>
                                    setDeleteConfirm({ kind: "task", task })
                                  }
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                                {task.status !== "completed" && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={committing}
                                    onClick={() =>
                                      setAssigningTaskId(taskIdStr(task))
                                    }
                                    aria-label="Assign task"
                                  >
                                    <UserPlus className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                      )}
                      </div>
                      <div
                        role="presentation"
                        onClick={(e) => e.stopPropagation()}
                        className="mt-2 flex flex-col gap-2 border-t border-primary/10 pt-2 sm:flex-row"
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
                          className="h-8 flex-1 text-xs md:text-sm"
                          disabled={committing}
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-8 shrink-0 border border-primary/15 bg-card text-xs hover:bg-primary/[0.06] dark:border-primary/22 sm:w-auto"
                          disabled={
                            committing ||
                            !String(
                              newTaskTitleByMilestone[milestone.id] ?? "",
                            ).trim()
                          }
                          onClick={() => addDraftTask(milestone)}
                        >
                          <Plus className="w-4 h-4 sm:mr-1" />
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
              className="h-8 w-full rounded-[10px] border-primary/22 text-xs text-primary hover:bg-primary/[0.06] md:h-9 md:text-sm"
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
              <Plus className="w-4 h-4 mr-2" />
              Add milestone
            </Button>
          </div>
        </CardContent>
        <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-primary/12 bg-muted/20 px-3 py-2.5 dark:border-primary/18 md:py-3">
          <Button
            type="button"
            variant="outline"
            className="h-8 rounded-[10px] border-primary/22 text-xs hover:bg-primary/[0.05] md:h-9 md:text-sm"
            onClick={onClose}
            disabled={committing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="h-8 rounded-[10px] text-xs shadow-sm md:h-9 md:text-sm"
            onClick={handleConfirm}
            disabled={
              !isDirty || committing || typeof onCommitTaskDraft !== "function"
            }
          >
            {committing ? "Saving..." : "Confirm changes"}
          </Button>
        </div>
      </Card>
      {blockingTaskId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sv-modal-backdrop">
          <Card className="sv-modal-panel w-full rounded-[16px] border-0 shadow-modal sm:max-w-lg">
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                Report Task Blocker
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {blockerReasons.map((reason) => (
                  <div
                    key={reason.value}
                    className={`cursor-pointer rounded-lg border p-3 transition-all ${blockReason === reason.value ? "border-primary bg-primary/5" : "border-primary/20 hover:border-primary/40"}`}
                    onClick={() => setBlockReason(reason.value)}
                  >
                    <p className="font-medium text-sm">{reason.label}</p>
                  </div>
                ))}
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Additional details (optional)
                </label>
                <textarea
                  value={blockNote}
                  onChange={(e) => setBlockNote(e.target.value)}
                  placeholder="Provide more context..."
                  className="w-full p-2 border rounded-lg min-h-[60px] text-sm"
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
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBlockTask}
                  disabled={!blockReason}
                  className="flex-1"
                >
                  Report Blocker
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {assigningTask && (
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
      {incentiveTask && (
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
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-3 sv-modal-backdrop"
          role="presentation"
          onClick={() => !committing && setDeleteConfirm(null)}
        >
          <Card
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-confirm-title"
            aria-describedby="delete-confirm-desc"
            className="sv-modal-panel w-full max-w-[min(100%,22rem)] overflow-hidden rounded-[14px] border-0 shadow-modal sm:max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 pb-1 pt-4">
              <div className="flex gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive dark:bg-destructive/15"
                  aria-hidden
                >
                  <AlertTriangle className="h-5 w-5" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <h3
                    id="delete-confirm-title"
                    className="font-heading text-sm font-semibold leading-snug text-card-foreground md:text-[15px]"
                  >
                    {deleteConfirm.kind === "milestone"
                      ? "Delete milestone?"
                      : "Remove this task?"}
                  </h3>
                  <p
                    id="delete-confirm-desc"
                    className="text-[13px] leading-relaxed text-text-body md:text-sm"
                  >
                    {deleteConfirm.kind === "milestone"
                      ? "This removes the milestone and every task under it. You can’t undo this after you save your week plan."
                      : "This removes the task from your draft only. Nothing is sent to the server until you tap Confirm changes."}
                  </p>
                </div>
              </div>
            </div>
            <div
              data-slot="dialog-footer"
              className="flex flex-col gap-2 border-t border-primary/12 px-4 py-3 dark:border-primary/18 sm:flex-row sm:justify-end sm:gap-2"
            >
              <Button
                type="button"
                variant="outline"
                disabled={committing}
                className="order-2 w-full border-primary/22 bg-card font-semibold hover:bg-primary/[0.04] dark:border-primary/28 sm:order-1 sm:w-auto"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={committing}
                className="order-1 w-full font-semibold sm:order-2 sm:w-auto"
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
    </div>
  );
}
