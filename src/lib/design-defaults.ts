import type { DesignSettings } from "@/lib/store";

// Snapshot dos tokens de design "de fábrica" — deve espelhar exactamente
// o objecto `design` inicial em src/lib/store.ts (função `seed`).
// Usado para o botão "Restaurar personalização default".
export const DESIGN_DEFAULTS: DesignSettings = Object.freeze({
  modo: "light",
  accent: "0.65 0.15 290",
  sidebarBg: "0.25 0.025 258",
  raio: 1.35,
  densidade: "confortavel",
  nomeNegocio: "Craftme Business Master",
  precoHoraBase: 7,
  idioma: "en",
  idiomaAuto: false,
  moeda: "EUR",
  pinContas: "0000",
  toqueAlarme: "ping",
  imagemFundo: "",
  fundoOpacidade: 0.85,
  fonteTitulos: "Sora, system-ui, sans-serif",
  corTitulos: "",
  fonteTexto: "Manrope, system-ui, sans-serif",
  corTexto: "",
  fonteMenu: "Manrope, system-ui, sans-serif",
  corMenu: "",
  corMenuAtivo: "",
  corMenuAtivoTexto: "",
  fonteAbas: "Manrope, system-ui, sans-serif",
  fonteCabecalho: "'Playfair Display', serif",
  corAbas: "",
  corAbaAtiva: "",
  corFundo: "",
  corCard: "",
  corBorda: "",
  corBotao: "",
  corBotaoTexto: "",
  corBotaoSecundario: "",
  corBotaoSecundarioTexto: "",
  corBotaoOutline: "",
  corBotaoOutlineTexto: "",
  corCabecalhoFundo: "",
  corCabecalhoIcone: "",
  corMuted: "",
  fontSizeBase: 16,
  fontSizeTitulos: 20,
  fontSizeTexto: 14,
  fontSizeMenu: 14,
  fontSizeAbas: 14,
  amazonMusicUrl: "",
  sidebarL: undefined,
  sidebarC: undefined,
  sidebarH: undefined,
  sidebarContraste: undefined,
  janelasOpacidade: 1,
  botaoPrimarioOpacidade: 1,
  botaoSecundarioOpacidade: 1,
  botaoOutlineOpacidade: 1,
  corAlertaFundo: "",
  corAlertaTexto: "",
  fontesPorPagina: {},
  spotifyClientId: "",
} as DesignSettings);
/**
 * Campos que NÃO são aparência: pertencem ao negócio/conta e nunca devem ser
 * afetados pelo botão "Restaurar personalização default".
 */
export const DESIGN_PRESERVED_KEYS = [
  "idioma",
  "idiomaAuto",
  "moeda",
  "nomeNegocio",
  "precoHoraBase",
  "pinContas",
] as const;

export type DesignPreservedKey = (typeof DESIGN_PRESERVED_KEYS)[number];

/**
 * Devolve exactamente DESIGN_DEFAULTS, reaplicando por cima os campos
 * preservados (idioma, moeda, nome do negócio, preço-hora e PIN) tal como
 * estavam no design atual.
 */
export function restoreDesignDefaults(atual: Partial<DesignSettings> | null | undefined): DesignSettings {
  const restaurado = { ...DESIGN_DEFAULTS } as Record<string, unknown>;
  for (const k of DESIGN_PRESERVED_KEYS) {
    const v = (atual ?? {})[k];
    if (v !== undefined) restaurado[k] = v;
  }
  return restaurado as DesignSettings;
}
