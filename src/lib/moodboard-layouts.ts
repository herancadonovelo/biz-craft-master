/**
 * 30 modelos de esteira (grelhas) para moodboards.
 *
 * Cada modelo devolve slots normalizados (0–1) relativos à folha, o que os
 * torna independentes do tamanho da tela. `capacidade` indica quantas imagens
 * o modelo acomoda, para podermos sugerir modelos conforme o número de
 * imagens que o utilizador quer colocar.
 */
export interface Slot { x: number; y: number; w: number; h: number }
export interface MoodboardLayout {
  id: string;
  nome: string;
  capacidade: number;
  slots: Slot[];
}

/** Grelha regular de `cols` x `rows` com espaçamento `gap` e margem `m`. */
export function grelha(cols: number, rows: number, gap = 0.02, m = 0.05): Slot[] {
  const w = (1 - m * 2 - gap * (cols - 1)) / cols;
  const h = (1 - m * 2 - gap * (rows - 1)) / rows;
  const out: Slot[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out.push({ x: m + c * (w + gap), y: m + r * (h + gap), w, h });
    }
  }
  return out;
}

/** Divide uma faixa horizontal em `n` colunas iguais. */
function faixa(y: number, h: number, n: number, gap = 0.02, m = 0.05): Slot[] {
  const w = (1 - m * 2 - gap * (n - 1)) / n;
  return Array.from({ length: n }, (_, i) => ({ x: m + i * (w + gap), y, w, h }));
}

const M = 0.05;
const G = 0.02;

export const MOODBOARD_LAYOUTS: MoodboardLayout[] = [
  { id: "solo", nome: "Página inteira", capacidade: 1, slots: [{ x: M, y: M, w: 1 - M * 2, h: 1 - M * 2 }] },
  { id: "retrato-centro", nome: "Retrato centrado", capacidade: 1, slots: [{ x: 0.2, y: 0.18, w: 0.6, h: 0.64 }] },
  { id: "duo-v", nome: "Duo vertical", capacidade: 2, slots: grelha(1, 2) },
  { id: "duo-h", nome: "Duo horizontal", capacidade: 2, slots: grelha(2, 1) },
  { id: "duo-desigual", nome: "Duo desigual", capacidade: 2, slots: [
    { x: M, y: M, w: 0.56, h: 1 - M * 2 }, { x: 0.63, y: M, w: 0.32, h: 1 - M * 2 },
  ] },
  { id: "trio-col", nome: "Trio em coluna", capacidade: 3, slots: grelha(1, 3) },
  { id: "trio-lin", nome: "Trio em linha", capacidade: 3, slots: grelha(3, 1) },
  { id: "trio-heroi", nome: "Herói + dois", capacidade: 3, slots: [
    { x: M, y: M, w: 1 - M * 2, h: 0.5 }, ...faixa(0.57, 0.38, 2),
  ] },
  { id: "trio-lateral", nome: "Painel lateral", capacidade: 3, slots: [
    { x: M, y: M, w: 0.52, h: 1 - M * 2 },
    { x: 0.59, y: M, w: 0.36, h: 0.44 }, { x: 0.59, y: 0.51, w: 0.36, h: 0.44 },
  ] },
  { id: "quadrado-4", nome: "Quadrado 2x2", capacidade: 4, slots: grelha(2, 2) },
  { id: "tira-4", nome: "Tira de 4", capacidade: 4, slots: grelha(4, 1) },
  { id: "torre-4", nome: "Torre de 4", capacidade: 4, slots: grelha(1, 4) },
  { id: "heroi-3", nome: "Herói + 3", capacidade: 4, slots: [
    { x: M, y: M, w: 1 - M * 2, h: 0.46 }, ...faixa(0.53, 0.42, 3),
  ] },
  { id: "moldura-4", nome: "Moldura", capacidade: 4, slots: [
    { x: M, y: M, w: 1 - M * 2, h: 0.2 }, { x: M, y: 0.27, w: 0.44, h: 0.46 },
    { x: 0.51, y: 0.27, w: 0.44, h: 0.46 }, { x: M, y: 0.75, w: 1 - M * 2, h: 0.2 },
  ] },
  { id: "grelha-5", nome: "Cinco em T", capacidade: 5, slots: [
    ...faixa(M, 0.42, 2), ...faixa(0.51, 0.44, 3),
  ] },
  { id: "cinco-central", nome: "Central + 4 cantos", capacidade: 5, slots: [
    { x: 0.3, y: 0.32, w: 0.4, h: 0.36 },
    { x: M, y: M, w: 0.22, h: 0.22 }, { x: 0.73, y: M, w: 0.22, h: 0.22 },
    { x: M, y: 0.73, w: 0.22, h: 0.22 }, { x: 0.73, y: 0.73, w: 0.22, h: 0.22 },
  ] },
  { id: "grelha-6", nome: "Grelha 2x3", capacidade: 6, slots: grelha(2, 3) },
  { id: "grelha-6b", nome: "Grelha 3x2", capacidade: 6, slots: grelha(3, 2) },
  { id: "seis-escada", nome: "Escada de 6", capacidade: 6, slots: [
    ...faixa(M, 0.26, 2), ...faixa(0.34, 0.26, 3), ...(faixa(0.63, 0.32, 1)),
  ] },
  { id: "seis-mosaico", nome: "Mosaico de 6", capacidade: 6, slots: [
    { x: M, y: M, w: 0.58, h: 0.42 }, { x: 0.65, y: M, w: 0.3, h: 0.2 }, { x: 0.65, y: 0.27, w: 0.3, h: 0.2 },
    ...faixa(0.51, 0.44, 3),
  ] },
  { id: "grelha-7", nome: "Sete assimétrico", capacidade: 7, slots: [
    { x: M, y: M, w: 0.44, h: 0.44 }, ...faixa(M, 0.2, 1).map((s) => ({ ...s, x: 0.51, w: 0.44, h: 0.2 })),
    { x: 0.51, y: 0.27, w: 0.44, h: 0.22 }, ...faixa(0.53, 0.2, 2), ...faixa(0.75, 0.2, 2),
  ] },
  { id: "grelha-8", nome: "Grelha 2x4", capacidade: 8, slots: grelha(2, 4) },
  { id: "grelha-8b", nome: "Grelha 4x2", capacidade: 8, slots: grelha(4, 2) },
  { id: "oito-revista", nome: "Revista de 8", capacidade: 8, slots: [
    { x: M, y: M, w: 0.6, h: 0.38 }, { x: 0.67, y: M, w: 0.28, h: 0.185 }, { x: 0.67, y: 0.245, w: 0.28, h: 0.185 },
    ...faixa(0.46, 0.24, 3), ...faixa(0.72, 0.23, 2),
  ] },
  { id: "grelha-9", nome: "Grelha 3x3", capacidade: 9, slots: grelha(3, 3) },
  { id: "nove-foco", nome: "Nove com foco", capacidade: 9, slots: [
    { x: M, y: M, w: 0.58, h: 0.38 }, { x: 0.65, y: M, w: 0.3, h: 0.18 }, { x: 0.65, y: 0.25, w: 0.3, h: 0.18 },
    ...faixa(0.46, 0.24, 3), ...faixa(0.72, 0.23, 3),
  ] },
  { id: "grelha-10", nome: "Grelha 2x5", capacidade: 10, slots: grelha(2, 5) },
  { id: "grelha-12", nome: "Grelha 3x4", capacidade: 12, slots: grelha(3, 4) },
  { id: "grelha-15", nome: "Grelha 3x5", capacidade: 15, slots: grelha(3, 5, 0.015, 0.04) },
  { id: "grelha-16", nome: "Grelha 4x4", capacidade: 16, slots: grelha(4, 4, 0.015, 0.04) },
  { id: "contacto-20", nome: "Folha de contacto", capacidade: 20, slots: grelha(4, 5, 0.012, 0.035) },
];

/** Modelos ordenados pela proximidade ao número de imagens pretendido. */
export function sugerirLayouts(nImagens: number): MoodboardLayout[] {
  return [...MOODBOARD_LAYOUTS].sort(
    (a, b) =>
      Math.abs(a.capacidade - nImagens) - Math.abs(b.capacidade - nImagens) ||
      a.capacidade - b.capacidade,
  );
}

/** Converte os slots normalizados em retângulos absolutos da folha. */
export function aplicarLayout(
  layout: MoodboardLayout,
  n: number,
  largura: number,
  altura: number,
): Array<{ x: number; y: number; w: number; h: number }> {
  return layout.slots.slice(0, Math.max(0, n)).map((s) => ({
    x: Math.round(s.x * largura),
    y: Math.round(s.y * altura),
    w: Math.round(s.w * largura),
    h: Math.round(s.h * altura),
  }));
}

export type PosicaoMarcaAgua =
  | "inferior-direita" | "inferior-esquerda" | "superior-direita" | "superior-esquerda" | "centro";

/** Retângulo da marca de água conforme a posição escolhida. */
export function retanguloMarcaAgua(
  posicao: PosicaoMarcaAgua,
  largura: number,
  altura: number,
  escala = 0.28,
): { x: number; y: number; w: number; h: number } {
  const w = Math.round(largura * escala);
  const h = Math.round(w * 0.32);
  const m = Math.round(largura * 0.04);
  const mapa: Record<PosicaoMarcaAgua, { x: number; y: number }> = {
    "inferior-direita": { x: largura - w - m, y: altura - h - m },
    "inferior-esquerda": { x: m, y: altura - h - m },
    "superior-direita": { x: largura - w - m, y: m },
    "superior-esquerda": { x: m, y: m },
    centro: { x: Math.round((largura - w) / 2), y: Math.round((altura - h) / 2) },
  };
  return { ...mapa[posicao], w, h };
}
