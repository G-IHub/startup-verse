import { error as apiError } from "../utils/apiResponse.js";

function normalizeErrors(result) {
  if (!result) {
    return [];
  }

  if (typeof result === "string") {
    return [result];
  }

  if (Array.isArray(result)) {
    return result.filter(Boolean).map((item) => String(item));
  }

  if (Array.isArray(result.errors)) {
    return result.errors.filter(Boolean).map((item) => String(item));
  }

  return [];
}

export default function validateRequest(validator) {
  if (typeof validator !== "function") {
    throw new Error("validateRequest requires a validator function.");
  }

  return async function validationMiddleware(req, res, next) {
    try {
      const result = await validator({
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers,
        user: req.user || null,
      });

      const errors = normalizeErrors(result);
      if (errors.length > 0) {
        return apiError(res, "Validation failed.", 422, errors);
      }

      if (result && typeof result === "object" && result.value) {
        if (result.value.body) {
          req.body = result.value.body;
        }
        if (result.value.query) {
          req.query = result.value.query;
        }
        if (result.value.params) {
          req.params = result.value.params;
        }
      }

      return next();
    } catch (validationError) {
      return apiError(res, "Validation failed.", 422, [
        validationError instanceof Error
          ? validationError.message
          : "Unknown validation error.",
      ]);
    }
  };
}
