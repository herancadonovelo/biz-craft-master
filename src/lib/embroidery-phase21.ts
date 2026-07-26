/**
 * Fase 21 — Relatórios & PDFs configuráveis.
 *
 * Utilitários puros e client-safe. Geram:
 *  - Relatório de produção (pontos/cor, comprimento, tempo)
 *  - Timeline de trocas de cor / paragens
 *  - PDF configurável (formato, margens, orientação, grelha, stats)
 *  - Export CSV cruzando quantidades por cor com Inventário
 *  - PDF unificado (cross-stitch + shopping list DMC)
 *  - Checklist de preparação/inspeção final
 */
import { PDFDocument, StandardFonts, rgb, PageSizes } from "pdf-lib";
import type { BlockLite } from "./embroidery-phase18";
import {
  estimateThread, buildConsumption, totalCost,
  type MaterialLite, type ThreadEstimate, type ScaleCalibration,
} from "./embroidery-phase18";
import { formatCurrency, getCurrencyOption } from "./store";

// ─── Tipos e defaults ────────────────────────────────────────────────

export type PageFormat = "A4" | "A3" | "Letter" | "Legal";
export type PageOrientation = "portrait" | "landscape";

export interface PdfLayout {
  format: PageFormat;
  orientation: PageOrientation;
  marginMm: number;         // margem uniforme
  showGrid: boolean;
  gridStepMm: number;
  showStats: boolean;
  showLegend: boolean;
  showAnnotations: boolean;
  scalePercent: number;     // 100 = escala 1:1
  title: string;
  author?: string;
  notes?: string;
}

export const DEFAULT_PDF_LAYOUT: PdfLayout = {
  format: "A4",
  orientation: "portrait",
  marginMm: 15,
  showGrid: true,
  gridStepMm: 10,
  showStats: true,
  showLegend: true,
  showAnnotations: true,
  scalePercent: 100,
  title: "Padrão de Bordado",
};

const MM_PER_PT = 25.4 / 72;
const mm = (v: number) => v / MM_PER_PT;

function pageSize(fmt: PageFormat): [number, number] {
  switch (fmt) {
    case "A3":     return PageSizes.A3;
    case "Letter": return PageSizes.Letter;
    case "Legal":  return PageSizes.Legal;
    case "A4":
    default:       return PageSizes.A4;
  }
}

// ─── Relatório de produção ───────────────────────────────────────────

export interface ColorStat {
  color: string;
  stitches: number;
  lengthMm: number;
  minutes: number;
}

export interface ProductionReport {
  totalStitches: number;
  totalLengthMm: number;
  totalMinutes: number;
  colorChanges: number;
  stops: number;
  perColor: ColorStat[];
}

export function buildProductionReport(
  blocks: BlockLite[],
  cal: ScaleCalibration,
  spm = 800,
): ProductionReport {
  const estimates: ThreadEstimate[] = estimateThread(blocks, cal);
  const perColor: ColorStat[] = estimates.map((e, i) => {
    const stitches = blocks[i]?.stitches.length ?? e.stitches;
    const minutes = spm > 0 ? stitches / spm : 0;
    return { color: e.color, stitches, lengthMm: e.lengthMm, minutes };
  });
  const totalStitches = perColor.reduce((s, r) => s + r.stitches, 0);
  const totalLengthMm = perColor.reduce((s, r) => s + r.lengthMm, 0);
  const totalMinutes = perColor.reduce((s, r) => s + r.minutes, 0);
  const colorChanges = Math.max(0, blocks.length - 1);
  // paragens: trocas de cor + saltos longos entre blocos (heurístico)
  const stops = colorChanges;
  return { totalStitches, totalLengthMm, totalMinutes, colorChanges, stops, perColor };
}

// ─── CSV de inventário cruzado ───────────────────────────────────────

export function buildInventoryCsv(
  report: ProductionReport,
  materials: MaterialLite[],
  cal: ScaleCalibration,
  currencyCode?: string,
): string {
  const estimates: ThreadEstimate[] = report.perColor.map((c) => ({
    color: c.color, lengthMm: c.lengthMm, stitches: c.stitches, strands: 2,
  }));
  const rows = buildConsumption(estimates, materials);
  const cc = getCurrencyOption(currencyCode).code.toLowerCase();
  const header = `cor_hex;material;codigo;unidade;quantidade;preco_unit_${cc};custo_${cc};stock_atual;falta`;
  const lines = rows.map((r) => {
    const stock = r.material?.stock ?? 0;
    const falta = Math.max(0, r.units - stock);
    return [
      r.color,
      r.material?.nome ?? "—",
      r.material?.codigoCor ?? "",
      r.material?.unidade ?? "",
      r.units.toFixed(3),
      (r.material?.precoCompra ?? 0).toFixed(2),
      r.cost.toFixed(2),
      stock.toFixed(3),
      falta.toFixed(3),
    ].join(";");
  });
  return [header, ...lines].join("\n");
}

// ─── Checklist de preparação/inspeção ────────────────────────────────

export interface ChecklistItem {
  id: string;
  label: string;
  suggested: boolean;
  detail?: string;
}

export function buildPrepChecklist(report: ProductionReport, hoopMm?: { w: number; h: number }): ChecklistItem[] {
  const hrs = report.totalMinutes / 60;
  return [
    { id: "bobbin", label: "Bobine cheia (mínimo 80%)", suggested: true },
    { id: "needle", label: "Agulha nova (75/11 para tecidos finos, 90/14 para densos)", suggested: true },
    { id: "stabilizer", label: "Estabilizador adequado ao tecido", suggested: true },
    { id: "hoop", label: hoopMm ? `Bastidor ${hoopMm.w}×${hoopMm.h} mm montado e tensionado` : "Bastidor montado e tensionado", suggested: true },
    { id: "threads", label: `Linha suficiente para ${(report.totalLengthMm / 1000).toFixed(1)} m totais`, suggested: true },
    { id: "colors", label: `${report.perColor.length} cores preparadas na ordem correta`, suggested: true },
    { id: "time", label: `Reservar ≈ ${hrs.toFixed(1)} h de máquina`, suggested: hrs > 0.5 },
    { id: "trim", label: "Tesoura de bicos para trims manuais", suggested: report.colorChanges > 3 },
    { id: "backup", label: "Guardar cópia do ficheiro DST/PES antes de exportar", suggested: true },
    { id: "inspection", label: "Inspeção visual final (tensão, densidade, franzimento)", suggested: true },
  ];
}

// ─── PDF configurável ────────────────────────────────────────────────

export interface PdfExportInput {
  layout: PdfLayout;
  report: ProductionReport;
  hoopMm?: { w: number; h: number };
  designMm?: { w: number; h: number };
  chartPng?: Uint8Array;   // pré-render do gráfico
  shoppingRows?: {
    hex: string; nome?: string; codigo?: string;
    stitches: number; units: number; unidade: string; cost: number; stock: number;
  }[];
  checklist?: ChecklistItem[];
  /** ISO-4217 currency to render on totals and shopping list. Defaults to store value. */
  currencyCode?: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = h.length === 3
    ? h.split("").map((c) => parseInt(c + c, 16))
    : [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  return [n[0] / 255, n[1] / 255, n[2] / 255];
}

export async function buildConfigurablePdf(inp: PdfExportInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const currencyLabel = getCurrencyOption(inp.currencyCode).symbol;

  let [pw, ph] = pageSize(inp.layout.format);
  if (inp.layout.orientation === "landscape") [pw, ph] = [ph, pw];
  const margin = mm(inp.layout.marginMm);

  // ── Capa + gráfico ──
  const p1 = doc.addPage([pw, ph]);
  p1.drawText(inp.layout.title, { x: margin, y: ph - margin - 18, size: 18, font: bold });
  if (inp.layout.author) {
    p1.drawText(`Autor: ${inp.layout.author}`, {
      x: margin, y: ph - margin - 38, size: 10, font,
      color: rgb(0.35, 0.35, 0.35),
    });
  }
  const meta = [
    inp.designMm ? `Desenho: ${inp.designMm.w.toFixed(1)}×${inp.designMm.h.toFixed(1)} mm` : "",
    inp.hoopMm ? `Bastidor: ${inp.hoopMm.w}×${inp.hoopMm.h} mm` : "",
    `Escala: ${inp.layout.scalePercent}%`,
  ].filter(Boolean).join("   ·   ");
  p1.drawText(meta, { x: margin, y: ph - margin - 54, size: 9, font, color: rgb(0.4, 0.4, 0.4) });

  // Área útil do gráfico
  const areaY = margin + 200;
  const areaX = margin;
  const areaW = pw - margin * 2;
  const areaH = ph - areaY - margin - 70;
  p1.drawRectangle({
    x: areaX, y: areaY, width: areaW, height: areaH,
    borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 0.5,
  });

  if (inp.chartPng) {
    try {
      const img = await doc.embedPng(inp.chartPng);
      const s = inp.layout.scalePercent / 100;
      const iw = img.width * s;
      const ih = img.height * s;
      const scale = Math.min(areaW / iw, areaH / ih, 1);
      const drawW = iw * scale;
      const drawH = ih * scale;
      p1.drawImage(img, {
        x: areaX + (areaW - drawW) / 2,
        y: areaY + (areaH - drawH) / 2,
        width: drawW, height: drawH,
      });
    } catch { /* ignore invalid PNG */ }
  }

  if (inp.layout.showGrid) {
    const step = mm(inp.layout.gridStepMm);
    const gray = rgb(0.85, 0.85, 0.9);
    for (let x = areaX; x <= areaX + areaW; x += step) {
      p1.drawLine({ start: { x, y: areaY }, end: { x, y: areaY + areaH }, thickness: 0.25, color: gray });
    }
    for (let y = areaY; y <= areaY + areaH; y += step) {
      p1.drawLine({ start: { x: areaX, y }, end: { x: areaX + areaW, y }, thickness: 0.25, color: gray });
    }
  }

  if (inp.layout.showAnnotations && inp.designMm) {
    p1.drawText(`${inp.designMm.w.toFixed(1)} mm`, {
      x: areaX + areaW / 2 - 20, y: areaY - 12, size: 8, font, color: rgb(0.3, 0.3, 0.3),
    });
    p1.drawText(`${inp.designMm.h.toFixed(1)} mm`, {
      x: areaX - 30, y: areaY + areaH / 2, size: 8, font, color: rgb(0.3, 0.3, 0.3),
    });
  }

  if (inp.layout.showStats) {
    const r = inp.report;
    const lines = [
      `Pontos totais: ${r.totalStitches.toLocaleString()}`,
      `Comprimento: ${(r.totalLengthMm / 1000).toFixed(2)} m`,
      `Tempo estimado: ${(r.totalMinutes / 60).toFixed(2)} h`,
      `Cores: ${r.perColor.length}   ·   Trocas: ${r.colorChanges}   ·   Paragens: ${r.stops}`,
    ];
    let ty = margin + 50;
    lines.forEach((l) => {
      p1.drawText(l, { x: margin, y: ty, size: 9, font });
      ty -= 12;
    });
  }

  // ── Legenda + timeline ──
  if (inp.layout.showLegend && inp.report.perColor.length) {
    const p2 = doc.addPage([pw, ph]);
    p2.drawText("Cores, timeline e consumo", {
      x: margin, y: ph - margin - 16, size: 14, font: bold,
    });
    let y = ph - margin - 40;
    p2.drawText("#  cor    pontos     comprimento    tempo", {
      x: margin, y, size: 9, font: bold, color: rgb(0.2, 0.2, 0.2),
    });
    y -= 14;
    inp.report.perColor.forEach((c, i) => {
      if (y < margin + 40) return;
      const [rr, gg, bb] = hexToRgb(c.color);
      p2.drawRectangle({ x: margin + 20, y: y - 2, width: 12, height: 10, color: rgb(rr, gg, bb) });
      p2.drawText(String(i + 1).padStart(2, "0"), { x: margin, y, size: 9, font });
      p2.drawText(c.color, { x: margin + 40, y, size: 9, font });
      p2.drawText(c.stitches.toLocaleString(), { x: margin + 110, y, size: 9, font });
      p2.drawText(`${(c.lengthMm / 1000).toFixed(2)} m`, { x: margin + 200, y, size: 9, font });
      p2.drawText(`${c.minutes.toFixed(1)} min`, { x: margin + 300, y, size: 9, font });
      y -= 12;
    });
  }

  // ── Shopping list DMC ──
  if (inp.shoppingRows && inp.shoppingRows.length) {
    const p3 = doc.addPage([pw, ph]);
    p3.drawText("Shopping list DMC / Inventário", {
      x: margin, y: ph - margin - 16, size: 14, font: bold,
    });
    let y = ph - margin - 40;
    p3.drawText(`cor    código  material            unidade   qtd     custo ${currencyLabel}`, {
      x: margin, y, size: 9, font: bold,
    });
    y -= 14;
    let total = 0;
    inp.shoppingRows.forEach((r) => {
      if (y < margin + 40) return;
      const [rr, gg, bb] = hexToRgb(r.hex);
      p3.drawRectangle({ x: margin, y: y - 2, width: 12, height: 10, color: rgb(rr, gg, bb) });
      p3.drawText((r.codigo || "").slice(0, 6), { x: margin + 20, y, size: 8, font });
      p3.drawText((r.nome || "—").slice(0, 22), { x: margin + 70, y, size: 8, font });
      p3.drawText(r.unidade, { x: margin + 210, y, size: 8, font });
      p3.drawText(r.units.toFixed(2), { x: margin + 270, y, size: 8, font });
      p3.drawText(r.cost.toFixed(2), { x: margin + 320, y, size: 8, font });
      total += r.cost;
      y -= 12;
    });
    p3.drawText(`Total estimado: ${formatCurrency(total, inp.currencyCode)}`, {
      x: margin, y: margin + 20, size: 11, font: bold,
    });
  }

  // ── Checklist ──
  if (inp.checklist && inp.checklist.length) {
    const p4 = doc.addPage([pw, ph]);
    p4.drawText("Checklist de preparação e inspeção", {
      x: margin, y: ph - margin - 16, size: 14, font: bold,
    });
    let y = ph - margin - 40;
    inp.checklist.forEach((c) => {
      if (y < margin + 40) return;
      p4.drawRectangle({
        x: margin, y: y - 2, width: 10, height: 10,
        borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 0.5,
      });
      const prefix = c.suggested ? "" : "(opcional) ";
      p4.drawText(`${prefix}${c.label}`, { x: margin + 16, y, size: 10, font });
      y -= 14;
    });
    if (inp.layout.notes) {
      p4.drawText("Notas:", { x: margin, y: margin + 60, size: 10, font: bold });
      p4.drawText(inp.layout.notes.slice(0, 500), {
        x: margin, y: margin + 44, size: 9, font, maxWidth: pw - margin * 2, lineHeight: 12,
      });
    }
  }

  return await doc.save();
}

// ─── Persistência ────────────────────────────────────────────────────

const LAYOUT_KEY = "embroidery-phase21-layout";
const SPM_KEY = "embroidery-phase21-spm";

export function loadPdfLayout(projectId?: string): PdfLayout {
  if (typeof window === "undefined") return DEFAULT_PDF_LAYOUT;
  try {
    const key = projectId ? `${LAYOUT_KEY}:${projectId}` : LAYOUT_KEY;
    const raw = window.localStorage.getItem(key);
    return raw ? { ...DEFAULT_PDF_LAYOUT, ...JSON.parse(raw) } : DEFAULT_PDF_LAYOUT;
  } catch { return DEFAULT_PDF_LAYOUT; }
}

export function savePdfLayout(l: PdfLayout, projectId?: string) {
  if (typeof window === "undefined") return;
  try {
    const key = projectId ? `${LAYOUT_KEY}:${projectId}` : LAYOUT_KEY;
    window.localStorage.setItem(key, JSON.stringify(l));
  } catch { /* ignore */ }
}

export function loadSpm(projectId?: string): number {
  if (typeof window === "undefined") return 800;
  try {
    const key = projectId ? `${SPM_KEY}:${projectId}` : SPM_KEY;
    return Number(window.localStorage.getItem(key)) || 800;
  } catch { return 800; }
}

export function saveSpm(v: number, projectId?: string) {
  if (typeof window === "undefined") return;
  try {
    const key = projectId ? `${SPM_KEY}:${projectId}` : SPM_KEY;
    window.localStorage.setItem(key, String(v));
  } catch { /* ignore */ }
}

// ─── Download helpers ────────────────────────────────────────────────

export function downloadBlob(data: Uint8Array | string, filename: string, mime: string) {
  const blob = typeof data === "string"
    ? new Blob([data], { type: mime })
    : new Blob([data.slice().buffer as ArrayBuffer], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}