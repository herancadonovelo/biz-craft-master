// NOTE: A previous version of this module kept a single process-wide
// in-memory queue that was drained by an unauthenticated public endpoint.
// In a multi-tenant deployment that leaked one merchant's Etsy/WhatsApp
// events to any other visitor (and misrouted events between accounts).
//
// The shared queue has been removed. Webhook receivers still verify the
// provider signature and ACK the delivery, but events are discarded until
// per-tenant persistence with authenticated retrieval is implemented
// (persist to a table keyed by user_id, RLS scoped to auth.uid()).
export type WebhookEvent =
  | { provider: "etsy"; id: string; payload: any; receivedAt: string }
  | { provider: "whatsapp"; id: string; payload: any; receivedAt: string };

// Accepts the event for the caller (idempotent no-op). Returns true so the
// provider receives a success ACK and does not retry indefinitely.
// Does NOT store the payload anywhere reachable by other tenants.
export function pushEvent(_ev: WebhookEvent): boolean {
  return true;
}

// Always returns an empty list — no cross-tenant fan-out is possible.
export function drain(): WebhookEvent[] {
  return [];
}