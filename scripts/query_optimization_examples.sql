-- Query Optimization Examples
-- Demonstrates how to write efficient queries using the optimized schema

-- ============================================================================
-- 1. Efficient OAuth State Queries
-- ============================================================================

-- ❌ BAD: Full table scan
SELECT * FROM canva_oauth_states WHERE state = 'abc123';

-- ✅ GOOD: Uses unique index on state
SELECT * FROM canva_oauth_states WHERE state = 'abc123';
-- Note: This is actually good because state has a unique index

-- ❌ BAD: Queries expired states (not in partial index)
SELECT * FROM canva_oauth_states WHERE expires_at < NOW();

-- ✅ GOOD: Queries active states (uses partial index)
SELECT * FROM canva_oauth_states WHERE expires_at > NOW();

-- ✅ GOOD: User's active OAuth states (uses user_id index + partial index)
SELECT * FROM canva_oauth_states 
WHERE user_id = 'user-uuid-here' 
  AND expires_at > NOW();

-- ✅ GOOD: Join with templates (uses foreign key index)
SELECT 
  os.state,
  os.expires_at,
  t.name as template_name,
  t.product_category
FROM canva_oauth_states os
LEFT JOIN canva_templates t ON os.template_id = t.id
WHERE os.user_id = 'user-uuid-here'
  AND os.expires_at > NOW();

-- ============================================================================
-- 2. Efficient Template Queries
-- ============================================================================

-- ❌ BAD: Separate filter and sort (uses 2 indexes)
SELECT * FROM canva_templates 
WHERE product_category = 'business_cards'
ORDER BY created_at DESC;
-- Old schema would use idx_canva_templates_category then sort

-- ✅ GOOD: Uses composite index (single index scan, no sort needed)
SELECT * FROM canva_templates 
WHERE product_category = 'business_cards'
ORDER BY created_at DESC
LIMIT 20;
-- Uses idx_canva_templates_category_created efficiently

-- ✅ GOOD: Pagination with composite index
SELECT * FROM canva_templates 
WHERE product_category = 'business_cards'
  AND created_at < '2026-04-01'  -- Cursor from previous page
ORDER BY created_at DESC
LIMIT 20;

-- ✅ GOOD: Count by category (uses composite index)
SELECT product_category, COUNT(*) 
FROM canva_templates 
GROUP BY product_category;

-- ✅ GOOD: Search by template ID (uses unique index)
SELECT * FROM canva_templates 
WHERE canva_template_id = 'template-123';

-- ============================================================================
-- 3. Efficient Joins
-- ============================================================================

-- ✅ GOOD: Find templates used in active OAuth flows
SELECT 
  t.name,
  t.product_category,
  COUNT(os.id) as active_oauth_count
FROM canva_templates t
LEFT JOIN canva_oauth_states os ON t.id = os.template_id
WHERE os.expires_at > NOW() OR os.expires_at IS NULL
GROUP BY t.id, t.name, t.product_category
ORDER BY active_oauth_count DESC;

-- ✅ GOOD: User's OAuth states with template details
SELECT 
  os.state,
  os.created_at,
  os.expires_at,
  t.name as template_name,
  t.thumbnail_url
FROM canva_oauth_states os
LEFT JOIN canva_templates t ON os.template_id = t.id
WHERE os.user_id = 'user-uuid-here'
  AND os.expires_at > NOW()
ORDER BY os.created_at DESC;

-- ============================================================================
-- 4. Efficient Cleanup and Maintenance
-- ============================================================================

-- ✅ GOOD: Manual cleanup (if needed)
DELETE FROM canva_oauth_states WHERE expires_at < NOW();
-- Uses partial index to find expired states efficiently

-- ✅ GOOD: Check for states expiring soon
SELECT COUNT(*) 
FROM canva_oauth_states 
WHERE expires_at BETWEEN NOW() AND NOW() + INTERVAL '1 hour';

-- ✅ GOOD: Find orphaned OAuth states (no template)
SELECT * FROM canva_oauth_states 
WHERE template_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM canva_templates WHERE id = canva_oauth_states.template_id
  );

-- ============================================================================
-- 5. Performance Monitoring Queries
-- ============================================================================

-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN ('canva_oauth_states', 'canva_templates')
ORDER BY idx_scan DESC;

-- Check table statistics
SELECT
  relname as table_name,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND relname IN ('canva_oauth_states', 'canva_templates');

-- Check slow queries (requires pg_stat_statements extension)
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE query LIKE '%canva_%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- ============================================================================
-- 6. EXPLAIN ANALYZE Examples
-- ============================================================================

-- Always use EXPLAIN ANALYZE to verify query plans
-- This shows actual execution time and confirms index usage

-- Example 1: Verify composite index usage
EXPLAIN ANALYZE
SELECT * FROM canva_templates 
WHERE product_category = 'business_cards'
ORDER BY created_at DESC
LIMIT 20;
-- Should show: Index Scan using idx_canva_templates_category_created

-- Example 2: Verify partial index usage
EXPLAIN ANALYZE
SELECT * FROM canva_oauth_states 
WHERE expires_at > NOW();
-- Should show: Index Scan using idx_canva_oauth_states_active

-- Example 3: Verify foreign key index usage
EXPLAIN ANALYZE
SELECT * FROM canva_oauth_states 
WHERE template_id = 'some-uuid';
-- Should show: Index Scan using idx_canva_oauth_states_template_id

-- Example 4: Verify RLS policy performance
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-uuid-here';
EXPLAIN ANALYZE
SELECT * FROM canva_oauth_states 
WHERE user_id = 'user-uuid-here';
-- Should show efficient index usage with RLS policy

-- ============================================================================
-- 7. Common Anti-Patterns to Avoid
-- ============================================================================

-- ❌ BAD: SELECT * when you only need specific columns
SELECT * FROM canva_templates WHERE product_category = 'business_cards';

-- ✅ GOOD: Select only needed columns
SELECT id, name, thumbnail_url FROM canva_templates 
WHERE product_category = 'business_cards';

-- ❌ BAD: Using OFFSET for pagination (slow on large offsets)
SELECT * FROM canva_templates 
ORDER BY created_at DESC
LIMIT 20 OFFSET 1000;  -- Scans and discards 1000 rows

-- ✅ GOOD: Cursor-based pagination
SELECT * FROM canva_templates 
WHERE created_at < '2026-04-01'  -- Last created_at from previous page
ORDER BY created_at DESC
LIMIT 20;

-- ❌ BAD: Multiple separate queries (N+1 problem)
-- SELECT * FROM canva_oauth_states WHERE user_id = 'user-uuid';
-- Then for each state: SELECT * FROM canva_templates WHERE id = template_id;

-- ✅ GOOD: Single query with JOIN
SELECT 
  os.*,
  t.name,
  t.thumbnail_url
FROM canva_oauth_states os
LEFT JOIN canva_templates t ON os.template_id = t.id
WHERE os.user_id = 'user-uuid';

-- ❌ BAD: Using OR with different columns (can't use indexes efficiently)
SELECT * FROM canva_templates 
WHERE product_category = 'business_cards' OR name LIKE '%card%';

-- ✅ GOOD: Use UNION if you need OR logic
SELECT * FROM canva_templates WHERE product_category = 'business_cards'
UNION
SELECT * FROM canva_templates WHERE name LIKE '%card%';

-- ============================================================================
-- 8. Batch Operations
-- ============================================================================

-- ✅ GOOD: Batch insert OAuth states
INSERT INTO canva_oauth_states (state, code_verifier, user_id, expires_at)
VALUES
  ('state1', 'verifier1', 'user-uuid-1', NOW() + INTERVAL '10 minutes'),
  ('state2', 'verifier2', 'user-uuid-2', NOW() + INTERVAL '10 minutes'),
  ('state3', 'verifier3', 'user-uuid-3', NOW() + INTERVAL '10 minutes');

-- ✅ GOOD: Batch insert templates
INSERT INTO canva_templates (canva_template_id, canva_template_url, name, product_category)
VALUES
  ('template1', 'https://canva.com/1', 'Business Card 1', 'business_cards'),
  ('template2', 'https://canva.com/2', 'Business Card 2', 'business_cards'),
  ('template3', 'https://canva.com/3', 'Flyer 1', 'flyers')
ON CONFLICT (canva_template_id) DO UPDATE
SET 
  name = EXCLUDED.name,
  canva_template_url = EXCLUDED.canva_template_url,
  updated_at = NOW();

-- ============================================================================
-- 9. Transaction Best Practices
-- ============================================================================

-- ✅ GOOD: Keep transactions short
BEGIN;
  INSERT INTO canva_oauth_states (state, code_verifier, user_id, expires_at)
  VALUES ('state', 'verifier', 'user-uuid', NOW() + INTERVAL '10 minutes');
COMMIT;

-- ✅ GOOD: Use RETURNING to get inserted data
INSERT INTO canva_templates (canva_template_id, canva_template_url, name, product_category)
VALUES ('template-new', 'https://canva.com/new', 'New Template', 'business_cards')
RETURNING id, created_at;

-- ============================================================================
-- 10. Useful Maintenance Commands
-- ============================================================================

-- Update table statistics (run after large data changes)
ANALYZE canva_oauth_states;
ANALYZE canva_templates;

-- Check table and index sizes
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('canva_oauth_states', 'canva_templates');

-- Manually vacuum if needed (usually autovacuum handles this)
VACUUM ANALYZE canva_oauth_states;
VACUUM ANALYZE canva_templates;
