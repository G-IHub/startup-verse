import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Progress } from "../ui/progress";
import { getTasks } from "../../utils/executionEngine";
import * as teamMemberApi from "../../utils/api/teamMemberApi";
import * as compensationApi from "../../utils/api/compensationApi";
import * as meetingApi from "../../utils/api/meetingApi";
// ✅ Added pagination hook
// ✅ Added pagination controls
import { getInitials } from "../../utils/nameHelpers"; // ✅ Safe name handling
import { STORAGE_KEYS } from "../../app/session";
import PendingCompensationBanner from "../compensation/PendingCompensationBanner";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Target,
  ArrowRight,
  Building,
  Video,
  CheckSquare,
  Users,
  Calendar,
  ListChecks,
  Zap,
  TrendingUp,
  Activity,
} from "lucide-react";
export default function TeamMemberDashboard({ user, onNavigate }) {
  const [founderId, setFounderId] = useState(null);
  const [founderName, setFounderName] = useState("");
  const [myTasks, setMyTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasCompensation, setHasCompensation] = useState(false);
  const [checkingCompensation, setCheckingCompensation] = useState(true);

  // Find the founder based on startupId
  useEffect(() => {
    loadDashboardData();

    // ✅ REALTIME: Removed dashboard polling (was every 10s) - using real-time subscription

    return () => {
      // Real-time subscription cleanup handled separately
    };
  }, [user.id, user.startupId, user.companyId]);
  const loadDashboardData = async () => {
    const startupId = user.startupId;
    if (!startupId) {
      setLoading(false);
      return;
    }
    try {
      // 1. Load from localStorage FIRST (instant display)
      const allUsers = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.teamMembers) || "[]",
      );

      // Find founder
      const founder = allUsers.find(
        (u) => u.id === startupId && u.role === "founder",
      );
      if (founder) {
        setFounderId(founder.id);
        setFounderName(founder.name);

        // Load tasks from localStorage initially
        const allTasks = getTasks(founder.id);
        const assignedTasks = allTasks.filter((t) => t.assignedTo === user.id);
        setMyTasks(assignedTasks);
      }

      // Load team members from localStorage
      const team = allUsers.filter(
        (u) =>
          u.id !== user.id &&
          (() => {
            // Team member sees: founder + other team members in same startup ONLY
            const founderIdToMatch = user.startupId || user.founderId;
            return (
              u.id === founderIdToMatch ||
              // Include the founder
              u.startupId === founderIdToMatch ||
              // Other team members with same startupId
              u.founderId === founderIdToMatch
            ); // Other team members with same founderId
          })(),
      );
      setTeamMembers(team);
      setLoading(false);

      // 2. Fetch tasks from backend in BACKGROUND
      try {
        const backendTasks = await teamMemberApi.getTeamMemberTasks(user.id);
        setMyTasks(backendTasks);
        console.log("✅ Tasks loaded from backend:", backendTasks.length);
      } catch (error) {
        // Silently fail and use localStorage data
        if (process.env.NODE_ENV === "development") {
          console.debug(
            "Failed to load tasks from backend (expected in demo mode):",
            error.message,
          );
        }
      }

      // 3. Check compensation status
      try {
        const compensationResult =
          await compensationApi.getCompensationContract(user.id);
        if (compensationResult.success && compensationResult.contract) {
          setHasCompensation(true);
          console.log("✅ Team member has compensation contract");
        } else {
          setHasCompensation(false);
          console.log("⏳ Team member pending compensation setup");
        }
      } catch (error) {
        console.error("Failed to check compensation status:", error);
        setHasCompensation(false);
      } finally {
        setCheckingCompensation(false);
      }

      // 4. Optionally fetch team members from backend
      if (startupId) {
        try {
          const backendTeamMembers =
            await teamMemberApi.getStartupTeamMembers(startupId);
          if (backendTeamMembers && backendTeamMembers.length > 0) {
            const filteredTeam = backendTeamMembers.filter(
              (m) => m.id !== user.id,
            );
            setTeamMembers(filteredTeam);
            console.log(
              "✅ Team members loaded from backend:",
              filteredTeam.length,
            );
          }
        } catch (error) {
          // Silently fail and use localStorage data
          if (process.env.NODE_ENV === "development") {
            console.debug(
              "Failed to load team members from backend (expected in demo mode):",
              error.message,
            );
          }
        }
      }

      // 5. Optionally fetch meetings from backend
      if (startupId) {
        try {
          const backendMeetings =
            await meetingApi.getStartupMeetings(startupId);
          if (backendMeetings && backendMeetings.length > 0) {
            setMeetings(backendMeetings);
            console.log(
              "✅ Meetings loaded from backend:",
              backendMeetings.length,
            );
          }
        } catch (error) {
          // Silently fail and use localStorage data
          if (process.env.NODE_ENV === "development") {
            console.debug(
              "Failed to load meetings from backend (expected in demo mode):",
              error.message,
            );
          }
        }
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setLoading(false);
    }
  };

  // Calculate task statistics
  const totalTasks = myTasks.length;
  const completedTasks = myTasks.filter((t) => t.status === "completed").length;
  const inProgressTasks = myTasks.filter(
    (t) => t.status === "in-progress",
  ).length;
  const pendingTasks = myTasks.filter((t) => t.status === "pending").length;
  const blockedTasks = myTasks.filter((t) => t.status === "blocked").length;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Get today's date
  const today = new Date();
  const todayFormatted = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Generate recent activity feed
  const generateRecentActivity = () => {
    const activities = [];
    const allUsers = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.teamMembers) || "[]",
    );

    // Get all tasks from founder
    if (founderId) {
      const allTasks = getTasks(founderId);

      // Add completed tasks as activities
      const completedTasksWithAssignees = allTasks
        .filter((t) => t.status === "completed" && t.assignedTo)
        .slice(0, 5);
      completedTasksWithAssignees.forEach((task) => {
        const assignee = allUsers.find((u) => u.id === task.assignedTo);
        if (assignee) {
          activities.push({
            id: `completed-${task.id}`,
            user: assignee,
            action: "completed",
            task: task.title,
            time: getTimeAgo(
              task.updatedAt || task.createdAt || new Date().toISOString(),
            ),
            icon: CheckCircle2,
            color: "text-green-600",
            bgColor: "bg-green-100 dark:bg-green-900/30",
          });
        }
      });

      // Add in-progress tasks as activities
      const inProgressTasksWithAssignees = allTasks
        .filter((t) => t.status === "in-progress" && t.assignedTo)
        .slice(0, 3);
      inProgressTasksWithAssignees.forEach((task) => {
        const assignee = allUsers.find((u) => u.id === task.assignedTo);
        if (assignee) {
          activities.push({
            id: `started-${task.id}`,
            user: assignee,
            action: "started",
            task: task.title,
            time: getTimeAgo(
              task.updatedAt || task.createdAt || new Date().toISOString(),
            ),
            icon: Clock,
            color: "text-blue-600",
            bgColor: "bg-blue-100 dark:bg-blue-900/30",
          });
        }
      });
    }

    // Sort by most recent
    return activities.slice(0, 6);
  };

  // Helper function to get time ago
  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    if (diffInMins < 1) return "Just now";
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };
  const recentActivities = generateRecentActivity();

  // Generate upcoming events
  const generateUpcomingEvents = () => {
    const events = [];
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Add upcoming meetings
    const upcomingMeetings = meetings
      .filter((meeting) => {
        const meetingDate = new Date(meeting.date);
        return (
          meetingDate >= now &&
          meetingDate <= nextWeek &&
          meeting.status === "scheduled"
        );
      })
      .map((meeting) => ({
        id: `meeting-${meeting.id}`,
        type: "meeting",
        title: meeting.title,
        date: meeting.date,
        time: meeting.startTime,
        icon: meeting.type === "video-call" ? Video : Users,
        color: "text-purple-600",
        bgColor: "bg-purple-100 dark:bg-purple-900/30",
      }));
    events.push(...upcomingMeetings);

    // Add tasks with due dates
    const tasksWithDueDates = myTasks
      .filter((task) => {
        if (!task.dueDate || task.status === "completed") return false;
        const dueDate = new Date(task.dueDate);
        return dueDate >= now && dueDate <= nextWeek;
      })
      .map((task) => ({
        id: `task-${task.id}`,
        type: "task",
        title: task.title,
        date: task.dueDate,
        icon: CheckSquare,
        color:
          task.status === "in-progress" ? "text-blue-600" : "text-orange-600",
        bgColor:
          task.status === "in-progress"
            ? "bg-blue-100 dark:bg-blue-900/30"
            : "bg-orange-100 dark:bg-orange-900/30",
        status: task.status,
      }));
    events.push(...tasksWithDueDates);

    // Sort by date
    events.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
    return events.slice(0, 6);
  };
  const upcomingEvents = generateUpcomingEvents();

  // Helper to format relative time
  const getRelativeTime = (dateString, timeString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = date.getTime() - now.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    if (diffInDays === 0) {
      if (timeString) {
        return `Today at ${timeString}`;
      }
      return "Today";
    }
    if (diffInDays === 1) {
      if (timeString) {
        return `Tomorrow at ${timeString}`;
      }
      return "Tomorrow";
    }
    if (diffInDays < 7) {
      const dayName = date.toLocaleDateString("en-US", {
        weekday: "short",
      });
      if (timeString) {
        return `${dayName} at ${timeString}`;
      }
      return dayName;
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Task metrics for the cards
  const taskMetrics = [
    {
      label: "Total",
      value: totalTasks,
      icon: ListChecks,
      color: "text-[#3A5AFE]",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: "In Progress",
      value: inProgressTasks,
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: "Completed",
      value: completedTasks,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      label: "Pending",
      value: pendingTasks,
      icon: Target,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
    },
  ];
  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[10px] text-muted-foreground">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="p-2 md:p-3 space-y-2 max-w-[1400px] mx-auto min-h-screen">
      {!checkingCompensation && !hasCompensation && (
        <PendingCompensationBanner founderName={founderName} />
      )}
      <div className="flex items-start justify-between gap-2 md:gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h1 className="text-sm md:text-base font-bold text-gray-900 dark:text-white">
              {"Welcome back, "}
              {user.name.split(" ")[0]}
            </h1>
            {completedTasks > 0 && (
              <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 text-[9px] px-1.5 py-0">
                {completedTasks}
                {" done"}
              </Badge>
            )}
          </div>
          <p className="text-[10px] md:text-xs text-muted-foreground">
            {todayFormatted}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => onNavigate?.("startup-office")}
          className="bg-gradient-to-r from-[#3A5AFE] to-[#304FFE] hover:from-[#304FFE] hover:to-[#2040EE] text-white shadow-lg hover:shadow-xl transition-all font-semibold h-7 text-[10px] px-2.5"
        >
          <Building className="w-3 h-3 mr-1.5" />
          Virtual Office
          <ArrowRight className="w-3 h-3 ml-1.5" />
        </Button>
      </div>
      <div className="grid grid-cols-4 gap-1.5 md:gap-2">
        {taskMetrics.map((metric) => {
          const IconComponent = metric.icon;
          return (
            <Card
              key={metric.label}
              className="hover:shadow-md transition-all hover:border-[#3A5AFE]/20"
            >
              <CardContent className="p-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 md:w-8 md:h-8 ${metric.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}
                  >
                    <IconComponent
                      className={`w-3.5 h-3.5 md:w-4 md:h-4 ${metric.color}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                      {metric.value}
                    </p>
                    <p className="text-[9px] md:text-[10px] text-muted-foreground truncate">
                      {metric.label}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="grid lg:grid-cols-5 gap-2 md:gap-3 flex-1">
        <div className="flex flex-col lg:col-span-3">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-2 pt-2.5 px-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-1.5 text-xs md:text-sm">
                  <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#3A5AFE]" />
                  Active Tasks
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="secondary"
                    className="text-[9px] md:text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                  >
                    {myTasks.filter((t) => t.status !== "completed").length}
                    {" need"}
                    {myTasks.filter((t) => t.status !== "completed").length !==
                    1
                      ? ""
                      : "s"}
                    {" attention"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-[9px] h-6 px-2"
                    onClick={() => onNavigate?.("startup-office")}
                  >
                    View All
                    <ArrowRight className="w-2.5 h-2.5 ml-1" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 flex-1 flex flex-col px-3 pb-2.5">
              {myTasks.filter((t) => t.status !== "completed").length > 0 ? (
                <div className="space-y-1.5 flex-1 overflow-y-auto min-h-[350px] max-h-[calc(100vh-400px)]">
                  {myTasks
                    .filter((t) => t.status !== "completed")
                    .map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start gap-2 p-2 bg-muted/40 hover:bg-muted/60 rounded-lg transition-all border border-transparent hover:border-[#3A5AFE]/30 cursor-pointer group"
                        onClick={() => onNavigate?.("startup-office")}
                      >
                        <div
                          className={`w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${task.status === "in-progress" ? "bg-blue-100 dark:bg-blue-900/30" : task.status === "blocked" ? "bg-red-100 dark:bg-red-900/30" : "bg-slate-100 dark:bg-slate-800"}`}
                        >
                          {task.status === "in-progress" ? (
                            <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-600" />
                          ) : task.status === "blocked" ? (
                            <AlertCircle className="w-3 h-3 md:w-3.5 md:h-3.5 text-red-600" />
                          ) : (
                            <CheckSquare className="w-3 h-3 md:w-3.5 md:h-3.5 text-slate-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] md:text-xs font-medium text-gray-900 dark:text-white mb-0.5 group-hover:text-[#3A5AFE] transition-colors">
                            {task.title}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge
                              variant="outline"
                              className="text-[8px] md:text-[9px] px-1 py-0 h-4"
                            >
                              {task.status === "in-progress"
                                ? "In Progress"
                                : task.status === "blocked"
                                  ? "Blocked"
                                  : "Pending"}
                            </Badge>
                            {task.dueDate && (
                              <p className="text-[8px] md:text-[9px] text-muted-foreground flex items-center gap-0.5">
                                <Calendar className="w-2.5 h-2.5" />
                                {new Date(task.dueDate).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                  },
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="py-8 md:py-10 text-center flex-1 flex flex-col items-center justify-center min-h-[350px]">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 className="w-6 h-6 md:w-7 md:h-7 text-green-600" />
                  </div>
                  <p className="text-xs md:text-sm font-semibold mb-0.5">
                    All caught up!
                  </p>
                  <p className="text-[9px] md:text-[10px] text-muted-foreground">
                    No active tasks at the moment
                  </p>
                </div>
              )}
              {totalTasks > 0 && (
                <div className="pt-2 border-t mt-auto">
                  <div className="flex items-center gap-2.5 md:gap-3">
                    <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-[#3A5AFE]/10 to-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-[#3A5AFE]" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] md:text-xs font-semibold">
                          Overall Progress
                        </p>
                        <p className="text-lg md:text-xl font-bold text-[#3A5AFE]">
                          {completionRate}%
                        </p>
                      </div>
                      <Progress value={completionRate} className="h-1.5" />
                      <div className="flex items-center justify-between text-[8px] md:text-[9px] text-muted-foreground">
                        <span>
                          {completedTasks}
                          {" of "}
                          {totalTasks}
                          {" tasks completed"}
                        </span>
                        {completionRate >= 80 && (
                          <span className="text-green-600 font-medium">
                            Excellent! 🎉
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col space-y-2 lg:col-span-2">
          <Card className="flex flex-col">
            <CardHeader className="pb-2 pt-2.5 px-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-1.5 text-xs md:text-sm">
                  <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#3A5AFE]" />
                  Your Team
                </CardTitle>
                <Badge
                  variant="secondary"
                  className="text-[9px] md:text-[10px] px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                >
                  {teamMembers.length}
                  {" member"}
                  {teamMembers.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5 overflow-y-auto max-h-[280px] px-3 pb-2.5">
              {teamMembers.length > 0 ? (
                <>
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-2 p-2 bg-muted/40 hover:bg-muted/60 rounded-lg transition-colors"
                    >
                      <div className="relative">
                        <Avatar className="w-8 h-8 md:w-9 md:h-9 border-2 border-background">
                          <AvatarFallback className="bg-gradient-to-br from-[#3A5AFE] to-purple-600 text-white font-semibold text-[10px] md:text-xs">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] md:text-xs font-medium text-gray-900 dark:text-white truncate">
                          {member.name}
                        </p>
                        <p className="text-[9px] md:text-[10px] text-muted-foreground truncate">
                          {member.profile?.title || member.role === "founder"
                            ? "Founder"
                            : "Team Member"}
                        </p>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="py-6 text-center">
                  <Users className="w-8 h-8 md:w-9 md:h-9 mx-auto mb-2 text-muted-foreground opacity-30" />
                  <p className="text-[9px] md:text-[10px] text-muted-foreground">
                    No team members yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="flex flex-col flex-1">
            <CardHeader className="pb-2 pt-2.5 px-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-1.5 text-xs md:text-sm">
                  <Activity className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#3A5AFE]" />
                  Last Activity
                </CardTitle>
                <Badge
                  variant="secondary"
                  className="text-[9px] md:text-[10px] px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                >
                  {recentActivities.length}
                  {" update"}
                  {recentActivities.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5 flex-1 overflow-y-auto max-h-[280px] px-3 pb-2.5">
              {recentActivities.length > 0 ? (
                <>
                  {recentActivities.map((activity) => {
                    const IconComponent = activity.icon;
                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-2 p-2 bg-muted/40 hover:bg-muted/60 rounded-lg transition-colors"
                      >
                        <div
                          className={`w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${activity.bgColor}`}
                        >
                          <IconComponent
                            className={`w-3 h-3 md:w-3.5 md:h-3.5 ${activity.color}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] md:text-xs text-gray-900 dark:text-white mb-0.5">
                            <span className="font-medium">
                              {activity.user.name.split(" ")[0]}
                            </span>{" "}
                            <span className="text-muted-foreground">
                              {activity.action}
                            </span>
                          </p>
                          <p className="text-[10px] md:text-[11px] text-muted-foreground truncate mb-0.5">
                            {activity.task}
                          </p>
                          <p className="text-[8px] md:text-[9px] text-muted-foreground">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="py-8 text-center flex-1 flex flex-col items-center justify-center">
                  <Activity className="w-8 h-8 md:w-9 md:h-9 mx-auto mb-2 text-muted-foreground opacity-30" />
                  <p className="text-[9px] md:text-[10px] text-muted-foreground">
                    No recent activity
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="flex flex-col flex-1">
            <CardHeader className="pb-2 pt-2.5 px-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-1.5 text-xs md:text-sm">
                  <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#3A5AFE]" />
                  Coming Up
                </CardTitle>
                <Badge
                  variant="secondary"
                  className="text-[9px] md:text-[10px] px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                >
                  {upcomingEvents.length}
                  {" event"}
                  {upcomingEvents.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5 flex-1 overflow-y-auto max-h-[280px] px-3 pb-2.5">
              {upcomingEvents.length > 0 ? (
                <>
                  {upcomingEvents.map((event) => {
                    const IconComponent = event.icon;
                    return (
                      <div
                        key={event.id}
                        className="flex items-start gap-2 p-2 bg-muted/40 hover:bg-muted/60 rounded-lg transition-colors"
                      >
                        <div
                          className={`w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${event.bgColor}`}
                        >
                          <IconComponent
                            className={`w-3 h-3 md:w-3.5 md:h-3.5 ${event.color}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <p className="text-[11px] md:text-xs font-medium text-gray-900 dark:text-white truncate">
                              {event.title}
                            </p>
                            {event.type === "task" && event.status && (
                              <Badge
                                variant="outline"
                                className="text-[7px] px-1 py-0 h-3"
                              >
                                {event.status === "in-progress"
                                  ? "In Progress"
                                  : "Pending"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-[9px] md:text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {getRelativeTime(event.date, event.time)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="py-8 text-center flex-1 flex flex-col items-center justify-center">
                  <Calendar className="w-8 h-8 md:w-9 md:h-9 mx-auto mb-2 text-muted-foreground opacity-30" />
                  <p className="text-[9px] md:text-[10px] text-muted-foreground">
                    No upcoming events
                  </p>
                  <p className="text-[8px] md:text-[9px] text-muted-foreground mt-0.5">
                    Next 7 days
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
