import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useSubscription } from "@/lib/subscription";
import { requiredPlanFor } from "@/lib/access-control";

/**
 * Intercepta qualquer navegação (deep link, botão rápido, atalho ou
 * navegação indireta) para rotas restritas. Se o utilizador não tem o
 * plano necessário, redireciona para o Dashboard e abre sempre o modal
 * de upgrade — sem exceções por rota.
 */
export function RouteAccessGuard() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { hasAccess, showPaywall, loading } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    const required = requiredPlanFor(pathname);
    if (required === "light") return;
    if (!hasAccess(required)) {
      showPaywall(required, pathname, pathname);
      navigate({ to: "/", replace: true });
    }
  }, [pathname, loading, hasAccess, showPaywall, navigate]);

  return null;
}