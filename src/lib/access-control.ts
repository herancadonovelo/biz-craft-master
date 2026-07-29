import type { Plan } from "@/lib/subscription";

/**
 * Mapeamento central rota → plano mínimo necessário.
 * Tudo o que não estiver listado é considerado "light" (acessível a todos).
 */
export const ROUTE_ACCESS: Record<string, Plan> = {
  // ----- Base -----
  "/assistente": "base",
  "/sincronizacao": "base",
  "/backup": "base",
  "/faturacao": "base",
  "/historico-faturas": "base",
  "/cashflow": "base",
  "/despesas": "base",
  "/encomendas": "base",
  "/estado-encomendas": "base",
  "/projetos": "base",
  "/projeto-personalizado": "base",
  "/horas": "base",
  "/marketing-conteudo": "base",

  // ----- Premium -----
  "/contador": "premium",
  "/editor-moodboards": "premium",
  "/atelier-sounds": "premium",
  "/conversor-cores": "premium",
  "/ferramentas-tecnicas": "premium",
  "/mural": "premium",
  "/crescimento": "premium",
  "/etsy": "premium",
  "/etsy-auditoria": "premium",
  "/whatsapp": "premium",
  "/instagram": "premium",
  "/notificacoes": "premium",
  "/consolidar-feedback": "premium",
};

/** Rotas sempre acessíveis (sistema/config/auth/planos). */
export const ALWAYS_OPEN = new Set<string>([
  "/",
  "/auth",
  "/planos",
  "/perfil-negocio",
  "/configuracoes",
  "/modulos",
  "/onboarding",
  "/idioma",
  "/design",
  "/contas",
  "/ajuda",
  "/contacto",
  "/privacidade",
  "/termos",
  "/reembolsos",
]);

export function requiredPlanFor(path: string): Plan {
  if (ALWAYS_OPEN.has(path)) return "light";
  return ROUTE_ACCESS[path] ?? "light";
}