import type { Request, Response, NextFunction } from 'express';
/**
 * Express middleware that verifies a JWT from the `Authorization` header.
 *
 * Expected format: `Authorization: Bearer <token>`
 *
 * On success the decoded {@link AuthPayload} is attached to `req.user`.
 * On failure an {@link UnauthorizedError} is forwarded to the error handler.
 */
export declare const authenticate: (req: Request, _res: Response, next: NextFunction) => void;
