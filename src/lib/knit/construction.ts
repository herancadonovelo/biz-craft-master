// Fase 4 — Construção & Acessórios do Editor de Gráficos: Tricô.
// Motor puro (sem UI) para wizards de raglan top-down e meias top-down,
// gestão de agulhas (circulares vs retas) e marcadores de ponto.

import type { Gauge } from "./engine";

/** Utilitário: cm → malhas usando a amostra (pontos por cm). */
function cmParaMalhas(cm: number, g: Gauge): number {
  const perCm = g.pontos / g.cm;
  return Math.max(0, Math.round(cm * perCm));
}
/** Utilitário: cm → carreiras usando a amostra (carreiras por cm). */
function cmParaCarreiras(cm: number, g: Gauge): number {
  const perCm = g.carreiras / g.cm;
  return Math.max(0, Math.round(cm * perCm));
}

// =============================================================
// RAGLAN TOP-DOWN (avançado)
// =============================================================
export interface RaglanInput {
  peitoCm: number;
  golaCm?: number;            // circunferência da gola (default 40)
  alturaCavaCm?: number;      // altura de raglan (default 20)
  gauge: Gauge;
  raglanCadaCarreiras?: number; // aumento cada N carreiras (default 2)
  aumentosPorCarreira?: number; // 8 = 2 por linha de raglan
  ease?: number;              // folga positiva/negativa em cm
}
export interface RaglanPlan {
  totalMalhas: number;
  gola: number;
  raglan: number;             // malhas por linha (marcador)
  corpo: number;              // malhas por meio-corpo
  manga: number;              // malhas por manga (no fim do raglan)
  aumentos: number;           // aumentos totais até fechar cava
  carreirasRaglan: number;
  schedule: string[];         // instruções carreira-a-carreira resumidas
}
export function gerarRaglanTopDown(input: RaglanInput): RaglanPlan {
  const {
    peitoCm, gauge,
    golaCm = 40, alturaCavaCm = 20,
    raglanCadaCarreiras = 2, aumentosPorCarreira = 8, ease = 0,
  } = input;
  const totalMalhas = cmParaMalhas(peitoCm + ease, gauge);
  const golaTotal = Math.max(60, cmParaMalhas(golaCm, gauge));
  const raglan = 2; // 2 malhas por marcador (linha de aumento)
  const carreirasRaglan = cmParaCarreiras(alturaCavaCm, gauge);
  const passos = Math.max(1, Math.floor(carreirasRaglan / raglanCadaCarreiras));
  const aumentos = passos * aumentosPorCarreira;
  const fim = golaTotal + aumentos + raglan * 4;
  // Distribuição típica: 2× costas, 2× frente, 2× mangas.
  const corpo = Math.max(4, Math.round((fim - raglan * 4) * 0.36));
  const manga = Math.max(4, Math.round((fim - raglan * 4 - corpo * 2) / 2));
  const schedule = [
    `Montar ${golaTotal} malhas na gola e distribuir por 4 marcadores.`,
    `Aumentar 1 malha antes e depois de cada marcador a cada ${raglanCadaCarreiras} carreiras.`,
    `Repetir ${passos} vezes (${carreirasRaglan} carreiras totais).`,
    `Ao chegar a ${corpo * 2 + raglan * 2} malhas no corpo, retirar as mangas em fio waste.`,
    `Continuar corpo até atingir comprimento desejado.`,
  ];
  return {
    totalMalhas, gola: golaTotal, raglan,
    corpo, manga, aumentos, carreirasRaglan, schedule,
  };
}

// =============================================================
// SOCK WIZARD (toe-up ou cuff-down)
// =============================================================
export interface SockInput {
  peCm: number;
  circunferenciaPeCm?: number;   // default = peCm * 0.9
  alturaCanoCm?: number;         // default 15
  gauge: Gauge;
  metodo?: "toe-up" | "cuff-down";
}
export interface SockPlan {
  montar: number;
  calcanhar: number;
  ponte: number;
  cano: number;
  puxaresBico: number;
  metodo: "toe-up" | "cuff-down";
  schedule: string[];
}
export function gerarMeia(input: SockInput): SockPlan {
  const { peCm, gauge, alturaCanoCm = 15, metodo = "cuff-down" } = input;
  const circ = input.circunferenciaPeCm ?? peCm * 0.9;
  const montar = Math.max(24, cmParaMalhas(circ, gauge));
  const calcanhar = Math.floor(montar / 2);
  const ponte = montar - calcanhar;
  const cano = cmParaCarreiras(alturaCanoCm, gauge);
  const puxaresBico = Math.floor(montar / 4);
  const schedule = metodo === "cuff-down"
    ? [
        `Montar ${montar} malhas e fechar em círculo.`,
        `Trabalhar ${cano} carreiras de cano (elástico + liga direita).`,
        `Calcanhar plano sobre ${calcanhar} malhas (~${Math.round(calcanhar * 0.7)} carreiras).`,
        `Formar ponte, recuperar malhas e retomar circular.`,
        `Diminuir bico até ${puxaresBico} malhas, fechar com Kitchener.`,
      ]
    : [
        `Cast-on Judy's Magic com ${puxaresBico * 2} malhas no bico.`,
        `Aumentar em cada agulha até ${montar} malhas totais.`,
        `Trabalhar até 5 cm antes do tornozelo.`,
        `Calcanhar com short-rows sobre ${calcanhar} malhas.`,
        `Cano de ${cano} carreiras e fechar com casta-off elástica.`,
      ];
  return { montar, calcanhar, ponte, cano, puxaresBico, metodo, schedule };
}

// =============================================================
// AGULHAS: circular vs reta
// =============================================================
export type TipoAgulha = "reta" | "circular" | "dpn";
export interface RecomendacaoAgulha {
  tipo: TipoAgulha;
  comprimentoCm?: number;
  motivo: string;
}
/**
 * Recomenda tipo de agulha em função de circunferência prevista.
 * <20 cm → DPN ou magic loop; 20-40 → circular 40 cm; 40-80 → circular 60/80 cm;
 * >80 → circular 100 cm.
 */
export function recomendarAgulha(
  circCm: number,
  circular: boolean,
): RecomendacaoAgulha {
  if (!circular) {
    return { tipo: "reta", motivo: "Trabalho plano — retas convencionais bastam." };
  }
  if (circCm < 20) {
    return {
      tipo: "dpn",
      motivo: "Circunferência muito pequena: usa 4-5 DPN ou magic loop.",
    };
  }
  if (circCm < 40) {
    return {
      tipo: "circular", comprimentoCm: 40,
      motivo: "Circular curta de 40 cm evita esticar as malhas.",
    };
  }
  if (circCm < 80) {
    return {
      tipo: "circular", comprimentoCm: 60,
      motivo: "Circular de 60-80 cm cabe todo o corpo confortavelmente.",
    };
  }
  return {
    tipo: "circular", comprimentoCm: 100,
    motivo: "Peça grande: usa cabo longo (100 cm+) para não amontoar.",
  };
}

// =============================================================
// MARCADORES DE PONTO
// =============================================================
export interface Marcador {
  id: string;
  cor: string;
  posicao: number;         // índice de malha (0-based)
  nota?: string;
}
export function addMarcador(
  lista: Marcador[],
  posicao: number,
  cor = "#ef4444",
  nota?: string,
): Marcador[] {
  return [
    ...lista,
    { id: `mk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, cor, posicao, nota },
  ].sort((a, b) => a.posicao - b.posicao);
}
export function removerMarcador(lista: Marcador[], id: string): Marcador[] {
  return lista.filter((m) => m.id !== id);
}
/** Distribui N marcadores igualmente ao longo de `totalMalhas`. */
export function distribuirMarcadores(totalMalhas: number, n: number, cor = "#22c55e"): Marcador[] {
  if (n <= 0 || totalMalhas <= 0) return [];
  const passo = totalMalhas / n;
  return Array.from({ length: n }, (_, i) => ({
    id: `mk-dist-${i}`,
    cor,
    posicao: Math.round(i * passo),
    nota: i === 0 ? "início" : `secção ${i + 1}`,
  }));
}
