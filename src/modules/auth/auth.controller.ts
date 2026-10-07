import * as service from "./auth.service.js";
import type { NextFunction, Request, Response } from 'express';
import type { RefreshInput, SignInInput, SignUpInput } from './auth.schema.js';

function validatedBody<T>(req: Request): T {
  return (req.validated as { body: T }).body;
}

export async function signUp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(201).json({ data: await service.signUp(validatedBody<SignUpInput['body']>(req)) });
  } catch (error) {
    next(error);
  }
}

export async function signIn(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ data: await service.signIn(validatedBody<SignInInput['body']>(req)) });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ data: await service.refresh(validatedBody<RefreshInput['body']>(req)) });
  } catch (error) {
    next(error);
  }
}
