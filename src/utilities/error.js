export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.message = message;
  }
}

export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const globalErrorHandler = (err, req, res, next) => {
  return process.env.MODE === "DEV"
    ? res.status(err.statusCode || 500).json({
        messages: err.message,
        stack: err.stack,
      })
    : res.status(err.statusCode || 500).json({
        messages: err.message,
      });
};
