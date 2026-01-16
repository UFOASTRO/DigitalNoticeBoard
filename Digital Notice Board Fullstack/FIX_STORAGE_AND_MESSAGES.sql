-- =======================================================
-- FIX STORAGE RLS AND MESSAGES TABLE
-- Run this in the Supabase SQL Editor
-- =======================================================

-- 1. Create the Storage Bucket for Chat Attachments
-- We make it public so image_urls are accessible directly
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Storage Policies (storage.objects)
-- Allow authenticated users to upload files to 'chat-attachments'
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'chat-attachments' );

-- Allow public view of chat attachments (since bucket is public, but RLS on objects might still block list/select)
CREATE POLICY "Public can view chat attachments"
ON storage.objects FOR SELECT
USING ( bucket_id = 'chat-attachments' );


-- 3. Messages Table RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Helper function reuse (ensure it exists or rely on the one from previous scripts)
-- We assume public.is_cluster_member(_cluster_id) exists. 
-- If not, define it:
CREATE OR REPLACE FUNCTION public.is_cluster_member(_cluster_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT exists (
    SELECT 1 
    from public.cluster_members 
    WHERE cluster_id = _cluster_id 
    AND user_id = auth.uid()
  );
$$;

-- View Messages
DROP POLICY IF EXISTS "View messages if member" ON messages;
CREATE POLICY "View messages if member" ON messages
FOR SELECT
USING ( is_cluster_member(cluster_id) );

-- Insert Messages (Check membership)
DROP POLICY IF EXISTS "Send messages if member" ON messages;
CREATE POLICY "Send messages if member" ON messages
FOR INSERT
WITH CHECK ( is_cluster_member(cluster_id) );

-- 4. Enable Realtime for Messages
BEGIN;
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
