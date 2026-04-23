CREATE TABLE IF NOT EXISTS public.webhook_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider          TEXT NOT NULL,
  external_event_id TEXT NOT NULL,
  event_type        TEXT NOT NULL,
  payload           JSONB NOT NULL,
  received_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, external_event_id)
);

CREATE TABLE IF NOT EXISTS public.job_failures (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  event_name    TEXT NOT NULL,
  payload       JSONB NOT NULL,
  error_message TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY webhook_events_admin_access
  ON public.webhook_events
  FOR ALL
  USING ((auth.jwt() ->> 'role') = 'service_role' OR (auth.jwt() ->> 'role') = 'authenticated');

CREATE POLICY job_failures_admin_access
  ON public.job_failures
  FOR ALL
  USING ((auth.jwt() ->> 'role') = 'service_role' OR (auth.jwt() ->> 'role') = 'authenticated');
