/**
 * Fase 13 — Análise de qualidade e mapa de densidade de pontos.
 * Gera uma grelha de contagem de pontos por célula e detecta problemas
 * comuns em digitalização de bordado (densidade alta, saltos longos,
 * pontos muito curtos, muitas trocas de cor).
 */
import type { StitchBlock } from "./dst";

export type DensityGrid = {
  cell: number; cols: number; rows: number;
  x0: number; y0: number; max: number; data: number[];
};

export function buildDensityGrid(
  blocks: StitchBlock[],
  bounds: { x0: number; y0: number; w: number; h: number },
  cellPx: number,
): DensityGrid {
  const cols = Math.max(1, Math.ceil(bounds.w / cellPx));
  const rows = Math.max(1, Math.ceil(bounds.h / cellPx));
  const data = new Array<number>(cols * rows).fill(0);
  let max = 0;
  for (const b of blocks) {
    for (const p of b.points) {
      const gx = Math.floor((p.x - bounds.x0) / cellPx);
      const gy = Math.floor((p.y - bounds.y0) / cellPx);
      if (gx < 0 || gy < 0 || gx >= cols || gy >= rows) continue;
      const i = gy * cols + gx;
      data[i]++; if (data[i] > max) max = data[i];
    }
  }
  return { cell: cellPx, cols, rows, x0: bounds.x0, y0: bounds.y0, max, data };
}

export type QualityReport = {
  totalPoints: number;
  jumps: { count: number; longestMm: number; totalMm: number };
  shortStitches: number;
  longStitches: number;
  colorChanges: number;
  densityHotspots: number;
  warnings: string[];
};

export function analyzeQuality(
  blocks: StitchBlock[],
  pxPerMm: number,
  opts: { minMm?: number; maxMm?: number; hotspotThreshold?: number; grid?: DensityGrid } = {},
): QualityReport {
  const minMm = opts.minMm ?? 0.5;
  const maxMm = opts.maxMm ?? 12;
  const hotspot = opts.hotspotThreshold ?? 25;
  let short = 0, long = 0, total = 0;
  const jumps = { count: Math.max(0, blocks.length - 1), longestMm: 0, totalMm: 0 };
  for (const b of blocks) {
    total += b.points.length;
    for (let i = 1; i < b.points.length; i++) {
      const d = Math.hypot(b.points[i].x - b.points[i - 1].x, b.points[i].y - b.points[i - 1].y) / pxPerMm;
      if (d < minMm) short++; else if (d > maxMm) long++;
    }
  }
  // saltos entre blocos
  for (let i = 1; i < blocks.length; i++) {
    const a = blocks[i - 1].points[blocks[i - 1].points.length - 1];
    const c = blocks[i].points[0];
    if (!a || !c) continue;
    const d = Math.hypot(c.x - a.x, c.y - a.y) / pxPerMm;
    jumps.totalMm += d;
    if (d > jumps.longestMm) jumps.longestMm = d;
  }
  const hot = opts.grid ? opts.grid.data.filter((v) => v >= hotspot).length : 0;
  const warnings: string[] = [];
  if (short > total * 0.05) warnings.push(`Muitos pontos curtos (${short}). Pode causar acumulação de linha.`);
  if (long > 0) warnings.push(`${long} ponto(s) acima de ${maxMm} mm — máquinas podem partir a agulha.`);
  if (jumps.longestMm > 30) warnings.push(`Salto máximo de ${jumps.longestMm.toFixed(1)} mm — considera trim manual.`);
  if (hot > 0) warnings.push(`${hot} zona(s) de densidade alta — risco de franzimento (puckering).`);
  if (blocks.length > 15) warnings.push(`${blocks.length} blocos de cor — sequência muito trocada; reordena para reduzir agulhas.`);
  return { totalPoints: total, jumps, shortStitches: short, longStitches: long,
           colorChanges: Math.max(0, blocks.length - 1), densityHotspots: hot, warnings };
}

/** Devolve uma cor HSL do azul (frio) ao vermelho (quente) segundo t∈[0,1]. */
export function heatColor(t: number): string {
  const h = (1 - Math.min(1, Math.max(0, t))) * 220; // 220=azul → 0=vermelho
  return `hsl(${h.toFixed(0)}, 90%, 55%)`;
}
