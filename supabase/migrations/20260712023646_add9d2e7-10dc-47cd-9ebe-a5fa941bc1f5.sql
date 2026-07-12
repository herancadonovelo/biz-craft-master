
-- 1) Restrict profiles UPDATE to non-subscription columns
DROP POLICY IF EXISTS "Users manage their own profile" ON public.profiles;

CREATE POLICY "Users select own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- UPDATE allowed but trigger protect_subscription_columns blocks subscription field changes
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2) Lock down SECURITY DEFINER functions: revoke from PUBLIC/anon, grant only where needed
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_subscription_columns() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.cancel_subscription() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.start_subscription_trial(text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.redeem_promo_code(text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.cancel_subscription() TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_subscription_trial(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_promo_code(text) TO authenticated;
