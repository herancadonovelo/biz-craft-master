#!/usr/bin/env bash
# Fails the build if previously fixed security findings reappear.
set -euo pipefail

DB_URL="${SUPABASE_DB_URL:-}"
if [ -z "$DB_URL" ]; then
  echo "::error::SUPABASE_DB_URL is not set; cannot run the security regression scan."
  exit 1
fi

out=$(psql "$DB_URL" -X -q -v ON_ERROR_STOP=1 -f "$(dirname "$0")/security-regression.sql" | sed '/^$/d')

audit=$(echo "$out" | grep '^audit|' || true)
findings=$(echo "$out" | grep -v '^audit|' | sed '/^$/d' || true)

if [ -n "$audit" ]; then
  echo "::warning::$(echo "$audit" | sed 's/^audit|//')"
fi

if [ -n "$findings" ]; then
  echo "::error::Security regression detected — these findings are back:"
  echo "$findings" | sed 's/^/  - /'
  exit 1
fi

echo "Security regression scan clean: no anon-executable SECURITY DEFINER functions and no mutable search_path."
