/**
 * Fase 16 — Camadas, paleta rápida, persistência, presets & biblioteca.
 *
 * Módulo browser-only (localStorage) que fornece:
 *   • LayerPalette: paleta por camada com múltiplos fios (2/3/6) e preview
 *   • PresetsStore: presets de bordado por projeto (hoop, contorno, underlay,
 *     satim/tatami, densidade, pull-comp) reutilizáveis entre sessões
 *   • AutoSave: snapshot serializado do estúdio com recuperação após reload
 *   • MotifLibrary: biblioteca persistente de motivos/fontes SVG com tags
 *   • AppliqueOrder: helper puro para reordenar/escalar camadas do aplique
 *     (Colocar / Fixar / Cobrir) antes do export DST/PES
 *
 * Todas as APIs são pequenas e testáveis; a UI vive em
 * src/components/embroidery/Phase16Panel.tsx.
 */

const NS = "cbm.bordado.p16";

// ------------------------------------------------------------------
// Camadas & paleta rápida
// ------------------------------------------------------------------
export type StrandCount = 1 | 2 | 3 | 4 | 6;

export interface LayerPaletteEntry {
  /** hex do fio principal (base). */
  hex: string;
  /** código DMC associado (se conhecido). */
  dmc?: string;
  /** anchor equivalente. */
  anchor?: string;
  /** nº de fios usados (múltiplos traços por cor). */
  strands: StrandCount;
  /** hexs secundários misturados (blending) — máx 2 extras. */
  blend?: string[];
}

/** Blenda cores adicionais em preview (mistura ponderada RGB). */
export function blendPreviewHex(entry: LayerPaletteEntry): string {
  const cols = [entry.hex, ...(entry.blend ?? [])].slice(0, 3);
  const rgb = cols.map((h) => {
    const c = h.replace("#", "");
    return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
  });
  const r = Math.round(rgb.reduce((s, x) => s + x[0], 0) / rgb.length);
  const g = Math.round(rgb.reduce((s, x) => s + x[1], 0) / rgb.length);
  const b = Math.round(rgb.reduce((s, x) => s + x[2], 0) / rgb.length);
  return "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");
}

// ------------------------------------------------------------------
// Preset store (por projeto)
// ------------------------------------------------------------------
export interface EmbroideryPreset {
  id: string;
  nome: string;
  criadoEm: number;
  data: {
    hoopMm?: { w: number; h: number };
    density?: number;         // linhas por mm (satim/tatami)
    underlay?: "none" | "contour" | "zigzag";
    fillType?: "satin" | "tatami";
    pullCompMm?: number;
    aida?: number;
    watermark?: string;
    strands?: StrandCount;
    extras?: Record<string, unknown>;
  };
}

const presetKey = (projectId: string) => `${NS}.presets.${projectId || "default"}`;

export function listPresets(projectId: string): EmbroideryPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(presetKey(projectId));
    return raw ? (JSON.parse(raw) as EmbroideryPreset[]) : [];
  } catch { return []; }
}

export function savePreset(projectId: string, preset: Omit<EmbroideryPreset, "id" | "criadoEm">): EmbroideryPreset {
  const all = listPresets(projectId);
  const item: EmbroideryPreset = {
    ...preset,
    id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    criadoEm: Date.now(),
  };
  localStorage.setItem(presetKey(projectId), JSON.stringify([item, ...all].slice(0, 40)));
  return item;
}

export function deletePreset(projectId: string, id: string) {
  const all = listPresets(projectId).filter((p) => p.id !== id);
  localStorage.setItem(presetKey(projectId), JSON.stringify(all));
}

// ------------------------------------------------------------------
// AutoSave
// ------------------------------------------------------------------
const autosaveKey = (projectId: string) => `${NS}.autosave.${projectId || "default"}`;

export interface AutoSaveSnapshot<T = unknown> {
  when: number;
  data: T;
}

export function writeAutosave<T>(projectId: string, data: T) {
  if (typeof window === "undefined") return;
  try {
    const payload: AutoSaveSnapshot<T> = { when: Date.now(), data };
    localStorage.setItem(autosaveKey(projectId), JSON.stringify(payload));
  } catch { /* quota */ }
}

export function readAutosave<T>(projectId: string): AutoSaveSnapshot<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(autosaveKey(projectId));
    return raw ? (JSON.parse(raw) as AutoSaveSnapshot<T>) : null;
  } catch { return null; }
}

export function clearAutosave(projectId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(autosaveKey(projectId));
}

// ------------------------------------------------------------------
// Motif / font library (SVG + tags)
// ------------------------------------------------------------------
export interface MotifItem {
  id: string;
  nome: string;
  tags: string[];
  svg: string;      // texto SVG cru
  kind: "motif" | "font";
  criadoEm: number;
}

const libKey = `${NS}.library`;

export function listMotifs(query?: string, kind?: MotifItem["kind"]): MotifItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(libKey);
    const arr: MotifItem[] = raw ? JSON.parse(raw) : [];
    const q = (query || "").toLowerCase().trim();
    return arr.filter((m) => {
      if (kind && m.kind !== kind) return false;
      if (!q) return true;
      return m.nome.toLowerCase().includes(q) || m.tags.some((t) => t.toLowerCase().includes(q));
    });
  } catch { return []; }
}

export function addMotif(nome: string, svg: string, tags: string[], kind: MotifItem["kind"] = "motif"): MotifItem {
  const all: MotifItem[] = (() => { try { return JSON.parse(localStorage.getItem(libKey) || "[]"); } catch { return []; } })();
  const item: MotifItem = {
    id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    nome: nome.trim() || "Motivo",
    svg,
    tags: tags.map((t) => t.trim()).filter(Boolean),
    kind,
    criadoEm: Date.now(),
  };
  localStorage.setItem(libKey, JSON.stringify([item, ...all].slice(0, 200)));
  return item;
}

export function deleteMotif(id: string) {
  const all = listMotifs().filter((m) => m.id !== id);
  localStorage.setItem(libKey, JSON.stringify(all));
}

// ------------------------------------------------------------------
// Applique layer ordering (Colocar / Fixar / Cobrir)
// ------------------------------------------------------------------
export type AppliqueRole = "colocar" | "fixar" | "cobrir";

export interface AppliqueLayer {
  id: string;
  role: AppliqueRole;
  scale: number;   // 0.5–2.0
  order: number;   // ordem preferida
  colorIndex: number;
}

/** Ordena camadas garantindo a sequência canónica Colocar → Fixar → Cobrir. */
export function normalizeAppliqueOrder(layers: AppliqueLayer[]): AppliqueLayer[] {
  const priority: Record<AppliqueRole, number> = { colocar: 0, fixar: 1, cobrir: 2 };
  return [...layers]
    .sort((a, b) => priority[a.role] - priority[b.role] || a.order - b.order)
    .map((l, i) => ({ ...l, order: i }));
}

export function reorderApplique(layers: AppliqueLayer[], id: string, dir: "up" | "down"): AppliqueLayer[] {
  const list = normalizeAppliqueOrder(layers);
  const idx = list.findIndex((l) => l.id === id);
  if (idx < 0) return list;
  const swap = dir === "up" ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= list.length) return list;
  // apenas troca dentro do mesmo role para respeitar a sequência canónica
  if (list[swap].role !== list[idx].role) return list;
  const copy = [...list];
  [copy[idx], copy[swap]] = [copy[swap], copy[idx]];
  return copy.map((l, i) => ({ ...l, order: i }));
}

export function setAppliqueScale(layers: AppliqueLayer[], id: string, scale: number): AppliqueLayer[] {
  const clamped = Math.max(0.5, Math.min(2, scale));
  return layers.map((l) => (l.id === id ? { ...l, scale: clamped } : l));
}