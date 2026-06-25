DO $$ BEGIN
  CREATE TYPE public.billing_cycle AS ENUM ('mensal', 'anual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS billing_cycle public.billing_cycle NOT NULL DEFAULT 'mensal';