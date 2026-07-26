// Fase 4 — Modo Tester (partilha + comentários por carreira)
//
// Estratégia sem backend dedicado:
//   • O autor gera um "pacote" a partir do estado atual do editor.
//   • O pacote fica em localStorage (chave `amig-tester:<token>`) e o URL
//     partilhável inclui o payload em base64 no hash — permite abrir noutro
//     dispositivo sem servidor.
//   • Comentários dos testers são guardados em `amig-tester-comments:<token>`
//     e podem ser exportados/importados como JSON para o autor consolidar.

export interface TesterComentario {
  id: string;
  pecaId: string;
  carreiraIndex: number;
  autor: string;
  texto: string;
  criadoEm: number;
  resolvido?: boolean;
}

export interface TesterPacote {
  token: string;
  titulo: string;
  autor: string;
  criadoEm: number;
  estado: unknown; // snapshot do Estado do editor
}

const PKG = (t: string) => `amig-tester:${t}`;
const CMT = (t: string) => `amig-tester-comments:${t}`;

export function gerarToken(): string {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}

function b64encode(s: string): string {
  if (typeof window === "undefined") return "";
  return window.btoa(unescape(encodeURIComponent(s)));
}
function b64decode(s: string): string {
  if (typeof window === "undefined") return "";
  try { return decodeURIComponent(escape(window.atob(s))); } catch { return ""; }
}

export function savePacote(p: TesterPacote): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(PKG(p.token), JSON.stringify(p)); } catch {}
}

export function loadPacote(token: string, hashData?: string): TesterPacote | null {
  if (typeof window === "undefined") return null;
  // 1) preferência: localStorage (mesmo dispositivo)
  try {
    const raw = window.localStorage.getItem(PKG(token));
    if (raw) return JSON.parse(raw) as TesterPacote;
  } catch {}
  // 2) fallback: payload base64 no hash do URL
  if (hashData) {
    const json = b64decode(hashData);
    if (json) {
      try {
        const p = JSON.parse(json) as TesterPacote;
        savePacote(p); // cache local
        return p;
      } catch {}
    }
  }
  return null;
}

export function buildShareUrl(p: TesterPacote): string {
  if (typeof window === "undefined") return "";
  const payload = b64encode(JSON.stringify(p));
  return `${window.location.origin}/receita-tester/${p.token}#d=${payload}`;
}

export function listComentarios(token: string): TesterComentario[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CMT(token));
    return raw ? (JSON.parse(raw) as TesterComentario[]) : [];
  } catch { return []; }
}

export function saveComentarios(token: string, list: TesterComentario[]): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(CMT(token), JSON.stringify(list)); } catch {}
}

export function addComentario(
  token: string,
  c: Omit<TesterComentario, "id" | "criadoEm">,
): TesterComentario {
  const novo: TesterComentario = {
    ...c,
    id: Math.random().toString(36).slice(2, 10),
    criadoEm: Date.now(),
  };
  const list = listComentarios(token);
  list.push(novo);
  saveComentarios(token, list);
  return novo;
}

export function toggleResolvido(token: string, id: string): void {
  const list = listComentarios(token).map((c) =>
    c.id === id ? { ...c, resolvido: !c.resolvido } : c,
  );
  saveComentarios(token, list);
}

export function removerComentario(token: string, id: string): void {
  saveComentarios(token, listComentarios(token).filter((c) => c.id !== id));
}

export function exportComentariosJSON(token: string): string {
  return JSON.stringify(listComentarios(token), null, 2);
}

export function importComentariosJSON(token: string, json: string): number {
  try {
    const arr = JSON.parse(json) as TesterComentario[];
    if (!Array.isArray(arr)) return 0;
    const existing = listComentarios(token);
    const ids = new Set(existing.map((c) => c.id));
    const merged = [...existing, ...arr.filter((c) => !ids.has(c.id))];
    saveComentarios(token, merged);
    return arr.length;
  } catch { return 0; }
}