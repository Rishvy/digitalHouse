-- Seed data for W2P Platform
-- Categories, Templates, Products, and Product Variations

-- ── Product Categories ─────────────────────────────────────────────────────
INSERT INTO public.product_categories (id, name, slug, description) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Business Cards', 'business-cards', 'Professional business cards for networking'),
  ('a0000000-0000-0000-0000-000000000002', 'Flyers', 'flyers', 'Marketing flyers and leaflets for promotions'),
  ('a0000000-0000-0000-0000-000000000003', 'Promotional Items', 'promotional-items', 'Branded promotional merchandise')
ON CONFLICT (slug) DO NOTHING;

-- ── Templates (inserted before products due to FK) ─────────────────────────
INSERT INTO public.templates (id, name, konva_json, width_inches, height_inches, bleed_inches) VALUES
  (
    'b0000000-0000-0000-0000-000000000001',
    'Standard Business Card Template',
    '{"version":"5.2.0","attrs":{"width":252,"height":144},"className":"Stage","children":[{"attrs":{},"className":"Layer","children":[]}]}',
    3.5, 2.0, 0.125
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'A5 Flyer Template',
    '{"version":"5.2.0","attrs":{"width":595,"height":842},"className":"Stage","children":[{"attrs":{},"className":"Layer","children":[]}]}',
    5.83, 8.27, 0.125
  ),
  (
    'b0000000-0000-0000-0000-000000000003',
    'A4 Flyer Template',
    '{"version":"5.2.0","attrs":{"width":794,"height":1123},"className":"Stage","children":[{"attrs":{},"className":"Layer","children":[]}]}',
    8.27, 11.69, 0.125
  ),
  (
    'b0000000-0000-0000-0000-000000000004',
    'Mug Wrap Template',
    '{"version":"5.2.0","attrs":{"width":1000,"height":400},"className":"Stage","children":[{"attrs":{},"className":"Layer","children":[]}]}',
    8.5, 3.75, 0.125
  )
ON CONFLICT (id) DO NOTHING;

-- ── Products ───────────────────────────────────────────────────────────────
INSERT INTO public.products (id, category_id, name, slug, base_price, description, template_id) VALUES
  (
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Standard Business Card',
    'standard-business-card',
    299.00,
    'Classic 3.5x2 inch business card, ideal for professionals',
    'b0000000-0000-0000-0000-000000000001'
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    'A5 Marketing Flyer',
    'a5-marketing-flyer',
    499.00,
    'Vibrant A5 flyer perfect for events and promotions',
    'b0000000-0000-0000-0000-000000000002'
  ),
  (
    'c0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000002',
    'A4 Marketing Flyer',
    'a4-marketing-flyer',
    699.00,
    'Full A4 flyer for maximum visual impact',
    'b0000000-0000-0000-0000-000000000003'
  ),
  (
    'c0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000003',
    'Custom Printed Mug',
    'custom-printed-mug',
    349.00,
    'Personalised ceramic mug with full-colour wrap printing',
    'b0000000-0000-0000-0000-000000000004'
  )
ON CONFLICT (slug) DO NOTHING;

-- ── Product Variations ─────────────────────────────────────────────────────
-- Business Card variations
INSERT INTO public.product_variations (id, product_id, sku, attributes, price_modifier) VALUES
  (
    'd0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'BC-STD-MATTE-100',
    '{"paper_stock": "350gsm Art Card", "lamination": "matte", "quantity": 100}',
    0.00
  ),
  (
    'd0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000001',
    'BC-STD-GLOSS-100',
    '{"paper_stock": "350gsm Art Card", "lamination": "gloss", "quantity": 100}',
    50.00
  ),
  (
    'd0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000001',
    'BC-STD-MATTE-500',
    '{"paper_stock": "350gsm Art Card", "lamination": "matte", "quantity": 500}',
    800.00
  ),
-- A5 Flyer variations
  (
    'd0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000002',
    'FL-A5-MATTE-100',
    '{"paper_stock": "130gsm Gloss", "lamination": "matte", "quantity": 100}',
    0.00
  ),
  (
    'd0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000002',
    'FL-A5-GLOSS-100',
    '{"paper_stock": "130gsm Gloss", "lamination": "gloss", "quantity": 100}',
    75.00
  ),
-- A4 Flyer variations
  (
    'd0000000-0000-0000-0000-000000000006',
    'c0000000-0000-0000-0000-000000000003',
    'FL-A4-MATTE-100',
    '{"paper_stock": "130gsm Gloss", "lamination": "matte", "quantity": 100}',
    0.00
  ),
  (
    'd0000000-0000-0000-0000-000000000007',
    'c0000000-0000-0000-0000-000000000003',
    'FL-A4-GLOSS-250',
    '{"paper_stock": "170gsm Silk", "lamination": "gloss", "quantity": 250}',
    350.00
  ),
-- Mug variations
  (
    'd0000000-0000-0000-0000-000000000008',
    'c0000000-0000-0000-0000-000000000004',
    'MUG-11OZ-WHITE',
    '{"paper_stock": "ceramic", "lamination": "none", "size": "11oz", "colour": "white"}',
    0.00
  ),
  (
    'd0000000-0000-0000-0000-000000000009',
    'c0000000-0000-0000-0000-000000000004',
    'MUG-11OZ-BLACK',
    '{"paper_stock": "ceramic", "lamination": "none", "size": "11oz", "colour": "black"}',
    50.00
  )
ON CONFLICT (sku) DO NOTHING;
