export function success(res, data, status = 200, message = null) {
  const payload = {
    success: true,
    data,
  };
  if (message) payload.message = message;
  return res.status(status).json(payload);
}

export function error(res, message, status = 500, errors, code) {
  const payload = {
    success: false,
    message,
  };

  if (Array.isArray(errors) && errors.length > 0) {
    payload.errors = errors;
  }

  // Optional machine-readable error code. Stable across releases so clients
  // can branch on `payload.code` (e.g. "NOT_A_REGISTERED_USER") instead of
  // brittle message string matching.
  if (typeof code === "string" && code.length > 0) {
    payload.code = code;
  }

  if (res.req?.id) {
    payload.requestId = res.req.id;
  }

  return res.status(status).json(payload);
}

