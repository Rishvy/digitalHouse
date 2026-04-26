-- Create function to find applicable quantity bracket based on selected quantity
-- This function returns the most specific pricing tier for a given product, variation, and quantity
-- When multiple tiers match, it selects the one with the highest min_quantity (most specific)

CREATE OR REPLACE FUNCTION public.find_pricing_tier(
  p_product_id UUID,
  p_variation_id UUID,
  p_quantity INTEGER
)
RETURNS TABLE (
  tier_id UUID,
  product_id UUID,
  variation_id UUID,
  min_quantity INTEGER,
  max_quantity INTEGER,
  unit_price NUMERIC(10,2)
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pt.id AS tier_id,
    pt.product_id,
    pt.variation_id,
    pt.min_quantity,
    pt.max_quantity,
    pt.unit_price
  FROM public.pricing_tiers pt
  WHERE pt.product_id = p_product_id
    AND (pt.variation_id = p_variation_id OR (pt.variation_id IS NULL AND p_variation_id IS NULL))
    AND p_quantity >= pt.min_quantity
    AND (pt.max_quantity IS NULL OR p_quantity <= pt.max_quantity)
  ORDER BY pt.min_quantity DESC
  LIMIT 1;
END;
$$;

-- Add comment explaining the function
COMMENT ON FUNCTION public.find_pricing_tier(UUID, UUID, INTEGER) IS 
'Finds the applicable pricing tier for a product based on quantity. Returns the most specific tier (highest min_quantity) when multiple tiers match.';
