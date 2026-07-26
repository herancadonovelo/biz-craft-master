/**
 * Fase 11 — Importação de ficheiros Tajima DST.
 *
 * Faz o parsing inverso ao `encodeDst`: lê o cabeçalho de 512 bytes e decodifica
 * os registos de 3 bytes em stitches absolutos. Devolve StitchBlocks agrupados
 * por mudança de cor, prontos a converter em camadas de path SVG.
 */
import type { StitchBlock } from "./dst";

const DEFAULT_PALETTE = [
  "#111111", "#c0392b", "#2980b9", "#16a085", "#f39c12",
  "#8e44ad", "#27ae60", "#d35400", "#7f8c8d", "#2c3e50",
  "#e91e63", "#00838f",
];

/** Decodifica dx/dy (unidades de 0.1 mm) a partir dos 3 bytes de um registo. */
function decodeDelta(b0: number, b1: number, b2: number): { dx: number; dy: number; jump: boolean; colorChange: boolean; end: boolean } {
  if (b2 === 0xf3) return { dx: 0, dy: 0, jump: false, colorChange: false, end: true };
  const colorChange = (b2 & 0xc3) === 0xc3;
  const jump = (b2 & 0x83) === 0x83;
  let dx = 0, dy = 0;
  // dx
  if (b2 & (1 << 2)) dx += 81;  if (b2 & (1 << 3)) dx -= 81;
  if (b1 & (1 << 2)) dx += 27;  if (b1 & (1 << 3)) dx -= 27;
  if (b2 & (1 << 0)) dx += 9;   if (b2 & (1 << 1)) dx -= 9;
  if (b1 & (1 << 0)) dx += 3;   if (b1 & (1 << 1)) dx -= 3;
  if (b0 & (1 << 0)) dx += 1;   if (b0 & (1 << 1)) dx -= 1;
  // dy
  if (b2 & (1 << 5)) dy += 81;  if (b2 & (1 << 4)) dy -= 81;
  if (b1 & (1 << 5)) dy += 27;  if (b1 & (1 << 4)) dy -= 27;
  if (b2 & (1 << 7)) dy += 9;   if (b2 & (1 << 6)) dy -= 9;
  if (b1 & (1 << 7)) dy += 3;   if (b1 & (1 << 6)) dy -= 3;
  if (b0 & (1 << 7)) dy += 1;   if (b0 & (1 << 6)) dy -= 1;
  return { dx, dy, jump, colorChange, end: false };
}

/** Decodifica um buffer DST completo em blocos de pontos absolutos (em px SVG). */
export function decodeDst(buffer: ArrayBuffer, pxPerMm: number): StitchBlock[] {
  const view = new Uint8Array(buffer);
  if (view.length < 512) throw new Error("Ficheiro DST inválido (cabeçalho incompleto).");
  const body = view.subarray(512);
  const blocks: StitchBlock[] = [];
  let colorIdx = 0;
  let cur: StitchBlock = { color: DEFAULT_PALETTE[0], label: "Cor 1", points: [] };
  let x = 0, y = 0;
  for (let i = 0; i + 2 < body.length; i += 3) {
    const d = decodeDelta(body[i], body[i + 1], body[i + 2]);
    if (d.end) break;
    if (d.colorChange) {
      if (cur.points.length) blocks.push(cur);
      colorIdx++;
      cur = { color: DEFAULT_PALETTE[colorIdx % DEFAULT_PALETTE.length], label: `Cor ${colorIdx + 1}`, points: [] };
      continue;
    }
    x += d.dx; y += d.dy;
    // DST usa Y para cima; SVG usa Y para baixo — invertemos ao converter.
    const px = (x / 10) * pxPerMm;
    const py = -(y / 10) * pxPerMm;
    cur.points.push({ x: px, y: py });
  }
  if (cur.points.length) blocks.push(cur);
  return blocks;
}

/** Converte blocos em paths SVG "M x y L x y ..." centrados numa bounding box alvo. */
export function blocksToPaths(blocks: StitchBlock[], target: { cx: number; cy: number }): { color: string; label: string; d: string }[] {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const b of blocks) for (const p of b.points) {
    if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y;
  }
  const bx = (minX + maxX) / 2, by = (minY + maxY) / 2;
  const shift = (p: { x: number; y: number }) => ({ x: p.x - bx + target.cx, y: p.y - by + target.cy });
  return blocks.map((b) => {
    const pts = b.points.map(shift);
    if (pts.length === 0) return { color: b.color, label: b.label, d: "" };
    const d = "M " + pts[0].x.toFixed(2) + " " + pts[0].y.toFixed(2) +
              pts.slice(1).map((p) => ` L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join("");
    return { color: b.color, label: b.label, d };
  });
}