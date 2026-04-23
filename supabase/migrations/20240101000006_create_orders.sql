CREATE TABLE public.orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.users(id),
  status           order_status NOT NULL,
  total_amount     NUMERIC(12,2) NOT NULL,
  tax_amount       NUMERIC(12,2) NOT NULL,
  gst_number       TEXT,
  payment_id       TEXT,
  payment_method   TEXT,
  shipping_address JSONB NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
