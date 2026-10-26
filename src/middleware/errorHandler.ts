import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(404, `Route ${req.method} ${req.originalUrl} was not found`));
}

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction): void {
  const status = error instanceof AppError ? error.statusCode : 500;
  if (status === 500) console.error(error);
  const message = error instanceof Error ? error.message : 'Internal server error';
  const details = error instanceof AppError ? error.details : undefined;
  if (status === 401 && req.path === '/mcp') {
    const resourceUrl = new URL(env.MCP_RESOURCE_URL);
    const metadataUrl = new URL(
      `/.well-known/oauth-protected-resource${resourceUrl.pathname}`,
      resourceUrl.origin
    );
    res.set('WWW-Authenticate', `Bearer resource_metadata="${metadataUrl}"`);
  }
  res.status(status).json({ error: { message, details } });
}
