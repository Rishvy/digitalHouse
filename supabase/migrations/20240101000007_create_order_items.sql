CREATE TABLE public.order_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id       UUID NOT NULL REFERENCES products(id),
  variation_id     UUID REFERENCES product_variations(id),
  quantity         INTEGER NOT NULL,
  unit_price       NUMERIC(10,2) NOT NULL,
  design_state     JSONB,
  print_file_url   TEXT,
  preflight_status preflight_status NOT NULL DEFAULT 'pending',
  preflight_errors JSONB
);
