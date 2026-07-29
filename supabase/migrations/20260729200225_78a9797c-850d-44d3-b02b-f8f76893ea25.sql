CREATE TABLE public.billing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  paddle_subscription_id text,
  product_id text,
  price_id text,
  status text,
  amount_cents integer,
  currency text,
  environment text NOT NULL DEFAULT 'sandbox',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_billing_events_user ON public.billing_events(user_id, occurred_at DESC);
CREATE INDEX idx_billing_events_env ON public.billing_events(environment);

GRANT SELECT ON public.billing_events TO authenticated;
GRANT ALL ON public.billing_events TO service_role;

ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own billing events"
  ON public.billing_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages billing events"
  ON public.billing_events FOR ALL TO service_role
  USING (true) WITH CHECK (true);