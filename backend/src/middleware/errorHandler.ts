import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { getLogger } from '../utils/logger';

const logger = getLogger('error-handler');

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    name: err.name,
  });

  // Handle known application errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.errorCode,
      message: err.message,
      details: err.details || [],
    });
    return;
  }

  // Handle PostgreSQL errors
  if (err.message && err.message.includes('unique constraint')) {
    res.status(409).json({
      success: false,
      error: 'ConflictError',
      message: 'Resource already exists',
      details: [],
    });
    return;
  }

  // Generic server error
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(500).json({
    success: false,
    error: 'InternalServerError',
    message: isDevelopment ? err.message : 'An unexpected error occurred',
    details: [],
    ...(isDevelopment && { stack: err.stack }),
  });
}
