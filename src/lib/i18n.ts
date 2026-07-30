import { useStore, type Idioma } from "./store";

import ptDict from "@/i18n/pt.json";
import enDict from "@/i18n/en.json";
import esDict from "@/i18n/es.json";
import frDict from "@/i18n/fr.json";
import deDict from "@/i18n/de.json";
import itDict from "@/i18n/it.json";

import enContent from "@/i18n/content/en.json";
import esContent from "@/i18n/content/es.json";
import frContent from "@/i18n/content/fr.json";
import deContent from "@/i18n/content/de.json";
import itContent from "@/i18n/content/it.json";

type Dict = Record<string, string>;

/**
 * Todos os textos vivem em ficheiros de dicionário independentes
 * (src/i18n/<lang>.json para chaves de UI e src/i18n/content/<lang>.json
 * para conteúdo escrito em português dentro dos componentes).
 * Nenhum texto novo deve ser escrito diretamente nos componentes.
 */
const dicts: Record<Idioma, Dict> = {
  pt: ptDict as Dict,
  en: enDict as Dict,
  es: esDict as Dict,
  fr: frDict as Dict,
  de: deDict as Dict,
  it: itDict as Dict,
};

const contentDicts: Record<string, Dict> = {
  en: enContent as Dict,
  es: esContent as Dict,
  fr: frContent as Dict,
  de: deContent as Dict,
  it: itContent as Dict,
};

export const IDIOMAS: { code: Idioma; label: string; flag: string }[] = [
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
];

function interpolate(text: string, vars?: Record<string, string | number>) {
  if (!vars) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (m, k) =>
    vars[k] === undefined ? m : String(vars[k]),
  );
}

/** Traduz uma chave. Fallback: idioma → português → chave. */
export function translate(
  idioma: Idioma,
  key: string,
  vars?: Record<string, string | number>,
) {
  const dict = dicts[idioma] ?? dicts.pt;
  const value = dict[key] ?? dicts.pt[key] ?? key;
  return interpolate(value, vars);
}

export function useT() {
  const idioma = useStore((s) => s.design.idioma);
  return (key: string, vars?: Record<string, string | number>) =>
    translate(idioma, key, vars);
}

/**
 * Traduz conteúdo em português presente nos componentes/BD local.
 * Ordem: dicionário custom do utilizador → dicionário de conteúdo →
 * chave de UI equivalente → texto original em português (fallback).
 */
export function useTT() {
  const idioma = useStore((s) => s.design.idioma);
  const custom = useStore((s) => s.traducoes);
  return (text: string | undefined | null) => {
    if (!text) return text ?? "";
    if (idioma === "pt") return text;
    return (
      custom?.[idioma]?.[text] ??
      contentDicts[idioma]?.[text] ??
      dicts[idioma]?.[text] ??
      text
    );
  };
}

/** Igual a useTT mas também resolve chaves ("nav.dashboard"). */
export function useAutoText() {
  const idioma = useStore((s) => s.design.idioma);
  const tt = useTT();
  return (text: string | undefined | null) => {
    if (!text) return text ?? "";
    const dict = dicts[idioma] ?? dicts.pt;
    if (dict[text] ?? dicts.pt[text]) return dict[text] ?? dicts.pt[text];
    return tt(text);
  };
}

/**
 * Dicionário estático pt→idioma usado pelo tradutor automático de DOM.
 * Junta o dicionário de conteúdo com os pares (valor PT → valor traduzido)
 * das chaves de UI. Se faltar uma entrada, o texto português é mantido.
 */
export function getStaticDict(lang: Idioma): Dict {
  if (lang === "pt") return {};
  const out: Dict = { ...(contentDicts[lang] ?? {}) };
  const target = dicts[lang] ?? {};
  for (const [key, ptValue] of Object.entries(dicts.pt)) {
    const translated = target[key];
    if (translated && ptValue && !out[ptValue]) out[ptValue] = translated;
  }
  return out;
}
