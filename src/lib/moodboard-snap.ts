/**
 * Guias magnéticas (snapping) para o canvas infinito do editor de moodboards.
 * Trabalha em coordenadas do artboard (px do documento), não do ecrã.
 */
export type Rect = { x: number; y: number; w: number; h: number };
export type SnapTargets = { v: number[]; h: number[] };

/** Linhas de referência: bordas/centros dos outros elementos + bordas/centro da folha. */
export function buildTargets(
  outros: Rect[],
  largura: number,
  altura: number,
): SnapTargets {
  const v = [0, largura / 2, largura];
  const h = [0, altura / 2, altura];
  for (const r of outros) {
    v.push(r.x, r.x + r.w / 2, r.x + r.w);
    h.push(r.y, r.y + r.h / 2, r.y + r.h);
  }
  return { v, h };
}

function nearest(value: number, cands: number[], tol: number) {
  let best: number | null = null;
  let bestD = tol;
  for (const c of cands) {
    const d = Math.abs(c - value);
    if (d <= bestD) { bestD = d; best = c; }
  }
  return best;
}

/**
 * Ajusta a posição de um retângulo às guias mais próximas.
 * Devolve a nova posição e as linhas que ficaram ativas (para desenhar).
 */
export function snapRect(
  rect: Rect,
  targets: SnapTargets,
  tol: number,
  grelha = 0,
): { x: number; y: number; guiasV: number[]; guiasH: number[] } {
  let { x, y } = rect;
  const guiasV: number[] = [];
  const guiasH: number[] = [];

  const edgesX: Array<[number, number]> = [[x, 0], [x + rect.w / 2, rect.w / 2], [x + rect.w, rect.w]];
  let bestX: { pos: number; line: number; d: number } | null = null;
  for (const [val, off] of edgesX) {
    const m = nearest(val, targets.v, tol);
    if (m === null) continue;
    const d = Math.abs(m - val);
    if (!bestX || d < bestX.d) bestX = { pos: m - off, line: m, d };
  }
  if (bestX) { x = bestX.pos; guiasV.push(bestX.line); }

  const edgesY: Array<[number, number]> = [[y, 0], [y + rect.h / 2, rect.h / 2], [y + rect.h, rect.h]];
  let bestY: { pos: number; line: number; d: number } | null = null;
  for (const [val, off] of edgesY) {
    const m = nearest(val, targets.h, tol);
    if (m === null) continue;
    const d = Math.abs(m - val);
    if (!bestY || d < bestY.d) bestY = { pos: m - off, line: m, d };
  }
  if (bestY) { y = bestY.pos; guiasH.push(bestY.line); }

  if (grelha > 0) {
    if (!bestX) x = Math.round(x / grelha) * grelha;
    if (!bestY) y = Math.round(y / grelha) * grelha;
  }
  return { x, y, guiasV, guiasH };
}

export const MIN_ZOOM = 0.01;   // 1%
export const MAX_ZOOM = 40;     // 4000%
export const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

/** Normaliza o delta da roda (Firefox reporta linhas/páginas). */
export function normalizeWheel(deltaY: number, deltaMode: number) {
  return deltaY * (deltaMode === 1 ? 16 : deltaMode === 2 ? 100 : 1);
}
