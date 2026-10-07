import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./workspaces.controller.js";
import {
  createWorkspaceSchema,
  addWorkspaceMemberSchema,
  updateWorkspaceSchema,
  updateWorkspaceMemberSchema,
  workspaceMemberParamsSchema,
  workspaceParamsSchema,
} from "./workspaces.schema.js";

export const workspacesRouter = Router();
workspacesRouter.use(requireAuth);
workspacesRouter
  .route("/")
  .get(controller.list)
  .post(validate(createWorkspaceSchema), controller.create);
workspacesRouter
  .route("/:workspaceId/members")
  .get(validate(workspaceParamsSchema), controller.listMembers)
  .post(validate(addWorkspaceMemberSchema), controller.addMember);
workspacesRouter
  .route("/:workspaceId/members/:memberId")
  .patch(validate(updateWorkspaceMemberSchema), controller.updateMember)
  .delete(validate(workspaceMemberParamsSchema), controller.removeMember);
workspacesRouter
  .route("/:workspaceId")
  .get(validate(workspaceParamsSchema), controller.get)
  .patch(validate(updateWorkspaceSchema), controller.update)
  .delete(validate(workspaceParamsSchema), controller.remove);
