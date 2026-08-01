import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, formatEUR } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, TrendingUp, TrendingDown, Lightbulb } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/cashflow")({
  head: () => ({ meta: [{ title: "Cash flow" }] }),
  component: () => {
    const { caixa, despesas, add, remove } = useStore();
    const [form, setForm] = useState({ tipo: "entrada" as "entrada" | "saida", categoria: "", descricao: "", valor: 0, data: new Date().toISOString().slice(0, 10) });

    const entradas = caixa.filter((m) => m.tipo === "entrada").reduce((s, m) => s + m.valor, 0);
    const saidas = caixa.filter((m) => m.tipo === "saida").reduce((s, m) => s + m.valor, 0);
    const fixas = despesas.reduce((s, d) => s + (d.periodicidade === "mensal" ? d.valor : d.valor / 12), 0);
    const saldo = entradas - saidas;

    const byCat: Record<string, number> = {};
    caixa.filter((m) => m.tipo === "saida").forEach((m) => { byCat[m.categoria] = (byCat[m.categoria] ?? 0) + m.valor; });
    const data = Object.entries(byCat).map(([k, v]) => ({ categoria: k, valor: v }));

    const insights: string[] = [];
    if (saidas > entradas) insights.push("Saídas superiores às entradas — reduzir custos variáveis ou aumentar margem dos projetos.");
    if (fixas > entradas * 0.4) insights.push("Despesas fixas representam mais de 40% das entradas — renegociar contratos ou aumentar volume de vendas.");
    const maiorCat = data.sort((a, b) => b.valor - a.valor)[0];
    if (maiorCat) insights.push(`Maior categoria de despesa: ${maiorCat.categoria} (${formatEUR(maiorCat.valor)}) — vale a pena procurar fornecedores alternativos.`);
    if (entradas === 0) insights.push("Sem entradas registadas no período — atualizar registo de vendas.");

    return (
      <div className="space-y-6">
        <PageHeader title="Gestão de Números & fios: Tesouraria" description="Movimentos de caixa e oportunidades de melhoria financeira." />
        <div className="grid gap-4 md:grid-cols-4">
          <Kpi label="Entradas" value={formatEUR(entradas)} tone="text-emerald-600" icon={TrendingUp} />
          <Kpi label="Saídas" value={formatEUR(saidas)} tone="text-rose-600" icon={TrendingDown} />
          <Kpi label="Despesas fixas (mensal)" value={formatEUR(fixas)} tone="text-amber-600" icon={TrendingDown} />
          <Kpi label="Saldo" value={formatEUR(saldo)} tone={saldo >= 0 ? "text-emerald-600" : "text-rose-600"} icon={TrendingUp} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="font-display">Saídas por categoria</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="categoria" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="valor" fill="oklch(0.55 0.08 250)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 font-display"><Lightbulb className="h-4 w-4" />Sugestões</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {insights.length === 0 ? <p className="text-muted-foreground">A finança está saudável. Continua assim!</p> :
                insights.map((i, k) => <p key={k} className="rounded-md border border-border bg-muted/40 p-2">{i}</p>)}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="font-display">Novo movimento</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-6">
            <div><Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v: any) => setForm({ ...form, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="entrada">Entrada</SelectItem><SelectItem value="saida">Saída</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Categoria</Label><Input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Descrição</Label><Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
            <div><Label>Valor</Label><Input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: +e.target.value })} /></div>
            <div><Label>Data</Label><Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></div>
            <div className="md:col-span-6"><Button onClick={() => { if (!form.categoria || !form.valor) return toast.error("Categoria e valor obrigatórios"); add("caixa", form); setForm({ tipo: "entrada", categoria: "", descricao: "", valor: 0, data: new Date().toISOString().slice(0, 10) }); toast.success("Movimento registado"); }}><Plus className="mr-1 h-4 w-4" />Registar</Button></div>
          </CardContent>
        </Card>

        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead>Categoria</TableHead><TableHead>Descrição</TableHead><TableHead className="text-right">Valor</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {caixa.slice().reverse().map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.data}</TableCell>
                  <TableCell className={m.tipo === "entrada" ? "text-emerald-600" : "text-rose-600"}>{m.tipo}</TableCell>
                  <TableCell>{m.categoria}</TableCell>
                  <TableCell className="text-muted-foreground">{m.descricao}</TableCell>
                  <TableCell className="text-right font-display">{formatEUR(m.valor)}</TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => remove("caixa", m.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      </div>
    );
  },
});

function Kpi({ label, value, tone, icon: Icon }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</CardTitle>
        <Icon className={`h-4 w-4 ${tone}`} />
      </CardHeader>
      <CardContent><div className={`font-display text-2xl font-semibold ${tone}`}>{value}</div></CardContent>
    </Card>
  );
}