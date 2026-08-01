import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, formatEUR } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, AlertTriangle, XCircle } from "lucide-react";

export const Route = createFileRoute("/lista-compras")({
  head: () => ({ meta: [{ title: "Lista de compras" }] }),
  component: () => {
    const { materiais, fornecedores } = useStore();
    const [q, setQ] = useState("");
    const sugeridos = materiais
      .map((m) => ({ m, minimo: m.stockMinimo ?? 5 }))
      .filter(({ m, minimo }) => m.stock <= minimo)
      .filter(({ m }) => m.nome.toLowerCase().includes(q.toLowerCase()));
    return (
      <div className="space-y-6">
        <PageHeader title="Cesto de Abastecimento do Ateliê" description="Materiais sugeridos por estarem out-of-stock ou low-on-stock." />
        <div className="relative max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Pesquisar material…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead></TableHead><TableHead>Material</TableHead><TableHead>Fornecedor</TableHead><TableHead>Preço</TableHead><TableHead>Stock</TableHead><TableHead>Mínimo</TableHead><TableHead>Custo p/ repor</TableHead></TableRow></TableHeader>
            <TableBody>
              {sugeridos.length === 0 && <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">Nada a comprar! Todos os materiais acima do mínimo.</TableCell></TableRow>}
              {sugeridos.map(({ m, minimo }) => {
                const f = fornecedores.find((x) => x.id === m.fornecedorId);
                const repor = Math.max(minimo * 2 - m.stock, 1);
                const out = m.stock === 0;
                return (
                  <TableRow key={m.id}>
                    <TableCell>{out ? <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />out</Badge> : <Badge className="bg-amber-500/15 text-amber-700"><AlertTriangle className="mr-1 h-3 w-3" />baixo</Badge>}</TableCell>
                    <TableCell className="font-medium">{m.nome} {m.codigo && <span className="text-xs text-muted-foreground">· {m.codigo}</span>}</TableCell>
                    <TableCell>{f?.nome ?? "—"}</TableCell>
                    <TableCell>{formatEUR(m.precoCompra)}/{m.unidade}</TableCell>
                    <TableCell>{m.stock}</TableCell>
                    <TableCell>{minimo}</TableCell>
                    <TableCell className="font-display">{formatEUR(repor * m.precoCompra)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent></Card>
      </div>
    );
  },
});