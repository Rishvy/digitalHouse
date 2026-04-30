-- Migration script to apply optimizations to existing database
-- Run this in your Supabase SQL Editor if you already have the tables created

-- ============================================================================
-- 1. Add missing columns to canva_oauth_states
-- ============================================================================

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'canva_oauth_states' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE canva_oauth_states ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    -- Backfill existing rows
    UPDATE canva_oauth_states SET updated_at = created_at WHERE updated_at IS NULL;
  END IF;
END $$;

-- ============================================================================
-- 2. Add check constraints
-- ============================================================================

-- Add constraint to canva_oauth_states
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_expires_at_future'
    AND conrelid = 'canva_oauth_states'::regclass
  ) THEN
    ALTER TABLE canva_oauth_states
    ADD CONSTRAINT check_expires_at_future CHECK (expires_at > created_at);
  END IF;
END $$;

-- Add constraints to canva_templates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_name_not_empty'
    AND conrelid = 'canva_templates'::regclass
  ) THEN
    ALTER TABLE canva_templates
    ADD CONSTRAINT check_name_not_empty CHECK (length(trim(name)) > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_category_not_empty'
    AND conrelid = 'canva_templates'::regclass
  ) THEN
    ALTER TABLE canva_templates
    ADD CONSTRAINT check_category_not_empty CHECK (length(trim(product_category)) > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_template_id_not_empty'
    AND conrelid = 'canva_templates'::regclass
  ) THEN
    ALTER TABLE canva_templates
    ADD CONSTRAINT check_template_id_not_empty CHECK (length(trim(canva_template_id)) > 0);
  END IF;
END $$;

-- ============================================================================
-- 3. Replace full indexes with optimized versions
-- ============================================================================

-- Keep expires_at index (efficient for time-based queries)
-- Note: Partial indexes with NOW() are not allowed (NOW() is not immutable)
CREATE INDEX IF NOT EXISTS idx_canva_oauth_states_expires_at 
  ON canva_oauth_states(expires_at);

-- Add user_id index for OAuth states
CREATE INDEX IF NOT EXISTS idx_canva_oauth_states_user_id 
  ON canva_oauth_states(user_id);

-- Drop old category index and create composite index
DROP INDEX IF EXISTS idx_canva_templates_category;
CREATE INDEX IF NOT EXISTS idx_canva_templates_category_created 
  ON canva_templates(product_category, created_at DESC);

-- ============================================================================
-- 4. Add missing foreign key index
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_canva_oauth_states_template_id 
  ON canva_oauth_states(template_id);

-- ============================================================================
-- 5. Update RLS policies for better performance
-- ============================================================================

-- Update OAuth states policies
DROP POLICY IF EXISTS "Service role can manage OAuth states" ON canva_oauth_states;
CREATE POLICY "Service role can manage OAuth states" 
  ON canva_oauth_states 
  FOR ALL 
  TO service_role
  USING (true);

-- Add user access policy
DROP POLICY IF EXISTS "Users can access own OAuth states" ON canva_oauth_states;
CREATE POLICY "Users can access own OAuth states"
  ON canva_oauth_states
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Update templates policies (no functional change, just consistency)
DROP POLICY IF EXISTS "Anyone can read templates" ON canva_templates;
CREATE POLICY "Anyone can read templates" 
  ON canva_templates 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Service role can manage templates" ON canva_templates;
CREATE POLICY "Service role can manage templates" 
  ON canva_templates 
  FOR ALL 
  TO service_role
  USING (true);

-- ============================================================================
-- 6. Add storage UPDATE policy
-- ============================================================================

DROP POLICY IF EXISTS "Service role can update template thumbnails" ON storage.objects;
CREATE POLICY "Service role can update template thumbnails"
  ON storage.objects FOR UPDATE
  TO service_role
  USING (bucket_id = 'canva-template-thumbnails');

-- ============================================================================
-- 7. Create/update triggers for updated_at
-- ============================================================================

-- Function for OAuth states
CREATE OR REPLACE FUNCTION update_canva_oauth_states_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_canva_oauth_states_updated_at ON canva_oauth_states;
CREATE TRIGGER trigger_update_canva_oauth_states_updated_at
  BEFORE UPDATE ON canva_oauth_states
  FOR EACH ROW
  EXECUTE FUNCTION update_canva_oauth_states_updated_at();

-- Function for templates (should already exist, but ensure it's correct)
CREATE OR REPLACE FUNCTION update_canva_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_canva_templates_updated_at ON canva_templates;
CREATE TRIGGER trigger_update_canva_templates_updated_at
  BEFORE UPDATE ON canva_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_canva_templates_updated_at();

-- ============================================================================
-- 8. Setup automatic cleanup for expired OAuth states
-- ============================================================================

-- Cleanup function (should already exist, but ensure it's correct)
CREATE OR REPLACE FUNCTION cleanup_expired_canva_oauth_states()
RETURNS void AS $$
BEGIN
  DELETE FROM canva_oauth_states WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-cleanup trigger (runs on INSERT)
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

-- ============================================================================
-- 9. Optional: Setup pg_cron for scheduled cleanup (recommended)
-- ============================================================================

-- Uncomment the following lines if you have pg_cron enabled:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('cleanup-expired-oauth-states', '0 * * * *', 'SELECT cleanup_expired_canva_oauth_states()');

-- ============================================================================
-- 10. Analyze tables to update statistics
-- ============================================================================

ANALYZE canva_oauth_states;
ANALYZE canva_templates;

-- ============================================================================
-- Migration complete!
-- ============================================================================

-- Verify the changes:
SELECT 'Migration completed successfully!' as status;

-- Check indexes
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('canva_oauth_states', 'canva_templates')
ORDER BY tablename, indexname;

-- Check constraints
SELECT
  conrelid::regclass as table_name,
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid IN ('canva_oauth_states'::regclass, 'canva_templates'::regclass)
ORDER BY table_name, constraint_name;
