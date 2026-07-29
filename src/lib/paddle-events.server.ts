import { createClient } from "@supabase/supabase-js";
import type { PaddleEnv } from "@/lib/paddle.server";

let _admin: ReturnType<typeof createClient<any>> | null = null;
function admin() {
  if (!_admin) {
    _admin = createClient<any>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  }
  return _admin;
}

export type PaddleEventStatus =
  | "processado"
  | "repetido"
  | "assinatura_invalida"
  | "erro_processamento";

export interface PaddleEventLogInput {
  eventId?: string | null;
  eventType?: string | null;
  environment: PaddleEnv;
  signatureVerified: boolean;
  status: PaddleEventStatus;
  errorMessage?: string | null;
  summary?: Record<string, unknown>;
}

/** Resumo seguro do conteúdo do evento (sem dados sensíveis do cartão). */
export function summarizeEvent(eventType: string, data: any): Record<string, unknown> {
  const item = data?.items?.[0];
  return {
    eventType,
    id: data?.id ?? null,
    status: data?.status ?? null,
    subscriptionId: data?.subscriptionId ?? data?.subscription_id ?? null,
    transactionId: data?.transactionId ?? data?.transaction_id ?? null,
    userId: data?.customData?.userId ?? null,
    productId: item?.product?.importMeta?.externalId ?? null,
    priceId: item?.price?.importMeta?.externalId ?? null,
    amountCents: data?.details?.totals?.total ?? data?.totals?.total ?? null,
    currency: data?.currencyCode ?? data?.currency_code ?? null,
    occurredAt: data?.billedAt ?? data?.createdAt ?? null,
  };
}

/** Nunca lança: a auditoria não pode partir o processamento do webhook. */
export async function logPaddleEvent(input: PaddleEventLogInput): Promise<void> {
  try {
    await admin()
      .from("paddle_event_log")
      .insert({
        event_id: input.eventId ?? null,
        event_type: input.eventType ?? null,
        environment: input.environment,
        signature_verified: input.signatureVerified,
        status: input.status,
        error_message: input.errorMessage ? String(input.errorMessage).slice(0, 500) : null,
        summary: input.summary ?? {},
      });
  } catch (e) {
    console.error("[paddle-event-log] falha a registar evento", e);
  }
}