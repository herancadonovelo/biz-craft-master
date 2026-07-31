import type { Idioma } from "@/lib/store";

/**
 * Mapeia o país (nome apresentado no registo ou código ISO-2) para o idioma
 * da aplicação. Usado após a criação de conta para configurar o idioma
 * automaticamente, sem pedir nada ao utilizador.
 */
const BY_COUNTRY: Record<string, Idioma> = {
  // PT
  portugal: "pt", brasil: "pt", brazil: "pt", angola: "pt", moçambique: "pt",
  mocambique: "pt", "cabo verde": "pt", "são tomé e príncipe": "pt",
  "sao tome e principe": "pt", "guiné-bissau": "pt", "guine-bissau": "pt",
  "timor-leste": "pt", pt: "pt", br: "pt", ao: "pt", mz: "pt", cv: "pt",
  // ES
  espanha: "es", spain: "es", méxico: "es", mexico: "es", argentina: "es",
  chile: "es", colômbia: "es", colombia: "es", uruguai: "es", uruguay: "es",
  es: "es", mx: "es", ar: "es", cl: "es", co: "es", uy: "es",
  // FR
  frança: "fr", franca: "fr", france: "fr", bélgica: "fr", belgica: "fr",
  luxemburgo: "fr", fr: "fr", be: "fr", lu: "fr",
  // DE
  alemanha: "de", germany: "de", áustria: "de", austria: "de", suíça: "de",
  suica: "de", switzerland: "de", de: "de", at: "de", ch: "de",
  // IT
  itália: "it", italia: "it", italy: "it", it: "it",
};

export function languageForCountry(country?: string | null): Idioma {
  if (!country) return "en";
  const key = country.trim().toLowerCase();
  return BY_COUNTRY[key] ?? "en";
}

/** Idioma sugerido pelo browser, usado quando não há país conhecido. */
export function languageFromBrowser(): Idioma | null {
  if (typeof navigator === "undefined") return null;
  const tag = (navigator.language || "").slice(0, 2).toLowerCase();
  return (["pt", "en", "es", "fr", "de", "it"] as const).includes(tag as Idioma)
    ? (tag as Idioma)
    : null;
}
