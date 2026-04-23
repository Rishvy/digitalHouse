CREATE TABLE public.products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  base_price    NUMERIC(10,2) NOT NULL,
  description   TEXT,
  thumbnail_url TEXT,
  template_id   UUID REFERENCES templates(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
