/**
 * Event notification system.
 */

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

function getAuthHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
    "Content-Type": "application/json",
  };
}

/**
 * Send notification when a new event is created.
 */
export async function notifyEventCreated(cohortId, organizationId, eventData) {
  try {
    const response = await fetch(`${API_BASE_URL}/cohorts/${cohortId}/members`, {
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch organization admins: ${response.statusText}`,
      );
    }

    const { admins } = await response.json();

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
      headers: getAuthHeaders(),
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

    const response = await fetch(
      `${API_BASE_URL}/events/upcoming?start=${fifteenMinutesFromNow}&end=${oneHourFromNow}`,
      {
        headers: getAuthHeaders(),
      },
    );

    if (!response.ok) {
      return { success: false, count: 0 };
    }

    const { events } = await response.json();

    let totalSent = 0;
    for (const event of events) {
      const reminderKey = `event-reminder-${event.id}`;
      const reminderSent = localStorage.getItem(reminderKey);

      if (!reminderSent) {
        const result = await sendEventReminder(event);
        if (result.success) {
          totalSent += result.count || 0;
          localStorage.setItem(reminderKey, new Date().toISOString());
        }
      }
    }

    return { success: true, count: totalSent };
  } catch {
    return { success: false, count: 0 };
  }
}
