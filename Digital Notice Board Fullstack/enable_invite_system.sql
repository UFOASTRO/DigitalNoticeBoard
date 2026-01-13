-- Enable Invite System
-- Run this in your Supabase SQL Editor

-- 1. Create Invite Table
create table if not exists public.cluster_invites (
  id uuid default gen_random_uuid() primary key,
  cluster_id uuid references public.clusters(id) on delete cascade not null,
  token text default encode(gen_random_bytes(16), 'hex') unique not null,
  permission_level text check (permission_level in ('editor', 'viewer')) not null,
  created_by uuid references auth.users(id) not null,
  created_at timestamptz default now(),
  expires_at timestamptz not null,
  max_uses int, -- null means unlimited
  uses_count int default 0
);

-- 2. RLS for Invites
alter table public.cluster_invites enable row level security;

-- Allow owners to view/create/delete invites for their clusters
create policy "Owners can manage invites"
  on public.cluster_invites
  for all
  using (
    exists (
      select 1 from public.clusters
      where id = cluster_invites.cluster_id
      and owner_id = auth.uid()
    )
  );

-- 3. RPC: Verify Token (Security Definer to bypass RLS for validation)
create or replace function public.verify_invite_token(invite_token text)
returns json as $$
declare
  invite_record record;
  cluster_info record;
begin
  -- Find invite
  select * into invite_record
  from public.cluster_invites
  where token = invite_token;

  if invite_record is null then
    return json_build_object('valid', false, 'error', 'Invalid token');
  end if;

  -- Check expiry
  if invite_record.expires_at < now() then
    return json_build_object('valid', false, 'error', 'Expired token');
  end if;

  -- Check usage limit
  if invite_record.max_uses is not null and invite_record.uses_count >= invite_record.max_uses then
    return json_build_object('valid', false, 'error', 'Usage limit reached');
  end if;

  -- Get cluster info
  select name, owner_id into cluster_info
  from public.clusters
  where id = invite_record.cluster_id;

  return json_build_object(
    'valid', true,
    'cluster_id', invite_record.cluster_id,
    'cluster_name', cluster_info.name,
    'role', invite_record.permission_level,
    'expires_at', invite_record.expires_at
  );
end;
$$ language plpgsql security definer;

-- 4. RPC: Accept Invite
create or replace function public.accept_invite(invite_token text)
returns json as $$
declare
  invite_record record;
  current_user_id uuid;
  user_role text; -- Variable to hold the role
begin
  current_user_id := auth.uid();
  if current_user_id is null then
     raise exception 'Not authenticated';
  end if;

  -- Re-validate
  select * into invite_record
  from public.cluster_invites
  where token = invite_token;

  if invite_record is null or invite_record.expires_at < now() or (invite_record.max_uses is not null and invite_record.uses_count >= invite_record.max_uses) then
     raise exception 'Invalid or expired invite';
  end if;

  -- Determine role (casting text to role type if needed, but assuming text matches)
  user_role := invite_record.permission_level;

  -- Insert Member
  -- Note: We cast user_role to the 'role' enum/type if it exists, otherwise it's text. 
  -- Assuming 'role' column in cluster_members is of type 'role' or text.
  insert into public.cluster_members (cluster_id, user_id, role)
  values (invite_record.cluster_id, current_user_id, user_role)
  on conflict (cluster_id, user_id) do nothing;

  -- Increment usage
  update public.cluster_invites
  set uses_count = uses_count + 1
  where id = invite_record.id;

  return json_build_object('success', true, 'cluster_id', invite_record.cluster_id);
end;
$$ language plpgsql security definer;

-- 5. Disable Old Join Method
drop function if exists public.join_cluster(uuid);
