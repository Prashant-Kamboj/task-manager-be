import * as service from "./workspaces.service.js";
import type { NextFunction, Request, Response } from 'express';
import type {
  AddWorkspaceMemberInput,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  UpdateWorkspaceMemberInput,
  WorkspaceMemberParamsInput,
  WorkspaceParamsInput,
} from './workspaces.schema.js';
import type { AuthenticatedUser } from '../../types/shared.js';

function actorId(req: Request): string {
  return (req.user as AuthenticatedUser).id;
}

function validated<T>(req: Request): T {
  return req.validated as T;
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = validated<CreateWorkspaceInput>(req);
    res
      .status(201)
      .json({
        data: await service.createWorkspace({
          actorId: actorId(req),
          ...input.body,
        }),
      });
  } catch (error) {
    next(error);
  }
}
export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ data: await service.listWorkspaces({ actorId: actorId(req) }) });
  } catch (error) {
    next(error);
  }
}
export async function get(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = validated<WorkspaceParamsInput>(req);
    res.json({
      data: await service.getWorkspace({
        actorId: actorId(req),
        ...input.params,
      }),
    });
  } catch (error) {
    next(error);
  }
}
export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = validated<UpdateWorkspaceInput>(req);
    res.json({
      data: await service.updateWorkspace({
        actorId: actorId(req),
        ...input.params,
        ...input.body,
      }),
    });
  } catch (error) {
    next(error);
  }
}
export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = validated<WorkspaceParamsInput>(req);
    await service.deleteWorkspace({
      actorId: actorId(req),
      ...input.params,
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function listMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = validated<WorkspaceParamsInput>(req);
    res.json({ data: await service.listMembers({ actorId: actorId(req), ...input.params }) });
  } catch (error) {
    next(error);
  }
}

export async function addMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = validated<AddWorkspaceMemberInput>(req);
    res.status(201).json({
      data: await service.addMember({ actorId: actorId(req), ...input.params, ...input.body }),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = validated<UpdateWorkspaceMemberInput>(req);
    res.json({
      data: await service.updateMember({ actorId: actorId(req), ...input.params, ...input.body }),
    });
  } catch (error) {
    next(error);
  }
}

export async function removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = validated<WorkspaceMemberParamsInput>(req);
    await service.removeMember({ actorId: actorId(req), ...input.params });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
