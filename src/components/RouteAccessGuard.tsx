import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useSubscription } from "@/lib/subscription";
import { requiredPlanFor } from "@/lib/access-control";

/**
 * Intercepta navegação direta por URL para rotas restritas.
 * Se o utilizador não tem o plano necessário, abre o paywall e
 * redireciona para o Dashboard.
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
      showPaywall(required, pathname);
      navigate({ to: "/", replace: true });
    }
  }, [pathname, loading, hasAccess, showPaywall, navigate]);

  return null;
}