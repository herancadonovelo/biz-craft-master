import { createClient } from "@supabase/supabase-js";
import type { PaddleEnv } from "@/lib/paddle.server";

let _admin: ReturnType<typeof createClient<any>> | null = null;
function admin() {
  if (!_admin) {
    _admin = createClient<any>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  }
  return _admin;
}

export type CancelMode = "immediately" | "next_billing_period";

export interface CancelResult {
  canceled: string[];
  failed: string[];
  /** Fim do acesso quando o cancelamento só produz efeito no fim do período. */
  accessUntil: string | null;
}

/**
 * Cancela no processador de pagamentos todas as subscrições ativas do
 * utilizador (em ambos os ambientes). Nunca lança: devolve o resultado
 * para o chamador decidir o que mostrar.
 */
export async function cancelUserPaddleSubscriptions(
  userId: string,
  mode: CancelMode = "next_billing_period",
): Promise<CancelResult> {
  const result: CancelResult = { canceled: [], failed: [], accessUntil: null };
  const { data: subs } = await admin()
    .from("subscriptions")
    .select("paddle_subscription_id,environment,status,current_period_end")
    .eq("user_id", userId)
    .in("status", ["active", "trialing", "past_due", "paused"]);

  if (!subs?.length) return result;

  const { getPaddleClient } = await import("@/lib/paddle.server");
  for (const sub of subs as Array<{
    paddle_subscription_id: string;
    environment: PaddleEnv;
    current_period_end: string | null;
  }>) {
    try {
      const paddle = getPaddleClient(sub.environment);
      await paddle.subscriptions.cancel(sub.paddle_subscription_id, {
        effectiveFrom: mode === "immediately" ? "immediately" : "next_billing_period",
      } as any);
      result.canceled.push(sub.paddle_subscription_id);
      if (mode !== "immediately" && sub.current_period_end) {
        if (!result.accessUntil || new Date(sub.current_period_end) > new Date(result.accessUntil)) {
          result.accessUntil = sub.current_period_end;
        }
      }
      await admin()
        .from("subscriptions")
        .update({
          cancel_at_period_end: mode !== "immediately",
          ...(mode === "immediately" ? { status: "canceled" } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("paddle_subscription_id", sub.paddle_subscription_id);
    } catch (e) {
      console.error("[billing] falha a cancelar subscrição", sub.paddle_subscription_id, e);
      result.failed.push(sub.paddle_subscription_id);
    }
  }
  return result;
}
