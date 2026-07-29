import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const envSchema = z.enum(["sandbox", "live"]);

export interface SubscriptionItemInfo {
  priceId: string | null;
  nome: string | null;
  amount: string | null;
  currency: string | null;
  intervalo: string | null;
}

export interface MySubscriptionInfo {
  encontrada: boolean;
  environment: "sandbox" | "live";
  subscriptionId: string | null;
  estado: string | null;
  estadoRemoto: string | null;
  planoInterno: string | null;
  cicloInterno: string | null;
  inicioPeriodo: string | null;
  fimPeriodo: string | null;
  cancelaNoFimDoPeriodo: boolean;
  proximaCobranca: string | null;
  itens: SubscriptionItemInfo[];
  erroRemoto: string | null;
}

/** Estado da subscrição do utilizador, cruzando a app com o processador de pagamentos. */
export const mySubscriptionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ environment: envSchema }).parse(d))
  .handler(async ({ context, data }): Promise<MySubscriptionInfo> => {
    const base: MySubscriptionInfo = {
      encontrada: false,
      environment: data.environment,
      subscriptionId: null,
      estado: null,
      estadoRemoto: null,
      planoInterno: null,
      cicloInterno: null,
      inicioPeriodo: null,
      fimPeriodo: null,
      cancelaNoFimDoPeriodo: false,
      proximaCobranca: null,
      itens: [],
      erroRemoto: null,
    };

    const { data: sub } = await context.supabase
      .from("subscriptions")
      .select(
        "paddle_subscription_id,status,product_id,price_id,current_period_start,current_period_end,cancel_at_period_end",
      )
      .eq("user_id", context.userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub) return base;

    const info: MySubscriptionInfo = {
      ...base,
      encontrada: true,
      subscriptionId: sub.paddle_subscription_id,
      estado: sub.status,
      planoInterno: sub.product_id,
      cicloInterno: sub.price_id?.endsWith("_yearly") ? "anual" : "mensal",
      inicioPeriodo: sub.current_period_start,
      fimPeriodo: sub.current_period_end,
      cancelaNoFimDoPeriodo: !!sub.cancel_at_period_end,
    };

    try {
      const { getPaddleClient } = await import("@/lib/paddle.server");
      const paddle = getPaddleClient(data.environment);
      const remote: any = await paddle.subscriptions.get(sub.paddle_subscription_id);
      info.estadoRemoto = remote?.status ?? null;
      info.proximaCobranca = remote?.nextBilledAt ?? null;
      info.cancelaNoFimDoPeriodo =
        remote?.scheduledChange?.action === "cancel" || info.cancelaNoFimDoPeriodo;
      info.itens = (remote?.items ?? []).map((it: any) => ({
        priceId: it?.price?.importMeta?.externalId ?? it?.price?.id ?? null,
        nome: it?.price?.description ?? it?.product?.name ?? null,
        amount: it?.price?.unitPrice?.amount ?? null,
        currency: it?.price?.unitPrice?.currencyCode ?? null,
        intervalo: it?.price?.billingCycle?.interval ?? null,
      }));
    } catch (e) {
      info.erroRemoto = e instanceof Error ? e.message : String(e);
    }

    return info;
  });

/** Cancela (ou reativa) a subscrição do utilizador no processador de pagamentos. */
export const cancelMySubscriptionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        environment: envSchema,
        modo: z.enum(["fim_do_periodo", "imediato", "reativar"]),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { data: sub } = await context.supabase
      .from("subscriptions")
      .select("paddle_subscription_id,status")
      .eq("user_id", context.userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub) return { ok: false as const, message: "Não encontrámos nenhuma subscrição ativa." };

    const { getPaddleClient } = await import("@/lib/paddle.server");
    const paddle = getPaddleClient(data.environment);
    try {
      if (data.modo === "reativar") {
        await (paddle.subscriptions as any).update(sub.paddle_subscription_id, {
          scheduledChange: null,
        });
        return { ok: true as const, message: "Cancelamento anulado. A subscrição continua ativa." };
      }
      await (paddle.subscriptions as any).cancel(sub.paddle_subscription_id, {
        effectiveFrom: data.modo === "imediato" ? "immediately" : "next_billing_period",
      });
      return {
        ok: true as const,
        message:
          data.modo === "imediato"
            ? "Subscrição cancelada de imediato."
            : "Cancelamento agendado para o fim do período já pago.",
      };
    } catch (e) {
      return {
        ok: false as const,
        message: e instanceof Error ? e.message : "Não foi possível concluir o pedido.",
      };
    }
  });