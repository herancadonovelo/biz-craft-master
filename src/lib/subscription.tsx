import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-state";
import { toast } from "sonner";
import { cancelSubscriptionFn, startSubscriptionTrialFn, redeemPromoCodeFn } from "@/lib/subscription.functions";
import { readPendingPromoCode, clearPendingPromoCode } from "@/lib/pending-promo";

export type Plan = "light" | "base" | "premium" | "premium_vitalicio";
const RANK: Record<Plan, number> = { light: 0, base: 1, premium: 2, premium_vitalicio: 3 };
const E2E_PLAN_OVERRIDE_KEY = "atelier-e2e-plan-override";

function readDevPlanOverride(): Plan | null {
  if (!import.meta.env.DEV || typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(E2E_PLAN_OVERRIDE_KEY) as Plan | null;
  return raw && raw in RANK ? raw : null;
}

export interface PlanDef {
  id: Plan;
  nome: string;
  precoMensal: number; // €/mês
  precoAnualMensal: number; // €/mês quando faturado anualmente (15% desc.)
  precoAnualTotal: number; // €/ano
  destaque?: boolean;
  trial: boolean;
  resumo: string;
  beneficios: string[];
  limitacoes?: string[];
}

const ANNUAL_DISCOUNT = 0.15;
const mkPrices = (mensal: number) => {
  const anualMensal = +(mensal * (1 - ANNUAL_DISCOUNT)).toFixed(2);
  const anualTotal = +(anualMensal * 12).toFixed(2);
  return { precoMensal: mensal, precoAnualMensal: anualMensal, precoAnualTotal: anualTotal };
};

export const ANNUAL_DISCOUNT_PCT = Math.round(ANNUAL_DISCOUNT * 100);

export type BillingCycle = "mensal" | "anual";

export const PLANS: PlanDef[] = [
  {
    id: "light", nome: "Light", precoMensal: 0, precoAnualMensal: 0, precoAnualTotal: 0, trial: false,
    resumo: "Para começar e organizar o essencial do atelier.",
    beneficios: [
      "Dashboard essencial",
      "Clientes (até 20) e stock (até 30)",
      "Tarefas, notas e calculadora de preços",
      "Ideal para começar sem custos",
    ],
  },
  {
    id: "base", nome: "Base", ...mkPrices(10.99), trial: true,
    resumo: "Para quem já vende e precisa de gerir encomendas e finanças.",
    beneficios: [
      "Tudo do Light, sem limites",
      "Encomendas, projetos, horas e faturação",
      "Marketing, cash-flow e backup completo",
      "Sincronização na nuvem + exportação A4/PDF",
      "Assistente IA (limitado)",
    ],
  },
  {
    id: "premium", nome: "Premium", ...mkPrices(16.99), trial: true, destaque: true,
    resumo: "Tudo desbloqueado — pensado para artesãos que vivem do negócio.",
    beneficios: [
      "Tudo do Base, sem limites",
      "Pacote completo de editores (Tricotin, Croché, Ponto Cruz, Amigurumi e Costura)",
      "Contador de carreiras, Moodboards e Conversor DMC/ANCHOR",
      "Craft & Relax Music + integrações (Etsy, Shopify, Woo, Squarespace, Jumpseller)",
      "Assistente IA sem limites e suporte prioritário",
    ],
  },
];

interface SubCtx {
  plan: Plan;
  billingCycle: BillingCycle;
  trialEnds: Date | null;
  trialActive: boolean;
  effectivePlan: Plan; // se o trial estiver ativo, premium
  loading: boolean;
  refresh: () => Promise<void>;
  startTrial: (plan: Plan, cycle?: BillingCycle) => Promise<void>;
  setPlan: (plan: Plan, cycle?: BillingCycle) => Promise<void>;
  paywall: { open: boolean; required: Plan; feature?: string } | null;
  showPaywall: (required: Plan, feature?: string, redirectTo?: string) => void;
  closePaywall: () => void;
  hasAccess: (required: Plan) => boolean;
  requireAccess: (required: Plan, feature?: string, redirectTo?: string) => boolean;
  pendingRedirect: string | null;
  clearPendingRedirect: () => void;
  redeemPromoCode: (code: string) => Promise<{ ok: boolean; lifetime?: boolean; discountPercent?: number; message: string }>;
}

const Ctx = createContext<SubCtx | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [plan, setPlanState] = useState<Plan>("light");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("mensal");
  const [trialEnds, setTrialEnds] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [paywall, setPaywall] = useState<SubCtx["paywall"]>(null);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

  const isLifetime = plan === "premium_vitalicio";
  const trialActive = !isLifetime && !!(trialEnds && trialEnds.getTime() > Date.now());
  // Durante um teste, o acesso é o do plano em teste (Base ou Premium),
  // nunca automaticamente Premium.
  const effectivePlan: Plan = isLifetime
    ? "premium_vitalicio"
    : trialActive
      ? (plan === "light" ? "base" : plan)
      : plan;

  const refresh = async () => {
    const devOverride = readDevPlanOverride();
    if (devOverride) {
      setPlanState(devOverride);
      setTrialEnds(null);
      setLoading(false);
      return;
    }
    if (!user) { setPlanState("light"); setTrialEnds(null); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("subscription_status,subscription_trial_ends,billing_cycle")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!error && data) {
      setPlanState((data.subscription_status as Plan) ?? "light");
      setTrialEnds(data.subscription_trial_ends ? new Date(data.subscription_trial_ends) : null);
      setBillingCycle(((data as { billing_cycle?: BillingCycle }).billing_cycle ?? "mensal") as BillingCycle);
    } else if (!error && !data) {
      // First time — ensure a row exists (trigger should have done this; safety net)
      await supabase.from("profiles").upsert({ user_id: user.id });
    }
    setLoading(false);
  };

  useEffect(() => { if (!authLoading) refresh(); /* eslint-disable-next-line */ }, [user?.id, authLoading]);

  // Refresca permissões automaticamente quando a janela volta a ganhar foco
  // (cobre cenários como upgrade feito noutra aba, Google Play, webhook, etc.)
  useEffect(() => {
    if (!user) return;
    const onFocus = () => { refresh(); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Realtime: ouve alterações ao perfil (upgrade, trial, vitalício) e refresca
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`profile-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
        () => { refresh(); },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const setPlan = async (next: Plan, cycle: BillingCycle = billingCycle) => {
    if (!user) { toast.error("Inicia sessão para alterar o plano"); return; }
    if (next === "light") {
      type CancelRes = { ok: boolean; accessUntil?: string | null; immediate?: boolean };
      let res: CancelRes | null = null;
      try {
        res = (await cancelSubscriptionFn()) as unknown as CancelRes;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falha a cancelar plano");
        return;
      }
      if (res?.accessUntil) {
        await refresh();
        toast.success("Subscrição cancelada.", {
          description: `Mantens o acesso até ${new Date(res.accessUntil).toLocaleDateString("pt-PT")}.`,
        });
        return;
      }
      setPlanState("light"); setTrialEnds(null); setBillingCycle(cycle);
      toast.success("Subscrição cancelada — voltaste ao plano Light.");
      return;
    }
    toast.error("Upgrade para planos pagos requer pagamento verificado. Usa o teste gratuito ou um código promocional.");
  };

  const startTrial = async (next: Plan, cycle: BillingCycle = billingCycle) => {
    if (!user) { toast.error("Inicia sessão para iniciar o teste"); return; }
    let res: { ok: boolean; message?: string; trial_ends?: string } | null = null;
    try {
      res = await startSubscriptionTrialFn({ data: { plan: next as "base" | "premium", cycle } });
    } catch { toast.error("Falha a iniciar teste"); return; }
    if (!res?.ok) { toast.error(res?.message ?? "Não foi possível iniciar o teste."); return; }
    const ends = res.trial_ends ? new Date(res.trial_ends) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    setPlanState(next); setTrialEnds(ends); setBillingCycle(cycle);
    toast.success("Teste gratuito de 14 dias ativado");
  };

  const hasAccess = (required: Plan) => RANK[effectivePlan] >= RANK[required];
  const showPaywall = (required: Plan, feature?: string, redirectTo?: string) => {
    setPaywall({ open: true, required, feature });
    if (redirectTo) setPendingRedirect(redirectTo);
  };
  const closePaywall = () => setPaywall(null);
  const clearPendingRedirect = () => setPendingRedirect(null);
  const requireAccess = (required: Plan, feature?: string, redirectTo?: string) => {
    if (hasAccess(required)) return true;
    showPaywall(required, feature, redirectTo);
    return false;
  };

  const redeemPromoCode: SubCtx["redeemPromoCode"] = async (rawCode) => {
    const code = rawCode.trim();
    if (!code) return { ok: false, message: "Introduz um código." };
    if (!user) return { ok: false, message: "Inicia sessão para aplicar um código." };
    type RedeemRes = { ok: boolean; message: string; lifetime?: boolean; discount_percent?: number; code?: string };
    let res: RedeemRes | null = null;
    try {
      res = (await redeemPromoCodeFn({ data: { code } })) as unknown as RedeemRes;
    } catch { return { ok: false, message: "Erro a validar o código." }; }
    if (!res) return { ok: false, message: "Resposta inválida do servidor." };
    if (!res.ok) return { ok: false, message: res.message };
    if (res.lifetime) {
      setPlanState("premium_vitalicio");
      setTrialEnds(null);
      toast.success("Acesso vitalício Premium ativado 🎉");
      return { ok: true, lifetime: true, message: res.message };
    }
    return { ok: true, discountPercent: res.discount_percent, message: res.message };
  };

  // Código introduzido no registo: aplica-se sozinho no primeiro acesso com sessão.
  useEffect(() => {
    if (authLoading || !user || loading) return;
    const pending = readPendingPromoCode();
    if (!pending) return;
    let cancelled = false;
    (async () => {
      const res = await redeemPromoCode(pending);
      if (cancelled) return;
      clearPendingPromoCode();
      if (res.ok && !res.lifetime) {
        toast.success(`Código ${pending} aplicado.`, { description: res.message });
      } else if (!res.ok) {
        toast.error(`Código ${pending} não aplicado`, { description: res.message });
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading, loading]);

  return (
    <Ctx.Provider value={{ plan, billingCycle, trialEnds, trialActive, effectivePlan, loading, refresh, startTrial, setPlan, paywall, showPaywall, closePaywall, hasAccess, requireAccess, pendingRedirect, clearPendingRedirect, redeemPromoCode }}>
      {children}
    </Ctx.Provider>
  );
}

export const useSubscription = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSubscription must be used within SubscriptionProvider");
  return c;
};

/**
 * Placeholder para integração futura com o Google Play Billing.
 * Quando o plugin nativo (Capacitor / Cordova) estiver ligado, esta função
 * lançará o fluxo de compra do Google Play e, no sucesso, deverá chamar
 * `setPlan(planId)` (ou `startTrial`) com o plano correspondente.
 */
export async function handleGooglePlayPurchase(planId: Plan, cycle: BillingCycle = "mensal"): Promise<{ ok: boolean; reason?: string }> {
  // TODO: integrar com Google Play Billing
  //   const productId = `subscription_${planId}_${cycle}`; // ex: subscription_premium_anual
  //   const purchase = await GooglePlay.purchase({ productId });
  //   await verifyOnServer(purchase.purchaseToken);
  //   await setPlan(planId);
  console.info("[GooglePlay] handleGooglePlayPurchase →", planId, cycle);
  return { ok: false, reason: "google_play_billing_not_wired" };
}