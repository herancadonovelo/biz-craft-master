import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useSubscription } from "@/lib/subscription";
import { requiredPlanFor } from "@/lib/access-control";

const INLINE_LOCK_ROUTES = new Set([
  "/ferramentas-tecnicas",
  "/editor-moodboards",
  "/editor-receita",
  "/conversor-cores",
  "/contador",
  "/atelier-sounds",
]);

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
      if (INLINE_LOCK_ROUTES.has(pathname)) return;
      // Guarda a rota original para regressar automaticamente após o upgrade
      showPaywall(required, pathname, pathname);
      navigate({ to: "/", replace: true });
    }
  }, [pathname, loading, hasAccess, showPaywall, navigate]);

  return null;
}