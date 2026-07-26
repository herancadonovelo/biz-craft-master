/**
 * Vetorização de imagem → polyline única contínua.
 *
 * Pipeline:
 *   1. Rasteriza a imagem numa grelha (máx. `maxDim` no lado maior).
 *   2. Converte para binário via limiar de luminância (Otsu opcional ou manual).
 *   3. Afina para 1 pixel (Zhang-Suen thinning).
 *   4. Extrai caminhos conectados a partir de endpoints do esqueleto.
 *   5. Une todos os caminhos por vizinho mais próximo → 1 única polyline
 *      contínua (garantia para SVG/DXF: `polyline` única).
 *   6. Simplifica com Ramer-Douglas-Peucker (`epsilon` px).
 *
 * O resultado é sempre UM array de pontos que forma uma linha contínua.
 */

export type TracePoint = { x: number; y: number };

export type TraceOptions = {
  /** Lado maior da grelha de trabalho em pixels. */
  maxDim?: number;
  /** Limiar 0-255. Se omitido, calcula Otsu. */
  threshold?: number;
  /** Inverte (true = tinta clara sobre fundo escuro). */
  invert?: boolean;
  /** Simplificação RDP em pixels da grelha. */
  epsilon?: number;
};

export type TraceResult = {
  points: TracePoint[];
  width: number;
  height: number;
  threshold: number;
};

/* ---------- helpers ---------- */

function otsu(gray: Uint8ClampedArray): number {
  const hist = new Array(256).fill(0);
  for (let i = 0; i < gray.length; i++) hist[gray[i]]++;
  const total = gray.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0,
    wB = 0,
    max = 0,
    thr = 127;
  for (let i = 0; i < 256; i++) {
    wB += hist[i];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += i * hist[i];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > max) {
      max = between;
      thr = i;
    }
  }
  return thr;
}

/** Zhang-Suen thinning: reduz manchas binárias a esqueletos de 1 px. */
function zhangSuen(bin: Uint8Array, w: number, h: number): Uint8Array {
  const a = new Uint8Array(bin);
  const idx = (x: number, y: number) => y * w + x;
  let changed = true;
  const toClear: number[] = [];
  while (changed) {
    changed = false;
    for (let pass = 0; pass < 2; pass++) {
      toClear.length = 0;
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          if (a[idx(x, y)] !== 1) continue;
          const p2 = a[idx(x, y - 1)],
            p3 = a[idx(x + 1, y - 1)],
            p4 = a[idx(x + 1, y)],
            p5 = a[idx(x + 1, y + 1)],
            p6 = a[idx(x, y + 1)],
            p7 = a[idx(x - 1, y + 1)],
            p8 = a[idx(x - 1, y)],
            p9 = a[idx(x - 1, y - 1)];
          const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
          if (B < 2 || B > 6) continue;
          const seq = [p2, p3, p4, p5, p6, p7, p8, p9, p2];
          let A = 0;
          for (let i = 0; i < 8; i++) if (seq[i] === 0 && seq[i + 1] === 1) A++;
          if (A !== 1) continue;
          const c1 = pass === 0 ? p2 * p4 * p6 : p2 * p4 * p8;
          const c2 = pass === 0 ? p4 * p6 * p8 : p2 * p6 * p8;
          if (c1 !== 0 || c2 !== 0) continue;
          toClear.push(idx(x, y));
        }
      }
      if (toClear.length) {
        changed = true;
        for (const i of toClear) a[i] = 0;
      }
    }
  }
  return a;
}

/** Extrai polilinhas a partir do esqueleto: começa em endpoints e caminha. */
function extractPaths(skel: Uint8Array, w: number, h: number): TracePoint[][] {
  const visited = new Uint8Array(skel.length);
  const paths: TracePoint[][] = [];
  const idx = (x: number, y: number) => y * w + x;
  const nbrs = (x: number, y: number) => {
    const out: [number, number][] = [];
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx,
          ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        if (skel[idx(nx, ny)] === 1) out.push([nx, ny]);
      }
    return out;
  };
  const walk = (sx: number, sy: number): TracePoint[] => {
    const path: TracePoint[] = [{ x: sx, y: sy }];
    visited[idx(sx, sy)] = 1;
    let cx = sx,
      cy = sy;
    while (true) {
      const opts = nbrs(cx, cy).filter(([nx, ny]) => !visited[idx(nx, ny)]);
      if (opts.length === 0) break;
      // preferir vizinho ortogonal se disponível (caminho mais suave)
      opts.sort((a, b) => {
        const da = Math.abs(a[0] - cx) + Math.abs(a[1] - cy);
        const db = Math.abs(b[0] - cx) + Math.abs(b[1] - cy);
        return da - db;
      });
      const [nx, ny] = opts[0];
      visited[idx(nx, ny)] = 1;
      path.push({ x: nx, y: ny });
      cx = nx;
      cy = ny;
    }
    return path;
  };

  // 1) Endpoints (1 vizinho) primeiro
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (skel[idx(x, y)] !== 1 || visited[idx(x, y)]) continue;
      if (nbrs(x, y).length === 1) {
        const p = walk(x, y);
        if (p.length > 1) paths.push(p);
      }
    }
  }
  // 2) Restante (loops fechados / junções)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (skel[idx(x, y)] !== 1 || visited[idx(x, y)]) continue;
      const p = walk(x, y);
      if (p.length > 1) paths.push(p);
    }
  }
  return paths;
}

/** Une várias polilinhas numa única, ligando por endpoint mais próximo. */
function stitchPaths(paths: TracePoint[][]): TracePoint[] {
  if (paths.length === 0) return [];
  const remaining = paths.map((p) => [...p]);
  const first = remaining.shift()!;
  const result: TracePoint[] = first;
  while (remaining.length) {
    const last = result[result.length - 1];
    let bestIdx = 0;
    let bestDist = Infinity;
    let reverse = false;
    for (let i = 0; i < remaining.length; i++) {
      const p = remaining[i];
      const dHead = Math.hypot(p[0].x - last.x, p[0].y - last.y);
      const dTail = Math.hypot(p[p.length - 1].x - last.x, p[p.length - 1].y - last.y);
      if (dHead < bestDist) {
        bestDist = dHead;
        bestIdx = i;
        reverse = false;
      }
      if (dTail < bestDist) {
        bestDist = dTail;
        bestIdx = i;
        reverse = true;
      }
    }
    const next = remaining.splice(bestIdx, 1)[0];
    if (reverse) next.reverse();
    // ponte "invisível" mas presente na polyline única
    result.push(...next);
  }
  return result;
}

/** Ramer-Douglas-Peucker. */
export function rdp(points: TracePoint[], epsilon: number): TracePoint[] {
  if (points.length < 3 || epsilon <= 0) return points.slice();
  const sqEps = epsilon * epsilon;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack: [number, number][] = [[0, points.length - 1]];
  while (stack.length) {
    const [lo, hi] = stack.pop()!;
    const a = points[lo],
      b = points[hi];
    const dx = b.x - a.x,
      dy = b.y - a.y;
    const denom = dx * dx + dy * dy || 1;
    let maxD = -1,
      maxI = -1;
    for (let i = lo + 1; i < hi; i++) {
      const p = points[i];
      const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / denom;
      const px = a.x + t * dx,
        py = a.y + t * dy;
      const d = (p.x - px) * (p.x - px) + (p.y - py) * (p.y - py);
      if (d > maxD) {
        maxD = d;
        maxI = i;
      }
    }
    if (maxD > sqEps) {
      keep[maxI] = 1;
      stack.push([lo, maxI], [maxI, hi]);
    }
  }
  const out: TracePoint[] = [];
  for (let i = 0; i < points.length; i++) if (keep[i]) out.push(points[i]);
  return out;
}

/* ---------- API pública ---------- */

/** Vetoriza um HTMLImageElement (ou canvas) numa polyline única. */
export function traceImage(
  source: HTMLImageElement | HTMLCanvasElement,
  opts: TraceOptions = {},
): TraceResult {
  const maxDim = opts.maxDim ?? 400;
  const srcW = "naturalWidth" in source ? source.naturalWidth : source.width;
  const srcH = "naturalHeight" in source ? source.naturalHeight : source.height;
  if (!srcW || !srcH) throw new Error("trace_image_empty");
  const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
  const w = Math.max(2, Math.round(srcW * scale));
  const h = Math.max(2, Math.round(srcH * scale));
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;
  ctx.drawImage(source, 0, 0, w, h);
  const img = ctx.getImageData(0, 0, w, h);
  const gray = new Uint8ClampedArray(w * h);
  for (let i = 0, j = 0; i < img.data.length; i += 4, j++) {
    gray[j] = (img.data[i] * 0.299 + img.data[i + 1] * 0.587 + img.data[i + 2] * 0.114) | 0;
  }
  const thr = opts.threshold ?? otsu(gray);
  const invert = opts.invert ?? false;
  const bin = new Uint8Array(w * h);
  for (let i = 0; i < gray.length; i++) {
    const dark = gray[i] < thr;
    bin[i] = (invert ? !dark : dark) ? 1 : 0;
  }
  const skel = zhangSuen(bin, w, h);
  const paths = extractPaths(skel, w, h).filter((p) => p.length >= 3);
  const stitched = stitchPaths(paths);
  const simplified = rdp(stitched, opts.epsilon ?? 1.2);
  return { points: simplified, width: w, height: h, threshold: thr };
}

/** Serializa em SVG com UMA única <polyline>. */
export function toSVG(points: TracePoint[], width: number, height: number, strokePx = 2): string {
  const pts = points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <polyline fill="none" stroke="#000" stroke-width="${strokePx}" stroke-linecap="round" stroke-linejoin="round" points="${pts}"/>
</svg>
`;
}

/** Serializa em DXF R12 com UMA única POLYLINE contínua. */
export function toDXF(points: TracePoint[], height: number): string {
  // DXF usa Y para cima; invertemos.
  const flipY = (y: number) => height - y;
  const header = [
    "0", "SECTION",
    "2", "ENTITIES",
    "0", "POLYLINE",
    "8", "0",
    "66", "1",
    "70", "0",
  ];
  const verts: string[] = [];
  for (const p of points) {
    verts.push(
      "0", "VERTEX",
      "8", "0",
      "10", p.x.toFixed(3),
      "20", flipY(p.y).toFixed(3),
      "30", "0.0",
    );
  }
  const footer = [
    "0", "SEQEND",
    "8", "0",
    "0", "ENDSEC",
    "0", "EOF",
  ];
  return [...header, ...verts, ...footer].join("\n");
}

/** Comprimento total (px) da polyline. */
export function polylineLength(points: TracePoint[]): number {
  let sum = 0;
  for (let i = 1; i < points.length; i++) {
    sum += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return sum;
}