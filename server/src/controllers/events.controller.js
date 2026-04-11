import Event from "../models/Event.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";

function mapEvent(e) {
  const o = e.toObject ? e.toObject() : e;
  return {
    ...o,
    id: String(o._id),
    startTime: o.startsAt,
    endTime: o.endsAt,
  };
}

export const listUpcomingEvents = async (req, res) => {
  const start = req.query?.start ? new Date(String(req.query.start)) : new Date();
  const end = req.query?.end
    ? new Date(String(req.query.end))
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const rows = await Event.find({ startsAt: { $gte: start, $lte: end } }).sort({ startsAt: 1 });
  return apiSuccess(res, { events: rows.map(mapEvent) });
};

export const rsvpEvent = async (req, res) => {
  const event = await Event.findById(req.params.eventId);
  if (!event) {
    return apiError(res, "Event not found.", 404);
  }

  event.attendees = [
    ...(event.attendees || []).filter((item) => String(item.userId) !== String(req.user.id)),
    { userId: req.user.id, status: req.body?.status || "going", at: new Date().toISOString() },
  ];

  await event.save();
  return apiSuccess(res, { event: mapEvent(event) });
};
