import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../utils/AppError.js';

export function validate(schema: ZodType): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body ?? {},
      params: req.params ?? {},
      query: req.query ?? {},
    });
    if (!result.success) {
      next(new AppError(400, 'Invalid request', result.error.flatten()));
      return;
    }

    req.validated = result.data;
    next();
  };
}
