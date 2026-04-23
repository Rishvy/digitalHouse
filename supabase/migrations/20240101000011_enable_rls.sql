-- ── users ──────────────────────────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_select_own_user"
  ON users FOR SELECT USING (id = auth.uid());

CREATE POLICY "customer_update_own_user"
  ON users FOR UPDATE USING (id = auth.uid());

CREATE POLICY "admin_all_users"
  ON users FOR ALL
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- ── orders ─────────────────────────────────────────────────────────────────
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_own_orders"
  ON orders FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "customer_insert_orders"
  ON orders FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "customer_update_own_orders"
  ON orders FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "admin_all_orders"
  ON orders FOR ALL
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "production_staff_select_orders"
  ON orders FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'production_staff');

-- ── order_items ────────────────────────────────────────────────────────────
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_own_order_items_select"
  ON order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
  ));

CREATE POLICY "customer_own_order_items_insert"
  ON order_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
  ));

CREATE POLICY "admin_all_order_items"
  ON order_items FOR ALL
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "production_staff_select_order_items"
  ON order_items FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'production_staff');

-- ── product_categories, products, product_variations, templates ────────────
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_categories" ON product_categories FOR SELECT USING (true);
CREATE POLICY "admin_all_categories" ON product_categories FOR ALL
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_products" ON products FOR SELECT USING (true);
CREATE POLICY "admin_all_products" ON products FOR ALL
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

ALTER TABLE product_variations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_variations" ON product_variations FOR SELECT USING (true);
CREATE POLICY "admin_all_variations" ON product_variations FOR ALL
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_templates" ON templates FOR SELECT USING (true);
CREATE POLICY "admin_all_templates" ON templates FOR ALL
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- ── production_tracking ────────────────────────────────────────────────────
ALTER TABLE production_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_production_tracking"
  ON production_tracking FOR ALL
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "production_staff_select_tracking"
  ON production_tracking FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'production_staff');

CREATE POLICY "production_staff_insert_tracking"
  ON production_tracking FOR INSERT
  WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'production_staff');

CREATE POLICY "production_staff_update_tracking"
  ON production_tracking FOR UPDATE
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'production_staff');
