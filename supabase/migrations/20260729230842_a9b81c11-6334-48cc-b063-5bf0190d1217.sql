CREATE TABLE IF NOT EXISTS public.paddle_webhook_events (
  event_id text PRIMARY KEY,
  event_type text,
  environment text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.paddle_webhook_events TO service_role;
ALTER TABLE public.paddle_webhook_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service role manages webhook events" ON public.paddle_webhook_events;
CREATE POLICY "service role manages webhook events"
  ON public.paddle_webhook_events FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Downgrade automático: acesso pago/teste que já expirou volta a Light.
CREATE OR REPLACE FUNCTION public.reconcile_expired_access()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE affected integer;
BEGIN
  WITH downgraded AS (
    UPDATE public.profiles p
       SET subscription_status = 'light'::subscription_plan,
           subscription_trial_ends = NULL
     WHERE p.subscription_status NOT IN ('light'::subscription_plan, 'premium_vitalicio'::subscription_plan)
       AND (p.subscription_trial_ends IS NULL OR p.subscription_trial_ends <= now())
       AND NOT public.has_active_subscription(p.user_id, 'live')
       AND NOT public.has_active_subscription(p.user_id, 'sandbox')
    RETURNING 1
  )
  SELECT count(*) INTO affected FROM downgraded;
  RETURN affected;
END;
$$;

REVOKE ALL ON FUNCTION public.reconcile_expired_access() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_expired_access() TO service_role;

CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  PERFORM cron.unschedule('reconcile-expired-access');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'reconcile-expired-access',
  '0 3 * * *',
  $cron$ SELECT public.reconcile_expired_access(); $cron$
);