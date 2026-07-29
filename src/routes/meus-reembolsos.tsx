import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Loader2, Receipt, RefreshCw, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-state";
import { getPaddleEnvironment } from "@/lib/paddle";
import {
  REFUND_KIND_LABEL,
  REFUND_STATUS_LABEL,
  formatCents,
  reasonLabel,
  type RefundRecord,
} from "@/lib/refunds";
import { toast } from "sonner";

export const Route = createFileRoute("/meus-reembolsos")({
  head: () => ({
    meta: [
      { title: "Os meus reembolsos — Craft Business Master" },
      {
        name: "description",
        content:
          "Consulta os teus reembolsos e cancelamentos: motivo, estado do processador de pagamentos e ligação ao pagamento e ao recibo correspondentes.",
      },
      { property: "og:title", content: "Os meus reembolsos" },
      {
        property: "og:description",
        content: "Lista de reembolsos com motivo, estado e ligação ao pagamento e recibo.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://craftbusinessmaster.com/meus-reembolsos" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://craftbusinessmaster.com/meus-reembolsos" }],
  }),
  component: MeusReembolsosPage,
});

type Filtro = "todos" | RefundRecord["status"];

const STATUS_VARIANT: Record<RefundRecord["status"], "secondary" | "outline" | "destructive"> = {
  pendente: "outline",
  aprovado: "outline",
  recusado: "destructive",
  concluido: "secondary",
};

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

function MeusReembolsosPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<RefundRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>("todos");

  useEffect(() => {
    let alive = true;
    if (!user) {
      setRows([]);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("refunds")
        .select("*")
        .eq("user_id", user.id)
        .eq("environment", getPaddleEnvironment())
        .order("created_at", { ascending: false });
      if (!alive) return;
      if (error) {
        toast.error("Não foi possível carregar os reembolsos", { description: error.message });
      }
      setRows((data as unknown as RefundRecord[]) ?? []);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  const visiveis = useMemo(
    () => (filtro === "todos" ? rows : rows.filter((r) => r.status === filtro)),
    [rows, filtro],
  );

  const totalDevolvido = useMemo(
    () =>
      rows
        .filter((r) => r.kind !== "cancelamento" && r.status === "concluido")
        .reduce((s, r) => s + (r.amount_cents || 0), 0),
    [rows],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Os meus reembolsos"
        description="Todos os reembolsos e cancelamentos da tua conta, com o motivo, o estado comunicado pelo processador de pagamentos e a ligação direta ao pagamento e ao recibo originais."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 py-5">
            <RotateCcw className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-semibold">{rows.length}</p>
              <p className="text-sm text-muted-foreground">Pedidos registados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-5">
            <RefreshCw className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-semibold">
                {rows.filter((r) => r.status === "pendente" || r.status === "aprovado").length}
              </p>
              <p className="text-sm text-muted-foreground">Em processamento</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-5">
            <Receipt className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-semibold">
                {formatCents(totalDevolvido, rows[0]?.currency ?? "EUR")}
              </p>
              <p className="text-sm text-muted-foreground">Total devolvido</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={filtro} onValueChange={(v) => setFiltro(v as Filtro)}>
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="pendente">Pendentes</TabsTrigger>
          <TabsTrigger value="aprovado">Aprovados</TabsTrigger>
          <TabsTrigger value="concluido">Concluídos</TabsTrigger>
          <TabsTrigger value="recusado">Recusados</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> A carregar reembolsos…
        </div>
      ) : visiveis.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <RotateCcw className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">
              Não existem reembolsos com este estado. Se precisares de pedir um reembolso, consulta
              a política ou fala connosco.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild variant="outline">
                <Link to="/reembolsos">Política de reembolsos</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/contacto">Pedir reembolso</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visiveis.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex flex-wrap items-start justify-between gap-4 py-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{REFUND_KIND_LABEL[r.kind]}</span>
                    <Badge variant={STATUS_VARIANT[r.status]}>
                      {REFUND_STATUS_LABEL[r.status]}
                    </Badge>
                    {r.paddle_adjustment_id && (
                      <Badge variant="outline">Ref. {r.paddle_adjustment_id}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {dateLabel(r.created_at)} · Motivo: {reasonLabel(r.reason_code)}
                    {r.reason_note ? ` — ${r.reason_note}` : ""}
                  </p>
                  {r.paddle_transaction_id && (
                    <p className="text-xs text-muted-foreground">
                      Pagamento {r.paddle_transaction_id}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-semibold">
                    {r.kind === "cancelamento" ? "—" : formatCents(r.amount_cents, r.currency)}
                  </span>
                  <Button asChild variant="outline" size="sm">
                    <Link
                      to="/pagamentos"
                      search={r.paddle_transaction_id ? { ref: r.paddle_transaction_id } : {}}
                    >
                      <CreditCard className="mr-2 h-4 w-4" /> Pagamento
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link
                      to="/recibos"
                      search={r.paddle_transaction_id ? { ref: r.paddle_transaction_id } : {}}
                    >
                      <Receipt className="mr-2 h-4 w-4" /> Recibo
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}