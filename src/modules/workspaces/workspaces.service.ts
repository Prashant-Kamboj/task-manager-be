import { supabase } from "../../config/supabase.js";
import { AppError } from "../../utils/AppError.js";
import type { PostgrestError } from '@supabase/supabase-js';
import type { Workspace, WorkspaceRole } from '../../types/shared.js';

interface CreateWorkspaceArgs { actorId: string; name: string; }
interface WorkspaceArgs { actorId: string; workspaceId: string; }
interface UpdateWorkspaceArgs extends WorkspaceArgs { name: string; }
export interface WorkspaceMember {
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  joined_at: string;
  profile?: { id: string; email: string; full_name: string | null; avatar_url: string | null };
}

function throwDatabaseError(error: PostgrestError | null): void {
  if (error) throw new AppError(500, "Database operation failed");
}

export async function createWorkspace({ actorId, name }: CreateWorkspaceArgs): Promise<Workspace> {
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .insert({ name, created_by: actorId })
    .select()
    .single();
  throwDatabaseError(workspaceError);

  const { error: memberError } = await supabase
    .from("workspace_members")
    .insert({ workspace_id: workspace.id, user_id: actorId, role: "owner" });

  if (memberError) {
    await supabase.from("workspaces").delete().eq("id", workspace.id);
    throw new AppError(500, "Could not create workspace membership");
  }
  return workspace as Workspace;
}

export async function listWorkspaces({ actorId }: Pick<CreateWorkspaceArgs, 'actorId'>): Promise<Array<Workspace & { role: WorkspaceRole }>> {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("role, workspaces ( id, name, created_by, created_at )")
    .eq("user_id", actorId)
    .order("joined_at", { ascending: false });
  throwDatabaseError(error);
  const rows = (data ?? []) as unknown as Array<{
    role: WorkspaceRole;
    workspaces: Workspace | Workspace[] | null;
  }>;
  return rows.flatMap(({ role, workspaces }) => {
    const workspace = Array.isArray(workspaces) ? workspaces[0] : workspaces;
    return workspace ? [{ ...workspace, role }] : [];
  });
}

async function membershipFor({ actorId, workspaceId }: WorkspaceArgs): Promise<WorkspaceMember> {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", actorId)
    .maybeSingle();
  throwDatabaseError(error);
  if (!data) throw new AppError(404, "Workspace not found");
  return data as WorkspaceMember;
}

async function managerMembershipFor(args: WorkspaceArgs): Promise<WorkspaceMember> {
  const membership = await membershipFor(args);
  if (!['owner', 'admin'].includes(membership.role)) {
    throw new AppError(403, 'Only owners and admins can manage workspace members');
  }
  return membership;
}

export async function listMembers({ actorId, workspaceId }: WorkspaceArgs): Promise<WorkspaceMember[]> {
  await membershipFor({ actorId, workspaceId });
  const { data, error } = await supabase
    .from('workspace_members')
    .select('workspace_id, user_id, role, joined_at, profiles ( id, email, full_name, avatar_url )')
    .eq('workspace_id', workspaceId)
    .order('joined_at', { ascending: true });
  throwDatabaseError(error);
  return (data ?? []).map((row) => {
    const value = row as unknown as WorkspaceMember & {
      profiles: WorkspaceMember['profile'] | WorkspaceMember['profile'][] | null;
    };
    const profile = Array.isArray(value.profiles) ? value.profiles[0] : value.profiles;
    const { profiles: _profiles, ...member } = value;
    return { ...member, profile: profile ?? undefined };
  });
}

export async function addMember({
  actorId,
  workspaceId,
  userId,
  role,
}: WorkspaceArgs & { userId: string; role: 'admin' | 'member' }): Promise<WorkspaceMember> {
  await managerMembershipFor({ actorId, workspaceId });

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url')
    .eq('id', userId)
    .maybeSingle();
  throwDatabaseError(profileError);
  if (!profile) throw new AppError(404, 'User profile not found');

  const { data, error } = await supabase
    .from('workspace_members')
    .insert({ workspace_id: workspaceId, user_id: userId, role })
    .select('workspace_id, user_id, role, joined_at')
    .single();
  if (error?.code === '23505') throw new AppError(409, 'User is already a workspace member');
  throwDatabaseError(error);
  return { ...(data as WorkspaceMember), profile };
}

export async function updateMember({
  actorId,
  workspaceId,
  memberId,
  role,
}: WorkspaceArgs & { memberId: string; role: 'admin' | 'member' }): Promise<WorkspaceMember> {
  const actorMembership = await managerMembershipFor({ actorId, workspaceId });
  const targetMembership = await membershipFor({ actorId: memberId, workspaceId });
  if (actorMembership.role !== 'owner' && targetMembership.role !== 'member') {
    throw new AppError(403, 'Admins can only change member roles');
  }

  const { data, error } = await supabase
    .from('workspace_members')
    .update({ role })
    .eq('workspace_id', workspaceId)
    .eq('user_id', memberId)
    .select('workspace_id, user_id, role, joined_at')
    .single();
  throwDatabaseError(error);
  return data as WorkspaceMember;
}

export async function removeMember({
  actorId,
  workspaceId,
  memberId,
}: WorkspaceArgs & { memberId: string }): Promise<void> {
  const actorMembership = await managerMembershipFor({ actorId, workspaceId });
  const targetMembership = await membershipFor({ actorId: memberId, workspaceId });
  if (targetMembership.role === 'owner') throw new AppError(400, 'The workspace owner cannot be removed');
  if (actorMembership.role !== 'owner' && targetMembership.role !== 'member') {
    throw new AppError(403, 'Admins can only remove members');
  }

  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', memberId);
  throwDatabaseError(error);
}

export async function getWorkspace({ actorId, workspaceId }: WorkspaceArgs): Promise<Workspace> {
  await membershipFor({ actorId, workspaceId });
  const { data, error } = await supabase
    .from("workspaces")
    .select()
    .eq("id", workspaceId)
    .single();
  throwDatabaseError(error);
  return data as Workspace;
}

export async function updateWorkspace({ actorId, workspaceId, name }: UpdateWorkspaceArgs): Promise<Workspace> {
  const membership = await membershipFor({ actorId, workspaceId });
  if (!["owner", "admin"].includes(membership.role))
    throw new AppError(403, "Only owners and admins can update a workspace");
  const { data, error } = await supabase
    .from("workspaces")
    .update({ name })
    .eq("id", workspaceId)
    .select()
    .single();
  throwDatabaseError(error);
  return data as Workspace;
}

export async function deleteWorkspace({ actorId, workspaceId }: WorkspaceArgs): Promise<void> {
  const membership = await membershipFor({ actorId, workspaceId });
  if (membership.role !== "owner")
    throw new AppError(403, "Only the owner can delete a workspace");
  const { error } = await supabase
    .from("workspaces")
    .delete()
    .eq("id", workspaceId);
  throwDatabaseError(error);
}
