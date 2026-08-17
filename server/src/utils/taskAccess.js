import User from "../models/User.js";
import Startup from "../models/Startup.js";

/**
 * Startup member gate for task read/comment.
 * Do not use founderGuard here; team members must be able to open the page.
 */
export async function canAccessStartupTask(req, task) {
  if (!task) return false;
  if (req.user?.isAdmin === true) return true;

  const userId = String(req.user?.id || "");
  if (!userId) return false;
  if (String(task.founderId || "") === userId) return true;

  const startupId = String(task.startupId || "");
  const me = await User.findById(userId, { startupId: 1, founderId: 1 }).lean();
  if (!me) return false;
  if (startupId && String(me.startupId || "") === startupId) return true;

  if (startupId) {
    const founded = await Startup.findOne({ founderId: userId }, { _id: 1 }).lean();
    if (founded && String(founded._id) === startupId) return true;
  }
  return false;
}

export function isTaskFounder(req, task) {
  if (req.user?.isAdmin === true) return true;
  return String(req.user?.id || "") === String(task?.founderId || "");
}

export function isAllowedUploadUrl(url) {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (trimmed.startsWith("/uploads/")) return true;
  if (trimmed.includes("/uploads/")) return true;
  if (/^https:\/\/res\.cloudinary\.com\//i.test(trimmed)) return true;
  return false;
}

export function parsePageParams(query, defaultSize = 20) {
  const page = Math.max(1, Number(query?.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(query?.pageSize) || defaultSize));
  return { page, pageSize, skip: (page - 1) * pageSize };
}
