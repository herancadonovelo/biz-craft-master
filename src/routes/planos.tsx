import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Sparkles, Star, Loader2 } from "lucide-react";
import { PLANS, useSubscription, handleGooglePlayPurchase, ANNUAL_DISCOUNT_PCT, type Plan, type BillingCycle } from "@/lib/subscription";
import { useAuth } from "@/lib/auth-state";
import { useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/planos")({
  head: () => ({ meta: [
    { title: "Planos e Subscrições — Atelier Tricotin" },
    { name: "description", content: "Escolhe o plano que melhor se adapta ao teu atelier. 14 dias grátis em qualquer plano pago." },
  ]}),
  component: PlanosPage,
});

function PlanosPage() {
  const { user } = useAuth();
  const { plan, trialEnds, trialActive, startTrial, setPlan, loading } = useSubscription();
  const [busy, setBusy] = useState<Plan | null>(null);
  const [cycle, setCycle] = useState<BillingCycle>("mensal");

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
                {loading ? "A carregar…" : (PLANS.find((p) => p.id === plan)?.nome ?? "Light")}
                {trialActive && <Badge variant="secondary" className="ml-2">Teste ativo</Badge>}
              </p>
            </div>
          </div>
          {trialActive && trialEnds && (
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
                        {precoMostrar.toFixed(2).replace(".", ",")} €<span className="text-sm font-normal text-muted-foreground">/mês</span>
                      </p>
                      {cycle === "anual" ? (
                        <p className="text-xs text-muted-foreground">
                          faturado anualmente — {p.precoAnualTotal.toFixed(2).replace(".", ",")} €/ano
                          <span className="ml-1 font-medium text-primary">(poupa {ANNUAL_DISCOUNT_PCT}%)</span>
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          ou {p.precoAnualMensal.toFixed(2).replace(".", ",")} €/mês no plano anual
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
    </div>
  );
}