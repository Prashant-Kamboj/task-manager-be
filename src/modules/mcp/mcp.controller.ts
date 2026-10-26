import type { NextFunction, Request, Response } from "express";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/AppError.js";
import * as service from "./mcp.service.js";

export function protectedResourceMetadata(_req: Request, res: Response): void {
  res.json({
    resource: env.MCP_RESOURCE_URL,
    authorization_servers: [env.MCP_AUTHORIZATION_SERVER_URL],
    scopes_supported: ["tasks:read", "tasks:write"],
    bearer_methods_supported: ["header"],
  });
}

export function authorizationServerMetadata(
  _req: Request,
  res: Response
): void {
  res.json({
    issuer: env.MCP_AUTHORIZATION_SERVER_URL,
    authorization_endpoint: `${env.MCP_AUTHORIZATION_SERVER_URL}/oauth/authorize`,
    token_endpoint: `${env.MCP_AUTHORIZATION_SERVER_URL}/oauth/token`,
    code_challenge_methods_supported: ["S256"],
    grant_types_supported: ["authorization_code", "refresh_token"],
  });
}

export function authorize(req: Request, res: Response): void {
  const query = new URLSearchParams();
  for (const key of [
    "client_id",
    "redirect_uri",
    "response_type",
    "scope",
    "state",
    "code_challenge",
    "code_challenge_method",
  ]) {
    const value = req.query[key];
    if (typeof value === "string") query.set(key, value);
  }
  res.redirect(`${env.MCP_AUTH_UI_URL}?${query.toString()}`);
}

export async function approve(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      clientId,
      redirectUri,
      codeChallenge,
      state,
      scope,
      accessToken,
      refreshToken,
    } = req.body as Record<string, string>;
    if (
      clientId !== env.MCP_CLIENT_ID ||
      redirectUri !== env.MCP_REDIRECT_URI ||
      !codeChallenge ||
      !accessToken ||
      !refreshToken
    ) {
      throw new AppError(400, "Invalid OAuth approval request");
    }
    const session = await service.verifySupabaseSession(
      accessToken,
      refreshToken
    );
    const code = await service.createAuthorizationCode({
      clientId,
      redirectUri,
      codeChallenge,
      supabaseUserId: session.userId,
      refreshToken: session.refreshToken,
      scope: scope || "tasks:read tasks:write",
    });
    const callback = new URL(redirectUri);
    callback.searchParams.set("code", code);
    if (state) callback.searchParams.set("state", state);
    res.json({ redirectUri: callback.toString() });
  } catch (error) {
    next(error);
  }
}

export async function token(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = req.body as Record<string, string>;
    if (body.grant_type === "authorization_code") {
      const pending = await service.consumeAuthorizationCode(
        body.code,
        body.code_verifier,
        body.client_id,
        body.redirect_uri
      );
      res.json({
        token_type: "Bearer",
        ...(await service.exchangeAuthorizationCode(pending, body.client_id)),
      });
      return;
    }
    if (body.grant_type === "refresh_token") {
      res.json({
        token_type: "Bearer",
        ...(await service.refreshMcpSession(
          body.refresh_token,
          body.client_id
        )),
      });
      return;
    }
    throw new AppError(400, "Unsupported grant type");
  } catch (error) {
    next(error);
  }
}
