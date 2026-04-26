-- Create pricing_tiers table for quantity-based pricing
CREATE TABLE public.pricing_tiers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variation_id  UUID REFERENCES product_variations(id) ON DELETE CASCADE,
  min_quantity  INTEGER NOT NULL CHECK (min_quantity > 0),
  max_quantity  INTEGER CHECK (max_quantity IS NULL OR max_quantity >= min_quantity),
  unit_price    NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, variation_id, min_quantity)
);

-- Create indexes for performance
CREATE INDEX idx_pricing_tiers_product_id ON pricing_tiers(product_id);
CREATE INDEX idx_pricing_tiers_variation_id ON pricing_tiers(variation_id);
