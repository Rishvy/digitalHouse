-- Insert storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('templates',         'templates',         true),
  ('customer-uploads',  'customer-uploads',  false),
  ('print-ready-pdfs',  'print-ready-pdfs',  false),
  ('previews',          'previews',          true),
  ('products',          'products',          true)
ON CONFLICT (id) DO NOTHING;

-- templates: admin write only
CREATE POLICY "admin_write_templates_bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'templates'
    AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- customer-uploads: customer read/write own prefix
CREATE POLICY "customer_upload_own_files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'customer-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "customer_read_own_files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'customer-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- print-ready-pdfs: admin only
CREATE POLICY "admin_all_print_ready_pdfs"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'print-ready-pdfs'
    AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- previews: public read, authenticated write only
CREATE POLICY "authenticated_write_previews"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'previews'
    AND auth.uid() IS NOT NULL
  );

-- products: admin write only, public read
CREATE POLICY "admin_write_products_bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'products'
    AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "admin_delete_products_bucket"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'products'
    AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );
