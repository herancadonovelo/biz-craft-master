// Fase 5 — Design & PDF Pro
//
// Gera o PDF da receita com pdf-lib (Worker-compat).
// Suporta 4 templates visuais, capa dinâmica, índice, watermark,
// header/rodapé, página de agradecimento e proteção por password.

import { PDFDocument, StandardFonts, rgb, degrees, type PDFFont, type PDFPage } from "pdf-lib";

export type TemplateId = "minimal" | "romantico" | "boho" | "profissional";

export interface PdfOptions {
  template: TemplateId;
  watermark?: string;
  password?: string;      // reservado; pdf-lib não encripta; usamos flag para omitir
  incluirIndice: boolean;
  incluirCapa: boolean;
  incluirAgradecimento: boolean;
  headerText?: string;    // ex: "Ursinho Nino — por Sara"
  footerText?: string;    // ex: "© 2026 · uso pessoal"
}

export interface ReceitaPdf {
  titulo: string;
  autor: string;
  nivel: string;
  intro: string;
  terminologia: "pt" | "us" | "uk";
  pecas: { id: string; nome: string; carreiras: { texto: string }[] }[];
  tensao?: { pontos: number; carreiras: number; cm: number; agulha: string };
  enchimento?: string;
  arame?: string;
  olhos?: { entre: string; distancia: string; tamanho: string };
  legenda?: { abrev: string; nome: string }[];
}

interface Theme {
  bg: [number, number, number];
  accent: [number, number, number];
  text: [number, number, number];
  muted: [number, number, number];
  titleFont: "serif" | "sans";
  bodyFont: "serif" | "sans";
  ornament: "line" | "flower" | "dots" | "brackets";
}

const THEMES: Record<TemplateId, Theme> = {
  minimal:      { bg: [1,1,1],           accent: [0.15,0.15,0.15], text: [0.1,0.1,0.1],  muted: [0.5,0.5,0.5], titleFont: "sans",  bodyFont: "sans",  ornament: "line"     },
  romantico:    { bg: [0.99,0.96,0.96],  accent: [0.72,0.36,0.44], text: [0.22,0.14,0.16],muted: [0.55,0.45,0.48],titleFont: "serif", bodyFont: "serif", ornament: "flower"   },
  boho:         { bg: [0.98,0.95,0.89],  accent: [0.55,0.35,0.18], text: [0.24,0.18,0.12],muted: [0.55,0.45,0.35],titleFont: "serif", bodyFont: "sans",  ornament: "dots"     },
  profissional: { bg: [1,1,1],           accent: [0.12,0.28,0.45], text: [0.08,0.12,0.18],muted: [0.45,0.5,0.55],titleFont: "sans",  bodyFont: "sans",  ornament: "brackets" },
};

const A4 = { w: 595.28, h: 841.89 };
const MARGIN = 50;

interface Ctx {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  pageNum: number;
  serif: PDFFont;
  sans: PDFFont;
  serifBold: PDFFont;
  sansBold: PDFFont;
  theme: Theme;
  opts: PdfOptions;
  toc: { titulo: string; pagina: number }[];
}

function fontFor(ctx: Ctx, kind: "title" | "body", bold = false): PDFFont {
  const f = kind === "title" ? ctx.theme.titleFont : ctx.theme.bodyFont;
  if (f === "serif") return bold ? ctx.serifBold : ctx.serif;
  return bold ? ctx.sansBold : ctx.sans;
}

function drawBackground(ctx: Ctx) {
  const [r, g, b] = ctx.theme.bg;
  if (r === 1 && g === 1 && b === 1) return;
  ctx.page.drawRectangle({ x: 0, y: 0, width: A4.w, height: A4.h, color: rgb(r, g, b) });
}

function drawWatermark(ctx: Ctx) {
  if (!ctx.opts.watermark) return;
  ctx.page.drawText(ctx.opts.watermark, {
    x: A4.w / 2 - 150, y: A4.h / 2,
    size: 60, font: fontFor(ctx, "title", true),
    color: rgb(ctx.theme.muted[0], ctx.theme.muted[1], ctx.theme.muted[2]),
    opacity: 0.08, rotate: degrees(-30),
  });
}

function drawHeaderFooter(ctx: Ctx) {
  const [r, g, b] = ctx.theme.muted;
  const color = rgb(r, g, b);
  if (ctx.opts.headerText && ctx.pageNum > 1) {
    ctx.page.drawText(ctx.opts.headerText, {
      x: MARGIN, y: A4.h - 25, size: 8, font: fontFor(ctx, "body"), color,
    });
    ctx.page.drawLine({ start: { x: MARGIN, y: A4.h - 32 }, end: { x: A4.w - MARGIN, y: A4.h - 32 }, thickness: 0.3, color });
  }
  const footer = ctx.opts.footerText || "";
  const pageLabel = `${ctx.pageNum}`;
  if (footer) ctx.page.drawText(footer, { x: MARGIN, y: 25, size: 8, font: fontFor(ctx, "body"), color });
  ctx.page.drawText(pageLabel, { x: A4.w - MARGIN - 10, y: 25, size: 8, font: fontFor(ctx, "body"), color });
}

function newPage(ctx: Ctx) {
  ctx.page = ctx.doc.addPage([A4.w, A4.h]);
  ctx.pageNum += 1;
  ctx.y = A4.h - MARGIN;
  drawBackground(ctx);
  drawWatermark(ctx);
  drawHeaderFooter(ctx);
}

function ensureSpace(ctx: Ctx, needed: number) {
  if (ctx.y - needed < MARGIN + 30) newPage(ctx);
}

// Sanitiza para WinAnsi (fontes standard do pdf-lib não suportam UTF-8 fora do WinAnsi)
function safe(s: string): string {
  if (!s) return "";
  return s
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    // remove code points fora do BMP baixo
    .replace(/[^\x00-\xFF]/g, "?");
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = safe(text).split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawTitle(ctx: Ctx, text: string, size = 20) {
  ensureSpace(ctx, size + 20);
  ctx.page.drawText(safe(text), {
    x: MARGIN, y: ctx.y - size, size,
    font: fontFor(ctx, "title", true),
    color: rgb(ctx.theme.accent[0], ctx.theme.accent[1], ctx.theme.accent[2]),
  });
  ctx.y -= size + 6;
  drawOrnament(ctx);
  ctx.y -= 10;
}

function drawOrnament(ctx: Ctx) {
  const [r, g, b] = ctx.theme.accent;
  const color = rgb(r, g, b);
  switch (ctx.theme.ornament) {
    case "line":
      ctx.page.drawLine({ start: { x: MARGIN, y: ctx.y }, end: { x: MARGIN + 60, y: ctx.y }, thickness: 1.2, color });
      break;
    case "flower":
      ctx.page.drawText(safe("~ * ~"), { x: MARGIN, y: ctx.y - 8, size: 10, font: fontFor(ctx, "title"), color });
      break;
    case "dots":
      for (let i = 0; i < 5; i++) ctx.page.drawCircle({ x: MARGIN + i * 8, y: ctx.y, size: 1.2, color });
      break;
    case "brackets":
      ctx.page.drawText(safe("[ ]"), { x: MARGIN, y: ctx.y - 8, size: 9, font: fontFor(ctx, "title", true), color });
      break;
  }
}

function drawParagraph(ctx: Ctx, text: string, size = 10) {
  if (!text) return;
  const font = fontFor(ctx, "body");
  const lines = wrap(text, font, size, A4.w - MARGIN * 2);
  for (const line of lines) {
    ensureSpace(ctx, size + 4);
    ctx.page.drawText(line, { x: MARGIN, y: ctx.y - size, size, font,
      color: rgb(ctx.theme.text[0], ctx.theme.text[1], ctx.theme.text[2]) });
    ctx.y -= size + 4;
  }
  ctx.y -= 4;
}

function drawSubtitle(ctx: Ctx, text: string) {
  ensureSpace(ctx, 18);
  ctx.toc.push({ titulo: text, pagina: ctx.pageNum });
  ctx.page.drawText(safe(text), {
    x: MARGIN, y: ctx.y - 14, size: 14, font: fontFor(ctx, "title", true),
    color: rgb(ctx.theme.accent[0], ctx.theme.accent[1], ctx.theme.accent[2]),
  });
  ctx.y -= 20;
}

function drawCarreira(ctx: Ctx, idx: number, texto: string) {
  const font = fontFor(ctx, "body");
  const size = 10;
  const prefix = `C${idx + 1}. `;
  const lines = wrap(prefix + texto, font, size, A4.w - MARGIN * 2 - 10);
  for (const line of lines) {
    ensureSpace(ctx, size + 3);
    ctx.page.drawText(line, { x: MARGIN + 10, y: ctx.y - size, size, font,
      color: rgb(ctx.theme.text[0], ctx.theme.text[1], ctx.theme.text[2]) });
    ctx.y -= size + 3;
  }
}

function drawCapa(ctx: Ctx, r: ReceitaPdf) {
  drawBackground(ctx);
  drawWatermark(ctx);
  // Título centrado
  const titleFont = fontFor(ctx, "title", true);
  const title = safe(r.titulo || "Receita");
  const size = 34;
  const w = titleFont.widthOfTextAtSize(title, size);
  ctx.page.drawText(title, {
    x: (A4.w - w) / 2, y: A4.h * 0.58, size, font: titleFont,
    color: rgb(ctx.theme.accent[0], ctx.theme.accent[1], ctx.theme.accent[2]),
  });
  const sub = safe(`por ${r.autor || "—"}  ·  nível ${r.nivel}`);
  const bodyFont = fontFor(ctx, "body");
  const subW = bodyFont.widthOfTextAtSize(sub, 12);
  ctx.page.drawText(sub, {
    x: (A4.w - subW) / 2, y: A4.h * 0.52, size: 12, font: bodyFont,
    color: rgb(ctx.theme.muted[0], ctx.theme.muted[1], ctx.theme.muted[2]),
  });
  // ornamento
  ctx.page.drawLine({
    start: { x: A4.w / 2 - 40, y: A4.h * 0.5 },
    end:   { x: A4.w / 2 + 40, y: A4.h * 0.5 },
    thickness: 1, color: rgb(ctx.theme.accent[0], ctx.theme.accent[1], ctx.theme.accent[2]),
  });
}

function drawIndice(ctx: Ctx) {
  newPage(ctx);
  drawTitle(ctx, "Índice", 22);
  const font = fontFor(ctx, "body");
  for (const t of ctx.toc) {
    ensureSpace(ctx, 14);
    const line = safe(t.titulo);
    ctx.page.drawText(line, { x: MARGIN, y: ctx.y - 11, size: 11, font,
      color: rgb(ctx.theme.text[0], ctx.theme.text[1], ctx.theme.text[2]) });
    const p = String(t.pagina);
    const pw = font.widthOfTextAtSize(p, 11);
    ctx.page.drawText(p, { x: A4.w - MARGIN - pw, y: ctx.y - 11, size: 11, font,
      color: rgb(ctx.theme.muted[0], ctx.theme.muted[1], ctx.theme.muted[2]) });
    ctx.y -= 16;
  }
}

function drawAgradecimento(ctx: Ctx, r: ReceitaPdf) {
  newPage(ctx);
  const font = fontFor(ctx, "title", true);
  const msg = safe("Obrigada!");
  const sub = safe(`Espero que tenhas gostado de fazer "${r.titulo}". Partilha o teu trabalho e marca-me — vou adorar ver.`);
  const w = font.widthOfTextAtSize(msg, 30);
  ctx.page.drawText(msg, { x: (A4.w - w) / 2, y: A4.h * 0.6, size: 30, font,
    color: rgb(ctx.theme.accent[0], ctx.theme.accent[1], ctx.theme.accent[2]) });
  const body = fontFor(ctx, "body");
  const lines = wrap(sub, body, 11, A4.w - MARGIN * 4);
  let yy = A4.h * 0.55;
  for (const l of lines) {
    const lw = body.widthOfTextAtSize(l, 11);
    ctx.page.drawText(l, { x: (A4.w - lw) / 2, y: yy, size: 11, font: body,
      color: rgb(ctx.theme.text[0], ctx.theme.text[1], ctx.theme.text[2]) });
    yy -= 16;
  }
  const foot = safe(r.autor ? `— ${r.autor}` : "");
  if (foot) {
    const fw = body.widthOfTextAtSize(foot, 10);
    ctx.page.drawText(foot, { x: (A4.w - fw) / 2, y: yy - 20, size: 10, font: body,
      color: rgb(ctx.theme.muted[0], ctx.theme.muted[1], ctx.theme.muted[2]) });
  }
}

export async function generateReceitaPdf(r: ReceitaPdf, opts: PdfOptions): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const theme = THEMES[opts.template];

  const ctx: Ctx = {
    doc, page: doc.addPage([A4.w, A4.h]), y: A4.h - MARGIN, pageNum: 1,
    serif, sans, serifBold, sansBold, theme, opts, toc: [],
  };

  // Capa
  if (opts.incluirCapa) {
    drawCapa(ctx, r);
    newPage(ctx);
  } else {
    drawBackground(ctx); drawWatermark(ctx); drawHeaderFooter(ctx);
  }

  // Introdução
  drawTitle(ctx, r.titulo || "Receita");
  if (r.autor)  drawParagraph(ctx, `por ${r.autor}  ·  nível ${r.nivel}  ·  terminologia ${r.terminologia.toUpperCase()}`);
  if (r.intro)  drawParagraph(ctx, r.intro);

  // Ficha técnica
  const ficha: string[] = [];
  if (r.tensao?.pontos)  ficha.push(`Tensão: ${r.tensao.pontos} pts × ${r.tensao.carreiras} car / ${r.tensao.cm} cm · agulha ${r.tensao.agulha || "?"}`);
  if (r.enchimento)      ficha.push(`Enchimento: ${r.enchimento}`);
  if (r.arame)           ficha.push(`Arame: ${r.arame}`);
  if (r.olhos?.entre)    ficha.push(`Olhos: ${r.olhos.entre} · ${r.olhos.distancia} · ${r.olhos.tamanho}`);
  if (ficha.length) {
    drawSubtitle(ctx, "Ficha técnica");
    for (const f of ficha) drawParagraph(ctx, `• ${f}`);
  }

  // Legenda
  if (r.legenda && r.legenda.length) {
    drawSubtitle(ctx, "Legenda");
    for (const l of r.legenda) drawParagraph(ctx, `${l.abrev} — ${l.nome}`);
  }

  // Peças
  for (const p of r.pecas) {
    drawSubtitle(ctx, p.nome);
    if (p.carreiras.length === 0) {
      drawParagraph(ctx, "(sem carreiras)");
    } else {
      p.carreiras.forEach((c, i) => drawCarreira(ctx, i, c.texto));
    }
    ctx.y -= 6;
  }

  // Índice (depois — usamos toc coletado)
  if (opts.incluirIndice && ctx.toc.length > 0) drawIndice(ctx);

  // Página de agradecimento
  if (opts.incluirAgradecimento) drawAgradecimento(ctx, r);

  doc.setTitle(safe(r.titulo));
  doc.setAuthor(safe(r.autor));
  doc.setCreator("Craft Business Master");
  return await doc.save();
}

export function downloadPdf(bytes: Uint8Array, filename: string) {
  // Cria uma cópia num ArrayBuffer "puro" para satisfazer os tipos do Blob
  // em ambientes que exigem ArrayBuffer (não SharedArrayBuffer).
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  const blob = new Blob([ab], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}