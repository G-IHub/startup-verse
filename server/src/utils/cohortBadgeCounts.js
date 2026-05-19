import mongoose from "mongoose";
import Message from "../models/Message.js";
import Deliverable from "../models/Deliverable.js";
import DeliverableSubmission from "../models/DeliverableSubmission.js";
import Announcement from "../models/Announcement.js";
import Event from "../models/Event.js";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Cohort sidebar badge counts for the current org-admin viewer (Step 2.1 / O1).
 *
 * - unreadMessages: inbound messages to viewer in this cohort with readAt null
 * - pendingSubmissions: submissions status "submitted" on non-archived cohort deliverables
 * - newAnnouncements: cohort announcements where readBy does not include viewer
 * - upcomingEventsNext7d: cohort events with startsAt in [now, now + 7 days]
 */
export async function computeCohortBadgeCounts(cohortId, viewerUserId) {
  const cohortObjectId = new mongoose.Types.ObjectId(String(cohortId));
  const viewerId = String(viewerUserId);
  const now = new Date();
  const windowEnd = new Date(now.getTime() + SEVEN_DAYS_MS);

  const deliverableIdsPromise = Deliverable.find(
    { cohortId: cohortObjectId, archived: { $ne: true } },
    { _id: 1 },
  )
    .lean()
    .then((rows) => rows.map((d) => d._id));

  const [
    deliverableIds,
    unreadMessages,
    newAnnouncements,
    upcomingEventsNext7d,
  ] = await Promise.all([
    deliverableIdsPromise,
    Message.countDocuments({
      cohortId: cohortObjectId,
      toUserId: viewerUserId,
      readAt: null,
    }),
    Announcement.countDocuments({
      cohortId: cohortObjectId,
      readBy: { $nin: [viewerId] },
    }),
    Event.countDocuments({
      cohortId: cohortObjectId,
      startsAt: { $gte: now, $lte: windowEnd },
    }),
  ]);

  let pendingSubmissions = 0;
  if (deliverableIds.length > 0) {
    pendingSubmissions = await DeliverableSubmission.countDocuments({
      deliverableId: { $in: deliverableIds },
      status: "submitted",
    });
  }

  return {
    unreadMessages,
    pendingSubmissions,
    newAnnouncements,
    upcomingEventsNext7d,
  };
}
