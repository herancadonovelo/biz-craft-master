/**
 * Fase 15 — Divisão multi-bastidor com marcas de registo (re-hoop).
 *
 * Estende o `splitByHoop` original: em vez de cortar peças que caem entre
 * bastidores, cria uma banda de sobreposição configurável e injeta pontos
 * de "cruz de registo" nas mesmas coordenadas absolutas em bastidores
 * vizinhos. Assim quem borda pode alinhar o segundo hoop sobre a cruz que
 * já ficou bordada no primeiro, evitando desvios ao re-enfronhar o tecido.
 */
import type { StitchBlock } from "./dst";

type StitchPoint = { x: number; y: number };

export interface HoopTile {
  index: number;
  row: number;
  col: number;
  /** Origem absoluta (px) do tile no design original — útil para o guia impresso. */
  originAbs: { x: number; y: number };
  /** Blocos com coordenadas locais (0..hoopWpx). */
  blocks: StitchBlock[];
  /** Cruzes de registo em coordenadas locais (para overlay/impressão). */
  registrationMarks: { x: number; y: number }[];
}

export interface SplitOptions {
  hoopWpx: number;
  hoopHpx: number;
  /** Sobreposição entre bastidores (px). Recomendado 15–25 mm. */
  overlapPx: number;
  /** Margem interna do bastidor (px) — zona morta perto do aro. */
  marginPx: number;
  /** Cor das cruzes de registo. */
  markColor?: string;
  /** Tamanho de cada cruz (px). */
  markSizePx?: number;
}

function crossPoints(cx: number, cy: number, sizePx: number): StitchPoint[] {
  const h = sizePx / 2;
  return [
    { x: cx - h, y: cy }, { x: cx + h, y: cy },
    { x: cx, y: cy - h }, { x: cx, y: cy + h },
  ];
}

/**
 * Divide blocos em tiles de bastidor com overlap e marcas de registo alinhadas.
 * As cruzes ficam nos cantos partilhados entre bastidores adjacentes.
 */
export function splitByHoopWithRegistration(
  blocks: StitchBlock[],
  opts: SplitOptions,
): HoopTile[] {
  if (blocks.length === 0) return [];
  const { hoopWpx, hoopHpx, overlapPx, marginPx } = opts;
  const markColor = opts.markColor ?? "#ff2d55";
  const markSize = opts.markSizePx ?? 8;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const b of blocks) for (const p of b.points) {
    if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y;
  }
  const usableW = Math.max(1, hoopWpx - marginPx * 2);
  const usableH = Math.max(1, hoopHpx - marginPx * 2);
  const stepW = Math.max(1, usableW - overlapPx);
  const stepH = Math.max(1, usableH - overlapPx);
  const cols = Math.max(1, Math.ceil((maxX - minX - overlapPx) / stepW));
  const rows = Math.max(1, Math.ceil((maxY - minY - overlapPx) / stepH));

  const tiles: HoopTile[] = [];
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ax0 = minX + c * stepW;
      const ay0 = minY + r * stepH;
      const ax1 = ax0 + usableW;
      const ay1 = ay0 + usableH;
      const localBlocks: StitchBlock[] = [];
      for (const b of blocks) {
        const pts = b.points
          .filter((p) => p.x >= ax0 && p.x < ax1 && p.y >= ay0 && p.y < ay1)
          .map((p) => ({ x: p.x - ax0 + marginPx, y: p.y - ay0 + marginPx }));
        if (pts.length > 0) localBlocks.push({ ...b, points: pts });
      }
      // Marcas de registo nos cantos partilhados (não em fronteiras do design).
      const marks: { x: number; y: number }[] = [];
      const addMark = (ax: number, ay: number) => {
        marks.push({ x: ax - ax0 + marginPx, y: ay - ay0 + marginPx });
      };
      if (c < cols - 1) { addMark(ax1 - overlapPx / 2, ay0 + overlapPx / 2); addMark(ax1 - overlapPx / 2, ay1 - overlapPx / 2); }
      if (r < rows - 1) { addMark(ax0 + overlapPx / 2, ay1 - overlapPx / 2); addMark(ax1 - overlapPx / 2, ay1 - overlapPx / 2); }
      // Injeta cruzes como bloco final (cor dedicada, pontos curtos).
      if (marks.length > 0) {
        const pts: StitchPoint[] = [];
        for (const m of marks) pts.push(...crossPoints(m.x, m.y, markSize));
        localBlocks.push({ color: markColor, label: "registo", points: pts });
      }
      if (localBlocks.length > 0 || marks.length > 0) {
        tiles.push({
          index: idx++, row: r, col: c,
          originAbs: { x: ax0 - marginPx, y: ay0 - marginPx },
          blocks: localBlocks,
          registrationMarks: marks,
        });
      }
    }
  }
  return tiles;
}

/**
 * Gera SVG A4 com esquema de posicionamento (tiles numerados, cruzes,
 * cantos de corte). Para impressão como guia de re-hoop.
 */
export function buildRehoopGuideSvg(tiles: HoopTile[], opts: SplitOptions & { pageWpx: number; pageHpx: number }): string {
  const { hoopWpx, hoopHpx, pageWpx, pageHpx } = opts;
  if (tiles.length === 0) return "";
  const minX = Math.min(...tiles.map((t) => t.originAbs.x));
  const minY = Math.min(...tiles.map((t) => t.originAbs.y));
  const maxX = Math.max(...tiles.map((t) => t.originAbs.x + hoopWpx));
  const maxY = Math.max(...tiles.map((t) => t.originAbs.y + hoopHpx));
  const scale = Math.min((pageWpx - 60) / (maxX - minX), (pageHpx - 100) / (maxY - minY));
  const ox = 30 - minX * scale;
  const oy = 60 - minY * scale;
  const rects = tiles.map((t) => `
    <g>
      <rect x="${t.originAbs.x * scale + ox}" y="${t.originAbs.y * scale + oy}"
            width="${hoopWpx * scale}" height="${hoopHpx * scale}"
            fill="none" stroke="#0f172a" stroke-dasharray="4 3" />
      <text x="${(t.originAbs.x + hoopWpx / 2) * scale + ox}" y="${(t.originAbs.y + hoopHpx / 2) * scale + oy}"
            text-anchor="middle" font-family="sans-serif" font-size="14" fill="#0f172a">#${t.index + 1}</text>
      ${t.registrationMarks.map((m) => {
        const ax = (t.originAbs.x + m.x) * scale + ox;
        const ay = (t.originAbs.y + m.y) * scale + oy;
        return `<g stroke="#ff2d55" stroke-width="1"><line x1="${ax - 4}" y1="${ay}" x2="${ax + 4}" y2="${ay}"/><line x1="${ax}" y1="${ay - 4}" x2="${ax}" y2="${ay + 4}"/></g>`;
      }).join("")}
    </g>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${pageWpx}" height="${pageHpx}" viewBox="0 0 ${pageWpx} ${pageHpx}">
    <rect width="100%" height="100%" fill="#fff"/>
    <text x="30" y="30" font-family="sans-serif" font-size="16" font-weight="700" fill="#0f172a">Guia de re-hoop — ${tiles.length} bastidor(es)</text>
    <text x="30" y="48" font-family="sans-serif" font-size="11" fill="#475569">Alinhe as cruzes vermelhas ao reposicionar o tecido em cada bastidor.</text>
    ${rects}
  </svg>`;
}