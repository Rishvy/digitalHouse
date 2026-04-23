CREATE TABLE public.users (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone            TEXT,
  gst_number       TEXT,
  billing_address  JSONB,
  shipping_address JSONB,
  role             user_role NOT NULL DEFAULT 'customer',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
