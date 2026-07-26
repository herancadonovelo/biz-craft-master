// Motor puro do Editor de Gráficos: Tricô.
// Grelha, tradução gráfico→texto, matemática de tensão, colorwork, floats,
// wizards de construção. Todas as funções são deterministas e testáveis.

import { PONTOS_TRICOT, findPonto, type Terminologia } from "./dicionario";

export type Cell = { pontoId: string; cor?: string };
export interface Chart {
  cols: number;
  rows: number;
  /** [row 0 = bottom, row n-1 = top][col] */
  grid: Cell[][];
  /** intervalo de repetição horizontal (colunas). Se undefined, não há repeat. */
  repeatCols?: { start: number; end: number };
  /** oculta carreiras WS (pares) do render do gráfico */
  esconderWS?: boolean;
  /** paleta activa para colorwork */
  paleta?: { id: string; hex: string; nome: string }[];
}

export function emptyChart(cols = 20, rows = 20): Chart {
  return {
    cols, rows,
    grid: Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ pontoId: "meia" } as Cell)),
    ),
    esconderWS: true,
    paleta: [],
  };
}

/** Tradução gráfico → texto humano por carreira. RS = ímpar, WS = par. */
export function chartToText(chart: Chart, term: Terminologia = "pt"): string[] {
  const linhas: string[] = [];
  for (let r = 0; r < chart.rows; r++) {
    const isRS = r % 2 === 0; // C1 é RS
    const dir = isRS ? "direita→esquerda" : "esquerda→direita";
    if (!isRS && chart.esconderWS) {
      linhas.push(`C${r + 1} (avesso): tudo em liga.`);
      continue;
    }
    // Ordem de leitura
    const row = isRS ? [...chart.grid[r]].reverse() : chart.grid[r];
    // agrupar por ponto consecutivo
    const grupos: { pontoId: string; n: number }[] = [];
    for (const c of row) {
      const last = grupos[grupos.length - 1];
      if (last && last.pontoId === c.pontoId) last.n += 1;
      else grupos.push({ pontoId: c.pontoId, n: 1 });
    }
    const partes = grupos
      .filter((g) => g.pontoId !== "nostitch")
      .map((g) => {
        const p = findPonto(g.pontoId);
        const nome = p?.frase?.[term] ?? p?.abrev[term] ?? g.pontoId;
        return g.n > 1 ? `${g.n}× ${nome}` : nome;
      });
    linhas.push(`C${r + 1} (${isRS ? "direito" : "avesso"}, ${dir}): ${partes.join(", ")}.`);
  }
  return linhas;
}

/** Conta malhas produzidas por carreira (para validar múltiplos). */
export function malhasPorCarreira(chart: Chart): number[] {
  return chart.grid.map((row) =>
    row.reduce((sum, c) => sum + (findPonto(c.pontoId)?.produz ?? 1), 0),
  );
}

/* ============================ TENSÃO / GRADING ============================ */

export interface Gauge { pontos: number; carreiras: number; cm: number }

export function malhasParaCm(g: Gauge, cm: number): number {
  if (!g.pontos || !g.cm) return 0;
  return Math.round((g.pontos / g.cm) * cm);
}

export function carreirasParaCm(g: Gauge, cm: number): number {
  if (!g.carreiras || !g.cm) return 0;
  return Math.round((g.carreiras / g.cm) * cm);
}

/** Auto-grading: dado o tamanho base (M) em malhas e o delta em cm, devolve o número de malhas. */
export function escalonar(malhasBase: number, gauge: Gauge, deltaCm: number): number {
  return malhasBase + malhasParaCm(gauge, deltaCm);
}

export function verificarMultiplo(malhasMontadas: number, multiplo: number): { ok: boolean; sugestao?: [number, number] } {
  if (multiplo <= 0) return { ok: true };
  const r = malhasMontadas % multiplo;
  if (r === 0) return { ok: true };
  return { ok: false, sugestao: [malhasMontadas - r, malhasMontadas + (multiplo - r)] };
}

export function espacamentoBotoes(carreirasTotais: number, botoes: number): number[] {
  if (botoes <= 0 || carreirasTotais <= 0) return [];
  const step = carreirasTotais / (botoes + 1);
  return Array.from({ length: botoes }, (_, i) => Math.round(step * (i + 1)));
}

export function validarSimetriaDiminuicoes(row: Cell[]): { ok: boolean; msg?: string } {
  const first = row.find((c) => findPonto(c.pontoId)?.inclinacao);
  const last  = [...row].reverse().find((c) => findPonto(c.pontoId)?.inclinacao);
  if (!first || !last || first === last) return { ok: true };
  const a = findPonto(first.pontoId)?.inclinacao ?? 0;
  const b = findPonto(last.pontoId)?.inclinacao ?? 0;
  if (a === -b) return { ok: true };
  return { ok: false, msg: "Diminuições no início e no fim têm a mesma direção — simetria quebrada." };
}

/* ============================ COLORWORK ============================ */

export function consumoPorCor(chart: Chart, gauge: Gauge, gramasPor100m = 50): Record<string, { malhas: number; gramas: number }> {
  const out: Record<string, { malhas: number; gramas: number }> = {};
  for (const row of chart.grid) for (const c of row) {
    const cor = c.cor ?? "default";
    if (!out[cor]) out[cor] = { malhas: 0, gramas: 0 };
    out[cor].malhas += 1;
  }
  // Consumo: cada malha ≈ (10cm / pontos_por_10cm) de fio; em Fair Isle multiplica-se ×2 pelo float.
  const mmPorMalha = gauge.pontos ? (gauge.cm * 10) / gauge.pontos : 5;
  for (const key of Object.keys(out)) {
    const metros = (out[key].malhas * mmPorMalha) / 1000;
    out[key].gramas = Math.round((metros / 100) * gramasPor100m * 10) / 10;
  }
  return out;
}

/** Alerta de floats longos: retorna [{row, startCol, length, cor}]. */
export function detectarFloats(chart: Chart, maxRunPermitido = 5): { row: number; col: number; length: number; cor: string }[] {
  const alertas: { row: number; col: number; length: number; cor: string }[] = [];
  for (let r = 0; r < chart.rows; r++) {
    let start = 0;
    for (let c = 1; c <= chart.cols; c++) {
      const prev = chart.grid[r][c - 1]?.cor ?? "default";
      const cur  = chart.grid[r][c]?.cor ?? "default";
      if (c === chart.cols || cur !== prev) {
        const run = c - start;
        if (run > maxRunPermitido) alertas.push({ row: r, col: start, length: run, cor: prev });
        start = c;
      }
    }
  }
  return alertas;
}

export function inverterCores(chart: Chart, a: string, b: string): Chart {
  return {
    ...chart,
    grid: chart.grid.map((row) => row.map((c) => ({ ...c, cor: c.cor === a ? b : c.cor === b ? a : c.cor }))),
  };
}

/* ============================ CONSTRUÇÃO ============================ */

export interface RaglanInput { peitoCm: number; gauge: Gauge; percentGola?: number; percentManga?: number }
export interface RaglanOutput { totalMalhas: number; gola: number; manga: number; corpo: number; raglan: number }

export function gerarRaglanTopDown(inp: RaglanInput): RaglanOutput {
  const total = malhasParaCm(inp.gauge, inp.peitoCm);
  const golaPct = inp.percentGola ?? 0.4;
  const mangaPct = inp.percentManga ?? 0.28;
  const gola = Math.round(total * golaPct * 0.35); // ~35% do peito no início da gola
  const manga = Math.round(total * mangaPct / 2);
  const corpo = Math.round(total * 0.35 / 2);
  const raglan = 4; // 4 malhas de raglan (2 por diagonal)
  return { totalMalhas: total, gola, manga, corpo, raglan };
}

export interface SockInput { peCm: number; gauge: Gauge }
export function gerarMeia(inp: SockInput): { montar: number; calcanhar: number; ponte: number } {
  const circunferencia = Math.round(inp.peCm * 0.9); // aproximação: circunferência ≈ 90% do comprimento
  const montar = malhasParaCm(inp.gauge, circunferencia);
  const calcanhar = Math.round(montar / 2);
  const ponte = Math.round(montar / 4);
  return { montar, calcanhar, ponte };
}

/* ============================ PALETAS DE FIOS ============================ */

export const PALETAS = {
  drops: [
    { id: "drops-16", hex: "#f3e4c9", nome: "Drops Off White" },
    { id: "drops-38", hex: "#d94b3a", nome: "Drops Red" },
    { id: "drops-14", hex: "#2b4270", nome: "Drops Navy" },
    { id: "drops-46", hex: "#5f8259", nome: "Drops Forest Green" },
    { id: "drops-11", hex: "#c9a86a", nome: "Drops Camel" },
  ],
  rowan: [
    { id: "rowan-01", hex: "#f0ede4", nome: "Rowan Ecru" },
    { id: "rowan-02", hex: "#8a3d3a", nome: "Rowan Brick" },
    { id: "rowan-03", hex: "#324a5f", nome: "Rowan Slate" },
    { id: "rowan-04", hex: "#7a8f5f", nome: "Rowan Moss" },
  ],
  malabrigo: [
    { id: "mala-01", hex: "#f7d0b0", nome: "Malabrigo Natural" },
    { id: "mala-02", hex: "#b03a48", nome: "Malabrigo Ravelry Red" },
    { id: "mala-03", hex: "#3f5a7d", nome: "Malabrigo Marine" },
    { id: "mala-04", hex: "#a48ec8", nome: "Malabrigo Lavanda" },
  ],
} as const;

export type PaletaId = keyof typeof PALETAS;

/* ============================ EXPORT SVG ============================ */

const CELL = 22;

export function chartToSvg(chart: Chart, opts?: { darkMode?: boolean }): string {
  const w = chart.cols * CELL;
  const h = chart.rows * CELL;
  const bg = opts?.darkMode ? "#0f172a" : "#ffffff";
  const line = opts?.darkMode ? "#475569" : "#cbd5e1";
  const fg = opts?.darkMode ? "#f8fafc" : "#0f172a";
  let cells = "";
  for (let r = 0; r < chart.rows; r++) {
    const y = (chart.rows - 1 - r) * CELL;
    for (let c = 0; c < chart.cols; c++) {
      const cell = chart.grid[r][c];
      const p = findPonto(cell.pontoId);
      const x = c * CELL;
      const fill = cell.cor ?? bg;
      cells += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" fill="${fill}" stroke="${line}" stroke-width="0.5"/>`;
      if (p && p.id !== "nostitch") {
        cells += `<text x="${x + CELL / 2}" y="${y + CELL / 2 + 5}" font-size="14" text-anchor="middle" font-family="ui-monospace,monospace" fill="${fg}">${p.simbolo}</text>`;
      }
    }
  }
  let repeat = "";
  if (chart.repeatCols) {
    const rx = chart.repeatCols.start * CELL;
    const rw = (chart.repeatCols.end - chart.repeatCols.start + 1) * CELL;
    repeat = `<rect x="${rx}" y="0" width="${rw}" height="${h}" fill="none" stroke="#dc2626" stroke-width="2"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="${bg}"/>${cells}${repeat}</svg>`;
}
