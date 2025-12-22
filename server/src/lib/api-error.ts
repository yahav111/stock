/**
 * Custom API Error Class
 * Provides structured error handling with HTTP status codes
 */

import { ErrorCode, HttpStatus } from './api-response.js';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: unknown,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;

    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  // Factory methods for common errors
  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError(
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR,
      message,
      details
    );
  }

  static unauthorized(message = 'Authentication required'): ApiError {
    return new ApiError(
      HttpStatus.UNAUTHORIZED,
      ErrorCode.UNAUTHORIZED,
      message
    );
  }

  static forbidden(message = 'Access denied'): ApiError {
    return new ApiError(
      HttpStatus.FORBIDDEN,
      ErrorCode.FORBIDDEN,
      message
    );
  }

  static notFound(resource = 'Resource'): ApiError {
    return new ApiError(
      HttpStatus.NOT_FOUND,
      ErrorCode.NOT_FOUND,
      `${resource} not found`
    );
  }

  static conflict(message: string): ApiError {
    return new ApiError(
      HttpStatus.CONFLICT,
      ErrorCode.ALREADY_EXISTS,
      message
    );
  }

  static rateLimited(message = 'Too many requests, please try again later'): ApiError {
    return new ApiError(
      HttpStatus.TOO_MANY_REQUESTS,
      ErrorCode.RATE_LIMITED,
      message
    );
  }

  static internal(message = 'Internal server error'): ApiError {
    return new ApiError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.INTERNAL_ERROR,
      message,
      undefined,
      false // Not operational - indicates a bug
    );
  }

  static externalApi(service: string, message?: string): ApiError {
    return new ApiError(
      HttpStatus.SERVICE_UNAVAILABLE,
      ErrorCode.EXTERNAL_API_ERROR,
      message || `Failed to fetch data from ${service}`
    );
  }

  static validation(errors: unknown): ApiError {
    return new ApiError(
      HttpStatus.UNPROCESSABLE_ENTITY,
      ErrorCode.VALIDATION_ERROR,
      'Validation failed',
      errors
    );
  }

  static invalidCredentials(): ApiError {
    return new ApiError(
      HttpStatus.UNAUTHORIZED,
      ErrorCode.INVALID_CREDENTIALS,
      'Invalid email or password'
    );
  }
}

