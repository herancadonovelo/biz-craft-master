import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const CATALOGO: { grupo: string; itens: { url: string; titulo: string }[] }[] = [
  { grupo: "Visão geral", itens: [
    { url: "/", titulo: "Dashboard" },
    { url: "/assistente", titulo: "Assistente IA" },
    { url: "/crescimento", titulo: "Crescimento" },
    { url: "/calendario", titulo: "Calendário" },
  ] },
  { grupo: "Operação", itens: [
    { url: "/encomendas", titulo: "Encomendas" },
    { url: "/estado-encomendas", titulo: "Estado encomendas" },
    { url: "/projetos", titulo: "Projetos" },
    { url: "/projeto-personalizado", titulo: "Projeto personalizado" },
    { url: "/calculadora", titulo: "Calculadora" },
    { url: "/horas", titulo: "Horas" },
    { url: "/todo", titulo: "To-do" },
    { url: "/portfolio", titulo: "Portefólio" },
    { url: "/etiquetas", titulo: "Etiquetas envio" },
  ] },
  { grupo: "Inventário", itens: [
    { url: "/stock", titulo: "Stock" },
    { url: "/fornecedores", titulo: "Fornecedores" },
    { url: "/lista-compras", titulo: "Lista de compras" },
  ] },
  { grupo: "Comercial", itens: [
    { url: "/clientes", titulo: "Clientes" },
    { url: "/cursos", titulo: "Cursos" },
    { url: "/vendas", titulo: "Vendas" },
    { url: "/faturacao", titulo: "Faturação" },
    { url: "/historico-faturas", titulo: "Histórico de faturas" },
    { url: "/marketing-conteudo", titulo: "Marketing e Conteúdo" },
    { url: "/instagram", titulo: "Instagram" },
    { url: "/whatsapp", titulo: "WhatsApp" },
    { url: "/notificacoes", titulo: "Notificações" },
    { url: "/etsy", titulo: "Etsy" },
    { url: "/ficheiros-digitais", titulo: "Ficheiros digitais" },
  ] },
  { grupo: "Financeiro", itens: [
    { url: "/cashflow", titulo: "Cash flow" },
    { url: "/despesas", titulo: "Despesas" },
  ] },
  { grupo: "Sistema", itens: [
    { url: "/design", titulo: "Personalização" },
    { url: "/gestao-fornecedores", titulo: "Gestão fornecedores" },
    { url: "/contas", titulo: "Contas & PIN" },
    { url: "/idioma", titulo: "Idioma" },
    { url: "/perfil-negocio", titulo: "Perfil Pessoal & Negócio" },
    { url: "/sincronizacao", titulo: "Sincronização" },
    { url: "/auditoria", titulo: "Auditoria" },
  ] },
];

export const Route = createFileRoute("/modulos")({
  head: () => ({ meta: [{ title: "Módulos ativos" }] }),
  component: () => {
    const modulos = useStore((s) => s.modulos);
    const setModulo = useStore((s) => s.setModulo);
    const aplicarPreset = useStore((s) => s.aplicarPreset);
    const setOnboardingFeito = useStore((s) => s.setOnboardingFeito);
    const nav = useNavigate();
    const aplicar = (p: "essencial" | "padrao" | "completo", label: string) => {
      aplicarPreset(p);
      setOnboardingFeito(true);
      toast.success(`${label} aplicado — a abrir o painel…`);
      setTimeout(() => nav({ to: "/" }), 250);
    };
    const algumAtivo = Object.values(modulos).some((v) => v === true);
    const isOn = (url: string) => !algumAtivo || modulos[url] === true;
    return (
      <div className="space-y-6">
        <PageHeader title="Módulos ativos" description="Liga ou desliga categorias do menu. Mantém a app limpa e ajustada ao teu fluxo." />
        <Card><CardContent className="flex flex-wrap gap-2 p-4">
          <Button variant="outline" onClick={() => aplicar("essencial", "Preset essencial")}>Essencial</Button>
          <Button variant="outline" onClick={() => aplicar("padrao", "Preset padrão")}>Padrão</Button>
          <Button variant="outline" onClick={() => aplicar("completo", "Todos os módulos")}>Completo</Button>
          <Button className="ml-auto" onClick={() => nav({ to: "/" })}>Aplicar e abrir painel</Button>
        </CardContent></Card>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {CATALOGO.map((g) => (
            <Card key={g.grupo}><CardContent className="space-y-2 p-4">
              <h3 className="font-display font-semibold">{g.grupo}</h3>
              {g.itens.map((it) => (
                <div key={it.url} className="flex items-center justify-between text-sm">
                  <span>{it.titulo}</span>
                  <Switch checked={isOn(it.url)} onCheckedChange={(v) => setModulo(it.url, v)} />
                </div>
              ))}
            </CardContent></Card>
          ))}
        </div>
      </div>
    );
  },
});