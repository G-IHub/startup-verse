import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { API_BASE_URL } from "../config/apiBase.js";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import { normalizeNotificationType } from "../utils/notificationType.js";
import { subscribeToUnreadCount } from "../utils/socketIoRealtime.js";

const NotificationContext = createContext(undefined);

const DEFAULT_PREFERENCES = {
  taskAssigned: true,
  taskCompleted: true,
  taskBlocked: true,
  deadlineReminders: true,
  weeklyReviewReminder: true,
  milestoneAchievements: true,
  streakMilestones: true,
  teamUpdates: true,
};

// Default fetch options for cookie-based auth
const defaultOptions = {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
};

async function checkBackendAvailability() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${API_BASE_URL}/health`, {
      ...defaultOptions,
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

function isImportantNotificationType(type) {
  const normalized = normalizeNotificationType(type);
  return [
    "task-assigned",
    "task-blocked",
    "deadline-overdue",
    "weekly-review-reminder",
  ].includes(normalized);
}

function toIsoTimestamp(value) {
  const source = value || new Date().toISOString();
  const parsed = new Date(source);
  if (!Number.isFinite(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}

function mapNotificationRow(row) {
  const value = row || {};
  const idValue = value.id ?? value._id ?? "";
  const read =
    typeof value.read === "boolean" ? value.read : Boolean(value.readAt);
  const metadata =
    value.metadata && typeof value.metadata === "object" ? value.metadata : {};

  return {
    ...value,
    id: idValue ? String(idValue) : "",
    type: normalizeNotificationType(value.type),
    read,
    timestamp: toIsoTimestamp(value.timestamp || value.createdAt),
    actionUrl: value.actionUrl || metadata.actionUrl || "",
    metadata,
  };
}

function mapNotificationList(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapNotificationRow).filter((n) => n.id || n.message);
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backendAvailable, setBackendAvailable] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    const backendOnline = await checkBackendAvailability();
    if (!backendOnline) {
      setBackendAvailable(false);
      setError(null);
      setNotifications([]);

      setLoading(false);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_BASE_URL}/users/${user.id}/notifications`, {
        method: "GET",
        ...defaultOptions,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status >= 500 || response.status === 404) {
          setBackendAvailable(false);
          setError(null);
          setLoading(false);
          return;
        }

        setError(`Backend error: ${response.status}`);
        setLoading(false);
        return;
      }

      const payload = await response.json();
      const mappedNotifications = mapNotificationList(payload?.data);

      setNotifications(mappedNotifications);
      setError(null);
      setBackendAvailable(true);
      setLoading(false);
    } catch (fetchError) {
      if (
        fetchError.name !== "AbortError" &&
        fetchError.name !== "TimeoutError" &&
        fetchError.message !== "Failed to fetch"
      ) {
        console.error("Notifications fetch failed:", fetchError);
      }

      setBackendAvailable(false);
      setError(null);
      setLoading(false);
      setNotifications([]);
    }
  }, [user?.id]);

  const fetchPreferences = useCallback(async () => {
    if (!user?.id) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(
        `${API_BASE_URL}/users/${user.id}/notification-preferences`,
        {
          method: "GET",
          ...defaultOptions,
          signal: controller.signal,
        },
      );
      clearTimeout(timeoutId);

      if (response.ok) {
        const payload = await response.json();
        setPreferences(payload?.data || DEFAULT_PREFERENCES);
      }
    } catch {
      // Silent fallback to defaults.
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setPreferences(DEFAULT_PREFERENCES);
      setLoading(false);
      return;
    }

    fetchNotifications();
    fetchPreferences();

    // Fallback polling when sockets are down; realtime bumps come via
    // `notification:created` on the user room (see subscription below).
    const interval = setInterval(() => {
      if (backendAvailable) {
        fetchNotifications();
      }
    }, 120000);

    const unsubRealtime = subscribeToUnreadCount(null, user.id, () => {
      fetchNotifications();
    });

    return () => {
      clearInterval(interval);
      unsubRealtime?.();
    };
  }, [user?.id, user?.role, backendAvailable, fetchNotifications, fetchPreferences]);

  const addNotification = async (notification) => {
    if (!user?.id || !backendAvailable) {
      const localNotification = {
        ...notification,
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        type: normalizeNotificationType(notification.type),
        timestamp: new Date().toISOString(),
        read: false,
        actionUrl: notification.actionUrl || "",
      };
      setNotifications((prev) => [localNotification, ...prev]);

      if (isImportantNotificationType(notification.type)) {
        toast.info(notification.title, { description: notification.message });
      }
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const normalizedType = normalizeNotificationType(notification.type);
      const metadata = {
        ...(notification?.metadata || {}),
      };
      if (notification?.actionUrl) {
        metadata.actionUrl = notification.actionUrl;
      }

      const response = await fetch(`${API_BASE_URL}/notifications`, {
        method: "POST",
        ...defaultOptions,
        body: JSON.stringify({
          userId: user.id,
          title: notification?.title || "Notification",
          message: notification?.message || "",
          type: normalizedType,
          actionUrl: notification?.actionUrl || metadata.actionUrl || "",
          metadata,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error("Failed to create notification:", await response.text());
        return;
      }

      const payload = await response.json();
      const newNotification = mapNotificationRow(payload?.data);
      setNotifications((prev) => [newNotification, ...prev]);

      if (isImportantNotificationType(notification.type)) {
        toast.info(notification.title, { description: notification.message });
      }
    } catch (createError) {
      console.warn("Error creating notification:", createError.message);
    }
  };

  const markAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );

    if (!backendAvailable || !user?.id) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: "PUT",
        ...defaultOptions,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: false } : n)),
        );
        console.warn("Failed to mark notification as read.");
      }
    } catch (readError) {
      console.warn("Error marking notification as read:", readError.message);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;

    const previousNotifications = [...notifications];
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    if (!backendAvailable) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `${API_BASE_URL}/users/${user.id}/notifications/mark-all-read`,
        {
          method: "POST",
          ...defaultOptions,
          signal: controller.signal,
        },
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        setNotifications(previousNotifications);
        console.warn("Failed to mark all notifications as read.");
      }
    } catch (readAllError) {
      setNotifications(previousNotifications);
      console.warn("Error marking all notifications as read:", readAllError.message);
    }
  };

  const deleteNotification = async (id) => {
    const previousNotifications = [...notifications];
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    if (!backendAvailable) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
        method: "DELETE",
        ...defaultOptions,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        setNotifications(previousNotifications);
        console.warn("Failed to delete notification.");
      }
    } catch (deleteError) {
      setNotifications(previousNotifications);
      console.warn("Error deleting notification:", deleteError.message);
    }
  };

  const clearAll = async () => {
    if (!user?.id) return;

    const previousNotifications = [...notifications];
    setNotifications([]);

    if (!backendAvailable) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_BASE_URL}/users/${user.id}/notifications`, {
        method: "DELETE",
        ...defaultOptions,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        setNotifications(previousNotifications);
        console.warn("Failed to clear notifications.");
      }
    } catch (clearError) {
      setNotifications(previousNotifications);
      console.warn("Error clearing notifications:", clearError.message);
    }
  };

  const updatePreferences = async (prefs) => {
    if (!user?.id) return;

    const previousPreferences = { ...preferences };
    setPreferences((prev) => ({ ...prev, ...prefs }));

    if (!backendAvailable) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `${API_BASE_URL}/users/${user.id}/notification-preferences`,
        {
          method: "PUT",
          ...defaultOptions,
          body: JSON.stringify(prefs),
          signal: controller.signal,
        },
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        setPreferences(previousPreferences);
        console.warn("Failed to update notification preferences.");
        return;
      }

      const data = await response.json();
      setPreferences(data?.data || DEFAULT_PREFERENCES);
    } catch (prefsError) {
      setPreferences(previousPreferences);
      console.warn("Error updating notification preferences:", prefsError.message);
    }
  };

  const refreshNotifications = async () => {
    await fetchNotifications();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        preferences,
        loading,
        error,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        updatePreferences,
        refreshNotifications,
        setUserId: () => {},
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  }
  return context;
}
