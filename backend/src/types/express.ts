import type { AuthPayload } from './index';

declare global {
  namespace Express {
    /** Augmented Express Request with an optional authenticated user. */
    interface Request {
      /** Set by the auth middleware after successful JWT verification. */
      user?: AuthPayload;
    }
  }
}

export {};
