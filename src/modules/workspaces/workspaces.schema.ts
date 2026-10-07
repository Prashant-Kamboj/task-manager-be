import { z } from "zod";

const uuid = z.string().uuid();
const name = z.string().trim().min(1).max(120);
const memberRole = z.enum(["admin", "member"]);

export const createWorkspaceSchema = z.object({
  body: z.object({ name }),
  params: z.object({}),
  query: z.object({}),
});
export const updateWorkspaceSchema = z.object({
  body: z.object({ name }),
  params: z.object({ workspaceId: uuid }),
  query: z.object({}),
});
export const workspaceParamsSchema = z.object({
  body: z.object({}),
  params: z.object({ workspaceId: uuid }),
  query: z.object({}),
});

export const addWorkspaceMemberSchema = z.object({
  body: z.object({ userId: uuid, role: memberRole.default("member") }),
  params: z.object({ workspaceId: uuid }),
  query: z.object({}),
});

export const workspaceMemberParamsSchema = z.object({
  body: z.object({}),
  params: z.object({ workspaceId: uuid, memberId: uuid }),
  query: z.object({}),
});

export const updateWorkspaceMemberSchema = z.object({
  body: z.object({ role: memberRole }),
  params: z.object({ workspaceId: uuid, memberId: uuid }),
  query: z.object({}),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type WorkspaceParamsInput = z.infer<typeof workspaceParamsSchema>;
export type AddWorkspaceMemberInput = z.infer<typeof addWorkspaceMemberSchema>;
export type WorkspaceMemberParamsInput = z.infer<typeof workspaceMemberParamsSchema>;
export type UpdateWorkspaceMemberInput = z.infer<typeof updateWorkspaceMemberSchema>;
