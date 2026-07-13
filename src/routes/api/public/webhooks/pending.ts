import { createFileRoute } from "@tanstack/react-router";

// Endpoint disabled. Previously served a single unauthenticated in-memory
// queue shared across all merchants, which leaked Etsy/WhatsApp events
// between tenants. Per-tenant delivery must go through an authenticated
// server function that reads from a user-scoped table (RLS on auth.uid()).
export const Route = createFileRoute("/api/public/webhooks/pending")({
  server: {
    handlers: {
      GET: async () =>
        new Response(
          JSON.stringify({ error: "gone", message: "Endpoint disabled. Use authenticated per-user retrieval." }),
          { status: 410, headers: { "content-type": "application/json" } },
        ),
    },
  },
});