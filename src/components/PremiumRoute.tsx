import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Lock, Sparkles, Crown, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSubscription, PLANS } from "@/lib/subscription";

interface Props {
  feature: string;
  children: ReactNode;
}

/**
 * Gate a whole route behind the Premium plan. If the user does not have
 * Premium (or active trial / vitalício), shows a locked screen that
 * explains the current plan, what Premium unlocks, and offers upgrade.
 */
export function PremiumRoute({ feature, children }: Props) {
  const { hasAccess, loading, effectivePlan } = useSubscription();
  const ok = hasAccess("premium");

  if (loading) return null;
  if (ok) return <>{children}</>;

  const currentDef = PLANS.find((p) => p.id === effectivePlan);
  const premiumDef = PLANS.find((p) => p.id === "premium")!;
  const highlights = premiumDef.beneficios.slice(0, 6);

  return (
    <div
      className="mx-auto max-w-2xl p-6"
      data-testid="premium-locked"
      data-feature={feature}
      data-plan={effectivePlan}
    >
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <Lock className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold" data-testid="premium-locked-title">
              {feature} — requer Premium
            </h1>
            <p
              className="mt-2 inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300"
              data-testid="premium-locked-current-plan"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              O teu plano atual é{" "}
              <span className="font-semibold">{currentDef?.nome ?? "Light"}</span> — não inclui esta funcionalidade.
            </p>
          </div>

          <div className="w-full rounded-lg border border-border bg-muted/30 p-4 text-left">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Crown className="h-4 w-4 text-amber-500" />
              O que desbloqueias com Premium
            </div>
            <ul className="space-y-1.5 text-sm" data-testid="premium-locked-benefits">
              {highlights.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            <Link to="/planos" hash="premium" className="w-full sm:w-auto">
              <Button className="w-full" data-testid="premium-locked-upgrade">
                <Sparkles className="mr-2 h-4 w-4" />
                Fazer upgrade para Premium
              </Button>
            </Link>
            <Link to="/planos" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full" data-testid="premium-locked-trial">
                Iniciar teste grátis de 14 dias
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground">
            Podes cancelar a qualquer momento durante o período de teste.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}