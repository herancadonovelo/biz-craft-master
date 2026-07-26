/**
 * Fase 10 — Folha de padrão (pattern sheet) para bordado.
 *
 * Gera um PDF multi-página com capa (título, aro, estatísticas), gráfico
 * simbólico (raster do SVG) e legenda DMC com swatches de cor. Usa pdf-lib
 * (Worker-compat, já dependência do projeto).
 */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface DmcRow {
  code: string;
  nome: string;
  anchor?: string;
  hex: string;
  stitches: number;
  cm: number;
  temStock: boolean;
  stock: number;
  unidade: string;
}

export interface PatternSheetOptions {
  titulo: string;
  autor?: string;
  hoop?: string;
  aida?: number;           // contagem (0 = sem grelha)
  dimensaoCm?: { w: number; h: number };
  totalStitches?: number;
  totalColors?: number;
  linhas: DmcRow[];
  /** Data-URL PNG do gráfico (via canvas). Opcional. */
  chartPngDataUrl?: string;
  watermark?: string;
}

const hexToRgb = (hex: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return rgb(0.5, 0.5, 0.5);
  const n = parseInt(m[1], 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

/**
 * Rasteriza um SVG numa data-URL PNG à resolução alvo (px).
 * Usado para embeber o gráfico no PDF sem depender do DOM live.
 */
export async function svgToPngDataUrl(svg: SVGSVGElement, targetPx = 1400): Promise<string> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const vb = svg.viewBox.baseVal;
  const vw = vb && vb.width ? vb.width : svg.clientWidth || 595;
  const vh = vb && vb.height ? vb.height : svg.clientHeight || 842;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(vw));
  clone.setAttribute("height", String(vh));
  const xml = new XMLSerializer().serializeToString(clone);
  const url = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(xml)));
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error("Falha ao rasterizar SVG."));
    img.src = url;
  });
  const scale = targetPx / Math.max(vw, vh);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(vw * scale);
  canvas.height = Math.round(vh * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

/** Símbolos ASCII únicos por DMC (até 90 combinações razoáveis). */
const SYMBOLS = "★☆♥♦♣♠●○■□▲▼◆◇✚✖◐◑✱✿❀☂☀☁☾♪♫✎✔✧⬢⬡❍❖◈◉⊕⊗⊙⊛⊚⊘◍◌◎▣▤▥▦▧▨▩✪✫✬✭✮✯✰✲✳✴✵✶✷✸✹✺✻✼✽❃❄❅❆❈❉❊❋".split("");
export function assignSymbols(codes: string[]): Map<string, string> {
  const m = new Map<string, string>();
  codes.forEach((c, i) => m.set(c, SYMBOLS[i % SYMBOLS.length]));
  return m;
}

/**
 * Gera o PDF e devolve os bytes. Layout: capa + gráfico (1 página) + legenda
 * (paginada, 24 linhas por página).
 */
export async function buildPatternSheetPdf(opts: PatternSheetOptions): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontB = await pdf.embedFont(StandardFonts.HelveticaBold);

  const A4 = { w: 595.28, h: 841.89 };
  const symbols = assignSymbols(opts.linhas.map((r) => r.code));

  const addWatermark = (page: import("pdf-lib").PDFPage) => {
    if (!opts.watermark) return;
    page.drawText(opts.watermark, {
      x: 40, y: 20, size: 8, font, color: rgb(0.55, 0.55, 0.55), opacity: 0.6,
    });
  };

  // ---------- Capa ----------
  const capa = pdf.addPage([A4.w, A4.h]);
  capa.drawRectangle({ x: 0, y: A4.h - 140, width: A4.w, height: 140, color: rgb(0.96, 0.94, 0.9) });
  capa.drawText("PADRÃO DE BORDADO", { x: 40, y: A4.h - 60, size: 12, font, color: rgb(0.4, 0.3, 0.2) });
  capa.drawText(opts.titulo || "Sem título", { x: 40, y: A4.h - 100, size: 26, font: fontB, color: rgb(0.15, 0.15, 0.15) });
  if (opts.autor) capa.drawText("por " + opts.autor, { x: 40, y: A4.h - 122, size: 11, font, color: rgb(0.35, 0.35, 0.35) });

  let cy = A4.h - 200;
  const info = (label: string, value: string) => {
    capa.drawText(label, { x: 40, y: cy, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
    capa.drawText(value, { x: 200, y: cy, size: 11, font: fontB, color: rgb(0.1, 0.1, 0.1) });
    cy -= 20;
  };
  if (opts.hoop) info("Aro / hoop", opts.hoop);
  if (opts.aida) info("Grelha Aida", opts.aida + " ct");
  if (opts.dimensaoCm) info("Dimensão", `${opts.dimensaoCm.w.toFixed(1)} × ${opts.dimensaoCm.h.toFixed(1)} cm`);
  if (opts.totalStitches != null) info("Pontos totais", opts.totalStitches.toLocaleString());
  if (opts.totalColors != null) info("Cores DMC", String(opts.totalColors));
  info("Data", new Date().toLocaleDateString());
  addWatermark(capa);

  // ---------- Gráfico ----------
  if (opts.chartPngDataUrl) {
    const chartPage = pdf.addPage([A4.w, A4.h]);
    const pngBytes = await fetch(opts.chartPngDataUrl).then((r) => r.arrayBuffer());
    const png = await pdf.embedPng(pngBytes);
    const maxW = A4.w - 80, maxH = A4.h - 120;
    const scale = Math.min(maxW / png.width, maxH / png.height);
    const w = png.width * scale, h = png.height * scale;
    chartPage.drawText("Gráfico", { x: 40, y: A4.h - 40, size: 16, font: fontB });
    chartPage.drawImage(png, { x: (A4.w - w) / 2, y: (A4.h - h) / 2 - 20, width: w, height: h });
    addWatermark(chartPage);
  }

  // ---------- Legenda ----------
  const rowsPerPage = 24;
  const pages = Math.max(1, Math.ceil(opts.linhas.length / rowsPerPage));
  for (let p = 0; p < pages; p++) {
    const page = pdf.addPage([A4.w, A4.h]);
    page.drawText(`Legenda DMC ${p + 1}/${pages}`, { x: 40, y: A4.h - 40, size: 16, font: fontB });
    const headers = ["Sím.", "DMC", "Nome", "Anchor", "Cruzes", "Linha (cm)", "Stock"];
    const cols = [40, 80, 130, 300, 355, 410, 490];
    let y = A4.h - 70;
    headers.forEach((h, i) => page.drawText(h, { x: cols[i], y, size: 9, font: fontB, color: rgb(0.3, 0.3, 0.3) }));
    y -= 6;
    page.drawLine({ start: { x: 40, y }, end: { x: A4.w - 40, y }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
    y -= 14;
    const slice = opts.linhas.slice(p * rowsPerPage, (p + 1) * rowsPerPage);
    for (const r of slice) {
      // swatch
      page.drawRectangle({ x: cols[0], y: y - 2, width: 12, height: 12, color: hexToRgb(r.hex), borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 0.4 });
      page.drawText(symbols.get(r.code) || "•", { x: cols[0] + 15, y, size: 10, font });
      page.drawText(r.code, { x: cols[1], y, size: 9, font });
      page.drawText((r.nome || "").slice(0, 28), { x: cols[2], y, size: 9, font });
      page.drawText(r.anchor || "—", { x: cols[3], y, size: 9, font });
      page.drawText(String(r.stitches), { x: cols[4], y, size: 9, font });
      page.drawText(r.cm.toFixed(1), { x: cols[5], y, size: 9, font });
      const stk = r.temStock ? `${r.stock} ${r.unidade}` : "em falta";
      page.drawText(stk, { x: cols[6], y, size: 9, font, color: r.temStock ? rgb(0.1, 0.5, 0.2) : rgb(0.75, 0.2, 0.2) });
      y -= 18;
    }
    addWatermark(page);
  }

  return pdf.save();
}

export function downloadPdf(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}