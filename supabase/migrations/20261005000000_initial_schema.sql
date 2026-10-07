create type public.workspace_role as enum ('owner', 'admin', 'member');
create type public.task_status as enum ('todo', 'in_progress', 'in_review', 'done');
create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);
-- Keep the application profile in sync whenever Supabase Auth creates a user.
-- The function is only invoked by this trigger; it is not a public API.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url');
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.workspace_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  archived_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status public.task_status not null default 'todo',
  priority public.task_priority not null default 'medium',
  assignee_id uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id),
  due_date date,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);
create table public.labels (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  color text not null default '#888888',
  unique (workspace_id, name)
);
create table public.task_labels (
  task_id uuid not null references public.tasks(id) on delete cascade,
  label_id uuid not null references public.labels(id) on delete cascade,
  primary key (task_id, label_id)
);

create index projects_workspace_id_idx on public.projects (workspace_id);
create index tasks_project_status_active_idx on public.tasks (project_id, status) where deleted_at is null;
create index tasks_assignee_active_idx on public.tasks (assignee_id) where deleted_at is null;
create index tasks_due_date_active_idx on public.tasks (due_date) where deleted_at is null;
create index comments_task_created_at_idx on public.comments (task_id, created_at);
create index workspace_members_user_id_idx on public.workspace_members (user_id);

create function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
create trigger tasks_updated_at before update on public.tasks
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.comments enable row level security;
alter table public.labels enable row level security;
alter table public.task_labels enable row level security;

create policy "Members can view their workspaces" on public.workspaces for select to authenticated
using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspaces.id and wm.user_id = (select auth.uid())));
