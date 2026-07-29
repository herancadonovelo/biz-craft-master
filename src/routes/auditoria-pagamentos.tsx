import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";
import { useAuthedServerFn } from "@/lib/use-authed-server-fn";
import { isAdminFn } from "@/lib/refunds.functions";
import {
  listPaddleEventsFn,
  acknowledgePaddleEventFn,
  FALHAS,
  type PaddleEventRow,
} from "@/lib/paddle-events.functions";

export const Route = createFileRoute("/auditoria-pagamentos")({
  head: () => ({
    meta: [
      { title: "Auditoria de Eventos de Pagamento — Craft Business Master" },
      {
        name: "description",
        content:
          "Registo de eventos do processador de pagamentos com assinatura verificada, ambiente, tipo de evento e resumo do conteúdo.",
      },
      { property: "og:title", content: "Auditoria de Eventos de Pagamento" },
      {
        property: "og:description",
        content: "Audita atualizações de assinatura, recibos e reembolsos em tempo real.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuditoriaPagamentosPage,
});

const STATUS_LABEL: Record<string, string> = {
  processado: "Processado",
  repetido: "Repetido (ignorado)",
  assinatura_invalida: "Assinatura inválida",
  erro_processamento: "Erro no processamento",
};

function StatusBadge({ status }: { status: string }) {
  const falha = FALHAS.includes(status);
  return (
    <Badge variant={falha ? "destructive" : status === "processado" ? "default" : "secondary"}>
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

function AuditoriaPagamentosPage() {
  const checkAdmin = useAuthedServerFn(isAdminFn);
  const listEvents = useAuthedServerFn(listPaddleEventsFn);
  const acknowledge = useAuthedServerFn(acknowledgePaddleEventFn);

  const [admin, setAdmin] = useState<boolean | null>(null);
  const [env, setEnv] = useState<"todos" | "sandbox" | "live">("todos");
  const [apenasFalhas, setApenasFalhas] = useState(false);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<PaddleEventRow[]>([]);
  const [alertas, setAlertas] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await listEvents({ data: { environment: env, apenasFalhas, limite: 100 } });
      const events = r?.events ?? [];
      const abertos = r?.alertasAbertos ?? 0;
      setEvents(events as PaddleEventRow[]);
      setAlertas(abertos);
      if (abertos > 0) {
        toast.error(`${abertos} falha(s) de pagamento por resolver`, {
          description: "Verifica as assinaturas e o processamento dos eventos.",
        });
      }
    } catch (e) {
      toast.error("Não foi possível carregar o registo de eventos", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [env, apenasFalhas]);

  useEffect(() => {
    (async () => {
      const r = await checkAdmin({});
      setAdmin(!!r?.admin);
    })().catch(() => setAdmin(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (admin) void load();
  }, [admin, load]);

  // Verificação periódica: alerta assim que aparece uma falha nova.
  useEffect(() => {
    if (!admin) return;
    const t = setInterval(() => void load(), 60_000);
    return () => clearInterval(t);
  }, [admin, load]);

  if (admin === null) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> A verificar permissões…
      </div>
    );
  }

  if (!admin) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <ShieldAlert className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">Esta área é reservada à administração da conta.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoria de Eventos de Pagamento"
        description="Cada notificação recebida do processador: assinatura verificada, ambiente, tipo de evento e resumo do conteúdo."
      />

      {alertas > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex flex-wrap items-center gap-3 p-4 text-sm">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="flex-1">
              <strong>{alertas}</strong> falha(s) por resolver — assinatura inválida ou erro no
              processamento. Confirma o segredo de assinatura em{" "}
              <Link to="/diagnostico-pagamentos" className="underline">
                Diagnóstico de Pagamentos
              </Link>
              .
            </span>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <Tabs value={env} onValueChange={(v) => setEnv(v as typeof env)}>
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="sandbox">Teste</TabsTrigger>
            <TabsTrigger value="live">Real</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <Switch id="falhas" checked={apenasFalhas} onCheckedChange={setApenasFalhas} />
          <Label htmlFor="falhas">Só falhas</Label>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Atualizar
        </Button>
      </div>

      <div className="space-y-3">
        {events.map((ev) => {
          const falha = FALHAS.includes(ev.status);
          return (
            <Card key={ev.id} className={falha ? "border-destructive/40" : undefined}>
              <CardHeader className="pb-2">
                <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                  <span className="font-mono text-sm">{ev.event_type ?? "—"}</span>
                  <StatusBadge status={ev.status} />
                  <Badge variant="outline">{ev.environment === "live" ? "Real" : "Teste"}</Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    {ev.signature_verified ? (
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
                    )}
                    {ev.signature_verified ? "Assinatura verificada" : "Assinatura não verificada"}
                  </span>
                  <span className="ml-auto text-xs font-normal text-muted-foreground">
                    {new Date(ev.created_at).toLocaleString("pt-PT")}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {ev.error_message && (
                  <p className="break-all text-xs text-destructive">{ev.error_message}</p>
                )}
                <pre className="max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
                  {JSON.stringify(ev.summary, null, 2)}
                </pre>
                {falha && (
                  <div className="flex items-center gap-2">
                    {ev.acknowledged_at ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Tratado em{" "}
                        {new Date(ev.acknowledged_at).toLocaleString("pt-PT")}
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await acknowledge({ data: { id: ev.id } });
                            toast.success("Falha marcada como tratada");
                            void load();
                          } catch (e) {
                            toast.error("Não foi possível marcar como tratada", {
                              description: e instanceof Error ? e.message : String(e),
                            });
                          }
                        }}
                      >
                        Marcar como tratada
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {!loading && events.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Ainda não há eventos registados neste filtro.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}