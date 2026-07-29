import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { verifyWebhook, EventName, type PaddleEnv } from "@/lib/paddle.server";
import {
  logBillingEvent,
  sendBillingEmail,
  PLAN_LABEL,
  cycleLabel,
  formatDate,
} from "@/lib/billing-notify.server";

let _supabase: ReturnType<typeof createClient<any>> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient<any>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _supabase;
}

/**
 * Ambientes de teste (sandbox) só podem alterar o acesso real quando o webhook
 * chega a um domínio de pré-visualização/desenvolvimento. No site publicado,
 * apenas pagamentos reais (live) alteram o plano do utilizador.
 */
function isPreviewOrigin(origin: string) {
  return (
    origin.includes("localhost") ||
    origin.includes("127.0.0.1") ||
    origin.includes("-dev.lovable.app") ||
    origin.includes("id-preview--") ||
    origin.includes(".lovableproject.com")
  );
}

function canGrantAccess(env: PaddleEnv, origin: string) {
  return env === "live" || isPreviewOrigin(origin);
}

/** Evita processar o mesmo evento duas vezes (o Paddle reenvia eventos). */
async function alreadyProcessed(eventId: string | undefined, eventType: string, env: PaddleEnv) {
  if (!eventId) return false;
  const { error } = await getSupabase()
    .from("paddle_webhook_events")
    .insert({ event_id: eventId, event_type: eventType, environment: env });
  if (!error) return false;
  // 23505 = unique_violation → já foi processado
  if ((error as { code?: string }).code === "23505") return true;
  console.error("[webhook] idempotency check failed", error);
  return false;
}

/** Mapeia o produto do Paddle para o plano interno da app. */
function planFromProduct(productId: string): "base" | "premium" | null {
  if (productId === "premium_plan") return "premium";
  if (productId === "base_plan") return "base";
  return null;
}

function cycleFromPrice(priceId: string): "mensal" | "anual" {
  return priceId.endsWith("_yearly") ? "anual" : "mensal";
}

async function syncProfilePlan(
  userId: string,
  env: PaddleEnv,
  productId: string,
  priceId: string,
  active: boolean,
  origin: string,
) {
  if (!canGrantAccess(env, origin)) return;
  const { data: profile } = await getSupabase()
    .from("profiles")
    .select("subscription_status")
    .eq("user_id", userId)
    .maybeSingle();
  if (profile?.subscription_status === "premium_vitalicio") return;

  const plan = planFromProduct(productId);
  await getSupabase()
    .from("profiles")
    .update({
      subscription_status: active && plan ? plan : "light",
      billing_cycle: cycleFromPrice(priceId),
      subscription_trial_ends: null,
    })
    .eq("user_id", userId);
}

async function handleSubscriptionCreated(data: any, env: PaddleEnv, origin: string) {
  const { id, customerId, items, status, currentBillingPeriod, customData } = data;
  const userId = customData?.userId;
  if (!userId) {
    console.error("No userId in customData");
    return;
  }
  const item = items[0];
  const priceId = item?.price?.importMeta?.externalId;
  const productId = item?.product?.importMeta?.externalId;
  if (!priceId || !productId) {
    console.warn("Skipping subscription: missing importMeta.externalId", {
      rawPriceId: item?.price?.id,
      rawProductId: item?.product?.id,
    });
    return;
  }

  await getSupabase().from("subscriptions").upsert(
    {
      user_id: userId,
      paddle_subscription_id: id,
      paddle_customer_id: customerId,
      product_id: productId,
      price_id: priceId,
      status,
      current_period_start: currentBillingPeriod?.startsAt,
      current_period_end: currentBillingPeriod?.endsAt,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "paddle_subscription_id" },
  );

  await syncProfilePlan(userId, env, productId, priceId, ["active", "trialing", "past_due"].includes(status), origin);

  await logBillingEvent({
    userId,
    eventType: "subscription_created",
    env,
    subscriptionId: id,
    productId,
    priceId,
    status,
  });

  await sendBillingEmail({
    origin,
    env,
    userId,
    templateName: "subscription-welcome",
    idempotencyKey: `welcome:${id}`,
    templateData: {
      planoNome: PLAN_LABEL[productId] ?? productId,
      ciclo: cycleLabel(priceId),
      proximaRenovacao: formatDate(currentBillingPeriod?.endsAt),
      valor: "",
    },
  });
}

async function handleSubscriptionUpdated(data: any, env: PaddleEnv, origin: string) {
  const { id, status, currentBillingPeriod, scheduledChange, items } = data;
  const item = items?.[0];
  const newPriceId = item?.price?.importMeta?.externalId;
  const newProductId = item?.product?.importMeta?.externalId;

  const { data: existingRows } = await getSupabase()
    .from("subscriptions")
    .select("product_id,price_id")
    .eq("paddle_subscription_id", id)
    .eq("environment", env)
    .limit(1);
  const previous = existingRows?.[0] as { product_id: string; price_id: string } | undefined;

  const { data: rows } = await getSupabase()
    .from("subscriptions")
    .update({
      status,
      ...(newProductId && newPriceId ? { product_id: newProductId, price_id: newPriceId } : {}),
      current_period_start: currentBillingPeriod?.startsAt,
      current_period_end: currentBillingPeriod?.endsAt,
      cancel_at_period_end: scheduledChange?.action === "cancel",
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", id)
    .eq("environment", env)
    .select("user_id,product_id,price_id");

  const row = rows?.[0] as { user_id: string; product_id: string; price_id: string } | undefined;
  if (!row) return;

  await syncProfilePlan(
    row.user_id,
    env,
    row.product_id,
    row.price_id,
    ["active", "trialing", "past_due"].includes(status),
    origin,
  );

  const planChanged =
    !!previous && (previous.product_id !== row.product_id || previous.price_id !== row.price_id);

  await logBillingEvent({
    userId: row.user_id,
    eventType: planChanged ? "plan_changed" : "subscription_updated",
    env,
    subscriptionId: id,
    productId: row.product_id,
    priceId: row.price_id,
    status,
    metadata: planChanged
      ? { from: previous, to: { product_id: row.product_id, price_id: row.price_id } }
      : { cancel_at_period_end: scheduledChange?.action === "cancel" },
  });

  if (planChanged) {
    await sendBillingEmail({
      origin,
      env,
      userId: row.user_id,
      templateName: "subscription-welcome",
      idempotencyKey: `plan-changed:${id}:${row.price_id}`,
      templateData: {
        planoNome: PLAN_LABEL[row.product_id] ?? row.product_id,
        ciclo: cycleLabel(row.price_id),
        proximaRenovacao: formatDate(currentBillingPeriod?.endsAt),
        valor: "",
      },
    });
  }
}

async function handleSubscriptionCanceled(data: any, env: PaddleEnv, origin: string) {
  const { data: rows } = await getSupabase()
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("paddle_subscription_id", data.id)
    .eq("environment", env)
    .select("user_id,product_id,price_id,current_period_end");

  const row = rows?.[0] as
    | { user_id: string; product_id: string; price_id: string; current_period_end: string | null }
    | undefined;
  if (!row) return;
  const stillInPeriod = !!row.current_period_end && new Date(row.current_period_end).getTime() > Date.now();
  await syncProfilePlan(row.user_id, env, row.product_id, row.price_id, stillInPeriod, origin);

  await logBillingEvent({
    userId: row.user_id,
    eventType: "subscription_canceled",
    env,
    subscriptionId: data.id,
    productId: row.product_id,
    priceId: row.price_id,
    status: "canceled",
    metadata: { access_until: row.current_period_end },
  });

  await sendBillingEmail({
    origin,
    env,
    userId: row.user_id,
    templateName: "subscription-canceled",
    idempotencyKey: `canceled:${data.id}`,
    templateData: {
      planoNome: PLAN_LABEL[row.product_id] ?? row.product_id,
      fimAcesso: formatDate(row.current_period_end),
    },
  });
}

/** Renovação falhada: mantemos o acesso durante as tentativas do Paddle e avisamos por email. */
async function handlePaymentFailed(data: any, env: PaddleEnv, origin: string) {
  const subscriptionId = data?.subscriptionId ?? data?.subscription_id;
  if (!subscriptionId) return;
  const { data: rows } = await getSupabase()
    .from("subscriptions")
    .select("user_id,product_id,price_id")
    .eq("paddle_subscription_id", subscriptionId)
    .eq("environment", env)
    .limit(1);
  const row = rows?.[0] as { user_id: string; product_id: string; price_id: string } | undefined;
  if (!row) return;

  await logBillingEvent({
    userId: row.user_id,
    eventType: "payment_failed",
    env,
    subscriptionId,
    productId: row.product_id,
    priceId: row.price_id,
    status: "past_due",
  });

  await sendBillingEmail({
    origin,
    env,
    userId: row.user_id,
    templateName: "payment-failed",
    idempotencyKey: `payment-failed:${data?.id ?? subscriptionId}`,
    templateData: { planoNome: PLAN_LABEL[row.product_id] ?? row.product_id },
  });
}

function receiptNumberFor(transactionId: string | null, occurredAt: string) {
  const year = new Date(occurredAt).getFullYear();
  const suffix = (transactionId ?? Math.random().toString(36).slice(2))
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-8)
    .toUpperCase();
  return `REC-${year}-${suffix}`;
}

function formatAmount(cents: number | null, currency: string) {
  if (cents === null) return "";
  try {
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

async function handleTransactionCompleted(data: any, env: PaddleEnv, origin: string) {
  await logTransactionState(data, env, "completed");
  const userId = data?.customData?.userId;
  if (!userId) return;
  const item = data?.items?.[0];
  const transactionId: string | null = data?.id ?? null;
  const priceId = item?.price?.importMeta?.externalId ?? null;
  const productId = item?.product?.importMeta?.externalId ?? null;
  const amountCents = data?.details?.totals?.total ? Number(data.details.totals.total) : null;
  const currency = data?.currencyCode ?? "EUR";
  const occurredAt = data?.billedAt ?? data?.createdAt ?? new Date().toISOString();
  const receiptNumber = receiptNumberFor(transactionId, occurredAt);
  const descricao = `${PLAN_LABEL[productId] ?? "Subscrição"}${priceId ? ` (${cycleLabel(priceId)})` : ""}`;

  await logBillingEvent({
    userId,
    eventType: "transaction_completed",
    env,
    subscriptionId: data?.subscriptionId ?? null,
    productId,
    priceId,
    status: data?.status ?? "completed",
    amountCents,
    currency,
    metadata: {
      transactionId,
      receiptNumber,
      invoiceNumber: data?.invoiceNumber ?? null,
      descricao,
      billedAt: occurredAt,
    },
  });

  // Recibo automático por email (apenas em ambiente live).
  await sendBillingEmail({
    origin,
    env,
    userId,
    templateName: "payment-receipt",
    idempotencyKey: `receipt:${transactionId ?? receiptNumber}`,
    templateData: {
      numeroRecibo: receiptNumber,
      valor: formatAmount(amountCents, currency),
      data: formatDate(occurredAt),
      descricao,
    },
  });
}

/** Estado intermédio de uma transação (criada/à espera de pagamento). */
async function logTransactionState(data: any, env: PaddleEnv, estado: "pendente" | "completed") {
  if (estado === "completed") return; // o evento final é registado separadamente
  const userId = data?.customData?.userId;
  if (!userId) return;
  const item = data?.items?.[0];
  const priceId = item?.price?.importMeta?.externalId ?? null;
  const productId = item?.product?.importMeta?.externalId ?? null;
  const amountCents = data?.details?.totals?.total ? Number(data.details.totals.total) : null;
  const descricao = `${PLAN_LABEL[productId] ?? "Subscrição"}${priceId ? ` (${cycleLabel(priceId)})` : ""}`;
  await logBillingEvent({
    userId,
    eventType: "transaction_pending",
    env,
    subscriptionId: data?.subscriptionId ?? null,
    productId,
    priceId,
    status: data?.status ?? "pending",
    amountCents,
    currency: data?.currencyCode ?? "EUR",
    metadata: {
      transactionId: data?.id ?? null,
      descricao,
      billedAt: data?.billedAt ?? data?.createdAt ?? new Date().toISOString(),
    },
  });
}

/**
 * Ajustes (reembolsos/créditos) emitidos no processador de pagamentos.
 * Atualiza o histórico interno, avisa o cliente e regista o evento.
 */
async function handleAdjustment(data: any, env: PaddleEnv, origin: string) {
  const adjustmentId: string | undefined = data?.id;
  const transactionId: string | null = data?.transactionId ?? data?.transaction_id ?? null;
  if (!adjustmentId) return;
  if (data?.action && data.action !== "refund") return;

  const rawStatus: string | undefined = data?.status;
  const status =
    rawStatus === "approved" || rawStatus === "refunded"
      ? "concluido"
      : rawStatus === "rejected"
        ? "recusado"
        : "pendente";
  const amountCents = Number(data?.totals?.total ?? data?.payoutTotals?.total ?? 0) || null;
  const currency = data?.currencyCode ?? data?.currency_code ?? "EUR";
  const subscriptionId = data?.subscriptionId ?? data?.subscription_id ?? null;
  const userId = data?.customData?.userId ?? null;

  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from("refunds")
    .select("id,user_id,amount_cents,currency,paddle_subscription_id")
    .eq("paddle_adjustment_id", adjustmentId)
    .maybeSingle();

  const patch: Record<string, any> = {
    status,
    confirmed_at: status === "concluido" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  let row = existing as any;
  if (row) {
    await supabase.from("refunds").update(patch).eq("id", row.id);
  } else {
    // Reembolso emitido fora da app (ex.: painel do processador) — importa o registo.
    let ownerId = userId;
    if (!ownerId && subscriptionId) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("paddle_subscription_id", subscriptionId)
        .maybeSingle();
      ownerId = (sub as any)?.user_id ?? null;
    }
    if (!ownerId) {
      console.warn("[refunds] ajuste sem utilizador associado", adjustmentId);
      return;
    }
    const { data: inserted } = await supabase
      .from("refunds")
      .insert({
        user_id: ownerId,
        paddle_subscription_id: subscriptionId,
        paddle_transaction_id: transactionId,
        paddle_adjustment_id: adjustmentId,
        kind: "reembolso_parcial",
        amount_cents: amountCents ?? 0,
        currency,
        reason_code: "outro",
        reason_note: data?.reason ?? "Emitido fora da aplicação",
        status,
        confirmed_at: patch.confirmed_at,
        environment: env,
        metadata: { imported: true },
      })
      .select("id,user_id,amount_cents,currency,paddle_subscription_id")
      .maybeSingle();
    row = inserted;
  }
  if (!row) return;

  await logBillingEvent({
    userId: row.user_id,
    eventType: status === "concluido" ? "refund_completed" : `refund_${status}`,
    env,
    subscriptionId: row.paddle_subscription_id ?? subscriptionId,
    status,
    amountCents: amountCents ?? row.amount_cents,
    currency,
    metadata: { adjustment_id: adjustmentId, transaction_id: transactionId },
  });

  if (status === "concluido") {
    const valor = ((amountCents ?? row.amount_cents ?? 0) / 100).toFixed(2);
    await sendBillingEmail({
      origin,
      env,
      userId: row.user_id,
      templateName: "refund-processed",
      idempotencyKey: `refund:${adjustmentId}`,
      templateData: { valor: `${valor} ${currency}` },
    });
  }
}

async function handleWebhook(req: Request, env: PaddleEnv, origin: string) {
  const event = await verifyWebhook(req, env);
  if (await alreadyProcessed((event as { eventId?: string }).eventId, event.eventType, env)) {
    console.log("[webhook] evento repetido ignorado:", event.eventType);
    return;
  }
  switch (event.eventType) {
    case EventName.SubscriptionCreated:
      await handleSubscriptionCreated(event.data, env, origin);
      break;
    case EventName.SubscriptionUpdated:
    case "subscription.paused" as any:
    case "subscription.resumed" as any:
    case "subscription.past_due" as any:
    case "subscription.activated" as any:
      await handleSubscriptionUpdated(event.data, env, origin);
      break;
    case EventName.SubscriptionCanceled:
      await handleSubscriptionCanceled(event.data, env, origin);
      break;
    case EventName.TransactionCompleted:
      await handleTransactionCompleted(event.data, env, origin);
      break;
    case EventName.TransactionCreated:
    case EventName.TransactionUpdated:
      // Só interessa enquanto o pagamento ainda não está fechado.
      if (["draft", "ready", "billed", "past_due"].includes(String(event.data?.status ?? ""))) {
        await logTransactionState(event.data, env, "pendente");
      }
      break;
    case EventName.TransactionPaymentFailed:
      await handlePaymentFailed(event.data, env, origin);
      break;
    case "adjustment.created" as any:
    case "adjustment.updated" as any:
      await handleAdjustment(event.data, env, origin);
      break;
    default:
      console.log("Unhandled event:", event.eventType);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const env = (url.searchParams.get("env") || "sandbox") as PaddleEnv;
        try {
          await handleWebhook(request, env, url.origin);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
