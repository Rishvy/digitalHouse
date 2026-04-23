-- Add products storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- products: admin write/delete only, public read
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
