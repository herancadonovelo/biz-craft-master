ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_language text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  m jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
BEGIN
  INSERT INTO public.profiles (
    user_id,
    first_name, last_name, birth_date, company, nationality, country,
    marketing_opt_in, terms_accepted_at, privacy_accepted_at, preferred_language
  ) VALUES (
    NEW.id,
    NULLIF(m->>'first_name',''),
    NULLIF(m->>'last_name',''),
    NULLIF(m->>'birth_date','')::date,
    NULLIF(m->>'company',''),
    NULLIF(m->>'nationality',''),
    NULLIF(m->>'country',''),
    COALESCE((m->>'marketing_opt_in')::boolean, false),
    CASE WHEN (m->>'terms_accepted_at') IS NOT NULL THEN now() END,
    CASE WHEN (m->>'privacy_accepted_at') IS NOT NULL THEN now() END,
    NULLIF(m->>'preferred_language','')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, public.profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, public.profiles.last_name),
    birth_date = COALESCE(EXCLUDED.birth_date, public.profiles.birth_date),
    company = COALESCE(EXCLUDED.company, public.profiles.company),
    nationality = COALESCE(EXCLUDED.nationality, public.profiles.nationality),
    country = COALESCE(EXCLUDED.country, public.profiles.country),
    preferred_language = COALESCE(public.profiles.preferred_language, EXCLUDED.preferred_language);
  RETURN NEW;
END;
$function$;