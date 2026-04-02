import { error as apiError } from "../utils/apiResponse.js";

export default function requireRole(...allowedRoles) {
  const normalizedAllowedRoles = allowedRoles
    .map((role) => String(role).trim().toLowerCase())
    .filter(Boolean);

  if (normalizedAllowedRoles.length === 0) {
    throw new Error("requireRole requires at least one role.");
  }

  return function enforceRole(req, res, next) {
    if (!req.user) {
      return apiError(res, "Unauthorized. Authentication is required.", 401);
    }

    const userRole = String(req.user.role || "").toLowerCase();
    const userIsAdmin = req.user.isAdmin === true || userRole === "admin";

    if (userIsAdmin) {
      return next();
    }

    if (!normalizedAllowedRoles.includes(userRole)) {
      return apiError(
        res,
        "Forbidden. You do not have permission for this resource.",
        403,
      );
    }

    return next();
  };
}

