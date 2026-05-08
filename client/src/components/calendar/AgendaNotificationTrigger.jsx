/**
 * AgendaNotificationTrigger - Quick Component to Test Agenda Notifications
 *
 * Phase 3: Smart Alerts & Notifications
 * - Sends deadline reminders
 * - Sends overdue task notifications
 * - Can trigger weekly summaries
 */

import React, { useState } from "react";
import { API_BASE_URL } from "../../config/apiBase.js";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Bell, Calendar, Send } from "lucide-react";
import { toast } from "sonner";

// Default fetch options for cookie-based auth

const defaultOptions = {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
};

export default function AgendaNotificationTrigger({ startupId }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const sendDailyNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/agenda/notifications/daily`,
        {
          ...defaultOptions,
          method: "POST",
        },
      );
      const data = await response.json();
      if (data.success) {
        const d = data.data || {};
        const total =
          (d.deliverableDueSoon || 0) +
          (d.eventReminders || 0) +
          (d.invitationExpiry || 0);
        toast.success("Daily digest jobs ran", {
          description: `Deliverables: ${d.deliverableDueSoon ?? 0}, events: ${d.eventReminders ?? 0}, invites: ${d.invitationExpiry ?? 0} (${total} notifications)`,
        });
        console.log("Daily digest:", d);
      } else {
        toast.error("Failed to run daily digest (admin only)");
      }
    } catch (error) {
      console.error("Error sending notifications:", error);
      toast.error("Failed to send notifications");
    } finally {
      setLoading(false);
    }
  };
  const getWeeklySummary = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/agenda/${startupId}/weekly-summary`,
        {
          ...defaultOptions,
        },
      );
      const data = await response.json();
      if (data.success) {
        const s = data.data || {};
        const totalItems = (s.eventCount || 0) + (s.deliverableCount || 0);
        setSummary({
          totalItems,
          meetingsCount: s.eventCount ?? 0,
          tasksCount: 0,
          milestonesCount: s.deliverableCount ?? 0,
          overdueCount: 0,
        });
        toast.success("Weekly summary generated!", {
          description: `${totalItems} cohort items (events + deliverables)`,
        });
        console.log("Weekly summary:", s);
      } else {
        toast.error("Failed to get summary");
      }
    } catch (error) {
      console.error("Error getting summary:", error);
      toast.error("Failed to get summary");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Agenda Notifications
        </CardTitle>
        <CardDescription className="text-xs">
          Test Phase 3: Smart Alerts & Notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          onClick={sendDailyNotifications}
          disabled={loading}
          className="w-full text-xs h-8"
          variant="outline"
        >
          <Send className="w-3 h-3 mr-2" />
          {loading ? "Sending..." : "Send Daily Notifications"}
        </Button>
        <Button
          onClick={getWeeklySummary}
          disabled={loading}
          className="w-full text-xs h-8"
          variant="outline"
        >
          <Calendar className="w-3 h-3 mr-2" />
          {loading ? "Loading..." : "Get Weekly Summary"}
        </Button>
        {summary && (
          <div className="mt-3 p-2 rounded-md bg-muted text-xs space-y-1">
            <div className="font-medium">Weekly Summary</div>
            <div className="text-muted-foreground">
              {"• Total: "}
              {summary.totalItems}
              {" items"}
            </div>
            <div className="text-muted-foreground">
              {"• Meetings: "}
              {summary.meetingsCount}
            </div>
            <div className="text-muted-foreground">
              {"• Tasks: "}
              {summary.tasksCount}
            </div>
            <div className="text-muted-foreground">
              {"• Milestones: "}
              {summary.milestonesCount}
            </div>
            {summary.overdueCount > 0 && (
              <div className="text-red-500 font-medium">
                {"• ⚠️ Overdue: "}
                {summary.overdueCount}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
