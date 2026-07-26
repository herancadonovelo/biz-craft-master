// Dicionário de pontos de tricô (PT/US/UK) + auto-complete + conversores.
// Motor puro, sem dependências React — usado pelo Editor de Gráficos: Tricô.

export type Terminologia = "pt" | "us" | "uk";

export interface PontoTricot {
  id: string;
  simbolo: string;
  base: number;
  produz: number;
  ws?: boolean;
  inclinacao?: -1 | 0 | 1;
  abrev: Record<Terminologia, string>;
  nome: Record<Terminologia, string>;
  frase?: Record<Terminologia, string>;
}

export const PONTOS_TRICOT: PontoTricot[] = [
  { id: "meia",    simbolo: "▢", base: 1, produz: 1, abrev: { pt: "m",   us: "k",     uk: "k"     }, nome: { pt: "malha meia",     us: "knit",         uk: "knit"         }, frase: { pt: "meia", us: "knit", uk: "knit" } },
  { id: "liga",    simbolo: "•", base: 1, produz: 1, abrev: { pt: "l",   us: "p",     uk: "p"     }, nome: { pt: "malha liga",     us: "purl",         uk: "purl"         }, frase: { pt: "liga", us: "purl", uk: "purl" } },
  { id: "lac",     simbolo: "○", base: 0, produz: 1, abrev: { pt: "laç", us: "yo",    uk: "yo"    }, nome: { pt: "laçada",         us: "yarn over",    uk: "yarn over"    }, frase: { pt: "laçada", us: "yo", uk: "yo" } },
  { id: "ssk",     simbolo: "╱", base: 2, produz: 1, inclinacao: -1, abrev: { pt: "mie", us: "ssk",   uk: "ssk"   }, nome: { pt: "mate simples à esquerda", us: "slip-slip-knit", uk: "slip-slip-knit" }, frase: { pt: "mate simples à esq", us: "ssk", uk: "ssk" } },
  { id: "k2tog",   simbolo: "╲", base: 2, produz: 1, inclinacao:  1, abrev: { pt: "mid", us: "k2tog", uk: "k2tog" }, nome: { pt: "mate simples à direita", us: "knit 2 together", uk: "knit 2 together" }, frase: { pt: "2 juntas à dir", us: "k2tog", uk: "k2tog" } },
  { id: "cdd",     simbolo: "▲", base: 3, produz: 1, abrev: { pt: "cdd", us: "cdd",   uk: "cdd"   }, nome: { pt: "diminuição dupla central", us: "central double decrease", uk: "central double decrease" }, frase: { pt: "diminuição dupla", us: "cdd", uk: "cdd" } },
  { id: "kfb",     simbolo: "V", base: 1, produz: 2, abrev: { pt: "aum", us: "kfb",   uk: "kfb"   }, nome: { pt: "aumento",        us: "knit front-back", uk: "knit front-back" }, frase: { pt: "aumento", us: "kfb", uk: "kfb" } },
  { id: "nostitch",simbolo: "▓", base: 0, produz: 0, abrev: { pt: "—",   us: "—",     uk: "—"     }, nome: { pt: "sem malha",      us: "no stitch",    uk: "no stitch"    } },
];

export function findPonto(id: string): PontoTricot | undefined {
  return PONTOS_TRICOT.find((p) => p.id === id);
}

export function suggestions(prefix: string, term: Terminologia = "pt", limit = 6): PontoTricot[] {
  const p = prefix.trim().toLowerCase();
  if (!p) return [];
  return PONTOS_TRICOT.filter((x) =>
    x.abrev[term].toLowerCase().startsWith(p) || x.nome[term].toLowerCase().startsWith(p),
  ).slice(0, limit);
}

const AGULHAS: { mm: number; us: string; uk: string }[] = [
  { mm: 2.0, us: "0",  uk: "14" }, { mm: 2.25, us: "1",  uk: "13" },
  { mm: 2.75, us: "2", uk: "12" }, { mm: 3.0,  us: "—",  uk: "11" },
  { mm: 3.25, us: "3", uk: "10" }, { mm: 3.5,  us: "4",  uk: "—"  },
  { mm: 3.75, us: "5", uk: "9"  }, { mm: 4.0,  us: "6",  uk: "8"  },
  { mm: 4.5,  us: "7", uk: "7"  }, { mm: 5.0,  us: "8",  uk: "6"  },
  { mm: 5.5,  us: "9", uk: "5"  }, { mm: 6.0,  us: "10", uk: "4"  },
  { mm: 6.5,  us: "10.5", uk: "3" }, { mm: 8.0, us: "11", uk: "0" },
  { mm: 9.0,  us: "13", uk: "00" }, { mm: 10.0, us: "15", uk: "000" },
];

export function agulhaConverter(mm: number): { mm: number; us: string; uk: string } {
  return AGULHAS.reduce((best, a) =>
    Math.abs(a.mm - mm) < Math.abs(best.mm - mm) ? a : best, AGULHAS[0]);
}

export const EXPRESSOES: { pt: string; us: string; uk: string }[] = [
  { pt: "montar", us: "cast on", uk: "cast on" },
  { pt: "rematar", us: "bind off", uk: "cast off" },
  { pt: "virar o trabalho", us: "turn work", uk: "turn work" },
  { pt: "carreira", us: "row", uk: "row" },
  { pt: "malha", us: "stitch", uk: "stitch" },
  { pt: "colocar marcador", us: "place marker", uk: "place marker" },
  { pt: "kitchener", us: "kitchener stitch", uk: "grafting" },
];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function converterExpressoes(texto: string, from: Terminologia, to: Terminologia): string {
  if (from === to) return texto;
  let out = texto;
  for (const e of EXPRESSOES) {
    const src = e[from]; const dst = e[to];
    if (!src || !dst) continue;
    const re = new RegExp(`\\b${escapeRegex(src)}\\b`, "gi");
    out = out.replace(re, dst);
  }
  return out;
}
