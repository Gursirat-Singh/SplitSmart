import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError, ValidationError } from '../utils/errors';
import { config } from '../config';

/**
 * Derives a user-friendly message from a Prisma known-request error.
 */
function handlePrismaError(err: Prisma.PrismaClientKnownRequestError): AppError {
  switch (err.code) {
    case 'P2002': {
      const target = (err.meta?.target as string[])?.join(', ') ?? 'field';
      return new AppError(`A record with that ${target} already exists.`, 409);
    }
    case 'P2025':
      return new AppError('The requested record was not found.', 404);
    default:
      return new AppError('A database error occurred.', 500);
  }
}

/**
 * Global Express error-handling middleware.
 *
 * - Recognises {@link AppError} instances and returns their status code.
 * - Translates Prisma `PrismaClientKnownRequestError` codes (P2002, P2025)
 *   into appropriate HTTP responses.
 * - Falls back to 500 for unknown / unexpected errors.
 * - Includes the stack trace in the response body when `NODE_ENV` is `development`.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // ── Prisma known-request errors ────────────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const appError = handlePrismaError(err);
    res.status(appError.statusCode).json({
      success: false,
      message: appError.message,
      ...(config.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  // ── Application errors ─────────────────────────────────────────────
  if (err instanceof AppError) {
    const body: Record<string, unknown> = {
      success: false,
      message: err.message,
    };

    if (err instanceof ValidationError && err.errors) {
      body.errors = err.errors;
    }

    if (config.NODE_ENV === 'development') {
      body.stack = err.stack;
    }

    res.status(err.statusCode).json(body);
    return;
  }

  // ── Unknown / unexpected errors ────────────────────────────────────
  console.error('[UnhandledError]', err);

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(config.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
