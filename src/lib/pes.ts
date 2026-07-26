/**
 * Fase 6 do Estúdio de Bordado — exportador Brother PES (v1) com secção PEC1.
 *
 * O PES v1 é o wrapper mais compatível para máquinas Brother/Babylock/Bernette.
 * Estrutura mínima:
 *   "#PES0001" + uint32 pecOffset + 4 bytes zero (sem secção CEmbOne) →
 *   secção PEC iniciada em pecOffset: label "LA:<20 bytes>\r" + preâmbulo +
 *   tabela de cores (1 byte count + 1 byte thread por bloco) + stitch data.
 *
 * Os stitches PEC são pares (dx,dy) em 0.1 mm, com flags de "jump" e
 * "color change" em bytes de escape (0xFE/0xB0). Coordenadas ≥ 64 usam a
 * codificação longa de 2 bytes com bit 0x80 no primeiro byte.
 *
 * Baseado no PES/PEC file format (Brother/Trevor Adams) e em pyembroidery.
 */

import type { StitchBlock } from "./dst";

/** Paleta oficial PEC (65 cores). O índice é usado na tabela de cores do PES. */
const PEC_PALETTE: Array<[string, string]> = [
  ["#000000", "Unknown"], ["#1a0a94", "Prussian Blue"], ["#0f75ff", "Blue"],
  ["#228b22", "Teal Green"], ["#cd00cd", "Cornflower Blue"], ["#dc143c", "Red"],
  ["#ff8c00", "Reddish Brown"], ["#8b00ff", "Magenta"], ["#ff69b4", "Light Lilac"],
  ["#ff1493", "Lilac"], ["#ffd700", "Mint Green"], ["#98fb98", "Deep Gold"],
  ["#7fffd4", "Orange"], ["#ff4500", "Yellow"], ["#a9a9a9", "Steel Grey"],
  ["#000080", "Brown"], ["#87ceeb", "Light Blue"], ["#20b2aa", "Sea Green"],
  ["#ff00ff", "Yellow Green"], ["#a52a2a", "Salmon Pink"], ["#ff6347", "Coral"],
  ["#dda0dd", "Ivory"], ["#eee8aa", "Ecru"], ["#bdb76b", "Light Brown"],
  ["#b0c4de", "Bronze"], ["#8b4513", "Rust"], ["#daa520", "Gold"],
  ["#556b2f", "Grey"], ["#ff7f50", "Peach"], ["#f08080", "Wine"],
  ["#e0ffff", "White"], ["#7b68ee", "Deep Blue"], ["#800000", "Deep Rose"],
  ["#ff0000", "Hot Pink"], ["#dc143c", "Deep Red"], ["#ff8c00", "Orange Red"],
  ["#ffd700", "Yellow"], ["#adff2f", "Applique Material"], ["#7cfc00", "Applique Position"],
  ["#00ff00", "Applique"], ["#8fbc8f", "Dark Green"], ["#66cdaa", "Aquamarine"],
  ["#7fff00", "Emerald Green"], ["#00fa9a", "Light Green"], ["#008080", "Dark Teal"],
  ["#4682b4", "Sky Blue"], ["#4169e1", "Royal Blue"], ["#6495ed", "Cadet Blue"],
  ["#00bfff", "Baby Blue"], ["#1e90ff", "Turquoise"], ["#f5f5dc", "Off White"],
  ["#ffe4b5", "Cream Yellow"], ["#f5deb3", "Wheat"], ["#deb887", "Tan"],
  ["#d2b48c", "Beige"], ["#c0c0c0", "Silver"], ["#708090", "Slate Grey"],
  ["#2f4f4f", "Dark Grey"], ["#191970", "Midnight Blue"], ["#000080", "Navy"],
  ["#4b0082", "Indigo"], ["#9400d3", "Dark Violet"], ["#ff00ff", "Fuchsia"],
  ["#ffb6c1", "Pink"], ["#faebd7", "Antique White"],
];

/** Índice PEC mais próximo (RGB Euclidiano) para um hex qualquer. */
export function nearestPecIndex(hex: string): number {
  const rgb = (h: string) => {
    const c = h.replace("#", "");
    return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
  };
  const [r, g, b] = rgb(hex);
  let bi = 1, bd = Infinity;
  for (let i = 1; i < PEC_PALETTE.length; i++) {
    const [pr, pg, pb] = rgb(PEC_PALETTE[i][0]);
    const d = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
    if (d < bd) { bd = d; bi = i; }
  }
  return bi;
}

/** Escreve stitch data PEC. `stitches` já em 0.1 mm relativos ao ponto anterior. */
function encodePecStitches(blocks: StitchBlock[], pxPerMm: number): Uint8Array {
  const out: number[] = [];
  const writeLong = (v: number) => {
    // 2-byte codificação de 12 bits em complemento de 2 com flag 0x80.
    let n = v & 0x0fff;
    out.push(0x80 | ((n >> 8) & 0x0f));
    out.push(n & 0xff);
  };
  const writeCoord = (v: number, jump: boolean) => {
    if (!jump && v >= -63 && v <= 63) {
      out.push(v & 0x7f);
    } else {
      let n = v;
      if (n < 0) n = 0x1000 + n; // 12-bit complemento de 2
      const hi = 0x80 | (jump ? 0x20 : 0x00) | ((n >> 8) & 0x0f);
      out.push(hi);
      out.push(n & 0xff);
    }
    void writeLong;
  };
  let lastX = 0, lastY = 0;
  blocks.forEach((block, bi) => {
    if (bi > 0) {
      // color change
      out.push(0xfe); out.push(0xb0); out.push((bi & 1) ? 2 : 1);
    }
    for (let i = 0; i < block.points.length; i++) {
      const p = block.points[i];
      const x = Math.round((p.x / pxPerMm) * 10);
      const y = Math.round(-(p.y / pxPerMm) * 10);
      const dx = x - lastX, dy = y - lastY;
      const jump = i === 0 || Math.abs(dx) > 63 || Math.abs(dy) > 63;
      writeCoord(dx, jump);
      writeCoord(dy, jump);
      lastX = x; lastY = y;
    }
  });
  out.push(0xff); // end
  return Uint8Array.from(out);
}

/** Gera um Blob PES v1 completo a partir de blocos de bordado (mesmo formato do DST). */
export function encodePes(blocks: StitchBlock[], pxPerMm: number, label = "CBM"): Blob {
  // Bounding box em 0.1mm
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const b of blocks) for (const p of b.points) {
    const x = (p.x / pxPerMm) * 10, y = -(p.y / pxPerMm) * 10;
    if (x < minX) minX = x; if (y < minY) minY = y;
    if (x > maxX) maxX = x; if (y > maxY) maxY = y;
  }
  if (!isFinite(minX)) { minX = minY = maxX = maxY = 0; }
  const width = Math.max(1, Math.round(maxX - minX));
  const height = Math.max(1, Math.round(maxY - minY));

  const stitchData = encodePecStitches(blocks, pxPerMm);
  const colorIdx = blocks.map((b) => nearestPecIndex(b.color));

  // Cabeçalho PES v1
  const pesHeader = new Uint8Array(8 + 4 + 4);
  const enc = new TextEncoder();
  pesHeader.set(enc.encode("#PES0001"), 0);
  // PEC offset (little-endian uint32) — preenchido depois de sabermos o tamanho da secção PES
  // Aqui a secção PES é vazia (v1 mínimo permite sem CEmbOne); PEC começa após estes 12 bytes.
  const pecOffset = pesHeader.length;
  new DataView(pesHeader.buffer).setUint32(8, pecOffset, true);

  // Secção PEC: label + preâmbulo + tabela de cores + stitch data
  const labelStr = "LA:" + label.slice(0, 16).padEnd(16, " ") + "\r";
  const labelBytes = enc.encode(labelStr);
  // Preâmbulo de 12 bytes fixos: 0x20 × 11 + 0xff
  const preamble = new Uint8Array(12);
  preamble.fill(0x20); preamble[11] = 0xff;
  // Byte de sinalização "0x00" + escala 0x20, 0x20 + width/height + 0x0000×4
  const meta = new Uint8Array(20);
  const mv = new DataView(meta.buffer);
  meta[0] = 0x00; meta[1] = 0x20; meta[2] = 0x20;
  mv.setUint16(3, width, true);
  mv.setUint16(5, height, true);
  // Restantes bytes 0.

  // Tabela de cores: 1 byte count-1 + N bytes de índices PEC + padding até 463 bytes
  const nCores = Math.max(1, colorIdx.length);
  const colorTable = new Uint8Array(463);
  colorTable.fill(0x20);
  colorTable[0] = (nCores - 1) & 0xff;
  for (let i = 0; i < nCores; i++) colorTable[1 + i] = colorIdx[i] & 0xff;

  const parts: BlobPart[] = [
    pesHeader.buffer as ArrayBuffer,
    labelBytes.buffer as ArrayBuffer,
    preamble.buffer as ArrayBuffer,
    meta.buffer as ArrayBuffer,
    colorTable.buffer as ArrayBuffer,
    stitchData.buffer as ArrayBuffer,
  ];
  return new Blob(parts, { type: "application/octet-stream" });
}

/**
 * Divide blocos por "hoops" quando o design excede as dimensões do bastidor.
 * Retorna N conjuntos de blocos com coordenadas transladadas para caber num
 * bastidor `hoopWpx × hoopHpx`. Peças que caem entre bastidores são cortadas.
 */
export function splitByHoop(
  blocks: StitchBlock[],
  hoopWpx: number,
  hoopHpx: number,
  marginPx = 0,
): StitchBlock[][] {
  if (blocks.length === 0) return [];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const b of blocks) for (const p of b.points) {
    if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y;
  }
  const stepW = Math.max(1, hoopWpx - marginPx * 2);
  const stepH = Math.max(1, hoopHpx - marginPx * 2);
  const cols = Math.max(1, Math.ceil((maxX - minX) / stepW));
  const rows = Math.max(1, Math.ceil((maxY - minY) / stepH));
  const out: StitchBlock[][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x0 = minX + c * stepW, y0 = minY + r * stepH;
      const x1 = x0 + stepW, y1 = y0 + stepH;
      const tile: StitchBlock[] = [];
      for (const b of blocks) {
        const pts = b.points
          .filter((p) => p.x >= x0 && p.x < x1 && p.y >= y0 && p.y < y1)
          .map((p) => ({ x: p.x - x0 + marginPx, y: p.y - y0 + marginPx }));
        if (pts.length > 0) tile.push({ ...b, points: pts });
      }
      if (tile.length > 0) out.push(tile);
    }
  }
  return out;
}