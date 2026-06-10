import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
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
    const nav = useNavigate();
    const escolher = (p: "essencial" | "padrao" | "completo") => {
      aplicarPreset(p);
      setOnboardingFeito(true);
      toast.success("Pronto! Podes ajustar em Módulos ativos.");
      nav({ to: "/" });
    };
    const opts = [
      { id: "essencial", icon: Sparkles, titulo: "Essencial", desc: "Apenas o básico: encomendas, clientes, stock, calculadora e faturação." },
      { id: "padrao", icon: Layers, titulo: "Padrão", desc: "Operação completa sem integrações avançadas (WhatsApp, Etsy)." },
      { id: "completo", icon: Boxes, titulo: "Completo", desc: "Todas as categorias e integrações ativas." },
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
      </div>
    );
  },
});