import type { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email?: string;
}

export type ValidatedRequest<T> = Request & { validated: T };

export interface Workspace {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export type WorkspaceRole = 'owner' | 'admin' | 'member';
