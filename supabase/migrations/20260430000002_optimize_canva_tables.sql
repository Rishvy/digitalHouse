-- Optimization migration for Canva-related tables
-- Applies Supabase PostgreSQL best practices for performance and data integrity

-- ============================================================================
-- 1. Optimize canva_oauth_states table
-- ============================================================================

-- Add missing columns
ALTER TABLE canva_oauth_states 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill updated_at for existing rows
UPDATE canva_oauth_states SET updated_at = created_at WHERE updated_at IS NULL;

-- Add check constraint
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

-- Keep the expires_at index (it's already efficient for time-based queries)
-- Note: Partial indexes with NOW() are not allowed in PostgreSQL
-- The existing index is fine for both active and expired state queries
CREATE INDEX IF NOT EXISTS idx_canva_oauth_states_expires_at 
  ON canva_oauth_states(expires_at);

-- Add user_id index
CREATE INDEX IF NOT EXISTS idx_canva_oauth_states_user_id 
  ON canva_oauth_states(user_id);

-- Add template_id foreign key index (if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'canva_oauth_states' AND column_name = 'template_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_canva_oauth_states_template_id 
      ON canva_oauth_states(template_id)
      WHERE template_id IS NOT NULL;
  END IF;
END $$;

-- Update RLS policies for better performance
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

-- Create trigger for updated_at
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

-- Create auto-cleanup trigger
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
-- 2. Optimize user_designs table (if it exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_designs') THEN
    
    -- Add check constraint for export_url
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'check_export_url_not_empty'
      AND conrelid = 'user_designs'::regclass
    ) THEN
      ALTER TABLE user_designs
      ADD CONSTRAINT check_export_url_not_empty CHECK (length(trim(export_url)) > 0);
    END IF;

    -- Add missing foreign key index for variation_id
    CREATE INDEX IF NOT EXISTS idx_user_designs_variation_id 
      ON user_designs(variation_id);

    -- Create composite index for user + created_at (common query pattern)
    CREATE INDEX IF NOT EXISTS idx_user_designs_user_created 
      ON user_designs(user_id, created_at DESC);

    -- Add partial index for design_id (only non-null values)
    CREATE INDEX IF NOT EXISTS idx_user_designs_design_id 
      ON user_designs(design_id) 
      WHERE design_id IS NOT NULL;

    -- Update RLS policies to use SELECT wrapper for better performance
    DROP POLICY IF EXISTS "Users can view their own designs" ON user_designs;
    CREATE POLICY "Users can view their own designs"
      ON user_designs
      FOR SELECT
      USING ((SELECT auth.uid()) = user_id);

    DROP POLICY IF EXISTS "Users can insert their own designs" ON user_designs;
    CREATE POLICY "Users can insert their own designs"
      ON user_designs
      FOR INSERT
      WITH CHECK ((SELECT auth.uid()) = user_id);

    DROP POLICY IF EXISTS "Users can update their own designs" ON user_designs;
    CREATE POLICY "Users can update their own designs"
      ON user_designs
      FOR UPDATE
      USING ((SELECT auth.uid()) = user_id);

    DROP POLICY IF EXISTS "Users can delete their own designs" ON user_designs;
    CREATE POLICY "Users can delete their own designs"
      ON user_designs
      FOR DELETE
      USING ((SELECT auth.uid()) = user_id);

    DROP POLICY IF EXISTS "Service role has full access to user_designs" ON user_designs;
    CREATE POLICY "Service role has full access to user_designs"
      ON user_designs
      FOR ALL
      TO service_role
      USING (true);

  END IF;
END $$;

-- ============================================================================
-- 3. Optimize canva_templates table (if it exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'canva_templates') THEN
    
    -- Add check constraints
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'check_name_not_empty'
      AND conrelid = 'canva_templates'::regclass
    ) THEN
      ALTER TABLE canva_templates
      ADD CONSTRAINT check_name_not_empty CHECK (length(trim(name)) > 0);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'check_category_not_empty'
      AND conrelid = 'canva_templates'::regclass
    ) THEN
      ALTER TABLE canva_templates
      ADD CONSTRAINT check_category_not_empty CHECK (length(trim(product_category)) > 0);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'check_template_id_not_empty'
      AND conrelid = 'canva_templates'::regclass
    ) THEN
      ALTER TABLE canva_templates
      ADD CONSTRAINT check_template_id_not_empty CHECK (length(trim(canva_template_id)) > 0);
    END IF;

    -- Replace separate indexes with composite index
    DROP INDEX IF EXISTS idx_canva_templates_category;
    CREATE INDEX IF NOT EXISTS idx_canva_templates_category_created 
      ON canva_templates(product_category, created_at DESC);

    -- Update RLS policies
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

  END IF;
END $$;

-- ============================================================================
-- 4. Update table statistics
-- ============================================================================

ANALYZE canva_oauth_states;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_designs') THEN
    ANALYZE user_designs;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'canva_templates') THEN
    ANALYZE canva_templates;
  END IF;
END $$;

-- ============================================================================
-- Migration complete!
-- ============================================================================

-- Verify the changes
SELECT 'Optimization migration completed successfully!' as status;
