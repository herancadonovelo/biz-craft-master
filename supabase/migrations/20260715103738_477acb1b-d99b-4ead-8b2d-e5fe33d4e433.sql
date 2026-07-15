-- Per-tenant webhook events + tenant mapping
CREATE TABLE public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL CHECK (provider IN ('etsy','whatsapp')),
  external_id text NOT NULL,
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  UNIQUE (user_id, provider, external_id)
);
CREATE INDEX webhook_events_user_pending_idx ON public.webhook_events (user_id, processed_at) WHERE processed_at IS NULL;

GRANT SELECT, UPDATE ON public.webhook_events TO authenticated;
GRANT ALL ON public.webhook_events TO service_role;

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own webhook events" ON public.webhook_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users mark own webhook events processed" ON public.webhook_events
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.webhook_tenant_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL CHECK (provider IN ('etsy','whatsapp')),
  tenant_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, tenant_key)
);
CREATE INDEX webhook_tenant_map_user_idx ON public.webhook_tenant_map (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhook_tenant_map TO authenticated;
GRANT ALL ON public.webhook_tenant_map TO service_role;

ALTER TABLE public.webhook_tenant_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tenant map" ON public.webhook_tenant_map
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER webhook_tenant_map_touch
  BEFORE UPDATE ON public.webhook_tenant_map
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();