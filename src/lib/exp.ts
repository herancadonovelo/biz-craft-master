/**
 * Fase 12 — Exportador Melco EXP.
 * Pares de int8 (0.1 mm). Comandos: 0x80 0x04 = jump; 0x80 0x02 = color stop;
 * 0x80 0x80 = end. Deslocamentos >127 são partidos em múltiplos registos.
 */
import type { StitchBlock } from "./dst";

const clampI8 = (v: number) => Math.max(-127, Math.min(127, v));

export function encodeExp(blocks: StitchBlock[], pxPerMm: number): Blob {
  const bytes: number[] = [];
  let curX = 0, curY = 0;
  const emit = (dx: number, dy: number, jump: boolean) => {
    let remX = dx, remY = dy;
    while (Math.abs(remX) > 127 || Math.abs(remY) > 127) {
      const sx = clampI8(remX), sy = clampI8(remY);
      if (jump) bytes.push(0x80, 0x04);
      bytes.push(sx & 0xff, (-sy) & 0xff);
      remX -= sx; remY -= sy;
    }
    if (jump) bytes.push(0x80, 0x04);
    bytes.push(clampI8(remX) & 0xff, (-clampI8(remY)) & 0xff);
  };
  blocks.forEach((block, bi) => {
    if (bi > 0) bytes.push(0x80, 0x02, 0x00, 0x00);
    let first = true;
    for (const p of block.points) {
      const tx = Math.round((p.x / pxPerMm) * 10);
      const ty = Math.round((p.y / pxPerMm) * 10);
      emit(tx - curX, ty - curY, first);
      curX = tx; curY = ty; first = false;
    }
  });
  bytes.push(0x80, 0x80, 0x00, 0x00);
  return new Blob([new Uint8Array(bytes)], { type: "application/octet-stream" });
}
