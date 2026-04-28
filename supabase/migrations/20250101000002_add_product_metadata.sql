-- Add metadata JSONB column to products for storing product configuration

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.products.metadata IS 'Stores product configuration: pricing_model, use_quantity_options, quantity_type, variant_toggles, design_rules, etc.';
