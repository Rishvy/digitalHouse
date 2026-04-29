-- Create table for storing OAuth state during Canva Connect flow
CREATE TABLE IF NOT EXISTS canva_oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL UNIQUE,
  code_verifier TEXT NOT NULL,
  user_id UUID NOT NULL,
  product_id TEXT,
  variation_id TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast state lookup
CREATE INDEX IF NOT EXISTS idx_canva_oauth_states_state ON canva_oauth_states(state);

-- Index for cleanup of expired states
CREATE INDEX IF NOT EXISTS idx_canva_oauth_states_expires_at ON canva_oauth_states(expires_at);

-- Enable RLS
ALTER TABLE canva_oauth_states ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can manage all states (for API routes)
DROP POLICY IF EXISTS "Service role can manage OAuth states" ON canva_oauth_states;
CREATE POLICY "Service role can manage OAuth states" 
  ON canva_oauth_states 
  FOR ALL 
  TO service_role
  USING (true);

-- Auto-delete expired states (cleanup function)
CREATE OR REPLACE FUNCTION cleanup_expired_canva_oauth_states()
RETURNS void AS $$
BEGIN
  DELETE FROM canva_oauth_states WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
