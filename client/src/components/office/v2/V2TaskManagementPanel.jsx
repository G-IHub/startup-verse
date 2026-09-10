import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "../../ui/button";
import { Card, CardContent } from "../../ui/card";
import UserAvatar from "../../shared/UserAvatar";
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
  Plus,
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
  ArrowUpRight,
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
 * V2 restyle of office/TaskManagementPanel.jsx, rebuilt to match the
 * StartupVerse_Task_Manager.html mockup exactly (520px right-side panel,
 * compact 3-status board, condensed task cards). Same real data logic as
 * the previous V2 pass (task CRUD, milestone sync, drag-and-drop,
 * notifications) — this iteration changes layout/visuals and, per explicit
 * decision, re-enables real task creation ("+ Add task" / FAB), which was
 * dead code in V1's own file.
 */
export function V2TaskManagementPanel({
  open,
  onClose,
  user,
  onPlaySound,
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
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
    Math.round(Math.min(window.innerHeight * 0.55, 460));

  const [kanbanHeight, setKanbanHeight] = useState(defaultKanbanHeight);
  const isDraggingHandle = useRef(false);
  const panelRef = useRef(null);
  const normalizedUserId = String(user?._id ?? user?.id ?? "");
  const isFounder = user.role === "founder";

  const openTaskPage = (id) => {
    if (!id) return;
    onNavigate?.("task-detail", { taskId: String(id) });
  };

  const clampKanbanHeight = useCallback((raw) => {
    const maxH = Math.round(window.innerHeight * 0.75);
    return Math.max(200, Math.min(maxH, raw));
  }, []);

  const onHandlePointerDown = useCallback((e) => {
    isDraggingHandle.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  }, []);

  const onHandlePointerMove = useCallback((e) => {
    if (!isDraggingHandle.current) return;
    setKanbanHeight(clampKanbanHeight(window.innerHeight - e.clientY));
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

  useEffect(() => {
    if (initialTaskId && open && localTasks.length > 0) {
      setTimeout(() => {
        const taskElement = document.getElementById(`v2-task-${initialTaskId}`);
        if (taskElement) {
          setTaskNotFound(false);
          taskElement.scrollIntoView({ behavior: "smooth", block: "center" });
          taskElement.classList.add("ring-2", "ring-v2-blue", "ring-offset-2");
          setTimeout(() => {
            taskElement.classList.remove("ring-2", "ring-v2-blue", "ring-offset-2");
          }, 2000);
        } else {
          setTaskNotFound(true);
        }
      }, 300);
    }
  }, [initialTaskId, open, localTasks]);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    milestoneId: "",
    assigneeId: "",
  });

  const resetNewTask = () =>
    setNewTask({ title: "", description: "", milestoneId: "", assigneeId: "" });

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }
    if (!founderId) {
      toast.error("No founder found");
      return;
    }
    if (isFounder && !newTask.milestoneId) {
      toast.error("Select a milestone before creating a task");
      return;
    }
    const assignee = teamMembers.find((m) => m.id === newTask.assigneeId);
    const task = {
      id: `task-${Date.now()}`,
      title: newTask.title,
      description: newTask.description,
      status: "pending",
      milestoneId: newTask.milestoneId || null,
      milestoneName:
        milestones.find((m) => String(m.id) === String(newTask.milestoneId))
          ?.title || "",
      assignedTo: assignee?.id,
      assignedToName: assignee?.name,
      createdAt: new Date().toISOString(),
    };
    const updatedTasks = [task, ...localTasks];
    setLocalTasks(updatedTasks);
    if (strictMode) {
      try {
        const created = await taskApi.saveTask(founderId, task);
        setLocalTasks((prev) =>
          prev.map((row) => (row.id === task.id ? normalizeTask(created) : row)),
        );
      } catch (error) {
        setLoadError(error?.message || "Task creation failed.");
        return;
      }
    } else {
      saveTasks(founderId, updatedTasks);
    }
    if (!strictMode) {
      syncTasksToMilestones(founderId);
    }
    onTasksSynced?.();
    setShowCreateDialog(false);
    resetNewTask();
    toast.success("Task created successfully!");
    onPlaySound?.();
    createTaskAssignedNotification(task, assignee?.name || "Unassigned");
  };

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
        ? { ...t, status: "blocked", blockerReason: reason, blockerNote: note }
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
  const handleDragStart = (task) => setDraggedTask(task);
  const handleDragOver = (e) => e.preventDefault();
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
        status === "in-progress" ? "In Progress" : status === "pending" ? "Pending" : "Completed";
      toast.success(`Task moved to ${statusLabel}`);
      onPlaySound?.();
      if (status === "completed") {
        const task = updatedTasks.find((t) => t.id === draggedTask.id);
        if (task) createTaskCompletedNotification(task);
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-3 w-3" aria-hidden />;
      case "in-progress":
        return <Clock className="h-3 w-3" aria-hidden />;
      case "blocked":
        return <Ban className="h-3 w-3" aria-hidden />;
      default:
        return <Circle className="h-3 w-3" aria-hidden />;
    }
  };

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
      (task.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || task.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const canEditTask = user.role === "founder";

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
  const inProgressTasks = filteredTasks.filter((t) => t.status === "in-progress");
  const completedTasks = filteredTasks.filter((t) => t.status === "completed");
  const blockedTasks = filteredTasks.filter((t) => t.status === "blocked");

  const totalMilestones = milestones.length;
  const completeMilestones = milestones.filter((m) => {
    const related = localTasks.filter(
      (task) => String(task.milestoneId || "") === String(m.id || ""),
    );
    const total = related.length || Number(m.totalTasks || 0);
    const done =
      related.filter((task) => String(task.status || "") === "completed").length ||
      Number(m.tasksCompleted || 0);
    return total > 0 && done >= total;
  }).length;

  const columns = [
    {
      id: "pending",
      title: "To do",
      tasks: pendingTasks,
      dotClass: "bg-gray-300",
      titleClass: "text-v2-muted",
      badgeClass: "bg-white border border-v2-border text-v2-muted",
      leftBorder: "",
    },
    {
      id: "in-progress",
      title: "In progress",
      tasks: inProgressTasks,
      dotClass: "bg-v2-blue",
      titleClass: "text-v2-blue-dark",
      badgeClass: "bg-v2-blue-tint text-v2-blue-dark",
      leftBorder: "border-l-[2.5px] border-l-v2-blue",
    },
    {
      id: "completed",
      title: "Done",
      tasks: completedTasks,
      dotClass: "bg-v2-green",
      titleClass: "text-v2-green-dark",
      badgeClass: "bg-v2-green-tint text-v2-green-dark",
      leftBorder: "border-l-[2.5px] border-l-v2-green",
    },
  ];
  if (blockedTasks.length > 0) {
    columns.push({
      id: "blocked",
      title: "Blocked",
      tasks: blockedTasks,
      dotClass: "bg-v2-amber",
      titleClass: "text-v2-amber-dark",
      badgeClass: "bg-v2-amber-tint text-v2-amber-dark",
      leftBorder: "border-l-[2.5px] border-l-v2-amber",
    });
  }

  const subCount =
    activeTab === "team-tasks"
      ? (() => {
          const fid = founderId || resolvedCurrentUserId;
          const n = localTasks.filter((t) => Boolean(t.assignedTo) && t.assignedTo !== fid).length;
          return `${n} task${n !== 1 ? "s" : ""} assigned to teammates`;
        })()
      : (() => {
          const fid = founderId || resolvedCurrentUserId;
          const n = localTasks.filter((t) => Boolean(t.assignedTo) && t.assignedTo === fid).length;
          return `${n} task${n !== 1 ? "s" : ""} assigned to you`;
        })();

  const openCreateDialog = () => {
    resetNewTask();
    setShowCreateDialog(true);
  };

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
              transition={{ type: "spring", damping: 30, stiffness: 280 }}
              ref={panelRef}
              className="fixed right-0 top-0 z-[70] flex h-full w-full flex-col overflow-hidden border-l border-v2-border bg-white md:w-[520px]"
            >
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="flex flex-col gap-3 px-[18px] pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[16px] font-medium text-v2-heading">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-v2-blue-tint text-v2-blue">
                        <Target className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      Task management
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      aria-label="Close"
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-v2-border bg-white text-v2-muted hover:bg-v2-page"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </div>

                  {isFounder && (
                    <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-[3px]">
                      <button
                        type="button"
                        onClick={() => setActiveTab("my-tasks")}
                        className={`flex-1 rounded-md py-1.5 text-[13px] font-medium transition-colors ${
                          activeTab === "my-tasks"
                            ? "border border-v2-border bg-white text-v2-heading"
                            : "text-v2-muted"
                        }`}
                      >
                        My tasks
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("team-tasks")}
                        className={`flex-1 rounded-md py-1.5 text-[13px] font-medium transition-colors ${
                          activeTab === "team-tasks"
                            ? "border border-v2-border bg-white text-v2-heading"
                            : "text-v2-muted"
                        }`}
                      >
                        Team tasks
                      </button>
                    </div>
                  )}
                  <p className="-mt-1 text-[12px] text-v2-muted">{subCount}</p>
                </div>

                {loadError ? (
                  <div className="mx-[18px] mt-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-600">
                    {loadError}
                  </div>
                ) : null}
                {taskNotFound ? (
                  <div className="mx-[18px] mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">
                    The linked task could not be found. It may have been deleted or moved.
                  </div>
                ) : null}

                {isFounder && (
                  <div className="mx-[18px] mt-3 flex items-center justify-between gap-2.5 rounded-lg bg-v2-blue-tint px-3.5 py-2.5">
                    <div className="flex items-center gap-1.5 text-[12px] text-v2-blue-dark">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      Tasks come from your weekly milestones on the founder dashboard.
                    </div>
                    {onNavigate && (
                      <button
                        type="button"
                        onClick={() => { onClose?.(); onNavigate("dashboard"); }}
                        className="flex shrink-0 items-center gap-0.5 text-[12px] font-medium text-v2-blue-dark underline"
                      >
                        Open dashboard <ArrowUpRight className="h-3 w-3" aria-hidden />
                      </button>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 px-[18px] pt-3">
                  <div className="flex h-8 flex-1 items-center gap-2 rounded-lg border border-v2-border bg-gray-50 px-2.5">
                    <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search tasks..."
                      className="w-full bg-transparent text-[13px] text-v2-heading placeholder:text-gray-400 outline-none"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-8 w-auto gap-1.5 border-v2-border bg-white px-2.5 text-[12px] text-v2-muted">
                      <Filter className="h-3 w-3" aria-hidden />
                      <SelectValue placeholder="All status" />
                    </SelectTrigger>
                    <SelectContent className="z-[75]">
                      <SelectItem value="all">All status</SelectItem>
                      <SelectItem value="pending">To do</SelectItem>
                      <SelectItem value="in-progress">In progress</SelectItem>
                      <SelectItem value="completed">Done</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                  {isFounder ? (
                    <button
                      type="button"
                      onClick={() => setShowGithubImport(true)}
                      className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-v2-border bg-white px-2.5 text-[12px] text-v2-muted hover:bg-v2-page"
                    >
                      <Github className="h-3.5 w-3.5" aria-hidden />
                      Import
                    </button>
                  ) : null}
                </div>

                {totalMilestones > 0 && (
                  <div className="flex items-center justify-between px-[18px] pb-1.5 pt-3">
                    <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-v2-muted">
                      <Target className="h-3 w-3" aria-hidden />
                      Weekly milestones
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {completeMilestones}/{totalMilestones} complete
                    </span>
                  </div>
                )}
              </div>

              <div
                role="separator"
                aria-label="Drag up to expand task board"
                onPointerDown={onHandlePointerDown}
                onPointerMove={onHandlePointerMove}
                onPointerUp={onHandlePointerUp}
                onPointerCancel={onHandlePointerUp}
                className="flex h-7 w-full shrink-0 cursor-ns-resize select-none items-center justify-center gap-1.5 text-[11px] text-gray-400 hover:text-v2-muted"
              >
                <GripHorizontal className="h-3 w-3" aria-hidden />
                Drag to resize board
              </div>

              <div className="shrink-0 overflow-hidden px-[18px] pb-[18px]" style={{ height: kanbanHeight }}>
                {loading ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-v2-blue border-t-transparent" />
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-center">
                    <p className="text-[12px] text-v2-muted">
                      {user.role === "founder" && activeTab === "team-tasks"
                        ? "No tasks have been assigned to teammates yet"
                        : "No tasks found"}
                    </p>
                  </div>
                ) : activeTab === "team-tasks" ? (
                  <div className="h-full space-y-5 overflow-y-auto">
                    {teamTasksByAssignee.map((group) => (
                      <div key={group.id}>
                        <div className="mb-2 flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-v2-blue-tint text-[10px] font-semibold text-v2-blue-dark">
                            {group.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-[12px] font-medium text-v2-heading">{group.name}</span>
                          <span className="text-[11px] text-gray-400">{group.tasks.length}</span>
                        </div>
                        <div className="space-y-1.5 pl-8">
                          {group.tasks.map((task) => (
                            <V2TaskCard
                              key={task.id}
                              task={task}
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
                                        assignedToName: teamMembers.find((m) => m.id === assigneeId)?.name,
                                      }
                                    : t,
                                );
                                setLocalTasks(updatedTasks);
                                if (strictMode) {
                                  const assigneeName = teamMembers.find((m) => m.id === assigneeId)?.name;
                                  taskApi
                                    .assignTask(founderId, taskId, assigneeId, assigneeName)
                                    .then(() => onTasksSynced?.())
                                    .catch((error) => setLoadError(error?.message || "Task assignment failed."));
                                } else {
                                  saveTasks(founderId, updatedTasks);
                                }
                                toast.success(`Task assigned to ${teamMembers.find((m) => m.id === assigneeId)?.name}`);
                                onPlaySound?.();
                                createTaskAssignedNotification(task, teamMembers.find((m) => m.id === assigneeId)?.name || "Unassigned");
                              }}
                              canEdit={canEditTask}
                              onBlock={handleBlockTask}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className={`grid h-full min-h-0 gap-2.5 ${columns.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}
                  >
                    {columns.map((column) => (
                      <div
                        key={column.id}
                        className="flex min-h-0 flex-col gap-2 overflow-hidden rounded-[10px] bg-gray-50 p-2.5"
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(column.id)}
                      >
                        <div className="flex shrink-0 items-center justify-between">
                          <span className={`flex items-center gap-1.5 text-[12px] font-medium ${column.titleClass}`}>
                            {getStatusIcon(column.id)}
                            {column.title}
                          </span>
                          <span className={`flex h-[18px] min-w-[18px] items-center justify-center rounded-[5px] px-1 text-[10px] font-medium ${column.badgeClass}`}>
                            {column.tasks.length}
                          </span>
                        </div>
                        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
                          {column.tasks.map((task) => (
                            <V2TaskCard
                              key={task.id}
                              task={task}
                              teamMembers={teamMembers}
                              leftBorderClass={column.leftBorder}
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
                                        assignedToName: teamMembers.find((m) => m.id === assigneeId)?.name,
                                      }
                                    : t,
                                );
                                setLocalTasks(updatedTasks);
                                if (strictMode) {
                                  const assigneeName = teamMembers.find((m) => m.id === assigneeId)?.name;
                                  taskApi
                                    .assignTask(founderId, taskId, assigneeId, assigneeName)
                                    .then(() => onTasksSynced?.())
                                    .catch((error) => setLoadError(error?.message || "Task assignment failed."));
                                } else {
                                  saveTasks(founderId, updatedTasks);
                                }
                                toast.success(`Task assigned to ${teamMembers.find((m) => m.id === assigneeId)?.name}`);
                                onPlaySound?.();
                                createTaskAssignedNotification(task, teamMembers.find((m) => m.id === assigneeId)?.name || "Unassigned");
                              }}
                              canEdit={canEditTask}
                              onBlock={handleBlockTask}
                            />
                          ))}
                          {isFounder && (
                            <button
                              type="button"
                              onClick={openCreateDialog}
                              className="flex w-full items-center gap-1.5 rounded-md px-1 py-1.5 text-[12px] text-gray-400 hover:bg-gray-100 hover:text-v2-muted"
                            >
                              <Plus className="h-3.5 w-3.5" aria-hidden />
                              Add task
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {isFounder && (
                <button
                  type="button"
                  onClick={openCreateDialog}
                  aria-label="Add task"
                  className="absolute bottom-6 right-6 flex h-9 w-9 items-center justify-center rounded-full bg-v2-blue text-white shadow-lg hover:bg-v2-blue-dark"
                >
                  <Plus className="h-5 w-5" aria-hidden />
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {isFounder ? (
        <>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent className="max-w-md z-[80]">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>Add a new task to your board</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Task Title *</Label>
                  <Input
                    placeholder="Enter task title..."
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Description</Label>
                  <Textarea
                    placeholder="Enter task description..."
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    className="mt-1 h-20"
                  />
                </div>
                <div>
                  <Label className="text-xs">Milestone *</Label>
                  <Select
                    value={newTask.milestoneId}
                    onValueChange={(v) => setNewTask({ ...newTask, milestoneId: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select milestone..." />
                    </SelectTrigger>
                    <SelectContent className="z-[85]">
                      {milestones.map((milestone) => (
                        <SelectItem key={milestone.id} value={milestone.id}>
                          {milestone.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Assign To</Label>
                  <Select
                    value={newTask.assigneeId}
                    onValueChange={(v) => setNewTask({ ...newTask, assigneeId: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select team member..." />
                    </SelectTrigger>
                    <SelectContent className="z-[85]">
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
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTask} className="flex-1 bg-v2-blue hover:bg-v2-blue-dark">
                    Create Task
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <V2GitHubImportDialog
            open={showGithubImport}
            onOpenChange={setShowGithubImport}
            onImported={() => setTaskReloadNonce((n) => n + 1)}
          />
        </>
      ) : null}
    </>
  );
}

function V2TaskCard({
  task,
  teamMembers,
  leftBorderClass = "",
  onDragStart,
  onToggle,
  onDelete,
  onStatusChange,
  onAssign,
  canEdit,
  onBlock,
  onOpenTask,
}) {
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState(task.assignedTo || "");
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
    { value: "scope", label: "Scope too large", description: "This task needs to be broken down" },
    { value: "unclear", label: "Unclear requirements", description: "I need more clarity on what to do" },
    { value: "dependency", label: "Blocked by dependency", description: "Waiting on another task or person" },
    { value: "skill-gap", label: "Skill gap", description: "I need help or training for this" },
  ];

  const statusDotClass =
    task.status === "completed"
      ? "bg-v2-green"
      : task.status === "in-progress"
        ? "bg-v2-blue"
        : task.status === "blocked"
          ? "bg-v2-amber"
          : "bg-gray-300";

  return (
    <>
      <motion.div
        id={`v2-task-${task.id}`}
        draggable
        onDragStart={() => onDragStart(task)}
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="group"
      >
        <Card
          onClick={() => onOpenTask?.(task.id)}
          className={`relative cursor-pointer rounded-lg border border-v2-border bg-white p-2.5 shadow-none transition-colors hover:border-gray-300 ${leftBorderClass}`}
        >
          <CardContent className="space-y-1.5 p-0">
            <div className="pr-4 text-[12px] font-medium leading-snug text-v2-heading">
              {task.title}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDotClass}`} aria-hidden />
              {task.assignedToName || "Unassigned"}
            </div>
            {task.status === "blocked" && task.blockerNote && (
              <div className="rounded border border-red-200 bg-red-50 p-1.5 text-[10px] text-red-700">
                Blocked: {task.blockerNote}
              </div>
            )}
          </CardContent>
          <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="flex h-5 w-5 items-center justify-center rounded text-gray-400 hover:bg-gray-100"
                >
                  <MoreVertical className="h-3.5 w-3.5" aria-hidden />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 z-[75]">
                {task.status !== "pending" && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, "pending"); }}>
                    <Circle className="w-3.5 h-3.5 mr-2 text-gray-400" />Mark as To Do
                  </DropdownMenuItem>
                )}
                {task.status !== "in-progress" && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, "in-progress"); }}>
                    <PlayCircle className="w-3.5 h-3.5 mr-2 text-v2-blue" />Start Progress
                  </DropdownMenuItem>
                )}
                {task.status !== "completed" && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, "completed"); }}>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-v2-green" />Mark Complete
                  </DropdownMenuItem>
                )}
                {task.status !== "completed" && onBlock && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowBlockDialog(true); }}>
                      <Ban className="w-3.5 h-3.5 mr-2 text-red-600" />Report Blocker
                    </DropdownMenuItem>
                  </>
                )}
                {canEdit && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedAssignee(task.assignedTo || ""); setShowAssignDialog(true); }}>
                      <User className="w-3.5 h-3.5 mr-2 text-v2-blue" />Assign To
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="text-red-600 focus:text-red-600">
                      <Trash2 className="w-3.5 h-3.5 mr-2" />Delete Task
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Card>
      </motion.div>

      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-sm z-[80]" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Assign Task</DialogTitle>
            <DialogDescription>Assign "{task.title}" to a team member</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Team Member</Label>
              <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select team member..." />
                </SelectTrigger>
                <SelectContent className="z-[85]">
                  <SelectItem value="unassigned">
                    <span className="font-medium text-v2-muted">Unassigned</span>
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
              <Button variant="outline" onClick={() => setShowAssignDialog(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleAssign} className="flex-1 bg-v2-blue hover:bg-v2-blue-dark">Assign</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent className="max-w-sm z-[80]" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Report Blocker</DialogTitle>
            <DialogDescription>Report a blocker for "{task.title}"</DialogDescription>
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
                        <UserAvatar name={reason.label} className="h-5 w-5" fallbackClassName="text-[9px]" />
                        <span>{reason.label}</span>
                      </div>
                      <p className="text-[10px] text-v2-muted mt-1">{reason.description}</p>
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
              <Button variant="outline" onClick={() => setShowBlockDialog(false)} className="flex-1">Cancel</Button>
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
