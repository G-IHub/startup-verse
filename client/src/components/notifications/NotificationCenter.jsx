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
import { ScrollArea } from "../ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Separator } from "../ui/separator";
import { useNotifications } from "../../contexts/NotificationContext";
import { useAuth } from "../../contexts/AuthContext";
import { parseDeepLink } from "../../app/deepLinks";

export default function NotificationCenter({ onNavigate }) {
  const { user } = useAuth();
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
      case "task-assigned":
        return <Target className="w-4 h-4 text-blue-600" />;
      case "task-completed":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "task-blocked":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "deadline-approaching":
      case "deadline-overdue":
        return <Clock className="w-4 h-4 text-orange-600" />;
      case "weekly-review-reminder":
        return <Target className="w-4 h-4 text-purple-600" />;
      case "milestone-completed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case "outcome-achieved":
      case "outcome-partial":
        return <Target className="w-4 h-4 text-primary" />;
      case "streak-milestone":
        return <Flame className="w-4 h-4 text-orange-600" />;
      case "team-member-joined":
        return <Users className="w-4 h-4 text-blue-600" />;
      case "comment-added":
        return <MessageSquare className="w-4 h-4 text-gray-600" />;
      case "announcement-reaction":
        return <Users className="w-4 h-4 text-pink-600" />;
      case "announcement-comment":
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case "event-reminder":
        // 🔥 NEW: Event reminder icon
        return <Calendar className="w-4 h-4 text-indigo-600" />;
      case "org-announcement": // 🔥 NEW: Organization announcement icon
      case "org-announcement-urgent":
        // 🔥 NEW: Urgent organization announcement icon
        return <Megaphone className="w-4 h-4 text-pink-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
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

    if (!notification.actionUrl || !onNavigate) return;

    const url = notification.actionUrl;

    if (url.includes("/room/") || url.includes("/office/room/")) {
      window.location.href = url;
      setOpen(false);
      return;
    }

    if (url.startsWith("/?") && new URLSearchParams(url.slice(2)).get("invitation")) {
      window.location.assign(url);
      setOpen(false);
      return;
    }

    const intent = parseDeepLink(
      url,
      notification.metadata || {},
      user?.role || "founder",
    );

    if (intent) {
      onNavigate(intent.page, intent.options || {});
    } else {
      onNavigate("dashboard");
    }

    setOpen(false);
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild={true}>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 w-9 cursor-pointer rounded-input border border-surface-border/60 bg-surface-card p-0 shadow-none transition-all duration-200 hover:border-surface-border hover:bg-surface-page"
        >
          <Bell className="h-[17px] w-[17px] text-text-body" strokeWidth={1.75} />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-pill bg-status-error px-1 font-body text-[10px] font-semibold leading-none text-white shadow-[0_1px_4px_rgba(255,79,107,0.45)]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(100vw-2rem,24rem)] overflow-hidden rounded-card border border-surface-border bg-surface-card p-0 shadow-(--shadow-soft)"
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between border-b border-surface-border/80 bg-surface-page/40 px-3 py-2.5">
          <div>
            <h3 className="font-heading text-sm font-bold text-text-heading">
              Notifications
            </h3>
            <p className="font-body text-xs text-text-muted">
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
                  className="h-7 px-2.5 text-[11px]"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={clearAll}
                className="h-7 w-7"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
        <ScrollArea className="h-[360px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <p className="mb-1 font-body text-[13px] font-semibold text-text-heading">No notifications yet</p>
              <p className="text-center font-body text-[12px] text-text-muted">
                You'll see updates about tasks, deadlines, and team activity
                here
              </p>
            </div>
          ) : (
            <div className="px-1.5 py-1.5">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group relative mb-1.5 cursor-pointer rounded-input border border-surface-border/70 px-2.5 py-2 transition-colors hover:bg-surface-page ${!notification.read ? "border-primary/30 bg-primary/5" : "bg-surface-card"}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div
                    className={`absolute left-0.5 top-2.5 h-[calc(100%-1.25rem)] w-[2px] rounded-full ${!notification.read ? "bg-primary/70" : "bg-transparent"}`}
                  />
                  <div className="ml-1 flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-page">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`font-body text-[13px] leading-tight ${!notification.read ? "font-semibold text-text-heading" : "font-medium text-text-body"}`}>
                          {notification.title}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 rounded-md opacity-60 transition-opacity hover:opacity-100 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="mt-0.5 line-clamp-2 font-body text-[12px] text-text-muted">
                        {notification.message}
                      </p>
                      <p className="mt-1 font-body text-[11px] text-text-muted">
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

