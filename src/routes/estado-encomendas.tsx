import { createFileRoute } from "@tanstack/react-router";
import { useStore, formatEUR } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTT } from "@/lib/i18n";

const ESTADOS = ["pendente", "em_producao", "pronta", "entregue", "cancelada"] as const;

export const Route = createFileRoute("/estado-encomendas")({
  head: () => ({ meta: [{ title: "Estado Atual" }] }),
  component: EstadoEncomendasContent,
});

export function EstadoEncomendasContent() {
  const { encomendas, clientes } = useStore();
  const tt = useTT();
  return (
      <div className="space-y-6">
        <PageHeader title="Estado Atual" description="Kanban com o estado atual de cada encomenda." />
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          {ESTADOS.map((s) => {
            const list = encomendas.filter((e) => e.estado === s);
            return (
              <Card key={s}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between font-display text-sm capitalize">
                    {tt(s).replace("_", " ")}<Badge variant="secondary">{list.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {list.map((e) => {
                    const c = clientes.find((x) => x.id === e.clienteId);
                    return (
                      <div key={e.id} className="rounded-md border border-border bg-card p-3 text-sm">
                        <div className="font-medium">{e.descricao}</div>
                        <div className="text-xs text-muted-foreground">{c?.nome ?? tt("Sem cliente")}</div>
                        <div className="mt-1 flex justify-between text-xs">
                          <span className="text-muted-foreground">{e.prazo ?? "—"}</span>
                          <span className="font-display">{formatEUR(e.preco)}</span>
                        </div>
                      </div>
                    );
                  })}
                  {list.length === 0 && <p className="text-xs text-muted-foreground">{tt("Vazio")}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
  );
}