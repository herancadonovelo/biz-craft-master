import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useStore, formatEUR, precoProjeto } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingBag, Wallet, Clock, Package } from "lucide-react";
import { InspirationCard } from "@/components/InspirationCard";
import logoAsset from "@/assets/craft-business-master-logo.png.asset.json";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel — Atelier Tricotin" },
      { name: "description", content: "Painel de gestão do atelier de tricotin, crochê e amigurumi." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { encomendas, vendas, materiais, projetos, horas, caixa, todos, clientes, onboardingFeito } = useStore();
  const nav = useNavigate();
  useEffect(() => { if (!onboardingFeito) nav({ to: "/onboarding" }); }, [onboardingFeito, nav]);

  const receita = vendas.reduce((s, v) => s + v.valor, 0);
  const aReceber = encomendas
    .filter((e) => e.estado !== "entregue" && e.estado !== "cancelada")
    .reduce((s, e) => s + e.preco, 0);
  const horasTotais = horas.reduce((s, h) => s + h.horas, 0);
  const stockBaixo = materiais.filter((m) => m.stock < 5).length;

  // cashflow chart by day
  const byDay: Record<string, { data: string; entradas: number; saidas: number }> = {};
  caixa.forEach((m) => {
    byDay[m.data] ||= { data: m.data, entradas: 0, saidas: 0 };
    if (m.tipo === "entrada") byDay[m.data].entradas += m.valor;
    else byDay[m.data].saidas += m.valor;
  });
  const serie = Object.values(byDay).sort((a, b) => a.data.localeCompare(b.data));

  const kpis = [
    { label: "Receita", valor: formatEUR(receita), icon: Wallet, tone: "text-emerald-600" },
    { label: "A receber", valor: formatEUR(aReceber), icon: ShoppingBag, tone: "text-amber-600" },
    { label: "Horas registadas", valor: `${horasTotais}h`, icon: Clock, tone: "text-sky-600" },
    { label: "Stock crítico", valor: `${stockBaixo}`, icon: Package, tone: "text-rose-600" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <img
          src={logoAsset.url}
          alt="Craft Business Master"
          className="h-20 w-auto sm:h-24"
        />
      </div>
      <PageHeader
        title={`Olá! Aqui está o teu atelier hoje.`}
        description={`${clientes.length} clientes · ${projetos.length} projetos ativos · ${encomendas.length} encomendas`}
        actions={
          <Button asChild>
            <Link to="/projetos">Novo projeto <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        }
      />

      <InspirationCard />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {k.label}
              </CardTitle>
              <k.icon className={`h-4 w-4 ${k.tone}`} />
            </CardHeader>
            <CardContent>
              <div className="font-display text-2xl font-semibold">{k.valor}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display">Cash flow recente</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={serie}>
                <defs>
                  <linearGradient id="ent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.7 0.12 160)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="oklch(0.7 0.12 160)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="sai" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.62 0.18 25)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="oklch(0.62 0.18 25)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="data" stroke="currentColor" fontSize={12} />
                <YAxis stroke="currentColor" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                  }}
                />
                <Area type="monotone" dataKey="entradas" stroke="oklch(0.6 0.14 160)" fill="url(#ent)" />
                <Area type="monotone" dataKey="saidas" stroke="oklch(0.62 0.18 25)" fill="url(#sai)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-display">To-do</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todos.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm">
                <span className={t.feito ? "line-through text-muted-foreground" : ""}>{t.titulo}</span>
                <Badge variant={t.prioridade === "alta" ? "destructive" : "secondary"}>{t.prioridade}</Badge>
              </div>
            ))}
            <Button variant="outline" asChild className="w-full">
              <Link to="/todo">Ver tudo</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Projetos em curso</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {projetos.map((p) => (
            <div key={p.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{p.nome}</span>
                <Badge variant="outline">{p.estado.replace("_", " ")}</Badge>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                <span>{p.horasTrabalhadas}h trabalhadas</span>
                <span className="font-display text-foreground">{formatEUR(precoProjeto(p, materiais))}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}