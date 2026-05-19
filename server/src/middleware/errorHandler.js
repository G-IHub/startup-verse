import { captureSentryException } from "../config/sentry.js";
import { error as apiError } from "../utils/apiResponse.js";

export default function errorHandler(err, req, res, next) {
  void next;

  let statusCode = err?.statusCode || err?.status || 500;
  let message = err?.message || "Internal Server Error";
  let errors;

  if (err?.name === "ValidationError") {
    statusCode = 422;
    message = "Validation failed.";
    errors = Object.values(err.errors || {}).map((item) => item.message);
  } else if (err?.code === 11000) {
    statusCode = 409;
    message = "Duplicate value error.";
    errors = Object.keys(err.keyPattern || {}).map(
      (field) => `${field} must be unique.`,
    );
  } else if (err?.name === "CastError") {
    statusCode = 400;
    message = `Invalid value for ${err.path}.`;
  }

  if (statusCode >= 500) {
    captureSentryException(err);
  }

  return apiError(res, message, statusCode, errors);
}

