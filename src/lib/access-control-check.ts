import { ROUTE_ACCESS } from "@/lib/access-control";

/**
 * Verificação automática (dev) de que todos os editores técnicos e
 * rotas de conteúdo Premium estão devidamente marcados no mapa de
 * `access-control`. Corre uma vez, no arranque do cliente, em modo dev.
 * Se algo estiver mal configurado, aparece um warning claro na consola
 * — o suficiente para apanhar regressões (ex. alguém adicionar um novo
 * editor sem gate).
 */

/** Rotas que TÊM de exigir plano Premium. */
const PREMIUM_REQUIRED = [
  "/ferramentas-tecnicas",
  "/editor-moodboards",
  "/editor-receita",
  "/conversor-cores",
  "/contador",
  "/atelier-sounds",
  "/mural",
  "/crescimento",
  "/auditoria",
  "/etsy",
  "/whatsapp",
  "/instagram",
  "/notificacoes",
] as const;

export interface AccessCheckResult {
  ok: boolean;
  missing: string[];
  wrongPlan: Array<{ route: string; plan: string }>;
}

export function runAccessControlCheck(): AccessCheckResult {
  const missing: string[] = [];
  const wrongPlan: Array<{ route: string; plan: string }> = [];
  for (const r of PREMIUM_REQUIRED) {
    const plan = ROUTE_ACCESS[r];
    if (!plan) missing.push(r);
    else if (plan !== "premium") wrongPlan.push({ route: r, plan });
  }
  return { ok: missing.length === 0 && wrongPlan.length === 0, missing, wrongPlan };
}

let didRun = false;
export function assertAccessControlOnce() {
  if (didRun) return;
  didRun = true;
  if (!import.meta.env.DEV) return;
  const res = runAccessControlCheck();
  if (res.ok) {
    console.info("[access-control] ✅ todas as rotas premium estão protegidas.");
    return;
  }
  if (res.missing.length) {
    console.error(
      "[access-control] ❌ rotas premium AUSENTES do mapa ROUTE_ACCESS:",
      res.missing,
    );
  }
  if (res.wrongPlan.length) {
    console.error(
      "[access-control] ❌ rotas premium com plano errado (deveria ser 'premium'):",
      res.wrongPlan,
    );
  }
}