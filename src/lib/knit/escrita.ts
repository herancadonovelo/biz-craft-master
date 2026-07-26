// Fase 5 — Motor puro de Escrita & Dicionários para o Editor de Tricô.
// Cobre: auto-completar, geração de legenda a partir de texto, conversores
// de agulha mm↔US↔UK, dicionário multilingue e formatador de repetições
// com asteriscos (`*meia, laç* × 4` → expansão e colapso).

import {
  PONTOS_TRICOT, EXPRESSOES, agulhaConverter, converterExpressoes, suggestions,
  type PontoTricot, type Terminologia,
} from "./dicionario";

export { suggestions, converterExpressoes, agulhaConverter };

/** Item da legenda gerada a partir de um texto/receita. */
export interface LegendaItem {
  simbolo: string;
  abrev: string;
  nome: string;
  ocorrencias: number;
}

/** Varre o texto e devolve a legenda ordenada por número de ocorrências. */
export function gerarLegenda(texto: string, term: Terminologia = "pt"): LegendaItem[] {
  const t = ` ${texto.toLowerCase()} `;
  const items: LegendaItem[] = [];
  for (const p of PONTOS_TRICOT) {
    const alvos = [p.abrev[term], p.nome[term], p.frase?.[term] ?? ""]
      .filter(Boolean)
      .map((s) => s.toLowerCase());
    let n = 0;
    for (const a of alvos) {
      const re = new RegExp(`(^|[^a-zà-ÿ])${escapeRegex(a)}([^a-zà-ÿ]|$)`, "g");
      n += (t.match(re) ?? []).length;
    }
    if (n > 0) items.push({ simbolo: p.simbolo, abrev: p.abrev[term], nome: p.nome[term], ocorrencias: n });
  }
  return items.sort((a, b) => b.ocorrencias - a.ocorrencias);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* ============================ AGULHAS ============================ */

export interface AgulhaConv { mm: number; us: string; uk: string }

/** Aceita entrada em qualquer sistema (mm | us | uk) e devolve a linha canónica. */
export function converterAgulha(input: { mm?: number; us?: string; uk?: string }): AgulhaConv {
  if (typeof input.mm === "number" && !isNaN(input.mm)) return agulhaConverter(input.mm);
  const TABELA: AgulhaConv[] = [
    { mm: 2.0, us: "0", uk: "14" }, { mm: 2.25, us: "1", uk: "13" },
    { mm: 2.75, us: "2", uk: "12" }, { mm: 3.0, us: "—", uk: "11" },
    { mm: 3.25, us: "3", uk: "10" }, { mm: 3.5, us: "4", uk: "—" },
    { mm: 3.75, us: "5", uk: "9" }, { mm: 4.0, us: "6", uk: "8" },
    { mm: 4.5, us: "7", uk: "7" }, { mm: 5.0, us: "8", uk: "6" },
    { mm: 5.5, us: "9", uk: "5" }, { mm: 6.0, us: "10", uk: "4" },
    { mm: 6.5, us: "10.5", uk: "3" }, { mm: 8.0, us: "11", uk: "0" },
    { mm: 9.0, us: "13", uk: "00" }, { mm: 10.0, us: "15", uk: "000" },
  ];
  if (input.us) {
    const hit = TABELA.find((a) => a.us === String(input.us).trim());
    if (hit) return hit;
  }
  if (input.uk) {
    const hit = TABELA.find((a) => a.uk === String(input.uk).trim());
    if (hit) return hit;
  }
  return TABELA[0];
}

/* ============================ DICIONÁRIO ============================ */

export interface DicionarioLinha { id: string; pt: string; us: string; uk: string; simbolo: string }

export function dicionarioCompleto(): DicionarioLinha[] {
  const pontos: DicionarioLinha[] = PONTOS_TRICOT.map((p) => ({
    id: p.id, pt: p.nome.pt, us: p.nome.us, uk: p.nome.uk, simbolo: p.simbolo,
  }));
  const exprs: DicionarioLinha[] = EXPRESSOES.map((e, i) => ({
    id: `expr-${i}`, pt: e.pt, us: e.us, uk: e.uk, simbolo: "¶",
  }));
  return [...pontos, ...exprs];
}

export function pesquisarDicionario(query: string): DicionarioLinha[] {
  const q = query.trim().toLowerCase();
  if (!q) return dicionarioCompleto();
  return dicionarioCompleto().filter(
    (l) => l.pt.toLowerCase().includes(q) || l.us.toLowerCase().includes(q) || l.uk.toLowerCase().includes(q),
  );
}

/* ============================ FASES DE CONSTRUÇÃO ============================ */

export interface FaseReceita { id: string; titulo: string; conteudo: string }

/** Divide um texto em fases usando marcadores `## Título`. */
export function parseFases(texto: string): FaseReceita[] {
  const linhas = texto.split(/\r?\n/);
  const fases: FaseReceita[] = [];
  let cur: FaseReceita | null = null;
  for (const l of linhas) {
    const m = l.match(/^##\s+(.+)$/);
    if (m) {
      if (cur) fases.push(cur);
      cur = { id: `fase-${fases.length + 1}`, titulo: m[1].trim(), conteudo: "" };
    } else if (cur) {
      cur.conteudo += (cur.conteudo ? "\n" : "") + l;
    } else {
      cur = { id: "fase-1", titulo: "Introdução", conteudo: l };
    }
  }
  if (cur) fases.push(cur);
  return fases.map((f) => ({ ...f, conteudo: f.conteudo.trim() }));
}

export function fasesParaTexto(fases: FaseReceita[]): string {
  return fases.map((f) => `## ${f.titulo}\n${f.conteudo}`).join("\n\n");
}

/* ============================ REPETIÇÕES *...* ============================ */

/** Expande blocos `*a, b* × N` num texto plano legível. */
export function expandirRepeticoes(texto: string): string {
  return texto.replace(/\*([^*]+)\*\s*[×x*]\s*(\d+)/gi, (_, bloco: string, n: string) => {
    const N = Math.max(1, Math.min(200, parseInt(n, 10)));
    return Array(N).fill(bloco.trim()).join(", ");
  });
}

/** Deteta sequências repetidas consecutivas e colapsa-as em `*...* × N`. */
export function colapsarRepeticoes(texto: string, minRepeat = 2): string {
  const partes = texto.split(",").map((s) => s.trim()).filter(Boolean);
  if (partes.length < minRepeat * 2) return texto;
  const out: string[] = [];
  let i = 0;
  while (i < partes.length) {
    let melhorLen = 0; let melhorN = 1;
    for (let len = 1; len <= Math.min(6, Math.floor((partes.length - i) / minRepeat)); len++) {
      const bloco = partes.slice(i, i + len).join(",");
      let n = 1;
      while (partes.slice(i + n * len, i + (n + 1) * len).join(",") === bloco) n++;
      if (n >= minRepeat && len * n > melhorLen * melhorN) { melhorLen = len; melhorN = n; }
    }
    if (melhorLen > 0 && melhorN >= minRepeat) {
      out.push(`*${partes.slice(i, i + melhorLen).join(", ")}* × ${melhorN}`);
      i += melhorLen * melhorN;
    } else {
      out.push(partes[i]); i += 1;
    }
  }
  return out.join(", ");
}

/* ============================ AUTO-COMPLETE HELPER ============================ */

export function completar(linha: string, term: Terminologia = "pt"): PontoTricot[] {
  const ultima = linha.split(/[,;\s]+/).pop() ?? "";
  return suggestions(ultima, term, 8);
}
