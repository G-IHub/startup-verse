/**
 * Blueprint Phase B3 — server-side scheduled notification jobs.
 * Invoked by node-cron in `index.js` and manually from `cron.routes.js`.
 */
import User from "../models/User.js";
import WeeklyOutcome from "../models/WeeklyOutcome.js";
import Deliverable from "../models/Deliverable.js";
import DeliverableSubmission from "../models/DeliverableSubmission.js";
import Event from "../models/Event.js";
import CohortInvitation from "../models/CohortInvitation.js";
import CohortMembership from "../models/CohortMembership.js";
import { createNotification, broadcastNotification } from "./notificationService.js";
import { logger } from "../config/logger.js";

function startOfWeek(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** @returns {Promise<{ reminded: number }>} */
export async function runWeeklyOutcomeReminderJob() {
  const upcomingWeekStart = addDays(startOfWeek(new Date()), 7);
  const founders = await User.find({ role: "founder" }).select("_id").lean();
  let reminded = 0;
  for (const f of founders) {
    const fid = f._id;
    const hasActive = await WeeklyOutcome.exists({
      founderId: fid,
      weekOf: upcomingWeekStart,
      status: "active",
    });
    if (!hasActive) {
      await createNotification({
        userId: fid,
        type: "weekly-outcome-reminder",
        title: "Set your weekly goal",
        message: "Plan your focus for the week ahead — set your weekly outcome.",
        actionUrl: "/?view=virtual-office&tab=weekly",
        metadata: { weekOf: upcomingWeekStart.toISOString(), job: "weekly-outcome-reminder" },
      }).catch(() => null);
      reminded += 1;
    }
  }
  logger.info("scheduler.weekly-outcome-reminder", { reminded });
  return { reminded };
}

/** @returns {Promise<{ reminded: number }>} */
export async function runWeeklyReviewReminderJob() {
  const currentWeekStart = startOfWeek(new Date());
  const founders = await User.find({ role: "founder" }).select("_id").lean();
  let reminded = 0;
  for (const f of founders) {
    const fid = f._id;
    const active = await WeeklyOutcome.findOne({
      founderId: fid,
      weekOf: currentWeekStart,
      status: "active",
    }).lean();
    if (active) {
      await createNotification({
        userId: fid,
        type: "weekly-review-reminder",
        title: "Weekly review",
        message: "Wrap up your week — review and submit your weekly outcome.",
        actionUrl: "/?view=virtual-office&tab=weekly",
        metadata: { outcomeId: String(active._id), job: "weekly-review-reminder" },
      }).catch(() => null);
      reminded += 1;
    }
  }
  logger.info("scheduler.weekly-review-reminder", { reminded });
  return { reminded };
}

function computeStreak(outcomes) {
  const sorted = [...outcomes].sort(
    (a, b) => new Date(b.weekOf).getTime() - new Date(a.weekOf).getTime(),
  );
  let streak = 0;
  for (const o of sorted) {
    if (o.status === "completed") streak += 1;
    else if (o.status === "partial") streak += 1;
    else break;
  }
  return streak;
}

/** @returns {Promise<{ reminded: number }>} */
export async function runStreakAtRiskJob() {
  const currentWeekStart = startOfWeek(new Date());
  const founders = await User.find({ role: "founder" }).select("_id").lean();
  let reminded = 0;
  for (const f of founders) {
    const fid = f._id;
    const active = await WeeklyOutcome.findOne({
      founderId: fid,
      weekOf: currentWeekStart,
      status: "active",
    }).lean();
    if (!active) continue;
    const past = await WeeklyOutcome.find({
      founderId: fid,
      status: { $in: ["completed", "partial", "missed"] },
    })
      .sort({ weekOf: -1 })
      .limit(20)
      .lean();
    const streak = computeStreak(past.filter((o) => o.status !== "missed"));
    if (streak > 0) {
      await createNotification({
        userId: fid,
        type: "streak-at-risk",
        title: "Streak at risk",
        message: `You have a ${streak}-week execution streak — submit this week's outcome before it resets.`,
        actionUrl: "/?view=virtual-office&tab=weekly",
        metadata: { streak, job: "streak-at-risk" },
      }).catch(() => null);
      reminded += 1;
    }
  }
  logger.info("scheduler.streak-at-risk", { reminded });
  return { reminded };
}

/** @returns {Promise<{ notified: number }>} */
export async function runDeliverableDueSoonJob() {
  const now = new Date();
  const horizon = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const deliverables = await Deliverable.find({
    dueDate: { $gte: now, $lte: horizon },
  }).lean();
  let notified = 0;
  for (const d of deliverables) {
    const memberships = await CohortMembership.find({ cohortId: d.cohortId }, { founderId: 1 }).lean();
    const founderIds = memberships.map((m) => m.founderId).filter(Boolean);
    for (const founderId of founderIds) {
      const sub = await DeliverableSubmission.findOne({
        deliverableId: d._id,
        founderId,
      }).lean();
      const hasRealSubmission =
        sub &&
        sub.status === "submitted" &&
        (String(sub.content || "").trim().length > 0 ||
          (Array.isArray(sub.links) && sub.links.length > 0));
      if (hasRealSubmission) continue;
      await createNotification({
        userId: founderId,
        type: "deliverable-due-soon",
        title: "Deliverable due soon",
        message: `"${d.title}" is due within 24 hours.`,
        actionUrl: `/?view=virtual-office&tab=deliverables&deliverableId=${d._id}`,
        metadata: { deliverableId: String(d._id), job: "deliverable-due-soon" },
      }).catch(() => null);
      notified += 1;
    }
  }
  logger.info("scheduler.deliverable-due-soon", { notified });
  return { notified };
}

function extractAttendeeUserIds(attendees) {
  if (!Array.isArray(attendees)) return [];
  const ids = [];
  for (const a of attendees) {
    if (!a) continue;
    if (typeof a === "string" && a.length === 24) ids.push(a);
    else if (typeof a === "object" && a.userId) ids.push(String(a.userId));
    else if (typeof a === "object" && a.id) ids.push(String(a.id));
  }
  return [...new Set(ids)];
}

/** @returns {Promise<{ reminded: number }>} */
export async function runEventReminderJob() {
  const now = new Date();
  const soon = new Date(now.getTime() + 60 * 60 * 1000);
  const events = await Event.find({
    startsAt: { $gte: now, $lte: soon },
  }).lean();
  let reminded = 0;
  for (const ev of events) {
    const userIds = new Set();
    if (ev.founderId) userIds.add(String(ev.founderId));
    for (const id of extractAttendeeUserIds(ev.attendees)) userIds.add(id);
    if (userIds.size === 0) continue;
    await broadcastNotification([...userIds], {
      type: "event-reminder",
      title: "Event starting soon",
      message: `"${ev.title}" starts within the hour.`,
      actionUrl: "/?view=virtual-office&tab=calendar",
      metadata: { eventId: String(ev._id), job: "event-reminder" },
    });
    reminded += userIds.size;
  }
  logger.info("scheduler.event-reminder", { events: events.length, notifications: reminded });
  return { reminded };
}

/** @returns {Promise<{ reminded: number }>} */
export async function runCohortInvitationExpiryJob() {
  const now = new Date();
  const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const invites = await CohortInvitation.find({
    status: "pending",
    expiresAt: { $gte: now, $lte: soon },
  }).lean();
  let reminded = 0;
  for (const inv of invites) {
    if (!inv.founderId) continue;
    await createNotification({
      userId: inv.founderId,
      type: "cohort-invitation-expiring",
      title: "Invitation expiring",
      message: "Your cohort invitation expires within 24 hours.",
      actionUrl: `/?invitation=${inv.token}`,
      metadata: { invitationId: String(inv._id), job: "cohort-invitation-expiring" },
    }).catch(() => null);
    reminded += 1;
  }
  logger.info("scheduler.cohort-invitation-expiry", { reminded });
  return { reminded };
}

/** Manual trigger: run deliverable + event reminders (used by agenda daily). */
export async function runDailyDigestJobs() {
  const [deliverables, events, invites] = await Promise.all([
    runDeliverableDueSoonJob(),
    runEventReminderJob(),
    runCohortInvitationExpiryJob(),
  ]);
  return {
    deliverableDueSoon: deliverables.notified,
    eventReminders: events.reminded,
    invitationExpiry: invites.reminded,
  };
}
