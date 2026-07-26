// Motor puro para o modo Tester (Fase 6) do Editor de Gráficos: Tricô.
// Gere progresso persistente, notas por carreira e agregação de feedback.

export interface TesterNote {
  row: number;
  autor: string;
  texto: string;
  ts: number;
  tipo: "erro" | "sugestao" | "tamanho" | "consumo";
}

export interface TesterProgress {
  token: string;
  autor: string;
  atual: number;
  totalRows: number;
  iniciado: number;
  ultimo: number;
  concluido?: boolean;
  notas: TesterNote[];
  consumoRealG?: number;
  tamanhoUsado?: string;
}

const PREFIX = "cbm:knit-tester:";

export function progressKey(token: string): string {
  return `${PREFIX}${token}`;
}

export function newProgress(token: string, totalRows: number, autor = "tester"): TesterProgress {
  const now = Date.now();
  return { token, autor, atual: 1, totalRows, iniciado: now, ultimo: now, notas: [] };
}

export function loadProgress(token: string): TesterProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(progressKey(token));
    return raw ? (JSON.parse(raw) as TesterProgress) : null;
  } catch { return null; }
}

export function saveProgress(p: TesterProgress): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(progressKey(p.token), JSON.stringify({ ...p, ultimo: Date.now() })); } catch { /* ignore */ }
}

export function stepRow(p: TesterProgress, delta: number): TesterProgress {
  const atual = Math.max(1, Math.min(p.totalRows, p.atual + delta));
  return { ...p, atual, concluido: atual >= p.totalRows, ultimo: Date.now() };
}

export function addNote(p: TesterProgress, note: Omit<TesterNote, "ts">): TesterProgress {
  return { ...p, notas: [...p.notas, { ...note, ts: Date.now() }], ultimo: Date.now() };
}

/** Percentagem completa (0–100) arredondada a 1 casa. */
export function pctCompleto(p: TesterProgress): number {
  if (!p.totalRows) return 0;
  return Math.round((p.atual / p.totalRows) * 1000) / 10;
}

/** Agregação de vários feedbacks para a autora consolidar. */
export interface FeedbackResumo {
  testers: number;
  concluidos: number;
  mediaConsumoG: number;
  notasPorTipo: Record<TesterNote["tipo"], number>;
  notasPorRow: { row: number; count: number }[];
  tamanhosUsados: Record<string, number>;
}

export function agregarFeedback(lista: TesterProgress[]): FeedbackResumo {
  const notasPorTipo: FeedbackResumo["notasPorTipo"] = { erro: 0, sugestao: 0, tamanho: 0, consumo: 0 };
  const rowMap = new Map<number, number>();
  const tamanhosUsados: Record<string, number> = {};
  let somaConsumo = 0, comConsumo = 0, concluidos = 0;
  for (const p of lista) {
    if (p.concluido) concluidos += 1;
    if (typeof p.consumoRealG === "number") { somaConsumo += p.consumoRealG; comConsumo += 1; }
    if (p.tamanhoUsado) tamanhosUsados[p.tamanhoUsado] = (tamanhosUsados[p.tamanhoUsado] ?? 0) + 1;
    for (const n of p.notas) {
      notasPorTipo[n.tipo] += 1;
      rowMap.set(n.row, (rowMap.get(n.row) ?? 0) + 1);
    }
  }
  return {
    testers: lista.length,
    concluidos,
    mediaConsumoG: comConsumo ? Math.round((somaConsumo / comConsumo) * 10) / 10 : 0,
    notasPorTipo,
    notasPorRow: [...rowMap.entries()].sort((a, b) => b[1] - a[1]).map(([row, count]) => ({ row, count })),
    tamanhosUsados,
  };
}

/** Encoda o pacote de teste (texto+meta) num token base64url para partilhar por URL. */
export function encodePackage(payload: unknown): string {
  const json = JSON.stringify(payload);
  if (typeof btoa === "function") return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return Buffer.from(json, "utf8").toString("base64url");
}

export function decodePackage<T = unknown>(token: string): T | null {
  try {
    const b64 = token.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((token.length + 3) % 4);
    const json = typeof atob === "function" ? decodeURIComponent(escape(atob(b64))) : Buffer.from(b64, "base64").toString("utf8");
    return JSON.parse(json) as T;
  } catch { return null; }
}