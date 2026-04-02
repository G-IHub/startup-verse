/**
 * AgendaNotificationTrigger - Quick Component to Test Agenda Notifications
 *
 * Phase 3: Smart Alerts & Notifications
 * - Sends deadline reminders
 * - Sends overdue task notifications
 * - Can trigger weekly summaries
 */

import React, { useState } from "react";
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
export default function AgendaNotificationTrigger({ startupId }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const sendDailyNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/agenda/notifications/daily`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Daily notifications sent!", {
          description: `Processed ${data.results?.length || 0} startups`,
        });
        console.log("Notification results:", data.results);
      } else {
        toast.error("Failed to send notifications");
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
        `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/agenda/${startupId}/weekly-summary`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
          },
        },
      );
      const data = await response.json();
      if (data.success) {
        setSummary(data.summary);
        toast.success("Weekly summary generated!", {
          description: `${data.summary.totalItems} items this week`,
        });
        console.log("Weekly summary:", data.summary);
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
