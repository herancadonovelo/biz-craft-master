import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useStore, CURRENCIES, formatCurrency, getCurrencyOption } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-state";

export const Route = createFileRoute("/moeda")({
  head: () => ({
    meta: [
      { title: "Moeda Principal · Craftme Business Master" },
      { name: "description", content: "Escolhe a moeda principal usada em toda a app." },
    ],
  }),
  component: MoedaPage,
});

function MoedaPage() {
  const moeda = useStore((s) => s.design.moeda ?? "EUR");
  const setDesign = useStore((s) => s.setDesign);
  const { user } = useAuth();

  // Hidratar a preferência a partir da base de dados uma vez.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("preferred_currency")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled || error || !data?.preferred_currency) return;
      if (data.preferred_currency !== moeda) {
        setDesign({ moeda: data.preferred_currency });
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const change = async (code: string) => {
    setDesign({ moeda: code });
    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({ preferred_currency: code })
        .eq("user_id", user.id);
      if (error) toast.error(`Falha ao guardar na nuvem: ${error.message}`);
      else toast.success(`Moeda alterada para ${getCurrencyOption(code).label}.`);
    } else {
      toast.success(`Moeda alterada para ${getCurrencyOption(code).label}.`);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Padrão Financeiro: Moeda Atual Definida"
        description="Define a moeda usada em toda a app (preços, custos, orçamentos, relatórios)."
      />
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Escolhe a tua moeda</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={moeda} onValueChange={change} className="grid gap-3 sm:grid-cols-2">
            {CURRENCIES.map((c) => (
              <Label
                key={c.code}
                htmlFor={`cur-${c.code}`}
                className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-border bg-card p-3 hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem id={`cur-${c.code}`} value={c.code} />
                  <div>
                    <div className="font-medium">{c.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.code} · {c.symbol}
                    </div>
                  </div>
                </div>
                <div className="font-display text-sm text-muted-foreground">
                  {formatCurrency(1234.5, c.code)}
                </div>
              </Label>
            ))}
          </RadioGroup>
          <p className="mt-4 text-xs text-muted-foreground">
            A escolha é guardada no teu perfil na nuvem e sincronizada entre dispositivos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}