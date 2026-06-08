import User from "../models/User.js";
import { OAuth2Client } from "google-auth-library";
import {
  error as apiError,
  success as apiSuccess,
} from "../utils/apiResponse.js";
import { sendTokenResponse } from "../utils/sendToken.js";
import { sanitizeUser } from "../utils/sanitize.js";

const googleClient = new OAuth2Client();
const allowedSignupRoles = new Set([
  "founder",
  "talent",
  "team-member",
  "organization-admin",
]);

function normalizeEmail(value) {
  return String(value || "").toLowerCase().trim();
}

function getGoogleClientId() {
  return String(process.env.GOOGLE_CLIENT_ID || "").trim();
}

async function verifyGoogleCredential(credential) {
  const clientId = getGoogleClientId();
  if (!clientId) {
    const err = new Error("Google sign-in is not configured on this server.");
    err.statusCode = 503;
    throw err;
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: clientId,
  });
  return ticket.getPayload();
}

function addProvider(user, provider) {
  const providers = new Set(Array.isArray(user.authProviders) ? user.authProviders : []);
  providers.add(provider);
  user.authProviders = [...providers];
}

// - Handle user registration
export const signup = async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return apiError(res, "All fields are required", 400);
  }

  const existing = await User.findOne({ email: normalizeEmail(email) });
  if (existing) {
    return apiError(res, "Account already exists.", 409);
  }

  const requestedRole = String(req.body?.role || "founder").toLowerCase();
  const role = allowedSignupRoles.has(requestedRole) ? requestedRole : "founder";

  const user = await User.create({
    name: String(name).trim(),
    email: normalizeEmail(email),
    password: String(password),
    role,
    authProviders: ["local"],
    emailVerified: false,
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
    email: normalizeEmail(email),
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

// - Handle Google Identity Services sign-in / role-selected signup
export const googleAuth = async (req, res) => {
  const credential = String(req.body?.credential || "").trim();
  const requestedRole = String(req.body?.role || "").toLowerCase().trim();

  if (!credential) {
    return apiError(res, "Google credential is required.", 400);
  }

  let payload;
  try {
    payload = await verifyGoogleCredential(credential);
  } catch (error) {
    const status = error?.statusCode || 401;
    return apiError(
      res,
      status === 503
        ? error.message
        : "Google sign-in could not be verified. Please try again.",
      status,
    );
  }

  if (!payload?.sub || !payload?.email) {
    return apiError(res, "Google sign-in response is missing account details.", 401);
  }

  if (payload.email_verified !== true) {
    return apiError(res, "Google account email must be verified before sign-in.", 401);
  }

  const googleId = String(payload.sub).trim();
  const email = normalizeEmail(payload.email);
  const displayName = String(payload.name || email.split("@")[0] || "Google User").trim();
  const picture = String(payload.picture || "").trim();

  let user = await User.findOne({ googleId });
  if (!user) {
    user = await User.findOne({ email });
  }

  if (user) {
    if (user.googleId && user.googleId !== googleId) {
      return apiError(res, "This email is already linked to a different Google account.", 409);
    }

    let changed = false;
    if (!user.googleId) {
      user.googleId = googleId;
      changed = true;
    }
    if (user.emailVerified !== true) {
      user.emailVerified = true;
      changed = true;
    }
    if (picture && !user.avatarUrl) {
      user.avatarUrl = picture;
      changed = true;
    }

    const previousProviders = Array.isArray(user.authProviders)
      ? user.authProviders.join("|")
      : "";
    addProvider(user, "google");
    if ((user.authProviders || []).join("|") !== previousProviders) {
      changed = true;
    }

    if (changed) {
      await user.save();
    }

    return sendTokenResponse(user, 200, res, "Google sign-in successful");
  }

  if (!requestedRole) {
    return apiError(res, "No account exists for this Google email. Please sign up first.", 404);
  }

  if (!allowedSignupRoles.has(requestedRole) || requestedRole === "team-member") {
    return apiError(res, "Invalid role for Google signup.", 400);
  }

  const created = await User.create({
    name: displayName,
    email,
    role: requestedRole,
    googleId,
    authProviders: ["google"],
    emailVerified: true,
    avatarUrl: picture,
    isAdmin: false,
  });

  return sendTokenResponse(created, 201, res, "Google signup successful");
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
    "startupId",
  ];
  const updates = {};

  allowed.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) {
      updates[field] = req.body[field];
    }
  });

  if (Object.prototype.hasOwnProperty.call(req.body || {}, "virtualOfficeTourCompleted")) {
    const v = req.body.virtualOfficeTourCompleted;
    if (v === true) {
      updates.virtualOfficeTourCompleted = true;
    } else if (v === false && req.user?.isAdmin === true) {
      updates.virtualOfficeTourCompleted = false;
    }
  }

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

// - Get current authenticated user (from cookie)
export const getMe = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return apiError(res, "User not found.", 404);
  }

  return apiSuccess(res, sanitizeUser(user));
};

// - Logout (clear cookie)
export const logout = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  });

  return apiSuccess(res, { loggedOut: true }, 200, "Logged out successfully.");
};
