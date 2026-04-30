-- Quick fix for migration conflicts
-- Run this in Supabase SQL Editor to resolve the policy conflicts

-- ============================================================================
-- Fix user_designs policies (drop and recreate with optimizations)
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own designs" ON user_designs;
DROP POLICY IF EXISTS "Users can insert their own designs" ON user_designs;
DROP POLICY IF EXISTS "Users can update their own designs" ON user_designs;
DROP POLICY IF EXISTS "Users can delete their own designs" ON user_designs;
DROP POLICY IF EXISTS "Service role has full access to user_designs" ON user_designs;

-- Recreate with optimized RLS (using SELECT wrapper)
CREATE POLICY "Users can view their own designs"
  ON user_designs
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own designs"
  ON user_designs
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own designs"
  ON user_designs
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own designs"
  ON user_designs
  FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Service role has full access to user_designs"
  ON user_designs
  FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- Now you can safely run the optimization migration
-- ============================================================================

SELECT 'Policies fixed! Now run: supabase db push' as next_step;
