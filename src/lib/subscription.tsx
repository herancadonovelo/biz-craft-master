import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-state";
import { toast } from "sonner";

export type Plan = "light" | "base" | "premium" | "premium_vitalicio";
const RANK: Record<Plan, number> = { light: 0, base: 1, premium: 2, premium_vitalicio: 3 };

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
    limitacoes: [
      "Sem exportação A4 / PDF",
      "Sem Assistente IA",
      "Sem sincronização na nuvem ilimitada",
      "Sem Ferramentas Técnicas: Editor de Tricotin, Crochê, Ponto Cruz, Amigurumi, Costura, Contador de Carreiras & Pontos, Editor de Moodboards e Conversor de Cores DMC/ANCHOR/Sulinha/Finca",
      "Sem Craft & Relax Music (player persistente + mixer ambiente)",
    ],
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
      "Assistente IA limitado",
      "Exportação A4 / PDF",
    ],
    limitacoes: [
      "Sem Ferramentas Técnicas: Editor de Tricotin, Crochê, Ponto Cruz, Amigurumi, Costura, Contador de Carreiras & Pontos, Editor de Moodboards e Conversor de Cores DMC/ANCHOR/Sulinha/Finca",
      "Sem Craft & Relax Music (player persistente + mixer ambiente)",
    ],
  },
  {
    id: "premium", nome: "Premium", ...mkPrices(16.99), trial: true, destaque: true,
    resumo: "Tudo desbloqueado — pensado para artesãos que vivem do negócio.",
    beneficios: [
      "Tudo do Base",
      "Assistente IA sem limites",
      "Crescimento, relatórios e auditoria avançados",
      "Integrações Etsy / WhatsApp / Instagram",
      "Ferramentas Técnicas: Editor de Tricotin",
      "Ferramentas Técnicas: Editor de Crochê",
      "Ferramentas Técnicas: Editor de Ponto cruz",
      "Ferramentas Técnicas: Editor de Amigurumi",
      "Ferramentas Técnicas: Editor de Costura",
      "Contador de Carreiras & Pontos (com modo mãos-livres)",
      "Editor de Moodboards (canvas A4, IA e biblioteca de elementos)",
      "Conversor de Cores: DMC / ANCHOR / Sulinha / Finca",
      "Craft & Relax Music (player persistente + mixer ambiente)",
      "Sincronização com Shopify, WooCommerce, Squarespace e Jumpseller",
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
  const effectivePlan: Plan = isLifetime ? "premium_vitalicio" : (trialActive ? "premium" : plan);

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
    const { data, error } = await supabase
      .from("promo_codes")
      .select("id,code,discount_percent,is_lifetime,active,expires_at")
      .ilike("code", code)
      .maybeSingle();
    if (error) return { ok: false, message: "Erro a validar o código." };
    if (!data || !data.active) return { ok: false, message: "Código inválido ou inativo." };
    if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
      return { ok: false, message: "Código expirado." };
    }

    // Bloquear resgate duplicado por utilizador
    const { data: prev } = await supabase
      .from("promo_redemptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("promo_code_id", data.id)
      .maybeSingle();
    if (prev) {
      return { ok: false, message: "Já resgataste este código anteriormente." };
    }

    const { data: redemption, error: redErr } = await supabase
      .from("promo_redemptions")
      .insert({
        user_id: user.id,
        promo_code_id: data.id,
        code: data.code,
        discount_percent: data.discount_percent,
        is_lifetime: data.is_lifetime,
      } as never)
      .select("id,code,discount_percent,is_lifetime,redeemed_at")
      .single();
    if (redErr || !redemption) {
      // unique violation (corrida) → mesma mensagem
      if (redErr && (redErr as { code?: string }).code === "23505") {
        return { ok: false, message: "Já resgataste este código anteriormente." };
      }
      return { ok: false, message: "Falha a registar o resgate." };
    }

    // Fonte da verdade: usar os valores efetivamente persistidos na BD (não os pedidos pelo cliente).
    const persisted = redemption as { code: string; discount_percent: number; is_lifetime: boolean };
    // Integridade: alinhar com o promo_code servido (defesa contra manipulação local).
    if (
      persisted.discount_percent !== data.discount_percent ||
      persisted.is_lifetime !== data.is_lifetime ||
      persisted.code !== data.code
    ) {
      console.warn("[promo] divergência entre promo_codes e promo_redemptions", { server: data, persisted });
      return { ok: false, message: "Inconsistência detetada no resgate. Tenta novamente." };
    }

    if (persisted.is_lifetime) {
      const { error: upErr } = await supabase
        .from("profiles")
        .update({ subscription_status: "premium_vitalicio", subscription_trial_ends: null } as never)
        .eq("user_id", user.id);
      if (upErr) return { ok: false, message: "Falha a ativar acesso vitalício." };
      setPlanState("premium_vitalicio");
      setTrialEnds(null);
      toast.success("Acesso vitalício Premium ativado 🎉");
      return { ok: true, lifetime: true, message: "Acesso vitalício ativado com sucesso." };
    }
    return {
      ok: true,
      discountPercent: persisted.discount_percent,
      message: `Código ${persisted.code} aplicado e registado no servidor: ${persisted.discount_percent}% de desconto confirmado.`,
    };
  };

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