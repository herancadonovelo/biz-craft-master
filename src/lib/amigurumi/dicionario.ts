// Amigurumi/Crochet stitch dictionary — PT (BR/PT), US, UK terminology.
// Used by the smart editor for auto-complete, PT↔US↔UK conversion and the
// automatic abbreviation legend at the top of the exported PDF.

export type Terminologia = "pt" | "us" | "uk";

export interface Ponto {
  /** canonical id (used internally by the math engine) */
  id: string;
  /** how many stitches this token consumes on the previous row (base) */
  base: number;
  /** how many stitches this token produces on the current row */
  produz: number;
  /** abbreviations in each terminology (all lowercase) */
  abrev: Record<Terminologia, string>;
  /** full names in each terminology */
  nome: Record<Terminologia, string>;
  /** shown on the auto-generated legend */
  descricao?: string;
}

/**
 * Complete, curated stitch catalogue. Keep tokens SHORT and lowercase — the
 * math engine and the auto-completer both match on `abrev`.
 */
export const PONTOS: Ponto[] = [
  {
    id: "corr", base: 0, produz: 1,
    abrev: { pt: "corr", us: "ch", uk: "ch" },
    nome:  { pt: "corrente", us: "chain", uk: "chain" },
    descricao: "Ponto de corrente / laçada base",
  },
  {
    id: "pbx", base: 1, produz: 0,
    abrev: { pt: "pbx", us: "sl st", uk: "sl st" },
    nome:  { pt: "ponto baixíssimo", us: "slip stitch", uk: "slip stitch" },
  },
  {
    id: "pb", base: 1, produz: 1,
    abrev: { pt: "pb", us: "sc", uk: "dc" },
    nome:  { pt: "ponto baixo", us: "single crochet", uk: "double crochet" },
    descricao: "Ponto base do amigurumi",
  },
  {
    id: "mpa", base: 1, produz: 1,
    abrev: { pt: "mpa", us: "hdc", uk: "htr" },
    nome:  { pt: "meio ponto alto", us: "half double crochet", uk: "half treble" },
  },
  {
    id: "pa", base: 1, produz: 1,
    abrev: { pt: "pa", us: "dc", uk: "tr" },
    nome:  { pt: "ponto alto", us: "double crochet", uk: "treble" },
  },
  {
    id: "pad", base: 1, produz: 1,
    abrev: { pt: "pad", us: "tr", uk: "dtr" },
    nome:  { pt: "ponto alto duplo", us: "treble", uk: "double treble" },
  },
  {
    id: "aum", base: 1, produz: 2,
    abrev: { pt: "aum", us: "inc", uk: "inc" },
    nome:  { pt: "aumento", us: "increase", uk: "increase" },
    descricao: "Dois pontos baixos no mesmo ponto anterior",
  },
  {
    id: "dim", base: 2, produz: 1,
    abrev: { pt: "dim", us: "dec", uk: "dec" },
    nome:  { pt: "diminuição", us: "decrease", uk: "decrease" },
    descricao: "Fechar dois pontos baixos como um",
  },
  {
    id: "am", base: 0, produz: 0,
    abrev: { pt: "am", us: "mr", uk: "mr" },
    nome:  { pt: "anel mágico", us: "magic ring", uk: "magic ring" },
  },
  {
    id: "picô", base: 1, produz: 1,
    abrev: { pt: "picô", us: "picot", uk: "picot" },
    nome:  { pt: "picô", us: "picot", uk: "picot" },
  },
  {
    id: "pipoca", base: 1, produz: 1,
    abrev: { pt: "pipoca", us: "pc", uk: "pc" },
    nome:  { pt: "ponto pipoca", us: "popcorn", uk: "popcorn" },
  },
  {
    id: "flo", base: 0, produz: 0,
    abrev: { pt: "flo", us: "flo", uk: "flo" },
    nome:  { pt: "só na laçada da frente", us: "front loop only", uk: "front loop only" },
  },
  {
    id: "blo", base: 0, produz: 0,
    abrev: { pt: "blo", us: "blo", uk: "blo" },
    nome:  { pt: "só na laçada de trás", us: "back loop only", uk: "back loop only" },
  },
];

export function suggestions(prefix: string, term: Terminologia = "pt", limit = 6): Ponto[] {
  const p = prefix.trim().toLowerCase();
  if (!p) return [];
  return PONTOS.filter((x) =>
    x.abrev[term].startsWith(p) || x.nome[term].toLowerCase().startsWith(p),
  ).slice(0, limit);
}

/**
 * Convert a free-text carreira between terminologies. Uses word boundaries
 * so "pb" doesn't accidentally match inside "pbx". Preserves original casing
 * for the first letter of each replacement.
 */
export function convertText(text: string, from: Terminologia, to: Terminologia): string {
  if (from === to) return text;
  // Longest-first so "mpa" beats "pa", "pbx" beats "pb", etc.
  const table = [...PONTOS].sort((a, b) => b.abrev[from].length - a.abrev[from].length);
  let out = text;
  for (const p of table) {
    const src = p.abrev[from].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // escape regex; match on word-ish boundary
    const re = new RegExp(`(^|[^a-záàâãéèêíïóôõöúüç])(${src})(?![a-záàâãéèêíïóôõöúüç])`, "gi");
    out = out.replace(re, (_m, pre) => `${pre}${p.abrev[to]}`);
  }
  return out;
}

export function findPonto(abrev: string, term: Terminologia = "pt"): Ponto | undefined {
  const a = abrev.trim().toLowerCase();
  return PONTOS.find((p) => p.abrev[term] === a);
}