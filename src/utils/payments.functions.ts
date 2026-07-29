import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const envSchema = z.enum(["sandbox", "live"]);

/** Resolve um ID legivel de preco (ex.: premium_monthly) para o ID interno do Paddle. */
export const resolvePaddlePrice = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({ priceId: z.string().min(1).max(64), environment: envSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    const { gatewayFetch } = await import("@/lib/paddle.server");
    const res = await gatewayFetch(
      data.environment,
      `/prices?external_id=${encodeURIComponent(data.priceId)}`,
    );
    if (!res.ok) throw new Error(`Price lookup failed [${res.status}]: ${await res.text()}`);
    const result = await res.json();
    if (!result.data?.length) throw new Error("Price not found");
    return result.data[0].id as string;
  });

/** Cria uma sessao do portal do cliente (gerir/cancelar subscricao, faturas). */
export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ environment: envSchema }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: sub } = await context.supabase
      .from("subscriptions")
      .select("paddle_customer_id,paddle_subscription_id")
      .eq("user_id", context.userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub) return { ok: false as const, message: "Nao encontramos nenhuma subscricao ativa." };

    const { getPaddleClient } = await import("@/lib/paddle.server");
    const paddle = getPaddleClient(data.environment);
    const session = await paddle.customerPortalSessions.create(sub.paddle_customer_id, [
      sub.paddle_subscription_id,
    ]);
    return { ok: true as const, url: session.urls.general.overview };
  });

/**
 * Muda o plano da subscricao ativa (upgrade/downgrade) com efeito imediato
 * e faturacao proporcional (prorated).
 */
export const changeSubscriptionPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ environment: envSchema, priceId: z.string().min(1).max(64) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { data: sub } = await context.supabase
      .from("subscriptions")
      .select("paddle_subscription_id,price_id,status")
      .eq("user_id", context.userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub || !["active", "trialing", "past_due"].includes(sub.status)) {
      return { ok: false as const, message: "Nao encontramos nenhuma subscricao ativa para alterar." };
    }
    if (sub.price_id === data.priceId) {
      return { ok: false as const, message: "Ja estas nesse plano." };
    }

    const { gatewayFetch, getPaddleClient } = await import("@/lib/paddle.server");
    const lookup = await gatewayFetch(
      data.environment,
      `/prices?external_id=${encodeURIComponent(data.priceId)}`,
    );
    if (!lookup.ok) {
      return { ok: false as const, message: "Nao foi possivel encontrar o plano escolhido." };
    }
    const found = await lookup.json();
    const paddlePriceId = found.data?.[0]?.id as string | undefined;
    if (!paddlePriceId) return { ok: false as const, message: "Plano indisponivel." };

    const paddle = getPaddleClient(data.environment);
    await paddle.subscriptions.update(sub.paddle_subscription_id, {
      items: [{ priceId: paddlePriceId, quantity: 1 }],
      prorationBillingMode: "prorated_immediately",
    } as any);

    return { ok: true as const, message: "Plano alterado. A diferenca e cobrada proporcionalmente." };
  });
