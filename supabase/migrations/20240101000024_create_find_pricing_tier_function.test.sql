-- Manual test queries for find_pricing_tier function
-- Run these queries after applying the migration to verify the function works correctly

-- Setup: Create test data
-- Note: Replace UUIDs with actual values from your database or use these test inserts

-- Insert test product
INSERT INTO products (id, name, slug, description, base_price, category_id)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Test Business Cards',
  'test-business-cards',
  'Test product for pricing tier function',
  10.00,
  (SELECT id FROM product_categories LIMIT 1)
) ON CONFLICT (id) DO NOTHING;

-- Insert test variation
INSERT INTO product_variations (id, product_id, attributes, price_modifier, sku)
VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  '{"finish": "Premium"}'::jsonb,
  5.00,
  'TEST-VAR-001'
) ON CONFLICT (id) DO NOTHING;

-- Insert test pricing tiers
INSERT INTO pricing_tiers (product_id, variation_id, min_quantity, max_quantity, unit_price)
VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000002'::uuid, 1, 49, 10.00),
  ('00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000002'::uuid, 50, 99, 8.00),
  ('00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000002'::uuid, 100, 499, 6.00),
  ('00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000002'::uuid, 500, NULL, 5.00)
ON CONFLICT DO NOTHING;

-- Test 1: Find tier for quantity in first bracket (1-49)
-- Expected: min_quantity=1, max_quantity=49, unit_price=10.00
SELECT * FROM find_pricing_tier(
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  25
);

-- Test 2: Find tier for quantity at bracket boundary (exactly 50)
-- Expected: min_quantity=50, max_quantity=99, unit_price=8.00
SELECT * FROM find_pricing_tier(
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  50
);

-- Test 3: Find tier for quantity in middle bracket
-- Expected: min_quantity=100, max_quantity=499, unit_price=6.00
SELECT * FROM find_pricing_tier(
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  250
);

-- Test 4: Find tier for quantity in open-ended bracket (500+)
-- Expected: min_quantity=500, max_quantity=NULL, unit_price=5.00
SELECT * FROM find_pricing_tier(
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  1000
);

-- Test 5: Test with NULL variation_id
-- First insert a tier without variation
INSERT INTO pricing_tiers (product_id, variation_id, min_quantity, max_quantity, unit_price)
VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, NULL, 1, NULL, 12.00)
ON CONFLICT DO NOTHING;

-- Expected: variation_id=NULL, unit_price=12.00
SELECT * FROM find_pricing_tier(
  '00000000-0000-0000-0000-000000000001'::uuid,
  NULL,
  100
);

-- Test 6: Test most specific tier selection (overlapping brackets)
-- Insert an overlapping tier with higher min_quantity
INSERT INTO pricing_tiers (product_id, variation_id, min_quantity, max_quantity, unit_price)
VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000002'::uuid, 75, 99, 7.50)
ON CONFLICT DO NOTHING;

-- For quantity 80, both the 50-99 tier and 75-99 tier match
-- Expected: min_quantity=75 (most specific), unit_price=7.50
SELECT * FROM find_pricing_tier(
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  80
);

-- Test 7: Test no matching tier (quantity below minimum)
-- Expected: Empty result set
SELECT * FROM find_pricing_tier(
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  0
);

-- Cleanup (optional)
-- DELETE FROM pricing_tiers WHERE product_id = '00000000-0000-0000-0000-000000000001'::uuid;
-- DELETE FROM product_variations WHERE id = '00000000-0000-0000-0000-000000000002'::uuid;
-- DELETE FROM products WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
