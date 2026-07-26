-- Lock down webhook_tenant_map to service_role writes only
DROP POLICY IF EXISTS "Users manage own tenant map" ON public.webhook_tenant_map;

CREATE POLICY "Users read own tenant map"
  ON public.webhook_tenant_map
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages tenant map"
  ON public.webhook_tenant_map
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

REVOKE INSERT, UPDATE, DELETE ON public.webhook_tenant_map FROM authenticated, anon;
GRANT SELECT ON public.webhook_tenant_map TO authenticated;
GRANT ALL ON public.webhook_tenant_map TO service_role;

-- Revoke EXECUTE on SECURITY DEFINER functions from public/anon/authenticated.
-- Keep authenticated access for the user-facing RPCs (they auth-check via auth.uid()).
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.redeem_promo_code(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cancel_subscription() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.start_subscription_trial(text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mark_phone_verified(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mark_2fa_completed() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reset_phone_verification() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.redeem_promo_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_subscription() TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_subscription_trial(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_phone_verified(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_2fa_completed() TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_phone_verification() TO authenticated;

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
