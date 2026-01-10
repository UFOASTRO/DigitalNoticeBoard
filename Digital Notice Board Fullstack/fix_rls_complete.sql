-- Complete RLS Fix Script

-- 1. Helper Function: is_cluster_member
-- This function allows us to check membership without infinite recursion in policies
create or replace function public.is_cluster_member(_cluster_id uuid)
returns boolean
language sql
security definer -- Runs with privileges of the creator (postgres/admin)
stable
as $$
  select exists (
    select 1 
    from public.cluster_members 
    where cluster_id = _cluster_id 
    and user_id = auth.uid()
  );
$$;

-- 2. Helper Function: add_cluster_creator_to_members
-- Ensures the creator of a cluster is automatically added as an admin member
create or replace function public.add_cluster_creator_to_members()
returns trigger as $$
begin
  insert into public.cluster_members (cluster_id, user_id, role)
  values (new.id, new.owner_id, 'admin');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to run the function
drop trigger if exists on_cluster_created on clusters;
create trigger on_cluster_created
  after insert on clusters
  for each row execute procedure public.add_cluster_creator_to_members();

-- 3. Fix Cluster Members Policy (Recursion Fix)
alter table cluster_members enable row level security;
drop policy if exists "View members if member" on cluster_members;
create policy "View members if member" on cluster_members 
for select using (
  auth.uid() = user_id -- Users can always see themselves
  OR
  is_cluster_member(cluster_id) -- Use the security definer function
);

drop policy if exists "Join cluster" on cluster_members;
create policy "Join cluster" on cluster_members
for insert with check (
  auth.uid() = user_id -- Users can add themselves (join)
);

-- 4. Fix Clusters Policy
alter table clusters enable row level security;
drop policy if exists "View clusters if member or owner" on clusters;
create policy "View clusters if member or owner" on clusters 
for select using (
  owner_id = auth.uid() 
  OR 
  is_cluster_member(id)
);

drop policy if exists "Create cluster" on clusters;
create policy "Create cluster" on clusters
for insert with check (
  auth.uid() = owner_id
);

-- 5. Pins Policy
alter table pins enable row level security;

drop policy if exists "View pins if member" on pins;
create policy "View pins if member" on pins
for select using (
  is_cluster_member(cluster_id)
);

drop policy if exists "Create pins if member" on pins;
create policy "Create pins if member" on pins
for insert with check (
  is_cluster_member(cluster_id)
);

drop policy if exists "Update pins if member" on pins;
create policy "Update pins if member" on pins
for update using (
  is_cluster_member(cluster_id)
);

drop policy if exists "Delete pins if member" on pins;
create policy "Delete pins if member" on pins
for delete using (
  is_cluster_member(cluster_id)
);

-- 6. Connections Policy
alter table connections enable row level security;

drop policy if exists "View connections if member" on connections;
create policy "View connections if member" on connections
for select using (
  is_cluster_member(cluster_id)
);

drop policy if exists "Create connections if member" on connections;
create policy "Create connections if member" on connections
for insert with check (
  is_cluster_member(cluster_id)
);

drop policy if exists "Delete connections if member" on connections;
create policy "Delete connections if member" on connections
for delete using (
  is_cluster_member(cluster_id)
);


-- 7. Enable Realtime
-- This is critical for the "zero delay" requirement
begin;
  -- Remove tables if they are already in the publication to avoid errors (or just ignore errors)
  -- The simplest way is to try adding them. If they are already added, Postgres might complain, 
  -- but usually 'alter publication ... add table' is idempotent or we can recreate the publication.
  
  -- Ensure the publication exists
  -- insert into pg_publication (pubname) values ('supabase_realtime') on conflict do nothing; -- This is internal
  
  -- We just run the specific Supabase command style
  alter publication supabase_realtime add table pins;
  alter publication supabase_realtime add table connections;
  alter publication supabase_realtime add table cluster_members;
  -- Note: We don't need realtime on 'clusters' usually, but maybe for the list.
commit;
