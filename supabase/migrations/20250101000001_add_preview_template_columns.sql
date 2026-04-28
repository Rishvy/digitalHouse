-- Add preview template and dimensions to products table

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS preview_template_url TEXT,
ADD COLUMN IF NOT EXISTS print_width_inches NUMERIC(6,3),
ADD COLUMN IF NOT EXISTS print_height_inches NUMERIC(6,3);