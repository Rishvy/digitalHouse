-- Create table for storing Canva template metadata
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS canva_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canva_template_id TEXT NOT NULL UNIQUE, -- Extracted from Canva template URL
  canva_template_url TEXT NOT NULL, -- Original Canva template URL
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT, -- URL to thumbnail in Supabase Storage
  product_category TEXT NOT NULL, -- e.g., 'business_cards', 'flyers', 'posters'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Add check constraints for data validation
  CONSTRAINT check_name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT check_category_not_empty CHECK (length(trim(product_category)) > 0),
  CONSTRAINT check_template_id_not_empty CHECK (length(trim(canva_template_id)) > 0)
);

-- Composite index for category filtering with sorting by created_at
-- This is more efficient than separate indexes when you filter by category and sort
CREATE INDEX IF NOT EXISTS idx_canva_templates_category_created 
  ON canva_templates(product_category, created_at DESC);

-- Index for template ID lookup (already unique, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_canva_templates_template_id ON canva_templates(canva_template_id);

-- Enable RLS
ALTER TABLE canva_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read templates (public catalog)
-- Using SELECT wrapper for better RLS performance
DROP POLICY IF EXISTS "Anyone can read templates" ON canva_templates;
CREATE POLICY "Anyone can read templates" 
  ON canva_templates 
  FOR SELECT 
  USING (true);

-- Policy: Service role can manage all templates (for admin operations)
DROP POLICY IF EXISTS "Service role can manage templates" ON canva_templates;
CREATE POLICY "Service role can manage templates" 
  ON canva_templates 
  FOR ALL 
  TO service_role
  USING (true);

-- Create storage bucket for template thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('canva-template-thumbnails', 'canva-template-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Anyone can read thumbnails
DROP POLICY IF EXISTS "Anyone can read template thumbnails" ON storage.objects;
CREATE POLICY "Anyone can read template thumbnails"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'canva-template-thumbnails');

-- Storage policy: Service role can upload thumbnails
DROP POLICY IF EXISTS "Service role can upload template thumbnails" ON storage.objects;
CREATE POLICY "Service role can upload template thumbnails"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'canva-template-thumbnails');

-- Storage policy: Service role can update thumbnails
DROP POLICY IF EXISTS "Service role can update template thumbnails" ON storage.objects;
CREATE POLICY "Service role can update template thumbnails"
  ON storage.objects FOR UPDATE
  TO service_role
  USING (bucket_id = 'canva-template-thumbnails');

-- Storage policy: Service role can delete thumbnails
DROP POLICY IF EXISTS "Service role can delete template thumbnails" ON storage.objects;
CREATE POLICY "Service role can delete template thumbnails"
  ON storage.objects FOR DELETE
  TO service_role
  USING (bucket_id = 'canva-template-thumbnails');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_canva_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_canva_templates_updated_at ON canva_templates;
CREATE TRIGGER trigger_update_canva_templates_updated_at
  BEFORE UPDATE ON canva_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_canva_templates_updated_at();
