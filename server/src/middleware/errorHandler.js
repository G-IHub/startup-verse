export default function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;

  const response = {
    success: false,
    message: err.message || "Internal Server Error",
  };

  if (err.name === "ValidationError") {
    response.message = "Validation failed";
    response.errors = Object.values(err.errors || {}).map((item) => item.message);
  }

  if (err.code === 11000) {
    response.message = "Duplicate value error";
    response.fields = Object.keys(err.keyPattern || {});
  }

  if (err.name === "CastError") {
    response.message = `Invalid value for ${err.path}`;
  }

  if (process.env.NODE_ENV !== "production") {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}
