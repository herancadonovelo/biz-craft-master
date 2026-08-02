#!/usr/bin/env bash
# Runs the email-queue security audit self-test. All changes are rolled back.
set -euo pipefail

DB_URL="${SUPABASE_DB_URL:-}"
if [ -z "$DB_URL" ]; then
  echo "::error::SUPABASE_DB_URL is not set; cannot run the security audit self-test."
  exit 1
fi

log=$(psql "$DB_URL" -X -q -v ON_ERROR_STOP=1 -f "$(dirname "$0")/security-audit-selftest.sql" 2>&1) || {
  echo "::error::Security audit self-test failed:"
  echo "$log" | sed 's/^/  /'
  exit 1
}

echo "$log" | sed 's/^/  /'
if ! echo "$log" | grep -q 'PASS: email-queue security audit self-test'; then
  echo "::error::Self-test did not reach the PASS assertion."
  exit 1
fi
echo "Security audit self-test passed (all changes rolled back)."
