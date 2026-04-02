import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";

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

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

function getAuthHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
    "Content-Type": "application/json",
  };
}

async function checkBackendAvailability() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      headers: getAuthHeaders(),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

function isImportantNotificationType(type) {
  return [
    "task_assigned",
    "task_blocked",
    "deadline_overdue",
    "weekly_review_reminder",
  ].includes(type);
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

      const cached = localStorage.getItem(`notifications_${user.id}`);
      if (cached) {
        try {
          setNotifications(JSON.parse(cached));
        } catch (parseError) {
          console.error("Failed to parse cached notifications:", parseError);
        }
      }

      setLoading(false);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_BASE_URL}/users/${user.id}/notifications`, {
        method: "GET",
        headers: getAuthHeaders(),
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

      const data = await response.json();
      const mappedNotifications = (data.notifications || []).map((notif) => ({
        ...notif,
        timestamp:
          notif.timestamp || notif.createdAt || new Date().toISOString(),
      }));

      setNotifications(mappedNotifications);
      setError(null);
      setBackendAvailable(true);
      setLoading(false);

      localStorage.setItem(
        `notifications_${user.id}`,
        JSON.stringify(mappedNotifications),
      );
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

      const cached = localStorage.getItem(`notifications_${user.id}`);
      if (cached) {
        try {
          setNotifications(JSON.parse(cached));
        } catch (parseError) {
          console.error("Failed to parse cached notifications:", parseError);
        }
      }
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
          headers: getAuthHeaders(),
          signal: controller.signal,
        },
      );
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences || DEFAULT_PREFERENCES);
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

    const interval = setInterval(() => {
      if (backendAvailable) {
        fetchNotifications();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.id, backendAvailable, fetchNotifications, fetchPreferences]);

  const addNotification = async (notification) => {
    if (!user?.id || !backendAvailable) {
      const localNotification = {
        ...notification,
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        timestamp: new Date(),
        read: false,
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

      const response = await fetch(`${API_BASE_URL}/notifications`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userId: user.id,
          ...notification,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error("Failed to create notification:", await response.text());
        return;
      }

      const data = await response.json();
      const newNotification = {
        ...data.notification,
        timestamp: new Date(data.notification.timestamp),
      };
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
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId: user.id }),
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
          headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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
          headers: getAuthHeaders(),
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
      setPreferences(data.preferences);
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
