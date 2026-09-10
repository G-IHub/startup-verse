import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "../../ui/button";
import { Card, CardContent } from "../../ui/card";
import UserAvatar from "../../shared/UserAvatar";
import { Badge } from "../../ui/badge";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../../ui/dropdown-menu";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Search,
  Filter,
  Clock,
  User,
  CheckCircle2,
  Circle,
  AlertCircle,
  Target,
  Ban,
  MoreVertical,
  Trash2,
  PlayCircle,
  GripHorizontal,
  Github,
} from "lucide-react";
import { toast } from "sonner";
import {
  getTasks,
  saveTasks,
  toggleTask,
  syncTasksToMilestones,
} from "../../../utils/executionEngine";
import {
  createTaskAssignedNotification,
  createTaskCompletedNotification,
  createTaskBlockedNotification,
} from "../../../utils/notificationHelpers";
import * as teamMemberApi from "../../../utils/api/teamMemberApi";
import * as taskApi from "../../../utils/api/taskApi";
import { subscribeToTasks } from "../../../utils/socketIoRealtime";
import { useWeeklyLoopStore } from "../../../state/useWeeklyLoopStore";
import { useOfficeStore } from "../../../state/useOfficeStore";
import V2GitHubImportDialog from "./V2GitHubImportDialog";

/**
 * V2 restyle of office/TaskManagementPanel.jsx — same real slide-out task
 * Kanban (backend-wired via taskApi/teamMemberApi, real drag-and-drop, real
 * milestone progress), V2 (v2-blue/v2-purple/v2-green/v2-amber) tokens
 * instead of V1's primary/accent/surface tokens. All data logic is copied
 * verbatim from the V1 file; only className tokens changed. The two V1
 * "quick create" dialogs (task/milestone) were dead code there too
 * (guarded by a literal `{false && ...}`) and are dropped here rather than
 * restyled.
 */
export function V2TaskManagementPanel({
  open,
  onClose,
  user,
  onPlaySound,
  openAddDialog,
  initialTaskId,
  strictMode = false,
  startupId,
  founderIdOverride,
  onTasksSynced,
  onNavigate,
}) {
  const [localTasks, setLocalTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [founderId, setFounderId] = useState("");
  const [activeTab, setActiveTab] = useState("my-tasks");
  const [showCreateDialog, setShowCreateDialog] = useState(
    openAddDialog || false,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [draggedTask, setDraggedTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [taskNotFound, setTaskNotFound] = useState(false);
  const [milestones, setMilestones] = useState([]);
  const [activeOutcomeId, setActiveOutcomeId] = useState("");
  const [showGithubImport, setShowGithubImport] = useState(false);
  const [taskReloadNonce, setTaskReloadNonce] = useState(0);

  const defaultKanbanHeight = () =>
    Math.round(Math.min(window.innerHeight * 0.5, 420));

  const [kanbanHeight, setKanbanHeight] = useState(defaultKanbanHeight);
  const kanbanHeightRef = useRef(kanbanHeight);
  const isDraggingHandle = useRef(false);
  const panelRef = useRef(null);
  const normalizedUserId = String(user?._id ?? user?.id ?? "");

  const openTaskPage = (id) => {
    if (!id) return;
    onNavigate?.("task-detail", { taskId: String(id) });
  };

  const clampKanbanHeight = useCallback((raw) => {
    const maxH = Math.round(window.innerHeight * 0.7);
    return Math.max(180, Math.min(maxH, raw));
  }, []);

  const onHandlePointerDown = useCallback((e) => {
    isDraggingHandle.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  }, []);

  const onHandlePointerMove = useCallback((e) => {
    if (!isDraggingHandle.current) return;
    const next = clampKanbanHeight(window.innerHeight - e.clientY);
    kanbanHeightRef.current = next;
    setKanbanHeight(next);
  }, [clampKanbanHeight]);

  const onHandlePointerUp = useCallback(() => {
    isDraggingHandle.current = false;
  }, []);

  const normalizeTask = (task) => {
    const at = task?.assignedTo ?? task?.assigneeId;
    const assignedTo =
      at != null && at !== ""
        ? String(typeof at === "object" ? at._id || at.id || "" : at)
        : "";
    return {
      ...task,
      id: String(task?.id || task?._id || ""),
      assignedTo,
      blockerReason: task?.blockerReason || task?.blockedReason || "",
      blockerNote: task?.blockerNote || task?.blockedNote || "",
    };
  };

  // Sync openAddDialog from props
  useEffect(() => {
    if (openAddDialog !== undefined) {
      setShowCreateDialog(openAddDialog);
    }
  }, [openAddDialog]);

  // Load tasks and team members
  useEffect(() => {
    if (!open) return;
    if (!founderIdOverride && user.role === "founder" && !normalizedUserId) return;
    let cancelled = false;
    const abort = new AbortController();

    const loadData = async () => {
      let founderIdValue = "";
      if (founderIdOverride) {
        founderIdValue = founderIdOverride;
        setFounderId(founderIdOverride);
      } else if (user.role === "founder") {
        founderIdValue = normalizedUserId;
        setFounderId(normalizedUserId);
      } else if (user.role === "team-member" || user.role === "team") {
        founderIdValue = String(user.founderId || user.startupId || "");
        setFounderId(founderIdValue);
      }
      if (!founderIdValue) {
        setLoading(false);
        setLocalTasks([]);
        return;
      }

      const officeTasks = useOfficeStore.getState().tasks;
      const seeded = Array.isArray(officeTasks) ? officeTasks : [];
      if (seeded.length > 0) {
        setLocalTasks(seeded.map(normalizeTask));
        setLoading(false);
      } else {
        setLoading(true);
      }

      if (user.role === "founder") {
        try {
          const [milestoneRows, outcomeRows] = await Promise.all([
            taskApi.getFounderMilestones(founderIdValue),
            taskApi.getFounderWeeklyOutcomes(founderIdValue),
          ]);
          if (cancelled) return;
          setMilestones(milestoneRows || []);
          const active = (outcomeRows || []).find((row) => row.status === "active");
          setActiveOutcomeId(active?.id || "");
        } catch (error) {
          if (cancelled) return;
          setMilestones([]);
          setActiveOutcomeId("");
          if (process.env.NODE_ENV === "development") {
            console.debug("Failed to load milestones/outcomes:", error?.message || error);
          }
        }
      } else {
        setMilestones([]);
        setActiveOutcomeId("");
      }

      try {
        setLoadError("");
        let tasks = [];
        const fetchOpts = { signal: abort.signal, bustCache: true };
        if (user.role === "founder") {
          const backendTasks = await taskApi.getFounderTasks(
            founderIdValue,
            fetchOpts,
          );
          tasks = backendTasks || [];
        } else if (user.role === "team-member" || user.role === "team") {
          const backendTasks = await taskApi.getTeamMemberTasks(
            normalizedUserId,
            { ...fetchOpts },
          );
          tasks = backendTasks || [];
        }
        if (cancelled) return;
        setLocalTasks((tasks || []).map(normalizeTask));
      } catch (error) {
        if (cancelled || error?.name === "AbortError") return;
        console.error(
          "❌ [V2TaskPanel] Error loading tasks from backend:",
          error,
        );
        setLoadError(error?.message || "Could not sync tasks from server.");
        setLocalTasks((prev) => {
          if (prev.length > 0) return prev;
          const seededRows = Array.isArray(useOfficeStore.getState().tasks)
            ? useOfficeStore.getState().tasks
            : [];
          if (seededRows.length > 0) return seededRows.map(normalizeTask);
          if (strictMode) return [];
          const allTasks = getTasks(founderIdValue);
          if (user.role === "team-member" || user.role === "team") {
            return allTasks
              .filter(
                (t) =>
                  String(t.assignedTo || "") === normalizedUserId ||
                  String(t.assigneeId || "") === normalizedUserId,
              )
              .map(normalizeTask);
          }
          return allTasks.map(normalizeTask);
        });
      }

      try {
        const resolvedStartupId = startupId || founderIdValue;
        const backendTeamMembers =
          await teamMemberApi.getStartupTeamMembers(resolvedStartupId);
        if (cancelled) return;
        const mappedMembers = (backendTeamMembers || [])
          .filter((m) => m.id !== founderIdValue && m.role !== "founder")
          .map((member) => ({
            id: member.id,
            name: member.name || member.talentName || "Unknown User",
            role: member.role || member.talentArea || "Team Member",
            email: member.email,
            avatar: member.avatar,
            title:
              member.title || member.talentArea || member.professionalTitle,
            skills: member.skills || member.talentSkills || [],
          }));
        setTeamMembers(mappedMembers);
      } catch (error) {
        if (cancelled) return;
        setTeamMembers([]);
        if (process.env.NODE_ENV === "development") {
          console.debug(
            "Failed to load team members from backend:",
            error.message,
          );
        }
      }
      if (!cancelled) setLoading(false);
    };
    loadData();
    return () => {
      cancelled = true;
      abort.abort();
    };
  }, [open, normalizedUserId, user.role, user.startupId, user.founderId, founderIdOverride, startupId, strictMode, taskReloadNonce]);

  useEffect(() => {
    if (!open || !founderId) return;
    const startupId = founderId;
    const unsubscribe = subscribeToTasks(
      startupId,
      (update) => {
        const incoming = normalizeTask(update?.task || {});
        if (!incoming.id) return;
        setLocalTasks((prev) => {
          const nextMap = new Map(prev.map((row) => [String(row.id), row]));
          nextMap.set(incoming.id, { ...(nextMap.get(incoming.id) || {}), ...incoming });
          return Array.from(nextMap.values()).sort(
            (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
          );
        });
      },
      {
        role: user.role === "founder" ? "founder" : "team-member",
        founderId,
        userId: normalizedUserId,
      },
    );
    return () => unsubscribe?.();
  }, [open, founderId, normalizedUserId, user.role]);

  // Handle initialTaskId - scroll to and highlight the task
  useEffect(() => {
    if (initialTaskId && open && localTasks.length > 0) {
      setTimeout(() => {
        const taskElement = document.getElementById(`v2-task-${initialTaskId}`);
        if (taskElement) {
          setTaskNotFound(false);
          taskElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          taskElement.classList.add("ring-2", "ring-v2-blue", "ring-offset-2");
          setTimeout(() => {
            taskElement.classList.remove(
              "ring-2",
              "ring-v2-blue",
              "ring-offset-2",
            );
          }, 2000);
        } else {
          setTaskNotFound(true);
        }
      }, 300);
    }
  }, [initialTaskId, open, localTasks]);

  // New task form state (kept for parity with V1; the create dialog itself
  // is dead code there too — see file header note)
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    milestoneId: "",
    assigneeId: "",
  });

  const handleToggleTask = async (taskId) => {
    if (!founderId) return;
    let task = null;
    if (strictMode) {
      const existing = localTasks.find((t) => t.id === taskId);
      const nextStatus =
        existing?.status === "completed" ? "pending" : "completed";
      try {
        const serverTask = await taskApi.updateTaskStatus(
          founderId,
          taskId,
          nextStatus,
          {
            completedAt:
              nextStatus === "completed" ? new Date().toISOString() : undefined,
          },
        );
        task = normalizeTask(serverTask || existing);
        setLocalTasks((prev) =>
          prev.map((row) => (row.id === taskId ? task : row)),
        );
      } catch (error) {
        setLoadError(error?.message || "Task toggle failed.");
        return;
      }
    } else {
      const updatedTasks = toggleTask(founderId, taskId);
      const resolvedUid = String(user?._id ?? user?.id ?? "");
      setLocalTasks(
        updatedTasks.filter(
          (t) => user.role === "founder" || t.assignedTo === resolvedUid,
        ),
      );
      task = updatedTasks.find((t) => t.id === taskId);
    }

    if (task && (user.role === "team-member" || user.role === "team")) {
      teamMemberApi
        .updateTaskStatus(normalizedUserId, taskId, {
          status: task.status,
          completedAt:
            task.status === "completed" ? new Date().toISOString() : undefined,
          founderId: founderId,
          completedBy: normalizedUserId,
          completedByName: user.name,
        })
        .catch((error) => {
          console.error("❌ [V2TaskPanel] Backend sync failed:", error);
        });
    }
    if (task?.status === "completed") {
      toast.success("Task completed!");
      createTaskCompletedNotification(task);
    } else {
      toast.success("Task marked as pending");
    }
    onTasksSynced?.();
    useWeeklyLoopStore.getState().refresh(founderId || undefined);
    onPlaySound?.();
  };
  const handleDeleteTask = async (taskId) => {
    if (!founderId) return;
    const updatedTasks = localTasks.filter((t) => t.id !== taskId);
    setLocalTasks(updatedTasks);
    if (strictMode) {
      taskApi.deleteTask(founderId, taskId).catch((error) => {
        setLoadError(error?.message || "Task deletion failed.");
      });
    } else {
      saveTasks(founderId, updatedTasks);
    }

    if (!strictMode) {
      syncTasksToMilestones(founderId);
    }
    onTasksSynced?.();
    toast.success("Task deleted");
    onPlaySound?.();
  };
  const handleStatusChange = (taskId, newStatus) => {
    if (!founderId) return;
    const previousTasks = localTasks;
    const updatedTasks = localTasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            status: newStatus,
            completedAt:
              newStatus === "completed" ? new Date().toISOString() : undefined,
          }
        : t,
    );
    const applySuccessState = (serverTask = null) => {
      const nextTasks = serverTask?.id
        ? updatedTasks.map((row) =>
            row.id === serverTask.id ? normalizeTask(serverTask) : row,
          )
        : updatedTasks;
      setLocalTasks(nextTasks);
      if (!strictMode) {
        saveTasks(founderId, nextTasks);
        syncTasksToMilestones(founderId);
      }
      onTasksSynced?.();
      useWeeklyLoopStore.getState().refresh(founderId || undefined);
      setLoadError("");
      const statusLabel =
        newStatus === "in-progress"
          ? "In Progress"
          : newStatus === "pending"
            ? "To Do"
            : "Completed";
      toast.success(`Task moved to ${statusLabel}`);
      onPlaySound?.();
      if (newStatus === "completed") {
        const task = nextTasks.find((t) => t.id === taskId);
        if (task) {
          createTaskCompletedNotification(task);
        }
      }
    };

    if (user.role === "team-member" || user.role === "team") {
      teamMemberApi
        .updateTaskStatus(normalizedUserId, taskId, {
          status: newStatus,
          completedAt:
            newStatus === "completed" ? new Date().toISOString() : undefined,
          founderId: founderId,
          completedBy: normalizedUserId,
          completedByName: user.name,
        })
        .then(() => applySuccessState())
        .catch((error) => {
          console.error("❌ [V2TaskPanel] Backend sync failed:", error);
          setLocalTasks(previousTasks);
          setLoadError(error?.message || "Task status update failed.");
        });
    } else {
      taskApi
        .updateTaskStatus(founderId, taskId, newStatus, {})
        .then((serverTask) => applySuccessState(serverTask))
        .catch((error) => {
          setLocalTasks(previousTasks);
          setLoadError(error?.message || "Task status update failed.");
        });
    }
  };
  const handleBlockTask = (taskId, reason, note) => {
    if (!reason?.trim() || !note?.trim()) {
      toast.error("Blocker reason and note are required.");
      return;
    }
    if (!founderId) return;
    const previousTasks = localTasks;
    const updatedTasks = localTasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            status: "blocked",
            blockerReason: reason,
            blockerNote: note,
          }
        : t,
    );
    const applyBlockedSuccess = () => {
      setLocalTasks(updatedTasks);
      if (!strictMode) {
        saveTasks(founderId, updatedTasks);
        syncTasksToMilestones(founderId);
      }
      onTasksSynced?.();
      setLoadError("");
      toast.error("Task marked as blocked");
      onPlaySound?.();
      const task = updatedTasks.find((t) => t.id === taskId);
      if (task) {
        createTaskBlockedNotification(task);
      }
    };

    if (user.role === "team-member" || user.role === "team") {
      teamMemberApi
        .updateTaskStatus(normalizedUserId, taskId, {
          status: "blocked",
          blockerReason: reason,
          blockerNote: note,
          founderId: founderId,
          completedBy: normalizedUserId,
          completedByName: user.name,
        })
        .then(() => applyBlockedSuccess())
        .catch((error) => {
          console.error("❌ [V2TaskPanel] Backend sync failed:", error);
          setLocalTasks(previousTasks);
          setLoadError(error?.message || "Blocking task failed.");
        });
    } else {
      taskApi
        .updateTaskStatus(founderId, taskId, "blocked", {
          blockerReason: reason,
          blockerNote: note,
        })
        .then(() => applyBlockedSuccess())
        .catch((error) => {
          setLocalTasks(previousTasks);
          setLoadError(error?.message || "Blocking task failed.");
        });
    }
  };
  const handleDragStart = (task) => {
    setDraggedTask(task);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  const handleDrop = (status) => {
    if (draggedTask && founderId) {
      const updatedTasks = localTasks.map((t) =>
        t.id === draggedTask.id
          ? {
              ...t,
              status,
              completedAt:
                status === "completed" ? new Date().toISOString() : undefined,
            }
          : t,
      );
      setLocalTasks(updatedTasks);
      if (strictMode) {
        taskApi
          .updateTaskStatus(founderId, draggedTask.id, status, {
            completedAt: status === "completed" ? new Date().toISOString() : null,
          })
          .then(() => {
            onTasksSynced?.();
            useWeeklyLoopStore.getState().refresh(founderId || undefined);
          })
          .catch((error) => {
            setLocalTasks(localTasks);
            setLoadError(error?.message || "Task status update failed.");
          });
      } else {
        saveTasks(founderId, updatedTasks);
        syncTasksToMilestones(founderId);
        onTasksSynced?.();
      }
      setDraggedTask(null);
      const statusLabel =
        status === "in-progress"
          ? "In Progress"
          : status === "pending"
            ? "Pending"
            : "Completed";
      toast.success(`Task moved to ${statusLabel}`);
      onPlaySound?.();
      if (status === "completed") {
        const task = updatedTasks.find((t) => t.id === draggedTask.id);
        if (task) {
          createTaskCompletedNotification(task);
        }
      }
    }
  };
  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-3.5 w-3.5 text-v2-green" />;
      case "in-progress":
        return <Clock className="h-3.5 w-3.5 text-v2-blue" />;
      case "blocked":
        return <Ban className="h-3.5 w-3.5 text-v2-amber-dark" />;
      case "pending":
        return <Circle className="h-3.5 w-3.5 text-v2-muted/60" />;
      default:
        return <Circle className="h-3.5 w-3.5 text-v2-muted/60" />;
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "border-l-v2-green";
      case "in-progress":
        return "border-l-v2-blue";
      case "blocked":
        return "border-l-v2-amber";
      default:
        return "border-l-v2-border";
    }
  };

  // Filter tasks — scoped to active tab
  const resolvedCurrentUserId = String(user?._id ?? user?.id ?? "");
  const tabScopedTasks = localTasks.filter((task) => {
    const assigneeId = String(task.assignedTo || task.assigneeId || "");
    if (user.role !== "founder") {
      return Boolean(assigneeId) && assigneeId === resolvedCurrentUserId;
    }
    const fid = String(founderId || resolvedCurrentUserId);
    if (activeTab === "team-tasks") {
      return Boolean(assigneeId) && assigneeId !== fid;
    }
    return !assigneeId || assigneeId === fid;
  });

  const filteredTasks = tabScopedTasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || task.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const canEditTask = user.role === "founder";

  // Group team tasks by assignee (for Team Tasks tab)
  const teamTasksByAssignee = (() => {
    const groups = new Map();
    filteredTasks.forEach((task) => {
      const key = task.assignedTo || "unassigned";
      const name = task.assignedToName || "Unassigned";
      if (!groups.has(key)) groups.set(key, { id: key, name, tasks: [] });
      groups.get(key).tasks.push(task);
    });
    return Array.from(groups.values());
  })();
  const pendingTasks = filteredTasks.filter((t) => t.status === "pending");
  const inProgressTasks = filteredTasks.filter(
    (t) => t.status === "in-progress",
  );
  const completedTasks = filteredTasks.filter((t) => t.status === "completed");
  const blockedTasks = filteredTasks.filter((t) => t.status === "blocked");
  const milestoneProgressRows = milestones.map((milestone) => {
    const related = localTasks.filter(
      (task) => String(task.milestoneId || "") === String(milestone.id || ""),
    );
    const total = related.length || Number(milestone.totalTasks || 0);
    const done =
      related.filter((task) => String(task.status || "") === "completed").length ||
      Number(milestone.tasksCompleted || 0);
    return {
      id: String(milestone.id || ""),
      title: milestone.title || "Milestone",
      total,
      done,
    };
  });
  const columns = [
    {
      id: "pending",
      title: "To Do",
      tasks: pendingTasks,
      headerClass: "bg-v2-blue-tint text-v2-blue-dark",
    },
    {
      id: "in-progress",
      title: "In Progress",
      tasks: inProgressTasks,
      headerClass: "bg-v2-purple-tint text-v2-purple-dark",
    },
    {
      id: "completed",
      title: "Done",
      tasks: completedTasks,
      headerClass: "bg-v2-green-tint text-v2-green-dark",
    },
  ];

  if (blockedTasks.length > 0) {
    columns.push({
      id: "blocked",
      title: "Blocked",
      tasks: blockedTasks,
      headerClass: "bg-v2-amber-tint text-v2-amber-dark",
    });
  }
  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-[65] bg-black/40"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                type: "spring",
                damping: 28,
                stiffness: 260,
              }}
              ref={panelRef}
              className="fixed right-0 top-0 z-[70] flex h-full w-full flex-col overflow-hidden rounded-none border-y border-l border-v2-border bg-v2-surface text-v2-muted shadow-lg md:w-[min(900px,92vw)] md:rounded-l-[14px]"
            >
              <div className="min-h-0 flex-1 overflow-y-auto bg-v2-surface">
              <div className="border-b border-v2-border bg-v2-page px-3 pb-3 pt-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-v2-blue-tint text-v2-blue">
                      <Target className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate font-heading text-[15px] font-semibold tracking-tight text-v2-heading md:text-base">
                        Task management
                      </h3>
                      {user.role === "team-member" && (
                        <Badge
                          variant="outline"
                          className="mt-0.5 border-v2-border text-[10px] font-medium text-v2-muted"
                        >
                          Your tasks only
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={onClose}
                    className="h-8 w-8 shrink-0 rounded-md text-v2-muted hover:bg-transparent hover:text-v2-heading"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {user.role === "founder" && (
                  <div className="mb-1 flex items-center gap-1 rounded-lg bg-v2-blue-tint/60 p-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab("my-tasks")}
                      className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                        activeTab === "my-tasks"
                          ? "bg-v2-surface text-v2-blue shadow-sm ring-1 ring-v2-border"
                          : "text-v2-muted hover:text-v2-heading"
                      }`}
                    >
                      My tasks
                      {(() => { const fid = founderId || resolvedCurrentUserId; const n = localTasks.filter((t) => Boolean(t.assignedTo) && t.assignedTo === fid).length; return n > 0 ? <span className="ml-1.5 rounded-full bg-v2-blue-tint px-1.5 py-0.5 text-[10px] tabular-nums text-v2-blue-dark">{n}</span> : null; })()}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("team-tasks")}
                      className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                        activeTab === "team-tasks"
                          ? "bg-v2-surface text-v2-blue shadow-sm ring-1 ring-v2-border"
                          : "text-v2-muted hover:text-v2-heading"
                      }`}
                    >
                      Team tasks
                      {(() => { const fid = founderId || resolvedCurrentUserId; const n = localTasks.filter((t) => Boolean(t.assignedTo) && t.assignedTo !== fid).length; return n > 0 ? <span className="ml-1.5 rounded-full bg-v2-blue-tint px-1.5 py-0.5 text-[10px] tabular-nums text-v2-blue-dark">{n}</span> : null; })()}
                    </button>
                  </div>
                )}

                <p className="text-xs text-v2-muted">
                  {(() => {
                    const fid = founderId || resolvedCurrentUserId;
                    if (activeTab === "team-tasks") {
                      const n = localTasks.filter((t) => Boolean(t.assignedTo) && t.assignedTo !== fid).length;
                      return `${n} task${n !== 1 ? "s" : ""} assigned to teammates`;
                    }
                    const n = localTasks.filter((t) => Boolean(t.assignedTo) && t.assignedTo === fid).length;
                    return `${n} task${n !== 1 ? "s" : ""} assigned to you`;
                  })()}
                </p>
              </div>
              <div className="space-y-3 border-b border-v2-border bg-v2-page px-3 py-4 md:px-4">
                {loadError ? (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
                    {loadError}
                  </div>
                ) : null}
                {taskNotFound ? (
                  <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                    The linked task could not be found. It may have been deleted or moved.
                  </div>
                ) : null}

                {user.role === "founder" && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-v2-blue/20 bg-v2-blue-tint px-3 py-2.5">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-v2-blue" aria-hidden />
                    <p className="flex-1 text-[12px] font-medium leading-snug text-v2-blue-dark">
                      Tasks come from your weekly milestones on the founder dashboard.
                    </p>
                    {onNavigate && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 shrink-0 px-2 text-xs font-semibold text-v2-blue-dark hover:bg-v2-blue-tint"
                        onClick={() => { onClose?.(); onNavigate("dashboard"); }}
                      >
                        Open dashboard
                      </Button>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-v2-muted" />
                    <Input
                      placeholder="Search tasks…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-9 border-v2-border bg-v2-surface pl-9 hover:border-v2-blue/40 focus-visible:border-v2-blue"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-9 w-[8.5rem] border-v2-border bg-v2-surface hover:border-v2-blue/40">
                      <Filter className="w-3.5 h-3.5 mr-1" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="z-[75]">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                  {user.role === "founder" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 shrink-0 border-v2-border bg-v2-surface"
                      onClick={() => setShowGithubImport(true)}
                    >
                      <Github className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                      Import
                    </Button>
                  ) : null}
                </div>
                {milestoneProgressRows.length > 0 && (
                  <div className="overflow-hidden rounded-xl border border-v2-border bg-v2-surface shadow-sm">
                    <div className="flex items-center justify-between border-b border-v2-border bg-v2-blue-tint px-3 py-2.5 md:px-4 md:py-3">
                      <div className="flex items-center gap-2">
                        <Target className="h-3.5 w-3.5 text-v2-blue" aria-hidden />
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-v2-muted md:text-xs">
                          Weekly milestones
                        </span>
                      </div>
                      <span className="text-[10px] font-medium tabular-nums text-v2-muted">
                        {milestoneProgressRows.filter((r) => r.total > 0 && r.done >= r.total).length}/{milestoneProgressRows.length} complete
                      </span>
                    </div>
                    <div className="divide-y divide-v2-border bg-v2-surface">
                      {milestoneProgressRows.map((row) => {
                        const pct =
                          row.total > 0
                            ? Math.max(0, Math.min(100, Math.round((row.done / row.total) * 100)))
                            : 0;
                        const isDone = row.total > 0 && row.done >= row.total;
                        const isPartial = row.done > 0 && !isDone;
                        const barColor = isDone
                          ? "bg-v2-green"
                          : isPartial
                          ? "bg-v2-blue"
                          : "bg-v2-border";
                        const pillStyle = isDone
                          ? "border border-v2-green/30 bg-v2-green-tint text-v2-green-dark"
                          : isPartial
                          ? "border border-v2-blue/25 bg-v2-blue-tint text-v2-blue-dark"
                          : "border border-v2-border bg-v2-page text-v2-muted";
                        return (
                          <div
                            key={row.id}
                            className="space-y-2 bg-v2-surface px-3 py-2.5 md:px-4 md:py-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-2">
                                <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${isDone ? "bg-v2-green" : isPartial ? "bg-v2-blue" : "bg-v2-border"}`} />
                                <span className="truncate text-xs font-medium leading-tight text-v2-heading">{row.title}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${pillStyle}`}>
                                  {pct}%
                                </span>
                                <span className="text-[10px] text-v2-muted tabular-nums">
                                  {row.done}/{row.total}
                                </span>
                              </div>
                            </div>
                            <div className="h-1 w-full overflow-hidden rounded-full bg-v2-border/60">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Circle className="h-3 w-3 text-v2-muted/70" />
                    <span className="font-medium text-v2-muted">
                      {pendingTasks.length}
                      {" To do"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-v2-blue" />
                    <span className="font-medium text-v2-muted">
                      {inProgressTasks.length}
                      {" In progress"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-v2-green" />
                    <span className="font-medium text-v2-muted">
                      {completedTasks.length}
                      {" Done"}
                    </span>
                  </div>
                  {blockedTasks.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Ban className="h-3 w-3 text-v2-amber-dark" />
                      <span className="font-medium text-v2-muted">
                        {blockedTasks.length}
                        {" Blocked"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              </div>
              <div
                role="separator"
                aria-label="Drag up to expand task board"
                onPointerDown={onHandlePointerDown}
                onPointerMove={onHandlePointerMove}
                onPointerUp={onHandlePointerUp}
                onPointerCancel={onHandlePointerUp}
                className="group relative flex h-8 w-full shrink-0 cursor-ns-resize select-none items-center justify-center border-y border-v2-border bg-v2-page transition-colors hover:bg-v2-blue-tint active:bg-v2-blue-tint"
              >
                <div className="flex items-center gap-1.5 rounded-full border border-v2-border bg-v2-surface px-3 py-1 shadow-sm transition-all group-hover:border-v2-blue/40 group-hover:shadow-md">
                  <GripHorizontal className="h-3.5 w-3.5 text-v2-muted transition-colors group-hover:text-v2-blue" aria-hidden />
                  <span className="select-none text-[10px] font-semibold text-v2-muted transition-colors group-hover:text-v2-blue">
                    Drag to resize board
                  </span>
                </div>
              </div>
              <div
                className="shrink-0 overflow-hidden bg-v2-page"
                style={{ height: kanbanHeight }}
              >
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center space-y-3">
                    <div className="w-8 h-8 border-4 border-v2-blue border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-v2-muted">
                      Loading tasks...
                    </p>
                  </div>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center space-y-3 p-8">
                    <Target className="w-16 h-16 mx-auto text-v2-muted opacity-20" />
                    <p className="text-lg font-medium text-v2-muted">
                      No tasks found
                    </p>
                    <p className="text-sm text-v2-muted max-w-sm">
                      {user.role === "founder" && activeTab === "team-tasks"
                        ? "No tasks have been assigned to teammates yet"
                        : user.role === "founder"
                        ? "Unassigned tasks and tasks assigned to you appear here"
                        : "No tasks have been assigned to you yet"}
                    </p>
                  </div>
                </div>
              ) : activeTab === "team-tasks" ? (
                <div className="h-full space-y-6 overflow-y-auto bg-v2-page p-4">
                  {teamTasksByAssignee.map((group) => (
                    <div key={group.id}>
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-v2-border bg-v2-blue-tint text-[11px] font-semibold text-v2-blue-dark">
                          {group.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-v2-heading">{group.name}</span>
                        <Badge variant="secondary" className="h-5 border border-v2-border bg-v2-surface px-1.5 text-[10px] font-semibold">
                          {group.tasks.length} task{group.tasks.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <div className="space-y-2 pl-9">
                        {group.tasks.map((task) => (
                          <Card
                            key={task.id}
                            onClick={() => openTaskPage(task.id)}
                            className={`cursor-pointer rounded-xl border border-v2-border bg-v2-surface shadow-sm transition-all hover:border-v2-blue/40 hover:shadow-md border-l-[3px] ${getStatusColor(task.status)}`}
                          >
                            <CardContent className="space-y-2 p-3">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="flex-1 text-xs font-semibold leading-snug text-v2-heading">{task.title}</h4>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <Badge variant={task.status === "completed" ? "default" : task.status === "blocked" ? "destructive" : "secondary"} className="text-[10px] h-5">
                                    {task.status === "in-progress" ? "In Progress" : task.status === "pending" ? "To Do" : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                                  </Badge>
                                  {canEditTask && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild={true}>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()}>
                                          <MoreVertical className="w-3.5 h-3.5" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-40 z-[75]">
                                        <DropdownMenuItem onClick={() => handleStatusChange(task.id, "pending")}>
                                          <Circle className="w-3.5 h-3.5 mr-2 text-gray-400" />Mark as To Do
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleStatusChange(task.id, "in-progress")}>
                                          <PlayCircle className="w-3.5 h-3.5 mr-2 text-v2-blue" />Start Progress
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleStatusChange(task.id, "completed")}>
                                          <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-v2-green" />Mark Complete
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleDeleteTask(task.id)} className="text-red-600 focus:text-red-600">
                                          <Trash2 className="w-3.5 h-3.5 mr-2" />Delete Task
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                              </div>
                              {task.description && (
                                <p className="text-[10px] text-v2-muted line-clamp-2">{task.description}</p>
                              )}
                              {task.status === "blocked" && task.blockerNote && (
                                <div className="p-2 bg-red-50 border border-red-200 rounded text-[10px]">
                                  <div className="flex items-center gap-1 text-red-700 font-medium mb-1">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>Blocked: {task.blockerNote}</span>
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center justify-between gap-2 border-t border-v2-border pt-2 text-[11px] text-v2-muted">
                                <span className="min-w-0 truncate">{task.milestoneName || "No milestone"}</span>
                                {task.dueDate && <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full flex-col overflow-hidden bg-v2-page p-3 md:p-4">
                  <div className="flex flex-1 snap-x snap-mandatory gap-3 overflow-x-auto md:hidden">
                    {columns.map((column) => (
                      <div
                        key={column.id}
                        className="flex min-h-0 w-[72vw] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-v2-border bg-v2-surface shadow-sm"
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(column.id)}
                      >
                        <div
                          className={`flex shrink-0 items-center border-b border-v2-border px-3 py-2.5 ${column.headerClass}`}
                        >
                          <div className="flex w-full items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              {getStatusIcon(column.id)}
                              <span className="truncate text-xs font-semibold">
                                {column.title}
                              </span>
                            </div>
                            <Badge
                              variant="secondary"
                              className="h-5 shrink-0 border border-v2-border bg-v2-surface/90 px-1.5 text-[10px] font-semibold tabular-nums text-v2-muted"
                            >
                              {column.tasks.length}
                            </Badge>
                          </div>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto bg-v2-page p-2">
                          <div className="space-y-2">
                            {column.tasks.map((task) => (
                              <V2TaskCard
                                key={task.id}
                                task={task}
                                founderId={founderId}
                                teamMembers={teamMembers}
                                onDragStart={handleDragStart}
                                onOpenTask={openTaskPage}
                                onToggle={handleToggleTask}
                                onDelete={handleDeleteTask}
                                onStatusChange={handleStatusChange}
                                onAssign={(taskId, assigneeId) => {
                                  const updatedTasks = localTasks.map((t) =>
                                    t.id === taskId
                                      ? {
                                          ...t,
                                          assignedTo: assigneeId,
                                          assignedToName: teamMembers.find(
                                            (m) => m.id === assigneeId,
                                          )?.name,
                                        }
                                      : t,
                                  );
                                  setLocalTasks(updatedTasks);
                                  if (strictMode) {
                                    const assigneeName = teamMembers.find(
                                      (m) => m.id === assigneeId,
                                    )?.name;
                                    taskApi
                                      .assignTask(
                                        founderId,
                                        taskId,
                                        assigneeId,
                                        assigneeName,
                                      )
                                      .then(() => onTasksSynced?.())
                                      .catch((error) =>
                                        setLoadError(
                                          error?.message || "Task assignment failed.",
                                        ),
                                      );
                                  } else {
                                    saveTasks(founderId, updatedTasks);
                                  }
                                  toast.success(
                                    `Task assigned to ${teamMembers.find((m) => m.id === assigneeId)?.name}`,
                                  );
                                  onPlaySound?.();
                                  createTaskAssignedNotification(
                                    task,
                                    teamMembers.find((m) => m.id === assigneeId)
                                      ?.name || "Unassigned",
                                  );
                                }}
                                getStatusColor={getStatusColor}
                                canEdit={user.role === "founder"}
                                onBlock={handleBlockTask}
                              />
                            ))}
                            {column.tasks.length === 0 && (
                              <div className="rounded-lg border border-dashed border-v2-border bg-v2-surface py-8 text-center text-xs text-v2-muted">
                                <Circle className="mx-auto mb-2 h-8 w-8 text-v2-blue/25" aria-hidden />
                                <p className="font-medium">No tasks</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    className={`hidden min-h-0 flex-1 gap-3 md:grid ${columns.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}
                  >
                    {columns.map((column) => (
                      <div
                        key={column.id}
                        className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-v2-border bg-v2-surface shadow-sm"
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(column.id)}
                      >
                        <div
                          className={`flex shrink-0 items-center border-b border-v2-border px-3 py-2.5 ${column.headerClass}`}
                        >
                          <div className="flex w-full items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              {getStatusIcon(column.id)}
                              <span className="truncate text-xs font-semibold">
                                {column.title}
                              </span>
                            </div>
                            <Badge
                              variant="secondary"
                              className="h-5 shrink-0 border border-v2-border bg-v2-surface/90 px-1.5 text-[10px] font-semibold tabular-nums text-v2-muted"
                            >
                              {column.tasks.length}
                            </Badge>
                          </div>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto bg-v2-page p-2">
                          <div className="space-y-2">
                            {column.tasks.map((task) => (
                              <V2TaskCard
                                key={task.id}
                                task={task}
                                founderId={founderId}
                                teamMembers={teamMembers}
                                onDragStart={handleDragStart}
                                onOpenTask={openTaskPage}
                                onToggle={handleToggleTask}
                                onDelete={handleDeleteTask}
                                onStatusChange={handleStatusChange}
                                onAssign={(taskId, assigneeId) => {
                                  const updatedTasks = localTasks.map((t) =>
                                    t.id === taskId
                                      ? {
                                          ...t,
                                          assignedTo: assigneeId,
                                          assignedToName: teamMembers.find(
                                            (m) => m.id === assigneeId,
                                          )?.name,
                                        }
                                      : t,
                                  );
                                  setLocalTasks(updatedTasks);
                                  if (strictMode) {
                                    const assigneeName = teamMembers.find(
                                      (m) => m.id === assigneeId,
                                    )?.name;
                                    taskApi
                                      .assignTask(
                                        founderId,
                                        taskId,
                                        assigneeId,
                                        assigneeName,
                                      )
                                      .then(() => onTasksSynced?.())
                                      .catch((error) =>
                                        setLoadError(
                                          error?.message || "Task assignment failed.",
                                        ),
                                      );
                                  } else {
                                    saveTasks(founderId, updatedTasks);
                                  }
                                  toast.success(
                                    `Task assigned to ${teamMembers.find((m) => m.id === assigneeId)?.name}`,
                                  );
                                  onPlaySound?.();
                                  createTaskAssignedNotification(
                                    task,
                                    teamMembers.find((m) => m.id === assigneeId)
                                      ?.name || "Unassigned",
                                  );
                                }}
                                getStatusColor={getStatusColor}
                                canEdit={user.role === "founder"}
                                onBlock={handleBlockTask}
                              />
                            ))}
                            {column.tasks.length === 0 && (
                              <div className="rounded-lg border border-dashed border-v2-border bg-v2-surface py-8 text-center text-xs text-v2-muted">
                                <Circle className="mx-auto mb-2 h-8 w-8 text-v2-blue/25" aria-hidden />
                                <p className="font-medium">No tasks</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {user.role === "founder" ? (
        <V2GitHubImportDialog
          open={showGithubImport}
          onOpenChange={setShowGithubImport}
          onImported={() => setTaskReloadNonce((n) => n + 1)}
        />
      ) : null}
    </>
  );
}

// Task Card Component

function V2TaskCard({
  task,
  founderId,
  teamMembers,
  onDragStart,
  onToggle,
  onDelete,
  onStatusChange,
  onAssign,
  getStatusColor,
  canEdit,
  onBlock,
  onOpenTask,
}) {
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState(
    task.assignedTo || "",
  );
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [blockNote, setBlockNote] = useState("");
  const handleAssign = () => {
    onAssign(task.id, selectedAssignee);
    setShowAssignDialog(false);
  };
  const handleBlock = () => {
    if (onBlock && blockReason && blockNote.trim()) {
      onBlock(task.id, blockReason, blockNote);
      setShowBlockDialog(false);
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
  return (
    <>
      <motion.div
        id={`v2-task-${task.id}`}
        draggable={true}
        onDragStart={() => onDragStart(task)}
        layout={true}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="cursor-pointer group"
      >
        <Card
          onClick={() => onOpenTask?.(task.id)}
          className={`rounded-xl border border-v2-border bg-v2-surface shadow-sm transition-all hover:border-v2-blue/40 hover:shadow-md border-l-[3px] ${getStatusColor(task.status)}`}
        >
          <CardContent className="space-y-2 p-3">
            <div className="flex items-start justify-between gap-2">
              <h4 className="flex-1 text-xs font-semibold leading-snug text-v2-heading">
                {task.title}
              </h4>
              <div className="flex items-center gap-1">
                {task.status !== "blocked" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild={true}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 z-[75]">
                      {task.status !== "pending" && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(task.id, "pending");
                          }}
                        >
                          <Circle className="w-3.5 h-3.5 mr-2 text-gray-400" />
                          Mark as To Do
                        </DropdownMenuItem>
                      )}
                      {task.status !== "in-progress" && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(task.id, "in-progress");
                          }}
                        >
                          <PlayCircle className="w-3.5 h-3.5 mr-2 text-v2-blue" />
                          Start Progress
                        </DropdownMenuItem>
                      )}
                      {task.status !== "completed" && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(task.id, "completed");
                          }}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-v2-green" />
                          Mark Complete
                        </DropdownMenuItem>
                      )}
                      {task.status !== "completed" && onBlock && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowBlockDialog(true);
                            }}
                          >
                            <Ban className="w-3.5 h-3.5 mr-2 text-red-600" />
                            Report Blocker
                          </DropdownMenuItem>
                        </>
                      )}
                      {canEdit && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAssignee(task.assignedTo || "");
                              setShowAssignDialog(true);
                            }}
                          >
                            <User className="w-3.5 h-3.5 mr-2 text-v2-blue" />
                            Assign To
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(task.id);
                            }}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            Delete Task
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
            {task.description && (
              <p className="text-[10px] text-v2-muted line-clamp-2">
                {task.description}
              </p>
            )}
            {task.status === "blocked" && task.blockerNote && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-[10px]">
                <div className="flex items-center gap-1 text-red-700 font-medium mb-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>Blocked</span>
                </div>
                <p className="text-red-600">
                  {task.blockerNote}
                </p>
              </div>
            )}
            <div className="flex items-center justify-between gap-2 border-t border-v2-border pt-2 text-[11px]">
              {task.assignedToName ? (
                <div className="flex min-w-0 items-center gap-1.5">
                  <UserAvatar
                    user={teamMembers.find(
                      (m) => String(m.id) === String(task.assignedTo),
                    )}
                    name={task.assignedToName}
                    className="h-6 w-6 border border-v2-border"
                    fallbackClassName="bg-v2-blue-tint text-[8px] font-semibold text-v2-blue-dark"
                  />
                  <span className="max-w-[120px] truncate font-medium text-v2-muted">
                    {task.assignedToName}
                  </span>
                </div>
              ) : (
                <span className="font-body font-medium not-italic text-v2-muted">
                  Unassigned
                </span>
              )}
              {task.milestoneName && (
                <Badge
                  variant="outline"
                  className="h-5 max-w-[46%] shrink-0 truncate border-v2-border px-1.5 text-[9px] font-medium text-v2-muted"
                >
                  {task.milestoneName}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent
          className="max-w-sm z-[80]"
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle>Assign Task</DialogTitle>
            <DialogDescription>
              Assign "{task.title}" to a team member
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Team Member</Label>
              <Select
                value={selectedAssignee}
                onValueChange={setSelectedAssignee}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select team member..." />
                </SelectTrigger>
                <SelectContent className="z-[85]">
                  <SelectItem value="unassigned">
                    <span className="font-medium text-v2-muted">
                      Unassigned
                    </span>
                  </SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <UserAvatar user={member} name={member.name} className="h-5 w-5" fallbackClassName="text-[9px]" />
                        <span>{member.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowAssignDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssign}
                className="flex-1 bg-v2-blue hover:bg-v2-blue-dark"
              >
                Assign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent
          className="max-w-sm z-[80]"
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle>Report Blocker</DialogTitle>
            <DialogDescription>
              Report a blocker for "{task.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Reason</Label>
              <Select value={blockReason} onValueChange={setBlockReason}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select reason..." />
                </SelectTrigger>
                <SelectContent className="z-[85]">
                  {blockerReasons.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      <div className="flex items-center gap-2">
                        <UserAvatar
                          name={reason.label}
                          className="h-5 w-5"
                          fallbackClassName="text-[9px]"
                        />
                        <span>{reason.label}</span>
                      </div>
                      <p className="text-[10px] text-v2-muted mt-1">
                        {reason.description}
                      </p>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Note</Label>
              <Textarea
                placeholder="Enter additional details..."
                value={blockNote}
                onChange={(e) => setBlockNote(e.target.value)}
                className="mt-1 h-20"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowBlockDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBlock}
                disabled={!blockReason || !blockNote.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Report Blocker
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
