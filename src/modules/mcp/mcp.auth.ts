import type { Request } from "express";
import { supabase } from "../../config/supabase.js";
import { AppError } from "../../utils/AppError.js";

export interface McpPrincipal {
  id: string;
  email?: string;
}

export function bearerTokenFrom(request: Pick<Request, "get">): string {
  const [scheme, token] = (request.get("authorization") ?? "").split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new AppError(401, "A Bearer token is required");
  }
  return token;
}

/** Validate the caller's Supabase access token and return its user identity. */
export async function authenticateMcpRequest(
  request: Pick<Request, "get">
): Promise<McpPrincipal> {
  const token = bearerTokenFrom(request);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new AppError(401, "Invalid or expired access token");
  }

  return { id: user.id, email: user.email };
}
