/**
 * Fase 5 do editor de moodboards: seleção múltipla.
 * Funções puras sobre retângulos (sem DOM) para alinhar/mover conjuntos.
 */
import type { AlignRect, AlinhamentoPagina } from "./moodboard-align";

export interface Caixa { x: number; y: number; w: number; h: number }

/** Caixa envolvente de um conjunto de retângulos. */
export function caixaEnvolvente(rects: AlignRect[]): Caixa | null {
  if (!rects.length) return null;
  const x = Math.min(...rects.map((r) => r.x));
  const y = Math.min(...rects.map((r) => r.y));
  const x2 = Math.max(...rects.map((r) => r.x + r.w));
  const y2 = Math.max(...rects.map((r) => r.y + r.h));
  return { x, y, w: x2 - x, h: y2 - y };
}

/**
 * Alinha os retângulos entre si, usando a caixa envolvente do conjunto
 * como referência. Devolve apenas as coordenadas alteradas.
 */
export function alinharConjunto(
  rects: AlignRect[],
  modo: AlinhamentoPagina,
): Array<{ id: string; x?: number; y?: number }> {
  const cx = caixaEnvolvente(rects);
  if (!cx || rects.length < 2) return [];
  return rects.map((r) => {
    switch (modo) {
      case "esquerda": return { id: r.id, x: cx.x };
      case "direita": return { id: r.id, x: Math.round(cx.x + cx.w - r.w) };
      case "centro-h": return { id: r.id, x: Math.round(cx.x + (cx.w - r.w) / 2) };
      case "topo": return { id: r.id, y: cx.y };
      case "fundo": return { id: r.id, y: Math.round(cx.y + cx.h - r.h) };
      case "centro-v": return { id: r.id, y: Math.round(cx.y + (cx.h - r.h) / 2) };
    }
  });
}

/** Alterna a presença de um id numa seleção múltipla. */
export function alternarNaSelecao(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}

/** Mantém apenas ids que ainda existem no design. */
export function limparSelecao(ids: string[], existentes: string[]): string[] {
  const set = new Set(existentes);
  return ids.filter((id) => set.has(id));
}
