-- 1) Papéis de utilizador (nunca no perfil, para evitar escalamento de privilégios)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users
WHERE email IN ('craftbusinessmaster@gmail.com', 'siuk0017@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

-- 2) Histórico de reembolsos e cancelamentos
CREATE TABLE IF NOT EXISTS public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paddle_subscription_id text,
  paddle_transaction_id text,
  paddle_adjustment_id text,
  kind text NOT NULL CHECK (kind IN ('reembolso_total', 'reembolso_parcial', 'cancelamento')),
  amount_cents integer NOT NULL DEFAULT 0 CHECK (amount_cents >= 0),
  currency text NOT NULL DEFAULT 'EUR',
  reason_code text NOT NULL CHECK (reason_code IN (
    'duplicado', 'cobranca_indevida', 'insatisfacao', 'problema_tecnico',
    'pedido_cliente', 'fraude_disputa', 'outro'
  )),
  reason_note text,
  status text NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'aprovado', 'recusado', 'concluido')),
  environment text NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'live')),
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  confirmed_at timestamptz,
  accounted_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refunds_user ON public.refunds(user_id);
CREATE INDEX IF NOT EXISTS idx_refunds_txn ON public.refunds(paddle_transaction_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_refunds_adjustment
  ON public.refunds(paddle_adjustment_id) WHERE paddle_adjustment_id IS NOT NULL;

GRANT SELECT ON public.refunds TO authenticated;
GRANT ALL ON public.refunds TO service_role;

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own refunds"
  ON public.refunds FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages refunds"
  ON public.refunds FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER refunds_touch_updated_at
  BEFORE UPDATE ON public.refunds
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3) Quanto ainda pode ser reembolsado numa transação (em cêntimos)
CREATE OR REPLACE FUNCTION public.refunded_cents_for_transaction(_txn_id text, _env text)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(amount_cents), 0)::integer
  FROM public.refunds
  WHERE paddle_transaction_id = _txn_id
    AND environment = _env
    AND kind IN ('reembolso_total', 'reembolso_parcial')
    AND status IN ('pendente', 'aprovado', 'concluido')
$$;

REVOKE ALL ON FUNCTION public.refunded_cents_for_transaction(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.refunded_cents_for_transaction(text, text) TO authenticated, service_role;