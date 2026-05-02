import { signAuthToken } from "../config/jwt.js";
import { success as apiSuccess } from "./apiResponse.js";
import { sanitizeUser } from "./sanitize.js";

const isProduction = process.env.NODE_ENV === "production";

export const sendTokenResponse = (user, statusCode, res, message = null) => {
  const token = signAuthToken({
    userId: user._id.toString(),
    role: user.role,
    isAdmin: user.isAdmin,
  });

  // Set JWT as HttpOnly cookie - XSS protection
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Return user only (token is in cookie)
  return apiSuccess(res, { user: sanitizeUser(user) }, statusCode, message);
};
