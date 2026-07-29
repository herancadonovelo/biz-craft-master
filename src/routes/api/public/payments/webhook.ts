import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { verifyWebhook, EventName, type PaddleEnv } from "@/lib/paddle.server";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
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

async function handleSubscriptionCreated(data: any, env: PaddleEnv) {
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
}

async function handleSubscriptionUpdated(data: any, env: PaddleEnv) {
  const { id, status, currentBillingPeriod, scheduledChange } = data;
  const { data: rows } = await getSupabase()
    .from("subscriptions")
    .update({
      status,
      current_period_start: currentBillingPeriod?.startsAt,
      current_period_end: currentBillingPeriod?.endsAt,
      cancel_at_period_end: scheduledChange?.action === "cancel",
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", id)
    .eq("environment", env)
    .select("user_id,product_id,price_id");

  const row = rows?.[0] as { user_id: string; product_id: string; price_id: string } | undefined;
  if (row) {
    await syncProfilePlan(
      row.user_id,
      env,
      row.product_id,
      row.price_id,
      ["active", "trialing", "past_due"].includes(status),
    );
  }
}

async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
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
}

async function handleWebhook(req: Request, env: PaddleEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.eventType) {
    case EventName.SubscriptionCreated:
      await handleSubscriptionCreated(event.data, env);
      break;
    case EventName.SubscriptionUpdated:
      await handleSubscriptionUpdated(event.data, env);
      break;
    case EventName.SubscriptionCanceled:
      await handleSubscriptionCanceled(event.data, env);
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
          await handleWebhook(request, env);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
