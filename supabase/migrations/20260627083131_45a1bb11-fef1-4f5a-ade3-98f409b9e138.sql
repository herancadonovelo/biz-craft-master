CREATE TABLE public.session_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  reason TEXT,
  path TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX session_events_user_created_idx ON public.session_events (user_id, created_at DESC);
CREATE INDEX session_events_type_created_idx ON public.session_events (event_type, created_at DESC);
GRANT SELECT, INSERT ON public.session_events TO authenticated;
GRANT INSERT ON public.session_events TO anon;
GRANT ALL ON public.session_events TO service_role;
ALTER TABLE public.session_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert their own session events"
  ON public.session_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Anon can insert anonymous session events"
  ON public.session_events FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);
CREATE POLICY "Users can view their own session events"
  ON public.session_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);