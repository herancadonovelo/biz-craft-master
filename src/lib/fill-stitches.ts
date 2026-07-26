/**
 * Fase 7 do Estúdio de Bordado — geração de pontos de preenchimento (fill),
 * underlay e compensação de puxão. Recebe caminhos fechados SVG e devolve
 * novos paths compostos por linhas de ponto satin ou tatami, prontos a
 * juntar às camadas do editor e a converter em pontos DST/PES.
 *
 * Simplificações pragmáticas:
 *  - Polígonos vindos de sub-paths "M x y L x y ... Z" são flattened
 *    (sem curvas Bézier — o resto do editor já vetoriza tudo em segmentos).
 *  - Scanlines por ângulo arbitrário; interseção via rotação do polígono e
 *    varrimento eixo-Y.
 *  - Testes de contenção via regra even-odd.
 */

import { splitSubpaths } from "./dst";

export type Pt = { x: number; y: number };
export type FillMode = "satin" | "tatami";
export type FillOptions = {
  mode: FillMode;
  angleDeg: number;
  /** Espaçamento entre linhas paralelas em px (densidade). */
  spacingPx: number;
  /** Tamanho de cada ponto ao longo da linha (tatami). */
  stitchPx: number;
  /** Deslocamento em fase entre linhas adjacentes (0-1) — só tatami. */
  stagger: number;
  /** Compensação de puxão perpendicular à linha (px). */
  pullCompensationPx: number;
  /** Underlay: 0 = nenhum, 1 = contorno (inset), 2 = zig-zag central. */
  underlay: 0 | 1 | 2;
  /** Distância do inset do underlay (px). */
  underlayInsetPx: number;
};

const DEG = Math.PI / 180;

function rotate(p: Pt, ang: number): Pt {
  const c = Math.cos(ang), s = Math.sin(ang);
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c };
}

/** Extrai polígonos fechados de um path SVG (só sub-paths terminados em Z). */
export function polygonsFromPath(d: string): Pt[][] {
  // splitSubpaths já ignora M/L; para deteção de fecho olhamos ao "Z" no d.
  const parts = d.split(/(?=M)/g);
  const out: Pt[][] = [];
  for (const part of parts) {
    if (!/z/i.test(part)) continue;
    const subs = splitSubpaths(part);
    for (const s of subs) if (s.length >= 3) out.push(s);
  }
  return out;
}

/** Determina o Y no ponto x=X de um segmento p1→p2 (ou null se não cruza). */
function segCrossY(p1: Pt, p2: Pt, X: number): number | null {
  if ((p1.x <= X && p2.x > X) || (p2.x <= X && p1.x > X)) {
    const t = (X - p1.x) / (p2.x - p1.x);
    return p1.y + t * (p2.y - p1.y);
  }
  return null;
}

/** Interseções de uma reta vertical x=X com o polígono, ordenadas por Y. */
function verticalCrossings(poly: Pt[], X: number): number[] {
  const ys: number[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const y = segCrossY(a, b, X);
    if (y !== null) ys.push(y);
  }
  return ys.sort((a, b) => a - b);
}

/** Aplica um inset de `d` ao polígono (positivo = para dentro em CCW). */
function insetPolygon(poly: Pt[], d: number): Pt[] {
  if (poly.length < 3) return poly;
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const prev = poly[(i - 1 + poly.length) % poly.length];
    const cur = poly[i];
    const next = poly[(i + 1) % poly.length];
    const n1 = { x: cur.y - prev.y, y: prev.x - cur.x };
    const n2 = { x: next.y - cur.y, y: cur.x - next.x };
    const l1 = Math.hypot(n1.x, n1.y) || 1;
    const l2 = Math.hypot(n2.x, n2.y) || 1;
    const nx = (n1.x / l1 + n2.x / l2) / 2;
    const ny = (n1.y / l1 + n2.y / l2) / 2;
    const nl = Math.hypot(nx, ny) || 1;
    out.push({ x: cur.x - (nx / nl) * d, y: cur.y - (ny / nl) * d });
  }
  return out;
}

/** Divide um segmento reto em pontos igualmente espaçados de `stepPx`. */
function walkSegment(a: Pt, b: Pt, stepPx: number, phase = 0): Pt[] {
  const L = Math.hypot(b.x - a.x, b.y - a.y);
  if (L < stepPx * 0.5) return [a, b];
  const out: Pt[] = [];
  const start = (phase % 1) * stepPx;
  for (let t = start; t <= L; t += stepPx) {
    out.push({ x: a.x + ((b.x - a.x) * t) / L, y: a.y + ((b.y - a.y) * t) / L });
  }
  if (out.length === 0 || Math.hypot(out[out.length - 1].x - b.x, out[out.length - 1].y - b.y) > stepPx * 0.25) {
    out.push(b);
  }
  return out;
}

/** Constrói um SVG path a partir de uma sequência de segmentos. */
function segsToPath(segs: Pt[][]): string {
  return segs
    .filter((s) => s.length >= 2)
    .map((s) => "M " + s.map((p, i) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}${i === 0 ? "" : ""}`).join(" L "))
    .join(" ");
}

/** Gera pontos de fill (satin ou tatami) para um polígono já compensado. */
function fillPolygon(poly: Pt[], opts: FillOptions): Pt[][] {
  const ang = -opts.angleDeg * DEG; // rotacionamos para o eixo do fill ficar horizontal
  const rot = poly.map((p) => rotate(p, ang));
  let minX = Infinity, maxX = -Infinity;
  for (const p of rot) { if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x; }
  const spacing = Math.max(0.5, opts.spacingPx);
  const step = Math.max(0.5, opts.stitchPx);
  const stripes: Pt[][] = [];
  let idx = 0;
  for (let X = minX + spacing / 2; X <= maxX; X += spacing) {
    const ys = verticalCrossings(rot, X);
    // Pares de interseções são segmentos "dentro" do polígono
    for (let i = 0; i + 1 < ys.length; i += 2) {
      const a = { x: X, y: ys[i] }, b = { x: X, y: ys[i + 1] };
      // Volta ao espaço original
      const A = rotate(a, -ang), B = rotate(b, -ang);
      // Direção "zig-zag": alterna orientação para minimizar salto entre linhas
      const dir = idx % 2 === 0;
      const seg = dir ? [A, B] : [B, A];
      if (opts.mode === "tatami") {
        stripes.push(walkSegment(seg[0], seg[1], step, idx * opts.stagger));
      } else {
        stripes.push(seg);
      }
    }
    idx++;
  }
  return stripes;
}

/** Gera underlay (inset ou zig-zag central) para o polígono. */
function underlayFor(poly: Pt[], opts: FillOptions): Pt[][] {
  if (opts.underlay === 0) return [];
  const inset = insetPolygon(poly, opts.underlayInsetPx);
  if (opts.underlay === 1) {
    // contorno (running stitch ao longo do inset)
    const closed = [...inset, inset[0]];
    return [walkSegment.length ? closed.reduce<Pt[]>((acc, p, i) => {
      if (i === 0) return [p];
      const prev = acc[acc.length - 1];
      const seg = walkSegment(prev, p, opts.stitchPx);
      seg.shift(); // evita duplicado
      return acc.concat(seg);
    }, []) : closed];
  }
  // zig-zag central: usa fill com espaçamento largo (spacing × 3)
  return fillPolygon(inset, { ...opts, mode: "satin", spacingPx: opts.spacingPx * 3, underlay: 0 });
}

/**
 * Aplica fill a todos os polígonos de um path SVG. Devolve um novo `d`
 * contendo underlay + fill pronto a inserir como stroke da camada.
 */
export function generateFill(pathD: string, opts: FillOptions): string {
  const polys = polygonsFromPath(pathD);
  if (polys.length === 0) return "";
  const all: Pt[][] = [];
  for (const poly of polys) {
    // Compensação de puxão: expandir ligeiramente (inset negativo)
    const comp = opts.pullCompensationPx !== 0
      ? insetPolygon(poly, -opts.pullCompensationPx)
      : poly;
    all.push(...underlayFor(comp, opts));
    all.push(...fillPolygon(comp, opts));
  }
  return segsToPath(all);
}

/** Estima quantos pontos vai produzir o fill (útil para preview). */
export function estimateFillStitches(pathD: string, opts: FillOptions): number {
  const d = generateFill(pathD, opts);
  if (!d) return 0;
  const subs = splitSubpaths(d);
  let n = 0;
  for (const s of subs) n += Math.max(0, s.length - 1);
  return n;
}