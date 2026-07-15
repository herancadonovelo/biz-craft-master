import { createFileRoute } from "@tanstack/react-router";
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
        const shopId = String(body.shop_id ?? body.shop?.shop_id ?? "");
        if (!shopId) return Response.json({ ok: true, unmapped: true, id });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: tenant } = await supabaseAdmin
          .from("webhook_tenant_map")
          .select("user_id")
          .eq("provider", "etsy")
          .eq("tenant_key", shopId)
          .maybeSingle();
        if (!tenant?.user_id) return Response.json({ ok: true, unmapped: true, id });
        const normalized = {
          id,
          listingId: String(body.listing_id ?? body.listing?.listing_id ?? ""),
          quantidade: Number(body.quantity ?? 1),
          variacao: body.variations?.[0]?.value ?? body.variation,
          clienteNome: body.buyer_name ?? body.name,
          clienteEmail: body.buyer_email ?? body.email,
          descricao: body.title ?? body.description,
          valor: Number(body.price ?? body.total_price ?? 0),
          raw: body,
        };
        await supabaseAdmin.from("webhook_events").insert({
          user_id: tenant.user_id,
          provider: "etsy",
          external_id: id,
          payload: normalized,
        }).select().maybeSingle();
        return Response.json({ ok: true, id });
      },
      GET: async () => Response.json({ status: "etsy webhook ready" }),
    },
  },
});