import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useSubscription } from "@/lib/subscription";
import { requiredPlanFor } from "@/lib/access-control";

/**
 * Quando o utilizador conclui o upgrade (effectivePlan sobe), regressa
 * automaticamente à rota originalmente bloqueada sem refresh manual.
 */
export function UpgradeRedirectWatcher() {
  const { effectivePlan, pendingRedirect, hasAccess, clearPendingRedirect, closePaywall } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    if (!pendingRedirect) return;
    const need = requiredPlanFor(pendingRedirect);
    if (hasAccess(need)) {
      const target = pendingRedirect;
      clearPendingRedirect();
      closePaywall();
      toast.success("Acesso desbloqueado — a regressar à página…");
      // Pequeno delay para permitir UI atualizar
      setTimeout(() => navigate({ to: target as never, replace: true }), 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectivePlan, pendingRedirect]);

  return null;
}