class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

function errorHandler(error, _req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode =
    Number.isInteger(error.statusCode) && error.statusCode >= 400
      ? error.statusCode
      : 500;
  const message = statusCode === 500 ? 'Internal Server Error' : error.message;

  return res.status(statusCode).json({ error: { message } });
}

module.exports = { AppError, errorHandler };
