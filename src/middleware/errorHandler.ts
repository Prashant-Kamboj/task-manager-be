import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError.js';

export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(404, `Route ${req.method} ${req.originalUrl} was not found`));
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const status = error instanceof AppError ? error.statusCode : 500;
  if (status === 500) console.error(error);
  const message = error instanceof Error ? error.message : 'Internal server error';
  const details = error instanceof AppError ? error.details : undefined;
  res.status(status).json({ error: { message, details } });
}
