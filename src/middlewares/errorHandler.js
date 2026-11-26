class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

function resolveStatusAndMessage(error) {
  if (Number.isInteger(error.statusCode) && error.statusCode >= 400) {
    return {
      statusCode: error.statusCode,
      message: error.statusCode === 500 ? 'Internal Server Error' : error.message,
    };
  }

  if (error.type === 'entity.parse.failed' || error.status === 400) {
    return {
      statusCode: 400,
      message: 'El cuerpo de la petición no contiene JSON válido',
    };
  }

  if (
    error.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
    error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY' ||
    error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' ||
    error.code === 'SQLITE_CONSTRAINT_TRIGGER'
  ) {
    return {
      statusCode: 409,
      message: 'Conflicto de integridad en la base de datos',
    };
  }

  if (error.code === 'SQLITE_CONSTRAINT_CHECK' || error.code === 'SQLITE_CONSTRAINT_NOTNULL') {
    return {
      statusCode: 400,
      message: 'Los datos enviados no cumplen las restricciones requeridas',
    };
  }

  return { statusCode: 500, message: 'Internal Server Error' };
}

function errorHandler(error, _req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const { statusCode, message } = resolveStatusAndMessage(error);
  return res.status(statusCode).json({ error: { message } });
}

module.exports = { AppError, errorHandler };
