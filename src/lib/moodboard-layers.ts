/**
 * Fase 6 do editor de moodboards: utilitários puros do painel de Camadas.
 * Ordenação por posição/pilha/nome e pesquisa por rótulo.
 */

export type OrdenacaoCamadas =
  | "pilha-desc"
  | "pilha-asc"
  | "posicao-y"
  | "posicao-x"
  | "nome";

export interface CamadaBase {
  id: string;
  x: number;
  y: number;
  zIndex: number;
}

export const ORDENACOES: Array<{ valor: OrdenacaoCamadas; rotulo: string }> = [
  { valor: "pilha-desc", rotulo: "Pilha (topo primeiro)" },
  { valor: "pilha-asc", rotulo: "Pilha (fundo primeiro)" },
  { valor: "posicao-y", rotulo: "Posição vertical" },
  { valor: "posicao-x", rotulo: "Posição horizontal" },
  { valor: "nome", rotulo: "Nome" },
];

/** Normaliza texto para pesquisa (minúsculas, sem acentos). */
export function normalizarTexto(v: string): string {
  return v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

/** Ordena camadas segundo o modo escolhido (não muta a lista original). */
export function ordenarCamadas<T extends CamadaBase>(
  elementos: T[],
  modo: OrdenacaoCamadas,
  rotulo: (el: T) => string,
): T[] {
  const lista = [...elementos];
  switch (modo) {
    case "pilha-asc":
      return lista.sort((a, b) => a.zIndex - b.zIndex);
    case "posicao-y":
      return lista.sort((a, b) => a.y - b.y || a.x - b.x);
    case "posicao-x":
      return lista.sort((a, b) => a.x - b.x || a.y - b.y);
    case "nome":
      return lista.sort((a, b) => normalizarTexto(rotulo(a)).localeCompare(normalizarTexto(rotulo(b))));
    case "pilha-desc":
    default:
      return lista.sort((a, b) => b.zIndex - a.zIndex);
  }
}

/** Filtra camadas por texto livre sobre o rótulo (tolerante a acentos). */
export function filtrarCamadas<T extends CamadaBase>(
  elementos: T[],
  procura: string,
  rotulo: (el: T) => string,
): T[] {
  const q = normalizarTexto(procura);
  if (!q) return elementos;
  return elementos.filter((el) => normalizarTexto(rotulo(el)).includes(q));
}
