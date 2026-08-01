import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { IDIOMAS, useT } from "@/lib/i18n";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { savePreferredLanguage } from "@/lib/post-login";
import { resolveAutoLanguage, setLanguageEverywhere } from "@/lib/language-sync";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/idioma")({
  head: () => ({ meta: [{ title: "Idioma" }] }),
  component: IdiomaPage,
});

function IdiomaPage() {
  const t = useT();
  const idioma = useStore((s) => s.design.idioma);
  const auto = useStore((s) => s.design.idiomaAuto ?? false);
  const [country, setCountry] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("country")
        .eq("user_id", data.user.id)
        .maybeSingle();
      if (alive) setCountry((profile as { country?: string | null } | null)?.country ?? null);
    })();
    return () => { alive = false; };
  }, []);

  const activateAuto = () => {
    const next = resolveAutoLanguage(country);
    setLanguageEverywhere(next, true);
    void savePreferredLanguage(next);
    toast.success(t("lang.autoOn"));
  };

  return (
      <div className="space-y-6">
        <PageHeader title={t("nav.language")} description="Escolhe a língua da aplicação. A mudança é imediata." />
        <Card data-testid="lang-auto-card">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-display font-semibold">{t("lang.autoTitle")}</p>
              <p className="text-sm text-muted-foreground">{t("lang.autoDescription")}</p>
            </div>
            <Button
              data-testid="lang-auto"
              variant={auto ? "secondary" : "default"}
              onClick={activateAuto}
              className="gap-2"
            >
              <Wand2 className="h-4 w-4" />
              {auto ? t("lang.autoActive") : t("lang.autoAction")}
            </Button>
          </CardContent>
        </Card>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {IDIOMAS.map((l) => (
            <Card key={l.code} data-testid={`lang-${l.code}`} role="button" aria-label={l.label}
              className={`cursor-pointer transition hover:border-primary ${idioma === l.code ? "border-primary" : ""}`}
              onClick={() => {
                setLanguageEverywhere(l.code, false);
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
}