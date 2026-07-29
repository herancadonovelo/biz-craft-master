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
