/**
 * Base application error with an HTTP status code.
 *
 * All operational errors thrown intentionally should extend this class
 * so the global error handler can distinguish them from programming bugs.
 */
export class AppError extends Error {
  /** HTTP status code to send in the response. */
  public readonly statusCode: number;

  /** `true` when the error is expected / operational, `false` for programming bugs. */
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 — The requested resource could not be found.
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * 400 — The request payload failed validation.
 */
export class ValidationError extends AppError {
  /** Optional structured validation error details. */
  public readonly errors?: Record<string, string[]>;

  constructor(message = 'Validation failed', errors?: Record<string, string[]>) {
    super(message, 400);
    this.errors = errors;
  }
}

/**
 * 401 — Authentication is required or has failed.
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

/**
 * 403 — The authenticated user lacks permission for this action.
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}
