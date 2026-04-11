import { error as apiError } from "./apiResponse.js";

export function notImplemented(res, routeId, details = []) {
  return apiError(res, "Endpoint is not implemented yet.", 501, [
    "code:COMPAT_NOT_IMPLEMENTED",
    `route:${routeId}`,
    ...details,
  ]);
}