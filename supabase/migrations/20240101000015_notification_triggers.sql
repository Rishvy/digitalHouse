CREATE TABLE IF NOT EXISTS public.notification_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  channel     TEXT NOT NULL,
  provider    TEXT NOT NULL,
  payload     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  event_name  TEXT NOT NULL,
  payload     JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY notification_logs_service_access
  ON public.notification_logs
  FOR ALL
  USING ((auth.jwt() ->> 'role') = 'service_role' OR (auth.jwt() ->> 'role') = 'authenticated');

CREATE POLICY notification_events_service_access
  ON public.notification_events
  FOR ALL
  USING ((auth.jwt() ->> 'role') = 'service_role' OR (auth.jwt() ->> 'role') = 'authenticated');

CREATE OR REPLACE FUNCTION public.capture_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notification_events (order_id, event_name, payload)
    VALUES (
      NEW.id,
      'orders.status.changed',
      jsonb_build_object(
        'order_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'payment_method', NEW.payment_method
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_capture_order_status_change ON public.orders;
CREATE TRIGGER trg_capture_order_status_change
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.capture_order_status_change();
