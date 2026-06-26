import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Sparkles, Star, Loader2, Ticket, Infinity as InfinityIcon } from "lucide-react";
import { PLANS, useSubscription, handleGooglePlayPurchase, ANNUAL_DISCOUNT_PCT, type Plan, type BillingCycle } from "@/lib/subscription";
import { useAuth } from "@/lib/auth-state";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/planos")({
  head: () => ({ meta: [
    { title: "Planos e Subscrições — Atelier Tricotin" },
    { name: "description", content: "Escolhe o plano que melhor se adapta ao teu atelier. 14 dias grátis em qualquer plano pago." },
  ]}),
  component: PlanosPage,
});

function PlanosPage() {
  const { user } = useAuth();
  const { plan, trialEnds, trialActive, startTrial, setPlan, loading, redeemPromoCode } = useSubscription();
  const [busy, setBusy] = useState<Plan | null>(null);
  const [cycle, setCycle] = useState<BillingCycle>("mensal");
  const [promoInput, setPromoInput] = useState("");
  const [promoBusy, setPromoBusy] = useState(false);
  const [promoFeedback, setPromoFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<{ code: string; pct: number } | null>(null);
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
        }
      } catch {
        setPromoFeedback({ ok: false, message: "Erro inesperado ao validar o código." });
      } finally {
        setPromoBusy(false);
        promoInflight.current = null;
      }
    })();
    promoInflight.current = p;
    await p;
  };

  const applyDiscount = (price: number) => promoDiscount ? +(price * (1 - promoDiscount.pct / 100)).toFixed(2) : price;

  const onSubscribe = async (id: Plan) => {
    if (!user) { toast.error("Inicia sessão para subscrever"); return; }
    setBusy(id);
    try {
      // Placeholder: futura ligação ao Google Play
      const res = await handleGooglePlayPurchase(id, cycle);
      if (!res.ok) {
        // sem billing ligado ainda — fluxo de demonstração: inicia o trial
        await startTrial(id, cycle);
      } else {
        await setPlan(id, cycle);
      }
    } finally { setBusy(null); }
  };

  const onStartTrial = async (id: Plan) => {
    if (!user) { toast.error("Inicia sessão para começar o teste"); return; }
    setBusy(id);
    try { await startTrial(id, cycle); } finally { setBusy(null); }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planos e Subscrições"
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
                            {precoMostrar.toFixed(2).replace(".", ",")} €
                          </span>
                        )}
                        {applyDiscount(precoMostrar).toFixed(2).replace(".", ",")} €<span className="text-sm font-normal text-muted-foreground">/mês</span>
                      </p>
                      {promoDiscount && (
                        <p className="text-xs font-medium text-emerald-600">Código {promoDiscount.code} (-{promoDiscount.pct}%)</p>
                      )}
                      {cycle === "anual" ? (
                        <p className="text-xs text-muted-foreground">
                          faturado anualmente — {applyDiscount(p.precoAnualTotal).toFixed(2).replace(".", ",")} €/ano
                          <span className="ml-1 font-medium text-primary">(poupa {ANNUAL_DISCOUNT_PCT}%)</span>
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          ou {applyDiscount(p.precoAnualMensal).toFixed(2).replace(".", ",")} €/mês no plano anual
                        </p>
                      )}
                    </>
                  )}
                  {p.trial && <p className="mt-1 text-sm font-medium text-primary">Experimente Grátis por 14 Dias</p>}
                  <p className="mt-2 text-sm text-muted-foreground">{p.resumo}</p>
                </div>

                <ul className="space-y-2 text-sm">
                  {p.beneficios.map((b) => (
                    <li key={b} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-primary" /><span>{b}</span></li>
                  ))}
                  {p.limitacoes?.map((l) => (
                    <li key={l} className="flex items-start gap-2 text-muted-foreground"><X className="mt-0.5 h-4 w-4" /><span>{l}</span></li>
                  ))}
                </ul>

                <div className="mt-auto space-y-2 pt-2">
                  {isFree ? (
                    <Button variant="outline" className="w-full" disabled={isCurrent} onClick={() => setPlan("light")}>
                      {isCurrent ? "Plano atual" : "Usar plano gratuito"}
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={highlighted ? "default" : "secondary"}
                      disabled={busy === p.id || isCurrent}
                      onClick={() => onSubscribe(p.id)}
                    >
                      {busy === p.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      {isCurrent ? "Plano atual" : `Subscrever ${p.nome} (${cycle === "anual" ? "Anual" : "Mensal"})`}
                    </Button>
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
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Pagamentos serão processados via Google Play assim que a integração estiver ativa. Podes cancelar a qualquer momento.
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
            <p
              role="status"
              aria-live="polite"
              className={`rounded-md border px-3 py-2 text-sm ${
                promoBusy
                  ? "border-muted bg-muted/40 text-muted-foreground"
                  : promoFeedback.ok
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "border-destructive/40 bg-destructive/10 text-destructive"
              }`}
            >
              {promoFeedback.message}
            </p>
          )}
          {isLifetime && (
            <p className="rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-sm">
              Tens acesso <strong>Premium Vitalício</strong> ativo — todas as funcionalidades desbloqueadas, sem expirar.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}