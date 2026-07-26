/**
 * Fase 5 do Estúdio de Bordado — exportador Tajima DST.
 *
 * O DST é o formato universal de bordado à máquina. Cada registo tem 3 bytes
 * (24 bits) e codifica um deslocamento relativo em passos de 0.1 mm dentro de
 * ±121 unidades, mais flags de "jump" (deslocamento sem ponto), "color change"
 * e "end". Deslocamentos maiores são partidos em vários registos.
 *
 * Referências: livro branco da Tajima e implementações open source (pyembroidery).
 */

export type Stitch = { dx: number; dy: number; jump?: boolean; colorChange?: boolean; end?: boolean };
export type StitchBlock = { color: string; label: string; points: { x: number; y: number }[] };

/** Converte um path "M x y L x y ... M x y L x y ..." num array de sub-caminhos. */
export function splitSubpaths(d: string): { x: number; y: number }[][] {
  const toks = d.replace(/,/g, " ").split(/\s+/).filter(Boolean);
  const out: { x: number; y: number }[][] = [];
  let cur: { x: number; y: number }[] = [];
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (t === "M" || t === "L") {
      const x = parseFloat(toks[++i]);
      const y = parseFloat(toks[++i]);
      if (isNaN(x) || isNaN(y)) continue;
      if (t === "M") { if (cur.length) out.push(cur); cur = [{ x, y }]; }
      else cur.push({ x, y });
    }
  }
  if (cur.length) out.push(cur);
  return out;
}

/**
 * Reamostra um sub-caminho para pontos igualmente espaçados de `stepMm` mm.
 * `pxPerMm` converte unidades SVG para mm físicos.
 */
export function resample(sub: { x: number; y: number }[], stepPx: number): { x: number; y: number }[] {
  if (sub.length < 2) return sub.slice();
  const out: { x: number; y: number }[] = [sub[0]];
  let carry = 0;
  for (let i = 0; i < sub.length - 1; i++) {
    const a = sub[i], b = sub[i + 1];
    const dx = b.x - a.x, dy = b.y - a.y;
    const L = Math.hypot(dx, dy);
    if (L === 0) continue;
    let t = -carry;
    while (t + stepPx <= L) {
      t += stepPx;
      out.push({ x: a.x + (dx * t) / L, y: a.y + (dy * t) / L });
    }
    carry = L - t;
  }
  // Garante o último ponto para não perder o final do path
  const last = out[out.length - 1], end = sub[sub.length - 1];
  if (Math.hypot(last.x - end.x, last.y - end.y) > 0.5) out.push(end);
  return out;
}

/** Ordena sub-caminhos por vizinho mais próximo para minimizar saltos. */
export function orderNearest(subs: { x: number; y: number }[][]): { x: number; y: number }[][] {
  if (subs.length <= 1) return subs.slice();
  const used = new Array(subs.length).fill(false);
  const out: { x: number; y: number }[][] = [];
  let cur = subs[0]; used[0] = true; out.push(cur);
  for (let n = 1; n < subs.length; n++) {
    const last = cur[cur.length - 1];
    let best = -1, bd = Infinity, reverse = false;
    for (let i = 0; i < subs.length; i++) {
      if (used[i]) continue;
      const s = subs[i];
      const dStart = Math.hypot(s[0].x - last.x, s[0].y - last.y);
      const dEnd = Math.hypot(s[s.length - 1].x - last.x, s[s.length - 1].y - last.y);
      if (dStart < bd) { bd = dStart; best = i; reverse = false; }
      if (dEnd < bd) { bd = dEnd; best = i; reverse = true; }
    }
    if (best < 0) break;
    used[best] = true;
    cur = reverse ? subs[best].slice().reverse() : subs[best];
    out.push(cur);
  }
  return out;
}

/** Constrói a sequência bruta de stitches (0.1 mm) a partir dos blocos. */
export function buildStitches(blocks: StitchBlock[], pxPerMm: number): Stitch[] {
  const stitches: Stitch[] = [];
  let last: { x: number; y: number } | null = null;
  blocks.forEach((block, bi) => {
    if (bi > 0) stitches.push({ dx: 0, dy: 0, colorChange: true });
    for (const p of block.points) {
      // DST usa coord Y invertido (para cima positivo). SVG usa Y para baixo.
      const px = (p.x / pxPerMm) * 10; // 0.1 mm
      const py = -(p.y / pxPerMm) * 10;
      if (!last) { last = { x: px, y: py }; continue; }
      let dx = Math.round(px - last.x), dy = Math.round(py - last.y);
      const dist = Math.hypot(dx, dy);
      const isJump = dist > 121; // máx por registo — força salto
      // Parte deslocamentos maiores em vários registos de ±121
      while (Math.abs(dx) > 121 || Math.abs(dy) > 121) {
        const stepX = Math.max(-121, Math.min(121, dx));
        const stepY = Math.max(-121, Math.min(121, dy));
        stitches.push({ dx: stepX, dy: stepY, jump: true });
        dx -= stepX; dy -= stepY;
      }
      stitches.push({ dx, dy, jump: isJump });
      last = { x: px, y: py };
    }
  });
  stitches.push({ dx: 0, dy: 0, end: true });
  return stitches;
}

/** Codifica um único stitch em 3 bytes segundo a tabela Tajima. */
function encodeStitch(s: Stitch): number[] {
  if (s.end) return [0, 0, 0xf3];
  if (s.colorChange) return [0, 0, 0xc3];
  const b = [0, 0, s.jump ? 0x83 : 0x03];
  const setBit = (byte: number, bit: number) => { b[byte] |= 1 << bit; };
  const set = (dx: number, dy: number) => {
    const table: Array<[number, [number, number]]> = [
      // dx: bit index → weight
      [dx >= +81 ? 1 : 0, [2, 2]], [dx <= -81 ? 1 : 0, [2, 3]],
      [dx >= +27 && dx < +81 ? 1 : 0, [1, 2]], [dx <= -27 && dx > -81 ? 1 : 0, [1, 3]],
      [dx >= +9 && dx < +27 ? 1 : 0, [2, 0]],  [dx <= -9 && dx > -27 ? 1 : 0, [2, 1]],
      [dx >= +3 && dx < +9 ? 1 : 0, [1, 0]],   [dx <= -3 && dx > -9 ? 1 : 0, [1, 1]],
      [dx === +1 || dx === +2 ? 1 : 0, [0, 0]], [dx === -1 || dx === -2 ? 1 : 0, [0, 1]],
      [dy >= +81 ? 1 : 0, [2, 5]], [dy <= -81 ? 1 : 0, [2, 4]],
      [dy >= +27 && dy < +81 ? 1 : 0, [1, 5]], [dy <= -27 && dy > -81 ? 1 : 0, [1, 4]],
      [dy >= +9 && dy < +27 ? 1 : 0, [2, 7]],  [dy <= -9 && dy > -27 ? 1 : 0, [2, 6]],
      [dy >= +3 && dy < +9 ? 1 : 0, [1, 7]],   [dy <= -3 && dy > -9 ? 1 : 0, [1, 6]],
      [dy === +1 || dy === +2 ? 1 : 0, [0, 7]], [dy === -1 || dy === -2 ? 1 : 0, [0, 6]],
    ];
    for (const [on, [byte, bit]] of table) if (on) setBit(byte, bit);
  };
  set(s.dx, s.dy);
  return b;
}

/** Gera um Blob DST completo (cabeçalho 512 bytes + registos). */
export function encodeDst(blocks: StitchBlock[], pxPerMm: number, label = "CBM"): Blob {
  const stitches = buildStitches(blocks, pxPerMm);
  // Estatísticas
  let x = 0, y = 0, minX = 0, minY = 0, maxX = 0, maxY = 0;
  let jumps = 0, colorChanges = 0, count = 0;
  for (const s of stitches) {
    if (s.end) break;
    if (s.colorChange) { colorChanges++; continue; }
    if (s.jump) jumps++;
    x += s.dx; y += s.dy;
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    count++;
  }
  const header = new Uint8Array(512);
  header.fill(0x20); // spaces
  const write = (offset: number, txt: string) => {
    for (let i = 0; i < txt.length; i++) header[offset + i] = txt.charCodeAt(i);
  };
  const pad = (n: number, w = 5) => {
    const sign = n < 0 ? "-" : "+";
    return sign + String(Math.abs(n)).padStart(w, "0");
  };
  write(0, "LA:" + label.slice(0, 16).padEnd(17, " "));
  write(20, "ST:" + String(count).padStart(7, "0"));
  write(0x20, "\r"); // line feed
  write(31, "CO:" + String(colorChanges).padStart(3, "0"));
  write(0x2b, "\r");
  write(42, "+X:" + String(maxX).padStart(5, "0"));
  write(53, "-X:" + String(-minX).padStart(5, "0"));
  write(64, "+Y:" + String(maxY).padStart(5, "0"));
  write(75, "-Y:" + String(-minY).padStart(5, "0"));
  write(86, "AX:" + pad(x));
  write(98, "AY:" + pad(y));
  write(110, "MX:" + pad(0));
  write(122, "MY:" + pad(0));
  write(134, "PD:******");
  header[155] = 0x1a; // EOF do cabeçalho

  const body = new Uint8Array(stitches.length * 3);
  for (let i = 0; i < stitches.length; i++) {
    const [a, b, c] = encodeStitch(stitches[i]);
    body[i * 3] = a; body[i * 3 + 1] = b; body[i * 3 + 2] = c;
  }
  return new Blob([header, body], { type: "application/octet-stream" });
}

/** Estimativa rápida: nº de pontos e nº de mudanças de cor a partir dos blocos. */
export function estimateStitches(blocks: StitchBlock[], pxPerMm: number, stepMm: number) {
  const stepPx = stepMm * pxPerMm;
  let count = 0;
  for (const b of blocks) {
    let last: { x: number; y: number } | null = null;
    for (const p of b.points) {
      if (last) count += 1;
      last = p;
    }
    // resample expande os pontos, o cálculo já é feito sobre pontos re-amostrados
  }
  return { count, colorChanges: Math.max(0, blocks.length - 1), stepPx };
}