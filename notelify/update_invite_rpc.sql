create or replace function verify_invite_token(invite_token text)
returns json as $$
declare
  invite_record record;
  cluster_record record;
begin
  -- Find the invite
  select * into invite_record
  from cluster_invites
  where token = invite_token
  and expires_at > now();

  if invite_record is null then
    return json_build_object('valid', false, 'error', 'Invite not found or expired');
  end if;

  -- Check usage limit
  if invite_record.max_uses is not null and invite_record.uses_count >= invite_record.max_uses then
    return json_build_object('valid', false, 'error', 'Invite usage limit reached');
  end if;

  -- Get cluster details (name AND description)
  select name, description into cluster_record
  from clusters
  where id = invite_record.cluster_id;

  return json_build_object(
    'valid', true,
    'cluster_id', invite_record.cluster_id,
    'cluster_name', cluster_record.name,
    'cluster_description', cluster_record.description,
    'role', invite_record.permission_level,
    'expires_at', invite_record.expires_at,
    'created_by', invite_record.created_by
  );
end;
$$ language plpgsql security definer;
