import React, { useState, useEffect } from "react";
import { Badge } from "../ui/badge";
import { Bell } from "lucide-react";
export default function TaskNotificationBadge({ userId }) {
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    const checkNotifications = () => {
      const notificationsKey = `startupverse_notifications_${userId}`;
      const storedNotifications = localStorage.getItem(notificationsKey);
      const notifications = storedNotifications
        ? JSON.parse(storedNotifications)
        : [];

      // Count unread notifications (last 24 hours)
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const unread = notifications.filter(
        (n) => new Date(n.timestamp).getTime() > oneDayAgo && !n.read,
      ).length;
      setUnreadCount(unread);
    };
    checkNotifications();

    // Check every 30 seconds
    const interval = setInterval(checkNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId]);
  if (unreadCount === 0) return null;
  return (
    <Badge className="bg-red-500 text-white animate-pulse">
      <Bell className="w-3 h-3 mr-1" />
      {unreadCount}
    </Badge>
  );
}
