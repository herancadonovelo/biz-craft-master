import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, Lock, Crown, Star } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useSubscription, PLANS } from "@/lib/subscription";

export function PaywallDialog() {
  const { paywall, closePaywall } = useSubscription();
  const open = !!paywall?.open;
  const required = paywall?.required ?? "premium";
  const def = PLANS.find((p) => p.id === required)!;
  const isPremium = required === "premium" || required === "premium_vitalicio";

  // Estilo dinâmico consoante o plano alvo
  const accent = isPremium
    ? {
        title: "Funcionalidade Premium! 🌟",
        emoji: "🌟",
        Icon: Crown,
        ring: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
        badge:
          "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40",
        cta: "Fazer upgrade para Premium",
      }
    : {
        title: "Disponível no Plano Base ✨",
        emoji: "✨",
        Icon: Star,
        ring: "bg-primary/10 text-primary",
        badge: "bg-primary/15 text-primary border-primary/40",
        cta: "Fazer upgrade para Base",
      };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closePaywall()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className={`mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full ${accent.ring}`}>
            <accent.Icon className="h-6 w-6" />
          </div>
          <div className="mx-auto mb-1">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${accent.badge}`}>
              <Lock className="h-3 w-3" /> Requer plano {def.nome}
            </span>
          </div>
          <DialogTitle className="text-center font-display text-xl">
            {accent.title}
          </DialogTitle>
          <DialogDescription className="text-center">
            {paywall?.feature ? (
              <>
                <span className="font-medium text-foreground">{paywall.feature}</span>
                <br />
              </>
            ) : null}
            Esta funcionalidade está incluída no <span className="font-semibold">Plano {def.nome}</span>. Faz o upgrade para a desbloquear.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
          {def.beneficios.slice(0, 5).map((b) => (
            <li key={b} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 text-primary" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Link to="/planos" hash={required} onClick={closePaywall} className="w-full">
            <Button className="w-full">
              <Sparkles className="mr-2 h-4 w-4" />
              {accent.cta}
            </Button>
          </Link>
          <Button variant="ghost" onClick={closePaywall}>
            Agora não
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}