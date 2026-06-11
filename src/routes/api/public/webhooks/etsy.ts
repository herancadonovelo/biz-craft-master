import { createFileRoute } from "@tanstack/react-router";
import { pushEvent } from "@/lib/webhook-queue";

export const Route = createFileRoute("/api/public/webhooks/etsy")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: any;
        try { body = await request.json(); } catch { return new Response("invalid json", { status: 400 }); }
        const id = String(body.event_id || body.transaction_id || body.receipt_id || crypto.randomUUID());
        const accepted = pushEvent({ provider: "etsy", id, payload: body, receivedAt: new Date().toISOString() });
        return Response.json({ ok: true, idempotent: !accepted, id });
      },
      GET: async () => Response.json({ status: "etsy webhook ready" }),
    },
  },
});