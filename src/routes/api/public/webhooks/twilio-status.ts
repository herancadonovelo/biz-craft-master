import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

// Twilio signature: base64(HMAC-SHA1(authToken, fullUrl + sorted(key+value)))
function verifyTwilioSignature(fullUrl: string, params: Record<string, string>, signature: string | null, token: string): boolean {
  if (!signature) return false;
  const sortedKeys = Object.keys(params).sort();
  let data = fullUrl;
  for (const k of sortedKeys) data += k + params[k];
  const expected = createHmac("sha1", token).update(data).digest("base64");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try { return timingSafeEqual(a, b); } catch { return false; }
}

export const Route = createFileRoute("/api/public/webhooks/twilio-status")({
  server: {
    handlers: {
      GET: async () => Response.json({ status: "twilio-status webhook ready" }),
      POST: async ({ request }) => {
        const token = process.env.TWILIO_AUTH_TOKEN;
        const raw = await request.text();
        const params: Record<string, string> = {};
        new URLSearchParams(raw).forEach((v, k) => { params[k] = v; });

        // Twilio posts x-www-form-urlencoded; signature is over the exact request URL.
        const url = new URL(request.url);
        const fullUrl = url.origin + url.pathname;
        const signature = request.headers.get("x-twilio-signature");

        if (token) {
          if (!verifyTwilioSignature(fullUrl, params, signature, token)) {
            return new Response("invalid signature", { status: 401 });
          }
        }

        const messageSid = params.MessageSid || params.SmsSid || "";
        const status = params.MessageStatus || params.SmsStatus || "unknown";
        const to = params.To || "";
        if (!messageSid) return new Response("missing MessageSid", { status: 400 });

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          // Best-effort tenant lookup by phone number (E.164).
          const { data: tenant } = await supabaseAdmin
            .from("webhook_tenant_map")
            .select("user_id")
            .eq("provider", "twilio")
            .eq("tenant_key", to)
            .maybeSingle();
          if (!tenant?.user_id) {
            return Response.json({ ok: true, unmapped: true, messageSid, status });
          }
          await supabaseAdmin.from("webhook_events").insert({
            user_id: tenant.user_id,
            provider: "twilio",
            external_id: messageSid,
            payload: { messageSid, status, to, raw: params },
          });
        } catch (e) {
          console.error("[twilio-status] persist failed", e);
        }
        return new Response("", { status: 204 });
      },
    },
  },
});