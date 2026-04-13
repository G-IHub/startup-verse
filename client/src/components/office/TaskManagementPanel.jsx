import React, { useState, useEffect } from "react";
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
import { STORAGE_KEYS } from "../../app/session";

export function TaskManagementPanel({
  open,
  onClose,
  user,
  onPlaySound,
  openAddDialog,
  initialTaskId,
}) {
  const [localTasks, setLocalTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [founderId, setFounderId] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(
    openAddDialog || false,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [draggedTask, setDraggedTask] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync openAddDialog from props
  useEffect(() => {
    if (openAddDialog !== undefined) {
      setShowCreateDialog(openAddDialog);
    }
  }, [openAddDialog]);

  // Load tasks and team members
  useEffect(() => {
    if (!open) return;
    const loadData = async () => {
      setLoading(true);

      // Get all users from localStorage
      const allUsers = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.teamMembers) || "[]",
      );

      // Determine the founder ID (we don't need the full founder object)
      let founderIdValue = "";
      if (user.role === "founder") {
        founderIdValue = user.id;
        setFounderId(user.id);
      } else if (user.role === "team-member" && user.startupId) {
        // For team members, startupId should be the founder's ID
        founderIdValue = user.startupId;
        setFounderId(user.startupId);
      } else if (user.role === "team" && user.founderId) {
        // Handle team member with founderId
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

      // Load tasks for the founder - BACKEND FIRST
      try {
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
        setLocalTasks(tasks);
        console.log(`✅ [TaskPanel] Loaded ${tasks.length} tasks from backend`);
      } catch (error) {
        console.error(
          "❌ [TaskPanel] Error loading tasks from backend:",
          error,
        );
        // Fallback to localStorage
        const allTasks = getTasks(founderIdValue);
        let filteredTasks = allTasks;
        if (user.role === "team-member" || user.role === "team") {
          filteredTasks = allTasks.filter(
            (t) => t.assignedTo === user.id || t.assigneeId === user.id,
          );
        }
        setLocalTasks(filteredTasks);
      }

      // Load team members (for task assignment) - FROM BACKEND
      try {
        const startupId = founderIdValue;
        console.log(
          "🔍 [TaskPanel] Loading team members for startup:",
          startupId,
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
          await teamMemberApi.getStartupTeamMembers(startupId);
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
  }, [open, user.id, user.role, user.startupId, user.founderId]);

  // Handle initialTaskId - scroll to and highlight the task
  useEffect(() => {
    if (initialTaskId && open && localTasks.length > 0) {
      console.log("🎯 [TaskPanel] Scrolling to task:", initialTaskId);
      // Give the panel time to render, then scroll to the task
      setTimeout(() => {
        const taskElement = document.getElementById(`task-${initialTaskId}`);
        if (taskElement) {
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
  const handleCreateTask = () => {
    if (!newTask.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }
    if (!founderId) {
      toast.error("No founder found");
      return;
    }
    const assignee = teamMembers.find((m) => m.id === newTask.assigneeId);
    const task = {
      id: `task-${Date.now()}`,
      title: newTask.title,
      description: newTask.description,
      status: "pending",
      milestoneId: newTask.milestoneId || "general",
      assignedTo: assignee?.id,
      assignedToName: assignee?.name,
      createdAt: new Date().toISOString(),
    };
    const updatedTasks = [task, ...localTasks];
    setLocalTasks(updatedTasks);
    saveTasks(founderId, updatedTasks);

    // 🚀 Sync tasks to milestones (new task increases totalTasks)
    syncTasksToMilestones(founderId);
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
  const handleToggleTask = (taskId) => {
    if (!founderId) return;
    const updatedTasks = toggleTask(founderId, taskId);
    setLocalTasks(
      updatedTasks.filter(
        (t) => user.role === "founder" || t.assignedTo === user.id,
      ),
    );
    const task = updatedTasks.find((t) => t.id === taskId);

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
    onPlaySound?.();
  };
  const handleDeleteTask = (taskId) => {
    if (!founderId) return;
    const updatedTasks = localTasks.filter((t) => t.id !== taskId);
    setLocalTasks(updatedTasks);
    saveTasks(founderId, updatedTasks);

    // 🚀 Sync tasks to milestones (deleting task updates counts)
    syncTasksToMilestones(founderId);
    toast.success("Task deleted");
    onPlaySound?.();
  };
  const handleStatusChange = (taskId, newStatus) => {
    if (!founderId) return;
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
    setLocalTasks(updatedTasks);
    saveTasks(founderId, updatedTasks);

    // 🚀 Sync tasks to milestones
    syncTasksToMilestones(founderId);

    // 🔔 Sync to backend to trigger notifications (team members only)
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
          console.log(
            `✅ Task status '${newStatus}' synced to backend - founder notified`,
          ),
        )
        .catch((error) => console.error("❌ Backend sync failed:", error));
    }
    const statusLabel =
      newStatus === "in-progress"
        ? "In Progress"
        : newStatus === "pending"
          ? "To Do"
          : "Completed";
    toast.success(`Task moved to ${statusLabel}`);
    onPlaySound?.();
    if (newStatus === "completed") {
      const task = updatedTasks.find((t) => t.id === taskId);
      if (task) {
        createTaskCompletedNotification(task);
      }
    }
  };
  const handleBlockTask = (taskId, reason, note) => {
    if (!founderId) return;
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
    setLocalTasks(updatedTasks);
    saveTasks(founderId, updatedTasks);

    // 🚀 Sync tasks to milestones
    syncTasksToMilestones(founderId);

    // 🔔 Sync to backend to trigger notifications (team members only)
    if (user.role === "team-member") {
      teamMemberApi
        .updateTaskStatus(user.id, taskId, {
          status: "blocked",
          blockReason: reason,
          blockNote: note,
          founderId: founderId,
          completedBy: user.id,
          completedByName: user.name,
        })
        .then(() =>
          console.log(`✅ Task blocked synced to backend - founder notified`),
        )
        .catch((error) => console.error("❌ Backend sync failed:", error));
    }
    toast.error("Task marked as blocked");
    onPlaySound?.();
    const task = updatedTasks.find((t) => t.id === taskId);
    if (task) {
      createTaskBlockedNotification(task);
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
      saveTasks(founderId, updatedTasks);

      // 🚀 Sync tasks to milestones when status changes
      syncTasksToMilestones(founderId);
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

  // Filter tasks
  const filteredTasks = localTasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || task.status === filterStatus;
    return matchesSearch && matchesStatus;
  });
  const pendingTasks = filteredTasks.filter((t) => t.status === "pending");
  const inProgressTasks = filteredTasks.filter(
    (t) => t.status === "in-progress",
  );
  const completedTasks = filteredTasks.filter((t) => t.status === "completed");
  const blockedTasks = filteredTasks.filter((t) => t.status === "blocked");
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
                damping: 30,
                stiffness: 300,
              }}
              className="fixed right-0 top-0 h-full w-full md:w-[900px] bg-white dark:bg-slate-900 shadow-2xl z-[70] flex flex-col border-l-2 border-slate-200 dark:border-slate-700"
            >
              <div className="p-3 border-b-2 border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50">
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
                <p className="text-xs text-muted-foreground">
                  {localTasks.length}
                  {" total task"}
                  {localTasks.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="p-4 border-b bg-slate-50 dark:bg-slate-900/50 space-y-3">
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
                  {user.role === "founder" && (
                    <Button
                      onClick={() => setShowCreateDialog(true)}
                      className="bg-blue-600 hover:bg-blue-700 h-9"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      New Task
                    </Button>
                  )}
                </div>
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
              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Loading tasks...
                    </p>
                  </div>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-3 p-8">
                    <Target className="w-16 h-16 mx-auto text-muted-foreground opacity-20" />
                    <p className="text-lg font-medium text-muted-foreground">
                      No tasks found
                    </p>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      {user.role === "founder"
                        ? "Create your first task to get started"
                        : "No tasks have been assigned to you yet"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-hidden p-4 flex flex-col">
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
                                  saveTasks(founderId, updatedTasks);
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
                                  saveTasks(founderId, updatedTasks);
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {user.role === "founder" && (
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-md z-[75]">
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
    if (onBlock && blockReason) {
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
