import React, { useState } from "react";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  Target,
  Flame,
  Users,
  MessageSquare,
  X,
  Check,
  Trash2,
  Settings,
  Calendar,
  // 🔥 NEW: Calendar icon for event reminders
  Megaphone, // 🔥 NEW: Megaphone icon for organization announcements
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Separator } from "../ui/separator";
import { useNotifications } from "../../contexts/NotificationContext";
export default function NotificationCenter({ onNavigate }) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();
  const [open, setOpen] = useState(false);
  const getNotificationIcon = (type) => {
    switch (type) {
      case "task_assigned":
        return <Target className="w-4 h-4 text-blue-600" />;
      case "task_completed":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "task_blocked":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "deadline_approaching":
      case "deadline_overdue":
        return <Clock className="w-4 h-4 text-orange-600" />;
      case "weekly_review_reminder":
        return <Target className="w-4 h-4 text-purple-600" />;
      case "milestone_completed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case "outcome_achieved":
      case "outcome_partial":
        return <Target className="w-4 h-4 text-primary" />;
      case "streak_milestone":
        return <Flame className="w-4 h-4 text-orange-600" />;
      case "team_member_joined":
        return <Users className="w-4 h-4 text-blue-600" />;
      case "comment_added":
        return <MessageSquare className="w-4 h-4 text-gray-600" />;
      case "announcement_reaction":
        return <Users className="w-4 h-4 text-pink-600" />;
      case "announcement_comment":
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case "event_reminder":
        // 🔥 NEW: Event reminder icon
        return <Calendar className="w-4 h-4 text-indigo-600" />;
      case "org_announcement": // 🔥 NEW: Organization announcement icon
      case "org_announcement_urgent":
        // 🔥 NEW: Urgent organization announcement icon
        return <Megaphone className="w-4 h-4 text-pink-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };
  const getNotificationBgColor = (type) => {
    switch (type) {
      case "task_assigned":
        return "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900";
      case "task_completed":
      case "milestone_completed":
      case "outcome_achieved":
        return "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900";
      case "task_blocked":
      case "deadline_overdue":
        return "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900";
      case "deadline_approaching":
        return "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900";
      case "weekly_review_reminder":
        return "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900";
      case "streak_milestone":
        return "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900";
      case "event_reminder":
        // 🔥 NEW: Event reminder background color
        return "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900";
      case "org_announcement":
        // 🔥 NEW: Organization announcement background color
        return "bg-pink-50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-900";
      case "org_announcement_urgent":
        // 🔥 NEW: Urgent organization announcement background color
        return "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900";
      default:
        return "bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-900";
    }
  };
  const formatTime = (date) => {
    if (!date) return "Recently";
    const now = new Date();
    const timestamp = typeof date === "string" ? new Date(date) : date;

    // Check if timestamp is valid
    if (!timestamp || isNaN(timestamp.getTime())) {
      return "Recently";
    }
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return timestamp.toLocaleDateString();
  };
  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);

    // Navigate to actionUrl if provided
    if (notification.actionUrl && onNavigate) {
      // Parse the actionUrl to determine the page and extract IDs
      const url = notification.actionUrl;

      // 🔥 NEW: Handle Virtual Office room URLs (event reminders with meeting links)
      // Check if URL is a Virtual Office room URL (contains /room/ or /office/room/)
      if (url.includes("/room/") || url.includes("/office/room/")) {
        console.log(
          "🔔 Event reminder clicked - joining Virtual Office room:",
          url,
        );

        // Extract room ID from URL
        const roomIdMatch = url.match(/\/room\/([^/?]+)/);
        const roomId = roomIdMatch ? roomIdMatch[1] : null;
        if (roomId) {
          // Navigate to startup-office (Virtual Office page)
          // The Virtual Office will automatically handle the room URL in the URL hash/params
          console.log("🔔 Navigating to Virtual Office with room:", roomId);

          // Open the URL directly (Virtual Office rooms are accessed via direct URL)
          window.location.href = url;
          setOpen(false);
          return;
        }
      }

      // Map URLs to page names and extract relevant IDs
      if (url.includes("/tasks")) {
        // Extract task ID from URL (e.g., /tasks/task-123 -> task-123)
        const taskId = url.split("/").pop();
        console.log("🔔 Notification clicked - navigating to task:", taskId);
        onNavigate("startup-office", {
          taskId,
        });
      } else if (url.includes("/milestones")) {
        // Extract milestone ID and navigate to startup office
        const milestoneId = url.split("/").pop();
        console.log(
          "🔔 Notification clicked - navigating to milestone:",
          milestoneId,
        );
        // TODO: Pass milestoneId to open specific milestone in execution view
        onNavigate("startup-office");
      } else if (url.includes("/outcomes")) {
        // Extract week/outcome ID and navigate to startup office
        const outcomeId = url.split("/").pop();
        console.log(
          "🔔 Notification clicked - navigating to outcome:",
          outcomeId,
        );
        // TODO: Pass outcomeId to open specific outcome in weekly review
        onNavigate("startup-office");
      } else if (url.includes("/weekly-review")) {
        console.log("🔔 Notification clicked - navigating to weekly review");
        // Navigate to startup office (where weekly review is accessible)
        onNavigate("startup-office");
      } else if (url.includes("/team")) {
        console.log("🔔 Notification clicked - navigating to team");
        // For team member joined notifications - navigate to team page/hub
        onNavigate("startup-office"); // Team Hub is in Virtual Office
      } else if (url.includes("/announcements")) {
        // Extract announcement ID and navigate to startup office
        const announcementId = url.split("/").pop();
        console.log(
          "🔔 Notification clicked - navigating to announcement:",
          announcementId,
        );
        // TODO: Pass announcementId to scroll to specific announcement
        onNavigate("startup-office", {
          announcementId,
        }); // Announcements are in Team Hub
      } else if (url.includes("/dashboard")) {
        console.log("🔔 Notification clicked - navigating to dashboard");
        onNavigate("dashboard");
      } else {
        // Default fallback - navigate to dashboard
        console.log(
          "🔔 Notification clicked - default navigation to dashboard",
        );
        onNavigate("dashboard");
      }

      // Close the popover after navigation
      setOpen(false);
    }
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild={true}>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-8 w-8 p-0 rounded-full bg-muted/80 hover:bg-accent/20 transition-colors cursor-pointer"
        >
          <Bell className="w-3.5 h-3.5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 min-w-4 flex items-center justify-center p-0 bg-red-600 text-white text-[10px]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold">Notifications</h3>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
            </p>
          </div>
          {notifications.length > 0 && (
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-8 text-xs"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={clearAll}
                className="h-8 w-8"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Bell className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm font-medium mb-1">No notifications yet</p>
              <p className="text-xs text-muted-foreground text-center">
                You'll see updates about tasks, deadlines, and team activity
                here
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-muted/50 cursor-pointer transition-colors relative ${!notification.read ? "bg-primary/5" : ""}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {!notification.read && (
                    <div className="absolute top-3 left-1 w-2 h-2 rounded-full bg-primary" />
                  )}
                  <div className="flex items-start gap-3 ml-2">
                    <div
                      className={`mt-0.5 p-2 rounded-lg border ${getNotificationBgColor(notification.type)}`}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-tight">
                          {notification.title}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTime(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button variant="ghost" className="w-full text-xs" size="sm">
                <Settings className="w-3 h-3 mr-1" />
                Notification Settings
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
