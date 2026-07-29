import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Copy, Loader2, ShieldAlert, XCircle } from "lucide-react";
import { useAuthedServerFn } from "@/lib/use-authed-server-fn";
import { isAdminFn } from "@/lib/refunds.functions";
import { getPaddleEnvironment } from "@/lib/paddle";
import {
  paddleDiagnosticsFn,
  type PaddleDiagnostics,
} from "@/lib/paddle-diagnostics.functions";

export const Route = createFileRoute("/diagnostico-pagamentos")({
  head: () => ({
    meta: [
      { title: "Diagnóstico de Pagamentos — Craft Business Master" },
      {
        name: "description",
        content:
          "Verificação das credenciais, endpoints e catálogo de preços do processador de pagamentos antes de ativar o modo real.",
      },
      { property: "og:title", content: "Diagnóstico de Pagamentos" },
      {
        property: "og:description",
        content: "Confirma chaves, webhook e preços antes de aceitar pagamentos reais.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DiagnosticoPagamentosPage,
});

function Status({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
      ) : (
        <XCircle className="h-4 w-4 text-destructive" />
      )}
      <span>{label}</span>
    </div>
  );
}

function DiagnosticoPagamentosPage() {
  const checkAdmin = useAuthedServerFn(isAdminFn);
  const runDiagnostics = useAuthedServerFn(paddleDiagnosticsFn);

  const [admin, setAdmin] = useState<boolean | null>(null);
  const [env, setEnv] = useState<"sandbox" | "live">(getPaddleEnvironment());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PaddleDiagnostics | null>(null);

  useEffect(() => {
    (async () => {
      const r = await checkAdmin({});
      setAdmin(!!r?.admin);
    })().catch(() => setAdmin(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run(target: "sandbox" | "live") {
    setLoading(true);
    try {
      const r = (await runDiagnostics({ data: { environment: target } })) as PaddleDiagnostics;
      setResult(r);
      if (!r?.connection.ok) {
        toast.error("Não foi possível ligar ao processador de pagamentos", {
          description: r.connection.error ?? `Estado ${r.connection.status ?? "desconhecido"}`,
        });
      } else {
        toast.success("Ligação confirmada com sucesso");
      }
    } catch (e) {
      toast.error("Falha ao correr o diagnóstico", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setLoading(false);
    }
  }

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
          <p className="text-muted-foreground">
            Esta área é reservada à administração da conta.
          </p>
        </CardContent>
      </Card>
    );
  }

  const allPrices = result?.prices.every((p) => p.found && p.status === "active") ?? false;
  const pronto =
    !!result &&
    result.environment === "live" &&
    result.credentials.apiKey &&
    result.credentials.webhookSecret &&
    result.connection.ok &&
    allPrices;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diagnóstico de Pagamentos"
        description="Confirma as credenciais, o endpoint de notificações e o catálogo de preços em cada ambiente antes de aceitar pagamentos reais."
      />

      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={env} onValueChange={(v) => setEnv(v as "sandbox" | "live")}>
          <TabsList>
            <TabsTrigger value="sandbox">Ambiente de teste</TabsTrigger>
            <TabsTrigger value="live">Pagamentos reais</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={() => void run(env)} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Verificar agora
        </Button>
        <Badge variant="outline">
          Ambiente ativo na app: {getPaddleEnvironment() === "live" ? "Real" : "Teste"}
        </Badge>
      </div>

      {result && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Credenciais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Status ok={result.credentials.apiKey} label="Chave de API configurada" />
              <Status
                ok={result.credentials.webhookSecret}
                label="Segredo de assinatura de notificações configurado"
              />
              <Status ok={result.credentials.lovableKey} label="Chave da plataforma disponível" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ligação e endpoint</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Status
                ok={result.connection.ok}
                label={`Ligação à API (${result.connection.status ?? "sem resposta"})`}
              />
              {result.connection.error && (
                <p className="text-xs text-destructive break-all">{result.connection.error}</p>
              )}
              <div className="space-y-1">
                <p className="text-sm font-medium">Endpoint de notificações</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 break-all rounded bg-muted px-2 py-1 text-xs">
                    {result.webhookUrl}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Copiar endereço do endpoint"
                    onClick={() => {
                      void navigator.clipboard.writeText(result.webhookUrl);
                      toast.success("Endereço copiado");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Catálogo de preços</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {result.prices.map((p) => (
                <div key={p.externalId} className="flex flex-wrap items-center justify-between gap-2">
                  <Status
                    ok={p.found && p.status === "active"}
                    label={`${p.externalId}${p.paddleId ? ` · ${p.paddleId}` : " · não encontrado"}`}
                  />
                  {p.amount && (
                    <span className="text-sm text-muted-foreground">
                      {(Number(p.amount) / 100).toFixed(2)} {p.currency}
                    </span>
                  )}
                </div>
              ))}
              {result.prices.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Sem credenciais suficientes para consultar o catálogo neste ambiente.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Conclusão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {pronto ? (
                <p className="text-emerald-600">
                  Tudo verificado: credenciais, ligação, endpoint e preços reais estão operacionais.
                  O site publicado já pode receber pagamentos reais.
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Ainda há verificações por concluir neste ambiente. Corrige os pontos assinalados a
                  vermelho e volta a executar. O modo real só é aceite no site publicado depois de a
                  conta de pagamentos estar verificada pelo processador.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Última verificação: {new Date(result.checkedAt).toLocaleString("pt-PT")}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}