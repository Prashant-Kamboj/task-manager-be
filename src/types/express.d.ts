import type { AuthenticatedUser } from './shared.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      validated?: unknown;
    }
  }
}

export {};
