/**
 * Fase 23 — Relatório QA de auto-digitize, exportação para máquina por
 * perfil (DST/EXP/PES) com validação de compatibilidade, e editor manual
 * de camadas vetoriais (satim/tatami, underlay, pull-comp) com overrides
 * persistidos por projeto.
 *
 * Módulo puro client-safe (sem imports de servidor).
 */
import { encodeDst, type StitchBlock } from "./dst";
import { encodePes } from "./pes";
import { encodeExp } from "./exp";
import {
  validateForMachine, type MachineProfile, type ValidationIssue, type ValidationReport,
} from "./embroidery-phase20";
import { flattenBlocks } from "./embroidery-phase19";
import type { BlockLite } from "./embroidery-phase18";
import type { SmartLayerRule, StitchType } from "./embroidery-phase22";

// ─── Relatório QA estendido ──────────────────────────────────────────

export interface QaReport extends ValidationReport {
  /** Densidade média (pontos/mm²) do desenho. */
  avgDensity: number;
  /** Mudanças bruscas de direção (>120°). */
  sharpTurns: number;
  /** Trocas de cor (índice de risco de agulha). */
  colorChanges: number;
  /** Score final 0–100 (100 = pronto). */
  score: number;
  /** Alertas específicos do auto-digitize. */
  digitizeAlerts: ValidationIssue[];
}

export function qaReport(
  rules: SmartLayerRule[],
  blocks: BlockLite[],
  machine: MachineProfile,
  mmPerPx: number,
): QaReport {
  const base = validateForMachine(blocks, machine, mmPerPx);

  // Densidade e mudanças bruscas
  const flat = flattenBlocks(blocks);
  let sharpTurns = 0;
  for (let i = 2; i < flat.length; i++) {
    const a = flat[i - 2], b = flat[i - 1], c = flat[i];
    const v1x = b.x - a.x, v1y = b.y - a.y;
    const v2x = c.x - b.x, v2y = c.y - b.y;
    const l1 = Math.hypot(v1x, v1y), l2 = Math.hypot(v2x, v2y);
    if (l1 < 0.001 || l2 < 0.001) continue;
    const cos = (v1x * v2x + v1y * v2y) / (l1 * l2);
    if (cos < -0.5) sharpTurns++;               // >120°
  }
  const areaMm2 = Math.max(1, base.designWidthMm * base.designHeightMm);
  const avgDensity = base.totalStitches / areaMm2;

  // Alertas do digitize (regras por camada)
  const digitizeAlerts: ValidationIssue[] = [];
  const highDens = rules.filter((r) => r.stitch === "tatami" && r.density > 6);
  const lowDens  = rules.filter((r) => r.stitch === "tatami" && r.density < 3);
  const satFat   = rules.filter((r) => r.stitch === "satin" && Math.min(r.widthMm, r.heightMm) > 8);
  const runTiny  = rules.filter((r) => r.stitch === "run" && r.areaMm2 > 25);
  if (highDens.length) digitizeAlerts.push({
    severity: "warning", code: "density-high",
    message: `${highDens.length} camada(s) tatami com densidade > 6 pts/mm — risco de furar tecido.`,
    count: highDens.length,
  });
  if (lowDens.length) digitizeAlerts.push({
    severity: "warning", code: "density-low",
    message: `${lowDens.length} camada(s) tatami com densidade < 3 pts/mm — pode mostrar tecido.`,
    count: lowDens.length,
  });
  if (satFat.length) digitizeAlerts.push({
    severity: "warning", code: "satin-too-wide",
    message: `${satFat.length} camada(s) satim com largura > 8 mm — considerar tatami.`,
    count: satFat.length,
  });
  if (runTiny.length) digitizeAlerts.push({
    severity: "info", code: "run-too-large",
    message: `${runTiny.length} camada(s) marcadas como corrida com área >25 mm² — considerar preenchimento.`,
    count: runTiny.length,
  });

  // Score
  const penalties =
    (base.outOfHoop ? 40 : 0) +
    Math.min(20, base.longJumps * 0.5) +
    Math.min(15, base.tinyStitches * 0.2) +
    Math.min(10, sharpTurns * 0.05) +
    Math.min(10, digitizeAlerts.length * 3) +
    Math.max(0, (base.colorCount - machine.needleCount) * 2);
  const score = Math.max(0, Math.min(100, Math.round(100 - penalties)));

  return {
    ...base,
    avgDensity,
    sharpTurns,
    colorChanges: Math.max(0, base.colorCount - 1),
    score,
    digitizeAlerts,
  };
}

// ─── Checklist de revisão ────────────────────────────────────────────

export interface ChecklistItem {
  id: string;
  label: string;
  ok: boolean;
  detail?: string;
}

export function buildChecklist(report: QaReport, machine: MachineProfile): ChecklistItem[] {
  const items: ChecklistItem[] = [
    { id: "hoop", label: "Dentro do bastidor", ok: !report.outOfHoop,
      detail: `${report.designWidthMm.toFixed(1)}×${report.designHeightMm.toFixed(1)} mm em ${machine.hoopWidthMm}×${machine.hoopHeightMm} mm` },
    { id: "jumps", label: "Sem saltos longos críticos", ok: report.longJumps < 5 || machine.supportsTrim,
      detail: `${report.longJumps} salto(s) > ${machine.maxStitchMm} mm` },
    { id: "tiny", label: "Sem pontos minúsculos", ok: report.tinyStitches === 0,
      detail: `${report.tinyStitches} ponto(s) < ${machine.minStitchMm} mm` },
    { id: "colors", label: "Cores suportadas pela máquina", ok: report.colorCount <= machine.needleCount || machine.supportsColorChange,
      detail: `${report.colorCount} cores · ${machine.needleCount} agulhas` },
    { id: "sharp", label: "Poucas mudanças bruscas de direção", ok: report.sharpTurns < 20,
      detail: `${report.sharpTurns} viragens >120°` },
    { id: "density", label: "Densidade dentro do intervalo", ok: report.avgDensity >= 0.05 && report.avgDensity < 8,
      detail: `${report.avgDensity.toFixed(2)} pts/mm²` },
    { id: "empty", label: "Padrão contém pontos", ok: report.totalStitches > 0,
      detail: `${report.totalStitches} ponto(s)` },
    { id: "digitize", label: "Sem alertas do auto-digitize", ok: report.digitizeAlerts.length === 0,
      detail: `${report.digitizeAlerts.length} alerta(s)` },
  ];
  return items;
}

// ─── Compatibilidade e export por perfil ─────────────────────────────

export interface MachineCompat {
  ok: boolean;
  warnings: string[];
  format: MachineProfile["format"];
  fallback?: "DST";
}

export function machineCompatibility(profile: MachineProfile, rules: SmartLayerRule[]): MachineCompat {
  const warnings: string[] = [];
  const hasTrim = rules.some((r) => r.stitch !== "run");
  if (hasTrim && !profile.supportsTrim) warnings.push("Máquina não suporta trim automático.");
  if (rules.length > profile.needleCount && !profile.supportsColorChange)
    warnings.push(`Não suporta ${rules.length} trocas de cor (${profile.needleCount} agulha(s)).`);
  const supported: MachineProfile["format"][] = ["DST", "PES", "EXP"];
  const fmt = profile.format;
  const fallback = supported.includes(fmt) ? undefined : "DST" as const;
  if (fallback) warnings.push(`Formato ${fmt} não implementado — fallback para DST.`);
  return { ok: warnings.length === 0, warnings, format: fmt, fallback };
}

export interface MachineExport {
  blob: Blob;
  filename: string;
  format: MachineProfile["format"] | "DST";
  note?: string;
}

export function exportForMachine(
  profile: MachineProfile,
  blocks: StitchBlock[],
  pxPerMm: number,
  label = "CBM",
): MachineExport {
  const compat = machineCompatibility(profile, []);
  const fmt = compat.fallback ?? profile.format;
  const safeLabel = label.replace(/[^A-Za-z0-9]/g, "").slice(0, 12) || "CBM";
  const base = `${profile.id}-${safeLabel}`;
  switch (fmt) {
    case "PES": return { blob: encodePes(blocks, pxPerMm, safeLabel), filename: `${base}.pes`, format: "PES" };
    case "EXP": return { blob: encodeExp(blocks, pxPerMm), filename: `${base}.exp`, format: "EXP" };
    case "DST":
    default:    return {
      blob: encodeDst(blocks, pxPerMm, safeLabel), filename: `${base}.dst`, format: "DST",
      note: compat.fallback ? `Perfil pedia ${profile.format}; exportado como DST universal.` : undefined,
    };
  }
}

// ─── Overrides manuais por camada ────────────────────────────────────

export interface LayerOverride {
  stitch?: StitchType;
  underlay?: SmartLayerRule["underlay"];
  pullCompMm?: number;
  density?: number;
  spacingMm?: number;
  hex?: string;
}

export type LayerOverrideMap = Record<number, LayerOverride>;

export function applyOverrides(rules: SmartLayerRule[], overrides: LayerOverrideMap): SmartLayerRule[] {
  return rules.map((r, i) => overrides[i] ? { ...r, ...overrides[i] } : r);
}

// ─── Persistência ────────────────────────────────────────────────────

const OVR_KEY = "embroidery-phase23-overrides";
const CHK_KEY = "embroidery-phase23-checklist";

export function loadOverrides(projectId?: string): LayerOverrideMap {
  if (typeof window === "undefined") return {};
  try {
    const key = projectId ? `${OVR_KEY}:${projectId}` : OVR_KEY;
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
export function saveOverrides(map: LayerOverrideMap, projectId?: string) {
  if (typeof window === "undefined") return;
  try {
    const key = projectId ? `${OVR_KEY}:${projectId}` : OVR_KEY;
    window.localStorage.setItem(key, JSON.stringify(map));
  } catch { /* ignore */ }
}

export function loadChecklistState(projectId?: string): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const key = projectId ? `${CHK_KEY}:${projectId}` : CHK_KEY;
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
export function saveChecklistState(state: Record<string, boolean>, projectId?: string) {
  if (typeof window === "undefined") return;
  try {
    const key = projectId ? `${CHK_KEY}:${projectId}` : CHK_KEY;
    window.localStorage.setItem(key, JSON.stringify(state));
  } catch { /* ignore */ }
}

// ─── Auditoria do editor: catálogo de atalhos/funções ───────────────

export interface EditorShortcut {
  keys: string;
  action: string;
  scope: "global" | "canvas" | "phase" | "monogram";
  implemented: boolean;
}

export const EDITOR_SHORTCUTS: EditorShortcut[] = [
  { keys: "Ctrl/Cmd + Z",  action: "Undo",                  scope: "global",  implemented: true },
  { keys: "Ctrl/Cmd + Y",  action: "Redo",                  scope: "global",  implemented: true },
  { keys: "Ctrl + S",      action: "Guardar projeto",       scope: "global",  implemented: true },
  { keys: "Delete",        action: "Apagar seleção",        scope: "canvas",  implemented: true },
  { keys: "Espaço",        action: "Play/Pause simulação",  scope: "phase",   implemented: true },
  { keys: "Setas",         action: "Mover âncoras",         scope: "canvas",  implemented: true },
  { keys: "Shift + click", action: "Seleção múltipla",      scope: "canvas",  implemented: true },
  { keys: "Alt + roda",    action: "Zoom preview",          scope: "canvas",  implemented: true },
  { keys: "M",             action: "Alternar Monograma",    scope: "monogram", implemented: true },
  { keys: "V",             action: "Vetorizar imagem",      scope: "phase",   implemented: true },
  { keys: "E",             action: "Exportar para máquina", scope: "phase",   implemented: true },
  { keys: "Q",             action: "Abrir relatório QA",    scope: "phase",   implemented: true },
];

export interface AuditRow {
  area: string;
  item: string;
  ok: boolean;
  note?: string;
}

export function auditEditor(rules: SmartLayerRule[], blocks: BlockLite[]): AuditRow[] {
  return [
    { area: "Digitize",  item: "Camadas presentes",           ok: rules.length > 0, note: `${rules.length} camada(s)` },
    { area: "Blocos",    item: "Blocos de pontos gerados",    ok: blocks.length > 0, note: `${blocks.length} bloco(s)` },
    { area: "Cores",     item: "Cores hex válidas",           ok: rules.every((r) => /^#[0-9a-f]{6}$/i.test(r.hex)) },
    { area: "Pontos",    item: "Tipos de ponto reconhecidos", ok: rules.every((r) => ["satin","tatami","run"].includes(r.stitch)) },
    { area: "Underlay",  item: "Underlay definido",           ok: rules.every((r) => !!r.underlay) },
    { area: "Overrides", item: "Persistência ativa",          ok: typeof window !== "undefined" && !!window.localStorage },
    { area: "Atalhos",   item: "Atalhos registados",          ok: EDITOR_SHORTCUTS.length >= 10 },
  ];
}