// Server-side middleware that blocks access to endpoints based on the
// user's subscription plan. Composes with `requireSupabaseAuth` and reads
// the active plan (incl. trial / lifetime) from `public.profiles`.
import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ServerPlan = "light" | "base" | "premium" | "premium_vitalicio";
const RANK: Record<ServerPlan, number> = {
  light: 0,
  base: 1,
  premium: 2,
  premium_vitalicio: 3,
};

export class PlanRequiredError extends Error {
  required: ServerPlan;
  current: ServerPlan;
  constructor(required: ServerPlan, current: ServerPlan) {
    super(
      `Forbidden: este recurso requer o plano ${required.toUpperCase()} (atual: ${current.toUpperCase()}).`,
    );
    this.name = "PlanRequiredError";
    this.required = required;
    this.current = current;
  }
}

/**
 * Cria um middleware que exige um plano mínimo.
 * Lança `PlanRequiredError` se o utilizador não tiver acesso suficiente.
 * O cliente deve apanhar a falha e abrir o paywall.
 */
export function requirePlanAtLeast(required: ServerPlan) {
  return createMiddleware({ type: "function" })
    .middleware([requireSupabaseAuth])
    .server(async ({ next, context }) => {
      const { supabase, userId } = context as {
        supabase: ReturnType<typeof Object> & {
          from: (t: string) => {
            select: (c: string) => {
              eq: (k: string, v: string) => {
                maybeSingle: () => Promise<{
                  data: {
                    subscription_status?: string | null;
                    subscription_trial_ends?: string | null;
                  } | null;
                  error: unknown;
                }>;
              };
            };
          };
        };
        userId: string;
      };

      const { data, error } = await supabase
        .from("profiles")
        .select("subscription_status,subscription_trial_ends")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("[plan-guard] failed to read profile", error);
        throw new Error("Não foi possível validar a tua subscrição.");
      }

      const raw = (data?.subscription_status ?? "light") as ServerPlan;
      const trialEnds = data?.subscription_trial_ends
        ? new Date(data.subscription_trial_ends).getTime()
        : 0;
      const trialActive =
        raw !== "premium_vitalicio" && trialEnds > Date.now();
      // O teste dá acesso ao plano em teste, não a Premium por omissão.
      const effective: ServerPlan = trialActive ? (raw === "light" ? "base" : raw) : raw;

      if (RANK[effective] < RANK[required]) {
        throw new PlanRequiredError(required, effective);
      }

      return next({ context: { plan: effective } });
    });
}

export const requireBasePlan = requirePlanAtLeast("base");
export const requirePremiumPlan = requirePlanAtLeast("premium");