-- Add new columns to clusters table
ALTER TABLE clusters 
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;

-- Policy for public clusters (anyone can view public clusters)
CREATE POLICY "Public clusters are viewable by everyone" 
ON clusters FOR SELECT 
USING (is_public = true);

-- Index for performance on public/locked searches
CREATE INDEX IF NOT EXISTS idx_clusters_is_public ON clusters(is_public);
