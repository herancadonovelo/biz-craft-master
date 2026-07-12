import { createFileRoute } from "@tanstack/react-router";
import { pushEvent } from "@/lib/webhook-queue";
import { createHmac, timingSafeEqual } from "crypto";

function verifyEtsySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  // Etsy typically sends "sha256=<hex>"; accept both forms.
  const provided = signature.startsWith("sha256=") ? signature.slice(7) : signature;
  const a = Buffer.from(provided, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || a.length === 0) return false;
  try { return timingSafeEqual(a, b); } catch { return false; }
}

export const Route = createFileRoute("/api/public/webhooks/etsy")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.ETSY_WEBHOOK_SECRET;
        if (!secret) return new Response("webhook not configured", { status: 503 });
        const raw = await request.text();
        const signature = request.headers.get("x-etsy-signature") ?? request.headers.get("x-hub-signature-256");
        if (!verifyEtsySignature(raw, signature, secret)) {
          return new Response("invalid signature", { status: 401 });
        }
        let body: any;
        try { body = JSON.parse(raw); } catch { return new Response("invalid json", { status: 400 }); }
        const id = String(body.event_id || body.transaction_id || body.receipt_id || crypto.randomUUID());
        const accepted = pushEvent({ provider: "etsy", id, payload: body, receivedAt: new Date().toISOString() });
        return Response.json({ ok: true, idempotent: !accepted, id });
      },
      GET: async () => Response.json({ status: "etsy webhook ready" }),
    },
  },
});