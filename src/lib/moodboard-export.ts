/**
 * Fase 6 do editor de moodboards: exportação avançada.
 * Funções puras (sem DOM) que calculam presets, área, DPI e nomes de ficheiro.
 */
import type { Caixa } from "./moodboard-multi";

export type FormatoExport = "png" | "jpeg" | "svg" | "pdf";

export interface PresetTamanho {
  id: string;
  nome: string;
  /** Dimensões alvo em pontos (72 dpi). "original" mantém a folha. */
  w: number | null;
  h: number | null;
}

/** Presets disponíveis no diálogo de exportação. */
export const PRESETS_EXPORT: PresetTamanho[] = [
  { id: "original", nome: "Original (folha)", w: null, h: null },
  { id: "a4", nome: "A4 retrato (595×842)", w: 595, h: 842 },
  { id: "a4-paisagem", nome: "A4 paisagem (842×595)", w: 842, h: 595 },
  { id: "a5", nome: "A5 retrato (420×595)", w: 420, h: 595 },
  { id: "quadrado", nome: "Quadrado 1080", w: 1080, h: 1080 },
  { id: "story", nome: "Story 1080×1920", w: 1080, h: 1920 },
  { id: "pinterest", nome: "Pinterest 1000×1500", w: 1000, h: 1500 },
];

export const DPI_OPCOES = [72, 150, 300, 600] as const;

export function presetPorId(id: string): PresetTamanho {
  return PRESETS_EXPORT.find((p) => p.id === id) ?? PRESETS_EXPORT[0];
}

/**
 * Área a exportar: a folha inteira, ou a caixa envolvente da seleção
 * (com margem) recortada aos limites da folha.
 */
export function areaExportacao(
  folha: { largura: number; altura: number },
  selecao: Caixa | null,
  margem = 16,
): Caixa {
  if (!selecao || selecao.w <= 0 || selecao.h <= 0) {
    return { x: 0, y: 0, w: folha.largura, h: folha.altura };
  }
  const x = Math.max(0, Math.floor(selecao.x - margem));
  const y = Math.max(0, Math.floor(selecao.y - margem));
  const x2 = Math.min(folha.largura, Math.ceil(selecao.x + selecao.w + margem));
  const y2 = Math.min(folha.altura, Math.ceil(selecao.y + selecao.h + margem));
  return { x, y, w: Math.max(1, x2 - x), h: Math.max(1, y2 - y) };
}

export interface PlanoExport {
  /** Dimensões finais do ficheiro, em pixéis. */
  larguraPx: number;
  alturaPx: number;
  /** Dimensões em pontos (72 dpi) — usadas no PDF. */
  larguraPt: number;
  alturaPt: number;
  /** Multiplicador a aplicar ao render da área de origem. */
  pixelRatio: number;
}

const MAX_PIXEL_RATIO = 8;
const MAX_LADO_PX = 12000;

/**
 * Calcula o plano de exportação: ajusta a área ao preset (mantendo a
 * proporção, "contain") e converte o DPI em multiplicador de render.
 */
export function planoExport(area: Caixa, preset: PresetTamanho, dpi: number): PlanoExport {
  const dpiSeguro = Math.min(1200, Math.max(36, Math.round(dpi) || 72));
  let larguraPt = area.w;
  let alturaPt = area.h;
  if (preset.w && preset.h) {
    const escala = Math.min(preset.w / area.w, preset.h / area.h);
    larguraPt = Math.round(area.w * escala);
    alturaPt = Math.round(area.h * escala);
  }
  const fator = dpiSeguro / 72;
  let pixelRatio = (larguraPt / area.w) * fator;
  pixelRatio = Math.min(MAX_PIXEL_RATIO, Math.max(0.25, pixelRatio));
  let larguraPx = Math.round(area.w * pixelRatio);
  let alturaPx = Math.round(area.h * pixelRatio);
  const maior = Math.max(larguraPx, alturaPx);
  if (maior > MAX_LADO_PX) {
    const corte = MAX_LADO_PX / maior;
    pixelRatio *= corte;
    larguraPx = Math.round(larguraPx * corte);
    alturaPx = Math.round(alturaPx * corte);
  }
  return { larguraPx, alturaPx, larguraPt, alturaPt, pixelRatio };
}

/** Qualidade 1–100 → 0–1 aceite por toJpeg/toDataURL. */
export function qualidadeJpeg(valor: number): number {
  const v = Number.isFinite(valor) ? valor : 92;
  return Math.min(1, Math.max(0.1, Math.round(v) / 100));
}

const EXT: Record<FormatoExport, string> = { png: "png", jpeg: "jpg", svg: "svg", pdf: "pdf" };

/** Nome de ficheiro seguro, com sufixo quando se exporta só a seleção. */
export function nomeFicheiro(titulo: string, formato: FormatoExport, apenasSelecao = false): string {
  const base = (titulo || "moodboard")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "moodboard";
  return `${base}${apenasSelecao ? "-selecao" : ""}.${EXT[formato]}`;
}

/**
 * Reenquadra um SVG (data URL de html-to-image) numa nova área, envolvendo-o
 * num SVG exterior com o viewBox da área pedida.
 */
export function recortarSvgDataUrl(dataUrl: string, area: Caixa, saida: { w: number; h: number }): string {
  const marcador = "data:image/svg+xml;charset=utf-8,";
  const interior = dataUrl.startsWith(marcador) ? decodeURIComponent(dataUrl.slice(marcador.length)) : dataUrl;
  const envolvido =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${saida.w}" height="${saida.h}" ` +
    `viewBox="${area.x} ${area.y} ${area.w} ${area.h}">${interior}</svg>`;
  return marcador + encodeURIComponent(envolvido);
}
