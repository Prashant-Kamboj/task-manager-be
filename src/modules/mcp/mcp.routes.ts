import { Router } from "express";
import * as controller from "./mcp.controller.js";
import { authenticateMcpRequest } from "./mcp.auth.js";
import { handleMcpRequest } from "./mcp.server.js";

export const mcpRouter = Router();
export const mcpDiscoveryRouter = Router();

// OAuth discovery is defined at the origin's .well-known path. For a resource
// hosted at /mcp, RFC 9728 clients request this path with the resource suffix.
mcpDiscoveryRouter.get(
  "/.well-known/oauth-protected-resource/mcp",
  controller.protectedResourceMetadata
);
mcpDiscoveryRouter.get(
  "/.well-known/oauth-authorization-server/mcp",
  controller.authorizationServerMetadata
);

// Compatibility aliases for clients that discover metadata at the origin root.
mcpDiscoveryRouter.get(
  "/.well-known/oauth-protected-resource",
  controller.protectedResourceMetadata
);
mcpDiscoveryRouter.get(
  "/.well-known/oauth-authorization-server",
  controller.authorizationServerMetadata
);

mcpRouter.post('/', async (req, res, next) => {
  try {
    const principal = await authenticateMcpRequest(req);
    await handleMcpRequest(req, res, req.body, principal.id);
  } catch (error) { next(error); }
});

// OAuth protected-resource metadata. This tells MCP clients where to find the
// authorization server. The authorization endpoints are intentionally kept
// configurable until the hosted OAuth broker is connected.
mcpRouter.get("/.well-known/oauth-protected-resource", controller.protectedResourceMetadata);
mcpRouter.get("/.well-known/oauth-authorization-server", controller.authorizationServerMetadata);
mcpRouter.get("/oauth/authorize", controller.authorize);
mcpRouter.post("/oauth/approve", controller.approve);
mcpRouter.post("/oauth/token", controller.token);
