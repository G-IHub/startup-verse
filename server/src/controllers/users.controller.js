import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import { sanitizeUser } from "../utils/sanitize.js";
import { USER_ROLES } from "../utils/enums.js";

// - Get user by ID
export const getUserById = async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    return apiError(res, "User not found.", 404);
  }
  return apiSuccess(res, sanitizeUser(user));
};

// Blueprint §14: POST /api/v1/users/ — admin-only create user
export const createUser = async (req, res) => {
  if (req.user?.isAdmin !== true) {
    return apiError(res, "Forbidden. Admin only.", 403);
  }
  const { name, email, password, role } = req.body || {};
  if (!name || !email || !password) {
    return apiError(res, "name, email, and password are required.", 400);
  }
  const normalizedEmail = String(email).toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return apiError(res, "Account already exists.", 409);
  }
  const requestedRole = String(role || "founder").toLowerCase();
  const finalRole = USER_ROLES.includes(requestedRole)
    ? requestedRole
    : "founder";
  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    password: String(password),
    role: finalRole,
    isAdmin: false,
  });
  return apiSuccess(res, sanitizeUser(user), 201);
};

// - Search user by email
export const searchByEmail = async (req, res) => {
  const { email } = req.body || {};

  if (!email) {
    return apiError(res, "email is required.", 400);
  }

  const user = await User.findOne({ email: String(email).toLowerCase().trim() });

  return apiSuccess(res, {
    found: Boolean(user),
    user: sanitizeUser(user),
  });
};

// - Get user's notifications
export const getNotifications = async (req, res) => {
  const notifications = await Notification.find({ userId: req.params.userId })
    .sort({ createdAt: -1 })
    .limit(100);

  return apiSuccess(res, notifications);
};

// - Mark all user's notifications as read
export const markAllNotificationsRead = async (req, res) => {
  await Notification.updateMany(
    { userId: req.params.userId, readAt: null },
    { $set: { readAt: new Date() } },
  );

  return apiSuccess(res, { markedAllRead: true });
};

// - Delete all user's notifications
export const clearNotifications = async (req, res) => {
  const result = await Notification.deleteMany({ userId: req.params.userId });
  return apiSuccess(res, { deletedCount: Number(result.deletedCount || 0) });
};

// - Get notification preferences
export const getNotificationPreferences = async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    return apiError(res, "User not found.", 404);
  }
  return apiSuccess(res, user.notificationPreferences || {});
};

// - Update notification preferences
export const updateNotificationPreferences = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.userId,
    { notificationPreferences: req.body || {} },
    { new: true, runValidators: true },
  );

  if (!user) {
    return apiError(res, "User not found.", 404);
  }

  return apiSuccess(res, user.notificationPreferences || {});
};

// - Upload Avatar (Compatibility & Canonical)
export const uploadAvatar = async (req, res) => {
  const requestedUserId = String(req.body?.userId || "").trim();
  const userId = requestedUserId || req.user.id;
  const avatarUrl = req.body?.avatarUrl || "";
  if (!userId) {
    return apiError(res, "userId is required.", 400);
  }

  const isSelf = String(req.user.id) === String(userId);
  if (!isSelf && req.user.isAdmin !== true) {
    return apiError(res, "Forbidden.", 403);
  }

  // Ensure URL is not ridiculously long and is safe
  if (avatarUrl && avatarUrl.length > 1000) {
    return apiError(res, "avatarUrl exceeds maximum length.", 400);
  }

  const user = await User.findByIdAndUpdate(
    userId, 
    { avatarUrl }, 
    { new: true, runValidators: true }
  );
  
  if (!user) {
    return apiError(res, "User not found.", 404);
  }

  return apiSuccess(res, { avatarUrl: user.avatarUrl });
};
