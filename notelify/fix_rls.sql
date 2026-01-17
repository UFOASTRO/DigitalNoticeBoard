-- Fix 1: Resolve Infinite Recursion on cluster_members
-- Drop the recursive policy if it exists
drop policy if exists "View members if member" on cluster_members;

-- Create a safe policy using the security definer function
-- This avoids the recursion because the function runs with higher privileges
create policy "View members if member" on cluster_members 
for select using (
  auth.uid() = user_id -- Users can always see themselves
  OR
  is_cluster_member(cluster_id) -- Uses the security definer function
);

-- Fix 2: Resolve "New row violates RLS" when creating a cluster
-- We need to ensure the owner is automatically added as a member so they can 'select' the cluster immediately.

-- Function to auto-add creator
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

-- Fallback: Allow owners to view their clusters even if not in members (Double safety)
drop policy if exists "View clusters if member" on clusters;
create policy "View clusters if member or owner" on clusters 
for select using (
  owner_id = auth.uid() 
  OR 
  is_cluster_member(id)
);

-- Fix 3: Enable Realtime for all collaborative tables
-- Ensure these tables are in the publication so useConnections and usePins hooks work
alter publication supabase_realtime add table pins;
alter publication supabase_realtime add table connections;
alter publication supabase_realtime add table cluster_members;
