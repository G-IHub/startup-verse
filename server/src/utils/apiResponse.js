export function success(res, data, status = 200, message = null) {
  const payload = {
    success: true,
    data,
  };
  if (message) payload.message = message;
  return res.status(status).json(payload);
}

export function error(res, message, status = 500, errors) {
  const payload = {
    success: false,
    message,
  };

  if (Array.isArray(errors) && errors.length > 0) {
    payload.errors = errors;
  }

  if (res.req?.id) {
    payload.requestId = res.req.id;
  }

  return res.status(status).json(payload);
}

