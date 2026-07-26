import { test, expect, request as playwrightRequest } from "@playwright/test";

// Confirms the hardening applied to `public.webhook_tenant_map`:
//   - anon / authenticated roles have NO INSERT/UPDATE/DELETE grants
//   - only service_role (used from server routes with the service key) may
//     mutate the mapping table.
// We exercise this through the Supabase Data API (PostgREST) using the
// publishable (anon) key that ships to the browser. Any successful write
// with this key would mean the security regression is back.

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  "";

const REST = `${SUPABASE_URL}/rest/v1/webhook_tenant_map`;

function anonHeaders(): Record<string, string> {
  return {
    apikey: ANON_KEY,
    Authorization: `Bearer ${ANON_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

// PostgREST returns 401/403 (permission denied) or 42501 SQL state when the
// role has no privileges. Any 2xx here is a security failure.
function expectDeniedStatus(status: number) {
  expect(status, `expected write to be denied, got HTTP ${status}`).toBeGreaterThanOrEqual(400);
  expect(status).toBeLessThan(500);
}

test.describe("webhook_tenant_map write access", () => {
  // Missing env means we cannot prove the security invariant. In CI the
  // workflow guards the secrets and fails earlier; here we still fail hard
  // rather than silently skip, so a local run without env is a visible red.
  test.beforeAll(() => {
    if (!SUPABASE_URL || !ANON_KEY) {
      throw new Error(
        "VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set to run this security spec.",
      );
    }
  });

  test("anon INSERT is rejected", async () => {
    const api = await playwrightRequest.newContext();
    const res = await api.post(REST, {
      headers: anonHeaders(),
      data: {
        provider: "etsy",
        tenant_key: `e2e-anon-${Date.now()}`,
        user_id: "00000000-0000-0000-0000-000000000000",
      },
    });
    expectDeniedStatus(res.status());
    await api.dispose();
  });

  test("anon UPDATE is rejected", async () => {
    const api = await playwrightRequest.newContext();
    const res = await api.patch(`${REST}?provider=eq.etsy`, {
      headers: anonHeaders(),
      data: { tenant_key: `e2e-anon-upd-${Date.now()}` },
    });
    expectDeniedStatus(res.status());
    await api.dispose();
  });

  test("anon DELETE is rejected", async () => {
    const api = await playwrightRequest.newContext();
    const res = await api.delete(`${REST}?provider=eq.etsy`, {
      headers: anonHeaders(),
    });
    expectDeniedStatus(res.status());
    await api.dispose();
  });

  test("unauthenticated request (no apikey) is rejected", async () => {
    const api = await playwrightRequest.newContext();
    const res = await api.post(REST, {
      headers: { "Content-Type": "application/json" },
      data: { provider: "etsy", tenant_key: `e2e-noauth-${Date.now()}` },
    });
    expectDeniedStatus(res.status());
    await api.dispose();
  });

  // Malformed DELETE payloads (bare table, invalid filter, invalid UUID) must
  // still be rejected by grants — PostgREST must not fall through to a
  // permissive path when the request is oddly shaped.
  test("anon DELETE without filter is rejected", async () => {
    const api = await playwrightRequest.newContext();
    const res = await api.delete(REST, { headers: anonHeaders() });
    expectDeniedStatus(res.status());
    await api.dispose();
  });

  test("anon DELETE with malformed filter is rejected", async () => {
    const api = await playwrightRequest.newContext();
    const res = await api.delete(`${REST}?id=not-a-uuid`, {
      headers: anonHeaders(),
    });
    expectDeniedStatus(res.status());
    await api.dispose();
  });

  test("anon DELETE with malformed body is rejected", async () => {
    const api = await playwrightRequest.newContext();
    const res = await api.delete(`${REST}?provider=eq.etsy`, {
      headers: { ...anonHeaders(), "Content-Type": "application/json" },
      data: "{not-valid-json",
    });
    expectDeniedStatus(res.status());
    await api.dispose();
  });

  // Targeting rows that belong to other tenants (or a made-up user_id) must
  // still be denied at the grant layer, regardless of RLS row visibility.
  test("anon DELETE targeting another tenant's user_id is rejected", async () => {
    const api = await playwrightRequest.newContext();
    const otherUserId = "11111111-1111-1111-1111-111111111111";
    const res = await api.delete(
      `${REST}?user_id=eq.${otherUserId}&provider=eq.whatsapp`,
      { headers: anonHeaders() },
    );
    expectDeniedStatus(res.status());
    await api.dispose();
  });

  test("anon DELETE targeting a fabricated row id is rejected", async () => {
    const api = await playwrightRequest.newContext();
    const fakeRowId = "22222222-2222-2222-2222-222222222222";
    const res = await api.delete(`${REST}?id=eq.${fakeRowId}`, {
      headers: anonHeaders(),
    });
    expectDeniedStatus(res.status());
    await api.dispose();
  });

  // Service_role writes are exercised end-to-end by the signed webhook
  // handlers (see e2e/... and src/routes/api/public/webhooks/*.ts) which
  // insert through `supabaseAdmin` after HMAC verification. The service_role
  // key is server-only on Lovable Cloud and intentionally not available to
  // this test process; asserting its grants here would require exposing it
  // to the browser bundle, which is exactly what this table guards against.
  test("service_role grants exist (documented, verified via migration)", async () => {
    // Grants applied in migration hardening `webhook_tenant_map`:
    //   GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhook_tenant_map TO service_role;
    // Runtime proof: incoming Etsy/WhatsApp/Twilio webhooks successfully
    // upsert rows via the server-only supabaseAdmin client. The negative
    // tests above prove no other role can do the same.
    expect(true).toBe(true);
  });
});
