import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { Sparkles, Layers, Boxes } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Configuração inicial" }] }),
  component: () => {
    const aplicarPreset = useStore((s) => s.aplicarPreset);
    const setOnboardingFeito = useStore((s) => s.setOnboardingFeito);
    const { user } = useAuth();
    const nav = useNavigate();
    const marcarConcluido = async () => {
      setOnboardingFeito(true);
      if (user) {
        const { error } = await supabase
          .from("profiles")
          .update({ onboarding_concluido: true })
          .eq("user_id", user.id);
        if (error) toast.error("Não foi possível guardar a preferência de onboarding: " + error.message);
      }
    };
    const escolher = async (p: "essencial" | "padrao" | "completo") => {
      aplicarPreset(p);
      await marcarConcluido();
      toast.success("Pronto! Podes ajustar em Módulos ativos.");
      nav({ to: "/" });
    };
    const saltar = async () => {
      await marcarConcluido();
      toast.info("Podes escolher um preset mais tarde em Módulos ativos.");
      nav({ to: "/" });
    };
    const opts = [
      {
        id: "essencial",
        icon: Sparkles,
        titulo: "Iniciante",
        desc: "O ideal para começar sem complicações. Um ambiente de trabalho limpo e simplificado, focado apenas nas ferramentas essenciais para arrancar. Inclui o básico para o dia a dia: registo de encomendas, clientes, stock, calculadora e faturação. Perfeito para gerir o seu artesanato sem distrações ou menus complexos.",
      },
      {
        id: "padrao",
        icon: Layers,
        titulo: "Intermédio",
        desc: "Para negócios em crescimento que precisam de mais controlo. Acesso à operação completa para gerir o seu trabalho de forma mais robusta. Inclui todas as ferramentas da fase inicial, adicionando funcionalidades de organização diária, mas mantendo a simplicidade de não exigir a configuração de integrações externas.",
      },
      {
        id: "completo",
        icon: Boxes,
        titulo: "Avançado",
        desc: "A experiência completa para automatizar e escalar. Todas as ferramentas de gestão ao seu dispor. Desbloqueie o potencial máximo da plataforma com funcionalidades complexas e integrações avançadas (como WhatsApp e Etsy). Recomendado para quem já domina a gestão básica e quer ligar o seu negócio ao mundo.",
      },
    ] as const;
    return (
      <div className="space-y-6">
        <PageHeader title="Configuração inicial" description="Escolhe um nível de complexidade para começar. Podes mudar a qualquer momento em Módulos ativos." />
        <div className="grid gap-4 md:grid-cols-3">
          {opts.map((o) => (
            <Card key={o.id} className="cursor-pointer transition hover:border-primary" onClick={() => escolher(o.id)}>
              <CardContent className="space-y-3 p-6">
                <div className="grid h-12 w-12 place-items-center rounded-md bg-primary/10 text-primary"><o.icon className="h-6 w-6" /></div>
                <h3 className="font-display text-lg font-semibold">{o.titulo}</h3>
                <p className="text-sm text-muted-foreground">{o.desc}</p>
                <Button className="w-full">Escolher</Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex justify-center pt-2">
          <Button variant="ghost" onClick={saltar}>Saltar este passo</Button>
        </div>
      </div>
    );
  },
});