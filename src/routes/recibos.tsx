import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Printer, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-state";
import { getPaddleEnvironment } from "@/lib/paddle";
import { imprimirRecibo } from "@/lib/print-recibo";
import { toast } from "sonner";

export const Route = createFileRoute("/recibos")({
  validateSearch: (search: Record<string, unknown>) => ({
    ref: typeof search.ref === "string" && search.ref ? search.ref : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Recibos e comprovativos — Craft Business Master" },
      {
        name: "description",
        content:
          "Consulta, imprime ou guarda em PDF os recibos dos teus pagamentos de subscrição.",
      },
      { property: "og:title", content: "Recibos e comprovativos" },
      {
        property: "og:description",
        content: "Todos os comprovativos de pagamento da tua subscrição num só lugar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RecibosPage,
});

interface BillingRow {
  id: string;
  occurred_at: string;
  amount_cents: number | null;
  currency: string | null;
  status: string | null;
  metadata: Record<string, any> | null;
}

function money(cents: number | null, currency: string | null) {
  if (cents === null || cents === undefined) return "—";
  try {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: currency || "EUR",
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency ?? ""}`;
  }
}

function dateLabel(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function RecibosPage() {
  const { user } = useAuth();
  const { ref } = Route.useSearch();
  const [rows, setRows] = useState<BillingRow[]>([]);
  const [loading, setLoading] = useState(true);

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
        .from("billing_events")
        .select("id,occurred_at,amount_cents,currency,status,metadata")
        .eq("user_id", user.id)
        .eq("event_type", "transaction_completed")
        .eq("environment", getPaddleEnvironment())
        .order("occurred_at", { ascending: false });
      if (!alive) return;
      if (error) toast.error("Não foi possível carregar os recibos", { description: error.message });
      setRows((data as BillingRow[]) ?? []);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  const visiveis = useMemo(
    () =>
      ref
        ? rows.filter(
            (r) => r.metadata?.transactionId === ref || r.metadata?.invoiceNumber === ref,
          )
        : rows,
    [rows, ref],
  );

  const print = (r: BillingRow) => {
    const ok = imprimirRecibo({
      numero: r.metadata?.receiptNumber ?? r.id.slice(0, 8).toUpperCase(),
      data: dateLabel(r.metadata?.billedAt ?? r.occurred_at),
      descricao: r.metadata?.descricao ?? "Subscrição Craft Business Master",
      valor: money(r.amount_cents, r.currency),
      estado: "Pago",
      cliente: user?.email ?? "",
      referencia: r.metadata?.invoiceNumber ?? r.metadata?.transactionId ?? null,
    });
    if (!ok) toast.error("Permite janelas pop-up para imprimir o comprovativo.");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recibos & Comprovativos"
        description="Cada pagamento gera um recibo enviado automaticamente por email e disponível aqui para imprimir ou guardar em PDF."
      />

      {ref && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <p className="text-sm text-muted-foreground">
              A mostrar apenas o recibo associado ao reembolso <strong>{ref}</strong>.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/recibos" search={{ ref: undefined }}>
                Ver todos os recibos
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> A carregar recibos…
        </div>
      ) : visiveis.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Receipt className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">
              {ref
                ? "Não encontrámos um recibo para este reembolso. O recibo original pode ter sido emitido noutro ambiente de pagamento."
                : "Ainda não existem recibos. Assim que fizeres um pagamento, o recibo aparece aqui e chega também ao teu email."}
            </p>
            <Button asChild variant="outline">
              <Link to="/planos">Ver planos</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visiveis.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {r.metadata?.receiptNumber ?? r.id.slice(0, 8).toUpperCase()}
                    </span>
                    <Badge variant="secondary">Pago</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {dateLabel(r.metadata?.billedAt ?? r.occurred_at)} ·{" "}
                    {r.metadata?.descricao ?? "Subscrição"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold">{money(r.amount_cents, r.currency)}</span>
                  <Button variant="outline" size="sm" onClick={() => print(r)}>
                    <Printer className="mr-2 h-4 w-4" /> Comprovativo
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