import { z } from 'zod';

const email = z.string().trim().email().max(254);
const password = z.string().min(8).max(72);
const empty = z.object({});

export const signUpSchema = z.object({
  body: z.object({ email, password, fullName: z.string().trim().min(1).max(100).optional() }),
  params: empty,
  query: empty,
});

export const signInSchema = z.object({
  body: z.object({ email, password }),
  params: empty,
  query: empty,
});

export const refreshSchema = z.object({
  body: z.object({ refreshToken: z.string().min(1) }),
  params: empty,
  query: empty,
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
