
ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS max_redemptions integer;

INSERT INTO public.promo_codes (code, discount_percent, is_lifetime, active, max_redemptions)
VALUES ('252115406SARAAFONSOADMIN', 100, true, true, 1)
ON CONFLICT (code) DO UPDATE
  SET is_lifetime = EXCLUDED.is_lifetime,
      discount_percent = EXCLUDED.discount_percent,
      active = EXCLUDED.active,
      max_redemptions = EXCLUDED.max_redemptions;

CREATE OR REPLACE FUNCTION public.redeem_promo_code(_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  pc record;
  used_count integer;
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

  IF pc.max_redemptions IS NOT NULL THEN
    SELECT count(*) INTO used_count FROM public.promo_redemptions WHERE promo_code_id = pc.id;
    IF used_count >= pc.max_redemptions THEN
      RETURN jsonb_build_object('ok', false, 'message', 'Este código já foi ativado por outro utilizador e não pode ser reutilizado.');
    END IF;
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
$function$;
