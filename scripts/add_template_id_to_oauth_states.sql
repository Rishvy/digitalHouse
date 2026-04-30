-- Add template_id column to canva_oauth_states table
-- Run this in your Supabase SQL Editor

ALTER TABLE canva_oauth_states 
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES canva_templates(id);

-- Index for template lookup
CREATE INDEX IF NOT EXISTS idx_canva_oauth_states_template_id 
  ON canva_oauth_states(template_id);
