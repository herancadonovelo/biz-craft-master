CREATE OR REPLACE FUNCTION public.reset_phone_verification()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  UPDATE public.profiles
     SET phone_verified = false,
         phone_verified_at = NULL,
         last_2fa_at = NULL
   WHERE user_id = uid;
  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reset_phone_verification() FROM anon;
GRANT EXECUTE ON FUNCTION public.reset_phone_verification() TO authenticated;