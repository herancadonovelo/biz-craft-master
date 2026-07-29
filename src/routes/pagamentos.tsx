import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Clock, Loader2, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-state";
import { getPaddleEnvironment } from "@/lib/paddle";
import { toast } from "sonner";

export const Route = createFileRoute("/pagamentos")({
  validateSearch: (search: Record<string, unknown>) => ({
    ref: typeof search.ref === "string" && search.ref ? search.ref : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Estado dos pagamentos — Craft Business Master" },
      {
        name: "description",
        content:
          "Acompanha em tempo real o estado de cada pagamento da tua subscrição: pendente, pago ou falhado.",
      },
      { property: "og:title", content: "Estado dos pagamentos" },
      {
        property: "og:description",
        content: "Painel com o estado de cada pagamento, atualizado automaticamente.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PagamentosPage,
});

type Estado = "pendente" | "pago" | "falhado" | "reembolsado";

interface BillingRow {
  id: string;
  occurred_at: string;
  event_type: string;
  amount_cents: number | null;
  currency: string | null;
  status: string | null;
  paddle_subscription_id: string | null;
  metadata: Record<string, any> | null;
}

interface Pagamento {
  key: string;
  estado: Estado;
  data: string;
  descricao: string;
  amount_cents: number | null;
  currency: string | null;
  referencia: string | null;
}

const PAYMENT_EVENTS = [
  "transaction_pending",
  "transaction_completed",
  "payment_failed",
  "refund_completed",
];

const ESTADO_META: Record<Estado, { label: string; icon: typeof Clock; variant: "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", icon: Clock, variant: "outline" },
  pago: { label: "Pago", icon: CheckCircle2, variant: "secondary" },
  falhado: { label: "Falhado", icon: AlertCircle, variant: "destructive" },
  reembolsado: { label: "Reembolsado", icon: RefreshCw, variant: "outline" },
};

function estadoFor(eventType: string): Estado {
  if (eventType === "transaction_completed") return "pago";
  if (eventType === "payment_failed") return "falhado";
  if (eventType === "refund_completed") return "reembolsado";
  return "pendente";
}

function money(cents: number | null, currency: string | null) {
  if (cents === null || cents === undefined) return "—";
  try {
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency: currency || "EUR" }).format(
      cents / 100,
    );
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency ?? ""}`;
  }
}

function dateLabel(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/**
 * Cada transação pode ter vários eventos (pendente -> pago/falhado).
 * Mantemos apenas o evento mais recente de cada transação.
 */
function agrupar(rows: BillingRow[]): Pagamento[] {
  const byKey = new Map<string, BillingRow>();
  for (const r of rows) {
    const key = r.metadata?.transactionId ?? r.paddle_subscription_id ?? r.id;
    const existing = byKey.get(key);
    if (!existing || new Date(r.occurred_at) > new Date(existing.occurred_at)) byKey.set(key, r);
  }
  return [...byKey.entries()]
    .map(([key, r]) => ({
      key,
      estado: estadoFor(r.event_type),
      data: r.metadata?.billedAt ?? r.occurred_at,
      descricao: r.metadata?.descricao ?? "Subscrição Craft Business Master",
      amount_cents: r.amount_cents,
      currency: r.currency,
      referencia: r.metadata?.invoiceNumber ?? r.metadata?.transactionId ?? null,
    }))
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
}

function PagamentosPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<BillingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [filtro, setFiltro] = useState<"todos" | Estado>("todos");

  const carregar = useCallback(async () => {
    if (!user) {
      setRows([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("billing_events")
      .select("id,occurred_at,event_type,amount_cents,currency,status,paddle_subscription_id,metadata")
      .eq("user_id", user.id)
      .eq("environment", getPaddleEnvironment())
      .in("event_type", PAYMENT_EVENTS)
      .order("occurred_at", { ascending: false })
      .limit(200);
    if (error) {
      toast.error("Não foi possível carregar os pagamentos", { description: error.message });
    }
    setRows((data as BillingRow[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    void carregar();
  }, [carregar]);

  // Atualização automática: os webhooks do Paddle escrevem em billing_events.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`billing-events-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "billing_events",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void carregar();
        },
      )
      .subscribe((status) => setLive(status === "SUBSCRIBED"));
    return () => {
      supabase.removeChannel(channel);
      setLive(false);
    };
  }, [user, carregar]);

  const pagamentos = useMemo(() => agrupar(rows), [rows]);
  const visiveis = useMemo(
    () => (filtro === "todos" ? pagamentos : pagamentos.filter((p) => p.estado === filtro)),
    [pagamentos, filtro],
  );

  const resumo = useMemo(() => {
    const base: Record<Estado, number> = { pendente: 0, pago: 0, falhado: 0, reembolsado: 0 };
    for (const p of pagamentos) base[p.estado] += 1;
    return base;
  }, [pagamentos]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estado dos Pagamentos"
        description="Cada pagamento aparece aqui com o seu estado atual. O painel atualiza-se sozinho assim que o processador de pagamentos confirma, falha ou reembolsa uma transação."
      />

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="outline" className="gap-1.5">
          {live ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          {live ? "Atualização automática ativa" : "Atualização manual"}
        </Badge>
        <Button variant="outline" size="sm" onClick={() => void carregar()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {(["pendente", "pago", "falhado"] as Estado[]).map((e) => {
          const Icon = ESTADO_META[e].icon;
          return (
            <Card key={e}>
              <CardContent className="flex items-center gap-3 py-5">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-semibold">{resumo[e]}</p>
                  <p className="text-sm text-muted-foreground">{ESTADO_META[e].label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={filtro} onValueChange={(v) => setFiltro(v as typeof filtro)}>
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="pendente">Pendentes</TabsTrigger>
          <TabsTrigger value="pago">Pagos</TabsTrigger>
          <TabsTrigger value="falhado">Falhados</TabsTrigger>
          <TabsTrigger value="reembolsado">Reembolsados</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> A carregar pagamentos…
        </div>
      ) : visiveis.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Clock className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">
              Ainda não há pagamentos com este estado. Assim que existir uma transação, ela aparece
              aqui automaticamente.
            </p>
            <Button asChild variant="outline">
              <Link to="/planos">Ver planos</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visiveis.map((p) => {
            const meta = ESTADO_META[p.estado];
            const Icon = meta.icon;
            return (
              <Card key={p.key}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{p.descricao}</span>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {dateLabel(p.data)}
                      {p.referencia ? ` · Ref. ${p.referencia}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">{money(p.amount_cents, p.currency)}</span>
                    {p.estado === "pago" && (
                      <Button asChild variant="outline" size="sm">
                        <Link to="/recibos">Recibo</Link>
                      </Button>
                    )}
                    {p.estado === "falhado" && (
                      <Button asChild size="sm">
                        <Link to="/planos">Atualizar pagamento</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}