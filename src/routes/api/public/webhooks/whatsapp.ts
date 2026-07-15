import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

function verifyMetaSignature(rawBody: string, signature: string | null, appSecret: string): boolean {
  if (!signature || !signature.startsWith("sha256=")) return false;
  const provided = signature.slice(7);
  const expected = createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const a = Buffer.from(provided, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || a.length === 0) return false;
  try { return timingSafeEqual(a, b); } catch { return false; }
}

// Endpoint compatível com WhatsApp Cloud API:
//  - GET para verificação (hub.challenge)
//  - POST para receber mensagens
export const Route = createFileRoute("/api/public/webhooks/whatsapp")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const challenge = url.searchParams.get("hub.challenge");
        const token = url.searchParams.get("hub.verify_token");
        const expected = process.env.WHATSAPP_VERIFY_TOKEN || "lovable-verify";
        if (mode === "subscribe" && token === expected && challenge) {
          return new Response(challenge, { status: 200 });
        }
        return new Response("forbidden", { status: 403 });
      },
      POST: async ({ request }) => {
        const appSecret = process.env.WHATSAPP_APP_SECRET;
        if (!appSecret) return new Response("webhook not configured", { status: 503 });
        const raw = await request.text();
        const signature = request.headers.get("x-hub-signature-256");
        if (!verifyMetaSignature(raw, signature, appSecret)) {
          return new Response("invalid signature", { status: 401 });
        }
        let body: any;
        try { body = JSON.parse(raw); } catch { return new Response("invalid json", { status: 400 }); }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const entries: any[] = body?.entry || [];
        let accepted = 0;
        for (const e of entries) {
          for (const ch of e?.changes || []) {
            const phoneNumberId = String(ch?.value?.metadata?.phone_number_id ?? "");
            if (!phoneNumberId) continue;
            const { data: tenant } = await supabaseAdmin
              .from("webhook_tenant_map")
              .select("user_id")
              .eq("provider", "whatsapp")
              .eq("tenant_key", phoneNumberId)
              .maybeSingle();
            if (!tenant?.user_id) continue;
            const contacts = ch?.value?.contacts;
            for (const m of ch?.value?.messages || []) {
              const id = String(m.id || crypto.randomUUID());
              const nome = Array.isArray(contacts) ? contacts.find((c: any) => c?.wa_id === m.from)?.profile?.name : undefined;
              const { error } = await supabaseAdmin.from("webhook_events").insert({
                user_id: tenant.user_id,
                provider: "whatsapp",
                external_id: id,
                payload: {
                  id,
                  telefone: m.from,
                  texto: m.text?.body || m.button?.text || m.interactive?.button_reply?.title || "[media]",
                  nome,
                  direcao: "in",
                  data: m.timestamp ? new Date(Number(m.timestamp) * 1000).toISOString() : new Date().toISOString(),
                  raw: m,
                },
              });
              if (!error) accepted++;
            }
          }
        }
        return Response.json({ ok: true, accepted });
      },
    },
  },
});