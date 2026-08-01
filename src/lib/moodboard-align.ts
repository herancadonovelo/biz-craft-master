/**
 * Alinhamento e distribuição de elementos do moodboard.
 * Funções puras sobre retângulos, para poderem ser testadas sem DOM.
 */
export interface AlignRect { id: string; x: number; y: number; w: number; h: number }

export type AlinhamentoPagina =
  | "esquerda" | "centro-h" | "direita"
  | "topo" | "centro-v" | "fundo";

/** Alinha um retângulo em relação à página (A4 por omissão). */
export function alinharNaPagina(
  r: AlignRect,
  modo: AlinhamentoPagina,
  pagina: { w: number; h: number },
): { x: number; y: number } {
  switch (modo) {
    case "esquerda": return { x: 0, y: r.y };
    case "centro-h": return { x: Math.round((pagina.w - r.w) / 2), y: r.y };
    case "direita": return { x: Math.round(pagina.w - r.w), y: r.y };
    case "topo": return { x: r.x, y: 0 };
    case "centro-v": return { x: r.x, y: Math.round((pagina.h - r.h) / 2) };
    case "fundo": return { x: r.x, y: Math.round(pagina.h - r.h) };
  }
}

/**
 * Distribui os retângulos com espaçamento igual entre eles, mantendo o
 * primeiro e o último nas posições atuais. Devolve apenas as novas posições.
 */
export function distribuir(
  rects: AlignRect[],
  eixo: "h" | "v",
): Array<{ id: string; x?: number; y?: number }> {
  if (rects.length < 3) return [];
  const ord = [...rects].sort((a, b) => (eixo === "h" ? a.x - b.x : a.y - b.y));
  const primeiro = ord[0];
  const ultimo = ord[ord.length - 1];
  const inicio = eixo === "h" ? primeiro.x + primeiro.w : primeiro.y + primeiro.h;
  const fim = eixo === "h" ? ultimo.x : ultimo.y;
  const meio = ord.slice(1, -1);
  const somaMeio = meio.reduce((s, r) => s + (eixo === "h" ? r.w : r.h), 0);
  const folga = fim - inicio - somaMeio;
  const gap = folga / (meio.length + 1);
  let cursor = inicio + gap;
  return meio.map((r) => {
    const pos = Math.round(cursor);
    cursor += (eixo === "h" ? r.w : r.h) + gap;
    return eixo === "h" ? { id: r.id, x: pos } : { id: r.id, y: pos };
  });
}

/** Reordena a pilha (zIndex) movendo um elemento uma posição para cima/baixo. */
export function moverNaPilha(
  ids: string[],
  id: string,
  direcao: "cima" | "baixo",
): string[] {
  const i = ids.indexOf(id);
  if (i < 0) return ids;
  const j = direcao === "cima" ? i + 1 : i - 1;
  if (j < 0 || j >= ids.length) return ids;
  const out = [...ids];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
}
