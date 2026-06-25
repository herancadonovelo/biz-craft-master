import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useSubscription, PLANS } from "@/lib/subscription";

export function PaywallDialog() {
  const { paywall, closePaywall } = useSubscription();
  const open = !!paywall?.open;
  const required = paywall?.required ?? "premium";
  const def = PLANS.find((p) => p.id === required)!;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closePaywall()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <Lock className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center font-display text-xl">
            {paywall?.feature ? `"${paywall.feature}" requer ${def.nome}` : `Funcionalidade do plano ${def.nome}`}
          </DialogTitle>
          <DialogDescription className="text-center">
            {def.resumo}
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
          {def.beneficios.slice(0, 5).map((b) => (
            <li key={b} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-primary" /><span>{b}</span></li>
          ))}
        </ul>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Link to="/planos" onClick={closePaywall} className="w-full">
            <Button className="w-full"><Sparkles className="mr-2 h-4 w-4" />Ver planos e começar teste grátis</Button>
          </Link>
          <Button variant="ghost" onClick={closePaywall}>Agora não</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}