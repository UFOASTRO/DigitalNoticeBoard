-- ==========================================
-- RUN THIS SCRIPT IN SUPABASE SQL EDITOR
-- ==========================================

-- 1. Add missing columns to 'clusters' table
ALTER TABLE clusters 
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;

-- 2. Allow public clusters to be viewed by anyone (Search feature)
DROP POLICY IF EXISTS "Public clusters are viewable by everyone" ON clusters;
CREATE POLICY "Public clusters are viewable by everyone" 
ON clusters FOR SELECT 
USING (is_public = true);

-- 3. Improve search performance
CREATE INDEX IF NOT EXISTS idx_clusters_is_public ON clusters(is_public);

-- 4. Update the invite function to handle descriptions
CREATE OR REPLACE FUNCTION verify_invite_token(invite_token text)
RETURNS json AS $$
DECLARE
  invite_record record;
  cluster_record record;
BEGIN
  -- Find the invite
  SELECT * INTO invite_record
  FROM cluster_invites
  WHERE token = invite_token
  AND expires_at > now();

  IF invite_record IS NULL THEN
    RETURN json_build_object('valid', false, 'error', 'Invite not found or expired');
  END IF;

  -- Check usage limit
  IF invite_record.max_uses IS NOT NULL AND invite_record.uses_count >= invite_record.max_uses THEN
    RETURN json_build_object('valid', false, 'error', 'Invite usage limit reached');
  END IF;

  -- Get cluster details (Now including description)
  SELECT name, description INTO cluster_record
  FROM clusters
  WHERE id = invite_record.cluster_id;

  RETURN json_build_object(
    'valid', true,
    'cluster_id', invite_record.cluster_id,
    'cluster_name', cluster_record.name,
    'cluster_description', cluster_record.description,
    'role', invite_record.permission_level,
    'expires_at', invite_record.expires_at,
    'created_by', invite_record.created_by
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
