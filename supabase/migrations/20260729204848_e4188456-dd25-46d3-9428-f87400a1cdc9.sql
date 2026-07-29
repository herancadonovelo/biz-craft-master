ALTER TABLE public.billing_events REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.billing_events;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;