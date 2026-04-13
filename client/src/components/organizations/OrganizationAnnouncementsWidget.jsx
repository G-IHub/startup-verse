/**
 * ORGANIZATION ANNOUNCEMENTS WIDGET
 * Shows recent announcements from organizations for founders
 * Displays in founder dashboard right sidebar
 */
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/apiBase.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Bell,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { getAccessToken } from "../../app/session";
import { unwrapData } from "../../utils/apiEnvelope";

const API_BASE = API_BASE_URL;

export default function OrganizationAnnouncementsWidget({ founderId }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadFounderAnnouncements();
  }, [founderId]);
  const loadFounderAnnouncements = async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      const response = await fetch(
        `${API_BASE}/founder/${founderId}/announcements`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );
      if (!response.ok) {
        console.error("Failed to fetch founder announcements");
        setAnnouncements([]);
        return;
      }
      const raw = unwrapData(await response.json());
      const list = Array.isArray(raw) ? raw : raw.announcements || [];
      setAnnouncements(list);
    } catch (error) {
      console.error("Error loading announcements:", error);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };
  const markAsRead = async (announcementId) => {
    try {
      const token = getAccessToken();
      const response = await fetch(
        `${API_BASE}/announcements/${announcementId}/mark-read`,
        {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: founderId,
          }),
        },
      );
      if (!response.ok) throw new Error("Failed to mark as read");
      const inner = unwrapData(await response.json());
      const updated = inner.announcement;

      // Update local state
      setAnnouncements((prev) =>
        prev.map((ann) =>
          String(ann.id) === String(announcementId) && updated
            ? { ...ann, ...updated, id: updated.id || updated._id || ann.id }
            : ann,
        ),
      );
    } catch (error) {
      console.error("Error marking announcement as read:", error);
    }
  };
  const isUnread = (announcement) => {
    const readers = announcement.readBy || [];
    return !readers.map(String).includes(String(founderId));
  };
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "urgent":
        return <AlertTriangle className="w-3.5 h-3.5 text-red-600" />;
      case "high":
        return <AlertCircle className="w-3.5 h-3.5 text-orange-600" />;
      case "normal":
        return <Info className="w-3.5 h-3.5 text-blue-600" />;
      case "low":
        return <Bell className="w-3.5 h-3.5 text-gray-600" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-gray-600" />;
    }
  };
  const getPriorityColor = (priority) => {
    const colors = {
      urgent: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20",
      high: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20",
      normal:
        "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
      low: "bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/20",
    };
    return colors[priority] || colors["normal"];
  };
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };
  const unreadCount = announcements.filter(isUnread).length;
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  if (announcements.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground text-center py-4">
            No announcements yet
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Announcements
          </CardTitle>
          {unreadCount > 0 && (
            <Badge variant="default" className="text-[8px] px-1.5 py-0.5">
              {unreadCount}
              {" new"}
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">
          Latest updates from your programs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {announcements.slice(0, 5).map((announcement) => {
            const unread = isUnread(announcement);
            return (
              <div
                key={announcement.id}
                className={`border rounded-lg p-3 space-y-2 transition-all ${unread ? `${getPriorityColor(announcement.priority)} border-2` : "border-border hover:bg-muted/50"}`}
                onClick={() => unread && markAsRead(announcement.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    {getPriorityIcon(announcement.priority)}
                    <div className="flex-1 min-w-0">
                      <h4
                        className={`text-xs truncate ${unread ? "font-semibold" : "font-medium"}`}
                      >
                        {announcement.title}
                      </h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {announcement.organizationName || "Organization"}
                      </p>
                    </div>
                  </div>
                  {unread && (
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground line-clamp-2 pl-5">
                  {announcement.content}
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-border/50">
                  <span className="text-[9px] text-muted-foreground">
                    {formatTime(announcement.createdAt)}
                  </span>
                  {unread && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 text-[9px] px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(announcement.id);
                      }}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Mark read
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {announcements.length > 5 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3 h-7 text-[10px]"
          >
            {"View all "}
            {announcements.length}
            {" announcements"}
            <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
