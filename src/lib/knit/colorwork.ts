// Motor puro de Colorwork / Fair Isle (Fase 3 — Editor de Gráficos: Tricô).
// Consumo por cor com float multiplier, estatísticas de floats, contraste, troca
// de duas cores e pintura de fundo. Sem dependências de React.

import type { Chart, Gauge } from "./engine";
import { detectarFloats, inverterCores } from "./engine";

export interface ConsumoLinha {
  cor: string;
  malhas: number;
  metros: number;
  gramas: number;
  novelos: number;
}

export interface ConsumoOpts {
  gramasPor100m?: number;      // default 50 (fingering)
  metrosPorNovelo?: number;    // default 200
  floatMultiplier?: number;    // Fair Isle ≈ 1.8× — 2× por causa dos floats
}

export function consumoAvancado(chart: Chart, gauge: Gauge, opts: ConsumoOpts = {}): ConsumoLinha[] {
  const gramasPor100m = opts.gramasPor100m ?? 50;
  const metrosPorNovelo = opts.metrosPorNovelo ?? 200;
  const floatMul = opts.floatMultiplier ?? 1.8;

  const contagem = new Map<string, number>();
  for (const row of chart.grid) for (const c of row) {
    const cor = c.cor ?? "default";
    contagem.set(cor, (contagem.get(cor) ?? 0) + 1);
  }
  // Metros por malha ≈ (largura da malha em cm) × 1.5 (loop + tension).
  const cmPorMalha = gauge.pontos ? (gauge.cm / gauge.pontos) : 0.5;
  const metrosPorMalha = (cmPorMalha * 1.5) / 100;

  const out: ConsumoLinha[] = [];
  for (const [cor, malhas] of contagem) {
    // Aplica multiplier a cores minoritárias (não à cor dominante, que é o fundo).
    const isMinoritaria = malhas < (chart.cols * chart.rows) / 2;
    const factor = cor === "default" ? 1 : (isMinoritaria ? floatMul : 1);
    const metros = malhas * metrosPorMalha * factor;
    const gramas = (metros / 100) * gramasPor100m;
    out.push({
      cor, malhas,
      metros: Math.round(metros * 10) / 10,
      gramas: Math.round(gramas * 10) / 10,
      novelos: Math.max(1, Math.ceil(metros / metrosPorNovelo)),
    });
  }
  return out.sort((a, b) => b.malhas - a.malhas);
}

export interface FloatStats {
  total: number;
  acima: number;      // > max
  pior: number;       // maior float encontrado
  media: number;      // comprimento médio dos runs > 1
  porCor: Record<string, number>;
}

export function estatisticasFloats(chart: Chart, max: number): FloatStats {
  const alertas = detectarFloats(chart, max);
  const porCor: Record<string, number> = {};
  let pior = 0;
  let soma = 0;
  for (const a of alertas) {
    porCor[a.cor] = (porCor[a.cor] ?? 0) + 1;
    if (a.length > pior) pior = a.length;
    soma += a.length;
  }
  return {
    total: alertas.length,
    acima: alertas.length,
    pior,
    media: alertas.length ? Math.round((soma / alertas.length) * 10) / 10 : 0,
    porCor,
  };
}

/* ============================ CONTRASTE (WCAG-ish) ============================ */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = h.length === 3
    ? h.split("").map((c) => parseInt(c + c, 16))
    : [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  return [n[0] || 0, n[1] || 0, n[2] || 0];
}
function relLum(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
/** Rácio 1–21. Fair Isle legível recomenda ≥ 3. */
export function contrastRatio(a: string, b: string): number {
  const la = relLum(a), lb = relLum(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

/* ============================ OPERAÇÕES SOBRE O CHART ============================ */

export function trocarCores(chart: Chart, a: string, b: string): Chart {
  return inverterCores(chart, a, b);
}

export function aplicarCorFundo(chart: Chart, cor: string): Chart {
  return {
    ...chart,
    grid: chart.grid.map((row) => row.map((c) => (c.cor ? c : { ...c, cor }))),
  };
}

/** Recebe uma matriz [row][col] de cores hex (ou vazio) e pinta o chart. */
export function pixelArtFromMatrix(chart: Chart, matriz: string[][]): Chart {
  const grid = chart.grid.map((row, r) =>
    row.map((c, col) => {
      const px = matriz[r]?.[col];
      return px ? { ...c, cor: px } : c;
    }),
  );
  return { ...chart, grid };
}

export function coresDominantes(chart: Chart, n = 5): string[] {
  const contagem = new Map<string, number>();
  for (const row of chart.grid) for (const c of row) {
    if (!c.cor) continue;
    contagem.set(c.cor, (contagem.get(c.cor) ?? 0) + 1);
  }
  return [...contagem.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);
}