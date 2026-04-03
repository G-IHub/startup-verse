export function success(res, data, status = 200) {
  return res.status(status).json({
    success: true,
    data,
  });
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

