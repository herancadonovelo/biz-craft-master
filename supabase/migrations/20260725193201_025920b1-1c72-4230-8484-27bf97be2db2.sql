REVOKE EXECUTE ON FUNCTION public.cancel_subscription() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.start_subscription_trial(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.redeem_promo_code(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_subscription() TO service_role;
GRANT EXECUTE ON FUNCTION public.start_subscription_trial(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.redeem_promo_code(text) TO service_role;