/**
 * Fase 9 — Auto-digitize (foto → múltiplas camadas de cor com contornos fechados).
 *
 * Passos:
 *  1) Rasteriza a imagem num canvas com largura alvo (mantendo o rácio).
 *  2) Quantiza a paleta para N cores dominantes (k-means simplificado).
 *  3) Para cada cor: constrói uma máscara binária, aplica marching-squares
 *     e RDP para obter polígonos fechados (uma "camada" por cor).
 *  4) Devolve as camadas prontas a inserir no Bordado Studio; o motor de
 *     preenchimento (satin/tatami) e o export DST/PES tratam do resto.
 */

import { marchingSquares, rdp } from "./lettering";

export type DigitizedLayer = {
  hex: string;
  paths: string[];   // caminhos "M x y L x y ... Z" em coords SVG
  pixels: number;    // nº de pixéis da máscara (para ordenação/estatísticas)
};

export type DigitizeOptions = {
  colors: number;         // 2..12
  targetWidthPx: number;  // largura de rasterização (ex.: 220)
  simplifyPx: number;     // RDP (ex.: 0.8)
  minRegionPx: number;    // ignora componentes muito pequenas (ruído)
  originX: number;        // canto sup. esq. de saída em coords SVG
  originY: number;
  outWidthPx: number;     // largura de saída em coords SVG
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("imagem inválida"));
    img.src = src;
  });
}

function toHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}

/** k-means simples em RGB com sementes por amostragem. */
function kmeans(pixels: number[][], k: number, iters = 6): number[][] {
  if (pixels.length === 0) return [];
  const k2 = Math.max(1, Math.min(k, pixels.length));
  // sementes: amostras espaçadas uniformemente
  const centers: number[][] = [];
  const step = Math.max(1, Math.floor(pixels.length / k2));
  for (let i = 0; i < k2; i++) centers.push(pixels[Math.min(pixels.length - 1, i * step)].slice());
  for (let t = 0; t < iters; t++) {
    const sums = centers.map(() => [0, 0, 0, 0]); // r,g,b,count
    for (const p of pixels) {
      let bi = 0, bd = Infinity;
      for (let i = 0; i < centers.length; i++) {
        const c = centers[i];
        const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;
        if (d < bd) { bd = d; bi = i; }
      }
      const s = sums[bi];
      s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3] += 1;
    }
    for (let i = 0; i < centers.length; i++) {
      const s = sums[i];
      if (s[3] > 0) centers[i] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]];
    }
  }
  return centers;
}

export async function autoDigitize(srcDataUrl: string, opts: DigitizeOptions): Promise<DigitizedLayer[]> {
  const img = await loadImage(srcDataUrl);
  const targetW = Math.max(32, Math.min(600, Math.round(opts.targetWidthPx)));
  const scaleImg = targetW / img.naturalWidth;
  const w = targetW;
  const h = Math.max(16, Math.round(img.naturalHeight * scaleImg));
  const cvs = document.createElement("canvas");
  cvs.width = w; cvs.height = h;
  const ctx = cvs.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  // amostragem para k-means (evita passar todos os pixéis)
  const sample: number[][] = [];
  const stride = Math.max(1, Math.floor((w * h) / 4000));
  for (let i = 0; i < w * h; i++) {
    if (i % stride !== 0) continue;
    const a = data[i * 4 + 3];
    if (a < 40) continue;
    sample.push([data[i * 4], data[i * 4 + 1], data[i * 4 + 2]]);
  }
  const centers = kmeans(sample, Math.max(2, Math.min(12, opts.colors)));

  // atribui cada pixel ao centro mais próximo
  const assign = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const a = data[i * 4 + 3];
    if (a < 40) { assign[i] = 255; continue; }
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    let bi = 0, bd = Infinity;
    for (let j = 0; j < centers.length; j++) {
      const c = centers[j];
      const d = (r - c[0]) ** 2 + (g - c[1]) ** 2 + (b - c[2]) ** 2;
      if (d < bd) { bd = d; bi = j; }
    }
    assign[i] = bi;
  }

  const outScale = opts.outWidthPx / w;   // px SVG por px raster
  const layers: DigitizedLayer[] = [];
  for (let ci = 0; ci < centers.length; ci++) {
    const mask = new Uint8Array(w * h);
    let count = 0;
    for (let i = 0; i < w * h; i++) if (assign[i] === ci) { mask[i] = 1; count++; }
    if (count < Math.max(20, opts.minRegionPx)) continue;
    const polys = marchingSquares(mask, w, h);
    const paths: string[] = [];
    for (const poly of polys) {
      if (poly.length < 6) continue;
      const areaPx = Math.abs(shoelace(poly));
      if (areaPx * outScale * outScale < opts.minRegionPx) continue;
      const simp = rdp(poly, opts.simplifyPx);
      if (simp.length < 3) continue;
      const parts = simp.map(([x, y]) => {
        const sx = opts.originX + x * outScale;
        const sy = opts.originY + y * outScale;
        return `${sx.toFixed(2)} ${sy.toFixed(2)}`;
      });
      paths.push(`M ${parts[0]} ${parts.slice(1).map((p) => `L ${p}`).join(" ")} Z`);
    }
    if (paths.length === 0) continue;
    const c = centers[ci];
    layers.push({ hex: toHex(c[0], c[1], c[2]), paths, pixels: count });
  }
  // Ordena da cor com mais área para menos (base primeiro, detalhes depois).
  layers.sort((a, b) => b.pixels - a.pixels);
  return layers;
}

function shoelace(poly: number[][]): number {
  let s = 0;
  for (let i = 0, n = poly.length; i < n; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % n];
    s += x1 * y2 - x2 * y1;
  }
  return s / 2;
}
