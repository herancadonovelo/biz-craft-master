import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-state";
import { toast } from "sonner";

export type Plan = "light" | "base" | "premium";
const RANK: Record<Plan, number> = { light: 0, base: 1, premium: 2 };

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
      "Dashboard básico",
      "Lista de clientes (até 20)",
      "Stock de materiais (até 30)",
      "To-do list e notas",
      "Calculadora de preços",
    ],
    limitacoes: ["Sem Criador de Moldes", "Sem exportação A4 / PDF", "Sem Assistente IA", "Sem sincronização na nuvem ilimitada"],
  },
  {
    id: "base", nome: "Base", ...mkPrices(10.99), trial: true,
    resumo: "Para quem já vende e precisa de gerir encomendas e finanças.",
    beneficios: [
      "Tudo do Light, sem limites",
      "Encomendas, projetos e horas",
      "Faturação e cash-flow",
      "Marketing & campanhas",
      "Backup & restauro completo",
      "Sincronização na nuvem",
    ],
    limitacoes: ["Sem Criador de Moldes", "Sem exportação A4 do molde", "Assistente IA limitado"],
  },
  {
    id: "premium", nome: "Premium", ...mkPrices(16.99), trial: true, destaque: true,
    resumo: "Tudo desbloqueado — pensado para artesãos que vivem do negócio.",
    beneficios: [
      "Tudo do Base",
      "Criador de Moldes completo (camadas, curvas, biblioteca)",
      "Exportação A4 / PDF de moldes",
      "Assistente IA sem limites",
      "Crescimento, relatórios e auditoria avançados",
      "Integrações Etsy / WhatsApp / Instagram",
      "Suporte prioritário",
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
  showPaywall: (required: Plan, feature?: string) => void;
  closePaywall: () => void;
  hasAccess: (required: Plan) => boolean;
  requireAccess: (required: Plan, feature?: string) => boolean;
}

const Ctx = createContext<SubCtx | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [plan, setPlanState] = useState<Plan>("light");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("mensal");
  const [trialEnds, setTrialEnds] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [paywall, setPaywall] = useState<SubCtx["paywall"]>(null);

  const trialActive = !!(trialEnds && trialEnds.getTime() > Date.now());
  const effectivePlan: Plan = trialActive ? "premium" : plan;

  const refresh = async () => {
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

  const setPlan = async (next: Plan, cycle: BillingCycle = billingCycle) => {
    if (!user) { toast.error("Inicia sessão para alterar o plano"); return; }
    const { error } = await supabase.from("profiles").update({ subscription_status: next, billing_cycle: cycle } as never).eq("user_id", user.id);
    if (error) { toast.error("Falha a atualizar plano"); return; }
    setPlanState(next); setBillingCycle(cycle);
    toast.success(`Plano ${next.toUpperCase()} (${cycle}) ativo`);
  };

  const startTrial = async (next: Plan, cycle: BillingCycle = billingCycle) => {
    if (!user) { toast.error("Inicia sessão para iniciar o teste"); return; }
    const ends = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const { error } = await supabase
      .from("profiles")
      .update({ subscription_status: next, subscription_trial_ends: ends.toISOString(), billing_cycle: cycle } as never)
      .eq("user_id", user.id);
    if (error) { toast.error("Falha a iniciar teste"); return; }
    setPlanState(next); setTrialEnds(ends); setBillingCycle(cycle);
    toast.success("Teste gratuito de 14 dias ativado");
  };

  const hasAccess = (required: Plan) => RANK[effectivePlan] >= RANK[required];
  const showPaywall = (required: Plan, feature?: string) => setPaywall({ open: true, required, feature });
  const closePaywall = () => setPaywall(null);
  const requireAccess = (required: Plan, feature?: string) => {
    if (hasAccess(required)) return true;
    showPaywall(required, feature);
    return false;
  };

  return (
    <Ctx.Provider value={{ plan, billingCycle, trialEnds, trialActive, effectivePlan, loading, refresh, startTrial, setPlan, paywall, showPaywall, closePaywall, hasAccess, requireAccess }}>
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