/**
 * Event notification system.
 */

import { API_BASE_URL } from "../config/apiBase.js";
import { get as backendGet } from "./backendClient.js";

// Default fetch options for cookie-based auth
const defaultOptions = {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
};

const upcomingEventReminderSent = new Set();

/**
 * Send notification when a new event is created.
 */
export async function notifyEventCreated(cohortId, organizationId, eventData) {
  try {
    const response = await fetch(`${API_BASE_URL}/cohorts/${cohortId}/members`, {
      ...defaultOptions,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch cohort members: ${response.statusText}`);
    }

    const { members } = await response.json();

    const notifications = members.map((member) => ({
      userId: member.founderId,
      type: "event-created",
      title: `New Event: ${eventData.title}`,
      message: `A new ${eventData.eventType} has been scheduled for ${new Date(eventData.startTime).toLocaleString()}`,
      actionUrl: `/dashboard?view=calendar&event=${eventData.id}`,
      metadata: {
        eventId: eventData.id,
        eventTitle: eventData.title,
        eventTime: eventData.startTime,
        eventType: eventData.eventType,
        location: eventData.location,
        isVirtual: eventData.isVirtual,
      },
      createdAt: new Date().toISOString(),
    }));

    const notificationResponse = await fetch(`${API_BASE_URL}/notifications/batch`, {
      method: "POST",
      ...defaultOptions,
      body: JSON.stringify({ notifications }),
    });

    if (!notificationResponse.ok) {
      throw new Error(
        `Failed to create notifications: ${notificationResponse.statusText}`,
      );
    }

    return { success: true, count: notifications.length };
  } catch (error) {
    console.error("Failed to send event creation notifications:", error);
    return { success: false, error };
  }
}

/**
 * Send notification when an event is updated.
 */
export async function notifyEventUpdated(cohortId, eventData) {
  try {
    const notifications = eventData.attendees.map((attendee) => ({
      userId: attendee.founderId,
      type: "event-updated",
      title: `Event Updated: ${eventData.title}`,
      message: `The event "${eventData.title}" has been updated. Check the new details.`,
      actionUrl: `/dashboard?view=calendar&event=${eventData.id}`,
      metadata: {
        eventId: eventData.id,
        eventTitle: eventData.title,
        eventTime: eventData.startTime,
      },
      createdAt: new Date().toISOString(),
    }));

    if (notifications.length === 0) {
      return { success: true, count: 0 };
    }

    const notificationResponse = await fetch(`${API_BASE_URL}/notifications/batch`, {
      method: "POST",
      ...defaultOptions,
      body: JSON.stringify({ notifications }),
    });

    if (!notificationResponse.ok) {
      throw new Error(
        `Failed to create notifications: ${notificationResponse.statusText}`,
      );
    }

    return { success: true, count: notifications.length };
  } catch (error) {
    console.error("Failed to send event update notifications:", error);
    return { success: false, error };
  }
}

/**
 * Send notification when an event is cancelled.
 */
export async function notifyEventCancelled(eventData) {
  try {
    const notifications = eventData.attendees.map((attendee) => ({
      userId: attendee.founderId,
      type: "event-cancelled",
      title: `Event Cancelled: ${eventData.title}`,
      message: `The event "${eventData.title}" scheduled for ${new Date(eventData.startTime).toLocaleString()} has been cancelled.`,
      actionUrl: "/dashboard?view=calendar",
      metadata: {
        eventId: eventData.id,
        eventTitle: eventData.title,
        eventTime: eventData.startTime,
      },
      createdAt: new Date().toISOString(),
    }));

    if (notifications.length === 0) {
      return { success: true, count: 0 };
    }

    const notificationResponse = await fetch(`${API_BASE_URL}/notifications/batch`, {
      method: "POST",
      ...defaultOptions,
      body: JSON.stringify({ notifications }),
    });

    if (!notificationResponse.ok) {
      throw new Error(
        `Failed to create notifications: ${notificationResponse.statusText}`,
      );
    }

    return { success: true, count: notifications.length };
  } catch (error) {
    console.error("Failed to send event cancellation notifications:", error);
    return { success: false, error };
  }
}

/**
 * Send reminder notification 1 hour before event.
 */
export async function sendEventReminder(eventData) {
  try {
    const activeAttendees = eventData.attendees.filter(
      (a) => a.status === "attending" || a.status === "maybe",
    );

    const notifications = activeAttendees.map((attendee) => ({
      userId: attendee.founderId,
      type: "event-reminder",
      title: `Reminder: ${eventData.title} starts in 1 hour`,
      message: eventData.isVirtual
        ? `Join the meeting at ${eventData.meetingUrl || "the meeting link"}`
        : `Location: ${eventData.location}`,
      actionUrl:
        eventData.isVirtual && eventData.meetingUrl
          ? eventData.meetingUrl
          : `/dashboard?view=calendar&event=${eventData.id}`,
      metadata: {
        eventId: eventData.id,
        eventTitle: eventData.title,
        eventTime: eventData.startTime,
        isReminder: true,
      },
      createdAt: new Date().toISOString(),
    }));

    if (notifications.length === 0) {
      return { success: true, count: 0 };
    }

    const notificationResponse = await fetch(`${API_BASE_URL}/notifications/batch`, {
      method: "POST",
      ...defaultOptions,
      body: JSON.stringify({ notifications }),
    });

    if (!notificationResponse.ok) {
      throw new Error(
        `Failed to create notifications: ${notificationResponse.statusText}`,
      );
    }

    return { success: true, count: notifications.length };
  } catch (error) {
    console.error("Failed to send event reminders:", error);
    return { success: false, error };
  }
}

/**
 * Notify organization when founder RSVPs to event.
 */
export async function notifyOrganizationRSVP(
  organizationId,
  eventData,
  founderData,
  rsvpStatus,
) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/organizations/${organizationId}/admins`,
      {
        ...defaultOptions,
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch organization admins: ${response.statusText}`,
      );
    }

    const body = await response.json();
    const admins = Array.isArray(body)
      ? body
      : Array.isArray(body?.data)
        ? body.data
        : Array.isArray(body?.admins)
          ? body.admins
          : [];

    const statusEmoji = {
      attending: "✅",
      maybe: "❓",
      declined: "❌",
    };

    const notifications = admins.map((admin) => ({
      userId: admin.userId,
      type: "rsvp-received",
      title: `${statusEmoji[rsvpStatus]} RSVP: ${founderData.name}`,
      message: `${founderData.name}${founderData.startupName ? ` (${founderData.startupName})` : ""} ${rsvpStatus === "attending" ? "is attending" : rsvpStatus === "maybe" ? "might attend" : "declined"} "${eventData.title}"`,
      actionUrl: `/dashboard?view=cohort&event=${eventData.id}`,
      metadata: {
        eventId: eventData.id,
        eventTitle: eventData.title,
        founderId: founderData.id,
        founderName: founderData.name,
        rsvpStatus,
      },
      createdAt: new Date().toISOString(),
    }));

    const notificationResponse = await fetch(`${API_BASE_URL}/notifications/batch`, {
      method: "POST",
      ...defaultOptions,
      body: JSON.stringify({ notifications }),
    });

    if (!notificationResponse.ok) {
      throw new Error(
        `Failed to create notifications: ${notificationResponse.statusText}`,
      );
    }

    return { success: true, count: notifications.length };
  } catch (error) {
    console.error("Failed to notify organization of RSVP:", error);
    return { success: false, error };
  }
}

/**
 * Check for upcoming events and send reminders.
 * Background task: fail silently when backend is unavailable.
 */
export async function checkAndSendEventReminders() {
  try {
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const fifteenMinutesFromNow = new Date(
      Date.now() + 15 * 60 * 1000,
    ).toISOString();

    const path = `/events/upcoming?start=${encodeURIComponent(fifteenMinutesFromNow)}&end=${encodeURIComponent(oneHourFromNow)}`;
    let events;
    try {
      const envelope = await backendGet(path);
      events = envelope?.data?.events;
    } catch {
      return { success: false, count: 0 };
    }
    if (!Array.isArray(events)) {
      return { success: false, count: 0 };
    }

    let totalSent = 0;
    for (const event of events) {
      const id = String(event?.id || "");
      if (!id || upcomingEventReminderSent.has(id)) continue;
      const result = await sendEventReminder(event);
      if (result.success) {
        upcomingEventReminderSent.add(id);
        totalSent += result.count || 0;
      }
    }

    return { success: true, count: totalSent };
  } catch {
    return { success: false, count: 0 };
  }
}
