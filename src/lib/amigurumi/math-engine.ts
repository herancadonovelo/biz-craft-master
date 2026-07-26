// Parses a carreira line and computes how many stitches it produces on the
// current row + how many it consumes on the previous row. Supports:
//
//   6 pb                          → 6 stitches, uses 6 from previous row
//   6 aum                         → 12 stitches, uses 6
//   (1 pb, 1 aum) x 6             → 18 stitches, uses 12
//   [1 pb, 1 aum] * 6             → same
//   3 pb, 1 dim, 3 pb             → 7 stitches, uses 8
//   am 6 pb                       → 6 stitches, uses 0 (magic ring)
//
// The engine is deliberately tolerant of Portuguese punctuation and casing.
import { findPonto, PONTOS, type Terminologia } from "./dicionario";

export interface ParseResult {
  produz: number;
  usa: number;
  tokens: { count: number; abrev: string }[];
  desconhecidos: string[];
  temAnelMagico: boolean;
}

const ABREVS_ALL_PT = PONTOS.map((p) => p.abrev.pt);

function parseGroup(text: string, term: Terminologia): ParseResult {
  const cleaned = text.replace(/\s+/g, " ").trim().toLowerCase();
  if (!cleaned) return empty();
  // Split into comma-separated segments; each segment is "N abrev" or "abrev".
  const parts = cleaned.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
  const acc = empty();
  for (const seg of parts) {
    // "am" alone or leading in the segment
    if (/^am\b/.test(seg)) {
      acc.temAnelMagico = true;
      const rest = seg.replace(/^am\b\s*/, "");
      if (!rest) continue;
      merge(acc, parseGroup(rest, term));
      continue;
    }
    // Match: optional leading count + abrev word (allow multi-word like "sl st")
    // We greedily try the longest matching abbreviation.
    const m = seg.match(/^(\d+)?\s*([a-záàâãéèêíïóôõöúüç ]+)$/i);
    if (!m) { acc.desconhecidos.push(seg); continue; }
    const count = m[1] ? parseInt(m[1], 10) : 1;
    const word = m[2].trim();
    const abrev = ABREVS_ALL_PT.find((a) => a === word)
               || PONTOS.map((p) => p.abrev[term]).find((a) => a === word);
    if (!abrev) { acc.desconhecidos.push(seg); continue; }
    const ponto = findPonto(abrev, ABREVS_ALL_PT.includes(abrev) ? "pt" : term);
    if (!ponto) { acc.desconhecidos.push(seg); continue; }
    acc.tokens.push({ count, abrev: ponto.abrev.pt });
    acc.produz += count * ponto.produz;
    acc.usa    += count * ponto.base;
  }
  return acc;
}

function empty(): ParseResult {
  return { produz: 0, usa: 0, tokens: [], desconhecidos: [], temAnelMagico: false };
}

function merge(dst: ParseResult, src: ParseResult) {
  dst.produz += src.produz;
  dst.usa    += src.usa;
  dst.tokens.push(...src.tokens);
  dst.desconhecidos.push(...src.desconhecidos);
  dst.temAnelMagico = dst.temAnelMagico || src.temAnelMagico;
}

/**
 * Parse a full carreira line, expanding any `[...] x N` or `(...) * N` blocks.
 */
export function parseCarreira(input: string, term: Terminologia = "pt"): ParseResult {
  // Drop trailing "(N)" total annotations — that's what we compute.
  const line = input.replace(/\((\d+)\)\s*$/, "").replace(/\s+/g, " ").trim();
  if (!line) return empty();
  const acc = empty();
  // Iteratively consume: either a "[...]xN" block or plain text up to the next block.
  let rest = line;
  const blockRe = /[\[(]([^\])]+)[\])]\s*[x*×]\s*(\d+)/i;
  while (rest.length) {
    const m = rest.match(blockRe);
    if (!m) { merge(acc, parseGroup(rest, term)); break; }
    const before = rest.slice(0, m.index).replace(/[,;\s]+$/, "");
    if (before) merge(acc, parseGroup(before, term));
    const inner = parseGroup(m[1], term);
    const times = parseInt(m[2], 10) || 1;
    acc.produz += inner.produz * times;
    acc.usa    += inner.usa    * times;
    acc.tokens.push(...inner.tokens.map((t) => ({ count: t.count * times, abrev: t.abrev })));
    acc.desconhecidos.push(...inner.desconhecidos);
    acc.temAnelMagico = acc.temAnelMagico || inner.temAnelMagico;
    rest = rest.slice((m.index ?? 0) + m[0].length).replace(/^[,;\s]+/, "");
  }
  return acc;
}

/**
 * Reads the total the user wrote at the end of the line, if any: "... (24)".
 */
export function extractDeclaredTotal(input: string): number | null {
  const m = input.match(/\((\d+)\)\s*$/);
  return m ? parseInt(m[1], 10) : null;
}

/**
 * Given the previous row total, evaluate a carreira. Returns whether the
 * math holds and both the computed and the user-declared totals.
 */
export function validateCarreira(input: string, previousTotal: number | null, term: Terminologia = "pt") {
  const parsed = parseCarreira(input, term);
  const declared = extractDeclaredTotal(input);
  const usaOk = previousTotal == null || parsed.temAnelMagico || parsed.usa === previousTotal;
  const totalOk = declared == null || declared === parsed.produz;
  return { parsed, declared, usaOk, totalOk };
}

/**
 * Expand a repetition block like `[1 pb, 1 aum] x 6` into flat text
 * `1 pb, 1 aum, 1 pb, 1 aum, ...`. Used by the "expand block" button.
 */
export function expandRepetition(inner: string, times: number): string {
  const one = inner.trim().replace(/^[\[(]/, "").replace(/[\])]$/, "").trim();
  return Array.from({ length: times }, () => one).join(", ");
}

/**
 * Scan every carreira across all secções and return the unique stitch types
 * that appear (used by the auto-generated abbreviation legend).
 */
export function collectAbreviaturasUsadas(carreiras: string[], term: Terminologia = "pt") {
  const set = new Set<string>();
  for (const c of carreiras) {
    const r = parseCarreira(c, term);
    for (const t of r.tokens) set.add(t.abrev);
    if (r.temAnelMagico) set.add("am");
  }
  return PONTOS.filter((p) => set.has(p.abrev.pt));
}