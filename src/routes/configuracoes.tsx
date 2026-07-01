import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Languages, Palette, Lock, Bell, Database, Trash2, ToggleLeft, Sparkles, HardDriveDownload, FlaskConical, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { loadDemoData } from "@/lib/seed-demo";
import { enterPreviewMode, exitPreviewMode, usePreviewMode } from "@/lib/preview-mode";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações" }] }),
  component: ConfiguracoesContent,
});

export function ConfiguracoesContent() {
    const previewActive = usePreviewMode();
    const items = [
      { to: "/idioma", icon: Languages, title: "Idioma", desc: "Mudar a língua da app" },
      { to: "/modulos", icon: ToggleLeft, title: "Módulos ativos", desc: "Liga/desliga categorias do menu" },
      { to: "/onboarding", icon: Sparkles, title: "Configuração inicial", desc: "Voltar ao assistente de setup" },
      { to: "/contas", icon: Lock, title: "Contas & PIN", desc: "Passwords e PIN de acesso" },
      { to: "/calendario", icon: Bell, title: "Alarmes & toques", desc: "Toque padrão e alertas" },
      { to: "/backup", icon: HardDriveDownload, title: "Backup & Restauro", desc: "Exportar JSON/CSV e restaurar" },
    ];
    return (
      <div className="space-y-6">
        <PageHeader title="Configurações" description="Tudo o que controla o comportamento da aplicação." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <Link key={it.to} to={it.to}>
              <Card className="cursor-pointer transition hover:border-primary">
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary"><it.icon className="h-5 w-5" /></div>
                  <div><p className="font-display font-semibold">{it.title}</p><p className="text-sm text-muted-foreground">{it.desc}</p></div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        <Card><CardContent className="space-y-3 p-4">
          <h3 className="font-display text-lg flex items-center gap-2"><Eye className="h-5 w-5" />Modo Preview</h3>
          <p className="text-sm text-muted-foreground">
            Vê a aplicação cheia de dados de demonstração sem alterar nem enviar nada para a tua conta. Ao sair, os teus dados reais voltam exatamente como estavam.
          </p>
          <div className="flex flex-wrap gap-2">
            {!previewActive ? (
              <Button onClick={() => { enterPreviewMode(); toast.success("Modo Preview ativado — os teus dados reais ficaram em segurança"); }}>
                <Eye className="mr-1 h-4 w-4" />Entrar em modo Preview
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => { exitPreviewMode(); toast.success("Modo Preview desativado — dados reais restaurados"); }}>
                <EyeOff className="mr-1 h-4 w-4" />Sair do modo Preview
              </Button>
            )}
          </div>
        </CardContent></Card>
        <Card><CardContent className="space-y-3 p-4">
          <h3 className="font-display text-lg flex items-center gap-2"><Database className="h-5 w-5" />Dados locais</h3>
          <p className="text-sm text-muted-foreground">A app guarda tudo localmente no teu navegador. Podes apagar tudo se precisares de recomeçar.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => {
              if (!confirm("Vai acrescentar dados de demonstração (clientes, encomendas, materiais, faturas, cash-flow, etc.). Continuar?")) return;
              loadDemoData();
              toast.success("Dados de demonstração carregados em todas as categorias");
            }}><FlaskConical className="mr-1 h-4 w-4" />Carregar dados de demonstração</Button>
            <Button variant="destructive" onClick={() => {
              if (!confirm("Tens a certeza? Isto apaga TODOS os dados locais.")) return;
              localStorage.removeItem("atelier-store-v1");
              toast.success("Dados apagados. A recarregar…");
              setTimeout(() => location.reload(), 600);
            }}><Trash2 className="mr-1 h-4 w-4" />Apagar todos os dados</Button>
          </div>
        </CardContent></Card>
      </div>
    );
}