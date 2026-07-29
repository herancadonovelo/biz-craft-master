CREATE TABLE public.paddle_event_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text,
  event_type text,
  environment text NOT NULL DEFAULT 'sandbox',
  signature_verified boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'processado',
  error_message text,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  acknowledged_at timestamptz,
  acknowledged_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX paddle_event_log_created_idx ON public.paddle_event_log (created_at DESC);
CREATE INDEX paddle_event_log_status_idx ON public.paddle_event_log (status);

GRANT SELECT, UPDATE ON public.paddle_event_log TO authenticated;
GRANT ALL ON public.paddle_event_log TO service_role;

ALTER TABLE public.paddle_event_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read paddle event log"
ON public.paddle_event_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins acknowledge paddle event log"
ON public.paddle_event_log FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));