import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useStore, formatEUR, precoProjeto } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingBag, Wallet, Clock, Package, Search, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n";
import { useSubscription } from "@/lib/subscription";
import { requiredPlanFor } from "@/lib/access-control";
import { InspirationCard } from "@/components/InspirationCard";
import logoAsset from "@/assets/craft-business-master-logo-transparent.png.asset.json";
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
      { title: "Craft Business Master — Gestão de Artesanato" },
      {
        name: "description",
        content:
          "Faça a gestão do seu atelier de artesanato: encomendas, stock, custos, preços e faturação num só painel.",
      },
      { property: "og:title", content: "Craft Business Master — Gestão de Artesanato" },
      {
        property: "og:description",
        content:
          "Faça a gestão do seu atelier de artesanato: encomendas, stock, custos, preços e faturação num só painel.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://craftbusinessmaster.com/" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://craftbusinessmaster.com/" }],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { encomendas, vendas, materiais, projetos, horas, caixa, todos, clientes } = useStore();
  const nav = useNavigate();
  const t = useT();
  const { hasAccess, showPaywall } = useSubscription();
  const [q, setQ] = useState("");

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

  // Índice pesquisável (título, categoria/aba, palavra-chave) de todas as áreas da app
  const index = useMemo(() => buildSearchIndex(t), [t]);
  const trimmed = q.trim().toLowerCase();
  const results = trimmed
    ? index.filter((item) =>
        item.haystack.includes(trimmed),
      ).slice(0, 12)
    : [];

  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <img
          src={logoAsset.url}
          alt="Craft Business Master"
          className="h-28 w-auto sm:h-36"
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

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("dashboard.searchPlaceholder")}
              className="pl-9"
              aria-label="Pesquisa global"
            />
          </div>
          {trimmed && (
            <div className="divide-y rounded-md border border-border">
              {results.length === 0 && (
                <div className="p-3 text-sm text-muted-foreground">Sem resultados.</div>
              )}
              {results.map((item) => {
                const required = requiredPlanFor(item.url);
                const locked = !hasAccess(required);
                if (locked) {
                  return (
                    <button
                      key={item.url + item.label}
                      type="button"
                      onClick={() => showPaywall(required, item.label, item.url)}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-muted-foreground/80"
                      aria-disabled="true"
                    >
                      <span className="flex flex-col">
                        <span className="truncate">{item.label}</span>
                        {item.hint && <span className="text-xs text-muted-foreground/70">{item.hint}</span>}
                      </span>
                      <span className="flex items-center gap-2 text-xs">
                        <span className="rounded bg-muted px-1.5 py-0.5 uppercase tracking-wide">{required}</span>
                        <Lock className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  );
                }
                return (
                  <Link
                    key={item.url + item.label}
                    to={item.url}
                    onClick={() => setQ("")}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-accent"
                  >
                    <span className="flex flex-col">
                      <span className="truncate">{item.label}</span>
                      {item.hint && <span className="text-xs text-muted-foreground">{item.hint}</span>}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
            <CardTitle as="h2" className="font-display text-lg">Cash flow recente</CardTitle>
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
            <CardTitle className="font-display">Tarefas</CardTitle>
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
          <CardTitle as="h2" className="font-display text-lg">Projetos em curso</CardTitle>
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

type SearchItem = { label: string; url: string; hint?: string; haystack: string };

function buildSearchIndex(t: (k: string) => string): SearchItem[] {
  const raw: Array<Omit<SearchItem, "haystack">> = [
    { label: t("nav.dashboard"), url: "/" },
    { label: t("nav.assistant"), url: "/assistente" },
    { label: t("nav.growth"), url: "/crescimento" },
    { label: t("nav.calendar"), url: "/calendario" },
    { label: "Encomendas", url: "/encomendas" },
    { label: "Projetos & Criação De Projeto", url: "/projetos" },
    { label: t("nav.calculator"), url: "/calculadora" },
    { label: t("nav.hours"), url: "/horas" },
    { label: t("nav.todo"), url: "/todo", hint: "To-do · dashboard" },
    { label: t("nav.portfolio"), url: "/portfolio" },
    { label: t("nav.catalog"), url: "/catalogo" },
    { label: t("nav.library"), url: "/biblioteca", hint: "Moldes, receitas, tutoriais" },
    { label: "Moodboards & Inspiração", url: "/moodboards" },
    { label: "Editor de moodboards", url: "/editor-moodboards", hint: "Premium" },
    { label: "Ferramentas Técnicas", url: "/ferramentas-tecnicas", hint: "Tricotin, crochê, ponto cruz, amigurumi, costura" },
    { label: "Contador de carreiras", url: "/contador", hint: "Premium" },
    { label: "Conversor de cores (DMC/Anchor)", url: "/conversor-cores" },
    { label: "Bloco De Notas", url: "/notas" },
    { label: "Craft & Relax Music", url: "/atelier-sounds", hint: "Creative Mood · Nature ASMR" },
    { label: "Mural De Inspiração", url: "/mural" },
    { label: t("nav.stock"), url: "/stock" },
    { label: t("nav.suppliers"), url: "/fornecedores" },
    { label: t("nav.shopping"), url: "/lista-compras" },
    { label: t("nav.clients"), url: "/clientes" },
    { label: t("nav.courses"), url: "/cursos" },
    { label: t("nav.sales"), url: "/vendas" },
    { label: "Faturação: Criar & Histórico", url: "/faturacao" },
    { label: "Marketing & Conteúdo", url: "/marketing-conteudo" },
    { label: t("nav.instagram"), url: "/instagram" },
    { label: t("nav.whatsapp"), url: "/whatsapp" },
    { label: t("nav.notifications"), url: "/notificacoes" },
    { label: "Etsy & Biblioteca Digital", url: "/etsy" },
    { label: t("nav.cashflow"), url: "/cashflow" },
    { label: t("nav.expenses"), url: "/despesas" },
    { label: t("nav.settingsAlias"), url: "/design" },
    { label: t("nav.supplierMgmt"), url: "/gestao-fornecedores" },
    { label: t("nav.accounts"), url: "/contas" },
    { label: t("nav.language"), url: "/idioma" },
    { label: t("nav.profile"), url: "/perfil-negocio" },
    { label: t("nav.sync"), url: "/sincronizacao" },
    { label: "Backup & Restauro", url: "/backup" },
    { label: "Planos & Subscrições", url: "/planos" },
    { label: t("nav.modules"), url: "/modulos" },
    { label: t("nav.help2"), url: "/ajuda" },
    { label: t("nav.contact"), url: "/contacto" },
    { label: t("nav.privacy"), url: "/privacidade" },
    { label: "Termos e Condições", url: "/termos" },
    { label: "Política de Reembolsos", url: "/reembolsos" },
    { label: "Quem Somos", url: "/quem-somos" },
  ];
  return raw.map((r) => ({
    ...r,
    haystack: `${r.label} ${r.hint ?? ""} ${r.url}`.toLowerCase(),
  }));
}