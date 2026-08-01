import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Star, Loader2, Ticket, Infinity as InfinityIcon } from "lucide-react";
import { PLANS, useSubscription, ANNUAL_DISCOUNT_PCT, type Plan, type BillingCycle } from "@/lib/subscription";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { paddlePriceIdFor, getPaddleEnvironment } from "@/lib/paddle";
import { createPortalSession, changeSubscriptionPlan, resolvePaddleDiscount } from "@/utils/payments.functions";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { useAuth } from "@/lib/auth-state";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/store";

export const Route = createFileRoute("/planos")({
  head: () => ({
    meta: [
      { title: "Planos e Subscrições — Craft Business Master" },
      { name: "description", content: "Escolhe o plano que melhor se adapta ao teu atelier. 14 dias grátis em qualquer plano pago." },
      { property: "og:title", content: "Planos e Subscrições — Craft Business Master" },
      { property: "og:description", content: "Compara os planos Light, Base e Premium. 14 dias grátis em qualquer plano pago." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://craftbusinessmaster.com/planos" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://craftbusinessmaster.com/planos" }],
  }),
  component: PlanosPage,
});

function PlanosPage() {
  const { user } = useAuth();
  const { plan, trialEnds, trialActive, setPlan, loading, redeemPromoCode } = useSubscription();
  const { openCheckout } = usePaddleCheckout();
  const [busy, setBusy] = useState<Plan | null>(null);
  const [portalBusy, setPortalBusy] = useState(false);
  const [cycle, setCycle] = useState<BillingCycle>("mensal");
  const [promoInput, setPromoInput] = useState("");
  const [promoBusy, setPromoBusy] = useState(false);
  const [promoFeedback, setPromoFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<{ code: string; pct: number } | null>(null);
  const [cancelBusy, setCancelBusy] = useState(false);
  const isLifetime = plan === "premium_vitalicio";
  const promoInflight = useRef<Promise<unknown> | null>(null);

  const onApplyPromo = async () => {
    // Bloqueia cliques/Enter simultâneos: reaproveita a chamada em curso
    if (promoInflight.current) {
      await promoInflight.current;
      return;
    }
    setPromoBusy(true);
    setPromoFeedback({ ok: true, message: "A validar código…" });
    // Limpa qualquer desconto previamente aplicado — só voltará a aparecer se este resgate for bem-sucedido
    setPromoDiscount(null);
    const codeSnapshot = promoInput.trim().toUpperCase();
    const p = (async () => {
      try {
        const res = await redeemPromoCode(promoInput);
        setPromoFeedback({ ok: res.ok, message: res.message });
        if (res.ok && res.lifetime) {
          setPromoDiscount(null);
          setPromoInput("");
        } else if (res.ok && res.discountPercent) {
          setPromoDiscount({ code: codeSnapshot, pct: res.discountPercent });
        } else {
          // Falha → garante que nenhum desconto antigo persiste
          setPromoDiscount(null);
        }
      } catch {
        setPromoFeedback({ ok: false, message: "Erro inesperado ao validar o código." });
        setPromoDiscount(null);
      } finally {
        setPromoBusy(false);
        promoInflight.current = null;
      }
    })();
    promoInflight.current = p;
    await p;
  };

  const applyDiscount = (price: number) => promoDiscount ? +(price * (1 - promoDiscount.pct / 100)).toFixed(2) : price;

  const onSubscribe = async (id: Plan, overrideCycle?: BillingCycle) => {
    if (!user) { toast.error("Inicia sessão para subscrever"); return; }
    if (id !== "base" && id !== "premium") return;
    setBusy(id);
    const chosen = overrideCycle ?? cycle;
    const targetPriceId = paddlePriceIdFor(id, chosen);
    try {
      // Se ja existe subscricao ativa, trata-se de upgrade/downgrade: alteracao
      // imediata com faturacao proporcional em vez de novo checkout.
      const change = await changeSubscriptionPlan({
        data: { environment: getPaddleEnvironment(), priceId: targetPriceId },
      });
      if (change.ok) {
        toast.success(change.message);
        return;
      }
      if (change.code === "same_plan") {
        toast.info(change.message);
        return;
      }
      if (change.code !== "no_subscription") {
        toast.error(change.message);
        return;
      }
      // Código promocional válido → aplica o desconto real no checkout.
      let discountId: string | null = null;
      if (promoDiscount) {
        try {
          const d = await resolvePaddleDiscount({
            data: { code: promoDiscount.code, environment: getPaddleEnvironment() },
          });
          discountId = d.discountId;
          if (!d.ok) {
            toast.warning("O código foi validado na app, mas não está configurado no checkout. O pagamento avança sem desconto.");
          }
        } catch {
          discountId = null;
        }
      }
      await openCheckout({
        priceId: targetPriceId,
        customerEmail: user.email ?? undefined,
        customData: { userId: user.id },
        discountId,
        successUrl: `${window.location.origin}/planos?checkout=success`,
      });
    } catch (e) {
      console.error("[checkout]", e);
      toast.error("Não foi possível abrir o pagamento. Tenta novamente.");
    } finally { setBusy(null); }
  };

  const onOpenPortal = async () => {
    setPortalBusy(true);
    try {
      const res = await createPortalSession({ data: { environment: getPaddleEnvironment() } });
      if (!res.ok || !res.url) {
        toast.error(res.message ?? "Ainda não tens uma subscrição para gerir.");
        return;
      }
      window.open(res.url, "_blank", "noopener");
    } catch (e) {
      console.error("[portal]", e);
      toast.error("Não foi possível abrir a gestão da subscrição.");
    } finally { setPortalBusy(false); }
  };

  // O teste de 14 dias é agora concedido pelo processador de pagamentos:
  // abre o checkout normal (não há cobrança durante o período experimental).
  const onStartTrial = (id: Plan) => onSubscribe(id);

  const onCancel = async () => {
    setCancelBusy(true);
    try { await setPlan("light"); } finally { setCancelBusy(false); }
  };

  return (
    <div className="space-y-6">
      <PaymentTestModeBanner />
      <PageHeader
        title="Planos & Subscrições"
        description="Escolhe o nível de acesso. Todos os planos pagos incluem 14 dias grátis sem compromisso."
      />

      <div className="flex flex-col items-center gap-2">
        <Tabs value={cycle} onValueChange={(v) => setCycle(v as BillingCycle)}>
          <TabsList>
            <TabsTrigger value="mensal">Mensal</TabsTrigger>
            <TabsTrigger value="anual" className="gap-2">
              Anual <Badge variant="secondary">-{ANNUAL_DISCOUNT_PCT}%</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="text-xs text-muted-foreground">
          {cycle === "anual" ? `Poupas ${ANNUAL_DISCOUNT_PCT}% face ao plano mensal.` : `Subscreve anualmente e poupa ${ANNUAL_DISCOUNT_PCT}%.`}
        </p>
      </div>

      {!user && (
        <Card className="border-amber-500/40 bg-amber-500/5"><CardContent className="p-4 text-sm">
          Para guardar o teu plano e iniciar o teste gratuito, <Link to="/auth" className="font-medium underline">inicia sessão</Link>.
        </CardContent></Card>
      )}

      {user && (
        <Card><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary"><Sparkles className="h-5 w-5" /></div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Plano atual</p>
              <p className="font-display text-lg">
                {loading ? "A carregar…" : isLifetime ? "Premium Vitalício" : (PLANS.find((p) => p.id === plan)?.nome ?? "Light")}
                {isLifetime && <Badge className="ml-2 gap-1"><InfinityIcon className="h-3 w-3" />Vitalício</Badge>}
                {trialActive && !isLifetime && <Badge variant="secondary" className="ml-2">Teste ativo</Badge>}
              </p>
            </div>
          </div>
          {trialActive && !isLifetime && trialEnds && (
            <p className="text-sm text-muted-foreground">Teste termina em <strong>{trialEnds.toLocaleDateString("pt-PT")}</strong></p>
          )}
          {!isLifetime && (
            <Button variant="outline" size="sm" disabled={portalBusy} onClick={onOpenPortal}>
              {portalBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Gerir subscrição
            </Button>
          )}
        </CardContent></Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => {
          const isCurrent = plan === p.id && !trialActive;
          const highlighted = p.destaque;
          const isFree = p.precoMensal === 0;
          const precoMostrar = cycle === "anual" ? p.precoAnualMensal : p.precoMensal;
          return (
            <Card key={p.id} className={`relative flex flex-col ${highlighted ? "border-primary shadow-lg ring-1 ring-primary/40" : ""}`}>
              {highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="gap-1"><Star className="h-3 w-3" />Mais escolhido</Badge>
                </div>
              )}
              <CardContent className="flex flex-1 flex-col gap-4 p-5">
                <div>
                  <h3 className="font-display text-2xl">{p.nome}</h3>
                  {isFree ? (
                    <p className="mt-1 text-3xl font-semibold">Grátis</p>
                  ) : (
                    <>
                      <p className="mt-1 text-3xl font-semibold">
                        {promoDiscount && (
                          <span className="mr-2 text-lg font-normal text-muted-foreground line-through">
                            {formatCurrency(precoMostrar)}
                          </span>
                        )}
                        {formatCurrency(applyDiscount(precoMostrar))}<span className="text-sm font-normal text-muted-foreground">/mês</span>
                      </p>
                      {promoDiscount && (
                        <p className="text-xs font-medium text-emerald-600">Código {promoDiscount.code} (-{promoDiscount.pct}%)</p>
                      )}
                      {cycle === "anual" ? (
                        <p className="text-xs text-muted-foreground">
                          faturado anualmente — {formatCurrency(applyDiscount(p.precoAnualTotal))}/ano
                          <span className="ml-1 font-medium text-primary">(poupa {ANNUAL_DISCOUNT_PCT}%)</span>
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          ou {formatCurrency(applyDiscount(p.precoAnualMensal))}/mês no plano anual
                        </p>
                      )}
                    </>
                  )}
                  {p.trial && <p className="mt-1 text-sm font-medium text-primary">Experimente Grátis por 14 Dias</p>}
                  <p className="mt-2 text-sm text-muted-foreground">{p.resumo}</p>
                </div>

                <ul className="space-y-3 text-sm leading-relaxed">
                  {p.beneficios.map((b) => (
                    <li key={b} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto space-y-2 pt-2">
                  {isFree ? (
                    <Button variant="outline" className="w-full" disabled={isCurrent || cancelBusy} onClick={onCancel}>
                      {cancelBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {isCurrent ? "Plano atual" : "Cancelar subscrição e usar plano gratuito"}
                    </Button>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Button
                        className="w-full"
                        variant={highlighted && cycle === "mensal" ? "default" : "secondary"}
                        disabled={busy === p.id || isCurrent}
                        onClick={() => onSubscribe(p.id, "mensal")}
                      >
                        {busy === p.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Mensal · {formatCurrency(applyDiscount(p.precoMensal))}
                      </Button>
                      <Button
                        className="w-full"
                        variant={highlighted ? "default" : "secondary"}
                        disabled={busy === p.id || isCurrent}
                        onClick={() => onSubscribe(p.id, "anual")}
                      >
                        {busy === p.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Star className="mr-2 h-4 w-4" />}
                        Anual · {formatCurrency(applyDiscount(p.precoAnualTotal))}
                        <Badge variant="outline" className="ml-1 border-current/30">-{ANNUAL_DISCOUNT_PCT}%</Badge>
                      </Button>
                    </div>
                  )}
                  {p.trial && (
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={busy === p.id}
                      onClick={() => onStartTrial(p.id)}
                    >
                      Começar Teste Gratuito de 14 Dias
                    </Button>
                  )}
                  {p.trial && (
                    <p className="text-center text-[11px] leading-snug text-muted-foreground">
                      Cartão necessário. Nada é cobrado nos primeiros 14 dias e podes cancelar antes do fim.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Pagamento seguro processado no checkout integrado. Podes cancelar a qualquer momento.
      </p>

      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center gap-2">
            <Ticket className="h-4 w-4 text-primary" />
            <h3 className="font-display text-lg">Tens um código promocional?</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Introduz o teu código para aplicar um desconto ou ativar um acesso especial.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={promoInput}
              onChange={(e) => { setPromoInput(e.target.value); setPromoFeedback(null); }}
              placeholder="Ex: PROMO10"
              className="font-mono uppercase"
              disabled={promoBusy || isLifetime}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !promoBusy && !isLifetime && promoInput.trim()) {
                  e.preventDefault();
                  onApplyPromo();
                }
              }}
            />
            <Button onClick={onApplyPromo} disabled={promoBusy || !promoInput.trim() || isLifetime}>
              {promoBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {promoBusy ? "A validar…" : "Aplicar"}
            </Button>
          </div>
          {promoFeedback && (
            <div
              role="status"
              aria-live="polite"
              className={`rounded-lg border p-4 text-sm space-y-3 ${
                promoBusy
                  ? "border-muted bg-muted/40 text-muted-foreground"
                  : promoFeedback.ok
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "border-destructive/40 bg-destructive/10 text-destructive"
              }`}
            >
              <div className="flex items-start gap-3">
                {promoFeedback.ok && !promoBusy ? (
                  <div className="rounded-full bg-emerald-500/20 p-1.5 text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="h-5 w-5 animate-pulse" />
                  </div>
                ) : null}
                <div className="space-y-1">
                  <p className="font-semibold">
                    {promoBusy
                      ? "A validar..."
                      : promoFeedback.ok
                      ? "Código Resgatado com Sucesso! 🎉"
                      : "Não foi possível aplicar o código"}
                  </p>
                  <p className="opacity-90">{promoFeedback.message}</p>
                </div>
              </div>

              {promoFeedback.ok && !promoBusy && (
                <div className="rounded-md bg-emerald-500/5 p-3 border border-emerald-500/20 text-xs space-y-2">
                  <p className="font-medium text-emerald-800 dark:text-emerald-300">Resumo do benefício ativado:</p>
                  <ul className="list-disc pl-4 space-y-1 text-emerald-700/90 dark:text-emerald-400/90">
                    {promoDiscount ? (
                      <>
                        <li><strong>Código Aplicado:</strong> {promoDiscount.code}</li>
                        <li><strong>Desconto Ganho:</strong> {promoDiscount.pct}% de desconto imediato em todos os planos</li>
                        <li><strong>Novos Preços:</strong> Os valores exibidos nos cartões de plano acima já incluem este desconto!</li>
                      </>
                    ) : isLifetime ? (
                      <>
                        <li><strong>Acesso Vitalício:</strong> Ativado gratuitamente para sempre!</li>
                        <li><strong>Tipo de Plano:</strong> Premium Vitalício</li>
                        <li><strong>Vantagem:</strong> Acesso total a todas as ferramentas (Criador de Moldes, Assistente IA, Exportações e mais), sem necessidade de pagamentos recorrentes ou subscrições futuras.</li>
                      </>
                    ) : (
                      <li>Código aplicado com sucesso no seu perfil do atelier.</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
          {isLifetime && !promoFeedback && (
            <div className="rounded-lg border border-primary/40 bg-primary/5 p-4 text-sm space-y-2">
              <div className="flex items-center gap-2 font-semibold text-primary">
                <InfinityIcon className="h-5 w-5" />
                <span>Acesso Premium Vitalício Ativo</span>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Parabéns! Tens acesso vitalício gratuito com todas as funcionalidades da aplicação desbloqueadas, sem expirar e sem qualquer mensalidade.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}