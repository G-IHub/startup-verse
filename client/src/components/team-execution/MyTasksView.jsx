import React, { useState, useEffect } from "react";
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
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Textarea } from "../ui/textarea";
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  Target,
  Flag,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  X,
  Send,
} from "lucide-react";
import {
  getTasks,
  toggleTask,
  blockTask,
  addTaskComment as addTaskCommentLocal,
} from "../../utils/executionEngine";
import * as teamMemberApi from "../../utils/api/teamMemberApi";
import { toast } from "sonner";
export default function MyTasksView({ userId, userName, founderId }) {
  const [allTasks, setAllTasks] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [expandedTask, setExpandedTask] = useState(null);
  const [blockingTaskId, setBlockingTaskId] = useState(null);
  const [blockReason, setBlockReason] = useState("");
  const [blockNote, setBlockNote] = useState("");
  const [commentText, setCommentText] = useState("");
  const blockerReasons = [
    {
      value: "waiting-on-others",
      label: "Waiting on Others",
    },
    {
      value: "missing-info",
      label: "Missing Information",
    },
    {
      value: "technical-issue",
      label: "Technical Issue",
    },
    {
      value: "resource-constraint",
      label: "Resource Constraint",
    },
  ];
  useEffect(() => {
    loadMyTasks();
  }, [userId, founderId]);
  const loadMyTasks = () => {
    const tasks = getTasks(founderId);
    const assigned = tasks.filter((task) => task.assignedTo === userId);
    setAllTasks(tasks);
    setMyTasks(assigned);
  };
  const handleToggleTask = (taskId) => {
    const task = myTasks.find((t) => t.id === taskId);
    const newStatus = task?.status === "completed" ? "pending" : "completed";

    // 1. Update localStorage INSTANTLY for zero-latency UX
    const updatedTasks = toggleTask(founderId, taskId);
    loadMyTasks();

    // 2. Sync to backend in BACKGROUND
    teamMemberApi
      .updateTaskStatus(userId, taskId, {
        status: newStatus,
        completedAt:
          newStatus === "completed" ? new Date().toISOString() : undefined,
        founderId: founderId,
        // ✅ Pass founderId to use founder's endpoint
        completedBy: userId,
        // ✅ Pass who is completing the task
        completedByName: userName, // ✅ Pass team member name
      })
      .then(() =>
        console.log(
          `✅ Task ${newStatus} synced to backend - founder notified`,
        ),
      )
      .catch((error) => console.error("❌ Backend sync failed:", error));

    // 3. Show toast feedback
    if (newStatus === "completed") {
      toast.success("🎉 Task completed!", {
        description: "Great work! Your founder has been notified.",
      });
    } else {
      toast.success("Task marked as pending");
    }
  };
  const handleBlockTask = () => {
    if (!blockingTaskId || !blockReason) return;

    // 1. Update localStorage INSTANTLY
    const updatedTasks = blockTask(
      founderId,
      blockingTaskId,
      blockReason,
      blockNote,
    );
    loadMyTasks();

    // 2. Sync to backend in BACKGROUND
    teamMemberApi
      .updateTaskStatus(userId, blockingTaskId, {
        status: "blocked",
        blockReason,
        blockNote,
        founderId: founderId,
        // ✅ Pass founderId to use founder's endpoint
        completedBy: userId,
        // ✅ Pass who is blocking the task
        completedByName: userName, // ✅ Pass team member name
      })
      .then(() => console.log("✅ Task blocked and synced to backend"))
      .catch((error) => console.error("❌ Backend sync failed:", error));

    // 3. Show toast feedback
    toast.info("Task marked as blocked", {
      description: "Your founder has been notified and will help unblock this.",
    });
    setBlockingTaskId(null);
    setBlockReason("");
    setBlockNote("");
  };
  const handleAddComment = (taskId) => {
    if (!commentText.trim()) return;

    // 1. Update localStorage INSTANTLY
    addTaskCommentLocal(founderId, taskId, userId, userName, commentText);
    loadMyTasks();

    // 2. Sync to backend in BACKGROUND
    teamMemberApi
      .addTaskComment(userId, taskId, commentText, userName)
      .then(() => console.log("✅ Comment synced to backend"))
      .catch((error) => console.error("❌ Backend sync failed:", error));

    // 3. Show toast feedback
    toast.success("Comment added");
    setCommentText("");
  };
  const filteredTasks =
    filter === "all"
      ? myTasks
      : myTasks.filter((task) => task.status === filter);
  const stats = {
    total: myTasks.length,
    pending: myTasks.filter((t) => t.status === "pending").length,
    inProgress: myTasks.filter((t) => t.status === "in-progress").length,
    completed: myTasks.filter((t) => t.status === "completed").length,
    blocked: myTasks.filter((t) => t.status === "blocked").length,
  };
  const completionRate =
    stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-primary" />
                My Tasks
              </CardTitle>
              <CardDescription className="mt-1">
                Tasks assigned to you this week
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">
                {stats.completed}/{stats.total}
              </div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Your Progress</span>
              <span className="text-sm text-muted-foreground">
                {Math.round(completionRate)}%
              </span>
            </div>
            <Progress value={completionRate} className="h-3" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
            >
              All ({stats.total})
            </Button>
            <Button
              size="sm"
              variant={filter === "pending" ? "default" : "outline"}
              onClick={() => setFilter("pending")}
            >
              <Clock className="w-4 h-4 mr-1" />
              Pending ({stats.pending})
            </Button>
            <Button
              size="sm"
              variant={filter === "in-progress" ? "default" : "outline"}
              onClick={() => setFilter("in-progress")}
            >
              <Circle className="w-4 h-4 mr-1 fill-blue-500" />
              In Progress ({stats.inProgress})
            </Button>
            <Button
              size="sm"
              variant={filter === "completed" ? "default" : "outline"}
              onClick={() => setFilter("completed")}
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Completed ({stats.completed})
            </Button>
            {stats.blocked > 0 && (
              <Button
                size="sm"
                variant={filter === "blocked" ? "default" : "outline"}
                onClick={() => setFilter("blocked")}
              >
                <AlertCircle className="w-4 h-4 mr-1" />
                Blocked ({stats.blocked})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      {filteredTasks.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">
              {"No tasks "}
              {filter !== "all" ? filter : "assigned"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {filter === "all"
                ? "Your founder hasn't assigned you any tasks yet."
                : `You don't have any ${filter} tasks.`}
            </p>
          </CardContent>
        </Card>
      )}
      {filteredTasks.map((task) => {
        const isExpanded = expandedTask === task.id;
        return (
          <Card
            key={task.id}
            className={`transition-all ${task.status === "completed" ? "border-green-200 bg-green-50/50 dark:bg-green-950/20" : task.status === "blocked" ? "border-orange-200 bg-orange-50/50 dark:bg-orange-950/20" : task.status === "in-progress" ? "border-blue-200 bg-blue-50/50 dark:bg-blue-950/20" : ""}`}
          >
            <CardHeader>
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={task.status === "completed"}
                  onCheckedChange={() => handleToggleTask(task.id)}
                  disabled={task.status === "blocked"}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <CardTitle
                    className={`text-lg ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}
                  >
                    {task.title}
                  </CardTitle>
                  {task.description && (
                    <CardDescription className="mt-1">
                      {task.description}
                    </CardDescription>
                  )}
                  <div className="flex items-center gap-3 mt-3 text-xs">
                    <Badge variant="outline">{task.milestoneName}</Badge>
                    {task.status === "blocked" && task.blockerReason && (
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
                    {task.status === "completed" && task.completedAt && (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {"Completed "}
                        {new Date(task.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </Button>
              </div>
              {task.status === "blocked" && task.blockerNote && (
                <div className="mt-3 p-3 bg-orange-100 dark:bg-orange-950/30 rounded-lg">
                  <p className="text-sm text-orange-900 dark:text-orange-100">
                    <strong>Blocker:</strong> {task.blockerNote}
                  </p>
                </div>
              )}
            </CardHeader>
            {isExpanded && (
              <CardContent className="border-t space-y-4">
                {task.status !== "completed" && (
                  <div className="flex gap-2">
                    {task.status === "blocked" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={true}
                        className="flex-1"
                      >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Waiting for Unblock
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setBlockingTaskId(task.id)}
                          className="flex-1"
                        >
                          <Flag className="w-4 h-4 mr-2" />
                          Report Blocker
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleToggleTask(task.id)}
                          className="flex-1"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Mark Complete
                        </Button>
                      </>
                    )}
                  </div>
                )}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    {"Comments "}
                    {task.comments && `(${task.comments.length})`}
                  </h4>
                  {task.comments && task.comments.length > 0 && (
                    <div className="space-y-2">
                      {task.comments.map((comment, idx) => (
                        <div
                          key={idx}
                          className="flex gap-3 p-3 bg-muted/50 rounded-lg"
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {comment.userName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">
                                {comment.userName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(comment.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <p className="text-sm mt-1">{comment.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Add a comment or update..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddComment(task.id)}
                      disabled={!commentText.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
      {blockingTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sv-modal-backdrop">
          <Card className="sv-modal-panel w-full max-w-md rounded-[16px] border-0 shadow-modal">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Flag className="w-5 h-5 text-orange-500" />
                    Report Blocker
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Let your founder know what's blocking you
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setBlockingTaskId(null);
                    setBlockReason("");
                    setBlockNote("");
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Blocker Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {blockerReasons.map((reason) => (
                    <Button
                      key={reason.value}
                      variant={
                        blockReason === reason.value ? "default" : "outline"
                      }
                      onClick={() => setBlockReason(reason.value)}
                      className="h-auto py-3 text-xs"
                    >
                      {reason.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Details (Optional)
                </label>
                <Textarea
                  placeholder="Explain what's blocking you and what help you need..."
                  value={blockNote}
                  onChange={(e) => setBlockNote(e.target.value)}
                  className="min-h-[100px]"
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
    </div>
  );
}
