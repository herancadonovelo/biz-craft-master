CREATE TABLE public.knit_tester_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  titulo text,
  total_rows integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.knit_tester_links TO authenticated;
GRANT ALL ON public.knit_tester_links TO service_role;

ALTER TABLE public.knit_tester_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their tester links"
  ON public.knit_tester_links FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER knit_tester_links_touch
  BEFORE UPDATE ON public.knit_tester_links
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.knit_tester_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id uuid NOT NULL REFERENCES public.knit_tester_links(id) ON DELETE CASCADE,
  token text NOT NULL,
  autor text NOT NULL DEFAULT 'tester',
  atual integer NOT NULL DEFAULT 1,
  total_rows integer NOT NULL DEFAULT 1,
  concluido boolean NOT NULL DEFAULT false,
  consumo_real_g numeric,
  tamanho_usado text,
  notas jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (link_id, autor)
);

CREATE INDEX knit_tester_feedback_link_idx ON public.knit_tester_feedback(link_id);

GRANT SELECT, DELETE ON public.knit_tester_feedback TO authenticated;
GRANT ALL ON public.knit_tester_feedback TO service_role;

ALTER TABLE public.knit_tester_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read feedback for their links"
  ON public.knit_tester_feedback FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.knit_tester_links l
    WHERE l.id = knit_tester_feedback.link_id AND l.user_id = auth.uid()
  ));

CREATE POLICY "Owners delete feedback for their links"
  ON public.knit_tester_feedback FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.knit_tester_links l
    WHERE l.id = knit_tester_feedback.link_id AND l.user_id = auth.uid()
  ));

CREATE TRIGGER knit_tester_feedback_touch
  BEFORE UPDATE ON public.knit_tester_feedback
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();