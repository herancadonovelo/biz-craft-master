-- Regression guard for previously fixed security findings.
--   SUPA_anon_security_definer_function_executable
--   SUPA_function_search_path_mutable
-- Prints one row per violation. Empty output == clean.
\pset tuples_only on
\pset format unaligned

-- 1) SECURITY DEFINER functions in `public` executable by anonymous callers.
SELECT 'SUPA_anon_security_definer_function_executable|' || p.proname
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosecdef
  AND has_function_privilege('anon', p.oid, 'EXECUTE');

-- 2) Internal (system-only) functions must not be callable by signed-in users.
SELECT 'SUPA_anon_security_definer_function_executable|' || p.proname || ' (authenticated)'
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'delete_email','enqueue_email','move_to_dlq','read_email_batch',
    'email_queue_dispatch','email_queue_wake'
  )
  AND has_function_privilege('authenticated', p.oid, 'EXECUTE');

-- 3) Any function in `public` without a pinned search_path.
SELECT 'SUPA_function_search_path_mutable|' || p.proname
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
  AND NOT EXISTS (
    SELECT 1 FROM unnest(COALESCE(p.proconfig, '{}')) cfg
    WHERE cfg LIKE 'search_path=%'
  );
