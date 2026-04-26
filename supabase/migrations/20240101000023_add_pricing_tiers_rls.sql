-- Enable RLS on pricing_tiers table
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;

-- Public read policy: anyone can view pricing tiers
CREATE POLICY "public_read_pricing_tiers"
  ON pricing_tiers FOR SELECT
  USING (true);

-- Admin write policy: admins can insert, update, and delete pricing tiers
CREATE POLICY "admin_all_pricing_tiers"
  ON pricing_tiers FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
