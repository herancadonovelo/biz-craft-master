/**
 * Fase 8 — Lettering para bordado.
 * Converte texto em caminhos SVG fechados (outlines dos glifos) usando
 * rasterização em canvas + marching-squares. Devolve strings "M x y L x y ... Z"
 * prontas para entrar numa camada do Bordado Studio e alimentar o motor de
 * preenchimento (satin/tatami) e o export DST/PES.
 *
 * Não depende de opentype.js: usa as fontes já disponíveis no navegador. É
 * suficiente para tipografias simples/geométricas típicas de bordado.
 */

export type LetteringOptions = {
  text: string;
  fontFamily: string;    // ex.: "Georgia, serif" ou "Impact"
  fontWeight?: string;   // ex.: "700"
  sizePx: number;        // altura alvo do texto em px (SVG)
  x: number;             // origem X (canto superior esquerdo) em coords SVG
  y: number;             // origem Y
  letterSpacingPx?: number;
  /** simplificação Ramer–Douglas–Peucker (0 = sem simplificar). */
  simplifyPx?: number;
};

/** Rasteriza o texto a 4× e devolve o buffer + dimensões. */
function rasterizeText(o: LetteringOptions): { data: Uint8ClampedArray; w: number; h: number; scale: number } {
  const scale = 4;
  const cvs = document.createElement("canvas");
  const ctx = cvs.getContext("2d")!;
  const fontPx = Math.max(8, o.sizePx * scale);
  const font = `${o.fontWeight ?? "700"} ${fontPx}px ${o.fontFamily}`;
  ctx.font = font;
  const metrics = ctx.measureText(o.text);
  const w = Math.max(2, Math.ceil(metrics.width) + fontPx);
  const h = Math.ceil(fontPx * 1.4);
  cvs.width = w; cvs.height = h;
  const ctx2 = cvs.getContext("2d")!;
  ctx2.font = font;
  ctx2.fillStyle = "#000";
  ctx2.textBaseline = "alphabetic";
  if (o.letterSpacingPx) (ctx2 as unknown as { letterSpacing?: string }).letterSpacing = `${o.letterSpacingPx * scale}px`;
  ctx2.fillText(o.text, fontPx / 2, h - fontPx * 0.25);
  const { data } = ctx2.getImageData(0, 0, w, h);
  return { data, w, h, scale };
}

/** Marching-squares simples: devolve polígonos fechados de cada contorno. */
function marchingSquares(mask: Uint8Array, w: number, h: number): number[][][] {
  // Constrói arestas entre células vizinhas (0/1) e reconstrói ciclos.
  type Edge = { a: number; b: number };
  const key = (x: number, y: number) => y * (w + 1) + x;
  const edges = new Map<number, number[]>();
  const addEdge = (ax: number, ay: number, bx: number, by: number) => {
    const a = key(ax, ay), b = key(bx, by);
    (edges.get(a) ?? edges.set(a, []).get(a)!).push(b);
    (edges.get(b) ?? edges.set(b, []).get(b)!).push(a);
  };
  const get = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : mask[y * w + x];
  for (let y = 0; y <= h; y++) {
    for (let x = 0; x <= w; x++) {
      const tl = get(x - 1, y - 1), tr = get(x, y - 1), bl = get(x - 1, y), br = get(x, y);
      const idx = (tl << 3) | (tr << 2) | (br << 1) | bl;
      // arestas entre pontos-médios dos lados da célula (x,y) em coords de vértice
      // Vértices do quadrado atual: TL=(x-1,y-1) TR=(x,y-1) BR=(x,y) BL=(x-1,y)
      // Pontos-médios (representados como coords fracionárias multiplicadas por 2)
      const N = (2 * x - 1) + (2 * y - 2) * (2 * w + 2); // top edge midpoint id
      const S = (2 * x - 1) + (2 * y)     * (2 * w + 2);
      const W_ = (2 * x - 2) + (2 * y - 1) * (2 * w + 2);
      const E = (2 * x)     + (2 * y - 1) * (2 * w + 2);
      const connect = (a: number, b: number) => {
        (edges.get(a) ?? edges.set(a, []).get(a)!).push(b);
        (edges.get(b) ?? edges.set(b, []).get(b)!).push(a);
      };
      switch (idx) {
        case 0: case 15: break;
        case 1: case 14: connect(W_, S); break;
        case 2: case 13: connect(E, S); break;
        case 3: case 12: connect(W_, E); break;
        case 4: case 11: connect(N, E); break;
        case 5:          connect(W_, N); connect(E, S); break;
        case 6: case 9:  connect(N, S); break;
        case 7: case 8:  connect(W_, N); break;
        case 10:         connect(N, E); connect(W_, S); break;
      }
    }
  }
  // Reconstrói ciclos a partir do grafo
  const idToXY = (id: number): [number, number] => {
    const stride = 2 * w + 2;
    const yy = Math.floor(id / stride);
    const xx = id - yy * stride;
    return [xx / 2, yy / 2];
  };
  const visited = new Set<string>();
  const polys: number[][][] = [];
  for (const [start, nbrs] of edges) {
    for (const first of nbrs) {
      const e0 = `${Math.min(start, first)}:${Math.max(start, first)}`;
      if (visited.has(e0)) continue;
      const poly: number[][] = [];
      let prev = start, cur = first;
      poly.push(idToXY(prev));
      let guard = 0;
      while (guard++ < 200000) {
        visited.add(`${Math.min(prev, cur)}:${Math.max(prev, cur)}`);
        poly.push(idToXY(cur));
        const opts = (edges.get(cur) ?? []).filter((n) => n !== prev);
        if (opts.length === 0) break;
        const next = opts[0];
        prev = cur; cur = next;
        if (cur === start) { poly.push(idToXY(cur)); break; }
      }
      if (poly.length >= 4) polys.push(poly);
    }
  }
  return polys;
}

/** RDP simplification. */
function rdp(pts: number[][], eps: number): number[][] {
  if (pts.length < 3 || eps <= 0) return pts;
  const [x1, y1] = pts[0], [x2, y2] = pts[pts.length - 1];
  let maxD = 0, idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i];
    const dx = x2 - x1, dy = y2 - y1;
    const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy || 1);
    const px = x1 + t * dx, py = y1 + t * dy;
    const d = Math.hypot(x - px, y - py);
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD > eps) {
    const l = rdp(pts.slice(0, idx + 1), eps);
    const r = rdp(pts.slice(idx), eps);
    return l.slice(0, -1).concat(r);
  }
  return [pts[0], pts[pts.length - 1]];
}

export function textToPaths(o: LetteringOptions): string[] {
  if (!o.text.trim()) return [];
  const { data, w, h, scale } = rasterizeText(o);
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) mask[i] = data[i * 4 + 3] > 40 ? 1 : 0;
  const polys = marchingSquares(mask, w, h);
  const eps = (o.simplifyPx ?? 0.6) * scale;
  const out: string[] = [];
  for (const poly of polys) {
    const simp = rdp(poly, eps);
    if (simp.length < 3) continue;
    const parts = simp.map(([x, y]) => {
      const sx = o.x + x / scale;
      const sy = o.y + y / scale;
      return `${sx.toFixed(2)} ${sy.toFixed(2)}`;
    });
    out.push(`M ${parts[0]} ${parts.slice(1).map((p) => `L ${p}`).join(" ")} Z`);
  }
  return out;
}

/** Presets de tipografia com bom perfil para bordado (geométricas/serifadas cheias). */
export const LETTERING_FONTS: { id: string; label: string; family: string; weight: string }[] = [
  { id: "geom",    label: "Geométrica (sans)",  family: "Arial, Helvetica, sans-serif",  weight: "700" },
  { id: "serif",   label: "Serifada clássica",  family: "Georgia, 'Times New Roman', serif", weight: "700" },
  { id: "condens", label: "Condensada bold",    family: "'Arial Narrow', Impact, sans-serif", weight: "700" },
  { id: "mono",    label: "Monoespaçada",       family: "'Courier New', monospace",       weight: "700" },
  { id: "cursiva", label: "Cursiva script",     family: "'Brush Script MT', 'Segoe Script', cursive", weight: "400" },
];

/* -------- Motifs library (Fase 8) -------- */

export type MotifId = "heart" | "star5" | "flower6" | "leaf" | "circle" | "square" | "hexagon";

export function motifPath(id: MotifId, cx: number, cy: number, sizePx: number): string {
  const r = sizePx / 2;
  const pt = (x: number, y: number) => `${x.toFixed(2)} ${y.toFixed(2)}`;
  switch (id) {
    case "circle": {
      const N = 36; const parts: string[] = [];
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        parts.push(pt(cx + r * Math.cos(a), cy + r * Math.sin(a)));
      }
      return `M ${parts[0]} ${parts.slice(1).map((p) => `L ${p}`).join(" ")} Z`;
    }
    case "square":
      return `M ${pt(cx - r, cy - r)} L ${pt(cx + r, cy - r)} L ${pt(cx + r, cy + r)} L ${pt(cx - r, cy + r)} Z`;
    case "hexagon": {
      const parts: string[] = [];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        parts.push(pt(cx + r * Math.cos(a), cy + r * Math.sin(a)));
      }
      return `M ${parts[0]} ${parts.slice(1).map((p) => `L ${p}`).join(" ")} Z`;
    }
    case "star5": {
      const parts: string[] = [];
      for (let i = 0; i < 10; i++) {
        const rr = i % 2 === 0 ? r : r * 0.5;
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        parts.push(pt(cx + rr * Math.cos(a), cy + rr * Math.sin(a)));
      }
      return `M ${parts[0]} ${parts.slice(1).map((p) => `L ${p}`).join(" ")} Z`;
    }
    case "flower6": {
      const petals = 6; const parts: string[] = [];
      const N = 60;
      for (let i = 0; i < N; i++) {
        const t = (i / N) * Math.PI * 2;
        const rr = r * (0.55 + 0.45 * Math.abs(Math.cos(petals * t / 2)));
        parts.push(pt(cx + rr * Math.cos(t), cy + rr * Math.sin(t)));
      }
      return `M ${parts[0]} ${parts.slice(1).map((p) => `L ${p}`).join(" ")} Z`;
    }
    case "leaf": {
      const parts: string[] = [];
      const N = 60;
      for (let i = 0; i < N; i++) {
        const t = (i / N) * Math.PI * 2;
        const rr = r * Math.max(0.05, Math.sin(t) * Math.sin(t / 2 + 0.4));
        parts.push(pt(cx + rr * Math.cos(t + Math.PI / 2), cy + rr * Math.sin(t + Math.PI / 2)));
      }
      return `M ${parts[0]} ${parts.slice(1).map((p) => `L ${p}`).join(" ")} Z`;
    }
    case "heart": {
      const parts: string[] = [];
      const N = 80;
      for (let i = 0; i < N; i++) {
        const t = (i / N) * Math.PI * 2;
        const xh = 16 * Math.pow(Math.sin(t), 3);
        const yh = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        parts.push(pt(cx + (r / 16) * xh, cy - (r / 16) * yh));
      }
      return `M ${parts[0]} ${parts.slice(1).map((p) => `L ${p}`).join(" ")} Z`;
    }
  }
}

export const MOTIF_PRESETS: { id: MotifId; label: string }[] = [
  { id: "heart",   label: "Coração" },
  { id: "star5",   label: "Estrela 5 pontas" },
  { id: "flower6", label: "Flor 6 pétalas" },
  { id: "leaf",    label: "Folha" },
  { id: "circle",  label: "Círculo" },
  { id: "square",  label: "Quadrado" },
  { id: "hexagon", label: "Hexágono" },
];

/* -------- Appliqué (Fase 8) --------
 * Gera três passes canónicos para cada contorno fechado da camada activa:
 *   1) Placement — corrida fina (marca onde recortar o tecido)
 *   2) Tackdown  — corrida ligeira (fixa o tecido antes da cobertura)
 *   3) Cover     — satin ao longo do contorno (cobre o rebordo)
 * As três passagens são adicionadas em camadas separadas com stitch adequado.
 */
export type AppliqueLayerSpec = {
  nome: string;
  color: string;
  width: number;
  stitch: "running" | "backstitch" | "satin";
  strokes: string[];
};

export function buildAppliqueLayers(
  closedPaths: string[],
  coverColor: string,
  coverWidthPx = 3.5,
): AppliqueLayerSpec[] {
  if (closedPaths.length === 0) return [];
  return [
    { nome: "Aplique — Colocar",  color: "#f97316", width: 0.8, stitch: "running",    strokes: closedPaths.slice() },
    { nome: "Aplique — Fixar",    color: "#0ea5e9", width: 1.0, stitch: "running",    strokes: closedPaths.slice() },
    { nome: "Aplique — Cobrir",   color: coverColor, width: coverWidthPx, stitch: "satin", strokes: closedPaths.slice() },
  ];
}
