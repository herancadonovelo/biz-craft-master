// Motor puro de matemática e escalonamento (Fase 2 — Editor de Gráficos: Tricô).
// Depende apenas de `engine.ts` (tipo Gauge) e é 100% determinista/testável.

import type { Chart, Cell, Gauge } from "./engine";
import { malhasParaCm, carreirasParaCm, verificarMultiplo, validarSimetriaDiminuicoes } from "./engine";
import { findPonto } from "./dicionario";

/* ============================ TAMANHOS STD ============================ */

export type SizeKey = "XS" | "S" | "M" | "L" | "XL" | "XXL";

/** Diferença de peito em cm em relação ao tamanho base (M) — convenção da indústria. */
export const SIZES_STD: { key: SizeKey; deltaCm: number }[] = [
  { key: "XS",  deltaCm: -10 },
  { key: "S",   deltaCm: -5  },
  { key: "M",   deltaCm: 0   },
  { key: "L",   deltaCm: +5  },
  { key: "XL",  deltaCm: +10 },
  { key: "XXL", deltaCm: +15 },
];

export interface GradingRow {
  size: SizeKey;
  peitoCm: number;
  malhas: number;
  /** Malhas ajustadas ao múltiplo mais próximo (para padrões de renda/torçadas). */
  malhasAjustadas: number;
  /** Se `malhasAjustadas !== malhas`, diferença aplicada (positiva ou negativa). */
  ajuste: number;
}

/** Auto-grading multi-tamanho, opcionalmente respeitando um múltiplo obrigatório. */
export function graduar(peitoBaseCm: number, gauge: Gauge, multiplo = 1, sizes = SIZES_STD): GradingRow[] {
  const m = Math.max(1, multiplo | 0);
  return sizes.map((s) => {
    const peito = peitoBaseCm + s.deltaCm;
    const malhas = malhasParaCm(gauge, peito);
    const resto = malhas % m;
    // Arredonda ao múltiplo mais próximo (empate → para cima).
    const malhasAjustadas = resto === 0
      ? malhas
      : (resto * 2 >= m ? malhas + (m - resto) : malhas - resto);
    return {
      size: s.key,
      peitoCm: peito,
      malhas,
      malhasAjustadas,
      ajuste: malhasAjustadas - malhas,
    };
  });
}

/** Formato de padrão profissional: "60 (64, 68, 72, 76, 80)". */
export function formatarParenteses(values: number[]): string {
  if (values.length === 0) return "";
  const [first, ...rest] = values;
  if (rest.length === 0) return String(first);
  return `${first} (${rest.join(", ")})`;
}

/* ============================ CAVAS E DECOTES ============================ */

export interface ArmholeInput {
  malhasPeito: number;
  larguraCavaCm: number;    // profundidade da cava em cm
  gauge: Gauge;
  bindOffInicial?: number;  // malhas a rematar de uma vez no início (default: 5% do peito)
}

export interface ArmholeStep { carreira: number; tipo: "bind-off" | "dec2" | "dec1"; malhas: number }

export interface ArmholeOutput {
  bindOffCadaLado: number;
  totalDiminuicoes: number;
  malhasFinaisOmbro: number;
  passos: ArmholeStep[];
}

/** Cálculo clássico de cava: bind-off inicial + dec2/dec1 alternadas até atingir profundidade. */
export function calcularCava(inp: ArmholeInput): ArmholeOutput {
  const bindOff = inp.bindOffInicial ?? Math.max(2, Math.round(inp.malhasPeito * 0.05));
  // Assumimos ~15% do peito perdido por lado numa cava clássica.
  const totalDim = Math.max(bindOff, Math.round(inp.malhasPeito * 0.15));
  const restante = Math.max(0, totalDim - bindOff);
  const carreirasTotais = Math.max(2, carreirasParaCm(inp.gauge, inp.larguraCavaCm));
  const passos: ArmholeStep[] = [{ carreira: 1, tipo: "bind-off", malhas: bindOff }];
  // Distribui `restante` em passos alternados (dec2 nas primeiras, dec1 nas restantes).
  const dec2 = Math.ceil(restante / 3);
  const dec1 = restante - dec2 * 2 > 0 ? restante - dec2 * 2 : 0;
  let carreira = 3;
  for (let i = 0; i < dec2; i++) {
    passos.push({ carreira, tipo: "dec2", malhas: 2 });
    carreira += 2;
  }
  for (let i = 0; i < dec1; i++) {
    passos.push({ carreira, tipo: "dec1", malhas: 1 });
    carreira += 2;
  }
  // Trunca ao número de carreiras da cava.
  const passosOk = passos.filter((p) => p.carreira <= carreirasTotais);
  return {
    bindOffCadaLado: bindOff,
    totalDiminuicoes: totalDim,
    malhasFinaisOmbro: inp.malhasPeito - totalDim * 2,
    passos: passosOk,
  };
}

export interface NecklineInput {
  malhasPeito: number;
  tipo: "V" | "redondo";
  larguraDecoteCm: number;
  profundidadeCm: number;
  gauge: Gauge;
}

export function calcularDecote(inp: NecklineInput): { malhasCentro: number; diminuicoesPorLado: number; carreiras: number; passo: number } {
  const malhasDecote = malhasParaCm(inp.gauge, inp.larguraDecoteCm);
  const carreiras = Math.max(2, carreirasParaCm(inp.gauge, inp.profundidadeCm));
  const malhasCentro = inp.tipo === "redondo" ? Math.round(malhasDecote / 3) : 1;
  const porLado = Math.max(0, Math.round((malhasDecote - malhasCentro) / 2));
  const passo = Math.max(1, Math.round(carreiras / Math.max(1, porLado)));
  return { malhasCentro, diminuicoesPorLado: porLado, carreiras, passo };
}

/* ============================ SIMETRIA CHART COMPLETO ============================ */

export interface SimetriaResult { ok: boolean; problemas: { row: number; msg: string }[] }

export function validarSimetriaChart(chart: Chart): SimetriaResult {
  const problemas: { row: number; msg: string }[] = [];
  for (let r = 0; r < chart.rows; r++) {
    const row: Cell[] = chart.grid[r];
    const v = validarSimetriaDiminuicoes(row);
    if (!v.ok) problemas.push({ row: r + 1, msg: v.msg ?? "quebra" });
  }
  return { ok: problemas.length === 0, problemas };
}

/* ============================ MÚLTIPLOS (WRAPPER) ============================ */

export function verificarMultiploComBordas(malhas: number, multiplo: number, bordas = 0) {
  const alvo = malhas - bordas * 2;
  const r = verificarMultiplo(alvo, multiplo);
  if (r.ok) return { ok: true as const };
  return { ok: false as const, sugestao: r.sugestao?.map((n) => n + bordas * 2) as [number, number] };
}

/* ============================ CASAS DE BOTÃO (v2) ============================ */

/** Espaçamento com margens topo/base configuráveis. */
export function espacamentoBotoesAvancado(
  carreirasTotais: number,
  botoes: number,
  margemInferior = 0,
  margemSuperior = 0,
): number[] {
  if (botoes <= 0) return [];
  const inicio = margemInferior;
  const fim = Math.max(inicio + 1, carreirasTotais - margemSuperior);
  if (botoes === 1) return [Math.round((inicio + fim) / 2)];
  const step = (fim - inicio) / (botoes - 1);
  return Array.from({ length: botoes }, (_, i) => Math.round(inicio + step * i));
}

/* ============================ HELPERS ============================ */

/** Malhas totais que uma carreira produz (para debug/QA). */
export function malhasProduzidas(row: Cell[]): number {
  return row.reduce((sum, c) => sum + (findPonto(c.pontoId)?.produz ?? 1), 0);
}