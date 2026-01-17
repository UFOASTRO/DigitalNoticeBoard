create or replace function public.join_cluster(target_cluster_id uuid)
returns text as $$ -- Return text so frontend knows what happened
declare
  exists_check uuid;
begin
  -- 1. Check if user is authenticated
  if auth.uid() is null then
    raise exception 'Not logged in';
  end if;

  -- 2. Check if cluster exists
  select id into exists_check from clusters where id = target_cluster_id;
  
  if exists_check is null then
    raise exception 'Cluster not found';
  end if;

  -- 3. Insert member
  insert into public.cluster_members (cluster_id, user_id, role)
  values (target_cluster_id, auth.uid(), 'viewer')
  on conflict (cluster_id, user_id) do nothing;

  -- 4. Check if we actually inserted a row (to tell the frontend)
  if found then
    return 'joined';
  else
    return 'already_member';
  end if;
end;
$$ language plpgsql security definer 
set search_path = public; -- Forces function to use public schema only