import { type ReactNode, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Lock, Sparkles, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSubscription } from "@/lib/subscription";

interface Props {
  feature: string;
  children: ReactNode;
}

/**
 * Gate a whole route behind the Premium plan. If the user does not have
 * Premium (or active trial / vitalício), shows a locked screen and
 * triggers the global PaywallDialog.
 */
export function PremiumRoute({ feature, children }: Props) {
  const { hasAccess, showPaywall, loading } = useSubscription();
  const ok = hasAccess("premium");

  useEffect(() => {
    if (!loading && !ok) showPaywall("premium", feature);
  }, [loading, ok, feature, showPaywall]);

  if (loading) return null;
  if (ok) return <>{children}</>;

  return (
    <div className="mx-auto max-w-xl p-6">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
            <Lock className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold">{feature}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Esta funcionalidade está disponível apenas no plano{" "}
              <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                <Crown className="h-3.5 w-3.5" /> Premium
              </span>
              .
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link to="/planos">
              <Button>
                <Sparkles className="mr-2 h-4 w-4" />
                Ver planos e iniciar teste grátis
              </Button>
            </Link>
            <Button variant="ghost" onClick={() => showPaywall("premium", feature)}>
              Saber mais
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}