/**
 * UNIFIED CALENDAR INTEGRATION
 * Aggregates all date-tracked activities across the platform
 */

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
      `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/founder/${founderId}/events`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (eventsResponse.ok) {
      const { events } = await eventsResponse.json();
      const calendarEvents = events.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        startDate: event.startTime,
        endDate: event.endTime,
        type: "event",
        location: event.location,
        isVirtual: event.isVirtual,
        meetingUrl: event.meetingUrl,
        source: "cohort",
        metadata: {
          eventType: event.eventType,
          organizationName: event.organizationName,
          attendees: event.attendees,
          capacity: event.capacity,
        },
      }));
      allEvents.push(...calendarEvents);
      console.log(`📅 [Calendar] Found ${calendarEvents.length} cohort events`);
    }

    // 2. Get deliverables
    const deliverablesResponse = await fetch(
      `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/deliverables/founder/${founderId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (deliverablesResponse.ok) {
      const { deliverables } = await deliverablesResponse.json();
      const calendarDeliverables = deliverables.map((deliverable) => ({
        id: deliverable.id,
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

    // 3. Get program milestones
    // Note: Milestones are cohort-specific, need to get from each cohort
    const founderCohortsKey = `founder:${founderId}:cohorts`;
    const cohortsResponse = await fetch(
      `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/kv/get?key=${founderCohortsKey}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (cohortsResponse.ok) {
      const cohortData = await cohortsResponse.json();
      const cohortIds = cohortData.value || [];

      for (const cohortId of cohortIds) {
        const milestonesResponse = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/program-milestones/${cohortId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (milestonesResponse.ok) {
          const { milestones } = await milestonesResponse.json();
          const calendarMilestones = milestones
            .filter((m) => m.targetDate)
            .map((milestone) => ({
              id: milestone.id,
              title: `🎯 ${milestone.title}`,
              description: milestone.description,
              startDate: milestone.targetDate,
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

    // Get all cohorts for this organization
    const cohortsResponse = await fetch(
      `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/cohorts/organization/${organizationId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!cohortsResponse.ok) {
      console.error(
        "❌ [Calendar] Failed to fetch cohorts:",
        await cohortsResponse.text(),
      );
      return [];
    }

    const { cohorts } = await cohortsResponse.json();

    // Get events, deliverables, and milestones for each cohort
    for (const cohort of cohorts) {
      // Events
      const eventsResponse = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/events/${cohort.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (eventsResponse.ok) {
        const { events } = await eventsResponse.json();
        const calendarEvents = events.map((event) => ({
          id: event.id,
          title: event.title,
          description: event.description,
          startDate: event.startTime,
          endDate: event.endTime,
          type: "event",
          location: event.location,
          isVirtual: event.isVirtual,
          meetingUrl: event.meetingUrl,
          source: "organization",
          metadata: {
            cohortId: cohort.id,
            cohortName: cohort.name,
            eventType: event.eventType,
            attendees: event.attendees,
            capacity: event.capacity,
          },
        }));
        allEvents.push(...calendarEvents);
      }

      // Deliverables
      const deliverablesResponse = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/deliverables/${cohort.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (deliverablesResponse.ok) {
        const { deliverables } = await deliverablesResponse.json();
        const calendarDeliverables = deliverables.map((deliverable) => ({
          id: deliverable.id,
          title: `📝 ${deliverable.title}`,
          description: deliverable.description,
          startDate: deliverable.dueDate,
          type: "deliverable",
          source: "organization",
          metadata: {
            cohortId: cohort.id,
            cohortName: cohort.name,
            submissionType: deliverable.submissionType,
            totalSubmissions: deliverable.submissions?.length || 0,
          },
        }));
        allEvents.push(...calendarDeliverables);
      }

      // Milestones
      const milestonesResponse = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/program-milestones/${cohort.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (milestonesResponse.ok) {
        const { milestones } = await milestonesResponse.json();
        const calendarMilestones = milestones
          .filter((m) => m.targetDate)
          .map((milestone) => ({
            id: milestone.id,
            title: `🎯 ${milestone.title}`,
            description: milestone.description,
            startDate: milestone.targetDate,
            type: "milestone",
            status: milestone.status,
            source: "organization",
            metadata: {
              cohortId: cohort.id,
              cohortName: cohort.name,
              category: milestone.category,
            },
          }));
        allEvents.push(...calendarMilestones);
      }
    }

    // Sort by date
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
