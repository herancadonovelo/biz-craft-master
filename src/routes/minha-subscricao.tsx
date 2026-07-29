import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, RefreshCw, CreditCard, CalendarClock, Undo2 } from "lucide-react";
import { useAuth } from "@/lib/auth-state";
import { useAuthedServerFn } from "@/lib/use-authed-server-fn";
import { getPaddleEnvironment } from "@/lib/paddle";
import { createPortalSession } from "@/utils/payments.functions";
import { mySubscriptionFn, cancelMySubscriptionFn, type MySubscriptionInfo } from "@/lib/my-subscription.functions";

export const Route = createFileRoute("/minha-subscricao")({
  head: () => ({
    meta: [
      { title: "A Minha Subscrição — Craft Business Master" },
      {
        name: "description",
        content:
          "Consulta o estado da tua subscrição, o preço ativo e a próxima cobrança. Altera o plano ou cancela quando quiseres.",
      },
      { property: "og:title", content: "A Minha Subscrição — Craft Business Master" },
      {
        property: "og:description",
        content: "Estado da subscrição, preços ativos e gestão de alterações ou cancelamento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MinhaSubscricaoPage,
});

const ESTADO_LABEL: Record<string, string> = {
  active: "Ativa",
  trialing: "Período de teste",
  past_due: "Pagamento em atraso",
  paused: "Em pausa",
  canceled: "Cancelada",
};

function fmtData(v: string | null) {
  return v ? new Date(v).toLocaleDateString("pt-PT") : "—";
}

function fmtValor(amount: string | null, currency: string | null) {
  if (!amount) return "—";
  const v = Number(amount) / 100;
  try {
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency: currency ?? "EUR" }).format(v);
  } catch {
    return `${v.toFixed(2)} ${currency ?? ""}`;
  }
}

function MinhaSubscricaoPage() {
  const { user } = useAuth();
  const fetchSub = useAuthedServerFn(mySubscriptionFn);
  const cancelSub = useAuthedServerFn(cancelMySubscriptionFn);

  const [info, setInfo] = useState<MySubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetchSub({ data: { environment: getPaddleEnvironment() } });
      setInfo((r ?? null) as MySubscriptionInfo | null);
    } catch (e) {
      toast.error("Não foi possível carregar a subscrição", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) void load();
    else setLoading(false);
  }, [user, load]);

  async function acao(modo: "fim_do_periodo" | "imediato" | "reativar") {
    setBusy(true);
    try {
      const r = await cancelSub({ data: { environment: getPaddleEnvironment(), modo } });
      if (r?.ok) {
        toast.success(r.message);
        void load();
      } else {
        toast.error(r?.message ?? "Não foi possível concluir o pedido.");
      }
    } catch (e) {
      toast.error("Não foi possível concluir o pedido", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(false);
    }
  }

  async function abrirPortal() {
    setPortalBusy(true);
    try {
      const res = await createPortalSession({ data: { environment: getPaddleEnvironment() } });
      if (!res.ok || !res.url) {
        toast.error(res.message ?? "Ainda não tens uma subscrição para gerir.");
        return;
      }
      window.open(res.url, "_blank", "noopener");
    } catch {
      toast.error("Não foi possível abrir a gestão de faturação.");
    } finally {
      setPortalBusy(false);
    }
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Inicia sessão para veres o estado da tua subscrição.
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> A carregar a subscrição…
      </div>
    );
  }

  const estado = info?.estadoRemoto ?? info?.estado ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="A Minha Subscrição"
        description="Estado atual, preço ativo e próxima cobrança. Podes alterar o plano ou cancelar a qualquer momento."
      />

      {!info?.encontrada ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <CreditCard className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">
              Ainda não tens nenhuma subscrição ativa neste ambiente.
            </p>
            <Button asChild>
              <Link to="/planos">Ver planos</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex flex-wrap items-center gap-2">
                Estado da subscrição
                <Badge variant={estado === "active" || estado === "trialing" ? "default" : "secondary"}>
                  {ESTADO_LABEL[estado ?? ""] ?? estado ?? "—"}
                </Badge>
                <Badge variant="outline">
                  {info.environment === "live" ? "Pagamentos reais" : "Ambiente de teste"}
                </Badge>
                {info.cancelaNoFimDoPeriodo && (
                  <Badge variant="destructive">Cancelamento agendado</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Plano</p>
                <p className="font-medium">
                  {info.planoInterno ?? "—"} · {info.cicloInterno ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Período atual</p>
                <p className="font-medium">
                  {fmtData(info.inicioPeriodo)} — {fmtData(info.fimPeriodo)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Próxima cobrança</p>
                <p className="flex items-center gap-1 font-medium">
                  <CalendarClock className="h-4 w-4" />
                  {info.cancelaNoFimDoPeriodo ? "Sem nova cobrança" : fmtData(info.proximaCobranca)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Referência</p>
                <p className="break-all font-mono text-xs">{info.subscriptionId}</p>
              </div>
              {info.erroRemoto && (
                <p className="sm:col-span-2 text-xs text-destructive">
                  Não foi possível confirmar os dados junto do processador: {info.erroRemoto}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preços ativos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {info.itens.length === 0 && (
                <p className="text-muted-foreground">Sem detalhes de preço disponíveis.</p>
              )}
              {info.itens.map((it, i) => (
                <div key={i} className="flex flex-wrap items-center justify-between gap-2">
                  <span>{it.nome ?? it.priceId ?? "Plano"}</span>
                  <span className="font-medium">
                    {fmtValor(it.amount, it.currency)}
                    {it.intervalo ? ` / ${it.intervalo === "year" ? "ano" : "mês"}` : ""}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alterar ou cancelar</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/planos">Alterar plano</Link>
              </Button>
              <Button variant="outline" onClick={abrirPortal} disabled={portalBusy}>
                {portalBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Faturação e método de pagamento
              </Button>
              <Button variant="outline" size="icon" aria-label="Atualizar" onClick={() => void load()}>
                <RefreshCw className="h-4 w-4" />
              </Button>

              {info.cancelaNoFimDoPeriodo ? (
                <Button variant="secondary" disabled={busy} onClick={() => acao("reativar")}>
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Undo2 className="mr-2 h-4 w-4" />}
                  Anular cancelamento
                </Button>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={busy}>
                      Cancelar subscrição
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancelar a subscrição?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Mantém o acesso até {fmtData(info.fimPeriodo)} e não haverá nova cobrança.
                        Podes anular o cancelamento até essa data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Voltar atrás</AlertDialogCancel>
                      <AlertDialogAction onClick={() => acao("fim_do_periodo")}>
                        Cancelar no fim do período
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}