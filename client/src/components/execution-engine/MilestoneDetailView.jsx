import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Checkbox } from "../ui/checkbox";
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  User,
  Flag,
  X,
  UserPlus,
  ExternalLink,
  Users,
  UserCircle,
  Search,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import TaskAssignmentModal from "./TaskAssignmentModal";
import TaskIncentiveModal from "./TaskIncentiveModal";
export default function MilestoneDetailView({
  isOpen,
  onClose,
  outcome,
  tasks,
  onToggleTask,
  onBlockTask,
  onUnblockTask,
  onAssignTask,
  onSetTaskIncentive,
  teamMembers,
  founderId,
  founderName,
  onNavigate,
  onVirtualOfficeViewChange,
}) {
  const [expandedMilestones, setExpandedMilestones] = useState(new Set());
  const [blockingTaskId, setBlockingTaskId] = useState(null);
  const [blockReason, setBlockReason] = useState("");
  const [blockNote, setBlockNote] = useState("");
  const [assigningTask, setAssigningTask] = useState(null);
  const [incentiveTask, setIncentiveTask] = useState(null);
  if (!isOpen) return null;
  const toggleMilestone = (milestoneId) => {
    const newExpanded = new Set(expandedMilestones);
    if (newExpanded.has(milestoneId)) {
      newExpanded.delete(milestoneId);
    } else {
      newExpanded.add(milestoneId);
    }
    setExpandedMilestones(newExpanded);
  };
  const getTasksForMilestone = (milestoneId) => {
    return tasks.filter((t) => t.milestoneId === milestoneId);
  };
  const getMilestoneIcon = (milestone) => {
    if (milestone.status === "completed")
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    if (milestone.status === "in-progress")
      return <Circle className="w-5 h-5 text-primary fill-primary/20" />;
    return <Circle className="w-5 h-5 text-muted-foreground" />;
  };
  const handleBlockTask = () => {
    if (blockingTaskId && blockReason) {
      onBlockTask(blockingTaskId, blockReason, blockNote);
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
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3">
      <Card className="w-full sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <CardHeader className="pb-2 pt-3 border-b flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                {outcome.title}
              </CardTitle>
              <CardDescription className="mt-1 text-xs">
                {"Week "}
                {outcome.weekNumber}
                {" • "}
                {outcome.milestones.length}
                {" milestones • "}
                {tasks.length}
                {" tasks"}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 rounded-full !bg-gray-200 dark:!bg-gray-700 hover:!bg-gray-300 dark:hover:!bg-gray-600 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4 flex-1 overflow-y-auto min-h-0 py-3 md:py-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
          <div className="p-4 bg-primary/5 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">
                {
                  outcome.milestones.filter((m) => m.status === "completed")
                    .length
                }
                {" / "}
                {outcome.milestones.length}
                {" milestones"}
              </span>
            </div>
            <Progress
              value={
                (outcome.milestones.filter((m) => m.status === "completed")
                  .length /
                  outcome.milestones.length) *
                100
              }
              className="h-2"
            />
          </div>
          <div className="space-y-3">
            {outcome.milestones.map((milestone) => {
              const milestoneTasks = getTasksForMilestone(milestone.id);
              const isExpanded = expandedMilestones.has(milestone.id);
              const completedTasks = milestoneTasks.filter(
                (t) => t.status === "completed",
              ).length;
              const blockedTasks = milestoneTasks.filter(
                (t) => t.status === "blocked",
              ).length;
              return (
                <div
                  key={milestone.id}
                  className="border rounded-lg overflow-hidden"
                >
                  <div
                    className={`p-4 cursor-pointer transition-colors ${milestone.status === "completed" ? "bg-green-50 dark:bg-green-950/20" : milestone.status === "in-progress" ? "bg-primary/5" : "bg-muted/30"}`}
                    onClick={() => toggleMilestone(milestone.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        )}
                        {getMilestoneIcon(milestone)}
                        <div className="flex-1">
                          <h4
                            className={`font-semibold ${milestone.status === "completed" ? "line-through text-muted-foreground" : ""}`}
                          >
                            {milestone.title}
                          </h4>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span>
                              {completedTasks}/{milestoneTasks.length}
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
                      </div>
                      <div className="ml-4">
                        <Progress
                          value={(completedTasks / milestoneTasks.length) * 100}
                          className="w-24 h-2"
                        />
                      </div>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="p-4 space-y-2 bg-background">
                      {milestoneTasks.map((task) => (
                        <div
                          key={task.id}
                          className={`p-2 rounded-lg border-2 transition-all ${task.status === "completed" ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900" : task.status === "blocked" ? "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900" : task.status === "in-progress" ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900" : "border-border"}`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              <Checkbox
                                checked={task.status === "completed"}
                                onCheckedChange={() => onToggleTask(task.id)}
                                disabled={task.status === "blocked"}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center min-h-[20px]">
                                <span
                                  className={`text-xs ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}
                                >
                                  {task.title}
                                </span>
                              </div>
                              {task.description && (
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  {task.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-1.5 text-xs flex-wrap">
                                {task.assignedToName && (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <User className="w-3 h-3" />
                                    <span>{task.assignedToName}</span>
                                  </div>
                                )}
                                {task.status === "blocked" &&
                                  task.blockerReason && (
                                    <Badge
                                      variant="outline"
                                      className="text-orange-600 border-orange-300"
                                    >
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      {
                                        blockerReasons.find(
                                          (r) => r.value === task.blockerReason,
                                        )?.label
                                      }
                                    </Badge>
                                  )}
                                {task.status === "in-progress" && (
                                  <Badge
                                    variant="outline"
                                    className="text-blue-600 border-blue-300"
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
                                        console.log(
                                          "Action button clicked:",
                                          task.actionButton,
                                        );
                                        if (task.actionButton?.route) {
                                          // Smart navigation based on route
                                          if (
                                            task.actionButton.route ===
                                            "startup-office"
                                          ) {
                                            // Navigate to startup office with matching view
                                            if (onNavigate)
                                              onNavigate("startup-office");
                                            if (onVirtualOfficeViewChange)
                                              onVirtualOfficeViewChange(
                                                "matching",
                                              );
                                          } else if (
                                            task.actionButton.route === "team"
                                          ) {
                                            // Navigate to startup office workspace (where team panel is)
                                            if (onNavigate)
                                              onNavigate("startup-office");
                                            if (onVirtualOfficeViewChange)
                                              onVirtualOfficeViewChange(
                                                "workspace",
                                              );
                                          } else {
                                            // For other pages like settings, just navigate
                                            if (onNavigate) {
                                              onNavigate(
                                                task.actionButton.route,
                                              );
                                            } else {
                                              window.location.href =
                                                task.actionButton.route;
                                            }
                                          }
                                          // Close modal after navigation
                                          onClose();
                                        }
                                      }}
                                    >
                                      {task.actionButton.icon === "search" && (
                                        <Search className="w-4 h-4 mr-2" />
                                      )}
                                      {task.actionButton.icon === "users" && (
                                        <Users className="w-4 h-4 mr-2" />
                                      )}
                                      {task.actionButton.icon === "user" && (
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
                            {task.status !== "completed" && (
                              <div className="flex gap-1">
                                {task.status === "blocked" ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onUnblockTask(task.id)}
                                  >
                                    Unblock
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setBlockingTaskId(task.id)}
                                  >
                                    <Flag className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setAssigningTask(task)}
                                >
                                  <UserPlus className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {milestoneTasks.length === 0 && (
                        <div className="text-center py-6 text-muted-foreground">
                          <p className="text-sm">
                            No tasks yet. Tasks will be generated automatically.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      {blockingTaskId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <Card className="w-full sm:max-w-lg">
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Flag className="w-5 h-5 text-orange-500" />
                Report Task Blocker
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {blockerReasons.map((reason) => (
                  <div
                    key={reason.value}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${blockReason === reason.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
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
          onClose={() => setAssigningTask(null)}
          task={assigningTask}
          teamMembers={teamMembers}
          founderId={founderId}
          founderName={founderName}
          onAssign={onAssignTask}
        />
      )}
      {incentiveTask && (
        <TaskIncentiveModal
          isOpen={!!incentiveTask}
          onClose={() => setIncentiveTask(null)}
          task={incentiveTask}
          onIncentiveSet={(incentive) => {
            if (incentiveTask && onSetTaskIncentive) {
              onSetTaskIncentive(incentiveTask.id, incentive);
            }
          }}
        />
      )}
    </div>
  );
}
