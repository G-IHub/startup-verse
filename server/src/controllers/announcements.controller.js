import Announcement from "../models/Announcement.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";

export const markAnnouncementRead = async (req, res) => {
  const announcement = await Announcement.findById(req.params.announcementId);
  if (!announcement) {
    return apiError(res, "Announcement not found.", 404);
  }

  const readBy = new Set(announcement.readBy || []);
  readBy.add(String(req.user.id));
  announcement.readBy = Array.from(readBy);
  await announcement.save();

  const o = announcement.toObject();
  return apiSuccess(res, { announcement: { ...o, id: String(o._id) } });
};
