-- Performance indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_production_tracking_order_item_id ON production_tracking(order_item_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_product_variations_product_id ON product_variations(product_id);
