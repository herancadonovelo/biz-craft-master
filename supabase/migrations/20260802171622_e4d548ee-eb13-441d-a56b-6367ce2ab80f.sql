CREATE TABLE public.security_function_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  change_type text NOT NULL,
  is_security_definer boolean,
  search_path_setting text,
  anon_execute boolean,
  authenticated_execute boolean,
  service_role_execute boolean,
  public_execute boolean,
  previous_state jsonb,
  current_state jsonb,
  detected_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX security_function_audit_fn_idx
  ON public.security_function_audit (function_name, detected_at DESC);

GRANT SELECT ON public.security_function_audit TO authenticated;
GRANT ALL ON public.security_function_audit TO service_role;

ALTER TABLE public.security_function_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read security audit"
  ON public.security_function_audit
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.audit_email_security_config()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  rec record;
  prev record;
  cur_state jsonb;
  changes integer := 0;
  ctype text;
BEGIN
  FOR rec IN
    SELECT p.proname AS function_name,
           p.prosecdef AS is_security_definer,
           (SELECT cfg FROM unnest(COALESCE(p.proconfig, '{}')) cfg
             WHERE cfg LIKE 'search_path=%' LIMIT 1) AS search_path_setting,
           has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
           has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute,
           has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role_execute,
           has_function_privilege('public', p.oid, 'EXECUTE') AS public_execute
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.proname IN (
         'delete_email','enqueue_email','move_to_dlq','read_email_batch',
         'email_queue_dispatch','email_queue_wake','audit_email_security_config'
       )
     ORDER BY p.proname
  LOOP
    cur_state := jsonb_build_object(
      'is_security_definer', rec.is_security_definer,
      'search_path_setting', rec.search_path_setting,
      'anon_execute', rec.anon_execute,
      'authenticated_execute', rec.authenticated_execute,
      'service_role_execute', rec.service_role_execute,
      'public_execute', rec.public_execute
    );

    SELECT * INTO prev
      FROM public.security_function_audit a
     WHERE a.function_name = rec.function_name
     ORDER BY a.detected_at DESC
     LIMIT 1;

    IF prev IS NULL THEN
      ctype := 'baseline';
    ELSIF prev.current_state IS DISTINCT FROM cur_state THEN
      ctype := 'changed';
    ELSE
      CONTINUE;
    END IF;

    INSERT INTO public.security_function_audit (
      function_name, change_type, is_security_definer, search_path_setting,
      anon_execute, authenticated_execute, service_role_execute, public_execute,
      previous_state, current_state
    ) VALUES (
      rec.function_name, ctype, rec.is_security_definer, rec.search_path_setting,
      rec.anon_execute, rec.authenticated_execute, rec.service_role_execute, rec.public_execute,
      CASE WHEN prev IS NULL THEN NULL ELSE prev.current_state END, cur_state
    );
    changes := changes + 1;
  END LOOP;

  -- Record functions that disappeared since the last snapshot.
  FOR rec IN
    SELECT DISTINCT a.function_name
      FROM public.security_function_audit a
     WHERE a.change_type <> 'removed'
       AND NOT EXISTS (
         SELECT 1 FROM pg_proc p
         JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname = 'public' AND p.proname = a.function_name
       )
       AND (SELECT b.change_type FROM public.security_function_audit b
             WHERE b.function_name = a.function_name
             ORDER BY b.detected_at DESC LIMIT 1) <> 'removed'
  LOOP
    INSERT INTO public.security_function_audit (function_name, change_type, current_state)
    VALUES (rec.function_name, 'removed', NULL);
    changes := changes + 1;
  END LOOP;

  RETURN changes;
END;
$function$;

REVOKE ALL ON FUNCTION public.audit_email_security_config() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.audit_email_security_config() TO service_role;

SELECT public.audit_email_security_config();