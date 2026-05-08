import React, { useState } from "react";
import { API_BASE_URL } from "../config/apiBase.js";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useAuth } from "../contexts/AuthContext";
import { Bell, Zap, Bug } from "lucide-react";
import { toast } from "sonner";

// Default fetch options for cookie-based auth

const defaultOptions = {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
};

export default function NotificationDebugPanel() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const extractData = (payload) => payload?.data;

  const testCreateNotification = async () => {
    if (!user?.id) {
      toast.error("No user logged in");
      return;
    }

    setLoading(true);
    setResult("Creating test notification...");

    try {
      console.log("[DEBUG] Creating test notification for user:", user.id);
      const response = await fetch(`${API_BASE_URL}/notifications/test`, {
        ...defaultOptions,
        method: "POST",
        ...defaultOptions,
        body: JSON.stringify({
          userId: user.id,
          type: "task-completed",
          title: "Test Notification",
          message: `This is a test notification created manually at ${new Date().toLocaleTimeString()}`,
          actionUrl: "/dashboard",
        }),
      });

      const payload = await response.json();
      const notification = extractData(payload) || {};

      if (response.ok) {
        console.log("[DEBUG] Test notification created:", payload);
        setResult(
          `Success! Notification ID: ${notification.id || notification._id || "n/a"}`,
        );
        toast.success("Test notification created!");
      } else {
        console.error("[DEBUG] Failed to create notification:", payload);
        setResult(`Error: ${JSON.stringify(payload)}`);
        toast.error("Failed to create notification");
      }
    } catch (error) {
      console.error("[DEBUG] Error:", error);
      setResult(`Error: ${error.message}`);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testFetchNotifications = async () => {
    if (!user?.id) {
      toast.error("No user logged in");
      return;
    }

    setLoading(true);
    setResult("Fetching notifications...");

    try {
      console.log("[DEBUG] Fetching notifications for user:", user.id);
      const response = await fetch(`${API_BASE_URL}/users/${user.id}/notifications`, {
        ...defaultOptions,
        method: "GET",
        ...defaultOptions,
      });

      const payload = await response.json();
      const notifications = Array.isArray(extractData(payload))
        ? extractData(payload)
        : [];

      if (response.ok) {
        console.log("[DEBUG] Fetched notifications:", payload);
        setResult(`Found ${notifications.length} notifications`);
        console.log("[DEBUG] Notifications:", notifications);
      } else {
        console.error("[DEBUG] Failed to fetch:", payload);
        setResult(`Error: ${JSON.stringify(payload)}`);
      }
    } catch (error) {
      console.error("[DEBUG] Error:", error);
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== "founder") {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 p-4 w-80 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700 z-50">
      <div className="flex items-center gap-2 mb-3">
        <Bug className="w-4 h-4 text-yellow-600" />
        <h3 className="font-semibold text-sm">Notification Debug Panel</h3>
      </div>

      <div className="space-y-2">
        <Button
          onClick={testCreateNotification}
          disabled={loading}
          size="sm"
          variant="outline"
          className="w-full"
        >
          <Bell className="w-3 h-3 mr-2" />
          {loading ? "Creating..." : "Create Test Notification"}
        </Button>

        <Button
          onClick={testFetchNotifications}
          disabled={loading}
          size="sm"
          variant="outline"
          className="w-full"
        >
          <Zap className="w-3 h-3 mr-2" />
          {loading ? "Fetching..." : "Fetch Notifications"}
        </Button>
      </div>

      {result && (
        <div className="mt-3 p-2 bg-white dark:bg-gray-800 rounded text-xs font-mono break-words">
          {result}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-3">
        User: {user.name} ({user.id})
      </p>
    </Card>
  );
}
