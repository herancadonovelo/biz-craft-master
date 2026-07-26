import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Twilio WhatsApp sender via Lovable connector gateway.
// Requires the Twilio connector to be linked (TWILIO_API_KEY env) AND a
// Twilio WhatsApp sender number configured on the Twilio side
// (TWILIO_WHATSAPP_FROM, e.g. "whatsapp:+14155238886").

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

export const sendWhatsAppMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      to: z.string().regex(/^\+[1-9]\d{6,14}$/, "phone must be E.164 (+351…)"),
      body: z.string().min(1).max(1600),
      mediaUrl: z.string().url().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const twilioKey = process.env.TWILIO_API_KEY;
    const from = process.env.TWILIO_WHATSAPP_FROM;

    if (!lovableKey) {
      return {
        ok: false as const,
        error: "lovable_key_missing",
        message: "LOVABLE_API_KEY em falta. Contacta o suporte.",
      };
    }
    if (!twilioKey) {
      return {
        ok: false as const,
        error: "twilio_not_linked",
        message:
          "Conector Twilio não está ligado. Vai a Configurações → Integrações e liga a Twilio para enviar WhatsApp.",
      };
    }
    if (!from) {
      return {
        ok: false as const,
        error: "whatsapp_from_missing",
        message:
          "Falta o remetente WhatsApp. Define TWILIO_WHATSAPP_FROM (ex: whatsapp:+14155238886) nos segredos do projeto.",
      };
    }

    const to = data.to.startsWith("whatsapp:") ? data.to : `whatsapp:${data.to}`;
    const fromFmt = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;

    const params = new URLSearchParams({ To: to, From: fromFmt, Body: data.body });
    if (data.mediaUrl) params.set("MediaUrl", data.mediaUrl);

    try {
      const res = await fetch(`${GATEWAY_URL}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": twilioKey,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });
      const text = await res.text();
      if (!res.ok) {
        console.error(`[whatsapp] Twilio ${res.status}: ${text}`);
        // Twilio error 63007 / 21211 / 63016 → phone/sender not configured
        if (/6300[0-9]|2121[0-9]|6301[0-9]/.test(text)) {
          return {
            ok: false as const,
            error: "twilio_sender_or_recipient_invalid",
            message:
              "Twilio recusou o envio: verifica se o remetente WhatsApp está aprovado e se o destinatário está autorizado no Sandbox.",
            providerStatus: res.status,
          };
        }
        return {
          ok: false as const,
          error: `twilio_${res.status}`,
          message: `Twilio devolveu ${res.status}. Verifica credenciais e saldo.`,
          providerStatus: res.status,
        };
      }
      const json = JSON.parse(text) as { sid?: string };
      return { ok: true as const, sid: json.sid };
    } catch (e) {
      console.error("[whatsapp] network error", e);
      return {
        ok: false as const,
        error: "network",
        message: "Falha de rede a contactar o Twilio. Tenta novamente.",
      };
    }
  });