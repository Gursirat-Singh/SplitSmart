import type { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [ip: string]: {
    count: number;
    resetTime: number;
  };
}

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
  const store: RateLimitStore = {};

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

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests, please try again later.',
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Too many login or registration attempts. Please try again after 15 minutes.',
});

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many file upload requests. Please try again after 15 minutes.',
});


