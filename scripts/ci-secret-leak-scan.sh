#!/usr/bin/env bash
# Scan CI artifacts for two classes of leakage:
#   1. Supabase URL / publishable key values appearing verbatim in reports.
#   2. Any request or artifact referencing the service_role key or a
#      `Bearer sb_secret_*` / obvious service-role JWT.
# Runs after Playwright completes. Exits non-zero on any hit so the workflow
# fails loudly before we upload the offending artifact.
set -u

shopt -s nullglob globstar

roots=("$@")
if [ "${#roots[@]}" -eq 0 ]; then
  roots=(playwright-report test-results)
fi

found=0

scan() {
  local label="$1"
  local pattern="$2"
  # Fixed-string (-F) search across all provided roots. Skip binaries and
  # missing dirs quietly.
  local hits
  hits=$(grep -RIF --binary-files=without-match --exclude-dir=node_modules \
    -l -e "$pattern" "${roots[@]}" 2>/dev/null || true)
  if [ -n "$hits" ]; then
    echo "::error::Leak scan matched $label in CI artifacts:"
    echo "$hits" | sed 's/^/  - /'
    found=1
  fi
}

scan_regex() {
  local label="$1"
  local pattern="$2"
  local hits
  hits=$(grep -RIE --binary-files=without-match --exclude-dir=node_modules \
    -l -e "$pattern" "${roots[@]}" 2>/dev/null || true)
  if [ -n "$hits" ]; then
    echo "::error::Leak scan matched $label in CI artifacts:"
    echo "$hits" | sed 's/^/  - /'
    found=1
  fi
}

if [ -n "${VITE_SUPABASE_URL:-}" ]; then
  scan "VITE_SUPABASE_URL value" "$VITE_SUPABASE_URL"
fi
if [ -n "${VITE_SUPABASE_PUBLISHABLE_KEY:-}" ]; then
  scan "VITE_SUPABASE_PUBLISHABLE_KEY value" "$VITE_SUPABASE_PUBLISHABLE_KEY"
fi

# Service-role misuse: any artifact naming the service role secret, using an
# `sb_secret_` bearer, or the literal role claim `"role":"service_role"`.
scan "SUPABASE_SERVICE_ROLE_KEY reference" "SUPABASE_SERVICE_ROLE_KEY"
scan_regex "sb_secret_ bearer" "sb_secret_[A-Za-z0-9_-]+"
scan_regex "service_role JWT claim" "\"role\"[[:space:]]*:[[:space:]]*\"service_role\""
scan_regex "Authorization header with service_role" "[Aa]uthorization:[[:space:]]*Bearer[[:space:]]+.*service_role"

if [ "$found" != "0" ]; then
  echo "::error::CI artifacts contain sensitive values or service_role usage. Failing job."
  exit 1
fi

echo "Leak scan clean across: ${roots[*]}"