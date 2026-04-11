/**
 * UNIFIED CALENDAR INTEGRATION
 * Aggregates all date-tracked activities across the platform
 */

import { getAccessToken } from "../app/session";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

function authHeaders() {
  const token = getAccessToken();
  return {
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };
}

function unwrapData(json) {
  if (!json || typeof json !== "object") return json;
  return json.data !== undefined ? json.data : json;
}

/** Handles `{ data: T[] }`, `{ data: { events: T[] } }`, and compat `{ data: { 0: row, 1: row, _compat } }`. */
function listFromApi(json, ...namedKeys) {
  const data = unwrapData(json);
  if (Array.isArray(data)) return data;
  for (const key of namedKeys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  if (data && typeof data === "object") {
    const numeric = Object.keys(data)
      .filter((k) => /^\d+$/.test(k))
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => data[k])
      .filter((row) => row && typeof row === "object");
    if (numeric.length) return numeric;
  }
  return [];
}

function milestonesFromApi(json) {
  const data = unwrapData(json);
  if (Array.isArray(data?.milestones)) return data.milestones;
  return listFromApi(json, "milestones");
}

function mapApiEventToCalendar(event, source, extraMeta = {}) {
  const id = event.id || event._id;
  const startDate = event.startTime || event.startsAt;
  const endDate = event.endTime || event.endsAt;
  return {
    id,
    title: event.title,
    description: event.description,
    startDate,
    endDate,
    type: "event",
    location: event.location,
    isVirtual: event.isVirtual,
    meetingUrl: event.meetingUrl,
    source,
    metadata: {
      eventType: event.eventType,
      organizationName: event.organizationName,
      attendees: event.attendees,
      capacity: event.capacity,
      ...extraMeta,
    },
  };
}

/**
 * Get all calendar events for a founder
 * Aggregates: Cohort events, deliverables, milestones, weekly outcomes
 */
export async function getFounderCalendarEvents(founderId) {
  try {
    console.log(
      "📅 [Calendar] Fetching all calendar events for founder:",
      founderId,
    );

    const allEvents = [];

    // 1. Get cohort events
    const eventsResponse = await fetch(
      `${API_BASE}/founder/${founderId}/events`,
      { headers: authHeaders() },
    );

    if (eventsResponse.ok) {
      const payload = await eventsResponse.json();
      const events = listFromApi(payload, "events");
      const calendarEvents = events.map((event) =>
        mapApiEventToCalendar(event, "cohort"),
      );
      allEvents.push(...calendarEvents);
      console.log(`📅 [Calendar] Found ${calendarEvents.length} cohort events`);
    }

    // 2. Get deliverables
    const deliverablesResponse = await fetch(
      `${API_BASE}/deliverables/founder/${founderId}`,
      { headers: authHeaders() },
    );

    if (deliverablesResponse.ok) {
      const payload = await deliverablesResponse.json();
      const deliverables = listFromApi(payload, "deliverables");
      const calendarDeliverables = deliverables.map((deliverable) => ({
        id: deliverable.id || deliverable._id,
        title: `📝 ${deliverable.title}`,
        description: deliverable.description,
        startDate: deliverable.dueDate,
        type: "deliverable",
        status: deliverable.mySubmission?.status || "pending",
        source: "cohort",
        metadata: {
          cohortName: deliverable.cohortName,
          submissionType: deliverable.submissionType,
          mySubmission: deliverable.mySubmission,
        },
      }));
      allEvents.push(...calendarDeliverables);
      console.log(
        `📅 [Calendar] Found ${calendarDeliverables.length} deliverables`,
      );
    }

    // 3. Program milestones (canonical cohort ids from membership)
    const cohortsResponse = await fetch(
      `${API_BASE}/cohorts/founder/${founderId}`,
      { headers: authHeaders() },
    );

    if (cohortsResponse.ok) {
      const payload = await cohortsResponse.json();
      const data = unwrapData(payload);
      const cohortIds = Array.isArray(data?.cohortIds) ? data.cohortIds : [];

      for (const cohortId of cohortIds) {
        const milestonesResponse = await fetch(
          `${API_BASE}/cohorts/${cohortId}/program-milestones`,
          { headers: authHeaders() },
        );

        if (milestonesResponse.ok) {
          const mPayload = await milestonesResponse.json();
          const milestones = milestonesFromApi(mPayload);
          const calendarMilestones = milestones
            .filter((m) => m.targetDate || m.dueDate)
            .map((milestone) => ({
              id: milestone.id || milestone._id,
              title: `🎯 ${milestone.title}`,
              description: milestone.description,
              startDate: milestone.targetDate || milestone.dueDate,
              type: "milestone",
              status: milestone.status,
              source: "cohort",
              metadata: {
                category: milestone.category,
                requirements: milestone.requirements,
              },
            }));
          allEvents.push(...calendarMilestones);
          console.log(
            `📅 [Calendar] Found ${calendarMilestones.length} milestones for cohort ${cohortId}`,
          );
        }
      }
    }

    // 4. Get weekly outcomes (from execution loop)
    const weeklyOutcomes = JSON.parse(
      localStorage.getItem("weeklyOutcomes") || "{}",
    );
    const founderOutcomes = weeklyOutcomes[founderId] || [];

    const outcomeEvents = founderOutcomes
      .filter((outcome) => outcome.date)
      .map((outcome) => ({
        id: `outcome-${outcome.weekNumber}`,
        title: `📊 Week ${outcome.weekNumber} Outcome`,
        description: outcome.outcomeDescription,
        startDate: outcome.date,
        type: "outcome",
        status: outcome.approved ? "approved" : "pending",
        source: "personal",
        metadata: {
          weekNumber: outcome.weekNumber,
          category: outcome.category,
          approved: outcome.approved,
        },
      }));
    allEvents.push(...outcomeEvents);
    console.log(`📅 [Calendar] Found ${outcomeEvents.length} weekly outcomes`);

    // Sort by date
    allEvents.sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

    console.log(`📅 [Calendar] Total events: ${allEvents.length}`);
    return allEvents;
  } catch (error) {
    console.error("❌ [Calendar] Failed to fetch calendar events:", error);
    return [];
  }
}

/**
 * Get upcoming events (next 7 days)
 */
export async function getUpcomingEvents(founderId, days = 7) {
  const allEvents = await getFounderCalendarEvents(founderId);

  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return allEvents.filter((event) => {
    const eventDate = new Date(event.startDate);
    return eventDate >= now && eventDate <= futureDate;
  });
}

/**
 * Get events for a specific date range
 */
export async function getEventsInRange(founderId, startDate, endDate) {
  const allEvents = await getFounderCalendarEvents(founderId);

  const start = new Date(startDate);
  const end = new Date(endDate);

  return allEvents.filter((event) => {
    const eventDate = new Date(event.startDate);
    return eventDate >= start && eventDate <= end;
  });
}

/**
 * Get events grouped by date
 */
export async function getEventsGroupedByDate(founderId) {
  const allEvents = await getFounderCalendarEvents(founderId);

  const grouped = {};

  allEvents.forEach((event) => {
    const date = new Date(event.startDate).toISOString().split("T")[0];
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(event);
  });

  return grouped;
}

/**
 * Get organization calendar events (for org admins)
 */
export async function getOrganizationCalendarEvents(organizationId) {
  try {
    console.log(
      "📅 [Calendar] Fetching org calendar events for:",
      organizationId,
    );

    const allEvents = [];

    const cohortsResponse = await fetch(
      `${API_BASE}/cohorts/organization/${organizationId}`,
      { headers: authHeaders() },
    );

    if (!cohortsResponse.ok) {
      console.error(
        "❌ [Calendar] Failed to fetch cohorts:",
        await cohortsResponse.text(),
      );
      return [];
    }

    const cohortPayload = await cohortsResponse.json();
    const cohorts = listFromApi(cohortPayload, "cohorts");

    for (const cohort of cohorts) {
      const cohortId = cohort.id || cohort._id;
      const cohortName = cohort.name;

      const eventsResponse = await fetch(`${API_BASE}/cohorts/${cohortId}/events`, {
        headers: authHeaders(),
      });

      if (eventsResponse.ok) {
        const payload = await eventsResponse.json();
        const events = listFromApi(payload, "events");
        const calendarEvents = events.map((event) =>
          mapApiEventToCalendar(event, "organization", {
            cohortId,
            cohortName,
          }),
        );
        allEvents.push(...calendarEvents);
      }

      const deliverablesResponse = await fetch(
        `${API_BASE}/deliverables/${cohortId}`,
        { headers: authHeaders() },
      );

      if (deliverablesResponse.ok) {
        const payload = await deliverablesResponse.json();
        const deliverables = listFromApi(payload, "deliverables");
        const calendarDeliverables = deliverables.map((deliverable) => ({
          id: deliverable.id || deliverable._id,
          title: `📝 ${deliverable.title}`,
          description: deliverable.description,
          startDate: deliverable.dueDate,
          type: "deliverable",
          source: "organization",
          metadata: {
            cohortId,
            cohortName,
            submissionType: deliverable.submissionType,
            totalSubmissions: deliverable.submissions?.length || 0,
          },
        }));
        allEvents.push(...calendarDeliverables);
      }

      const milestonesResponse = await fetch(
        `${API_BASE}/cohorts/${cohortId}/program-milestones`,
        { headers: authHeaders() },
      );

      if (milestonesResponse.ok) {
        const payload = await milestonesResponse.json();
        const milestones = milestonesFromApi(payload);
        const calendarMilestones = milestones
          .filter((m) => m.targetDate || m.dueDate)
          .map((milestone) => ({
            id: milestone.id || milestone._id,
            title: `🎯 ${milestone.title}`,
            description: milestone.description,
            startDate: milestone.targetDate || milestone.dueDate,
            type: "milestone",
            status: milestone.status,
            source: "organization",
            metadata: {
              cohortId,
              cohortName,
              category: milestone.category,
            },
          }));
        allEvents.push(...calendarMilestones);
      }
    }

    allEvents.sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

    console.log(`📅 [Calendar] Total org events: ${allEvents.length}`);
    return allEvents;
  } catch (error) {
    console.error("❌ [Calendar] Failed to fetch org calendar events:", error);
    return [];
  }
}
