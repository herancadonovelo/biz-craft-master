import { create } from "zustand";
import { persist } from "zustand/middleware";
import { FRASES_BASE, type Frase, type FraseCategoria } from "./frases";

export interface FraseCustom {
  id: string;
  texto: string;
  categoria: FraseCategoria;
  emojis: string;
  criadaEm: string;
}

interface FrasesState {
  favoritas: string[];          // ids
  likes: string[];              // ids
  dislikes: string[];           // ids (banidas)
  custom: FraseCustom[];
  toggleFavorita: (id: string) => void;
  toggleLike: (id: string) => void;
  toggleDislike: (id: string) => void;
  adicionarCustom: (f: Omit<FraseCustom, "id" | "criadaEm">) => void;
  removerCustom: (id: string) => void;
}

export const useFrases = create<FrasesState>()(
  persist(
    (set) => ({
      favoritas: [],
      likes: [],
      dislikes: [],
      custom: [],
      toggleFavorita: (id) =>
        set((s) => ({
          favoritas: s.favoritas.includes(id)
            ? s.favoritas.filter((x) => x !== id)
            : [...s.favoritas, id],
          dislikes: s.dislikes.filter((x) => x !== id),
        })),
      toggleLike: (id) =>
        set((s) => ({
          likes: s.likes.includes(id) ? s.likes.filter((x) => x !== id) : [...s.likes, id],
          dislikes: s.dislikes.filter((x) => x !== id),
        })),
      toggleDislike: (id) =>
        set((s) => ({
          dislikes: s.dislikes.includes(id)
            ? s.dislikes.filter((x) => x !== id)
            : [...s.dislikes, id],
          favoritas: s.favoritas.filter((x) => x !== id),
          likes: s.likes.filter((x) => x !== id),
        })),
      adicionarCustom: (f) =>
        set((s) => ({
          custom: [
            {
              ...f,
              id: `c${Math.random().toString(36).slice(2, 9)}`,
              criadaEm: new Date().toISOString(),
            },
            ...s.custom,
          ],
        })),
      removerCustom: (id) =>
        set((s) => ({ custom: s.custom.filter((f) => f.id !== id) })),
    }),
    { name: "frases-store" },
  ),
);

/** Junta as 300 base + custom do utilizador */
export function todasFrases(custom: FraseCustom[]): Frase[] {
  return [
    ...FRASES_BASE,
    ...custom.map((c) => ({ id: c.id, texto: c.texto, categoria: c.categoria, emojis: c.emojis })),
  ];
}

/** Sorteia com peso: favoritas x4, likes x2, normais x1, dislikes banidas */
export function sortearFrase(
  state: Pick<FrasesState, "favoritas" | "likes" | "dislikes" | "custom">,
  filtroCategoria?: FraseCategoria,
  evitarId?: string,
): Frase {
  const pool = todasFrases(state.custom).filter(
    (f) =>
      !state.dislikes.includes(f.id) &&
      (!filtroCategoria || f.categoria === filtroCategoria) &&
      f.id !== evitarId,
  );
  if (pool.length === 0) return FRASES_BASE[0];
  const weighted: Frase[] = [];
  for (const f of pool) {
    let peso = 1;
    if (state.favoritas.includes(f.id)) peso = 4;
    else if (state.likes.includes(f.id)) peso = 2;
    for (let i = 0; i < peso; i++) weighted.push(f);
  }
  return weighted[Math.floor(Math.random() * weighted.length)];
}

/** Formato visual: emojis + espaço + texto + espaço + emojis (eco) */
export function formatarFrase(f: Frase): string {
  return `${f.emojis} ${f.texto} ${f.emojis}`;
}