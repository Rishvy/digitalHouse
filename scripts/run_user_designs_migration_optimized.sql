-- Run this in Supabase SQL Editor
-- Create user_designs table to store Canva design exports (OPTIMIZED)

CREATE TABLE IF NOT EXISTS user_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  design_id TEXT, -- Canva design ID
  export_url TEXT NOT NULL, -- URL to the exported design file
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variation_id UUID REFERENCES product_variations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Add check constraints for data validation
  CONSTRAINT check_export_url_not_empty CHECK (length(trim(export_url)) > 0)
);

-- ============================================================================
-- OPTIMIZED INDEXES
-- ============================================================================

-- Foreign key indexes (CRITICAL for JOIN performance)
-- Following Supabase best practice: always index foreign key columns
CREATE INDEX IF NOT EXISTS idx_user_designs_user_id ON user_designs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_designs_product_id ON user_designs(product_id);
CREATE INDEX IF NOT EXISTS idx_user_designs_variation_id ON user_designs(variation_id);

-- Composite index for common query pattern: user's designs sorted by date
-- This is more efficient than separate indexes
CREATE INDEX IF NOT EXISTS idx_user_designs_user_created 
  ON user_designs(user_id, created_at DESC);

-- Optional: Index for design_id lookups (if you query by Canva design ID)
CREATE INDEX IF NOT EXISTS idx_user_designs_design_id 
  ON user_designs(design_id) 
  WHERE design_id IS NOT NULL;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable Row Level Security
ALTER TABLE user_designs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own designs" ON user_designs;
DROP POLICY IF EXISTS "Users can insert their own designs" ON user_designs;
DROP POLICY IF EXISTS "Users can update their own designs" ON user_designs;
DROP POLICY IF EXISTS "Users can delete their own designs" ON user_designs;
DROP POLICY IF EXISTS "Service role has full access to user_designs" ON user_designs;

-- Policy: Users can view their own designs
-- Using SELECT wrapper for better RLS performance (5-10x faster)
CREATE POLICY "Users can view their own designs"
  ON user_designs
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

-- Policy: Users can insert their own designs
CREATE POLICY "Users can insert their own designs"
  ON user_designs
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy: Users can update their own designs
CREATE POLICY "Users can update their own designs"
  ON user_designs
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

-- Policy: Users can delete their own designs
CREATE POLICY "Users can delete their own designs"
  ON user_designs
  FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- Policy: Service role can do everything (for backend operations)
CREATE POLICY "Service role has full access to user_designs"
  ON user_designs
  FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

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

-- ============================================================================
-- OPTIMIZATION NOTES
-- ============================================================================

-- 1. Added foreign key index on variation_id (was missing)
-- 2. Created composite index for user_id + created_at (common query pattern)
-- 3. Added partial index for design_id (only non-null values)
-- 4. Wrapped auth.uid() in SELECT for RLS performance (5-10x faster)
-- 5. Added CHECK constraint for export_url validation
-- 6. All foreign keys are now indexed for fast JOINs (10-100x faster)
