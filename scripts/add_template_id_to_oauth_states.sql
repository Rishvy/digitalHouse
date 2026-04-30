-- Add template_id column to canva_oauth_states table
-- Run this in your Supabase SQL Editor

-- Add column with foreign key constraint
ALTER TABLE canva_oauth_states 
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES canva_templates(id) ON DELETE SET NULL;

-- Index for foreign key (critical for JOIN performance and CASCADE operations)
-- This follows Supabase best practice: always index foreign key columns
CREATE INDEX IF NOT EXISTS idx_canva_oauth_states_template_id 
  ON canva_oauth_states(template_id);

-- Optional: Add a composite index if you frequently query by user_id AND template_id
-- Uncomment if needed:
-- CREATE INDEX IF NOT EXISTS idx_canva_oauth_states_user_template 
--   ON canva_oauth_states(user_id, template_id);
