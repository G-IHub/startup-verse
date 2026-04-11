import User from "../models/User.js";
import {
  error as apiError,
  success as apiSuccess,
} from "../utils/apiResponse.js";
import { sendTokenResponse } from "../utils/sendToken.js";
import { sanitizeUser } from "../utils/sanitize.js";

// - Handle user registration
export const signup = async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return apiError(res, "All fields are required", 400);
  }

  const existing = await User.findOne({ email: String(email).toLowerCase() });
  if (existing) {
    return apiError(res, "Account already exists.", 409);
  }
  
  const allowedSignupRoles = new Set([
    "founder",
    "talent",
    "team-member",
    "organization-admin",
  ]);
  const requestedRole = String(req.body?.role || "founder").toLowerCase();
  const role = allowedSignupRoles.has(requestedRole) ? requestedRole : "founder";

  const user = await User.create({
    name: String(name).trim(),
    email: String(email).toLowerCase().trim(),
    password: String(password),
    role,
    isAdmin: false,
  });

  return sendTokenResponse(user, 201, res, "Registration successful");
};
 
// - Handle user login
export const signin = async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return apiError(res, "email and password are required.", 400);
  }

  const user = await User.findOne({
    email: String(email).toLowerCase().trim(),
  }).select("+password");

  if (!user) {
    return apiError(res, "Invalid credentials.", 401);
  }

  const matched = await user.comparePassword(String(password));
  if (!matched) {
    return apiError(res, "Invalid credentials.", 401);
  }

  return sendTokenResponse(user, 200, res, "Login successful");
};

// - Update authenticated user's profile
export const updateProfile = async (req, res) => {
  const { userId } = req.params;
  const isSelf = req.user.id === userId;

  if (!isSelf && req.user.isAdmin !== true) {
    return apiError(res, "Forbidden.", 403);
  }

  const allowed = [
    "name",
    "role",
    "profile",
    "onboardingComplete",
    "avatarUrl",
  ];
  const updates = {};

  allowed.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) {
      updates[field] = req.body[field];
    }
  });

  const updated = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  });

  if (!updated) {
    return apiError(res, "User not found.", 404);
  }

  return apiSuccess(res, sanitizeUser(updated));
};

// - Get authenticated user's account details
export const getAccount = async (req, res) => {
  const { userId } = req.params;
  const isSelf = req.user.id === userId;

  if (!isSelf && req.user.isAdmin !== true) {
    return apiError(res, "Forbidden.", 403);
  }

  const user = await User.findById(userId);
  if (!user) {
    return apiError(res, "User not found.", 404);
  }

  return apiSuccess(res, sanitizeUser(user));
};

// - Delete authenticated user's account
export const deleteAccount = async (req, res) => {
  const { userId } = req.params;
  const isSelf = req.user.id === userId;

  if (!isSelf && req.user.isAdmin !== true) {
    return apiError(res, "Forbidden.", 403);
  }

  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    return apiError(res, "User not found.", 404);
  }

  return apiSuccess(res, { deleted: true, userId }, 200, "Account deleted.");
};
