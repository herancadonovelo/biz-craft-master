import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { IDIOMAS, useT } from "@/lib/i18n";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { savePreferredLanguage } from "@/lib/post-login";

export const Route = createFileRoute("/idioma")({
  head: () => ({ meta: [{ title: "Idioma" }] }),
  component: () => {
    const t = useT();
    const idioma = useStore((s) => s.design.idioma);
    const setDesign = useStore((s) => s.setDesign);
    return (
      <div className="space-y-6">
        <PageHeader title={t("nav.language")} description="Escolhe a língua da aplicação. A mudança é imediata." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {IDIOMAS.map((l) => (
            <Card key={l.code} data-testid={`lang-${l.code}`} role="button" aria-label={l.label}
              className={`cursor-pointer transition hover:border-primary ${idioma === l.code ? "border-primary" : ""}`}
              onClick={() => {
                setDesign({ idioma: l.code });
                void savePreferredLanguage(l.code);
                toast.success(l.label);
              }}>
              <CardContent className="flex items-center gap-3 p-4">
                <span className="text-3xl">{l.flag}</span>
                <div className="flex-1">
                  <p className="font-display font-semibold">{l.label}</p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{l.code}</p>
                </div>
                {idioma === l.code && <Check className="h-5 w-5 text-primary" />}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  },
});