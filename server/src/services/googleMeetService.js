/**
 * Google Calendar events with Meet conference links.
 */
import { google } from "googleapis";
import { getGoogleOAuthConfig } from "../config/googleIntegration.js";
import { getOAuth2ClientForUser } from "./googleOAuthService.js";

function conferenceData() {
  return {
    createRequest: {
      requestId: `sv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      conferenceSolutionKey: { type: "hangoutsMeet" },
    },
  };
}

function extractMeetLink(event) {
  return (
    event?.hangoutLink ||
    event?.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")
      ?.uri ||
    ""
  );
}

async function calendarForUser(userId) {
  const cfg = getGoogleOAuthConfig();
  if (!cfg.configured) {
    throw new Error("Google OAuth is not configured.");
  }
  const auth = await getOAuth2ClientForUser(userId);
  if (!auth) {
    throw new Error("Google account not connected.");
  }
  return google.calendar({ version: "v3", auth });
}

/**
 * Instant Meet — short calendar event starting now.
 */
export async function createInstantMeet(userId, { title = "StartupVerse Meeting" } = {}) {
  const calendar = await calendarForUser(userId);
  const start = new Date();
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const { data: event } = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    requestBody: {
      summary: title,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      conferenceData: conferenceData(),
    },
  });

  const meetLink = extractMeetLink(event);
  if (!meetLink) {
    throw new Error("Google did not return a Meet link.");
  }
  return { meetLink, eventId: event.id || null, htmlLink: event.htmlLink || null };
}

/**
 * Scheduled meeting with Meet link.
 */
export async function createMeetingWithMeet(
  userId,
  { title, description, startTime, endTime } = {},
) {
  const calendar = await calendarForUser(userId);
  const start = startTime ? new Date(startTime) : new Date();
  const end = endTime
    ? new Date(endTime)
    : new Date(start.getTime() + 60 * 60 * 1000);

  const { data: event } = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    requestBody: {
      summary: title || "StartupVerse Meeting",
      description: description || "",
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      conferenceData: conferenceData(),
    },
  });

  const meetLink = extractMeetLink(event);
  return {
    meetLink,
    eventId: event.id || null,
    htmlLink: event.htmlLink || null,
  };
}
