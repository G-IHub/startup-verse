import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
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
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Separator } from "../ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
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
} from "lucide-react";
import { toast } from "sonner";
import {
  getTasks,
  saveTasks,
  toggleTask,
  syncTasksToMilestones,
} from "../../utils/executionEngine";
import {
  createTaskAssignedNotification,
  createTaskCompletedNotification,
  createTaskBlockedNotification,
} from "../../utils/notificationHelpers";
import * as teamMemberApi from "../../utils/api/teamMemberApi";
import * as taskApi from "../../utils/api/taskApi";
import { subscribeToTasks } from "../../utils/socketIoRealtime";
import { STORAGE_KEYS } from "../../app/session";
import { useWeeklyLoopStore } from "../../state/useWeeklyLoopStore";

export function TaskManagementPanel({
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
  const [showMilestoneDialog, setShowMilestoneDialog] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: "", description: "" });

  const defaultKanbanHeight = () =>
    Math.round(Math.min(window.innerHeight * 0.5, 420));

  const [kanbanHeight, setKanbanHeight] = useState(defaultKanbanHeight);
  const kanbanHeightRef = useRef(kanbanHeight);
  const isDraggingHandle = useRef(false);
  const panelRef = useRef(null);

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

  const normalizeTask = (task) => ({
    ...task,
    id: String(task?.id || task?._id || ""),
    blockerReason: task?.blockerReason || task?.blockedReason || "",
    blockerNote: task?.blockerNote || task?.blockedNote || "",
  });

  // Sync openAddDialog from props
  useEffect(() => {
    if (openAddDialog !== undefined) {
      setShowCreateDialog(openAddDialog);
    }
  }, [openAddDialog]);

  // Load tasks and team members
  useEffect(() => {
    if (!open) return;
    if (!founderIdOverride && user.role === "founder" && !String(user?._id ?? user?.id ?? "")) return;
    const loadData = async () => {
      setLoading(true);

      const allUsers = strictMode
        ? []
        : JSON.parse(localStorage.getItem(STORAGE_KEYS.teamMembers) || "[]");

      // Determine the founder ID (we don't need the full founder object)
      const resolvedUserId = String(user?._id ?? user?.id ?? "");
      let founderIdValue = "";
      if (founderIdOverride) {
        founderIdValue = founderIdOverride;
        setFounderId(founderIdOverride);
      } else if (user.role === "founder") {
        founderIdValue = resolvedUserId;
        setFounderId(resolvedUserId);
      } else if (user.role === "team-member" && user.startupId) {
        founderIdValue = user.startupId;
        setFounderId(user.startupId);
      } else if (user.role === "team" && user.founderId) {
        founderIdValue = user.founderId;
        setFounderId(user.founderId);
      }
      if (!founderIdValue) {
        console.warn(
          "No founder found for task management - user may not be linked to a startup yet",
        );
        setLoading(false);
        setLocalTasks([]);
        return;
      }

      if (user.role === "founder") {
        try {
          const [milestoneRows, outcomeRows] = await Promise.all([
            taskApi.getFounderMilestones(founderIdValue),
            taskApi.getFounderWeeklyOutcomes(founderIdValue),
          ]);
          setMilestones(milestoneRows || []);
          const active = (outcomeRows || []).find((row) => row.status === "active");
          setActiveOutcomeId(active?.id || "");
        } catch (error) {
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

      // Load tasks for the founder - BACKEND FIRST
      try {
        setLoadError("");
        let tasks = [];
        if (user.role === "founder") {
          // Load founder's tasks from backend
          const backendTasks = await taskApi.getFounderTasks(founderIdValue);
          tasks = backendTasks || [];
        } else if (user.role === "team-member" || user.role === "team") {
          // Load team member's assigned tasks from backend
          const backendTasks = await taskApi.getTeamMemberTasks(user.id);
          tasks = backendTasks || [];
        }
        setLocalTasks((tasks || []).map(normalizeTask));
        console.log(`✅ [TaskPanel] Loaded ${tasks.length} tasks from backend`);
      } catch (error) {
        console.error(
          "❌ [TaskPanel] Error loading tasks from backend:",
          error,
        );
        if (strictMode) {
          setLoadError(error?.message || "Could not sync tasks from server.");
          setLocalTasks([]);
        } else {
          const allTasks = getTasks(founderIdValue);
          let filteredTasks = allTasks;
          if (user.role === "team-member" || user.role === "team") {
            filteredTasks = allTasks.filter(
              (t) => t.assignedTo === user.id || t.assigneeId === user.id,
            );
          }
          setLoadError("Could not sync tasks from server. Showing cached tasks.");
          setLocalTasks(filteredTasks.map(normalizeTask));
        }
      }

      // Load team members (for task assignment) - FROM BACKEND
      try {
        const resolvedStartupId = startupId || founderIdValue;
        console.log(
          "🔍 [TaskPanel] Loading team members for startup:",
          resolvedStartupId,
        );

        // Load from localStorage first
        // 🔒 SECURITY FIX: Use startupId/founderId ONLY, removed companyId matching
        const localTeam = allUsers.filter(
          (u) =>
            (u.startupId === founderIdValue ||
              u.founderId === founderIdValue) &&
            (u.role === "team-member" || u.role === "team"),
        );
        setTeamMembers(localTeam);
        console.log(
          "📊 [TaskPanel] Team members from localStorage:",
          localTeam.length,
        );

        // Then fetch from backend
        const backendTeamMembers =
          await teamMemberApi.getStartupTeamMembers(resolvedStartupId);
        if (backendTeamMembers && backendTeamMembers.length > 0) {
          // Map backend data to consistent format
          const mappedMembers = backendTeamMembers
            .filter((m) => m.id !== founderIdValue && m.role !== "founder") // Exclude founder
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
          console.log(
            "✅ [TaskPanel] Team members updated from backend:",
            mappedMembers.length,
          );
        }
      } catch (error) {
        // Silently fail - localStorage data is already displayed
        if (process.env.NODE_ENV === "development") {
          console.debug(
            "Failed to load team members from backend:",
            error.message,
          );
        }
      }
      setLoading(false);
    };
    loadData();

    // ✅ REALTIME: Removed task/team polling (was every 10s) - using real-time subscription
  }, [open, user.id, user.role, user.startupId, user.founderId, founderIdOverride, startupId, strictMode]);

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
        userId: user.id,
      },
    );
    return () => unsubscribe?.();
  }, [open, founderId, user.id, user.role]);

  // Handle initialTaskId - scroll to and highlight the task
  useEffect(() => {
    if (initialTaskId && open && localTasks.length > 0) {
      console.log("🎯 [TaskPanel] Scrolling to task:", initialTaskId);
      // Give the panel time to render, then scroll to the task
      setTimeout(() => {
        const taskElement = document.getElementById(`task-${initialTaskId}`);
        if (taskElement) {
          setTaskNotFound(false);
          taskElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          // Add a highlight animation
          taskElement.classList.add("ring-2", "ring-primary", "ring-offset-2");
          setTimeout(() => {
            taskElement.classList.remove(
              "ring-2",
              "ring-primary",
              "ring-offset-2",
            );
          }, 2000);
        } else {
          setTaskNotFound(true);
        }
      }, 300);
    }
  }, [initialTaskId, open, localTasks]);

  // New task form state
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    milestoneId: "",
    assigneeId: "",
  });
  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }
    if (!founderId) {
      toast.error("No founder found");
      return;
    }
    if (user.role === "founder" && !newTask.milestoneId) {
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
      }
    } else {
      saveTasks(founderId, updatedTasks);
    }

    // 🚀 Sync tasks to milestones (new task increases totalTasks)
    if (!strictMode) {
      syncTasksToMilestones(founderId);
    }
    onTasksSynced?.();
    setShowCreateDialog(false);
    setNewTask({
      title: "",
      description: "",
      milestoneId: "",
      assigneeId: "",
    });
    toast.success("Task created successfully!");
    onPlaySound?.();
    createTaskAssignedNotification(task, assignee?.name || "Unassigned");
  };
  const handleCreateMilestone = async () => {
    if (!newMilestone.title.trim()) {
      toast.error("Please enter a milestone title");
      return;
    }
    if (!founderId) {
      toast.error("No founder found");
      return;
    }
    try {
      const created = await taskApi.createFounderMilestone(founderId, {
        title: newMilestone.title.trim(),
        description: newMilestone.description.trim(),
        weeklyOutcomeId: activeOutcomeId || undefined,
      });
      setMilestones((prev) => [...prev, created]);
      setNewTask((prev) => ({ ...prev, milestoneId: created.id }));
      setShowMilestoneDialog(false);
      setNewMilestone({ title: "", description: "" });
      toast.success("Milestone created");
      onTasksSynced?.();
    } catch (error) {
      toast.error(error?.message || "Failed to create milestone");
    }
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

    // 🔔 NOTIFICATION SYSTEM V2.0 - CLEAN REBUILD
    if (task && (user.role === "team-member" || user.role === "team")) {
      console.log(`🔔 [NOTIFICATION V2] Team member toggling task ${taskId}`);
      console.log(
        `🔔 [NOTIFICATION V2] User: ${user.name} (${user.id}), Status: ${task.status}`,
      );
      console.log(`🔔 [NOTIFICATION V2] Founder ID: ${founderId}`);
      teamMemberApi
        .updateTaskStatus(user.id, taskId, {
          status: task.status,
          completedAt:
            task.status === "completed" ? new Date().toISOString() : undefined,
          founderId: founderId,
          completedBy: user.id,
          completedByName: user.name,
        })
        .then(() => {
          console.log(`✅ [NOTIFICATION V2] Backend notified successfully!`);
          console.log(
            `📬 [NOTIFICATION V2] Founder ${founderId} should receive notification`,
          );
        })
        .catch((error) => {
          console.error("❌ [NOTIFICATION V2] Backend sync failed:", error);
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

    // 🚀 Sync tasks to milestones (deleting task updates counts)
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
      console.log(
        `🔔 [TaskManagementPanel.handleStatusChange] Syncing task ${taskId} status change to backend...`,
      );
      console.log(
        `🔔 [TaskManagementPanel.handleStatusChange] User role: ${user.role}, New status: ${newStatus}`,
      );
      teamMemberApi
        .updateTaskStatus(user.id, taskId, {
          status: newStatus,
          completedAt:
            newStatus === "completed" ? new Date().toISOString() : undefined,
          founderId: founderId,
          completedBy: user.id,
          completedByName: user.name,
        })
        .then(() =>
          console.log(`✅ Task status '${newStatus}' synced to backend - founder notified`),
        )
        .then(() => applySuccessState())
        .catch((error) => {
          console.error("❌ Backend sync failed:", error);
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
        .updateTaskStatus(user.id, taskId, {
          status: "blocked",
          blockerReason: reason,
          blockerNote: note,
          founderId: founderId,
          completedBy: user.id,
          completedByName: user.name,
        })
        .then(() =>
          console.log(`✅ Task blocked synced to backend - founder notified`),
        )
        .then(() => applyBlockedSuccess())
        .catch((error) => {
          console.error("❌ Backend sync failed:", error);
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
        return <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />;
      case "in-progress":
        return <Clock className="w-3.5 h-3.5 text-blue-600" />;
      case "blocked":
        return <Ban className="w-3.5 h-3.5 text-red-600" />;
      default:
        return <Circle className="w-3.5 h-3.5 text-gray-400" />;
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "border-l-green-500";
      case "in-progress":
        return "border-l-blue-500";
      case "blocked":
        return "border-l-red-500";
      default:
        return "border-l-gray-400";
    }
  };

  // Filter tasks — scoped to active tab
  const resolvedCurrentUserId = String(user?._id ?? user?.id ?? "");
  const tabScopedTasks = localTasks.filter((task) => {
    if (user.role !== "founder") {
      // Team member: only tasks explicitly assigned to this user
      return (
        task.assignedTo === resolvedCurrentUserId ||
        task.assigneeId === resolvedCurrentUserId
      );
    }
    // Founder — guard: if founderId not yet resolved, treat unassigned as mine only
    const fid = founderId || resolvedCurrentUserId;
    if (activeTab === "team-tasks") {
      // Only tasks explicitly assigned to someone who is NOT the founder
      return Boolean(task.assignedTo) && task.assignedTo !== fid;
    }
    // My Tasks: unassigned tasks + tasks assigned to founder
    return !task.assignedTo || task.assignedTo === fid;
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
      color: "bg-slate-100 dark:bg-slate-800",
    },
    {
      id: "in-progress",
      title: "In Progress",
      tasks: inProgressTasks,
      color: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      id: "completed",
      title: "Done",
      tasks: completedTasks,
      color: "bg-green-50 dark:bg-green-900/20",
    },
  ];

  // Add blocked column if there are blocked tasks
  if (blockedTasks.length > 0) {
    columns.push({
      id: "blocked",
      title: "Blocked",
      tasks: blockedTasks,
      color: "bg-red-50 dark:bg-red-900/20",
    });
  }
  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              onClick={onClose}
              className="fixed inset-0 bg-black/20 z-[65]"
            />
            <motion.div
              initial={{
                x: "100%",
              }}
              animate={{
                x: 0,
              }}
              exit={{
                x: "100%",
              }}
              transition={{
                type: "spring",
                damping: 28,
                stiffness: 260,
              }}
              ref={panelRef}
              className="fixed right-0 top-0 h-full w-full md:w-[900px] office-panel office-panel-shell office-motion-soft z-[70] flex flex-col rounded-none md:rounded-l-xl"
            >
              <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-3 office-panel-header">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                    <h3 className="text-base font-semibold">Task Management</h3>
                    {user.role === "team-member" && (
                      <Badge variant="outline" className="text-xs">
                        Your Tasks Only
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-7 w-7 p-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {user.role === "founder" && (
                  <div className="flex items-center gap-1 rounded-lg bg-muted p-1 mb-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab("my-tasks")}
                      className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        activeTab === "my-tasks"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      My Tasks
                      {(() => { const fid = founderId || resolvedCurrentUserId; const n = localTasks.filter((t) => !t.assignedTo || t.assignedTo === fid).length; return n > 0 ? <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">{n}</span> : null; })()}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("team-tasks")}
                      className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        activeTab === "team-tasks"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Team Tasks
                      {(() => { const fid = founderId || resolvedCurrentUserId; const n = localTasks.filter((t) => Boolean(t.assignedTo) && t.assignedTo !== fid).length; return n > 0 ? <span className="ml-1.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700">{n}</span> : null; })()}
                    </button>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  {(() => {
                    const fid = founderId || resolvedCurrentUserId;
                    if (activeTab === "team-tasks") {
                      const n = localTasks.filter((t) => Boolean(t.assignedTo) && t.assignedTo !== fid).length;
                      return `${n} task${n !== 1 ? "s" : ""} assigned to teammates`;
                    }
                    const n = localTasks.filter((t) => !t.assignedTo || t.assignedTo === fid).length;
                    return `${n} personal task${n !== 1 ? "s" : ""}`;
                  })()}
                </p>
              </div>
              <div className="p-4 border-b border-border bg-surface-container-low space-y-3">
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
                  <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-900 dark:bg-blue-950/30">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                    <p className="flex-1 text-[11px] text-blue-700 dark:text-blue-300">
                      Tasks are created from the weekly milestone section on your dashboard.
                    </p>
                    {onNavigate && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 shrink-0 px-2 text-[11px] text-blue-700 hover:bg-blue-100 dark:text-blue-300"
                        onClick={() => { onClose?.(); onNavigate("dashboard"); }}
                      >
                        Go to Dashboard
                      </Button>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32 h-9">
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
                </div>
                {milestoneProgressRows.length > 0 && (
                  <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
                      <div className="flex items-center gap-2">
                        <Target className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-semibold tracking-wide text-foreground">Weekly Milestones</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {milestoneProgressRows.filter((r) => r.total > 0 && r.done >= r.total).length}/{milestoneProgressRows.length} complete
                      </span>
                    </div>
                    <div className="divide-y divide-border">
                      {milestoneProgressRows.map((row) => {
                        const pct =
                          row.total > 0
                            ? Math.max(0, Math.min(100, Math.round((row.done / row.total) * 100)))
                            : 0;
                        const isDone = row.total > 0 && row.done >= row.total;
                        const isPartial = row.done > 0 && !isDone;
                        const barColor = isDone
                          ? "from-emerald-500 to-emerald-400"
                          : isPartial
                          ? "from-blue-600 to-blue-400"
                          : "from-slate-300 to-slate-200 dark:from-slate-700 dark:to-slate-600";
                        const pillStyle = isDone
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : isPartial
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-muted text-muted-foreground";
                        return (
                          <div key={row.id} className="px-4 py-3 space-y-2.5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${isDone ? "bg-emerald-500" : isPartial ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"}`} />
                                <span className="text-xs font-medium leading-tight truncate text-foreground">{row.title}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${pillStyle}`}>
                                  {pct}%
                                </span>
                                <span className="text-[10px] text-muted-foreground tabular-nums">
                                  {row.done}/{row.total}
                                </span>
                              </div>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${barColor}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Circle className="w-3 h-3 text-gray-400" />
                    <span className="text-muted-foreground">
                      {pendingTasks.length}
                      {" To Do"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-blue-600" />
                    <span className="text-muted-foreground">
                      {inProgressTasks.length}
                      {" In Progress"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                    <span className="text-muted-foreground">
                      {completedTasks.length}
                      {" Done"}
                    </span>
                  </div>
                  {blockedTasks.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Ban className="w-3 h-3 text-red-600" />
                      <span className="text-muted-foreground">
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
                className="group relative flex h-7 w-full flex-shrink-0 cursor-ns-resize select-none items-center justify-center border-y border-border bg-muted/40 transition-colors hover:bg-primary/10 active:bg-primary/20"
              >
                <div className="flex items-center gap-1.5 rounded-full bg-background px-3 py-1 shadow-sm ring-1 ring-border transition-all group-hover:ring-primary/50 group-hover:shadow-md group-active:ring-primary">
                  <GripHorizontal className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
                  <span className="text-[10px] font-medium text-muted-foreground transition-colors group-hover:text-primary select-none">drag to expand</span>
                </div>
              </div>
              <div className="flex-shrink-0 overflow-hidden" style={{ height: kanbanHeight }}>
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center space-y-3">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Loading tasks...
                    </p>
                  </div>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center space-y-3 p-8">
                    <Target className="w-16 h-16 mx-auto text-muted-foreground opacity-20" />
                    <p className="text-lg font-medium text-muted-foreground">
                      No tasks found
                    </p>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      {user.role === "founder" && activeTab === "team-tasks"
                        ? "No tasks have been assigned to teammates yet"
                        : user.role === "founder"
                        ? "Tasks you add to milestones will appear here"
                        : "No tasks have been assigned to you yet"}
                    </p>
                  </div>
                </div>
              ) : activeTab === "team-tasks" ? (
                <div className="h-full overflow-y-auto p-4 space-y-6">
                  {teamTasksByAssignee.map((group) => (
                    <div key={group.id}>
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-[11px] font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                          {group.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium">{group.name}</span>
                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                          {group.tasks.length} task{group.tasks.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <div className="space-y-2 pl-9">
                        {group.tasks.map((task) => (
                          <Card key={task.id} className={`border-l-4 ${getStatusColor(task.status)}`}>
                            <CardContent className="p-3 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-xs leading-tight flex-1 font-medium">{task.title}</h4>
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
                                          <PlayCircle className="w-3.5 h-3.5 mr-2 text-blue-600" />Start Progress
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleStatusChange(task.id, "completed")}>
                                          <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-green-600" />Mark Complete
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
                                <p className="text-[10px] text-muted-foreground line-clamp-2">{task.description}</p>
                              )}
                              {task.status === "blocked" && task.blockerNote && (
                                <div className="p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded text-[10px]">
                                  <div className="flex items-center gap-1 text-red-700 dark:text-red-300 font-medium mb-1">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>Blocked: {task.blockerNote}</span>
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border">
                                <span>{task.milestoneName || "No milestone"}</span>
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
                <div className="h-full overflow-hidden p-4 flex flex-col">
                  <div className="md:hidden flex-1 overflow-x-auto snap-x snap-mandatory flex gap-4">
                    {columns.map((column) => (
                      <div
                        key={column.id}
                        className="flex-shrink-0 w-[70vw] snap-start flex flex-col min-h-0"
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(column.id)}
                      >
                        <div
                          className={`${column.color} rounded-t-lg p-2.5 border-b-2 border-blue-200 dark:border-blue-800 flex-shrink-0`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(column.id)}
                              <span className="text-xs font-medium">
                                {column.title}
                              </span>
                            </div>
                            <Badge
                              variant="secondary"
                              className="h-5 px-1.5 text-[10px]"
                            >
                              {column.tasks.length}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex-1 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-lg border border-t-0 overflow-y-auto min-h-0">
                          <div className="space-y-2 p-2">
                            {column.tasks.map((task) => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                founderId={founderId}
                                teamMembers={teamMembers}
                                onDragStart={handleDragStart}
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
                              <div className="text-center py-8 text-muted-foreground text-xs">
                                <Circle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p>No tasks</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    className={`hidden md:grid gap-4 flex-1 min-h-0 ${columns.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}
                  >
                    {columns.map((column) => (
                      <div
                        key={column.id}
                        className="flex flex-col min-h-0"
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(column.id)}
                      >
                        <div
                          className={`${column.color} rounded-t-lg p-2.5 border-b-2 border-blue-200 dark:border-blue-800 flex-shrink-0`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(column.id)}
                              <span className="text-xs font-medium">
                                {column.title}
                              </span>
                            </div>
                            <Badge
                              variant="secondary"
                              className="h-5 px-1.5 text-[10px]"
                            >
                              {column.tasks.length}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex-1 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-lg border border-t-0 overflow-y-auto min-h-0">
                          <div className="space-y-2 p-2">
                            {column.tasks.map((task) => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                founderId={founderId}
                                teamMembers={teamMembers}
                                onDragStart={handleDragStart}
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
                              <div className="text-center py-8 text-muted-foreground text-xs">
                                <Circle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p>No tasks</p>
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
      {false && user.role === "founder" && (
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-md z-[75] office-dialog-panel">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Add a new task to your board
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Task Title *</Label>
                <Input
                  placeholder="Enter task title..."
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      title: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Textarea
                  placeholder="Enter task description..."
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      description: e.target.value,
                    })
                  }
                  className="mt-1 h-20"
                />
              </div>
              <div>
                <Label className="text-xs">Milestone *</Label>
                <Select
                  value={newTask.milestoneId}
                  onValueChange={(v) =>
                    setNewTask({
                      ...newTask,
                      milestoneId: v,
                    })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select milestone..." />
                  </SelectTrigger>
                  <SelectContent className="z-[80]">
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
                  onValueChange={(v) =>
                    setNewTask({
                      ...newTask,
                      assigneeId: v,
                    })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select team member..." />
                  </SelectTrigger>
                  <SelectContent className="z-[80]">
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-5 h-5">
                            <AvatarFallback className="text-[9px]">
                              {member.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
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
                  onClick={() => setShowCreateDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTask}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Create Task
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {false && user.role === "founder" && (
        <Dialog open={showMilestoneDialog} onOpenChange={setShowMilestoneDialog}>
          <DialogContent className="max-w-md z-[75] office-dialog-panel">
            <DialogHeader>
              <DialogTitle>Create Milestone</DialogTitle>
              <DialogDescription>
                Milestones organize weekly tasks and progress.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Milestone Title *</Label>
                <Input
                  placeholder="Enter milestone title..."
                  value={newMilestone.title}
                  onChange={(e) =>
                    setNewMilestone((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Textarea
                  placeholder="Describe this milestone..."
                  value={newMilestone.description}
                  onChange={(e) =>
                    setNewMilestone((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="mt-1 h-20"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowMilestoneDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateMilestone}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Create Milestone
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

// Task Card Component

function TaskCard({
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
}) {
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState(
    task.assignedTo || "",
  );
  const [showBlockDialog, setShowBlockDialog] = useState(false); // Add blocker dialog state
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
        id={`task-${task.id}`}
        draggable={true}
        onDragStart={() => onDragStart(task)}
        layout={true}
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="cursor-move group"
      >
        <Card
          className={`hover:shadow-md transition-shadow border-l-4 ${getStatusColor(task.status)}`}
        >
          <CardContent className="p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-xs leading-tight flex-1 font-medium">
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
                          <PlayCircle className="w-3.5 h-3.5 mr-2 text-blue-600" />
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
                          <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-green-600" />
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
                            <User className="w-3.5 h-3.5 mr-2 text-blue-600" />
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
              <p className="text-[10px] text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}
            {task.status === "blocked" && task.blockerNote && (
              <div className="p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded text-[10px]">
                <div className="flex items-center gap-1 text-red-700 dark:text-red-300 font-medium mb-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>Blocked</span>
                </div>
                <p className="text-red-600 dark:text-red-400">
                  {task.blockerNote}
                </p>
              </div>
            )}
            <Separator />
            <div className="flex items-center justify-between text-[10px]">
              {task.assignedToName ? (
                <div className="flex items-center gap-1.5">
                  <Avatar className="w-5 h-5">
                    <AvatarFallback className="text-[8px]">
                      {task.assignedToName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-muted-foreground truncate max-w-[100px]">
                    {task.assignedToName}
                  </span>
                </div>
              ) : (
                <span className="text-muted-foreground italic">Unassigned</span>
              )}
              {task.milestoneName && (
                <Badge variant="outline" className="text-[9px] h-4 px-1">
                  {task.milestoneName}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent
          className="max-w-sm z-[80] office-dialog-panel"
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
                    <span className="italic text-muted-foreground">
                      Unassigned
                    </span>
                  </SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarFallback className="text-[9px]">
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
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
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Assign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent
          className="max-w-sm z-[80] office-dialog-panel"
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
                        <Avatar className="w-5 h-5">
                          <AvatarFallback className="text-[9px]">
                            {reason.label
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span>{reason.label}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
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
