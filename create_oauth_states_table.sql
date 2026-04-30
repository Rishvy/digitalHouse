-- Run this in your Supabase SQL Editor
-- Create table for storing OAuth state during Canva Connect flow

CREATE TABLE IF NOT EXISTS canva_oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL UNIQUE,
  code_verifier TEXT NOT NULL,
  user_id UUID NOT NULL,
  product_id TEXT,
  variation_id TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Add check constraint to ensure expires_at is in the future
  CONSTRAINT check_expires_at_future CHECK (expires_at > created_at)
);

-- Index for fast state lookup (already unique, but explicit index for clarity)
CREATE INDEX IF NOT EXISTS idx_canva_oauth_states_state ON canva_oauth_states(state);

-- Index for expires_at (used for cleanup and active state queries)
-- Note: Partial indexes with NOW() are not allowed in PostgreSQL (NOW() is not immutable)
-- This index is still very efficient for time-based queries
CREATE INDEX IF NOT EXISTS idx_canva_oauth_states_expires_at 
  ON canva_oauth_states(expires_at);

-- Index for user_id lookups (if you query by user)
CREATE INDEX IF NOT EXISTS idx_canva_oauth_states_user_id 
  ON canva_oauth_states(user_id);

-- Enable RLS
ALTER TABLE canva_oauth_states ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can manage all states (for API routes)
-- Using SELECT wrapper for better performance
DROP POLICY IF EXISTS "Service role can manage OAuth states" ON canva_oauth_states;
CREATE POLICY "Service role can manage OAuth states" 
  ON canva_oauth_states 
  FOR ALL 
  TO service_role
  USING (true);

-- Policy: Users can only access their own OAuth states
DROP POLICY IF EXISTS "Users can access own OAuth states" ON canva_oauth_states;
CREATE POLICY "Users can access own OAuth states"
  ON canva_oauth_states
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_canva_oauth_states_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_canva_oauth_states_updated_at ON canva_oauth_states;
CREATE TRIGGER trigger_update_canva_oauth_states_updated_at
  BEFORE UPDATE ON canva_oauth_states
  FOR EACH ROW
  EXECUTE FUNCTION update_canva_oauth_states_updated_at();

-- Auto-delete expired states (cleanup function)
CREATE OR REPLACE FUNCTION cleanup_expired_canva_oauth_states()
RETURNS void AS $$
BEGIN
  DELETE FROM canva_oauth_states WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule automatic cleanup (runs every hour)
-- Note: Requires pg_cron extension
-- To enable: CREATE EXTENSION IF NOT EXISTS pg_cron;
-- Uncomment the following line after enabling pg_cron:
-- SELECT cron.schedule('cleanup-expired-oauth-states', '0 * * * *', 'SELECT cleanup_expired_canva_oauth_states()');

-- Alternative: Create a trigger to delete expired states on SELECT
-- This is less efficient but doesn't require pg_cron
CREATE OR REPLACE FUNCTION auto_cleanup_expired_oauth_states()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM canva_oauth_states WHERE expires_at < NOW() - INTERVAL '1 hour';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_cleanup_oauth_states ON canva_oauth_states;
CREATE TRIGGER trigger_auto_cleanup_oauth_states
  AFTER INSERT ON canva_oauth_states
  FOR EACH STATEMENT
  EXECUTE FUNCTION auto_cleanup_expired_oauth_states();
