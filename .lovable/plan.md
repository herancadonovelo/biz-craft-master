# Fix: Etsy & WhatsApp webhooks are silently dropped

## Problem (confirmed)
`src/lib/webhook-queue.ts` `pushEvent` returns `true` without storing anything and `drain()` returns `[]`. The webhook receivers verify signatures, call `pushEvent`, and ACK — but no event ever reaches the app. `WebhookPoller` was removed and `/api/public/webhooks/pending` returns 410. Result: providers report success, the shop sees nothing.

## Approach
Replace the in-memory queue with per-tenant persistence in the database, then let each signed-in client fetch and process its own pending events via an authenticated server function.

## Steps

### 1. Database (migration)
Create `public.webhook_events`:
- `id uuid pk`, `user_id uuid not null`, `provider text check in ('etsy','whatsapp')`, `external_id text not null`, `payload jsonb not null`, `received_at timestamptz default now()`, `processed_at timestamptz`, `unique(user_id, provider, external_id)`.
- GRANT SELECT, UPDATE on `webhook_events` to `authenticated`; GRANT ALL to `service_role`. No `anon`.
- Enable RLS. Policy: user can SELECT/UPDATE rows where `auth.uid() = user_id`. No INSERT/DELETE from clients (service role writes from webhook route).

Create `public.webhook_tenant_map` to route inbound events to a `user_id`:
- Etsy: `(user_id, etsy_shop_id text unique)` — populated when the user connects Etsy.
- WhatsApp: `(user_id, whatsapp_phone_number_id text unique)` — populated when the user connects WhatsApp Cloud API.
- GRANT SELECT, INSERT, UPDATE, DELETE to `authenticated` scoped by `auth.uid()`; RLS with `auth.uid() = user_id` policies.

### 2. Webhook receivers (server routes)
`src/routes/api/public/webhooks/etsy.ts` and `whatsapp.ts`:
- Keep HMAC signature verification.
- Extract the provider tenant key from the payload (Etsy `shop_id`; WhatsApp `entry[].changes[].value.metadata.phone_number_id`).
- Inside the handler, `await import('@/integrations/supabase/client.server')` and look up `user_id` from `webhook_tenant_map`. If not mapped, return 200 (ACK) and log — do not error-loop the provider.
- Insert into `webhook_events` with `ON CONFLICT (user_id, provider, external_id) DO NOTHING` for idempotency.
- Remove `pushEvent` usage entirely; delete `src/lib/webhook-queue.ts`.

### 3. Authenticated retrieval
New `src/lib/webhooks.functions.ts`:
- `fetchPendingWebhookEvents` (`requireSupabaseAuth`): select unprocessed rows for `context.userId`.
- `markWebhookEventProcessed({ id })`: set `processed_at = now()` where `id` and `user_id = auth.uid()`.

### 4. Client poller
Recreate `src/components/WebhookPoller.tsx`:
- Runs only when `user` is present.
- Every ~15s, calls `fetchPendingWebhookEvents`, feeds each into existing `processarWebhookEtsy` / `processarWebhookWhatsapp` in `src/lib/store.ts`, then calls `markWebhookEventProcessed`.
- Mount in `src/routes/__root.tsx` inside the authenticated branch of `AppShell` (never on public routes).

### 5. Retire the disabled endpoint
Delete `src/routes/api/public/webhooks/pending.ts` (no longer needed; retrieval is authenticated via server fn).

### 6. Connection UI
Add fields on the Etsy and WhatsApp settings screens (or reuse existing connection screens) so the user can save their `etsy_shop_id` / `whatsapp_phone_number_id` into `webhook_tenant_map`. Without this mapping, real deliveries cannot be routed to a tenant.

## Security notes
- Webhook route uses service-role client only after HMAC verification.
- No cross-tenant leakage: retrieval is per `auth.uid()` with RLS.
- `external_id` unique constraint prevents duplicate processing on provider retries.

## Out of scope
- Backfilling events that arrived while the queue was a no-op (they were never persisted).
- Real-time push (Supabase Realtime) — can replace polling later.
