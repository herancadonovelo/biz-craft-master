
-- 1. Protect subscription columns from direct client writes
CREATE OR REPLACE FUNCTION public.protect_subscription_columns()
RETURNS trigger LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('authenticated','anon') THEN
    IF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
       OR NEW.billing_cycle IS DISTINCT FROM OLD.billing_cycle
       OR NEW.subscription_trial_ends IS DISTINCT FROM OLD.subscription_trial_ends THEN
      RAISE EXCEPTION 'Subscription fields can only be modified via server-side functions';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_subscription_columns_trg ON public.profiles;
CREATE TRIGGER protect_subscription_columns_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_subscription_columns();

-- 2. Restrict promo_codes read access — no more broad enumeration
DROP POLICY IF EXISTS "Authenticated can read active promo codes" ON public.promo_codes;
REVOKE SELECT ON public.promo_codes FROM authenticated;

-- 3. Start-trial RPC (server-controlled): allows trial only when not lifetime and no active trial
CREATE OR REPLACE FUNCTION public.start_subscription_trial(_plan text, _cycle text DEFAULT 'mensal')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  current_status text;
  current_trial_ends timestamptz;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF _plan NOT IN ('base','premium') THEN RAISE EXCEPTION 'invalid_plan'; END IF;
  IF _cycle NOT IN ('mensal','anual') THEN RAISE EXCEPTION 'invalid_cycle'; END IF;

  SELECT subscription_status::text, subscription_trial_ends
    INTO current_status, current_trial_ends
    FROM public.profiles WHERE user_id = uid;

  IF current_status = 'premium_vitalicio' THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Já tens acesso vitalício.');
  END IF;
  IF current_trial_ends IS NOT NULL AND current_trial_ends > now() THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Já tens um teste ativo.');
  END IF;

  UPDATE public.profiles
     SET subscription_status = _plan::subscription_plan,
         subscription_trial_ends = now() + interval '14 days',
         billing_cycle = _cycle::billing_cycle
   WHERE user_id = uid;

  RETURN jsonb_build_object('ok', true, 'trial_ends', (now() + interval '14 days'));
END;
$$;

-- 4. Cancel subscription RPC (downgrade to light)
CREATE OR REPLACE FUNCTION public.cancel_subscription()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  UPDATE public.profiles
     SET subscription_status = 'light'::subscription_plan,
         subscription_trial_ends = NULL
   WHERE user_id = uid;
  RETURN jsonb_build_object('ok', true);
END;
$$;

-- 5. Redeem promo code atomically, without exposing the code table
CREATE OR REPLACE FUNCTION public.redeem_promo_code(_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  pc record;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF _code IS NULL OR length(trim(_code)) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Introduz um código.');
  END IF;

  SELECT * INTO pc FROM public.promo_codes
   WHERE lower(code) = lower(trim(_code)) AND active = true
   LIMIT 1;

  IF pc IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Código inválido ou inativo.');
  END IF;
  IF pc.expires_at IS NOT NULL AND pc.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Código expirado.');
  END IF;
  IF EXISTS (SELECT 1 FROM public.promo_redemptions WHERE user_id = uid AND promo_code_id = pc.id) THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Já resgataste este código anteriormente.');
  END IF;

  INSERT INTO public.promo_redemptions (user_id, promo_code_id, code, discount_percent, is_lifetime)
  VALUES (uid, pc.id, pc.code, pc.discount_percent, pc.is_lifetime);

  IF pc.is_lifetime THEN
    UPDATE public.profiles
       SET subscription_status = 'premium_vitalicio'::subscription_plan,
           subscription_trial_ends = NULL
     WHERE user_id = uid;
    RETURN jsonb_build_object('ok', true, 'lifetime', true, 'code', pc.code,
      'message', 'Acesso vitalício ativado com sucesso.');
  END IF;

  RETURN jsonb_build_object('ok', true, 'lifetime', false,
    'discount_percent', pc.discount_percent, 'code', pc.code,
    'message', 'Código aplicado.');
END;
$$;

GRANT EXECUTE ON FUNCTION public.start_subscription_trial(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_subscription() TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_promo_code(text) TO authenticated;
