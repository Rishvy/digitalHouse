-- Create user_designs table to store Canva design exports
CREATE TABLE IF NOT EXISTS user_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  design_id TEXT, -- Canva design ID
  export_url TEXT NOT NULL, -- URL to the exported design file
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variation_id UUID REFERENCES product_variations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_designs_user_id ON user_designs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_designs_product_id ON user_designs(product_id);
CREATE INDEX IF NOT EXISTS idx_user_designs_created_at ON user_designs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE user_designs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotent migrations)
DROP POLICY IF EXISTS "Users can view their own designs" ON user_designs;
DROP POLICY IF EXISTS "Users can insert their own designs" ON user_designs;
DROP POLICY IF EXISTS "Users can update their own designs" ON user_designs;
DROP POLICY IF EXISTS "Users can delete their own designs" ON user_designs;
DROP POLICY IF EXISTS "Service role has full access to user_designs" ON user_designs;

-- Policy: Users can view their own designs
CREATE POLICY "Users can view their own designs"
  ON user_designs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own designs
CREATE POLICY "Users can insert their own designs"
  ON user_designs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own designs
CREATE POLICY "Users can update their own designs"
  ON user_designs
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own designs
CREATE POLICY "Users can delete their own designs"
  ON user_designs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Service role can do everything (for backend operations)
CREATE POLICY "Service role has full access to user_designs"
  ON user_designs
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_designs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_designs_updated_at ON user_designs;

CREATE TRIGGER user_designs_updated_at
  BEFORE UPDATE ON user_designs
  FOR EACH ROW
  EXECUTE FUNCTION update_user_designs_updated_at();
