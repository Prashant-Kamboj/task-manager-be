import { supabase, supabaseAuth } from "../../config/supabase.js";
import { AppError } from "../../utils/AppError.js";
import type { Session } from "@supabase/supabase-js";
import type { RefreshInput, SignInInput, SignUpInput } from "./auth.schema.js";

interface SessionResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt?: number;
  tokenType: string;
  user: { id: string; email?: string };
}

function sessionResponse(session: Session): SessionResponse {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresIn: session.expires_in,
    expiresAt: session.expires_at,
    tokenType: session.token_type,
    user: { id: session.user.id, email: session.user.email },
  };
}

export async function signUp({
  email,
  password,
  fullName,
}: SignUpInput["body"]) {
  const { data, error } = await supabaseAuth.auth.signUp({
    email,
    password,
    options: { data: fullName ? { full_name: fullName } : undefined },
  });
  if (error) throw new AppError(400, error.message);

  let profile = null;
  if (data.user) {
    const { data: savedProfile, error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: data.user.id,
          email: data.user.email ?? email,
          full_name: fullName ?? null,
        },
        { onConflict: "id" },
      )
      .select("id, email, full_name, avatar_url, created_at")
      .single();

    if (profileError) {
      throw new AppError(500, "Account created but profile could not be created");
    }
    profile = savedProfile;
  }

  return {
    user: data.user ? { id: data.user.id, email: data.user.email } : null,
    profile,
    // When email confirmation is enabled, Supabase deliberately returns no session yet.
    session: data.session ? sessionResponse(data.session) : null,
    requiresEmailConfirmation: !data.session,
  };
}

export async function signIn({
  email,
  password,
}: SignInInput["body"]): Promise<SessionResponse> {
  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.session)
    throw new AppError(401, "Invalid email or password");
  return sessionResponse(data.session);
}

export async function refresh({
  refreshToken,
}: RefreshInput["body"]): Promise<SessionResponse> {
  const { data, error } = await supabaseAuth.auth.refreshSession({
    refresh_token: refreshToken,
  });
  if (error || !data.session)
    throw new AppError(401, "Invalid or expired refresh token");
  // Refresh tokens rotate: the client must replace both tokens with this response.
  return sessionResponse(data.session);
}
