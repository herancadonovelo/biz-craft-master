import { createFileRoute } from "@tanstack/react-router";
import { useStore, formatEUR } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/vendas")({
  head: () => ({ meta: [{ title: "Vendas concluídas" }] }),
  component: () => {
    const { vendas, clientes, projetos } = useStore();
    const total = vendas.reduce((s, v) => s + v.valor, 0);
    return (
      <div className="space-y-6">
        <PageHeader title="Diário de Encomendas Concluídas" description={`${vendas.length} vendas · total ${formatEUR(total)}`} />
        <Card>
          <CardHeader><CardTitle className="font-display">Histórico</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Cliente</TableHead><TableHead>Contacto</TableHead><TableHead>Projeto</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
              <TableBody>
                {vendas.map((v) => {
                  const c = clientes.find((x) => x.id === v.clienteId);
                  const p = projetos.find((x) => x.id === v.projetoId);
                  return (
                    <TableRow key={v.id}>
                      <TableCell>{v.data}</TableCell>
                      <TableCell className="font-medium">{c?.nome ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{c?.email ?? c?.telefone ?? "—"}</TableCell>
                      <TableCell>{p?.nome ?? "—"}</TableCell>
                      <TableCell className="text-right font-display">{formatEUR(v.valor)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  },
});