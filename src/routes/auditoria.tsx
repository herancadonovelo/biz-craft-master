import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

export const Route = createFileRoute("/auditoria")({
  head: () => ({ meta: [{ title: "Histórico & auditoria" }] }),
  component: () => {
    const auditoria = useStore((s) => s.auditoria);
    const [q, setQ] = useState("");
    const filtrada = auditoria.filter((a) =>
      [a.acao, a.entidade, a.detalhes ?? "", a.utilizador].join(" ").toLowerCase().includes(q.toLowerCase()),
    );
    return (
      <div className="space-y-6">
        <PageHeader title="Histórico & auditoria" description="Todas as ações importantes ficam registadas com data e utilizador." />
        <div className="relative max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Pesquisar acção, entidade ou detalhes…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Utilizador</TableHead><TableHead>Entidade</TableHead><TableHead>Ação</TableHead><TableHead>Detalhes</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtrada.length === 0 && <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">Sem registos ainda. As ações vão aparecer aqui automaticamente.</TableCell></TableRow>}
              {filtrada.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{new Date(a.data).toLocaleString("pt-PT")}</TableCell>
                  <TableCell>{a.utilizador}</TableCell>
                  <TableCell><Badge variant="outline">{a.entidade}</Badge></TableCell>
                  <TableCell className="font-medium">{a.acao}</TableCell>
                  <TableCell className="max-w-md text-xs text-muted-foreground">{a.detalhes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      </div>
    );
  },
});