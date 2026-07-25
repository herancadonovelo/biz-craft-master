-- Restrict EXECUTE on SECURITY DEFINER functions to only the roles that need them.
-- Trigger helpers should never be executable directly by clients.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_subscription_columns() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

-- User-facing RPCs: revoke from PUBLIC/anon; keep only authenticated.
REVOKE ALL ON FUNCTION public.cancel_subscription() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_subscription() TO authenticated;

REVOKE ALL ON FUNCTION public.start_subscription_trial(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_subscription_trial(text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.redeem_promo_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_promo_code(text) TO authenticated;