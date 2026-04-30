-- Add template_id column to canva_oauth_states for tracking template selection through OAuth flow
ALTER TABLE canva_oauth_states ADD COLUMN IF NOT EXISTS template_id TEXT;
