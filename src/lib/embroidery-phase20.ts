/**
 * Fase 20 — Parâmetros de máquina, validações pré-export e alinhamento
 * multi-bastidor (registration marks). Utilitários puros client-safe.
 */
import type { BlockLite } from "./embroidery-phase18";
import { computeBounds, flattenBlocks } from "./embroidery-phase19";

// ─── Perfis de máquina ────────────────────────────────────────────────

export interface MachineProfile {
  id: string;
  name: string;
  brand: "Brother" | "Bernina" | "Janome" | "Husqvarna" | "Ricoma" | "Tajima" | "Genérica";
  format: "DST" | "PES" | "EXP" | "JEF" | "VP3" | "XXX";
  hoopWidthMm: number;
  hoopHeightMm: number;
  maxStitchMm: number;      // salto máximo antes de trim automático
  minStitchMm: number;      // salto mínimo (evitar pontos redundantes)
  maxSpeedSpm: number;      // pontos por minuto
  needleCount: number;
  supportsTrim: boolean;
  supportsColorChange: boolean;
}

export const MACHINE_PROFILES: MachineProfile[] = [
  { id: "brother-pe800", name: "Brother PE800", brand: "Brother", format: "PES",
    hoopWidthMm: 130, hoopHeightMm: 180, maxStitchMm: 12.7, minStitchMm: 0.1,
    maxSpeedSpm: 650, needleCount: 1, supportsTrim: true, supportsColorChange: true },
  { id: "brother-nq3500d", name: "Brother NQ3500D", brand: "Brother", format: "PES",
    hoopWidthMm: 180, hoopHeightMm: 300, maxStitchMm: 12.7, minStitchMm: 0.1,
    maxSpeedSpm: 850, needleCount: 1, supportsTrim: true, supportsColorChange: true },
  { id: "bernina-b790", name: "Bernina B790 Pro", brand: "Bernina", format: "EXP",
    hoopWidthMm: 260, hoopHeightMm: 400, maxStitchMm: 12.1, minStitchMm: 0.1,
    maxSpeedSpm: 1000, needleCount: 1, supportsTrim: true, supportsColorChange: true },
  { id: "janome-mb4s", name: "Janome MB-4S", brand: "Janome", format: "JEF",
    hoopWidthMm: 200, hoopHeightMm: 200, maxStitchMm: 12.7, minStitchMm: 0.1,
    maxSpeedSpm: 800, needleCount: 4, supportsTrim: true, supportsColorChange: true },
  { id: "husqvarna-designer-epic2", name: "Husqvarna Designer Epic 2", brand: "Husqvarna", format: "VP3",
    hoopWidthMm: 260, hoopHeightMm: 360, maxStitchMm: 12.5, minStitchMm: 0.1,
    maxSpeedSpm: 1050, needleCount: 1, supportsTrim: true, supportsColorChange: true },
  { id: "ricoma-em1010", name: "Ricoma EM-1010", brand: "Ricoma", format: "DST",
    hoopWidthMm: 305, hoopHeightMm: 350, maxStitchMm: 12.7, minStitchMm: 0.1,
    maxSpeedSpm: 1200, needleCount: 10, supportsTrim: true, supportsColorChange: true },
  { id: "tajima-tmezp", name: "Tajima TMEZP", brand: "Tajima", format: "DST",
    hoopWidthMm: 360, hoopHeightMm: 500, maxStitchMm: 12.7, minStitchMm: 0.1,
    maxSpeedSpm: 1200, needleCount: 15, supportsTrim: true, supportsColorChange: true },
  { id: "generic-dst", name: "Genérica (DST)", brand: "Genérica", format: "DST",
    hoopWidthMm: 100, hoopHeightMm: 100, maxStitchMm: 12.7, minStitchMm: 0.1,
    maxSpeedSpm: 800, needleCount: 1, supportsTrim: true, supportsColorChange: true },
];

export function getMachineProfile(id: string): MachineProfile | undefined {
  return MACHINE_PROFILES.find((m) => m.id === id);
}

// ─── Validações pré-export ────────────────────────────────────────────

export type IssueSeverity = "error" | "warning" | "info";

export interface ValidationIssue {
  severity: IssueSeverity;
  code: string;
  message: string;
  count?: number;
}

export interface ValidationReport {
  issues: ValidationIssue[];
  ok: boolean;              // sem "error"
  designWidthMm: number;
  designHeightMm: number;
  totalStitches: number;
  colorCount: number;
  longJumps: number;
  tinyStitches: number;
  outOfHoop: boolean;
}

export function validateForMachine(
  blocks: BlockLite[],
  machine: MachineProfile,
  mmPerPx: number,
): ValidationReport {
  const flat = flattenBlocks(blocks);
  const bounds = computeBounds(flat);
  const wMm = (bounds.maxX - bounds.minX) * mmPerPx;
  const hMm = (bounds.maxY - bounds.minY) * mmPerPx;

  let longJumps = 0, tinyStitches = 0;
  for (let i = 1; i < flat.length; i++) {
    const p = flat[i - 1], c = flat[i];
    const d = Math.hypot(c.x - p.x, c.y - p.y) * mmPerPx;
    if (d > machine.maxStitchMm) longJumps++;
    else if (d > 0 && d < machine.minStitchMm) tinyStitches++;
  }

  const colors = new Set(blocks.map((b) => b.color));
  const outOfHoop = wMm > machine.hoopWidthMm || hMm > machine.hoopHeightMm;

  const issues: ValidationIssue[] = [];
  if (outOfHoop) issues.push({
    severity: "error", code: "out-of-hoop",
    message: `Desenho (${wMm.toFixed(1)}×${hMm.toFixed(1)} mm) excede o bastidor (${machine.hoopWidthMm}×${machine.hoopHeightMm} mm).`,
  });
  if (longJumps > 0) issues.push({
    severity: machine.supportsTrim ? "warning" : "error",
    code: "long-jumps",
    message: `${longJumps} salto(s) acima de ${machine.maxStitchMm} mm — ${machine.supportsTrim ? "será inserido trim automático." : "não suportado por esta máquina."}`,
    count: longJumps,
  });
  if (tinyStitches > 0) issues.push({
    severity: "warning", code: "tiny-stitches",
    message: `${tinyStitches} ponto(s) abaixo de ${machine.minStitchMm} mm — podem causar quebras de linha.`,
    count: tinyStitches,
  });
  if (colors.size > machine.needleCount && machine.needleCount > 1) issues.push({
    severity: "warning", code: "color-changes",
    message: `${colors.size} cores para ${machine.needleCount} agulhas — múltiplas trocas necessárias.`,
    count: colors.size,
  });
  if (flat.length === 0) issues.push({
    severity: "error", code: "empty", message: "Nenhum ponto no padrão.",
  });

  return {
    issues,
    ok: !issues.some((i) => i.severity === "error"),
    designWidthMm: wMm, designHeightMm: hMm,
    totalStitches: flat.length, colorCount: colors.size,
    longJumps, tinyStitches, outOfHoop,
  };
}

// ─── Multi-hoop com marcas de registo ─────────────────────────────────

export interface HoopTile {
  index: number;
  col: number;
  row: number;
  /** origem em mm no referencial do desenho. */
  originMm: { x: number; y: number };
  /** dimensões usáveis (mm). */
  widthMm: number;
  heightMm: number;
  /** marcas de registo (centro, mm no ref. do desenho). */
  marks: { x: number; y: number; type: "cross" | "corner" }[];
  /** contagem estimada de pontos dentro deste tile. */
  stitches: number;
}

export interface MultiHoopPlan {
  tiles: HoopTile[];
  cols: number;
  rows: number;
  overlapMm: number;
  totalWidthMm: number;
  totalHeightMm: number;
}

export function planMultiHoop(
  blocks: BlockLite[],
  machine: MachineProfile,
  mmPerPx: number,
  overlapMm = 10,
): MultiHoopPlan {
  const flat = flattenBlocks(blocks);
  const b = computeBounds(flat);
  const wMm = (b.maxX - b.minX) * mmPerPx;
  const hMm = (b.maxY - b.minY) * mmPerPx;
  const effW = Math.max(1, machine.hoopWidthMm - overlapMm);
  const effH = Math.max(1, machine.hoopHeightMm - overlapMm);
  const cols = Math.max(1, Math.ceil(wMm / effW));
  const rows = Math.max(1, Math.ceil(hMm / effH));

  const tiles: HoopTile[] = [];
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const originMm = { x: c * effW, y: r * effH };
      const wTile = Math.min(machine.hoopWidthMm, wMm - originMm.x);
      const hTile = Math.min(machine.hoopHeightMm, hMm - originMm.y);
      // conta pontos dentro do tile
      let stitches = 0;
      for (const s of flat) {
        const xMm = (s.x - b.minX) * mmPerPx;
        const yMm = (s.y - b.minY) * mmPerPx;
        if (xMm >= originMm.x && xMm <= originMm.x + wTile &&
            yMm >= originMm.y && yMm <= originMm.y + hTile) stitches++;
      }
      // marcas: 4 cantos + centro de sobreposição com vizinhos
      const marks: HoopTile["marks"] = [
        { x: originMm.x, y: originMm.y, type: "corner" },
        { x: originMm.x + wTile, y: originMm.y, type: "corner" },
        { x: originMm.x, y: originMm.y + hTile, type: "corner" },
        { x: originMm.x + wTile, y: originMm.y + hTile, type: "corner" },
      ];
      if (c < cols - 1) marks.push({
        x: originMm.x + wTile - overlapMm / 2,
        y: originMm.y + hTile / 2, type: "cross",
      });
      if (r < rows - 1) marks.push({
        x: originMm.x + wTile / 2,
        y: originMm.y + hTile - overlapMm / 2, type: "cross",
      });
      tiles.push({ index: idx++, col: c, row: r, originMm,
        widthMm: wTile, heightMm: hTile, marks, stitches });
    }
  }

  return { tiles, cols, rows, overlapMm, totalWidthMm: wMm, totalHeightMm: hMm };
}

// ─── Persistência ────────────────────────────────────────────────────

const MACHINE_KEY = "embroidery-phase20-machine";
const OVERLAP_KEY = "embroidery-phase20-overlap";

export function loadMachineId(projectId?: string): string {
  if (typeof window === "undefined") return MACHINE_PROFILES[0].id;
  try {
    const key = projectId ? `${MACHINE_KEY}:${projectId}` : MACHINE_KEY;
    return window.localStorage.getItem(key) || MACHINE_PROFILES[0].id;
  } catch { return MACHINE_PROFILES[0].id; }
}

export function saveMachineId(id: string, projectId?: string) {
  if (typeof window === "undefined") return;
  try {
    const key = projectId ? `${MACHINE_KEY}:${projectId}` : MACHINE_KEY;
    window.localStorage.setItem(key, id);
  } catch { /* ignore */ }
}

export function loadOverlap(projectId?: string): number {
  if (typeof window === "undefined") return 10;
  try {
    const key = projectId ? `${OVERLAP_KEY}:${projectId}` : OVERLAP_KEY;
    return Number(window.localStorage.getItem(key)) || 10;
  } catch { return 10; }
}

export function saveOverlap(v: number, projectId?: string) {
  if (typeof window === "undefined") return;
  try {
    const key = projectId ? `${OVERLAP_KEY}:${projectId}` : OVERLAP_KEY;
    window.localStorage.setItem(key, String(v));
  } catch { /* ignore */ }
}
