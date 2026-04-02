import { error as apiError } from "../utils/apiResponse.js";

export default function notFound(req, res) {
  return apiError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}

