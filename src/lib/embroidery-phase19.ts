/**
 * Fase 19 — Pré-visualização de trajeto de bordado (stitch path & timeline)
 * e captura de screenshot 3D. Utilitários puros e client-safe.
 */
import type { BlockLite, StitchLite } from "./embroidery-phase18";

export interface FlatStitch extends StitchLite {
  blockIndex: number;
}

export interface Bounds { minX: number; minY: number; maxX: number; maxY: number }

export function flattenBlocks(blocks: BlockLite[]): FlatStitch[] {
  const out: FlatStitch[] = [];
  blocks.forEach((b, i) =>
    b.stitches.forEach((s) =>
      out.push({ ...s, color: s.color || b.color, blockIndex: i })));
  return out;
}

export function computeBounds(pts: { x: number; y: number }[]): Bounds {
  if (pts.length === 0) return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

export interface PathRenderOptions {
  width: number;
  height: number;
  padding?: number;
  showJumps?: boolean;
  lineWidth?: number;
  background?: string;
  /** Índice do último ponto a desenhar (para timeline). */
  progress?: number;
  /** Se true, desenha marcador no ponto atual. */
  cursor?: boolean;
}

/** Desenha o caminho no canvas 2D com fit automático. */
export function drawStitchPath(
  ctx: CanvasRenderingContext2D,
  blocks: BlockLite[],
  opts: PathRenderOptions,
) {
  const {
    width, height, padding = 12, showJumps = true,
    lineWidth = 1, background = "#0b0b0f", cursor = true,
  } = opts;
  ctx.save();
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  const flat = flattenBlocks(blocks);
  const progress = Math.max(0, Math.min(opts.progress ?? flat.length, flat.length));
  if (flat.length < 2) { ctx.restore(); return; }
  const b = computeBounds(flat);
  const dx = b.maxX - b.minX || 1;
  const dy = b.maxY - b.minY || 1;
  const scale = Math.min((width - padding * 2) / dx, (height - padding * 2) / dy);
  const ox = padding + (width - padding * 2 - dx * scale) / 2 - b.minX * scale;
  const oy = padding + (height - padding * 2 - dy * scale) / 2 - b.minY * scale;
  const tx = (x: number) => ox + x * scale;
  const ty = (y: number) => oy + y * scale;

  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  let prev: FlatStitch | null = null;
  let currentColor = "";
  for (let i = 0; i < progress; i++) {
    const s = flat[i];
    if (!prev) { prev = s; continue; }
    const isJump = !!s.jump || s.blockIndex !== prev.blockIndex;
    if (isJump && !showJumps) { prev = s; continue; }
    const color = isJump ? "rgba(255,255,255,0.25)" : s.color;
    if (color !== currentColor) {
      ctx.strokeStyle = color;
      currentColor = color;
    }
    if (isJump) ctx.setLineDash([3, 3]); else ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(tx(prev.x), ty(prev.y));
    ctx.lineTo(tx(s.x), ty(s.y));
    ctx.stroke();
    prev = s;
  }

  if (cursor && prev && progress > 0 && progress < flat.length) {
    ctx.setLineDash([]);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(tx(prev.x), ty(prev.y), Math.max(2, lineWidth * 1.4), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Renderiza uma imitação 3D isométrica (pontos como cordões inclinados). */
export function drawFaux3D(
  ctx: CanvasRenderingContext2D,
  blocks: BlockLite[],
  opts: { width: number; height: number; tilt?: number; background?: string },
) {
  const { width, height, tilt = 0.55, background = "#1a1a20" } = opts;
  ctx.save();
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);
  const flat = flattenBlocks(blocks);
  if (flat.length < 2) { ctx.restore(); return; }
  const b = computeBounds(flat);
  const dx = b.maxX - b.minX || 1;
  const dy = b.maxY - b.minY || 1;
  const scale = Math.min((width - 40) / dx, (height - 40) / (dy * tilt + 20));
  const ox = 20 - b.minX * scale;
  const oy = 20 - b.minY * scale * tilt;
  const tx = (x: number) => ox + x * scale;
  const ty = (y: number) => oy + y * scale * tilt;

  ctx.lineCap = "round";
  ctx.lineWidth = 2.4;
  let prev: FlatStitch | null = null;
  for (const s of flat) {
    if (!prev) { prev = s; continue; }
    if (s.jump || s.blockIndex !== prev.blockIndex) { prev = s; continue; }
    // sombra
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    ctx.moveTo(tx(prev.x) + 1.2, ty(prev.y) + 1.6);
    ctx.lineTo(tx(s.x) + 1.2, ty(s.y) + 1.6);
    ctx.stroke();
    // cordão principal
    ctx.strokeStyle = s.color;
    ctx.beginPath();
    ctx.moveTo(tx(prev.x), ty(prev.y));
    ctx.lineTo(tx(s.x), ty(s.y));
    ctx.stroke();
    // brilho
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(tx(prev.x), ty(prev.y) - 0.6);
    ctx.lineTo(tx(s.x), ty(s.y) - 0.6);
    ctx.stroke();
    ctx.lineWidth = 2.4;
    prev = s;
  }
  ctx.restore();
}

/** Faz download do canvas como PNG. */
export function downloadCanvasPng(canvas: HTMLCanvasElement, filename: string) {
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
}
