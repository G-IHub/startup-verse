import { error as apiError } from "../utils/apiResponse.js";
import { verifyAuthToken } from "../config/jwt.js";

function extractBearerToken(authorizationHeader) {
  if (typeof authorizationHeader !== "string") {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

export default function requireAuth(req, res, next) {
  // Try to get token from HttpOnly cookie first (preferred - XSS safe)
  // Then fall back to Authorization header (for API clients, mobile apps)
  const token = req.cookies?.token || extractBearerToken(req.get("authorization"));

  if (!token) {
    return apiError(
      res,
      "Unauthorized. Authentication required.",
      401,
      ["Missing or invalid authentication token."],
    );
  }

  try {
    const payload = verifyAuthToken(token);
    const userId = payload?.userId;
    const role = payload?.role;
    const isAdmin = payload?.isAdmin;

    if (!userId || !role || typeof isAdmin !== "boolean") {
      return apiError(
        res,
        "Unauthorized. Token payload is invalid.",
        401,
        ["Token must include userId, role, and isAdmin."],
      );
    }

    req.user = {
      id: String(userId),
      role: String(role),
      isAdmin,
    };

    return next();
  } catch (tokenError) {
    return apiError(
      res,
      "Unauthorized. Invalid or expired token.",
      401,
      [tokenError instanceof Error ? tokenError.message : "JWT verification failed."],
    );
  }
}

