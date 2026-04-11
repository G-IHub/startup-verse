import { signAuthToken } from "../config/jwt.js";
import { success as apiSuccess } from "./apiResponse.js";
import { sanitizeUser } from "./sanitize.js";

export const sendTokenResponse = (user, statusCode, res, message = null) => {
  const token = signAuthToken({
    userId: user._id.toString(),
    role: user.role,
    isAdmin: user.isAdmin,
  });

  return apiSuccess(res, { user: sanitizeUser(user), token }, statusCode, message);
};
