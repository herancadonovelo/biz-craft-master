import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, formatEUR } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/marketing")({
  head: () => ({ meta: [{ title: "Marketing & vendas" }] }),
  component: () => {
    const { campanhas, vendas, add, remove } = useStore();
    const [form, setForm] = useState({ nome: "", canal: "Instagram", custo: 0, alcance: 0, conversoes: 0, data: new Date().toISOString().slice(0, 10) });
    const totalCusto = campanhas.reduce((s, c) => s + c.custo, 0);
    const totalConv = campanhas.reduce((s, c) => s + c.conversoes, 0);
    const receita = vendas.reduce((s, v) => s + v.valor, 0);
    const roi = totalCusto ? (((receita - totalCusto) / totalCusto) * 100).toFixed(0) : "—";

    return (
      <div className="space-y-6">
        <PageHeader title="Marketing & vendas" description="Acompanha campanhas, conversões e ROI." />
        <div className="grid gap-4 md:grid-cols-4">
          <Kpi label="Investido" value={formatEUR(totalCusto)} />
          <Kpi label="Conversões" value={String(totalConv)} />
          <Kpi label="Receita" value={formatEUR(receita)} />
          <Kpi label="ROI" value={`${roi}%`} />
        </div>
        <Card><CardContent className="grid gap-3 p-4 md:grid-cols-6">
          <div className="md:col-span-2"><Label>Nome campanha</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
          <div><Label>Canal</Label><Input value={form.canal} onChange={(e) => setForm({ ...form, canal: e.target.value })} /></div>
          <div><Label>Custo</Label><Input type="number" value={form.custo} onChange={(e) => setForm({ ...form, custo: +e.target.value })} /></div>
          <div><Label>Alcance</Label><Input type="number" value={form.alcance} onChange={(e) => setForm({ ...form, alcance: +e.target.value })} /></div>
          <div><Label>Conversões</Label><Input type="number" value={form.conversoes} onChange={(e) => setForm({ ...form, conversoes: +e.target.value })} /></div>
          <div className="md:col-span-6"><Button onClick={() => { if (!form.nome) return toast.error("Nome obrigatório"); add("campanhas", form); setForm({ nome: "", canal: "Instagram", custo: 0, alcance: 0, conversoes: 0, data: new Date().toISOString().slice(0, 10) }); toast.success("Campanha registada"); }}><Plus className="mr-1 h-4 w-4" />Registar campanha</Button></div>
        </CardContent></Card>
        <Card>
          <CardHeader><CardTitle className="font-display">Campanhas</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Campanha</TableHead><TableHead>Canal</TableHead><TableHead>Alcance</TableHead><TableHead>Conv.</TableHead><TableHead className="text-right">Custo</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {campanhas.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.data}</TableCell>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell>{c.canal}</TableCell>
                    <TableCell>{c.alcance.toLocaleString("pt-PT")}</TableCell>
                    <TableCell>{c.conversoes}</TableCell>
                    <TableCell className="text-right font-display">{formatEUR(c.custo)}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => remove("campanhas", c.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  },
});

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</CardTitle></CardHeader>
      <CardContent><div className="font-display text-2xl font-semibold">{value}</div></CardContent>
    </Card>
  );
}