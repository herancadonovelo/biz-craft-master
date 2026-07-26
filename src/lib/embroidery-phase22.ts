/**
 * Fase 22 — Auto-digitize inteligente e composição de monograma.
 *
 * Utilitários puros e client-safe. A vetorização usa o motor da Fase 9
 * (`autoDigitize`), mas aqui adicionamos heurísticas para escolher
 * automaticamente satim vs tatami, underlay e pull-compensation por
 * camada, e um compositor de monograma com moldura.
 */
import { motifPath, type MotifId } from "./lettering";
import type { DigitizedLayer } from "./auto-digitize";

// ─── Estratégia inteligente por camada ───────────────────────────────

export type StitchType = "satin" | "tatami" | "run";

export interface SmartLayerRule {
  hex: string;
  paths: string[];
  areaMm2: number;
  widthMm: number;
  heightMm: number;
  stitch: StitchType;
  underlay: "none" | "edge" | "zigzag" | "double";
  pullCompMm: number;   // compensação lateral
  density: number;      // pontos/mm (para tatami)
  spacingMm: number;    // espaçamento entre passes
}

/** Analisa polígonos e escolhe pontos + underlay + compensação. */
export function analyzeLayers(
  layers: DigitizedLayer[],
  mmPerPx: number,
): SmartLayerRule[] {
  return layers.map((l) => {
    const bb = pathsBBox(l.paths);
    const wMm = bb.w * mmPerPx;
    const hMm = bb.h * mmPerPx;
    const areaMm2 = l.pixels * mmPerPx * mmPerPx;
    const shortest = Math.min(wMm, hMm);
    const longest = Math.max(wMm, hMm);
    const elongation = longest > 0 ? shortest / longest : 1;

    let stitch: StitchType;
    if (shortest < 1.2) stitch = "run";                 // demasiado fino → corrida
    else if (shortest <= 7 && elongation < 0.5) stitch = "satin"; // faixas finas alongadas
    else stitch = "tatami";                             // áreas largas

    const underlay: SmartLayerRule["underlay"] =
      stitch === "run"    ? "none"   :
      stitch === "satin"  ? (shortest > 3 ? "zigzag" : "edge") :
      areaMm2 > 400       ? "double" : "edge";

    const pullCompMm =
      stitch === "satin" ? Math.min(0.4, 0.05 * shortest) :
      stitch === "tatami" ? 0.15 : 0;

    const density = stitch === "tatami" ? 4.0 : 5.5;
    const spacingMm =
      stitch === "satin" ? 0.4 :
      stitch === "tatami" ? 1 / density :
      2.0;

    return {
      hex: l.hex, paths: l.paths, areaMm2,
      widthMm: wMm, heightMm: hMm,
      stitch, underlay, pullCompMm, density, spacingMm,
    };
  });
}

/** Bounding-box aproximado de um conjunto de caminhos "M x y L x y Z". */
export function pathsBBox(paths: string[]): { x: number; y: number; w: number; h: number } {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const rx = /-?\d+\.?\d*/g;
  for (const p of paths) {
    const nums = p.match(rx);
    if (!nums) continue;
    for (let i = 0; i < nums.length - 1; i += 2) {
      const x = Number(nums[i]);
      const y = Number(nums[i + 1]);
      if (x < x0) x0 = x; if (y < y0) y0 = y;
      if (x > x1) x1 = x; if (y > y1) y1 = y;
    }
  }
  if (!isFinite(x0)) return { x: 0, y: 0, w: 0, h: 0 };
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

// ─── Monograma ──────────────────────────────────────────────────────

export type FrameShape = MotifId | "none";

export interface MonogramOptions {
  initials: string;         // 1..3 letras
  fontFamily: string;
  weight: string;
  centerX: number;
  centerY: number;
  sizePx: number;           // altura das letras
  frame: FrameShape;
  frameMarginPx: number;    // margem entre texto e moldura
  frameStrokePx: number;    // espessura da moldura
  color: string;
}

export const DEFAULT_MONOGRAM: MonogramOptions = {
  initials: "ABC",
  fontFamily: "Georgia, 'Times New Roman', serif",
  weight: "700",
  centerX: 200,
  centerY: 200,
  sizePx: 90,
  frame: "circle",
  frameMarginPx: 20,
  frameStrokePx: 3,
  color: "#1e293b",
};

/** SVG completo do monograma para preview 2D. */
export function monogramSvg(o: MonogramOptions, box = 400): string {
  const initials = (o.initials || "").slice(0, 3).toUpperCase();
  const r = o.sizePx / 2 + o.frameMarginPx;
  const frame = o.frame === "none"
    ? ""
    : `<path d="${motifPath(o.frame, o.centerX, o.centerY, r * 2)}"
         fill="none" stroke="${o.color}" stroke-width="${o.frameStrokePx}" />`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${box} ${box}" width="${box}" height="${box}">
    <rect width="${box}" height="${box}" fill="white"/>
    ${frame}
    <text x="${o.centerX}" y="${o.centerY}" text-anchor="middle" dominant-baseline="central"
      font-family="${o.fontFamily}" font-weight="${o.weight}" font-size="${o.sizePx}"
      fill="${o.color}">${escapeXml(initials)}</text>
  </svg>`;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;",
  }[c]!));
}

// ─── Persistência ────────────────────────────────────────────────────

const DIGI_KEY = "embroidery-phase22-digitize";
const MONO_KEY = "embroidery-phase22-monogram";

export interface DigitizeSettings {
  colors: number;
  widthMm: number;
  simplifyPx: number;
  minRegionPx: number;
}

export const DEFAULT_DIGITIZE: DigitizeSettings = {
  colors: 5, widthMm: 80, simplifyPx: 0.8, minRegionPx: 40,
};

export function loadDigitize(projectId?: string): DigitizeSettings {
  if (typeof window === "undefined") return DEFAULT_DIGITIZE;
  try {
    const key = projectId ? `${DIGI_KEY}:${projectId}` : DIGI_KEY;
    const raw = window.localStorage.getItem(key);
    return raw ? { ...DEFAULT_DIGITIZE, ...JSON.parse(raw) } : DEFAULT_DIGITIZE;
  } catch { return DEFAULT_DIGITIZE; }
}
export function saveDigitize(s: DigitizeSettings, projectId?: string) {
  if (typeof window === "undefined") return;
  try {
    const key = projectId ? `${DIGI_KEY}:${projectId}` : DIGI_KEY;
    window.localStorage.setItem(key, JSON.stringify(s));
  } catch { /* ignore */ }
}

export function loadMonogram(projectId?: string): MonogramOptions {
  if (typeof window === "undefined") return DEFAULT_MONOGRAM;
  try {
    const key = projectId ? `${MONO_KEY}:${projectId}` : MONO_KEY;
    const raw = window.localStorage.getItem(key);
    return raw ? { ...DEFAULT_MONOGRAM, ...JSON.parse(raw) } : DEFAULT_MONOGRAM;
  } catch { return DEFAULT_MONOGRAM; }
}
export function saveMonogram(m: MonogramOptions, projectId?: string) {
  if (typeof window === "undefined") return;
  try {
    const key = projectId ? `${MONO_KEY}:${projectId}` : MONO_KEY;
    window.localStorage.setItem(key, JSON.stringify(m));
  } catch { /* ignore */ }
}