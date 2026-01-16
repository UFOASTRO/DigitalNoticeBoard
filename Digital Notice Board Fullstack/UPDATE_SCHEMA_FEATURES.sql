-- 1. Update 'pins' table for new features
ALTER TABLE pins
ADD COLUMN IF NOT EXISTS read_by UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- 2. Update 'messages' table for image support
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 3. Ensure Storage Bucket for Chat Images exists (this is a best-effort script, might need UI setup)
-- Note: Creating buckets via SQL is strictly not standard Supabase but we can set RLS policies
-- We assume a bucket named 'chat-attachments' will be used.

-- Policy to allow anyone to view chat images
-- (You might need to create the bucket 'chat-attachments' manually in the Supabase Dashboard if it doesn't exist)
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'chat-attachments' );
-- CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'chat-attachments' AND auth.role() = 'authenticated' );
