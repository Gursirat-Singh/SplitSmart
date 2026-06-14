import type { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [ip: string]: {
    count: number;
    resetTime: number;
  };
}

const stores: { [windowMs: number]: RateLimitStore } = {};

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message: string;
}

/**
 * A lightweight, in-memory rate limiter middleware.
 * Tracks requests by IP address.
 */
export const rateLimit = (options: RateLimitOptions) => {
  const { windowMs, max, message } = options;
  
  if (!stores[windowMs]) {
    stores[windowMs] = {};
  }
  const store = stores[windowMs]!;

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    if (!store[ip] || now > store[ip].resetTime) {
      store[ip] = {
        count: 1,
        resetTime: now + windowMs,
      };
      next();
      return;
    }

    store[ip].count++;

    if (store[ip].count > max) {
      res.status(429).json({
        success: false,
        message,
      });
      return;
    }

    next();
  };
};
