import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import { sanitizeUser } from "../utils/sanitize.js";
import { USER_ROLES } from "../utils/enums.js";
import { uploadBuffer } from "../services/uploadService.js";
import {
  getAvatarMaxBytes,
  isAllowedAvatarMime,
} from "../utils/avatarAttachments.js";

const MAX_CLIENT_PREF_KEYS = 80;
const MAX_CLIENT_PREF_JSON_BYTES = 120_000;

function clampClientPreferenceValue(value, depth = 0) {
  if (depth > 4) return undefined;
  if (value === null) return null;
  const t = typeof value;
  if (t === "string") return value.slice(0, 50_000);
  if (t === "number" && Number.isFinite(value)) return value;
  if (t === "boolean") return value;
  if (Array.isArray(value)) {
    return value.slice(0, 500).map((item) => clampClientPreferenceValue(item, depth + 1)).filter((x) => x !== undefined);
  }
  if (t === "object") {
    const out = {};
    const entries = Object.entries(value).slice(0, 80);
    for (const [k, v] of entries) {
      if (typeof k !== "string" || k.length > 128) continue;
      const next = clampClientPreferenceValue(v, depth + 1);
      if (next !== undefined) out[k] = next;
    }
    return out;
  }
  return undefined;
}

/** Merge validated patch into existing clientPreferences; omit keys set to null. */
export function mergeClientPreferences(existing, patch) {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing) ? { ...existing } : {};
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) return base;
  const keys = Object.keys(patch);
  if (keys.length > MAX_CLIENT_PREF_KEYS) {
    return null;
  }
  for (const key of keys) {
    if (typeof key !== "string" || key.length > 128) continue;
    const v = patch[key];
    if (v === null) {
      delete base[key];
      continue;
    }
    const clamped = clampClientPreferenceValue(v);
    if (clamped !== undefined) base[key] = clamped;
  }
  try {
    const json = JSON.stringify(base);
    if (json.length > MAX_CLIENT_PREF_JSON_BYTES) return null;
  } catch {
    return null;
  }
  return base;
}

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

export const getClientPreferences = async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    return apiError(res, "User not found.", 404);
  }
  const prefs =
    user.clientPreferences && typeof user.clientPreferences === "object"
      ? user.clientPreferences
      : {};
  return apiSuccess(res, prefs);
};

export const updateClientPreferences = async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    return apiError(res, "User not found.", 404);
  }
  const merged = mergeClientPreferences(user.clientPreferences || {}, req.body || {});
  if (!merged) {
    return apiError(res, "Invalid or oversized client preferences.", 400);
  }
  const updated = await User.findByIdAndUpdate(
    req.params.userId,
    { clientPreferences: merged },
    { new: true, runValidators: true },
  );
  return apiSuccess(res, updated.clientPreferences || {});
};

// - Upload Avatar (file multipart or URL body for compat)
export const uploadAvatar = async (req, res) => {
  const requestedUserId = String(req.body?.userId || "").trim();
  const userId = requestedUserId || req.user.id;
  if (!userId) {
    return apiError(res, "userId is required.", 400);
  }

  const isSelf = String(req.user.id) === String(userId);
  if (!isSelf && req.user.isAdmin !== true) {
    return apiError(res, "Forbidden.", 403);
  }

  let nextAvatarUrl = "";

  if (req.file) {
    if (!isAllowedAvatarMime(req.file.mimetype)) {
      return apiError(
        res,
        "Avatar must be a JPEG, PNG, WebP, or GIF image.",
        400,
      );
    }
    const maxBytes = getAvatarMaxBytes();
    if (req.file.size > maxBytes) {
      return apiError(res, "Avatar must be 2MB or smaller.", 413);
    }
    const uploaded = await uploadBuffer({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      originalName: req.file.originalname,
      scope: "avatars",
    });
    nextAvatarUrl = String(uploaded?.url || "").trim();
    if (!nextAvatarUrl) {
      return apiError(res, "Upload did not return a URL.", 500);
    }
  } else {
    nextAvatarUrl = String(req.body?.avatarUrl || "").trim();
    if (!nextAvatarUrl) {
      return apiError(res, "file or avatarUrl is required.", 400);
    }
    if (nextAvatarUrl.length > 1000) {
      return apiError(res, "avatarUrl exceeds maximum length.", 400);
    }
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { avatarUrl: nextAvatarUrl },
    { new: true, runValidators: true },
  );

  if (!user) {
    return apiError(res, "User not found.", 404);
  }

  return apiSuccess(res, sanitizeUser(user));
};
