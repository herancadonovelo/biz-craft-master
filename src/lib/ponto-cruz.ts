// Utilities for the Cross-Stitch (Ponto Cruz) editor.
// Pure functions — safe for both browser and SSR (no DOM access here).

import { getDMC, getAnchor, nearestIn, type Cor, type Marca } from "@/lib/cores-linhas";

export type StitchType = "full" | "half-tl" | "half-tr";

/** Cell of the chart. `hex` = null → empty. */
export interface Cell {
  hex: string;
  type: StitchType;
  /** Optional second thread (blended). */
  hex2?: string | null;
}

export interface BackstitchEdge {
  /** Grid vertex coordinates (0..cols, 0..rows). */
  r1: number; c1: number; r2: number; c2: number;
  hex: string;
}

export interface FrenchKnot { r: number; c: number; hex: string; }

export interface ChartDoc {
  version: 1;
  cols: number;
  rows: number;
  aidaCount: number;
  marca: Marca;
  cells: Record<string, Cell>;     // key = `${r},${c}`
  back: BackstitchEdge[];
  knots: FrenchKnot[];
  paletteMax: number;
  paletteMarca: Marca;
}

export function emptyChart(cols = 40, rows = 40): ChartDoc {
  return {
    version: 1, cols, rows, aidaCount: 14, marca: "DMC",
    cells: {}, back: [], knots: [], paletteMax: 20, paletteMarca: "DMC",
  };
}

/* ------------------------ Color helpers ------------------------ */

export function hexToRgb(h: string) {
  const v = h.replace("#", "");
  return { r: parseInt(v.slice(0, 2), 16), g: parseInt(v.slice(2, 4), 16), b: parseInt(v.slice(4, 6), 16) };
}
export function rgbToHex(r: number, g: number, b: number) {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return "#" + c(r) + c(g) + c(b);
}
export function blend(a: string, b: string) {
  const x = hexToRgb(a), y = hexToRgb(b);
  return rgbToHex((x.r + y.r) / 2, (x.g + y.g) / 2, (x.b + y.b) / 2);
}
export function dist(a: string, b: string) {
  const x = hexToRgb(a), y = hexToRgb(b);
  return Math.hypot(x.r - y.r, x.g - y.g, x.b - y.b);
}

export function paletteFor(marca: Marca): Cor[] {
  return marca === "Anchor" ? getAnchor() : getDMC();
}
export function closestThread(hex: string, marca: Marca): Cor {
  return nearestIn(paletteFor(marca), hex);
}

/* ------------------------ Image → Chart ------------------------ */

/**
 * Reduce a set of pixel colors to a palette of at most `k` items using a very
 * lightweight median-cut-like approach: bucket into 4×4×4 = 64 cubes, take the
 * top-k densest buckets and use their average color.
 */
function reducePalette(rgb: Uint8ClampedArray, k: number): string[] {
  const buckets = new Map<number, { r: number; g: number; b: number; n: number }>();
  for (let i = 0; i < rgb.length; i += 4) {
    const a = rgb[i + 3];
    if (a < 128) continue;
    const r = rgb[i], g = rgb[i + 1], b = rgb[i + 2];
    const key = ((r >> 5) << 10) | ((g >> 5) << 5) | (b >> 5);
    const cur = buckets.get(key);
    if (cur) { cur.r += r; cur.g += g; cur.b += b; cur.n += 1; }
    else buckets.set(key, { r, g, b, n: 1 });
  }
  const arr = Array.from(buckets.values()).sort((a, b) => b.n - a.n);
  const top = arr.slice(0, Math.max(1, k));
  return top.map((c) => rgbToHex(c.r / c.n, c.g / c.n, c.b / c.n));
}

export interface ConvertOptions {
  cols: number;
  rows: number;
  maxColors: number;
  marca: Marca;
}

/** Convert an ImageBitmap/HTMLImageElement into a chart. */
export function imageToChart(
  source: CanvasImageSource,
  sourceW: number,
  sourceH: number,
  opts: ConvertOptions,
): ChartDoc {
  const off = document.createElement("canvas");
  off.width = opts.cols; off.height = opts.rows;
  const ctx = off.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  // Fit source into cols×rows (contain).
  const scale = Math.min(opts.cols / sourceW, opts.rows / sourceH);
  const dw = sourceW * scale, dh = sourceH * scale;
  const dx = (opts.cols - dw) / 2, dy = (opts.rows - dh) / 2;
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, opts.cols, opts.rows);
  ctx.drawImage(source, dx, dy, dw, dh);
  const data = ctx.getImageData(0, 0, opts.cols, opts.rows).data;

  const seedHexes = reducePalette(data, opts.maxColors);
  const pal = paletteFor(opts.marca);
  // Snap each seed to the closest DMC/Anchor thread, dedupe.
  const snapped: string[] = [];
  for (const h of seedHexes) {
    const t = nearestIn(pal, h).hex.toUpperCase();
    if (!snapped.includes(t)) snapped.push(t);
    if (snapped.length >= opts.maxColors) break;
  }

  const cells: Record<string, Cell> = {};
  for (let y = 0; y < opts.rows; y++) {
    for (let x = 0; x < opts.cols; x++) {
      const i = (y * opts.cols + x) * 4;
      const a = data[i + 3];
      if (a < 128) continue;
      const px = rgbToHex(data[i], data[i + 1], data[i + 2]);
      // Skip near-white background if user imported a photo with white borders.
      if (dist(px, "#FFFFFF") < 12) continue;
      let best = snapped[0]; let bd = Infinity;
      for (const h of snapped) { const d = dist(h, px); if (d < bd) { bd = d; best = h; } }
      cells[`${y},${x}`] = { hex: best, type: "full" };
    }
  }
  return {
    version: 1, cols: opts.cols, rows: opts.rows, aidaCount: 14,
    marca: opts.marca, cells, back: [], knots: [],
    paletteMax: opts.maxColors, paletteMarca: opts.marca,
  };
}

/* ------------------------ Text → cells ------------------------ */

/** Rasterizes text into grid cells using an offscreen canvas. */
export function textToCells(
  text: string,
  opts: { font: string; sizePx: number; hex: string; startRow: number; startCol: number; maxCols: number; maxRows: number },
): Record<string, Cell> {
  const off = document.createElement("canvas");
  const ctx = off.getContext("2d")!;
  ctx.font = `${opts.sizePx}px ${opts.font}`;
  const metrics = ctx.measureText(text);
  const w = Math.max(1, Math.ceil(metrics.width));
  const h = Math.max(1, Math.ceil(opts.sizePx * 1.4));
  off.width = w; off.height = h;
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h);
  ctx.font = `${opts.sizePx}px ${opts.font}`;
  ctx.fillStyle = "#000000";
  ctx.textBaseline = "top";
  ctx.fillText(text, 0, opts.sizePx * 0.15);
  const data = ctx.getImageData(0, 0, w, h).data;
  const cells: Record<string, Cell> = {};
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (luma < 128) {
        const rr = opts.startRow + y, cc = opts.startCol + x;
        if (rr >= 0 && cc >= 0 && rr < opts.maxRows && cc < opts.maxCols) {
          cells[`${rr},${cc}`] = { hex: opts.hex, type: "full" };
        }
      }
    }
  }
  return cells;
}

/* ------------------------ Grid operations ------------------------ */

export function floodFill(
  cells: Record<string, Cell>, cols: number, rows: number,
  r0: number, c0: number, newHex: string,
): Record<string, Cell> {
  const target = cells[`${r0},${c0}`]?.hex ?? null;
  if (target === newHex) return cells;
  const out = { ...cells };
  const q: [number, number][] = [[r0, c0]];
  const seen = new Set<string>();
  while (q.length) {
    const [r, c] = q.pop()!;
    const key = `${r},${c}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (r < 0 || c < 0 || r >= rows || c >= cols) continue;
    const cur = cells[key]?.hex ?? null;
    if (cur !== target) continue;
    if (target === null) delete out[key]; // shouldn't happen when painting empties
    if (newHex) out[key] = { hex: newHex, type: cells[key]?.type ?? "full" };
    else delete out[key];
    q.push([r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]);
  }
  return out;
}

export function mirror(
  cells: Record<string, Cell>, cols: number, rows: number, axis: "h" | "v",
): Record<string, Cell> {
  const out = { ...cells };
  for (const [k, v] of Object.entries(cells)) {
    const [r, c] = k.split(",").map(Number);
    const nr = axis === "v" ? rows - 1 - r : r;
    const nc = axis === "h" ? cols - 1 - c : c;
    out[`${nr},${nc}`] = v;
  }
  return out;
}

export function replaceColor(cells: Record<string, Cell>, from: string, to: string): Record<string, Cell> {
  const out: Record<string, Cell> = {};
  for (const [k, v] of Object.entries(cells)) {
    out[k] = v.hex.toLowerCase() === from.toLowerCase()
      ? { ...v, hex: to }
      : v;
  }
  return out;
}

/* ------------------------ Analytics ------------------------ */

export interface ColorStat {
  hex: string;
  full: number;
  half: number;
  knots: number;
  backstitchLen: number; // cells (Euclidean)
  /** Approximate skeins (meadas). 1 skein ~ 795 full stitches on Aida 14 (rule of thumb). */
  meadas: number;
  dmc: Cor;
  anchor: Cor;
  symbol: string;
}

const SYMBOLS = "■▲●◆★✚✱▼◯□✦⬢✧❖✜◐◑◒◓♦♥♣♠αβγδεζηθλμπρσφψω".split("");

export function chartStats(chart: ChartDoc): ColorStat[] {
  const map = new Map<string, { full: number; half: number; knots: number; back: number }>();
  const get = (h: string) => {
    let e = map.get(h);
    if (!e) { e = { full: 0, half: 0, knots: 0, back: 0 }; map.set(h, e); }
    return e;
  };
  for (const cell of Object.values(chart.cells)) {
    const bucket = get(cell.hex);
    if (cell.type === "full") bucket.full += 1;
    else bucket.half += 1;
    if (cell.hex2) {
      const b2 = get(cell.hex2);
      if (cell.type === "full") b2.full += 1; else b2.half += 1;
    }
  }
  for (const k of chart.knots) get(k.hex).knots += 1;
  for (const b of chart.back) {
    const len = Math.hypot(b.r2 - b.r1, b.c2 - b.c1);
    get(b.hex).back += len;
  }
  const perSkein = Math.max(200, 795 * (14 / chart.aidaCount));
  const list = Array.from(map.entries()).map(([hex, s], i) => {
    const dmc = nearestIn(getDMC(), hex);
    const anchor = nearestIn(getAnchor(), hex);
    const load = s.full + s.half * 0.5 + s.knots * 1.2 + s.back * 0.8;
    return {
      hex, full: s.full, half: s.half, knots: s.knots, backstitchLen: s.back,
      meadas: Math.max(load > 0 ? 1 : 0, Math.ceil(load / perSkein)),
      dmc, anchor, symbol: SYMBOLS[i % SYMBOLS.length],
    } satisfies ColorStat;
  });
  list.sort((a, b) => (b.full + b.half) - (a.full + a.half));
  return list;
}

/** Fabric size in cm given Aida count (stitches/inch). */
export function fabricSizeCm(cols: number, rows: number, aidaCount: number) {
  const w = (cols / aidaCount) * 2.54;
  const h = (rows / aidaCount) * 2.54;
  return { w, h };
}

/* ------------------------ Import / Export ------------------------ */

export function chartToJson(chart: ChartDoc): string {
  return JSON.stringify(chart, null, 2);
}

export function jsonToChart(raw: string): ChartDoc {
  const j = JSON.parse(raw);
  if (!j || j.version !== 1 || typeof j.cols !== "number" || typeof j.rows !== "number") {
    throw new Error("Ficheiro inválido: não é um gráfico de ponto cruz.");
  }
  return { ...emptyChart(j.cols, j.rows), ...j };
}

/** Minimal OXS-like XML (Pattern Keeper compatible reader). */
export function chartToOxs(chart: ChartDoc, title = "Gráfico"): string {
  const stats = chartStats(chart);
  const palette = stats.map((s, i) => `    <palette_item index="${i + 1}" number="DMC ${s.dmc.codigo}" name="${s.dmc.nome ?? ""}" color="${s.hex.replace("#", "")}" symbol="${s.symbol}" />`).join("\n");
  const idxOf = (h: string) => stats.findIndex((s) => s.hex === h) + 1;
  const stitches = Object.entries(chart.cells).map(([k, v]) => {
    const [r, c] = k.split(",").map(Number);
    return `    <stitch x="${c}" y="${r}" palindex="${idxOf(v.hex)}" />`;
  }).join("\n");
  const back = chart.back.map((b) => `    <backstitch x1="${b.c1}" y1="${b.r1}" x2="${b.c2}" y2="${b.r2}" palindex="${idxOf(b.hex)}" />`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<chart>
  <format comments="Craft Business Master — OXS export" />
  <properties chartwidth="${chart.cols}" chartheight="${chart.rows}" title="${title}" />
  <palette>
    <palette_item index="0" number="cloth" name="cloth" color="FFFFFF" symbol="" />
${palette}
  </palette>
  <fullstitches>
${stitches}
  </fullstitches>
  <backstitches>
${back}
  </backstitches>
</chart>`;
}