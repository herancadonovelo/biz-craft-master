
-- Add phone/2FA columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_2fa_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique
  ON public.profiles(phone) WHERE phone IS NOT NULL;

-- Rate-limit / lockout tracking for OTP flows
CREATE TABLE IF NOT EXISTS public.auth_otp_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('login','enroll','send','verify')),
  success BOOLEAN NOT NULL DEFAULT false,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_otp_attempts_user_created_idx
  ON public.auth_otp_attempts(user_id, created_at DESC);

GRANT SELECT ON public.auth_otp_attempts TO authenticated;
GRANT ALL ON public.auth_otp_attempts TO service_role;

ALTER TABLE public.auth_otp_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own attempts readable"
  ON public.auth_otp_attempts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- RPC: mark the caller's phone as verified
CREATE OR REPLACE FUNCTION public.mark_phone_verified(_phone TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF _phone IS NULL OR _phone !~ '^\+[1-9][0-9]{6,14}$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'phone_invalid_format');
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE phone = _phone AND user_id <> uid) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'phone_already_taken');
  END IF;

  UPDATE public.profiles
     SET phone = _phone,
         phone_verified = true,
         phone_verified_at = now(),
         last_2fa_at = now()
   WHERE user_id = uid;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.mark_phone_verified(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_phone_verified(TEXT) TO authenticated;

-- RPC: mark that the caller just completed a 2FA challenge in this session
CREATE OR REPLACE FUNCTION public.mark_2fa_completed()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  UPDATE public.profiles SET last_2fa_at = now() WHERE user_id = uid;
  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.mark_2fa_completed() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_2fa_completed() TO authenticated;
