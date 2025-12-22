/**
 * Error Handling Middleware
 * Catches all errors and returns standardized responses
 */

import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../../lib/api-error.js';
import { errorResponse, HttpStatus, ErrorCode } from '../../lib/api-response.js';
import { env } from '../../config/env.js';

/**
 * 404 Not Found Handler
 * Catches requests that don't match any route
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound(`Route ${req.method} ${req.path}`));
}

/**
 * Global Error Handler
 * Catches all errors and sends appropriate response
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Log error for debugging
  if (env.NODE_ENV === 'development') {
    console.error('🔴 Error:', err);
  } else {
    // In production, log only non-operational errors (bugs)
    if (!(err instanceof ApiError) || !err.isOperational) {
      console.error('🔴 Unexpected Error:', err);
    }
  }

  // Handle known API errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json(
      errorResponse(err.code, err.message, err.details)
    );
  }

  // Handle Zod validation errors (shouldn't reach here if validate middleware is used)
  if (err.name === 'ZodError') {
    return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json(
      errorResponse(ErrorCode.VALIDATION_ERROR, 'Validation failed', err)
    );
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(HttpStatus.BAD_REQUEST).json(
      errorResponse(ErrorCode.INVALID_INPUT, 'Invalid JSON in request body')
    );
  }

  // Default to internal server error
  const message = env.NODE_ENV === 'development' 
    ? err.message 
    : 'An unexpected error occurred';

  return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
    errorResponse(ErrorCode.INTERNAL_ERROR, message)
  );
}

/**
 * Request logger middleware (optional, for debugging)
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusIcon = status >= 400 ? '🔴' : status >= 300 ? '🟡' : '🟢';
    
    console.log(
      `${statusIcon} ${req.method} ${req.path} ${status} ${duration}ms`
    );
  });
  
  next();
}

