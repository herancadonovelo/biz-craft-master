// Fase 7 — Custo, Stock & Exportação avançada (motor puro, sem UI).
// Consolida a estimativa de fio por cor, mapeamento a materiais reais do
// inventário, sugestão de novelos com buffer, alertas de stock e o cálculo
// hierárquico de custo → preço de venda com overhead, margem e IVA.

import type { Chart, Gauge } from "./engine";
import { consumoPorCor } from "./engine";

export interface MaterialLite {
  id: string;
  nome: string;
  unidade: string;
  stock: number;
  precoCompra: number;
  categoria?: string;
  marca?: string;
  codigoCor?: string;
}

export interface LinhaCusto {
  cor: string;              // hex ou "default"
  gramasBase: number;       // saída de consumoPorCor
  gramasComFloat: number;   // × floatMultiplier (Fair Isle)
  gramasComBuffer: number;  // + buffer %
  novelos: number;          // arredondado para cima
  material?: MaterialLite;  // mapeamento manual
  gramasPorNovelo: number;
  custo: number;            // novelos × precoCompra
  stockNovelos: number;     // quantos novelos há em stock (assumindo unidade=novelo)
  falta: number;            // novelos em falta (>=0)
}

export interface CalculoCustoInput {
  chart: Chart;
  gauge: Gauge;
  gramasPor100m: number;
  floatMultiplier?: number;
  bufferPct?: number;
  gramasPorNoveloDefault?: number;
  /** cor(hex ou "default") -> materialId (mapa manual) */
  mapCorMaterial?: Record<string, string>;
  materiais?: MaterialLite[];
}

export function calcularLinhasCusto(inp: CalculoCustoInput): LinhaCusto[] {
  const {
    chart, gauge, gramasPor100m,
    floatMultiplier = 1, bufferPct = 15,
    gramasPorNoveloDefault = 50,
    mapCorMaterial = {}, materiais = [],
  } = inp;

  const base = consumoPorCor(chart, gauge, gramasPor100m);
  const linhas: LinhaCusto[] = [];
  for (const [cor, v] of Object.entries(base)) {
    const mid = mapCorMaterial[cor];
    const mat = mid ? materiais.find((m) => m.id === mid) : undefined;
    const gpn = mat && mat.unidade === "g" ? 1 : gramasPorNoveloDefault;
    const gramasComFloat = Math.round(v.gramas * floatMultiplier * 10) / 10;
    const gramasComBuffer = Math.round(gramasComFloat * (1 + bufferPct / 100) * 10) / 10;
    const novelos = Math.max(1, Math.ceil(gramasComBuffer / gpn));
    const custo = mat ? Math.round(novelos * mat.precoCompra * 100) / 100 : 0;
    const stockNovelos = mat ? Math.floor(mat.stock) : 0;
    const falta = Math.max(0, novelos - stockNovelos);
    linhas.push({
      cor,
      gramasBase: v.gramas,
      gramasComFloat,
      gramasComBuffer,
      novelos,
      material: mat,
      gramasPorNovelo: gpn,
      custo,
      stockNovelos,
      falta,
    });
  }
  return linhas.sort((a, b) => b.gramasComBuffer - a.gramasComBuffer);
}

export interface BreakdownInput {
  linhas: LinhaCusto[];
  horas: number;
  precoHora: number;
  precoFioGramaFallback: number; // usado para cores sem material mapeado
  extras: { nome: string; valor: number }[];
  overheadPct: number;
  margemPct: number;
  ivaPct: number;
}

export interface BreakdownOutput {
  custoFioMapeado: number;
  custoFioEstimado: number;
  custoMaoObra: number;
  custoExtras: number;
  subtotal: number;
  overhead: number;
  custoTotal: number;
  margem: number;
  precoSemIva: number;
  iva: number;
  precoComIva: number;
  gramasTotais: number;
}

export function calcularBreakdown(inp: BreakdownInput): BreakdownOutput {
  const custoFioMapeado = inp.linhas.reduce((s, l) => s + (l.material ? l.custo : 0), 0);
  const gramasSemMat = inp.linhas.reduce((s, l) => s + (l.material ? 0 : l.gramasComBuffer), 0);
  const custoFioEstimado = Math.round(gramasSemMat * inp.precoFioGramaFallback * 100) / 100;
  const custoMaoObra = Math.round(inp.horas * inp.precoHora * 100) / 100;
  const custoExtras = Math.round(inp.extras.reduce((s, e) => s + (e.valor || 0), 0) * 100) / 100;
  const subtotal = custoFioMapeado + custoFioEstimado + custoMaoObra + custoExtras;
  const overhead = Math.round(subtotal * (inp.overheadPct / 100) * 100) / 100;
  const custoTotal = Math.round((subtotal + overhead) * 100) / 100;
  const margem = Math.round(custoTotal * (inp.margemPct / 100) * 100) / 100;
  const precoSemIva = Math.round((custoTotal + margem) * 100) / 100;
  const iva = Math.round(precoSemIva * (inp.ivaPct / 100) * 100) / 100;
  const precoComIva = Math.round((precoSemIva + iva) * 100) / 100;
  const gramasTotais = Math.round(inp.linhas.reduce((s, l) => s + l.gramasComBuffer, 0) * 10) / 10;
  return {
    custoFioMapeado, custoFioEstimado, custoMaoObra, custoExtras,
    subtotal, overhead, custoTotal, margem, precoSemIva, iva, precoComIva,
    gramasTotais,
  };
}

/* ============================ EXPORTAÇÕES ============================ */

export function linhasParaCsvBom(linhas: LinhaCusto[]): string {
  const header = ["cor", "material", "marca", "codigoCor", "gramas_estim", "gramas_com_buffer", "novelos", "preco_un", "custo", "stock", "falta"];
  const rows = linhas.map((l) => [
    l.cor,
    l.material?.nome ?? "",
    l.material?.marca ?? "",
    l.material?.codigoCor ?? "",
    l.gramasBase.toFixed(1),
    l.gramasComBuffer.toFixed(1),
    String(l.novelos),
    (l.material?.precoCompra ?? 0).toFixed(2),
    l.custo.toFixed(2),
    String(l.stockNovelos),
    String(l.falta),
  ]);
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
}

function csvCell(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** Converte um SVG string em PNG data URL usando um canvas offscreen. */
export async function svgToPngDataUrl(svg: string, escala = 2): Promise<string> {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("Falha ao carregar SVG"));
      img.src = url;
    });
    const w = (img.naturalWidth || 800) * escala;
    const h = (img.naturalHeight || 600) * escala;
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D indisponível");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function baixarBlob(nome: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nome; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function baixarDataUrl(nome: string, dataUrl: string) {
  const a = document.createElement("a");
  a.href = dataUrl; a.download = nome; a.click();
}