CREATE TABLE public.product_variations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  attributes     JSONB NOT NULL,
  price_modifier NUMERIC(10,2) NOT NULL,
  sku            TEXT UNIQUE NOT NULL
);
