/**
 * Telemetria das personalizações de design.
 *
 * Dois sinais que queremos monitorizar:
 *  1) `migracao_campos_preenchidos` — a migração do estado persistido teve de
 *     preencher campos em falta (indica versões antigas/estado corrompido).
 *  2) `reset_inesperado` — várias personalizações voltaram ao default sem que
 *     o utilizador tenha carregado em "Restaurar personalização default".
 *
 * O módulo é propositadamente independente da store (é importado pela própria
 * migração) e nunca lança: falhar telemetria nunca pode partir a app.
 */

export type DesignEventoTipo =
  | "migracao_campos_preenchidos"
  | "migracao_sem_design"
  | "restauro_intencional"
  | "reset_inesperado";

export interface DesignEvento {
  tipo: DesignEventoTipo;
  em: string;
  campos?: string[];
  totalCampos?: number;
  versaoAnterior?: number;
  versaoAtual?: number;
  detalhe?: string;
}

export const DESIGN_TELEMETRIA_KEY = "cbm-design-telemetria-v1";
const RESTAURO_FLAG_KEY = "cbm-design-restauro-intencional";
export const MAX_EVENTOS = 50;
/** Nº mínimo de campos repostos em simultâneo para considerar um reset. */
export const RESET_MIN_CAMPOS = 3;
/** Janela (ms) em que um restauro assinalado ainda justifica um reset. */
export const RESTAURO_JANELA_MS = 10_000;

const igual = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** Campos do default que faltam (ou estão undefined) no design guardado. */
export function camposEmFalta(
  design: Record<string, unknown> | null | undefined,
  defaults: Record<string, unknown>,
): string[] {
  const d = design ?? {};
  // Chaves cujo default é undefined (ex.: sidebarL) não contam como "em falta".
  return Object.keys(defaults).filter(
    (k) => defaults[k] !== undefined && (!(k in d) || d[k] === undefined),
  );
}

export interface DeteccaoReset {
  reset: boolean;
  camposRepostos: string[];
}

/**
 * Deteta uma reposição em massa: campos que estavam personalizados (diferentes
 * do default) e que passaram a ser exactamente iguais ao default.
 */
export function detetarReset(
  anterior: Record<string, unknown> | null | undefined,
  atual: Record<string, unknown> | null | undefined,
  defaults: Record<string, unknown>,
  minCampos: number = RESET_MIN_CAMPOS,
): DeteccaoReset {
  if (!anterior || !atual) return { reset: false, camposRepostos: [] };
  const camposRepostos = Object.keys(defaults).filter(
    (k) => !igual(anterior[k], defaults[k]) && igual(atual[k], defaults[k]),
  );
  return { reset: camposRepostos.length >= minCampos, camposRepostos };
}

function lerBruto(): DesignEvento[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DESIGN_TELEMETRIA_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? (arr as DesignEvento[]) : [];
  } catch {
    return [];
  }
}

export const lerEventosDesign = (): DesignEvento[] => lerBruto();

export function limparEventosDesign() {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(DESIGN_TELEMETRIA_KEY); } catch {}
}

/** Regista um evento no anel de eventos (máx. MAX_EVENTOS) e na consola. */
export function registarEventoDesign(ev: Omit<DesignEvento, "em"> & { em?: string }): DesignEvento {
  const completo: DesignEvento = { em: new Date().toISOString(), ...ev };
  const nivel = completo.tipo === "reset_inesperado" ? "warn" : "info";
  // eslint-disable-next-line no-console
  (console as any)[nivel]("[design-telemetria]", completo.tipo, completo);
  if (typeof window !== "undefined") {
    try {
      const lista = [...lerBruto(), completo].slice(-MAX_EVENTOS);
      window.localStorage.setItem(DESIGN_TELEMETRIA_KEY, JSON.stringify(lista));
      window.dispatchEvent(new CustomEvent("atelier:design-telemetria", { detail: completo }));
    } catch {}
  }
  return completo;
}

/** Marca que o próximo reset é intencional (botão "Restaurar default"). */
export function marcarRestauroIntencional(detalhe?: string) {
  if (typeof window === "undefined") return;
  try { window.sessionStorage.setItem(RESTAURO_FLAG_KEY, String(Date.now())); } catch {}
  registarEventoDesign({ tipo: "restauro_intencional", detalhe });
}

/** Consome a marca de restauro; true se houver uma marca recente. */
export function consumirRestauroIntencional(agora: number = Date.now()): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.sessionStorage.getItem(RESTAURO_FLAG_KEY);
    if (!raw) return false;
    window.sessionStorage.removeItem(RESTAURO_FLAG_KEY);
    return agora - Number(raw) <= RESTAURO_JANELA_MS;
  } catch {
    return false;
  }
}
