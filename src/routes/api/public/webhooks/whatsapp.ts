import { createFileRoute } from "@tanstack/react-router";
import { pushEvent } from "@/lib/webhook-queue";

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
        let body: any;
        try { body = await request.json(); } catch { return new Response("invalid json", { status: 400 }); }
        // Extrai mensagens individuais (idempotência por message id)
        const entries: any[] = body?.entry || [];
        let accepted = 0;
        for (const e of entries) {
          for (const ch of e?.changes || []) {
            for (const m of ch?.value?.messages || []) {
              const id = String(m.id || crypto.randomUUID());
              if (pushEvent({ provider: "whatsapp", id, payload: { telefone: m.from, texto: m.text?.body || "[media]", contacts: ch?.value?.contacts }, receivedAt: new Date().toISOString() })) accepted++;
            }
          }
        }
        return Response.json({ ok: true, accepted });
      },
    },
  },
});