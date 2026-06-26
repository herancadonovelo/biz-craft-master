
ALTER TYPE public.subscription_plan ADD VALUE IF NOT EXISTS 'premium_vitalicio';

CREATE TABLE IF NOT EXISTS public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_percent integer NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  is_lifetime boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.promo_codes TO authenticated;
GRANT ALL ON public.promo_codes TO service_role;

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read active promo codes"
  ON public.promo_codes FOR SELECT
  TO authenticated
  USING (active = true);

CREATE TRIGGER promo_codes_touch_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.promo_codes (code, discount_percent, is_lifetime, active)
VALUES
  ('PROMO10', 10, false, true),
  ('MEU_ACESSO_VITALICIO', 100, true, true)
ON CONFLICT (code) DO NOTHING;
