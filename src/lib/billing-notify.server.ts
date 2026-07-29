import { createClient } from "@supabase/supabase-js";
import type { PaddleEnv } from "@/lib/paddle.server";

let _admin: ReturnType<typeof createClient<any>> | null = null;
function admin() {
  if (!_admin) {
    _admin = createClient<any>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _admin;
}

export const PLAN_LABEL: Record<string, string> = {
  base_plan: "Base",
  premium_plan: "Premium",
};

export function cycleLabel(priceId: string) {
  return priceId.endsWith("_yearly") ? "anual" : "mensal";
}

export function formatDate(iso?: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

/** Regista um evento de faturação para relatórios. Nunca lança. */
export async function logBillingEvent(input: {
  userId: string;
  eventType: string;
  env: PaddleEnv;
  subscriptionId?: string | null;
  productId?: string | null;
  priceId?: string | null;
  status?: string | null;
  amountCents?: number | null;
  currency?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await admin().from("billing_events").insert({
      user_id: input.userId,
      event_type: input.eventType,
      paddle_subscription_id: input.subscriptionId ?? null,
      product_id: input.productId ?? null,
      price_id: input.priceId ?? null,
      status: input.status ?? null,
      amount_cents: input.amountCents ?? null,
      currency: input.currency ?? null,
      environment: input.env,
      metadata: input.metadata ?? {},
    });
  } catch (e) {
    console.error("[billing] logBillingEvent failed", e);
  }
}

async function emailForUser(userId: string): Promise<string | null> {
  try {
    const { data } = await admin().auth.admin.getUserById(userId);
    return data?.user?.email ?? null;
  } catch (e) {
    console.error("[billing] getUserById failed", e);
    return null;
  }
}

/**
 * Envia um email transacional através da rota interna de envio.
 * Só envia em ambiente live — os testes não incomodam clientes reais.
 */
export async function sendBillingEmail(opts: {
  origin: string;
  env: PaddleEnv;
  userId: string;
  templateName:
    | "subscription-welcome"
    | "subscription-canceled"
    | "payment-failed"
    | "refund-processed"
    | "payment-receipt";
  templateData: Record<string, unknown>;
  idempotencyKey?: string;
}) {
  if (opts.env !== "live") return;
  const to = await emailForUser(opts.userId);
  if (!to) return;
  try {
    const res = await fetch(`${opts.origin}/lovable/email/transactional/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        templateName: opts.templateName,
        recipientEmail: to,
        idempotencyKey: opts.idempotencyKey,
        templateData: { appUrl: opts.origin, ...opts.templateData },
      }),
    });
    if (!res.ok) {
      console.error("[billing] email send failed", res.status, await res.text());
    }
  } catch (e) {
    console.error("[billing] email send error", e);
  }
}
