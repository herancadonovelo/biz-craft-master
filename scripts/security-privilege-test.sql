-- Negative test: an unprivileged `authenticated` session must NOT be able to
-- change email-queue permissions or search_path, must not be able to run the
-- audit collector, and the audit trail must stay clean (no bogus rows).
-- Everything runs inside a transaction that is ROLLED BACK.
\set ON_ERROR_STOP on
\pset tuples_only on
\pset format unaligned

BEGIN;

-- Baseline snapshot so we can prove nothing new is recorded afterwards.
SELECT public.audit_email_security_config();

DO $$
DECLARE
  rows_before bigint;
  rows_after bigint;
  state_before jsonb;
  state_after jsonb;
  blocked boolean;
  n integer;
BEGIN
  SELECT count(*) INTO rows_before FROM public.security_function_audit;
  SELECT a.current_state INTO state_before
    FROM public.security_function_audit a
   WHERE a.function_name = 'enqueue_email'
   ORDER BY a.detected_at DESC, a.created_at DESC LIMIT 1;

  ---------------------------------------------------------------------------
  -- 1. GRANT EXECUTE as `authenticated` must be rejected.
  ---------------------------------------------------------------------------
  blocked := false;
  BEGIN
    SET LOCAL ROLE authenticated;
    GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO authenticated;
  EXCEPTION WHEN OTHERS THEN
    blocked := true;
  END;
  RESET ROLE;
  IF NOT blocked THEN
    RAISE EXCEPTION 'FAIL: authenticated was able to GRANT EXECUTE on enqueue_email';
  END IF;
  RAISE NOTICE 'OK: GRANT EXECUTE blocked for authenticated';

  ---------------------------------------------------------------------------
  -- 2. ALTER FUNCTION ... SET search_path as `authenticated` must be rejected.
  ---------------------------------------------------------------------------
  blocked := false;
  BEGIN
    SET LOCAL ROLE authenticated;
    ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path TO 'public';
  EXCEPTION WHEN OTHERS THEN
    blocked := true;
  END;
  RESET ROLE;
  IF NOT blocked THEN
    RAISE EXCEPTION 'FAIL: authenticated was able to change search_path of enqueue_email';
  END IF;
  RAISE NOTICE 'OK: ALTER FUNCTION search_path blocked for authenticated';

  ---------------------------------------------------------------------------
  -- 3. Running the audit collector as `authenticated` must be rejected.
  ---------------------------------------------------------------------------
  blocked := false;
  BEGIN
    SET LOCAL ROLE authenticated;
    PERFORM public.audit_email_security_config();
  EXCEPTION WHEN OTHERS THEN
    blocked := true;
  END;
  RESET ROLE;
  IF NOT blocked THEN
    RAISE EXCEPTION 'FAIL: authenticated was able to execute audit_email_security_config()';
  END IF;
  RAISE NOTICE 'OK: audit collector not executable by authenticated';

  ---------------------------------------------------------------------------
  -- 4. Writing directly to the audit trail as `authenticated` must be rejected.
  ---------------------------------------------------------------------------
  blocked := false;
  BEGIN
    SET LOCAL ROLE authenticated;
    INSERT INTO public.security_function_audit (function_name, change_type, current_state)
    VALUES ('enqueue_email', 'changed', '{"authenticated_execute": true}'::jsonb);
  EXCEPTION WHEN OTHERS THEN
    blocked := true;
  END;
  RESET ROLE;
  IF NOT blocked THEN
    RAISE EXCEPTION 'FAIL: authenticated was able to insert a forged audit row';
  END IF;
  RAISE NOTICE 'OK: forged audit insert blocked for authenticated';

  ---------------------------------------------------------------------------
  -- 5. Nothing changed => the audit must not record anything new or wrong.
  ---------------------------------------------------------------------------
  n := public.audit_email_security_config();
  IF n <> 0 THEN
    RAISE EXCEPTION 'FAIL: audit recorded % change(s) after blocked attempts', n;
  END IF;

  SELECT count(*) INTO rows_after FROM public.security_function_audit;
  IF rows_after <> rows_before THEN
    RAISE EXCEPTION 'FAIL: audit trail grew from % to % rows after blocked attempts',
      rows_before, rows_after;
  END IF;

  SELECT a.current_state INTO state_after
    FROM public.security_function_audit a
   WHERE a.function_name = 'enqueue_email'
   ORDER BY a.detected_at DESC, a.created_at DESC LIMIT 1;
  IF state_after IS DISTINCT FROM state_before THEN
    RAISE EXCEPTION 'FAIL: recorded state for enqueue_email changed unexpectedly: % -> %',
      state_before, state_after;
  END IF;
  IF (state_after->>'authenticated_execute')::boolean IS DISTINCT FROM false
     OR state_after->>'search_path_setting' <> 'search_path=public, pgmq' THEN
    RAISE EXCEPTION 'FAIL: audit holds an incorrect state for enqueue_email: %', state_after;
  END IF;

  RAISE NOTICE 'PASS: email-queue privilege escalation blocked and audit trail clean';
END $$;

ROLLBACK;
