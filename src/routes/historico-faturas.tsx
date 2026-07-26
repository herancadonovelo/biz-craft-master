import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, formatEUR } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { imprimirFatura } from "@/lib/print-fatura";

export const Route = createFileRoute("/historico-faturas")({
  head: () => ({ meta: [{ title: "Histórico De Faturas" }] }),
  component: HistoricoFaturasContent,
});

export function HistoricoFaturasContent() {
    const { faturas, clientes, perfilNegocio, design } = useStore();
    const [q, setQ] = useState("");
    const list = [...faturas]
      .sort((a, b) => (a.data < b.data ? 1 : -1))
      .filter((f) => {
        const c = clientes.find((x) => x.id === f.clienteId);
        return [f.numero, f.estado, c?.nome ?? ""].join(" ").toLowerCase().includes(q.toLowerCase());
      });
    return (
      <div className="space-y-6">
        <PageHeader title="Histórico De Faturas" description="Todas as faturas emitidas, com pesquisa e impressão." />
        <div className="relative max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Pesquisar nº, cliente ou estado…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Nº</TableHead><TableHead>Data</TableHead><TableHead>Cliente</TableHead><TableHead>Total</TableHead><TableHead>Estado</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {list.map((f) => {
                const c = clientes.find((x) => x.id === f.clienteId);
                const total = f.valor * (1 + f.iva / 100);
                return (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.numero}</TableCell>
                    <TableCell>{f.data}</TableCell>
                    <TableCell>{c?.nome ?? "—"}</TableCell>
                    <TableCell className="font-display">{formatEUR(total)}</TableCell>
                    <TableCell><Badge variant="outline">{f.estado}</Badge></TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => imprimirFatura(f, c, perfilNegocio, design.moeda)}><Printer className="mr-1 h-4 w-4" />Imprimir</Button></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent></Card>
      </div>
    );
}