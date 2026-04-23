CREATE MATERIALIZED VIEW daily_revenue_aggregates AS
SELECT
  DATE(created_at AT TIME ZONE 'Asia/Kolkata') AS revenue_date,
  SUM(total_amount)                             AS total_revenue,
  SUM(tax_amount)                               AS total_tax,
  COUNT(*)                                      AS order_count
FROM orders
WHERE status IN ('paid', 'in_production', 'shipped', 'delivered')
GROUP BY DATE(created_at AT TIME ZONE 'Asia/Kolkata');

-- Required for CONCURRENT refresh
CREATE UNIQUE INDEX idx_daily_revenue_date ON daily_revenue_aggregates(revenue_date);

CREATE MATERIALIZED VIEW product_velocity_metrics AS
SELECT
  oi.product_id,
  p.name        AS product_name,
  p.slug        AS product_slug,
  SUM(oi.quantity) AS total_quantity_sold
FROM order_items oi
JOIN products p ON p.id = oi.product_id
GROUP BY oi.product_id, p.name, p.slug;

-- Required for CONCURRENT refresh
CREATE UNIQUE INDEX idx_product_velocity_product_id ON product_velocity_metrics(product_id);
