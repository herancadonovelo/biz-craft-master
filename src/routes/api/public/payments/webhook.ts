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
) {
  // O ambiente de teste nunca altera o acesso real do utilizador.
  if (env !== "live") return;
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

  await syncProfilePlan(userId, env, productId, priceId, ["active", "trialing", "past_due"].includes(status));

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
  await syncProfilePlan(row.user_id, env, row.product_id, row.price_id, stillInPeriod);

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

async function handleTransactionCompleted(data: any, env: PaddleEnv) {
  const userId = data?.customData?.userId;
  if (!userId) return;
  const item = data?.items?.[0];
  await logBillingEvent({
    userId,
    eventType: "transaction_completed",
    env,
    subscriptionId: data?.subscriptionId ?? null,
    priceId: item?.price?.importMeta?.externalId ?? null,
    status: data?.status ?? "completed",
    amountCents: data?.details?.totals?.total ? Number(data.details.totals.total) : null,
    currency: data?.currencyCode ?? null,
  });
}

async function handleWebhook(req: Request, env: PaddleEnv, origin: string) {
  const event = await verifyWebhook(req, env);
  switch (event.eventType) {
    case EventName.SubscriptionCreated:
      await handleSubscriptionCreated(event.data, env, origin);
      break;
    case EventName.SubscriptionUpdated:
      await handleSubscriptionUpdated(event.data, env, origin);
      break;
    case EventName.SubscriptionCanceled:
      await handleSubscriptionCanceled(event.data, env, origin);
      break;
    case EventName.TransactionCompleted:
      await handleTransactionCompleted(event.data, env);
      break;
    case EventName.TransactionPaymentFailed:
      await handlePaymentFailed(event.data, env, origin);
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
