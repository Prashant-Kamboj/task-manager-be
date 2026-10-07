import { supabase } from '../config/supabase.js';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError.js';

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const [scheme, token] = (req.get('authorization') ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) throw new AppError(401, 'A Bearer token is required');

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) throw new AppError(401, 'Invalid or expired access token');

    req.user = { id: user.id, email: user.email };
    next();
  } catch (error) {
    next(error);
  }
}
