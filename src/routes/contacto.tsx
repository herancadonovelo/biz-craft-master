import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const EMAIL = "craftbusinessmaster@gmail.com";

export const Route = createFileRoute("/contacto")({
  head: () => ({
    meta: [
      { title: "Contacte-nos — Craft Business Master" },
      {
        name: "description",
        content:
          "Fale com a equipa do Craft Business Master para suporte, dúvidas sobre subscrições ou parcerias.",
      },
      { property: "og:title", content: "Contacte-nos — Craft Business Master" },
      {
        property: "og:description",
        content: "Fale connosco para suporte ou parcerias.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://craftbusinessmaster.com/contacto" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://craftbusinessmaster.com/contacto" }],
  }),
  component: () => (
    <div className="space-y-6">
      <PageHeader title="Contacte-nos" description="Fale connosco para suporte ou parcerias." />
      <Card>
        <CardContent className="flex flex-col items-start gap-4 p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-md bg-primary/10 text-primary">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">E-mail de contacto</p>
              <a href={`mailto:${EMAIL}`} className="font-display text-lg font-semibold text-foreground hover:underline">{EMAIL}</a>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild><a href={`mailto:${EMAIL}`}>Enviar e-mail</a></Button>
            <Button variant="outline" onClick={() => { navigator.clipboard.writeText(EMAIL); toast.success("E-mail copiado"); }}>
              <Copy className="mr-1 h-4 w-4" />Copiar
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Resposta tipicamente em 24-48h em dias úteis.</p>
        </CardContent>
      </Card>
    </div>
  ),
});