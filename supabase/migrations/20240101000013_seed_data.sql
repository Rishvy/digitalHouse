-- Seed data for W2P Platform
-- Categories, Templates, Products, and Product Variations

-- ── Product Categories ─────────────────────────────────────────────────────
INSERT INTO public.product_categories (id, name, slug, description) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Photo Prints & Memories', 'photo-prints', 'Polaroids, passport photos, albums, and standard prints'),
  ('a0000000-0000-0000-0000-000000000002', 'Wall Art & Decor', 'wall-art', 'Framed prints, posters, and large format wall art'),
  ('a0000000-0000-0000-0000-000000000003', 'Signage & Large Format', 'signage', 'Flex prints, banners, and roll-up standees'),
  ('a0000000-0000-0000-0000-000000000004', 'Custom Merchandise', 'custom-merchandise', 'Ceramic mugs and button pins'),
  ('a0000000-0000-0000-0000-000000000005', 'Stationery & Packaging', 'stationery-packaging', 'Stickers, letterheads, paper bags, and business cards')
ON CONFLICT (slug) DO NOTHING;

-- ── Templates (inserted before products due to FK) ─────────────────────────
INSERT INTO public.templates (id, name, konva_json, width_inches, height_inches, bleed_inches) VALUES
  (
    'b0000000-0000-0000-0000-000000000001',
    'Standard Square Template',
    '{"version":"5.2.0","attrs":{"width":288,"height":288},"className":"Stage","children":[{"attrs":{},"className":"Layer","children":[]}]}',
    4.0, 4.0, 0.125
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'Standard Portrait Template',
    '{"version":"5.2.0","attrs":{"width":288,"height":432},"className":"Stage","children":[{"attrs":{},"className":"Layer","children":[]}]}',
    4.0, 6.0, 0.125
  ),
  (
    'b0000000-0000-0000-0000-000000000003',
    'Standard Landscape Template',
    '{"version":"5.2.0","attrs":{"width":432,"height":288},"className":"Stage","children":[{"attrs":{},"className":"Layer","children":[]}]}',
    6.0, 4.0, 0.125
  )
ON CONFLICT (id) DO NOTHING;

-- ── Products ───────────────────────────────────────────────────────────────
-- Photo Prints & Memories
INSERT INTO public.products (id, category_id, name, slug, base_price, description, template_id) VALUES
  (
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Polaroid Prints',
    'polaroid-prints',
    99.00,
    'Classic white border polaroid-style prints',
    'b0000000-0000-0000-0000-000000000001'
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Passport Size Photos',
    'passport-photos',
    49.00,
    'Sets of 8 or 16 passport size photos',
    'b0000000-0000-0000-0000-000000000002'
  ),
  (
    'c0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'Photo Albums',
    'photo-albums',
    399.00,
    'Softcover and hardcover photo albums',
    'b0000000-0000-0000-0000-000000000001'
  ),
  (
    'c0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'Standard Photos',
    'standard-photos',
    5.00,
    'Standard 4x6 and 5x7 photo prints',
    'b0000000-0000-0000-0000-000000000002'
  ),
-- Wall Art & Decor
  (
    'c0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000002',
    'Framed Prints',
    'framed-prints',
    499.00,
    'Framed prints in A5, A4, A3 sizes with black or white frame',
    'b0000000-0000-0000-0000-000000000002'
  ),
  (
    'c0000000-0000-0000-0000-000000000006',
    'a0000000-0000-0000-0000-000000000002',
    'Posters',
    'posters',
    199.00,
    'Posters in A5, A4, A3 sizes',
    'b0000000-0000-0000-0000-000000000002'
  ),
  (
    'c0000000-0000-0000-0000-000000000007',
    'a0000000-0000-0000-0000-000000000002',
    'Large Format Prints',
    'large-format-prints',
    999.00,
    'Large format prints in A2, A1, A0 sizes',
    'b0000000-0000-0000-0000-000000000002'
  ),
-- Signage & Large Format
  (
    'c0000000-0000-0000-0000-000000000008',
    'a0000000-0000-0000-0000-000000000003',
    'Flex Prints',
    'flex-prints',
    1499.00,
    'Custom dimension flex prints for signage',
    'b0000000-0000-0000-0000-000000000003'
  ),
  (
    'c0000000-0000-0000-0000-000000000009',
    'a0000000-0000-0000-0000-000000000003',
    'Banners',
    'banners',
    899.00,
    'Standard size and custom banners',
    'b0000000-0000-0000-0000-000000000003'
  ),
  (
    'c0000000-0000-0000-0000-000000000010',
    'a0000000-0000-0000-0000-000000000003',
    'Standee / Roll-up Banners',
    'standee-banners',
    2499.00,
    'Portable roll-up standee banners',
    'b0000000-0000-0000-0000-000000000003'
  ),
-- Custom Merchandise
  (
    'c0000000-0000-0000-0000-000000000011',
    'a0000000-0000-0000-0000-000000000004',
    'Ceramic Mugs',
    'ceramic-mugs',
    249.00,
    'Standard 11oz ceramic mugs with inner-color variants',
    'b0000000-0000-0000-0000-000000000001'
  ),
  (
    'c0000000-0000-0000-0000-000000000012',
    'a0000000-0000-0000-0000-000000000004',
    'Button Pins',
    'button-pins',
    49.00,
    'Assorted button pins in 44mm and 58mm diameters',
    'b0000000-0000-0000-0000-000000000001'
  ),
-- Stationery & Packaging
  (
    'c0000000-0000-0000-0000-000000000013',
    'a0000000-0000-0000-0000-000000000005',
    'Stickers',
    'stickers',
    79.00,
    'Die-cut, standard, and transparent vinyl stickers',
    'b0000000-0000-0000-0000-000000000001'
  ),
  (
    'c0000000-0000-0000-0000-000000000014',
    'a0000000-0000-0000-0000-000000000005',
    'Letterheads',
    'letterheads',
    99.00,
    'A4 letterheads on bond paper',
    'b0000000-0000-0000-0000-000000000002'
  ),
  (
    'c0000000-0000-0000-0000-000000000015',
    'a0000000-0000-0000-0000-000000000005',
    'Paper Bags',
    'paper-bags',
    199.00,
    'Custom paper bags in small, medium, large',
    'b0000000-0000-0000-0000-000000000002'
  ),
  (
    'c0000000-0000-0000-0000-000000000016',
    'a0000000-0000-0000-0000-000000000005',
    'Business Cards',
    'business-cards',
    299.00,
    'Premium business cards for bulk orders',
    'b0000000-0000-0000-0000-000000000001'
  )
ON CONFLICT (slug) DO NOTHING;

-- ── Product Variations ─────────────────────────────────────────────────────
-- Polaroid Prints
INSERT INTO public.product_variations (id, product_id, sku, attributes, price_modifier) VALUES
  (
    'd0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'POLAROID-MATTE-100',
    '{"paper_stock": "Premium Matte", "lamination": "matte", "quantity": 100}',
    0.00
  ),
  (
    'd0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000001',
    'POLAROID-GLOSS-100',
    '{"paper_stock": "Glossy", "lamination": "gloss", "quantity": 100}',
    20.00
  ),
-- Passport Photos
  (
    'd0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000002',
    'PASSPORT-MATTE-16',
    '{"paper_stock": "Standard", "lamination": "matte", "quantity": 16}',
    0.00
  ),
  (
    'd0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000002',
    'PASSPORT-MATTE-8',
    '{"paper_stock": "Standard", "lamination": "matte", "quantity": 8}',
    -10.00
  ),
-- Photo Albums
  (
    'd0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000003',
    'ALBUM-SOFT-1',
    '{"paper_stock": "Softcover", "lamination": "matte", "quantity": 1}',
    0.00
  ),
  (
    'd0000000-0000-0000-0000-000000000006',
    'c0000000-0000-0000-0000-000000000003',
    'ALBUM-HARD-1',
    '{"paper_stock": "Hardcover", "lamination": "gloss", "quantity": 1}',
    200.00
  ),
-- Standard Photos
  (
    'd0000000-0000-0000-0000-000000000007',
    'c0000000-0000-0000-0000-000000000004',
    'PHOTO-4X6-1',
    '{"paper_stock": "Glossy", "lamination": "gloss", "quantity": 1, "size": "4x6"}',
    0.00
  ),
  (
    'd0000000-0000-0000-0000-000000000008',
    'c0000000-0000-0000-0000-000000000004',
    'PHOTO-5X7-1',
    '{"paper_stock": "Glossy", "lamination": "gloss", "quantity": 1, "size": "5x7"}',
    2.00
  ),
-- Framed Prints
  (
    'd0000000-0000-0000-0000-000000000009',
    'c0000000-0000-0000-0000-000000000005',
    'FRAMED-A4-BLACK',
    '{"paper_stock": "Premium Print", "lamination": "matte", "size": "A4", "frame_color": "black"}',
    0.00
  ),
  (
    'd0000000-0000-0000-0000-000000000010',
    'c0000000-0000-0000-0000-000000000005',
    'FRAMED-A4-WHITE',
    '{"paper_stock": "Premium Print", "lamination": "matte", "size": "A4", "frame_color": "white"}',
    0.00
  ),
  (
    'd0000000-0000-0000-0000-000000000011',
    'c0000000-0000-0000-0000-000000000005',
    'FRAMED-A3-BLACK',
    '{"paper_stock": "Premium Print", "lamination": "matte", "size": "A3", "frame_color": "black"}',
    300.00
  ),
-- Posters
  (
    'd0000000-0000-0000-0000-000000000012',
    'c0000000-0000-0000-0000-000000000006',
    'POSTER-A4-MATTE',
    '{"paper_stock": "Premium Matte", "lamination": "matte", "size": "A4"}',
    0.00
  ),
  (
    'd0000000-0000-0000-0000-000000000013',
    'c0000000-0000-0000-0000-000000000006',
    'POSTER-A3-MATTE',
    '{"paper_stock": "Premium Matte", "lamination": "matte", "size": "A3"}',
    100.00
  ),
  (
    'd0000000-0000-0000-0000-000000000014',
    'c0000000-0000-0000-0000-000000000006',
    'POSTER-A5-MATTE',
    '{"paper_stock": "Premium Matte", "lamination": "matte", "size": "A5"}',
    -50.00
  ),
-- Large Format Prints
  (
    'd0000000-0000-0000-0000-000000000015',
    'c0000000-0000-0000-0000-000000000007',
    'LARGE-A2',
    '{"paper_stock": "Premium Photo", "lamination": "matte", "size": "A2"}',
    0.00
  ),
  (
    'd0000000-0000-0000-0000-000000000016',
    'c0000000-0000-0000-0000-000000000007',
    'LARGE-A1',
    '{"paper_stock": "Premium Photo", "lamination": "matte", "size": "A1"}',
    500.00
  ),
  (
    'd0000000-0000-0000-0000-000000000017',
    'c0000000-0000-0000-0000-000000000007',
    'LARGE-A0',
    '{"paper_stock": "Premium Photo", "lamination": "matte", "size": "A0"}',
    1000.00
  ),
-- Flex Prints
  (
    'd0000000-0000-0000-0000-000000000018',
    'c0000000-0000-0000-0000-000000000008',
    'FLEX-1SQFT',
    '{"paper_stock": "Flex Material", "lamination": "matte", "quantity": 1, "unit": "sqft"}',
    0.00
  ),
  (
    'd0000000-0000-0000-0000-000000000019',
    'c0000000-0000-0000-0000-000000000008',
    'FLEX-10SQFT',
    '{"paper_stock": "Flex Material", "lamination": "matte", "quantity": 10, "unit": "sqft"}',
    -200.00
  ),
-- Banners
  (
    'd0000000-0000-0000-0000-000000000020',
    'c0000000-0000-0000-0000-000000000009',
    'BANNER-2X6',
    '{"paper_stock": "Vinyl", "lamination": "matte", "size": "2x6"}',
    0.00
  ),
  (
    'd0000000-0000-0000-0000-000000000021',
    'c0000000-0000-0000-0000-000000000009',
    'BANNER-3X8',
    '{"paper_stock": "Vinyl", "lamination": "matte", "size": "3x8"}',
    600.00
  ),
-- Standee Banners
  (
    'd0000000-0000-0000-0000-000000000022',
    'c0000000-0000-0000-0000-000000000010',
    'STANDEE-STD',
    '{"paper_stock": "PVC", "lamination": "matte", "size": "standard"}',
    0.00
  ),
  (
    'd0000000-0000-0000-0000-000000000023',
    'c0000000-0000-0000-0000-000000000010',
    'STANDEE-DELUXE',
    '{"paper_stock": "PVC Premium", "lamination": "gloss", "size": "deluxe"}',
    500.00
  ),
-- Ceramic Mugs
  (
    'd0000000-0000-0000-0000-000000000024',
    'c0000000-0000-0000-0000-000000000011',
    'MUG-11OZ-WHITE',
    '{"paper_stock": "ceramic", "lamination": "none", "size": "11oz", "colour": "white"}',
    0.00
  ),
  (
    'd0000000-0000-0000-0000-000000000025',
    'c0000000-0000-0000-0000-000000000011',
    'MUG-11OZ-BLACK',
    '{"paper_stock": "ceramic", "lamination": "none", "size": "11oz", "colour": "black"}',
    50.00
  ),
-- Button Pins
  (
    'd0000000-0000-0000-0000-000000000026',
    'c0000000-0000-0000-0000-000000000012',
    'PIN-44MM',
    '{"paper_stock": "metal", "lamination": "gloss", "diameter": "44mm"}',
    0.00
  ),
  (
    'd0000000-0000-0000-0000-000000000027',
    'c0000000-0000-0000-0000-000000000012',
    'PIN-58MM',
    '{"paper_stock": "metal", "lamination": "gloss", "diameter": "58mm"}',
    10.00
  ),
-- Stickers
  (
    'd0000000-0000-0000-0000-000000000028',
    'c0000000-0000-0000-0000-000000000013',
    'STICKER-DIECUT',
    '{"paper_stock": "Vinyl", "lamination": "gloss", "type": "die-cut"}',
    0.00
  ),
  (
    'd0000000-0000-0000-0000-000000000029',
    'c0000000-0000-0000-0000-000000000013',
    'STICKER-STANDARD',
    '{"paper_stock": "Vinyl", "lamination": "gloss", "type": "standard"}',
    -10.00
  ),
  (
    'd0000000-0000-0000-0000-000000000030',
    'c0000000-0000-0000-0000-000000000013',
    'STICKER-TRANSPARENT',
    '{"paper_stock": "Transparent Vinyl", "lamination": "gloss", "type": "transparent"}',
    20.00
  ),
-- Letterheads
  (
    'd0000000-0000-0000-0000-000000000031',
    'c0000000-0000-0000-0000-000000000014',
    'LETTERHEAD-STD',
    '{"paper_stock": "Bond Paper", "lamination": "none", "size": "A4"}',
    0.00
  ),
  (
    'd0000000-0000-0000-0000-000000000032',
    'c0000000-0000-0000-0000-000000000014',
    'LETTERHEAD-PREM',
    '{"paper_stock": "Premium Bond", "lamination": "none", "size": "A4"}',
    30.00
  ),
-- Paper Bags
  (
    'd0000000-0000-0000-0000-000000000033',
    'c0000000-0000-0000-0000-000000000015',
    'BAG-SMALL',
    '{"paper_stock": "Kraft Paper", "lamination": "matte", "size": "small"}',
    0.00
  ),
  (
    'd0000000-0000-0000-0000-000000000034',
    'c0000000-0000-0000-0000-000000000015',
    'BAG-MEDIUM',
    '{"paper_stock": "Kraft Paper", "lamination": "matte", "size": "medium"}',
    50.00
  ),
  (
    'd0000000-0000-0000-0000-000000000035',
    'c0000000-0000-0000-0000-000000000015',
    'BAG-LARGE',
    '{"paper_stock": "Kraft Paper", "lamination": "matte", "size": "large"}',
    100.00
  ),
-- Business Cards
  (
    'd0000000-0000-0000-0000-000000000036',
    'c0000000-0000-0000-0000-000000000016',
    'BC-STD-MATTE-100',
    '{"paper_stock": "350gsm Art Card", "lamination": "matte", "quantity": 100}',
    0.00
  ),
  (
    'd0000000-0000-0000-0000-000000000037',
    'c0000000-0000-0000-0000-000000000016',
    'BC-STD-GLOSS-100',
    '{"paper_stock": "350gsm Art Card", "lamination": "gloss", "quantity": 100}',
    50.00
  ),
  (
    'd0000000-0000-0000-0000-000000000038',
    'c0000000-0000-0000-0000-000000000016',
    'BC-STD-MATTE-500',
    '{"paper_stock": "350gsm Art Card", "lamination": "matte", "quantity": 500}',
    800.00
  )
ON CONFLICT (sku) DO NOTHING;
