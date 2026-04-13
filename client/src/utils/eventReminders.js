/**
 * Event reminder system
 * Sends notifications to founders 1 hour before events start.
 */

import { getAccessToken } from "../app/session";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

function getAuthHeaders() {
  return {
    Authorization: `Bearer ${getAccessToken()}`,
    "Content-Type": "application/json",
  };
}

/**
 * Check if an event needs a reminder and send it.
 */
export async function checkAndSendEventReminders(founderId) {
  try {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return;
    }

    const response = await fetch(`${API_BASE_URL}/founder/${founderId}/events`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) return;

    const data = await response.json();
    const events = data.events || [];

    const now = new Date();
    const reminderWindowStart = new Date(now.getTime() + 50 * 60 * 1000);
    const reminderWindowEnd = new Date(now.getTime() + 70 * 60 * 1000);

    for (const event of events) {
      const eventStartTime = new Date(event.startTime);

      if (
        eventStartTime >= reminderWindowStart &&
        eventStartTime <= reminderWindowEnd
      ) {
        const reminderKey = `event-reminder-sent-${event.id}-${founderId}`;
        const reminderSent = localStorage.getItem(reminderKey);

        if (!reminderSent) {
          await sendEventReminder(founderId, event);
          localStorage.setItem(reminderKey, new Date().toISOString());
        }
      }

      if (eventStartTime < now) {
        const reminderKey = `event-reminder-sent-${event.id}-${founderId}`;
        localStorage.removeItem(reminderKey);
      }
    }
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      return;
    }
    console.error("Error checking event reminders:", error);
  }
}

async function sendEventReminder(founderId, event) {
  try {
    const eventTime = new Date(event.startTime);
    const timeStr = eventTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const notification = {
      userId: founderId,
      type: "event_reminder",
      title: `Event starting soon: ${event.title}`,
      message: `Your ${event.eventType.replace("-", " ")} starts at ${timeStr}${event.isVirtual ? " - Click to join!" : ""}`,
      actionUrl: event.isVirtual && event.meetingUrl ? event.meetingUrl : null,
      metadata: {
        eventId: event.id,
        eventType: event.eventType,
        startTime: event.startTime,
        isVirtual: event.isVirtual,
        organizationName: event.organizationName,
      },
    };

    const response = await fetch(`${API_BASE_URL}/notifications`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(notification),
    });

    if (!response.ok) {
      throw new Error("Failed to send event reminder notification");
    }
  } catch (error) {
    console.error("Error sending event reminder:", error);
  }
}

/**
 * Get upcoming events in the next 24 hours (for display/preview).
 */
export async function getUpcomingEvents(founderId) {
  try {
    const response = await fetch(`${API_BASE_URL}/founder/${founderId}/events`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) return [];

    const data = await response.json();
    const events = data.events || [];

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return events
      .filter((event) => {
        const eventTime = new Date(event.startTime);
        return eventTime >= now && eventTime <= tomorrow;
      })
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    return [];
  }
}

export function getTimeUntilEvent(startTime) {
  const now = new Date();
  const eventTime = new Date(startTime);
  const diffMs = eventTime.getTime() - now.getTime();

  if (diffMs < 0) return "Started";

  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `in ${diffDays} day${diffDays > 1 ? "s" : ""}`;
  if (diffHours > 0) return `in ${diffHours} hour${diffHours > 1 ? "s" : ""}`;
  if (diffMins > 0) return `in ${diffMins} min${diffMins > 1 ? "s" : ""}`;
  return "Starting now!";
}

export function isEventSoon(startTime) {
  const now = new Date();
  const eventTime = new Date(startTime);
  const diffMs = eventTime.getTime() - now.getTime();
  const twoHours = 2 * 60 * 60 * 1000;

  return diffMs > 0 && diffMs <= twoHours;
}
