import { error as apiError } from "../utils/apiResponse.js";

export default function requireSelfOrAdmin(paramName = "userId") {
  return function enforceSelfOrAdmin(req, res, next) {
    if (!req.user) {
      return apiError(res, "Unauthorized. Authentication is required.", 401);
    }

    const targetId = String(req.params?.[paramName] || "").trim();
    if (!targetId) {
      return apiError(res, `Missing required route param: ${paramName}.`, 400);
    }

    if (req.user.isAdmin === true || String(req.user.id) === targetId) {
      return next();
    }

    return apiError(res, "Forbidden. You can only access your own resources.", 403);
  };
}
