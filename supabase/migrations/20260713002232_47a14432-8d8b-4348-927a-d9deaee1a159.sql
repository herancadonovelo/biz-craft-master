
-- 1) Ensure subscription-columns protection trigger is attached to profiles
DROP TRIGGER IF EXISTS profiles_protect_subscription_columns ON public.profiles;
CREATE TRIGGER profiles_protect_subscription_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_subscription_columns();

-- Make trigger fn SECURITY INVOKER (it doesn't need elevated privs; runs in trigger context)
ALTER FUNCTION public.protect_subscription_columns() SECURITY INVOKER;
REVOKE ALL ON FUNCTION public.protect_subscription_columns() FROM PUBLIC, anon, authenticated;

-- 2) promo_codes: lock down all client access explicitly. Only SECURITY DEFINER fn redeem_promo_code reads it.
REVOKE ALL ON TABLE public.promo_codes FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.promo_codes TO service_role;

-- Add explicit deny-all policies so any future accidental GRANT still won't expose data via Data API
DROP POLICY IF EXISTS "No client access to promo_codes" ON public.promo_codes;
CREATE POLICY "No client access to promo_codes" ON public.promo_codes
  FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);
