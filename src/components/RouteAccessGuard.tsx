import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useSubscription } from "@/lib/subscription";
import { requiredPlanFor } from "@/lib/access-control";

// Rotas cujas próprias páginas já renderizam o ecrã de bloqueio Premium
// (via <PremiumRoute>). Não redirecionamos nem abrimos o modal global —
// senão o utilizador vê onboarding/dashboard + dialog em vez do CTA
// dedicado na página, e os testes E2E deixam de conseguir asserir o
// paywall inline.
const INLINE_PREMIUM_ROUTES = new Set<string>([
  "/ferramentas-tecnicas",
  "/editor-moodboards",
  "/contador",
  "/conversor-cores",
  "/editor-tricotin",
  "/editor-croche",
  "/editor-ponto-cruz",
  "/editor-amigurumi",
  "/editor-costura",
  "/editor-bordado",
  "/editor-tricot-graficos",
  "/consolidar-feedback",
]);

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
    if (INLINE_PREMIUM_ROUTES.has(pathname)) return;
    if (!hasAccess(required)) {
      showPaywall(required, pathname, pathname);
      navigate({ to: "/", replace: true });
    }
  }, [pathname, loading, hasAccess, showPaywall, navigate]);

  return null;
}