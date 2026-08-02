-- Self-test for public.audit_email_security_config().
-- Temporarily changes email-queue permissions and search_path, asserts the
-- audit trail records the previous and current state, then ROLLS BACK so the
-- database is left exactly as it was (no grant, config or audit row persists).
\set ON_ERROR_STOP on
\pset tuples_only on
\pset format unaligned

BEGIN;

-- Baseline snapshot so later runs compare against a known state.
SELECT public.audit_email_security_config();

DO $$
DECLARE
  n integer;
  row_before jsonb;
  row_after jsonb;
  ctype text;
BEGIN
  ---------------------------------------------------------------------------
  -- 1. Permission change: make enqueue_email callable by signed-in users.
  ---------------------------------------------------------------------------
  GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO authenticated;

  n := public.audit_email_security_config();
  IF n < 1 THEN
    RAISE EXCEPTION 'FAIL: permission change was not detected (changes=%)', n;
  END IF;

  SELECT a.change_type, a.previous_state, a.current_state
    INTO ctype, row_before, row_after
    FROM public.security_function_audit a
   WHERE a.function_name = 'enqueue_email'
   ORDER BY a.detected_at DESC, a.created_at DESC
   LIMIT 1;

  IF ctype <> 'changed' THEN
    RAISE EXCEPTION 'FAIL: expected change_type=changed for enqueue_email, got %', ctype;
  END IF;
  IF (row_before->>'authenticated_execute')::boolean IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'FAIL: previous_state should record authenticated_execute=false, got %', row_before;
  END IF;
  IF (row_after->>'authenticated_execute')::boolean IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'FAIL: current_state should record authenticated_execute=true, got %', row_after;
  END IF;
  RAISE NOTICE 'OK: permission change recorded (before=%, after=%)',
    row_before->>'authenticated_execute', row_after->>'authenticated_execute';

  ---------------------------------------------------------------------------
  -- 2. search_path change on the same function.
  ---------------------------------------------------------------------------
  ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path TO 'public';

  n := public.audit_email_security_config();
  IF n < 1 THEN
    RAISE EXCEPTION 'FAIL: search_path change was not detected (changes=%)', n;
  END IF;

  SELECT a.previous_state, a.current_state
    INTO row_before, row_after
    FROM public.security_function_audit a
   WHERE a.function_name = 'enqueue_email'
   ORDER BY a.detected_at DESC, a.created_at DESC
   LIMIT 1;

  IF row_before->>'search_path_setting' <> 'search_path=public, pgmq' THEN
    RAISE EXCEPTION 'FAIL: previous search_path should be "search_path=public, pgmq", got %',
      row_before->>'search_path_setting';
  END IF;
  IF row_after->>'search_path_setting' <> 'search_path=public' THEN
    RAISE EXCEPTION 'FAIL: current search_path should be "search_path=public", got %',
      row_after->>'search_path_setting';
  END IF;
  RAISE NOTICE 'OK: search_path change recorded (before=%, after=%)',
    row_before->>'search_path_setting', row_after->>'search_path_setting';

  ---------------------------------------------------------------------------
  -- 3. Reverting is also recorded, and a no-op run records nothing.
  ---------------------------------------------------------------------------
  REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM authenticated;
  ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path TO 'public', 'pgmq';

  n := public.audit_email_security_config();
  IF n < 1 THEN
    RAISE EXCEPTION 'FAIL: revert was not detected (changes=%)', n;
  END IF;

  SELECT a.previous_state, a.current_state
    INTO row_before, row_after
    FROM public.security_function_audit a
   WHERE a.function_name = 'enqueue_email'
   ORDER BY a.detected_at DESC, a.created_at DESC
   LIMIT 1;

  IF (row_after->>'authenticated_execute')::boolean IS DISTINCT FROM false
     OR row_after->>'search_path_setting' <> 'search_path=public, pgmq' THEN
    RAISE EXCEPTION 'FAIL: revert not recorded correctly: %', row_after;
  END IF;

  n := public.audit_email_security_config();
  IF n <> 0 THEN
    RAISE EXCEPTION 'FAIL: stable config should record 0 changes, got %', n;
  END IF;
  RAISE NOTICE 'OK: revert recorded and stable config produces no new rows';

  RAISE NOTICE 'PASS: email-queue security audit self-test';
END $$;

ROLLBACK;
