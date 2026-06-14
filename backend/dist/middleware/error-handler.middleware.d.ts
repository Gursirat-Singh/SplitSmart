import type { Request, Response, NextFunction } from 'express';
/**
 * Global Express error-handling middleware.
 *
 * - Recognises {@link AppError} instances and returns their status code.
 * - Translates Prisma `PrismaClientKnownRequestError` codes (P2002, P2025)
 *   into appropriate HTTP responses.
 * - Falls back to 500 for unknown / unexpected errors.
 * - Includes the stack trace in the response body when `NODE_ENV` is `development`.
 */
export declare const errorHandler: (err: Error, _req: Request, res: Response, _next: NextFunction) => void;
