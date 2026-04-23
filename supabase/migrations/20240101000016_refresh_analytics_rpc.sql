CREATE OR REPLACE FUNCTION public.refresh_analytics_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW daily_revenue_aggregates;
  REFRESH MATERIALIZED VIEW product_velocity_metrics;
END;
$$;
