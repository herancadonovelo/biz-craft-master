/**
 * Fase 18 — Calibração de escala, estimador de linha (comprimento + custo)
 * e consumo automático de inventário.
 *
 * Utilitários puros e client-safe. Não importa React nem o store; a
 * integração com `useStore` é feita no painel para manter este módulo
 * facilmente testável.
 */

export interface ScaleCalibration {
  /** milímetros representados por 1 pixel do canvas. */
  mmPerPx: number;
  /** largura alvo do bastidor, em mm (ex. 100, 130, 180). */
  hoopWidthMm?: number;
  /** altura alvo do bastidor, em mm. */
  hoopHeightMm?: number;
  /** DPI usado ao importar SVG (fallback 96). */
  svgDpi?: number;
}

export const DEFAULT_CALIBRATION: ScaleCalibration = {
  mmPerPx: 0.2645833, // 96 DPI
  hoopWidthMm: 100,
  hoopHeightMm: 100,
  svgDpi: 96,
};

/** Calibra a partir de uma medição conhecida no canvas (px → mm reais). */
export function calibrateFromMeasurement(pxMeasured: number, mmReal: number): number {
  if (!pxMeasured || pxMeasured <= 0 || mmReal <= 0) return DEFAULT_CALIBRATION.mmPerPx;
  return mmReal / pxMeasured;
}

export function pxToMm(px: number, cal: ScaleCalibration): number {
  return px * cal.mmPerPx;
}

export function mmToPx(mm: number, cal: ScaleCalibration): number {
  return cal.mmPerPx > 0 ? mm / cal.mmPerPx : 0;
}

/** Ajusta o DPI usado ao importar SVG e devolve mmPerPx recalculado. */
export function mmPerPxFromDpi(dpi: number): number {
  return dpi > 0 ? 25.4 / dpi : DEFAULT_CALIBRATION.mmPerPx;
}

// ─── Estimador de linha ──────────────────────────────────────────────

export interface StitchLite {
  x: number;
  y: number;
  color: string;
  jump?: boolean;
}

export interface BlockLite {
  color: string;
  stitches: StitchLite[];
}

/** Densidade padrão: linha real puxada ≈ 1.15x o comprimento do ponto,
 *  configurável por utilizador. */
export interface ThreadEstimateOptions {
  /** Multiplicador de puxa (typical 1.10–1.25). */
  pullFactor: number;
  /** Fios (strands) usados por ponto — 2 é o padrão para bordado à mão. */
  strands: number;
  /** Reserva percentual para nós/rematamento (0.05 = 5%). */
  waste: number;
  /** Ignorar jumps na soma (recomendado). */
  ignoreJumps: boolean;
}

export const DEFAULT_THREAD_OPTS: ThreadEstimateOptions = {
  pullFactor: 1.15,
  strands: 2,
  waste: 0.08,
  ignoreJumps: true,
};

export interface ThreadEstimate {
  color: string;
  lengthMm: number;
  stitches: number;
  strands: number;
}

/** Estima o consumo de linha (mm) por cor considerando `mmPerPx`,
 *  puxa, fios e desperdício. */
export function estimateThread(
  blocks: BlockLite[],
  cal: ScaleCalibration,
  opts: Partial<ThreadEstimateOptions> = {},
): ThreadEstimate[] {
  const o = { ...DEFAULT_THREAD_OPTS, ...opts };
  return blocks.map((b) => {
    let mm = 0;
    let count = 0;
    for (let i = 1; i < b.stitches.length; i++) {
      const p = b.stitches[i - 1];
      const c = b.stitches[i];
      if (o.ignoreJumps && (p.jump || c.jump)) continue;
      const dx = c.x - p.x;
      const dy = c.y - p.y;
      mm += Math.hypot(dx, dy) * cal.mmPerPx;
      count++;
    }
    const total = mm * o.pullFactor * o.strands * (1 + o.waste);
    return { color: b.color, lengthMm: total, stitches: count, strands: o.strands };
  });
}

/** Converte para novelos/meadas, sabendo mm por unidade (ex: 8000mm/meada DMC). */
export function toSkeins(lengthMm: number, mmPerSkein: number): number {
  if (mmPerSkein <= 0) return 0;
  return lengthMm / mmPerSkein;
}

// ─── Custo & inventário ──────────────────────────────────────────────

export interface MaterialLite {
  id: string;
  nome: string;
  unidade: string;      // "m", "meada", "novelo", "g"
  stock: number;
  precoCompra: number;   // por unidade
  marca?: string;
  codigoCor?: string;
}

export interface ConsumptionRow {
  color: string;
  lengthMm: number;
  material?: MaterialLite;
  units: number;         // quantidade a consumir na unidade do material
  cost: number;          // €
  matched: boolean;
}

/** Regras simples de conversão para as unidades mais comuns. */
export function unitsForMaterial(lengthMm: number, unidade: string): number {
  switch (unidade.toLowerCase()) {
    case "m":       return lengthMm / 1000;
    case "cm":      return lengthMm / 10;
    case "meada":   return lengthMm / 8000;   // ≈ DMC 8m
    case "novelo":  return lengthMm / 100_000; // ≈ 100m/novelo
    case "g":       return lengthMm / 1000;   // fallback 1g ≈ 1m
    default:        return lengthMm / 1000;
  }
}

/** Faz o match por (marca+códigoCor) e depois por hex no nome. */
export function matchMaterial(hex: string, mats: MaterialLite[]): MaterialLite | undefined {
  const h = hex.replace("#", "").toLowerCase();
  return (
    mats.find((m) => (m.codigoCor || "").toLowerCase() === h) ||
    mats.find((m) => (m.nome || "").toLowerCase().includes(h))
  );
}

export function buildConsumption(
  estimates: ThreadEstimate[],
  materials: MaterialLite[],
): ConsumptionRow[] {
  return estimates.map((e) => {
    const mat = matchMaterial(e.color, materials);
    const units = mat ? unitsForMaterial(e.lengthMm, mat.unidade) : 0;
    const cost = mat ? units * mat.precoCompra : 0;
    return {
      color: e.color,
      lengthMm: e.lengthMm,
      material: mat,
      units,
      cost,
      matched: !!mat,
    };
  });
}

export function totalCost(rows: ConsumptionRow[]): number {
  return rows.reduce((s, r) => s + r.cost, 0);
}

// ─── Persistência ───────────────────────────────────────────────────

const CAL_KEY = "embroidery-phase18-cal";
const OPT_KEY = "embroidery-phase18-opts";

export function loadCalibration(projectId?: string): ScaleCalibration {
  if (typeof window === "undefined") return DEFAULT_CALIBRATION;
  try {
    const key = projectId ? `${CAL_KEY}:${projectId}` : CAL_KEY;
    const raw = window.localStorage.getItem(key);
    return raw ? { ...DEFAULT_CALIBRATION, ...JSON.parse(raw) } : DEFAULT_CALIBRATION;
  } catch { return DEFAULT_CALIBRATION; }
}

export function saveCalibration(cal: ScaleCalibration, projectId?: string) {
  if (typeof window === "undefined") return;
  try {
    const key = projectId ? `${CAL_KEY}:${projectId}` : CAL_KEY;
    window.localStorage.setItem(key, JSON.stringify(cal));
  } catch { /* ignore */ }
}

export function loadThreadOpts(projectId?: string): ThreadEstimateOptions {
  if (typeof window === "undefined") return DEFAULT_THREAD_OPTS;
  try {
    const key = projectId ? `${OPT_KEY}:${projectId}` : OPT_KEY;
    const raw = window.localStorage.getItem(key);
    return raw ? { ...DEFAULT_THREAD_OPTS, ...JSON.parse(raw) } : DEFAULT_THREAD_OPTS;
  } catch { return DEFAULT_THREAD_OPTS; }
}

export function saveThreadOpts(opts: ThreadEstimateOptions, projectId?: string) {
  if (typeof window === "undefined") return;
  try {
    const key = projectId ? `${OPT_KEY}:${projectId}` : OPT_KEY;
    window.localStorage.setItem(key, JSON.stringify(opts));
  } catch { /* ignore */ }
}
