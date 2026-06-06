import { createFileRoute } from "@tanstack/react-router";
import { useStore, formatEUR, precoProjeto } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

export const Route = createFileRoute("/crescimento")({
  head: () => ({ meta: [{ title: "Crescimento" }] }),
  component: () => {
    const { vendas, projetos, materiais, clientes, encomendas, caixa } = useStore();

    // monthly trend
    const byMonth: Record<string, number> = {};
    vendas.forEach((v) => {
      const m = v.data.slice(0, 7);
      byMonth[m] = (byMonth[m] ?? 0) + v.valor;
    });
    const trend = Object.entries(byMonth).sort().map(([mes, valor]) => ({ mes, valor }));

    const estados = ["pendente", "em_producao", "pronta", "entregue", "cancelada"].map((e) => ({
      name: e.replace("_", " "), value: encomendas.filter((x) => x.estado === e).length,
    })).filter((x) => x.value > 0);

    const COLORS = ["oklch(0.65 0.13 60)", "oklch(0.6 0.12 230)", "oklch(0.55 0.12 290)", "oklch(0.6 0.15 160)", "oklch(0.6 0.18 25)"];

    const margemMedia = projetos.length
      ? projetos.reduce((s, p) => s + (precoProjeto(p, materiais) - (p.horasTrabalhadas * p.precoHora + p.materiais.reduce((sm, mu) => sm + (materiais.find((x) => x.id === mu.materialId)?.precoCompra ?? 0) * mu.quantidade, 0))), 0) / projetos.length
      : 0;

    return (
      <div className="space-y-6">
        <PageHeader title="Crescimento do negócio" description="Estatísticas e relatórios periódicos para gestão estratégica." />
        <div className="grid gap-4 md:grid-cols-4">
          <Kpi label="Clientes" value={String(clientes.length)} />
          <Kpi label="Projetos" value={String(projetos.length)} />
          <Kpi label="Receita total" value={formatEUR(vendas.reduce((s, v) => s + v.valor, 0))} />
          <Kpi label="Lucro médio/projeto" value={formatEUR(margemMedia)} />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="font-display">Vendas por mês</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="mes" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="valor" stroke="oklch(0.55 0.08 250)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="font-display">Distribuição encomendas</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={estados} dataKey="value" nameKey="name" outerRadius={80}>
                    {estados.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader><CardTitle className="font-display">Relatório executivo</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <p>• Margem média por projeto: <span className="font-display text-foreground">{formatEUR(margemMedia)}</span>.</p>
            <p>• Estado mais comum das encomendas: <span className="text-foreground">{estados.sort((a, b) => b.value - a.value)[0]?.name ?? "—"}</span>.</p>
            <p>• Movimentos totais de caixa registados: <span className="text-foreground">{caixa.length}</span>.</p>
            <p>• Recomendação: aumentar margem para 80% nos projetos personalizados de baixo volume.</p>
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