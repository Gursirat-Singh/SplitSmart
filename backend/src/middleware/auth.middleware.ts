import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError } from '../utils/errors';
import type { AuthPayload } from '../types';

/**
 * Express middleware that verifies a JWT from the `Authorization` header.
 *
 * Expected format: `Authorization: Bearer <token>`
 *
 * On success the decoded {@link AuthPayload} is attached to `req.user`.
 * On failure an {@link UnauthorizedError} is forwarded to the error handler.
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or malformed authorization header');
    }

    const token = header.slice(7);

    const decoded = jwt.verify(token, config.JWT_SECRET) as AuthPayload;

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      next(err);
      return;
    }
    next(new UnauthorizedError('Invalid or expired token'));
  }
};
