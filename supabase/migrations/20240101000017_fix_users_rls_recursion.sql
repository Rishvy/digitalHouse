-- Fix recursive RLS checks by moving role lookup into SECURITY DEFINER functions.

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.users
  WHERE id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_role() = 'admin';
$$;

CREATE OR REPLACE FUNCTION public.is_production_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_role() = 'production_staff';
$$;

GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_production_staff() TO authenticated, anon;

DROP POLICY IF EXISTS "admin_all_users" ON users;
CREATE POLICY "admin_all_users"
  ON users FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_all_orders" ON orders;
CREATE POLICY "admin_all_orders"
  ON orders FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "production_staff_select_orders" ON orders;
CREATE POLICY "production_staff_select_orders"
  ON orders FOR SELECT
  USING (public.is_production_staff());

DROP POLICY IF EXISTS "admin_all_order_items" ON order_items;
CREATE POLICY "admin_all_order_items"
  ON order_items FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "production_staff_select_order_items" ON order_items;
CREATE POLICY "production_staff_select_order_items"
  ON order_items FOR SELECT
  USING (public.is_production_staff());

DROP POLICY IF EXISTS "admin_all_categories" ON product_categories;
CREATE POLICY "admin_all_categories"
  ON product_categories FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_all_products" ON products;
CREATE POLICY "admin_all_products"
  ON products FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_all_variations" ON product_variations;
CREATE POLICY "admin_all_variations"
  ON product_variations FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_all_templates" ON templates;
CREATE POLICY "admin_all_templates"
  ON templates FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_all_production_tracking" ON production_tracking;
CREATE POLICY "admin_all_production_tracking"
  ON production_tracking FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "production_staff_select_tracking" ON production_tracking;
CREATE POLICY "production_staff_select_tracking"
  ON production_tracking FOR SELECT
  USING (public.is_production_staff());

DROP POLICY IF EXISTS "production_staff_insert_tracking" ON production_tracking;
CREATE POLICY "production_staff_insert_tracking"
  ON production_tracking FOR INSERT
  WITH CHECK (public.is_production_staff());

DROP POLICY IF EXISTS "production_staff_update_tracking" ON production_tracking;
CREATE POLICY "production_staff_update_tracking"
  ON production_tracking FOR UPDATE
  USING (public.is_production_staff())
  WITH CHECK (public.is_production_staff());
