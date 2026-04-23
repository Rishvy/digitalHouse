-- Normalize legacy design_state rows where JSONB stored a JSON string payload.
-- Example bad shape: "\"{...konva json...}\""
-- Target shape: {...konva json...}

CREATE OR REPLACE FUNCTION public.try_parse_jsonb(input_text TEXT)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  parsed JSONB;
BEGIN
  parsed := input_text::jsonb;
  RETURN parsed;
EXCEPTION
  WHEN others THEN
    RETURN NULL;
END;
$$;

UPDATE public.order_items
SET design_state = public.try_parse_jsonb(design_state #>> '{}')
WHERE design_state IS NOT NULL
  AND jsonb_typeof(design_state) = 'string'
  AND public.try_parse_jsonb(design_state #>> '{}') IS NOT NULL
  AND jsonb_typeof(public.try_parse_jsonb(design_state #>> '{}')) IN ('object', 'array');
