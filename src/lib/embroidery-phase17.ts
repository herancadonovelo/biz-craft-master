/**
 * Fase 17 — Edição manual, undo/redo & revisão por cor.
 *
 * Módulo puro/browser com utilidades reutilizáveis:
 *   • createHistory<T>() — stack undo/redo com limite, deltas serializáveis
 *   • aida cell editing — pintar / apagar / trocar cor em grelhas 2D
 *   • anchor drag — mover âncora e re-suavizar polilinha (Catmull-Rom-ish)
 *   • shortcut map + tutorial steps (dados, UI vive no Panel)
 *   • colorReviewMask — devolve blocos filtrados por cor + score
 */

// ----------------------------------------------------------------------
// Undo/Redo
// ----------------------------------------------------------------------
export interface History<T> {
  present: T;
  past: T[];
  future: T[];
  limit: number;
}

export function createHistory<T>(initial: T, limit = 100): History<T> {
  return { present: initial, past: [], future: [], limit };
}

export function pushHistory<T>(h: History<T>, next: T): History<T> {
  const past = [...h.past, h.present];
  while (past.length > h.limit) past.shift();
  return { present: next, past, future: [], limit: h.limit };
}

export function undo<T>(h: History<T>): History<T> {
  if (h.past.length === 0) return h;
  const prev = h.past[h.past.length - 1];
  return {
    present: prev,
    past: h.past.slice(0, -1),
    future: [h.present, ...h.future],
    limit: h.limit,
  };
}

export function redo<T>(h: History<T>): History<T> {
  if (h.future.length === 0) return h;
  const [next, ...rest] = h.future;
  return { present: next, past: [...h.past, h.present], future: rest, limit: h.limit };
}

export const canUndo = <T,>(h: History<T>) => h.past.length > 0;
export const canRedo = <T,>(h: History<T>) => h.future.length > 0;

// ----------------------------------------------------------------------
// Aida cell editing (grelha 2D de índices de cor, -1 = vazia)
// ----------------------------------------------------------------------
export type AidaGrid = number[][]; // rows[y][x]

export function paintCell(grid: AidaGrid, x: number, y: number, colorIndex: number): AidaGrid {
  if (y < 0 || y >= grid.length || x < 0 || x >= (grid[0]?.length ?? 0)) return grid;
  if (grid[y][x] === colorIndex) return grid;
  const copy = grid.map((r) => r.slice());
  copy[y][x] = colorIndex;
  return copy;
}

export function eraseCell(grid: AidaGrid, x: number, y: number): AidaGrid {
  return paintCell(grid, x, y, -1);
}

/** Substitui todas as células da cor `from` por `to` (útil para trocas em lote). */
export function swapColor(grid: AidaGrid, from: number, to: number): AidaGrid {
  return grid.map((row) => row.map((c) => (c === from ? to : c)));
}

/** Preenchimento por flood-fill 4-conexo. */
export function floodFill(grid: AidaGrid, x: number, y: number, colorIndex: number): AidaGrid {
  const h = grid.length; const w = grid[0]?.length ?? 0;
  if (y < 0 || y >= h || x < 0 || x >= w) return grid;
  const target = grid[y][x];
  if (target === colorIndex) return grid;
  const out = grid.map((r) => r.slice());
  const stack: Array<[number, number]> = [[x, y]];
  while (stack.length) {
    const [cx, cy] = stack.pop()!;
    if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue;
    if (out[cy][cx] !== target) continue;
    out[cy][cx] = colorIndex;
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
  return out;
}

// ----------------------------------------------------------------------
// Anchor drag on polyline
// ----------------------------------------------------------------------
export interface P2 { x: number; y: number }

export function moveAnchor(points: P2[], idx: number, to: P2): P2[] {
  if (idx < 0 || idx >= points.length) return points;
  const copy = points.slice();
  copy[idx] = { ...to };
  return copy;
}

/** Suavização Chaikin (1 iteração) — resample para re-preenchimento após edição. */
export function chaikinOnce(points: P2[], keepEnds = true): P2[] {
  if (points.length < 3) return points.slice();
  const out: P2[] = [];
  if (keepEnds) out.push(points[0]);
  for (let i = 0; i < points.length - 1; i++) {
    const p = points[i], q = points[i + 1];
    out.push({ x: p.x * 0.75 + q.x * 0.25, y: p.y * 0.75 + q.y * 0.25 });
    out.push({ x: p.x * 0.25 + q.x * 0.75, y: p.y * 0.25 + q.y * 0.75 });
  }
  if (keepEnds) out.push(points[points.length - 1]);
  return out;
}

/** Devolve índice da âncora mais próxima do ponto (px), ou -1 se distância > tol. */
export function pickAnchor(points: P2[], p: P2, tolPx = 8): number {
  let best = -1, bd = tolPx * tolPx;
  for (let i = 0; i < points.length; i++) {
    const dx = points[i].x - p.x, dy = points[i].y - p.y;
    const d = dx * dx + dy * dy;
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}

// ----------------------------------------------------------------------
// Shortcut map + tutorial
// ----------------------------------------------------------------------
export interface Shortcut { keys: string; description: string; scope?: string }

export const EMBROIDERY_SHORTCUTS: Shortcut[] = [
  { keys: "Ctrl+Z", description: "Desfazer última ação", scope: "Global" },
  { keys: "Ctrl+Shift+Z / Ctrl+Y", description: "Refazer", scope: "Global" },
  { keys: "B", description: "Ferramenta pincel (Aida)", scope: "Aida" },
  { keys: "E", description: "Borracha (limpa célula)", scope: "Aida" },
  { keys: "G", description: "Balde de tinta (flood-fill)", scope: "Aida" },
  { keys: "S", description: "Trocar cor (swap)", scope: "Aida" },
  { keys: "A", description: "Selecionar/arrastar âncora", scope: "Contorno" },
  { keys: "P", description: "Play/pausa simulador", scope: "Preview" },
  { keys: "R", description: "Modo revisão por cor", scope: "Análise" },
  { keys: "?", description: "Abrir ajuda / atalhos", scope: "Global" },
  { keys: "Esc", description: "Cancelar ação corrente", scope: "Global" },
];

export interface TutorialStep { title: string; body: string; }

export const EMBROIDERY_TUTORIAL: TutorialStep[] = [
  { title: "1 · Configura o bastidor", body: "Define largura, altura e tecido base (Aida/Linho/Algodão) no painel superior antes de desenhar." },
  { title: "2 · Desenha ou vetoriza", body: "Usa a caneta suave, importa SVG da biblioteca ou vetoriza uma foto no cartão Auto-Digitize." },
  { title: "3 · Ajusta camadas", body: "Cada cor é uma camada. Reordena, define nº de fios (2/3/6) e adiciona blending no painel de paleta." },
  { title: "4 · Escolhe o preenchimento", body: "Satim para formas estreitas, Tatami para áreas grandes. Ativa underlay e pull-comp em fios finos." },
  { title: "5 · Revê a qualidade", body: "Liga o heatmap e o modo revisão por cor (R) para detectar hotspots de densidade e pontos curtos." },
  { title: "6 · Exporta", body: "Escolhe DST (universal), PES (Brother) ou o bundle .zip com PDF de padrão e re-hoop tiling." },
];

// ----------------------------------------------------------------------
// Color review helpers
// ----------------------------------------------------------------------
export interface ColorBlockLite { color: string; points: P2[] }

/** Devolve apenas o(s) bloco(s) da cor pedida — o resto fica em cinza no render. */
export function isolateColor<T extends ColorBlockLite>(blocks: T[], hex: string): T[] {
  return blocks.filter((b) => b.color.toLowerCase() === hex.toLowerCase());
}

/** Score simples 0..100 baseado em pontos curtos/longos e nº de saltos internos. */
export function scoreColor<T extends ColorBlockLite>(blocks: T[], minLenPx = 2, maxLenPx = 80): number {
  if (blocks.length === 0) return 0;
  let total = 0, penal = 0;
  for (const b of blocks) {
    for (let i = 1; i < b.points.length; i++) {
      const dx = b.points[i].x - b.points[i - 1].x;
      const dy = b.points[i].y - b.points[i - 1].y;
      const d = Math.hypot(dx, dy);
      total++;
      if (d < minLenPx) penal += 2;
      else if (d > maxLenPx) penal += 1;
    }
  }
  const raw = total === 0 ? 0 : Math.max(0, 100 - (penal / total) * 100);
  return Math.round(raw);
}