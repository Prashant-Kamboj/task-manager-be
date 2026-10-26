import { McpServer } from "@modelcontextprotocol/server";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import { z } from "zod";
import { listWorkspaces } from "../workspaces/workspaces.service.js";

export function createTaskManagerMcpServer(actorId: string) {
  const server = new McpServer({ name: "task-manager", version: "1.0.0" });

  server.registerTool(
    "list_workspaces",
    {
      description: "List the workspaces the authenticated user belongs to.",
      inputSchema: z.object({}),
    },
    async () => {
      // actorId is the authenticated user's ID, which is passed when creating the server
      const workspaces = await listWorkspaces({ actorId });
      return {
        content: [{ type: "text", text: JSON.stringify(workspaces) }],
        structuredContent: { workspaces },
      };
    }
  );

  return server;
}

export async function handleMcpRequest(
  req: Parameters<NodeStreamableHTTPServerTransport["handleRequest"]>[0],
  res: Parameters<NodeStreamableHTTPServerTransport["handleRequest"]>[1],
  body: unknown,
  actorId: string
) {
  const server = createTaskManagerMcpServer(actorId);
  const transport = new NodeStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, body);
}
