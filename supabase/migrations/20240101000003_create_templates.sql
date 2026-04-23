CREATE TABLE public.templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  konva_json    TEXT NOT NULL,
  preview_url   TEXT,
  width_inches  NUMERIC(6,3) NOT NULL,
  height_inches NUMERIC(6,3) NOT NULL,
  bleed_inches  NUMERIC(4,3) NOT NULL DEFAULT 0.125,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
