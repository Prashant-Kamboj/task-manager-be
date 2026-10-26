import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { supabase, supabaseAuth } from "../../config/supabase.js";
import { env } from "../../config/env.js";
import { redis } from "../../config/redis.js";
import { AppError } from "../../utils/AppError.js";

interface PendingCode {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  supabaseUserId: string;
  refreshToken: string;
  scope: string;
}
interface StoredRefresh {
  clientId: string;
  refreshToken: string;
  scope: string;
}
const codeKey = (code: string) => `task-manager:mcp:authorization-code:${code}`;
const refreshKey = (token: string) => `task-manager:mcp:refresh-token:${token}`;
const secret = () => randomBytes(32).toString("base64url");

export async function verifySupabaseSession(
  accessToken: string,
  refreshToken: string
) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);
  if (error || !user)
    throw new AppError(401, "Invalid or expired Supabase access token");
  return { userId: user.id, refreshToken };
}

export async function createAuthorizationCode(
  input: PendingCode
): Promise<string> {
  const code = secret();
  await redis.setJson(codeKey(code), input, 60);
  return code;
}

export async function consumeAuthorizationCode(
  code: string,
  verifier: string,
  clientId: string,
  redirectUri: string
): Promise<PendingCode> {
  const pending = await redis.getAndDeleteJson<PendingCode>(codeKey(code));
  if (
    !pending ||
    pending.clientId !== clientId ||
    pending.redirectUri !== redirectUri ||
    clientId !== env.MCP_CLIENT_ID ||
    redirectUri !== env.MCP_REDIRECT_URI
  )
    throw new AppError(400, "Invalid or expired authorization code");
  const expected = createHash("sha256").update(verifier).digest("base64url");
  if (
    expected.length !== pending.codeChallenge.length ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(pending.codeChallenge))
  )
    throw new AppError(400, "Invalid PKCE verifier");
  return pending;
}

export async function exchangeAuthorizationCode(
  pending: PendingCode,
  clientId: string
) {
  const { data, error } = await supabaseAuth.auth.refreshSession({
    refresh_token: pending.refreshToken,
  });
  if (error || !data.session)
    throw new AppError(401, "Could not create Supabase session");
  const refreshToken = await saveRefreshToken(
    clientId,
    data.session.refresh_token,
    pending.scope
  );
  return {
    access_token: data.session.access_token,
    refresh_token: refreshToken,
    expires_in: data.session.expires_in,
    scope: pending.scope,
  };
}

export async function saveRefreshToken(
  clientId: string,
  refreshToken: string,
  scope: string
): Promise<string> {
  const publicToken = secret();
  await redis.setJson(
    refreshKey(publicToken),
    { clientId, refreshToken, scope },
    30 * 24 * 60 * 60
  );
  return publicToken;
}

export async function refreshMcpSession(publicToken: string, clientId: string) {
  const stored = await redis.getAndDeleteJson<StoredRefresh>(
    refreshKey(publicToken)
  );
  if (!stored || stored.clientId !== clientId)
    throw new AppError(400, "Invalid or expired refresh token");
  const { data, error } = await supabaseAuth.auth.refreshSession({
    refresh_token: stored.refreshToken,
  });
  if (error || !data.session)
    throw new AppError(401, "Supabase refresh token is invalid or expired");
  const nextRefresh = await saveRefreshToken(
    clientId,
    data.session.refresh_token,
    stored.scope
  );
  return {
    access_token: data.session.access_token,
    refresh_token: nextRefresh,
    expires_in: data.session.expires_in,
    scope: stored.scope,
  };
}
