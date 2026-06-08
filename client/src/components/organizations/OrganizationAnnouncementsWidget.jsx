/**
 * Organization announcements for founders (dashboard feed).
 */
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/apiBase.js";
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
import { unwrapData } from "../../utils/apiEnvelope";
import {
  OrganizationWidgetShell,
  OrganizationWidgetItem,
} from "./OrganizationWidgetShell.jsx";

const API_BASE = API_BASE_URL;

const defaultOptions = {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
};

const PRIORITY_STYLES = {
  urgent: "border-status-error/30 bg-status-error/5",
  high: "border-amber-300/50 bg-amber-50/80",
  normal: "border-primary/20 bg-primary-tint/40",
  low: "border-surface-border bg-surface-page",
};

export default function OrganizationAnnouncementsWidget({ founderId }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFounderAnnouncements();
  }, [founderId]);

  const loadFounderAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/founder/${founderId}/announcements`,
        defaultOptions,
      );
      if (!response.ok) {
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
      const response = await fetch(
        `${API_BASE}/announcements/${announcementId}/mark-read`,
        {
          ...defaultOptions,
          method: "POST",
          body: JSON.stringify({ userId: founderId }),
        },
      );
      if (!response.ok) throw new Error("Failed to mark as read");
      const inner = unwrapData(await response.json());
      const updated = inner.announcement;
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
        return <AlertTriangle className="h-3.5 w-3.5 text-status-error" />;
      case "high":
        return <AlertCircle className="h-3.5 w-3.5 text-amber-600" />;
      case "normal":
        return <Info className="h-3.5 w-3.5 text-primary" />;
      default:
        return <Bell className="h-3.5 w-3.5 text-text-muted" />;
    }
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
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const unreadCount = announcements.filter(isUnread).length;

  return (
    <OrganizationWidgetShell
      icon={Bell}
      title="Announcements"
      description={
        announcements.length > 0
          ? "Updates from your programs and cohorts"
          : undefined
      }
      loading={loading}
      empty={
        !loading && announcements.length === 0
          ? {
              icon: Bell,
              title: "No announcements yet",
              description:
                "When your organization shares program updates, they will appear here.",
            }
          : null
      }
      badge={
        unreadCount > 0 ? (
          <Badge className="shrink-0 rounded-full border-0 bg-status-error px-2 py-0.5 font-body text-[10px] font-semibold text-white">
            {unreadCount} new
          </Badge>
        ) : null
      }
      footer={
        announcements.length > 5 ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-full rounded-input font-body text-[11px] font-medium text-primary hover:bg-primary-tint hover:text-primary"
          >
            View all {announcements.length} announcements
            <ExternalLink className="ml-1 h-3 w-3" />
          </Button>
        ) : null
      }
    >
      <div className="space-y-2.5">
        {announcements.slice(0, 5).map((announcement) => {
          const unread = isUnread(announcement);
          const priority = announcement.priority || "normal";
          return (
            <OrganizationWidgetItem
              key={announcement.id}
              onClick={unread ? () => markAsRead(announcement.id) : undefined}
              className={
                unread
                  ? PRIORITY_STYLES[priority] || PRIORITY_STYLES.normal
                  : ""
              }
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-start gap-2">
                  {getPriorityIcon(priority)}
                  <div className="min-w-0 flex-1">
                    <h4
                      className={`truncate font-heading text-xs text-text-heading ${unread ? "font-extrabold" : "font-semibold"}`}
                    >
                      {announcement.title}
                    </h4>
                    <p className="mt-0.5 font-body text-[10px] text-text-muted">
                      {announcement.organizationName || "Organization"}
                    </p>
                  </div>
                </div>
                {unread ? (
                  <span
                    className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"
                    aria-label="Unread"
                  />
                ) : null}
              </div>
              <p className="mt-2 line-clamp-2 pl-5 font-body text-[11px] leading-relaxed text-text-body">
                {announcement.content}
              </p>
              <div className="mt-2 flex items-center justify-between border-t border-surface-border/50 pt-2">
                <span className="font-body text-[10px] text-text-muted">
                  {formatTime(announcement.createdAt)}
                </span>
                {unread ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 rounded-input px-2 font-body text-[10px] text-primary hover:bg-primary-tint"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(announcement.id);
                    }}
                  >
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Mark read
                  </Button>
                ) : null}
              </div>
            </OrganizationWidgetItem>
          );
        })}
      </div>
    </OrganizationWidgetShell>
  );
}
